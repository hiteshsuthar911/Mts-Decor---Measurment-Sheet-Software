const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: 'USERNAME AND PASSWORD REQUIRED' });

    const user = await User.findOne({ username: username.trim().toLowerCase() });
    if (!user)
      return res.status(401).json({ message: 'INVALID USERNAME OR PASSWORD' });

    const valid = await user.comparePassword(password.trim());
    if (!valid)
      return res.status(401).json({ message: 'INVALID USERNAME OR PASSWORD' });

    const token = jwt.sign(
      { id: user._id, username: user.username, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user._id, username: user.username, name: user.name, role: user.role }
    });
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    res.status(500).json({ message: 'SERVER ERROR' });
  }
});

// POST /api/auth/verify-password (for edit guard)
router.post('/verify-password', require('../middleware/authMiddleware'), async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'USER NOT FOUND' });
    const valid = await user.comparePassword(password.trim());
    res.json({ valid });
  } catch (err) {
    res.status(500).json({ message: 'SERVER ERROR' });
  }
});

module.exports = router;
