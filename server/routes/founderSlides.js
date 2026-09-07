const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const FounderSlide = require('../models/FounderSlide');

// GET /api/founder-slides (Public — used on Login page)
router.get('/', async (req, res) => {
  try {
    const slides = await FounderSlide.find({}).sort({ order: 1, createdAt: 1 });
    res.json(slides);
  } catch (err) {
    res.status(500).json({ message: 'SERVER ERROR' });
  }
});

// POST /api/founder-slides (Admin only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'FORBIDDEN: ADMIN ONLY' });
    }
    const { name, role, company, quote, imageUrl, order } = req.body;
    if (!name || !quote || !imageUrl) {
      return res.status(400).json({ message: 'NAME, QUOTE, AND PHOTO ARE REQUIRED' });
    }

    const slide = await FounderSlide.create({
      name,
      role: role || 'FOUNDER',
      company: company || 'MTS DECOR',
      quote,
      imageUrl,
      order: order || 0
    });

    res.status(201).json(slide);
  } catch (err) {
    res.status(500).json({ message: 'SERVER ERROR: ' + err.message });
  }
});

// PUT /api/founder-slides/:id (Admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'FORBIDDEN: ADMIN ONLY' });
    }
    const { name, role, company, quote, imageUrl, order } = req.body;
    const slide = await FounderSlide.findByIdAndUpdate(
      req.params.id,
      { name, role, company, quote, imageUrl, order },
      { returnDocument: 'after' }
    );
    if (!slide) return res.status(404).json({ message: 'SLIDE NOT FOUND' });
    res.json(slide);
  } catch (err) {
    res.status(500).json({ message: 'SERVER ERROR: ' + err.message });
  }
});

// DELETE /api/founder-slides/:id (Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'FORBIDDEN: ADMIN ONLY' });
    }
    const slide = await FounderSlide.findByIdAndDelete(req.params.id);
    if (!slide) return res.status(404).json({ message: 'SLIDE NOT FOUND' });
    res.json({ message: 'SLIDE DELETED' });
  } catch (err) {
    res.status(500).json({ message: 'SERVER ERROR' });
  }
});

module.exports = router;
