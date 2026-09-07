const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const { 
  enforceHttps, 
  detectSuspiciousProbes, 
  authRateLimiter, 
  apiRateLimiter, 
  errorHandler 
} = require('./middleware/securityMiddleware');
const logger = require('./utils/logger');

// ── Startup Environment Validation ────────────────────────
if (!process.env.MONGO_URI) {
  console.error('❌ FATAL: MONGO_URI environment variable is missing.');
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ FATAL: JWT_SECRET environment variable is missing in production.');
    process.exit(1);
  } else {
    console.warn('⚠️ WARNING: JWT_SECRET not found in env, using local development fallback.');
    process.env.JWT_SECRET = 'ms_pro_local_dev_fallback_secret_key_2026';
  }
}

const app = express();

// ── Reverse Proxy Trust (Configured for 1-hop reverse proxy on Render/Cloudflare)
app.set('trust proxy', 1);

// ── Security Headers via Helmet & HTTPS Enforcement ───────
app.use(helmet({
  contentSecurityPolicy: false, // Handled per-need to permit React frontend & fonts
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000, // 1 year HTTP Strict Transport Security
    includeSubDomains: true,
    preload: true,
  },
}));

// Enforce 301 HTTPS redirect in production
app.use(enforceHttps);

// Detect & block malicious probes (e.g. .env, wp-login, scanner attacks)
app.use(detectSuspiciousProbes);

// ── Core Middleware ───────────────────────────────────────
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' })); // Large limit for measurement data
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Rate Limiting (Brute-force & Burst Protection) ─────────
app.use('/api', apiRateLimiter);
app.use('/api/auth', authRateLimiter);

// ── API Routes ────────────────────────────────────────────
app.use('/api/auth',           require('./routes/auth'));
app.use('/api/users',          require('./routes/users'));
app.use('/api/projects',       require('./routes/projects'));
app.use('/api/founder-slides', require('./routes/founderSlides'));
app.use('/api/backup',         require('./routes/backup'));

// Direct download endpoints for Windows & Mac builds
app.get('/api/download/windows', (req, res) => {
  const exePath = path.join(__dirname, '../dist-electron/MTS Decor Setup 1.0.0.exe');
  if (fs.existsSync(exePath)) {
    return res.download(exePath, 'MTS-Decor-Setup-1.0.0.exe');
  }
  const zipPath = path.join(__dirname, '../dist-electron/MTS Decor-1.0.0-win.zip');
  if (fs.existsSync(zipPath)) {
    return res.download(zipPath, 'MTS-Decor-1.0.0-win.zip');
  }
  res.status(404).json({ error: 'Windows installer not found on server' });
});

app.get('/api/download/mac', (req, res) => {
  const dmgPath = path.join(__dirname, '../dist-electron/MTS Decor-1.0.0-arm64.dmg');
  if (fs.existsSync(dmgPath)) {
    return res.download(dmgPath, 'MTS-Decor-1.0.0-arm64.dmg');
  }
  res.status(404).json({ error: 'macOS DMG not found on server' });
});

// Health check
app.get('/api/health', (req, res) => res.json({ 
  status: 'OK', 
  secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  time: new Date().toISOString() 
}));

// ── Serve React Frontend in Production ────────────────────
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));
// Fallback for nested asset requests
app.use('/sheet/assets', express.static(path.join(distPath, 'assets')));
app.use('/projects/assets', express.static(path.join(distPath, 'assets')));

// Client-side SPA routing fallback
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(distPath, 'index.html'), err => {
      if (err) next(err);
    });
  }
  next();
});

// ── Centralized Error Handling Middleware ─────────────────
app.use(errorHandler);

// ── Database Seed (Default System Users on first run) ─────
async function seedUsers() {
  const users = [
    { username: 'admin',    password: 'admin@123',    name: 'ADMINISTRATOR', role: 'ADMIN' },
    { username: 'jagdish',  password: 'jagdish@123',  name: 'JAGDISH',       role: 'USER'  },
    { username: 'madanlal', password: 'madanlal@123', name: 'MADANLAL',      role: 'USER'  },
  ];
  for (const u of users) {
    const exists = await User.findOne({ username: u.username });
    if (!exists) {
      const hashed = await bcrypt.hash(u.password, 10);
      await User.collection.insertOne({
        username: u.username,
        password: hashed,
        name: u.name,
        role: u.role,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`✅ Seeded user: ${u.username}`);
    }
  }
}

// ── Connect to MongoDB Atlas (TLS Enforced) & Start ───────
const PORT = process.env.PORT || 5001;

mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000,
})
  .then(async () => {
    console.log('✅ Connected securely to MongoDB Atlas (TLS/SSL Enforced)');
    await seedUsers();
    app.listen(PORT, () => {
      console.log(`🚀 MS PRO Secure Server running on port ${PORT} (NODE_ENV: ${process.env.NODE_ENV || 'development'})`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
