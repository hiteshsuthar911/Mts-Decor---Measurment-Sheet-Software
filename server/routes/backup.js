const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const {
  generateDatabaseSnapshot,
  uploadBackupToDrive,
  getBackupStatus,
} = require('../utils/googleDrive');
const logger = require('../utils/logger');

// Middleware to restrict to ADMIN role
function adminOnly(req, res, next) {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ message: 'FORBIDDEN: ADMIN ACCESS REQUIRED' });
  }
  next();
}

// GET /api/backup/status — Get last backup status and Drive readiness
router.get('/status', auth, adminOnly, (req, res) => {
  res.json(getBackupStatus());
});

// POST /api/backup/trigger — Manually trigger immediate Google Drive backup
router.post('/trigger', auth, adminOnly, async (req, res) => {
  try {
    logger.logAdminAction(req.user.username, 'TRIGGER_GOOGLE_DRIVE_BACKUP', 'Manual backup triggered', req);
    const result = await uploadBackupToDrive();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/backup/download — Download full database snapshot directly as a JSON file
router.get('/download', auth, adminOnly, async (req, res) => {
  try {
    logger.logAdminAction(req.user.username, 'DOWNLOAD_DATABASE_SNAPSHOT', 'Local snapshot downloaded', req);
    const snapshot = await generateDatabaseSnapshot();
    const now = new Date();
    const dateStamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `MTS_Decor_Database_Backup_${dateStamp}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(JSON.stringify(snapshot, null, 2));
  } catch (err) {
    res.status(500).json({ message: 'FAILED TO GENERATE DATABASE SNAPSHOT', error: err.message });
  }
});

module.exports = router;
