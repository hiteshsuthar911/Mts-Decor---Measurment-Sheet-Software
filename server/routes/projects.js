const router = require('express').Router();
const mongoose = require('mongoose');
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
    const oldData = existing.data || {};
    const newData = data ? { ...data } : {};

    // Preserve engineerQueries: do not let an autosave that lacks queries erase DB queries
    if (!newData.engineerQueries && oldData.engineerQueries) {
      newData.engineerQueries = oldData.engineerQueries;
    } else if (Array.isArray(oldData.engineerQueries) && Array.isArray(newData.engineerQueries)) {
      // Merge queries if server has ones client hasn't fetched yet
      const clientQueryIds = new Set(newData.engineerQueries.map(q => q.id));
      const missingFromServer = oldData.engineerQueries.filter(q => !clientQueryIds.has(q.id));
      if (missingFromServer.length > 0) {
        newData.engineerQueries = [...newData.engineerQueries, ...missingFromServer];
      }
    }

    // Preserve clientApproval if not present in payload
    if (!newData.clientApproval && oldData.clientApproval) {
      newData.clientApproval = oldData.clientApproval;
    }

    existing.name = newData?.header?.projectName || existing.name || 'UNTITLED PROJECT';
    existing.lastEditedBy = req.user.name;
    existing.lastEditedAt = new Date();
    existing.data = newData;
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

// ── DIGITAL CLIENT SIGN-OFF PORTAL (Public with optional PIN protection) ──

// GET /api/projects/sign-portal/:id
router.get('/sign-portal/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'MEASUREMENT SHEET NOT FOUND OR INVALID LINK' });
    }
    const project = await Project.findById(req.params.id);
    if (!project || project.isDeleted) {
      return res.status(404).json({ message: 'MEASUREMENT SHEET NOT FOUND OR HAS BEEN DELETED' });
    }

    const data = project.data || {};
    const configuredPin = data.signPortalPin ? String(data.signPortalPin).trim() : '';
    const providedPin = String(req.query.pin || req.headers['x-sign-pin'] || '').trim();

    if (configuredPin) {
      if (!providedPin || providedPin !== configuredPin) {
        return res.json({
          requiresPin: true,
          projectName: project.name || data.header?.projectName || 'Measurement Sheet',
          contractorName: data.header?.contractorName || 'MTS DECOR',
          date: data.header?.date || '',
          companySlug: project.companySlug
        });
      }
    }

    res.json({
      requiresPin: false,
      id: project._id,
      projectName: project.name || data.header?.projectName || 'Measurement Sheet',
      companySlug: project.companySlug,
      header: data.header || {},
      areas: data.areas || [],
      settings: data.settings || {},
      clientApproval: data.clientApproval || null
    });
  } catch (err) {
    console.error('Sign portal fetch error:', err);
    res.status(500).json({ message: 'SERVER ERROR' });
  }
});

// POST /api/projects/sign-portal/:id/submit
router.post('/sign-portal/:id/submit', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'INVALID PROJECT IDENTIFIER' });
    }
    const project = await Project.findById(req.params.id);
    if (!project || project.isDeleted) {
      return res.status(404).json({ message: 'PROJECT NOT FOUND' });
    }

    const data = project.data || {};
    const configuredPin = data.signPortalPin ? String(data.signPortalPin).trim() : '';
    const providedPin = String(req.body.pin || req.headers['x-sign-pin'] || '').trim();

    if (configuredPin && (!providedPin || providedPin !== configuredPin)) {
      return res.status(401).json({ message: 'INVALID PASSCODE / PIN' });
    }

    const { signerName, company, designation, approvalDate, notes, signatureDataUrl } = req.body;
    if (!signerName || !signerName.trim()) {
      return res.status(400).json({ message: 'SIGNER NAME IS REQUIRED' });
    }

    const clientApproval = {
      approved: true,
      signerName: signerName.trim(),
      company: (company || '').trim(),
      designation: (designation || 'Client Representative').trim(),
      approvalDate: approvalDate || new Date().toISOString().split('T')[0],
      signedAt: new Date().toISOString(),
      notes: (notes || '').trim(),
      signatureDataUrl: signatureDataUrl || null,
      verificationSource: 'DIGITAL_PORTAL',
      ip: req.ip || req.headers['x-forwarded-for'] || '',
      userAgent: req.headers['user-agent'] || ''
    };

    project.data = {
      ...data,
      clientApproval
    };
    project.lastEditedAt = new Date();
    project.lastEditedBy = `${signerName} (Client Digital Sign-Off)`;
    await project.save();

    res.json({
      success: true,
      message: 'MEASUREMENT SHEET APPROVED & SEALED',
      clientApproval
    });
    triggerAutoBackup();
  } catch (err) {
    console.error('Sign portal submit error:', err);
    res.status(500).json({ message: 'SERVER ERROR' });
  }
});

