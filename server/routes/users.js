const router = require('express').Router();
const bcrypt = require('bcryptjs');
const auth = require('../middleware/authMiddleware');
const User = require('../models/User');
const logger = require('../utils/logger');

// Middleware: Admin only check
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'ADMIN') {
    logger.logSuspiciousTraffic('UNAUTHORIZED_ADMIN_ACCESS_ATTEMPT', `User: "${req.user?.username || 'UNKNOWN'}" tried accessing admin endpoint`, req);
    return res.status(403).json({ message: 'FORBIDDEN: ADMIN ACCESS REQUIRED' });
  }
  next();
};

// GET /api/users (List all users)
router.get('/', auth, requireAdmin, async (req, res, next) => {
  try {
    const users = await User.find({}, 'username name role createdAt updatedAt').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    next(err);
  }
});

// POST /api/users (Create new user)
router.post('/', auth, requireAdmin, async (req, res, next) => {
  try {
    const { username, name, password, role } = req.body;
    if (!username || !password || !name) {
      return res.status(400).json({ message: 'USERNAME, NAME, AND PASSWORD ARE REQUIRED' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const existing = await User.findOne({ username: cleanUsername });
    if (existing) {
      return res.status(400).json({ message: 'USERNAME ALREADY EXISTS' });
    }

    const hashedPassword = await bcrypt.hash(password.trim(), 10);
    const newUser = await User.create({
      username: cleanUsername,
      name: name.trim().toUpperCase(),
      password: hashedPassword,
      role: role === 'ADMIN' ? 'ADMIN' : 'USER',
    });

    logger.logAdminAction(req.user.username, 'CREATE_USER', `Created user: "${newUser.username}" (${newUser.role})`, req);

    res.status(201).json({
      _id: newUser._id,
      username: newUser.username,
      name: newUser.name,
      role: newUser.role,
      createdAt: newUser.createdAt,
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/:id/password (Update / Reset password)
router.put('/:id/password', auth, requireAdmin, async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password || password.trim().length < 4) {
      return res.status(400).json({ message: 'PASSWORD MUST BE AT LEAST 4 CHARACTERS' });
    }

    const hashedPassword = await bcrypt.hash(password.trim(), 10);
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { password: hashedPassword },
      { returnDocument: 'after' }
    );

    if (!user) {
      return res.status(404).json({ message: 'USER NOT FOUND' });
    }

    logger.logAdminAction(req.user.username, 'RESET_PASSWORD', `Updated password for: "${user.username}"`, req);

    res.json({ message: 'PASSWORD UPDATED SUCCESSFULLY', username: user.username });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/users/:id (Delete a user)
router.delete('/:id', auth, requireAdmin, async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'CANNOT DELETE CURRENTLY LOGGED IN ADMIN ACCOUNT' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'USER NOT FOUND' });
    }

    logger.logAdminAction(req.user.username, 'DELETE_USER', `Deleted user: "${user.username}" (ID: ${user._id})`, req);

    res.json({ message: 'USER DELETED SUCCESSFULLY' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
