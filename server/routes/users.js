const router = require('express').Router();
const bcrypt = require('bcryptjs');
const auth = require('../middleware/authMiddleware');
const User = require('../models/User');
const Project = require('../models/Project');
const logger = require('../utils/logger');

// Middleware: Admin only check
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'ADMIN') {
    logger.logSuspiciousTraffic('UNAUTHORIZED_ADMIN_ACCESS_ATTEMPT', `User: "${req.user?.username || 'UNKNOWN'}" tried accessing admin endpoint`, req);
    return res.status(403).json({ message: 'FORBIDDEN: ADMIN ACCESS REQUIRED' });
  }
  next();
};

// ── USER PROFILE ENDPOINTS (Accessible by any authenticated user) ──

// GET /api/users/profile (Current user profile & stats)
router.get('/profile', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id, 'username name role createdAt updatedAt');
    if (!user) {
      return res.status(404).json({ message: 'USER NOT FOUND' });
    }

    // Fetch projects summary created/owned by this user
    const projects = await Project.find({ ownerUsername: user.username })
      .select('name createdAt updatedAt lastEditedAt lastEditedBy')
      .sort({ updatedAt: -1 });

    res.json({
      user: {
        _id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      stats: {
        totalProjects: projects.length,
        recentProjects: projects.slice(0, 8),
      }
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/profile (Update current user's profile details)
router.put('/profile', auth, async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: 'NAME MUST BE AT LEAST 2 CHARACTERS' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { name: name.trim().toUpperCase() },
      { returnDocument: 'after' }
    ).select('username name role createdAt updatedAt');

    if (!updatedUser) {
      return res.status(404).json({ message: 'USER NOT FOUND' });
    }

    // Sync ownerName on user's projects
    await Project.updateMany(
      { ownerUsername: updatedUser.username },
      { $set: { ownerName: updatedUser.name } }
    );

    logger.logAdminAction(req.user.username, 'UPDATE_PROFILE', `User updated full name to "${updatedUser.name}"`, req);

    res.json({
      message: 'PROFILE UPDATED SUCCESSFULLY',
      user: {
        _id: updatedUser._id,
        username: updatedUser.username,
        name: updatedUser.name,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      }
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/change-password (Self password change for authenticated user)
router.put('/change-password', auth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword) {
      return res.status(400).json({ message: 'CURRENT PASSWORD IS REQUIRED' });
    }
    if (!newPassword || newPassword.trim().length < 4) {
      return res.status(400).json({ message: 'NEW PASSWORD MUST BE AT LEAST 4 CHARACTERS' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'USER NOT FOUND' });
    }

    const isMatch = await user.comparePassword(currentPassword.trim());
    if (!isMatch) {
      logger.logAuthFailure(user.username, 'INCORRECT_CURRENT_PASSWORD', req);
      return res.status(400).json({ message: 'CURRENT PASSWORD IS INCORRECT' });
    }

    const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);
    user.password = hashedPassword;
    await user.save();

    logger.logAuthSuccess(user.username, req, 'PASSWORD_CHANGED_BY_USER');

    res.json({ message: 'PASSWORD CHANGED SUCCESSFULLY' });
  } catch (err) {
    next(err);
  }
});

// ── ADMIN ONLY ENDPOINTS ──

// GET /api/users (List all users)
router.get('/', auth, requireAdmin, async (req, res, next) => {
  try {
    const users = await User.find({}, 'username name role companyId companySlug createdAt updatedAt')
      .populate('companyId', 'name slug')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    next(err);
  }
});

// POST /api/users (Create new user)
router.post('/', auth, requireAdmin, async (req, res, next) => {
  try {
    const { username, name, password, role, companyId, companySlug } = req.body;
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
      companyId: companyId || null,
      companySlug: companySlug || 'mts-decor',
    });

    logger.logAdminAction(req.user.username, 'CREATE_USER', `Created user: "${newUser.username}" (${newUser.role}) for company: "${newUser.companySlug}"`, req);

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
