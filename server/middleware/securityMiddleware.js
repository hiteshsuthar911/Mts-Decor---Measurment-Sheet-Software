const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// 1. Enforce HTTPS in Production
const enforceHttps = (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    const proto = req.headers['x-forwarded-proto'];
    if (proto && proto !== 'https') {
      const secureUrl = `https://${req.headers.host}${req.url}`;
      return res.redirect(301, secureUrl);
    }
  }
  next();
};

// 2. Malicious Scanner & Probe Detector
const SUSPICIOUS_PATTERNS = [
  /\/\.env/i,
  /\/\.git/i,
  /\/wp-admin/i,
  /\/wp-login/i,
  /\/phpmyadmin/i,
  /\/cgi-bin/i,
  /\/etc\/passwd/i,
  /\/\.\.\//, // Path traversal
  /<script/i,
  /select\s+.*\s+from/i, // Basic SQLi attempt
  /union\s+select/i,
];

const detectSuspiciousProbes = (req, res, next) => {
  const target = decodeURIComponent(req.originalUrl || req.url);
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(target)) {
      logger.logSuspiciousTraffic('PROBE_BLOCKED', `Pattern matched: ${pattern}`, req);
      return res.status(403).json({ message: 'FORBIDDEN: REQUEST BLOCKED BY SECURITY POLICY' });
    }
  }
  next();
};

// 3. Brute-Force Rate Limiter for Authentication Routes
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 15 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
  skipSuccessfulRequests: true,
  skip: (req) => {
    if (process.env.NODE_ENV !== 'production') return true;
    const ip = req.ip || req.connection?.remoteAddress || '';
    return ip === '127.0.0.1' || ip === '::1' || ip.includes('127.0.0.1') || ip === '::ffff:127.0.0.1';
  },
  message: { message: 'TOO MANY LOGIN ATTEMPTS. PLEASE TRY AGAIN AFTER 15 MINUTES.' },
  handler: (req, res, next, options) => {
    logger.logSuspiciousTraffic(
      'BRUTE_FORCE_RATE_LIMIT_EXCEEDED',
      `Exceeded max auth requests in 15min window`,
      req
    );
    res.status(options.statusCode).json(options.message);
  }
});

// 4. General API Burst Limiter
const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === 'production' ? 200 : 5000,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
  skip: (req) => {
    if (process.env.NODE_ENV !== 'production') return true;
    const ip = req.ip || req.connection?.remoteAddress || '';
    return ip === '127.0.0.1' || ip === '::1' || ip.includes('127.0.0.1') || ip === '::ffff:127.0.0.1';
  },
  message: { message: 'RATE LIMIT EXCEEDED. PLEASE REDUCE REQUEST FREQUENCY.' },
  handler: (req, res, next, options) => {
    logger.logSuspiciousTraffic(
      'UNUSUAL_TRAFFIC_BURST',
      `Exceeded requests per minute`,
      req
    );
    res.status(options.statusCode).json(options.message);
  }
});

// 5. Centralized Error Handler (Logs & Sanitizes responses)
const errorHandler = (err, req, res, next) => {
  logger.logApiError(err, req);
  const status = err.status || 500;
  
  // Never leak internal stack traces or database internals to users in production
  const isProd = process.env.NODE_ENV === 'production';
  const message = isProd && status === 500 
    ? 'AN UNEXPECTED INTERNAL ERROR OCCURRED' 
    : (err.message || 'INTERNAL SERVER ERROR');

  res.status(status).json({
    message,
    status,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  enforceHttps,
  detectSuspiciousProbes,
  authRateLimiter,
  apiRateLimiter,
  errorHandler
};
