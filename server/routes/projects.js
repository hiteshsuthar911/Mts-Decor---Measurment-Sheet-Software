const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const Project = require('../models/Project');
const { triggerAutoBackup } = require('../utils/googleDrive');

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

// Helper to verify if user can access a project
function canUserAccessProject(user, project) {
  if (user.role === 'ADMIN') return true;
  const userSlug = user.companySlug || 'mts-decor';
  const projSlug = project.companySlug || 'mts-decor';
  if (projSlug === userSlug) return true;
  if (user.companyId && project.companyId && String(user.companyId) === String(project.companyId)) return true;
  return false;
}

// GET /api/projects — all active projects (excluding soft-deleted)
router.get('/', auth, async (req, res) => {
  try {
    const baseFilter = buildCompanyFilter(req.user, req.query);
    const filter = {
      ...baseFilter,
      isDeleted: { $ne: true },
    };

    const projects = await Project.find(filter)
      .select('-data') // Don't send full data in list (performance)
      .sort({ updatedAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: 'SERVER ERROR' });
  }
});

// GET /api/projects/deleted — all soft-deleted projects
router.get('/deleted', auth, async (req, res) => {
  try {
    const baseFilter = buildCompanyFilter(req.user, req.query);
    const filter = {
      ...baseFilter,
      isDeleted: true,
    };

    const projects = await Project.find(filter)
      .select('-data')
      .sort({ deletedAt: -1, updatedAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: 'SERVER ERROR' });
  }
});

// DELETE /api/projects/deleted/empty — permanently purge all deleted projects
router.delete('/deleted/empty', auth, async (req, res) => {
  try {
    let filter = { isDeleted: true };
    if (req.user.role !== 'ADMIN') {
      filter.ownerUsername = req.user.username;
    }
    const result = await Project.deleteMany(filter);
    res.json({ message: 'TRASH EMPTIED', deletedCount: result.deletedCount });
    triggerAutoBackup();
  } catch (err) {
    res.status(500).json({ message: 'SERVER ERROR' });
  }
});

// GET /api/projects/:id — single project with full data
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'PROJECT NOT FOUND' });
    if (!canUserAccessProject(req.user, project)) {
      return res.status(403).json({ message: 'FORBIDDEN: CANNOT ACCESS PROJECT FROM ANOTHER COMPANY' });
    }
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'SERVER ERROR' });
  }
});

// POST /api/projects — create new project
router.post('/', auth, async (req, res) => {
  try {
    const { data } = req.body;
    const project = await Project.create({
      name: data?.header?.projectName || 'NEW PROJECT',
      ownerUsername: req.user.username,
      ownerName: req.user.name,
      companyId: req.user.companyId || null,
      companySlug: req.user.companySlug || 'mts-decor',
      lastEditedBy: req.user.name,
      lastEditedAt: new Date(),
      data: data || {},
      isDeleted: false,
    });
    res.status(201).json(project);
    triggerAutoBackup();
  } catch (err) {
    console.error('CREATE PROJECT ERROR:', err);
    res.status(500).json({ message: 'SERVER ERROR' });
  }
});

// PUT /api/projects/:id — update project data
router.put('/:id', auth, async (req, res) => {
  try {
    const existing = await Project.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'PROJECT NOT FOUND' });
    if (!canUserAccessProject(req.user, existing)) {
      return res.status(403).json({ message: 'FORBIDDEN: CANNOT ACCESS PROJECT FROM ANOTHER COMPANY' });
    }

    const { data } = req.body;
    existing.name = data?.header?.projectName || 'UNTITLED PROJECT';
    existing.lastEditedBy = req.user.name;
    existing.lastEditedAt = new Date();
    existing.data = data;
    await existing.save();

    res.json(existing);
    triggerAutoBackup();
  } catch (err) {
    res.status(500).json({ message: 'SERVER ERROR' });
  }
});

