const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const Project = require('../models/Project');
const { triggerAutoBackup } = require('../utils/googleDrive');

// GET /api/projects — all projects (partitioned by company for normal users)
router.get('/', auth, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'ADMIN') {
      if (req.query.companySlug) {
        filter.companySlug = req.query.companySlug;
      } else if (req.query.companyId) {
        filter.companyId = req.query.companyId;
      }
    } else {
      const slug = req.user.companySlug || 'mts-decor';
      filter = {
        $or: [
          { companySlug: slug },
          { companyId: req.user.companyId },
          ...(slug === 'mts-decor' ? [{ companySlug: { $exists: false } }, { companySlug: null }] : []),
        ]
      };
    }

    const projects = await Project.find(filter)
      .select('-data') // Don't send full data in list (performance)
      .sort({ updatedAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: 'SERVER ERROR' });
  }
});

// GET /api/projects/:id — single project with full data
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'PROJECT NOT FOUND' });
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
    const { data } = req.body;
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      {
        name: data?.header?.projectName || 'UNTITLED PROJECT',
        lastEditedBy: req.user.name,
        lastEditedAt: new Date(),
        data,
      },
      { returnDocument: 'after' }
    );
    if (!project) return res.status(404).json({ message: 'PROJECT NOT FOUND' });
    res.json(project);
    triggerAutoBackup();
  } catch (err) {
    res.status(500).json({ message: 'SERVER ERROR' });
  }
});

// DELETE /api/projects/:id — only owner can delete
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'PROJECT NOT FOUND' });
    if (project.ownerUsername !== req.user.username && req.user.role !== 'ADMIN')
      return res.status(403).json({ message: 'FORBIDDEN: ONLY OWNER OR ADMIN CAN DELETE' });
    await project.deleteOne();
    res.json({ message: 'PROJECT DELETED' });
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
      { $group: { _id: '$ownerUsername', count: { $sum: 1 }, projects: { $push: { name: '$name', id: '$_id', lastEditedAt: '$lastEditedAt' } } } }
    ]);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: 'SERVER ERROR' });
  }
});

module.exports = router;
