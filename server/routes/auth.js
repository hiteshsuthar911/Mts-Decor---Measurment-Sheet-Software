const router = require('express').Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

// In-memory 2FA pending challenges (expires after 5 minutes)
const pending2FA = new Map();

// Periodic cleanup of expired 2FA codes
setInterval(() => {
  const now = Date.now();
  for (const [key, item] of pending2FA.entries()) {
    if (now > item.expiresAt) {
      pending2FA.delete(key);
    }
  }
}, 60000);

// POST /api/auth/login-init (Step 1 of 2FA Login)
router.post('/login-init', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'USERNAME AND PASSWORD REQUIRED' });
    }

    const user = await User.findOne({ username: username.trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'INVALID USERNAME OR PASSWORD' });
    }

    const valid = await user.comparePassword(password.trim());
    if (!valid) {
      return res.status(401).json({ message: 'INVALID USERNAME OR PASSWORD' });
    }

    // Generate 6-digit numeric verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const challengeId = crypto.randomBytes(24).toString('hex');

    pending2FA.set(challengeId, {
      userId: user._id,
      username: user.username,
      name: user.name,
      role: user.role,
      code,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    });

    console.log(`🔐 [2FA] Verification code for ${user.username}: ${code}`);

    res.json({
      require2FA: true,
      challengeId,
      verificationCode: code, // Provided so UI displays verification prompt
      username: user.username,
      name: user.name,
    });
  } catch (err) {
    console.error('LOGIN INIT ERROR:', err);
    res.status(500).json({ message: 'SERVER ERROR: ' + err.message });
  }
});

// POST /api/auth/verify-2fa (Step 2 of 2FA Login)
router.post('/verify-2fa', async (req, res) => {
  try {
    const { challengeId, code } = req.body;
    if (!challengeId || !code) {
      return res.status(400).json({ message: 'CHALLENGE ID AND 6-DIGIT CODE REQUIRED' });
    }

    const challenge = pending2FA.get(challengeId);
    if (!challenge) {
      return res.status(401).json({ message: 'VERIFICATION SESSION EXPIRED. PLEASE SIGN IN AGAIN.' });
    }

    if (Date.now() > challenge.expiresAt) {
      pending2FA.delete(challengeId);
      return res.status(401).json({ message: 'VERIFICATION CODE EXPIRED. PLEASE SIGN IN AGAIN.' });
    }

    if (challenge.code !== code.toString().trim()) {
      return res.status(400).json({ message: 'INCORRECT 6-DIGIT VERIFICATION CODE' });
    }

    // Code matches: remove challenge and generate JWT token
    pending2FA.delete(challengeId);

    const token = jwt.sign(
      { id: challenge.userId, username: challenge.username, name: challenge.name, role: challenge.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: challenge.userId,
        username: challenge.username,
        name: challenge.name,
        role: challenge.role,
      }
    });
  } catch (err) {
    console.error('2FA VERIFY ERROR:', err);
    res.status(500).json({ message: 'SERVER ERROR: ' + err.message });
  }
});

// POST /api/auth/login (Direct login for backward compatibility)
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
