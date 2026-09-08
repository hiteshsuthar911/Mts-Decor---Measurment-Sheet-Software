const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const PdfFile = require('../models/PdfFile');

// Helper to check access rights
function canUserAccessFile(user, file) {
  if (user.role === 'ADMIN') return true;
  const userSlug = user.companySlug || 'mts-decor';
  const fileSlug = file.companySlug || 'mts-decor';
  if (fileSlug === userSlug) return true;
  if (user.companyId && file.companyId && String(user.companyId) === String(file.companyId)) return true;
  return false;
}

// GET /api/pdf-files — list all saved PDF files (partitioned by company)
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

    const files = await PdfFile.find(filter)
      .select('-fileBase64')
      .sort({ createdAt: -1 });
    res.json(files);
  } catch (err) {
    console.error('GET PDF FILES ERROR:', err);
    res.status(500).json({ message: 'FAILED TO FETCH PDF FILES' });
  }
});

// GET /api/pdf-files/:id — get single PDF file including base64
router.get('/:id', auth, async (req, res) => {
  try {
    const file = await PdfFile.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'PDF FILE NOT FOUND' });

    if (!canUserAccessFile(req.user, file)) {
      return res.status(403).json({ message: 'FORBIDDEN: CANNOT ACCESS FILE FROM ANOTHER COMPANY' });
    }

    res.json(file);
  } catch (err) {
    console.error('GET SINGLE PDF FILE ERROR:', err);
    res.status(500).json({ message: 'SERVER ERROR' });
  }
});

// POST /api/pdf-files — save a new PDF file
router.post('/', auth, async (req, res) => {
  try {
    const {
      projectId,
      projectName,
      fileName,
      fileBase64,
      pageCount,
      fileSize,
      billingMode,
      metadata,
    } = req.body;

    if (!fileName || !fileBase64) {
      return res.status(400).json({ message: 'FILENAME AND PDF DATA ARE REQUIRED' });
    }

    const newFile = await PdfFile.create({
      projectId: projectId || null,
      projectName: projectName || 'MEASUREMENT SHEET',
      fileName,
      fileBase64,
      pageCount: Number(pageCount) || 1,
      fileSize: fileSize || Math.round((fileBase64.length * 3) / 4),
      companyId: req.user.companyId || null,
      companySlug: req.user.companySlug || 'mts-decor',
      ownerUsername: req.user.username,
      ownerName: req.user.name,
      billingMode: Boolean(billingMode),
      metadata: metadata || {},
    });

    res.status(201).json(newFile);
  } catch (err) {
    console.error('SAVE PDF FILE ERROR:', err);
    res.status(500).json({ message: 'FAILED TO SAVE PDF FILE' });
  }
});

// DELETE /api/pdf-files/:id — delete a saved PDF file
router.delete('/:id', auth, async (req, res) => {
  try {
    const file = await PdfFile.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'PDF FILE NOT FOUND' });

    if (!canUserAccessFile(req.user, file)) {
      return res.status(403).json({ message: 'FORBIDDEN: CANNOT ACCESS FILE FROM ANOTHER COMPANY' });
    }

    if (file.ownerUsername !== req.user.username && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'FORBIDDEN: ONLY OWNER OR ADMIN CAN DELETE' });
    }

    await file.deleteOne();
    res.json({ message: 'PDF FILE DELETED' });
  } catch (err) {
    console.error('DELETE PDF FILE ERROR:', err);
    res.status(500).json({ message: 'SERVER ERROR' });
  }
});

// GET /api/pdf-files/:id/download — direct binary download endpoint
router.get('/:id/download', auth, async (req, res) => {
  try {
    const file = await PdfFile.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'PDF FILE NOT FOUND' });

    if (!canUserAccessFile(req.user, file)) {
      return res.status(403).json({ message: 'FORBIDDEN: CANNOT ACCESS FILE FROM ANOTHER COMPANY' });
    }

    // Clean base64 data url if present
    const cleanBase64 = file.fileBase64.replace(/^data:application\/pdf;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.fileName)}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (err) {
    console.error('DOWNLOAD PDF FILE ERROR:', err);
    res.status(500).json({ message: 'SERVER ERROR' });
  }
});

module.exports = router;
