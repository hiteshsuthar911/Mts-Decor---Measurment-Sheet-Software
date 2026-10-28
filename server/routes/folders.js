const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const Folder = require('../models/Folder');
const Project = require('../models/Project');
const ExcelFile = require('../models/ExcelFile');
const PdfFile = require('../models/PdfFile');

// Helper to build company/user filter
function buildCompanyFilter(user, query = {}) {
  let filter = {};
  if (user.role === 'ADMIN') {
    if (query.companySlug) {
      filter.companySlug = query.companySlug;
    } else if (query.companyId) {
      filter.companyId = query.companyId;
    }
  } else {
    const slug = user.companySlug || 'mts-decor';
    filter = {
      $or: [
        { companySlug: slug },
        { companyId: user.companyId },
        ...(slug === 'mts-decor' ? [{ companySlug: { $exists: false } }, { companySlug: null }] : []),
      ]
    };
  }
  return filter;
}

function canUserAccessFolder(user, folder) {
  if (user.role === 'ADMIN') return true;
  const userSlug = user.companySlug || 'mts-decor';
  const folderSlug = folder.companySlug || 'mts-decor';
  if (folderSlug === userSlug) return true;
  if (user.companyId && folder.companyId && String(user.companyId) === String(folder.companyId)) return true;
  return false;
}

// GET /api/folders — list all active folders with aggregated counts and stats
router.get('/', auth, async (req, res) => {
  try {
    const baseFilter = buildCompanyFilter(req.user, req.query);
    const filter = {
      ...baseFilter,
      isDeleted: { $ne: true }
    };

    const folders = await Folder.find(filter).sort({ updatedAt: -1 }).lean();

    if (!folders.length) {
      return res.json([]);
    }

    const folderIds = folders.map(f => f._id);

    // Aggregate project counts and total amounts per folder
    const projectStats = await Project.aggregate([
      {
        $match: {
          folderId: { $in: folderIds },
          isDeleted: { $ne: true }
        }
      },
      {
        $group: {
          _id: '$folderId',
          count: { $sum: 1 },
          totalAmount: { $sum: { $ifNull: ['$totalAmount', 0] } }
        }
      }
    ]);

    const excelStats = await ExcelFile.aggregate([
      { $match: { folderId: { $in: folderIds } } },
      { $group: { _id: '$folderId', count: { $sum: 1 } } }
    ]);

    const pdfStats = await PdfFile.aggregate([
      { $match: { folderId: { $in: folderIds } } },
      { $group: { _id: '$folderId', count: { $sum: 1 } } }
    ]);

    const projectMap = {};
    projectStats.forEach(s => { projectMap[String(s._id)] = s; });

    const excelMap = {};
    excelStats.forEach(s => { excelMap[String(s._id)] = s.count; });

    const pdfMap = {};
    pdfStats.forEach(s => { pdfMap[String(s._id)] = s.count; });

    const enriched = folders.map(f => {
      const p = projectMap[String(f._id)] || { count: 0, totalAmount: 0 };
      return {
        ...f,
        projectsCount: p.count,
        totalAmount: p.totalAmount,
        excelCount: excelMap[String(f._id)] || 0,
        pdfCount: pdfMap[String(f._id)] || 0,
        totalFilesCount: p.count + (excelMap[String(f._id)] || 0) + (pdfMap[String(f._id)] || 0)
      };
    });

    res.json(enriched);
  } catch (err) {
    console.error('GET FOLDERS ERROR:', err);
    res.status(500).json({ message: 'SERVER ERROR FETCHING FOLDERS' });
  }
});

// GET /api/folders/:id — single folder details
router.get('/:id', auth, async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);
    if (!folder || folder.isDeleted) {
      return res.status(404).json({ message: 'FOLDER NOT FOUND' });
    }
    if (!canUserAccessFolder(req.user, folder)) {
      return res.status(403).json({ message: 'FORBIDDEN' });
    }
    res.json(folder);
  } catch (err) {
    res.status(500).json({ message: 'SERVER ERROR' });
  }
});

// POST /api/folders — create a new folder
router.post('/', auth, async (req, res) => {
  try {
    const { name, clientName, location, description, color } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'FOLDER NAME IS REQUIRED' });
    }

    const folder = await Folder.create({
      name: name.trim(),
      clientName: (clientName || '').trim(),
      location: (location || '').trim(),
      description: (description || '').trim(),
      color: color || '#2563eb',
      ownerUsername: req.user.username,
      ownerName: req.user.name,
      companyId: req.user.companyId || null,
      companySlug: req.user.companySlug || 'mts-decor',
      isDeleted: false
    });

    res.status(201).json(folder);
  } catch (err) {
    console.error('CREATE FOLDER ERROR:', err);
    res.status(500).json({ message: 'SERVER ERROR' });
  }
});

// PUT /api/folders/:id — update folder
router.put('/:id', auth, async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);
    if (!folder || folder.isDeleted) {
      return res.status(404).json({ message: 'FOLDER NOT FOUND' });
    }
    if (!canUserAccessFolder(req.user, folder)) {
      return res.status(403).json({ message: 'FORBIDDEN' });
    }

    const { name, clientName, location, description, color } = req.body;
    const oldName = folder.name;

    if (name && name.trim()) folder.name = name.trim();
    if (clientName !== undefined) folder.clientName = clientName.trim();
    if (location !== undefined) folder.location = location.trim();
    if (description !== undefined) folder.description = description.trim();
    if (color !== undefined) folder.color = color;

    await folder.save();

    // If folder name changed, cascade update folderName on child records
    if (name && name.trim() !== oldName) {
      await Promise.all([
        Project.updateMany({ folderId: folder._id }, { folderName: folder.name }),
        ExcelFile.updateMany({ folderId: folder._id }, { folderName: folder.name }),
        PdfFile.updateMany({ folderId: folder._id }, { folderName: folder.name })
      ]);
    }

    res.json(folder);
  } catch (err) {
    console.error('UPDATE FOLDER ERROR:', err);
    res.status(500).json({ message: 'SERVER ERROR' });
  }
});

// DELETE /api/folders/:id — soft delete folder (unlinks contents so no files are lost)
router.delete('/:id', auth, async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);
    if (!folder) return res.status(404).json({ message: 'FOLDER NOT FOUND' });
    if (!canUserAccessFolder(req.user, folder)) {
      return res.status(403).json({ message: 'FORBIDDEN' });
    }

    // Safely unassign all child items back to root/unassigned
    await Promise.all([
      Project.updateMany({ folderId: folder._id }, { folderId: null, folderName: '' }),
      ExcelFile.updateMany({ folderId: folder._id }, { folderId: null, folderName: '' }),
      PdfFile.updateMany({ folderId: folder._id }, { folderId: null, folderName: '' })
    ]);

    folder.isDeleted = true;
    folder.deletedAt = new Date();
    folder.deletedBy = req.user.name;
    await folder.save();

    res.json({ message: 'FOLDER DELETED (FILES UNLINKED SAFELY)' });
  } catch (err) {
    console.error('DELETE FOLDER ERROR:', err);
    res.status(500).json({ message: 'SERVER ERROR' });
  }
});

module.exports = router;
