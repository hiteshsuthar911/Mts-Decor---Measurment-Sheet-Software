const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const CivilLabourRate = require('../models/CivilLabourRate');

// GET /api/labour-rates — Fetch active civil labour rates
router.get('/', async (req, res) => {
  try {
    const companySlug = req.query.companySlug || 'mts-decor';
    let doc = await CivilLabourRate.findOne({ companySlug });
    if (!doc) {
      // Return empty or signal client to use defaults
      return res.json({ rates: [], isDefault: true });
    }
    res.json({
      title: doc.title,
      date: doc.date,
      rates: doc.rates,
      referenceImages: doc.referenceImages || [
        '/civil-rates/civil_labour_rates_page_1.png',
        '/civil-rates/civil_labour_rates_page_2.png'
      ],
      updatedAt: doc.updatedAt,
      updatedBy: doc.updatedBy
    });
  } catch (err) {
    console.error('GET /api/labour-rates error:', err);
    res.status(500).json({ message: 'SERVER ERROR' });
  }
});

// POST /api/labour-rates — Save updated civil labour rates (Admin & Authenticated users)
router.post('/', auth, async (req, res) => {
  try {
    const companySlug = req.body.companySlug || req.user.companySlug || 'mts-decor';
    const { rates, title, date, referenceImages } = req.body;

    if (!Array.isArray(rates)) {
      return res.status(400).json({ message: 'RATES MUST BE AN ARRAY' });
    }

    let doc = await CivilLabourRate.findOne({ companySlug });
    if (!doc) {
      doc = new CivilLabourRate({
        companySlug,
        title: title || 'CIVIL WORK ONLY LABOUR RATES',
        date: date || '23/03/2026',
        rates,
        referenceImages: referenceImages || [
          '/civil-rates/civil_labour_rates_page_1.png',
          '/civil-rates/civil_labour_rates_page_2.png'
        ],
        updatedBy: req.user.name || 'Admin',
      });
    } else {
      doc.rates = rates;
      if (title) doc.title = title;
      if (date) doc.date = date;
      if (referenceImages) doc.referenceImages = referenceImages;
      doc.updatedBy = req.user.name || 'Admin';
      doc.updatedAt = new Date();
    }

    await doc.save();
    res.json({ 
      success: true, 
      message: 'CIVIL LABOUR RATES SAVED SUCCESSFULLY',
      count: doc.rates.length 
    });
  } catch (err) {
    console.error('POST /api/labour-rates error:', err);
    res.status(500).json({ message: 'SERVER ERROR SAVING LABOUR RATES' });
  }
});

// POST /api/labour-rates/reset — Reset to default rates
router.post('/reset', auth, async (req, res) => {
  try {
    const companySlug = req.body.companySlug || req.user.companySlug || 'mts-decor';
    await CivilLabourRate.deleteOne({ companySlug });
    res.json({ success: true, message: 'RESET TO DEFAULT CIVIL LABOUR RATES' });
  } catch (err) {
    console.error('POST /api/labour-rates/reset error:', err);
    res.status(500).json({ message: 'SERVER ERROR' });
  }
});

module.exports = router;