// POST /api/projects/:id/duplicate — duplicate an existing project
router.post('/:id/duplicate', auth, async (req, res) => {
  try {
    const original = await Project.findById(req.params.id);
    if (!original) return res.status(404).json({ message: 'PROJECT NOT FOUND' });
    if (!canUserAccessProject(req.user, original)) {
      return res.status(403).json({ message: 'FORBIDDEN: CANNOT ACCESS PROJECT FROM ANOTHER COMPANY' });
    }

    // Deep clone original data
    const clonedData = original.data ? JSON.parse(JSON.stringify(original.data)) : {};

    // Suffix name with (COPY)
    const origName = (original.name || clonedData?.header?.projectName || 'UNTITLED PROJECT').trim();
    const newName = `${origName} (COPY)`;

    if (clonedData.header) {
      clonedData.header.projectName = newName;
    }

    const duplicate = await Project.create({
      name: newName,
      ownerUsername: req.user.username,
      ownerName: req.user.name,
      companyId: req.user.companyId || original.companyId || null,
      companySlug: req.user.companySlug || original.companySlug || 'mts-decor',
      lastEditedBy: req.user.name,
      lastEditedAt: new Date(),
      data: clonedData,
      isDeleted: false,
    });

    res.status(201).json(duplicate);
    triggerAutoBackup();
  } catch (err) {
    console.error('DUPLICATE PROJECT ERROR:', err);
    res.status(500).json({ message: 'SERVER ERROR' });
  }
});

// POST /api/projects/:id/restore — restore soft-deleted project
router.post('/:id/restore', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'PROJECT NOT FOUND' });
    if (!canUserAccessProject(req.user, project)) {
      return res.status(403).json({ message: 'FORBIDDEN: CANNOT ACCESS PROJECT FROM ANOTHER COMPANY' });
    }
    if (project.ownerUsername !== req.user.username && req.user.role !== 'ADMIN')
      return res.status(403).json({ message: 'FORBIDDEN: ONLY OWNER OR ADMIN CAN RESTORE' });

    project.isDeleted = false;
    project.deletedAt = null;
    project.deletedBy = null;
    await project.save();

    res.json({ message: 'PROJECT RESTORED', project });
    triggerAutoBackup();
  } catch (err) {
    res.status(500).json({ message: 'SERVER ERROR' });
  }
});

// DELETE /api/projects/:id/permanent — permanently delete project
router.delete('/:id/permanent', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'PROJECT NOT FOUND' });
    if (!canUserAccessProject(req.user, project)) {
      return res.status(403).json({ message: 'FORBIDDEN: CANNOT ACCESS PROJECT FROM ANOTHER COMPANY' });
    }
    if (project.ownerUsername !== req.user.username && req.user.role !== 'ADMIN')
      return res.status(403).json({ message: 'FORBIDDEN: ONLY OWNER OR ADMIN CAN DELETE' });

    await project.deleteOne();
    res.json({ message: 'PROJECT PERMANENTLY DELETED' });
    triggerAutoBackup();
  } catch (err) {
    res.status(500).json({ message: 'SERVER ERROR' });
  }
});

// DELETE /api/projects/:id — soft delete (move to trash)
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'PROJECT NOT FOUND' });
    if (!canUserAccessProject(req.user, project)) {
      return res.status(403).json({ message: 'FORBIDDEN: CANNOT ACCESS PROJECT FROM ANOTHER COMPANY' });
    }
    if (project.ownerUsername !== req.user.username && req.user.role !== 'ADMIN')
      return res.status(403).json({ message: 'FORBIDDEN: ONLY OWNER OR ADMIN CAN DELETE' });

    project.isDeleted = true;
    project.deletedAt = new Date();
    project.deletedBy = req.user.name;
    await project.save();

    res.json({ message: 'PROJECT MOVED TO RECENTLY DELETED' });
    triggerAutoBackup();
  } catch (err) {
    res.status(500).json({ message: 'SERVER ERROR' });
  }
});

// GET /api/projects/stats/all — admin only
router.get('/stats/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN')
      return res.status(403).json({ message: 'ADMIN ONLY' });
    const stats = await Project.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $group: { _id: '$ownerUsername', count: { $sum: 1 }, projects: { $push: { name: '$name', id: '$_id', lastEditedAt: '$lastEditedAt' } } } }
    ]);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: 'SERVER ERROR' });
  }
});

module.exports = router;
