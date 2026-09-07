const { google } = require('googleapis');
const { Readable } = require('stream');
const Project = require('../models/Project');
const User = require('../models/User');
const FounderSlide = require('../models/FounderSlide');

// In-memory status of last backup
let backupState = {
  lastBackupTime: null,
  lastFileName: null,
  status: 'IDLE', // IDLE | RUNNING | SUCCESS | ERROR
  lastMessage: 'No backup run yet in this session',
  driveConnected: false,
};

// Generate full database snapshot
async function generateDatabaseSnapshot() {
  const [projects, users, slides] = await Promise.all([
    Project.find({}).lean(),
    User.find({}, '-password').lean(), // Exclude password hashes for security
    FounderSlide.find({}).lean(),
  ]);

  return {
    appName: 'MTS Decor Civil & Interior Measurement Sheet Software',
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
    stats: {
      totalProjects: projects.length,
      totalUsers: users.length,
      totalFounderSlides: slides.length,
    },
    data: {
      projects,
      users,
      founderSlides: slides,
    },
  };
}

// Get authenticated Google Drive client
function getDriveClient() {
  let credentials = null;

  // 1. Check for raw JSON string in environment variable
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try {
      const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY.trim();
      credentials = raw.startsWith('{') ? JSON.parse(raw) : JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
    } catch (err) {
      console.warn('⚠️ [GOOGLE DRIVE] Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY from env:', err.message);
    }
  }

  // 2. Check for local file path
  if (!credentials && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      const fs = require('fs');
      if (fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
        credentials = JSON.parse(fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
      }
    } catch (err) {
      console.warn('⚠️ [GOOGLE DRIVE] Failed to read credentials file:', err.message);
    }
  }

  if (!credentials) {
    return null;
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });

  return google.drive({ version: 'v3', auth });
}

// Upload backup directly to Google Drive
async function uploadBackupToDrive() {
  backupState.status = 'RUNNING';
  backupState.lastMessage = 'Generating snapshot and connecting to Google Drive...';

  const drive = getDriveClient();
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!drive) {
    backupState.status = 'ERROR';
    backupState.driveConnected = false;
    backupState.lastMessage = 'Google Service Account credentials not configured yet.';
    console.warn('⚠️ [GOOGLE DRIVE] Cannot backup: Google credentials missing.');
    return { success: false, message: backupState.lastMessage };
  }

  backupState.driveConnected = true;

  try {
    const snapshot = await generateDatabaseSnapshot();
    const jsonString = JSON.stringify(snapshot, null, 2);
    const now = new Date();
    const dateStamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `MTS_Decor_Backup_${dateStamp}.json`;

    const fileStream = new Readable();
    fileStream.push(jsonString);
    fileStream.push(null); // End of stream

    const fileMetadata = {
      name: fileName,
      mimeType: 'application/json',
      ...(folderId ? { parents: [folderId] } : {}),
    };

    const media = {
      mimeType: 'application/json',
      body: fileStream,
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id, name, webViewLink, size',
    });

    backupState.status = 'SUCCESS';
    backupState.lastBackupTime = new Date().toISOString();
    backupState.lastFileName = fileName;
    backupState.lastMessage = `Successfully uploaded ${fileName} to Google Drive (ID: ${response.data.id})`;

    console.log(`✅ [GOOGLE DRIVE BACKUP] ${backupState.lastMessage}`);
    return { success: true, file: response.data, message: backupState.lastMessage };
  } catch (err) {
    backupState.status = 'ERROR';
    backupState.lastMessage = `Upload failed: ${err.message}`;
    console.error('🚨 [GOOGLE DRIVE BACKUP ERROR]', err);
    return { success: false, message: backupState.lastMessage, error: err.message };
  }
}

// Debounced Auto-Backup on every project modification
let autoBackupTimer = null;
function triggerAutoBackup() {
  if (autoBackupTimer) clearTimeout(autoBackupTimer);

  // Debounce by 25 seconds to batch frequent saves
  autoBackupTimer = setTimeout(() => {
    uploadBackupToDrive().catch(err => {
      console.warn('⚠️ [AUTO BACKUP] Silent failure:', err.message);
    });
  }, 25000);
}

// Scheduled automatic backup every 12 hours
setInterval(() => {
  console.log('⏰ [SCHEDULED BACKUP] Triggering 12-hour Google Drive backup...');
  uploadBackupToDrive().catch(() => {});
}, 12 * 60 * 60 * 1000);

function getBackupStatus() {
  const drive = getDriveClient();
  return {
    ...backupState,
    lastBackupStatus: backupState.status,
    lastBackupFile: backupState.lastFileName,
    lastError: backupState.status === 'ERROR' ? backupState.lastMessage : null,
    driveConfigured: !!drive,
    folderIdConfigured: !!process.env.GOOGLE_DRIVE_FOLDER_ID,
  };
}

module.exports = {
  generateDatabaseSnapshot,
  uploadBackupToDrive,
  triggerAutoBackup,
  getBackupStatus,
};
