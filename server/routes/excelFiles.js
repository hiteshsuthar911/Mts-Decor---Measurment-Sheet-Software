const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const ExcelFile = require('../models/ExcelFile');

// GET /api/excel-files — list all saved excel files (excluding heavy base64 for fast loading)
router.get('/', auth, async (req, res) => {
  try {
    const files = await ExcelFile.find({})
      .select('-fileBase64')
      .sort({ createdAt: -1 });
    res.json(files);
  } catch (err) {
    console.error('GET EXCEL FILES ERROR:', err);
    res.status(500).json({ message: 'FAILED TO FETCH EXCEL FILES' });
  }
});

// GET /api/excel-files/:id — get full excel file data (including base64 and sheets)
router.get('/:id', auth, async (req, res) => {
  try {
    const file = await ExcelFile.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'EXCEL FILE NOT FOUND' });
    res.json(file);
  } catch (err) {
    console.error('GET SINGLE EXCEL FILE ERROR:', err);
    res.status(500).json({ message: 'SERVER ERROR' });
  }
});

// POST /api/excel-files — save a new excel file
router.post('/', auth, async (req, res) => {
  try {
    const {
      projectId,
      projectName,
      fileName,
      fileBase64,
      sheetsData,
      fileSize,
      billingMode,
      metadata,
    } = req.body;

    if (!fileName || !fileBase64) {
      return res.status(400).json({ message: 'FILENAME AND EXCEL DATA ARE REQUIRED' });
    }

    const newFile = await ExcelFile.create({
      projectId: projectId || null,
      projectName: projectName || 'MEASUREMENT SHEET',
      fileName,
      fileBase64,
      sheetsData: Array.isArray(sheetsData) ? sheetsData : [],
      fileSize: fileSize || Math.round((fileBase64.length * 3) / 4),
      ownerUsername: req.user.username,
      ownerName: req.user.name,
      billingMode: Boolean(billingMode),
      metadata: metadata || {},
    });

    res.status(201).json(newFile);
  } catch (err) {
    console.error('SAVE EXCEL FILE ERROR:', err);
    res.status(500).json({ message: 'FAILED TO SAVE EXCEL FILE' });
  }
});

// DELETE /api/excel-files/:id — delete a saved excel file
router.delete('/:id', auth, async (req, res) => {
  try {
    const file = await ExcelFile.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'EXCEL FILE NOT FOUND' });

    if (file.ownerUsername !== req.user.username && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'FORBIDDEN: ONLY OWNER OR ADMIN CAN DELETE' });
    }

    await file.deleteOne();
    res.json({ message: 'EXCEL FILE DELETED' });
  } catch (err) {
    console.error('DELETE EXCEL FILE ERROR:', err);
    res.status(500).json({ message: 'SERVER ERROR' });
  }
});

// GET /api/excel-files/:id/download — direct binary download endpoint
router.get('/:id/download', auth, async (req, res) => {
  try {
    const file = await ExcelFile.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'EXCEL FILE NOT FOUND' });

    const buffer = Buffer.from(file.fileBase64, 'base64');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.fileName)}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (err) {
    console.error('DOWNLOAD EXCEL FILE ERROR:', err);
    res.status(500).json({ message: 'SERVER ERROR' });
  }
});

module.exports = router;
