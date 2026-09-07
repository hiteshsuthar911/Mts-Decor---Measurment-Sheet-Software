// Centralized Security & Audit Logger for MS PRO
const getClientIp = (req) => {
  if (!req || !req.headers) return req?.ip || 'UNKNOWN_IP';
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    req.ip ||
    'UNKNOWN_IP'
  );
};

const formatTimestamp = () => new Date().toISOString();

const logger = {
  // ── Authentication Audit Logs ────────────────────────────
  logAuthSuccess: (username, req, method = 'PASSWORD+2FA') => {
    const ip = getClientIp(req);
    const ua = req?.headers?.['user-agent'] || 'UNKNOWN_UA';
    console.log(`✅ [AUTH SUCCESS] [${formatTimestamp()}] User: "${username}" | IP: ${ip} | Method: ${method} | UA: "${ua}"`);
  },

  logAuthFailure: (username, reason, req) => {
    const ip = getClientIp(req);
    const ua = req.headers['user-agent'] || 'UNKNOWN_UA';
    console.warn(`⚠️ [AUTH FAILED] [${formatTimestamp()}] User: "${username || 'UNKNOWN'}" | Reason: ${reason} | IP: ${ip} | UA: "${ua}"`);
  },

  log2FAIssued: (username, req) => {
    const ip = getClientIp(req);
    console.log(`ℹ️ [2FA ISSUED] [${formatTimestamp()}] Challenge generated for user: "${username}" | IP: ${ip}`);
  },

  log2FAVerified: (username, req) => {
    const ip = getClientIp(req);
    console.log(`✅ [2FA VERIFIED] [${formatTimestamp()}] Correct 6-digit code verified for: "${username}" | IP: ${ip}`);
  },

  log2FAFailed: (username, reason, req) => {
    const ip = getClientIp(req);
    console.warn(`🚨 [2FA FAILED] [${formatTimestamp()}] Invalid 6-digit code for: "${username}" | Reason: ${reason} | IP: ${ip}`);
  },

  // ── Admin Actions Audit Logs ─────────────────────────────
  logAdminAction: (adminUsername, action, details, req) => {
    const ip = getClientIp(req);
    console.log(`🛡️ [ADMIN AUDIT] [${formatTimestamp()}] Admin: "${adminUsername}" | Action: ${action} | Details: ${details} | IP: ${ip}`);
  },

  // ── Threat & Unusual Traffic Pattern Logs ────────────────
  logSuspiciousTraffic: (type, details, req) => {
    const ip = getClientIp(req);
    const path = req.originalUrl || req.url;
    const ua = req.headers['user-agent'] || 'UNKNOWN_UA';
    console.error(`🚨 [SECURITY ALERT - ${type}] [${formatTimestamp()}] IP: ${ip} | Path: "${path}" | Details: ${details} | UA: "${ua}"`);
  },

  // ── API Error Logs ───────────────────────────────────────
  logApiError: (err, req) => {
    const ip = getClientIp(req);
    const path = req.originalUrl || req.url;
    const method = req.method;
    console.error(`❌ [API ERROR] [${formatTimestamp()}] ${method} ${path} | IP: ${ip} | Status: ${err.status || 500} | Message: ${err.message}`);
    if (process.env.NODE_ENV !== 'production' && err.stack) {
      console.error(err.stack);
    }
  },

  getClientIp
};

module.exports = logger;