// GET /api/projects/engineer-portal/:id — Site Engineer review data
router.get('/engineer-portal/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'MEASUREMENT SHEET NOT FOUND OR INVALID LINK' });
    }
    const project = await Project.findById(req.params.id);
    if (!project || project.isDeleted) {
      return res.status(404).json({ message: 'MEASUREMENT SHEET NOT FOUND OR HAS BEEN DELETED' });
    }

    const data = project.data || {};
    res.json({
      id: project._id,
      projectName: project.name || data.header?.projectName || 'Measurement Sheet',
      companySlug: project.companySlug,
      header: data.header || {},
      areas: data.areas || [],
      settings: data.settings || {},
      clientApproval: data.clientApproval || null,
      engineerQueries: data.engineerQueries || []
    });
  } catch (err) {
    console.error('Engineer portal fetch error:', err);
    res.status(500).json({ message: 'SERVER ERROR' });
  }
});

// POST /api/projects/engineer-portal/:id/query — Submit proposed site measurement changes
router.post('/engineer-portal/:id/query', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'MEASUREMENT SHEET NOT FOUND' });
    }
    const project = await Project.findById(req.params.id);
    if (!project || project.isDeleted) {
      return res.status(404).json({ message: 'PROJECT NOT FOUND' });
    }

    const { engineerName, engineerRole, phone, overallNote, changes } = req.body;
    if (!engineerName || !engineerName.trim()) {
      return res.status(400).json({ message: 'ENGINEER NAME IS REQUIRED' });
    }
    if (!Array.isArray(changes) || changes.length === 0) {
      return res.status(400).json({ message: 'AT LEAST 1 PROPOSED CHANGE OR QUERY IS REQUIRED' });
    }

    const queryObj = {
      id: `query-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      engineerName: engineerName.trim(),
      engineerRole: (engineerRole || 'Site Engineer').trim(),
      phone: (phone || '').trim(),
      overallNote: (overallNote || '').trim(),
      submittedAt: new Date().toISOString(),
      status: 'PENDING',
      changes: changes.map(c => ({
        areaId: c.areaId,
        areaLabel: c.areaLabel || '',
        itemId: c.itemId,
        itemRemark: c.itemRemark || '',
        original: c.original || {},
        proposed: c.proposed || {},
        reason: c.reason || '',
        status: 'PENDING'
      }))
    };

    const data = project.data || {};
    const existingQueries = Array.isArray(data.engineerQueries) ? data.engineerQueries : [];

    project.data = {
      ...data,
      engineerQueries: [queryObj, ...existingQueries]
    };
    project.lastEditedAt = new Date();
    project.lastEditedBy = `${engineerName} (Site Engineer Query)`;
    await project.save();

    res.json({
      success: true,
      message: 'SITE QUERY SUBMITTED TO MEASUREMENT PORTAL',
      query: queryObj
    });
    triggerAutoBackup();
  } catch (err) {
    console.error('Engineer query submit error:', err);
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
