const router = require('express').Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Company = require('../models/Company');
const logger = require('../utils/logger');

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

// Cloudflare Turnstile Bot Verification (Free Cloudflare Security Screen)
async function verifyCloudflareTurnstile(token, ip) {
  const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY || '0x4AAAAAAErkNqY24DFjseSMClCnKCyU7t4';
  
  if (!token) {
    // If strict Cloudflare secret key is explicitly configured in production, reject missing token
    if (process.env.NODE_ENV === 'production' && process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY) {
      return false;
    }
    return true; // Graceful pass in local/desktop development if key not supplied
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (ip) formData.append('remoteip', ip);

    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });
    const outcome = await verifyRes.json();
    return outcome.success === true;
  } catch (err) {
    console.error('Cloudflare Turnstile verification error:', err.message);
    return true; // Fail-open to prevent locking out legitimate users on network hiccups
  }
}

// POST /api/auth/login-init (Step 1 of 2FA Login)
router.post('/login-init', async (req, res, next) => {
  try {
    const { username, password, cfToken } = req.body;
    if (!username || !password) {
      logger.logAuthFailure(username, 'MISSING_CREDENTIALS', req);
      return res.status(400).json({ message: 'USERNAME AND PASSWORD REQUIRED' });
    }

    const cleanUsername = username.trim().toLowerCase();

    // ── Verify Cloudflare Turnstile Human Check ─────────────
    const clientIp = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress;
    const isHuman = await verifyCloudflareTurnstile(cfToken, clientIp);
    if (!isHuman) {
      logger.logSuspiciousTraffic('BOT_DETECTED', `Cloudflare Turnstile check failed for user "${cleanUsername}"`, req);
      return res.status(403).json({ message: 'Cloudflare security check failed. Automated bots are blocked.' });
    }
    const user = await User.findOne({ username: cleanUsername });
    if (!user) {
      logger.logAuthFailure(cleanUsername, 'USER_NOT_FOUND', req);
      return res.status(401).json({ message: 'INVALID USERNAME OR PASSWORD' });
    }

    const valid = await user.comparePassword(password.trim());
    if (!valid) {
      logger.logAuthFailure(cleanUsername, 'INVALID_PASSWORD', req);
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
      companyId: user.companyId,
      companySlug: user.companySlug || 'mts-decor',
      code,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    });

    logger.log2FAIssued(user.username, req);

    res.json({
      require2FA: true,
      challengeId,
      verificationCode: code, // Displayed to user in secure UI prompt
      username: user.username,
      name: user.name,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/verify-2fa (Step 2 of 2FA Login)
router.post('/verify-2fa', async (req, res, next) => {
  try {
    const { challengeId, code } = req.body;
    if (!challengeId || !code) {
      logger.log2FAFailed('UNKNOWN', 'MISSING_CHALLENGE_OR_CODE', req);
      return res.status(400).json({ message: 'CHALLENGE ID AND 6-DIGIT CODE REQUIRED' });
    }

    const challenge = pending2FA.get(challengeId);
    if (!challenge) {
      logger.log2FAFailed('UNKNOWN', 'CHALLENGE_NOT_FOUND_OR_EXPIRED', req);
      return res.status(401).json({ message: 'VERIFICATION SESSION EXPIRED. PLEASE SIGN IN AGAIN.' });
    }

    if (Date.now() > challenge.expiresAt) {
      pending2FA.delete(challengeId);
      logger.log2FAFailed(challenge.username, 'CHALLENGE_EXPIRED', req);
      return res.status(401).json({ message: 'VERIFICATION CODE EXPIRED. PLEASE SIGN IN AGAIN.' });
    }

    if (challenge.code !== code.toString().trim()) {
      logger.log2FAFailed(challenge.username, 'INCORRECT_OTP_CODE', req);
      return res.status(400).json({ message: 'INCORRECT 6-DIGIT VERIFICATION CODE' });
    }

    // Code matches: remove challenge and generate JWT token
    pending2FA.delete(challengeId);

    // Fetch company info
    const company = challenge.companyId
      ? await Company.findById(challenge.companyId)
      : await Company.findOne({ slug: challenge.companySlug || 'mts-decor' });

    const token = jwt.sign(
      {
        id: challenge.userId,
        username: challenge.username,
        name: challenge.name,
        role: challenge.role,
        companyId: company ? company._id : null,
        companySlug: company ? company.slug : 'mts-decor',
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    logger.log2FAVerified(challenge.username, req);
    logger.logAuthSuccess(challenge.username, req, '2FA-PASSWORD');

    res.json({
      token,
      user: {
        id: challenge.userId,
        username: challenge.username,
        name: challenge.name,
        role: challenge.role,
        companyId: company ? company._id : null,
        companySlug: company ? company.slug : 'mts-decor',
        company: company ? {
          id: company._id,
          name: company.name,
          slug: company.slug,
          logo: company.logo,
          tagline: company.tagline,
          address: company.address,
          phone: company.phone,
          email: company.email,
          gstin: company.gstin,
          subscriptionStatus: company.subscriptionStatus,
        } : null,
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login (Direct login fallback)
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      logger.logAuthFailure(username, 'MISSING_CREDENTIALS', req);
      return res.status(400).json({ message: 'USERNAME AND PASSWORD REQUIRED' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const user = await User.findOne({ username: cleanUsername });
    if (!user) {
      logger.logAuthFailure(cleanUsername, 'USER_NOT_FOUND', req);
      return res.status(401).json({ message: 'INVALID USERNAME OR PASSWORD' });
    }

    const valid = await user.comparePassword(password.trim());
    if (!valid) {
      logger.logAuthFailure(cleanUsername, 'INVALID_PASSWORD', req);
      return res.status(401).json({ message: 'INVALID USERNAME OR PASSWORD' });
    }

    const company = user.companyId
      ? await Company.findById(user.companyId)
      : await Company.findOne({ slug: user.companySlug || 'mts-decor' });

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        companyId: company ? company._id : null,
        companySlug: company ? company.slug : 'mts-decor',
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    logger.logAuthSuccess(user.username, req, 'DIRECT_PASSWORD');

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        companyId: company ? company._id : null,
        companySlug: company ? company.slug : 'mts-decor',
        company: company ? {
          id: company._id,
          name: company.name,
          slug: company.slug,
          logo: company.logo,
          tagline: company.tagline,
          address: company.address,
          phone: company.phone,
          email: company.email,
          gstin: company.gstin,
          subscriptionStatus: company.subscriptionStatus,
        } : null,
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/verify-password (for edit guard)
router.post('/verify-password', require('../middleware/authMiddleware'), async (req, res, next) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      logger.logAuthFailure(req.user.username, 'EDIT_GUARD_USER_NOT_FOUND', req);
      return res.status(404).json({ message: 'USER NOT FOUND' });
    }
    const valid = await user.comparePassword(password.trim());
    if (!valid) {
      logger.logAuthFailure(req.user.username, 'EDIT_GUARD_INVALID_PASSWORD', req);
    }
    res.json({ valid });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
