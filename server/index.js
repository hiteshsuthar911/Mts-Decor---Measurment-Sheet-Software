const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const FounderSlide = require('./models/FounderSlide');

const app = express();

// ── Middleware ────────────────────────────────────────────
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' })); // Large limit for measurement data

// ── Routes ────────────────────────────────────────────────
app.use('/api/auth',           require('./routes/auth'));
app.use('/api/users',          require('./routes/users'));
app.use('/api/projects',       require('./routes/projects'));
app.use('/api/founder-slides', require('./routes/founderSlides'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', time: new Date().toISOString() }));

// ── Serve React Frontend in Production ────────────────────
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// For client-side routing, serve index.html for non-API GET requests
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(distPath, 'index.html'), err => {
      if (err) next();
    });
  }
  next();
});

// ── Database Seed (creates default users on first run) ────
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
    } else {
      console.log(`ℹ️  User already exists: ${u.username}`);
    }
  }
}

// ── Database Seed (creates default founder quotes on first run) ─
async function seedFounderSlides() {
  const count = await FounderSlide.countDocuments();
  if (count === 0) {
    await FounderSlide.create([
      {
        name: 'Jagdish Suthar',
        role: 'Founder & Managing Director',
        company: 'MTS Decor & Interiors',
        quote: '“Precision in civil and interior measurements is the foundation of flawless execution. MS Pro ensures every site calculation is 100% accurate.”',
        imageUrl: '/login_hero.jpg',
        order: 1
      },
      {
        name: 'Madanlal Suthar',
        role: 'Co-Founder & Technical Lead',
        company: 'MTS Decor & Interiors',
        quote: '“Our goal with MTS Decor has always been trust and perfection. Real-time cloud synchronization empowers our team to deliver on time, every time.”',
        imageUrl: '/login_hero.jpg',
        order: 2
      }
    ]);
    console.log('✅ Seeded default founder slides');
  }
}

// ── Connect to MongoDB and Start Server ───────────────────
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB Atlas');
    await seedUsers();
    await seedFounderSlides();
    app.listen(PORT, () => {
      console.log(`🚀 MS PRO Server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
