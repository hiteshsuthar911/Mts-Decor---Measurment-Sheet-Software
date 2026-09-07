# 📐 MTS Decor — MS PRO
### Civil & Interior Contractor Measurement Sheet & RA Billing System

[![Live Web App](https://img.shields.io/badge/Live%20App-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://mts-decor-measurment-sheet-software.onrender.com)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas%20Cloud-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Electron](https://img.shields.io/badge/Electron-Desktop%20App-47848F?style=for-the-badge&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![Cloudflare Turnstile](https://img.shields.io/badge/Cloudflare-Turnstile%202FA-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://www.cloudflare.com/)

---

## 🌟 Overview

**MTS Decor MS PRO** is an end-to-end, multi-platform contractor software engineered for civil and interior contractors, quantity surveyors, site engineers, and project managers. 

It streamlines on-site dimensional measuring, area computations, deduction handling, Running Account (RA) billing, multi-user cloud synchronization, and client-ready reporting in Excel and PDF.

---

## 🚀 Key Features

### 1. ⚡ Mobile "Quick-Measure" Field Mode
* **Thumb-Friendly Keypad**: Oversized numeric buttons designed for one-handed entry while holding a measuring tape on site.
* **Tape Fraction Shortcuts**: Instant buttons for `+ ¼" (0.25)`, `+ ½" (0.50)`, and `+ ¾" (0.75)` to eliminate mental decimal conversions.
* **Room & Location Presets**: 1-tap room selection (*Living Room, Master Bed, Kitchen, Toilets, Balcony, Passage, Lobby, etc.*).
* **Comprehensive Work Catalog**: Preset items for tiling, Italian marble, carpentry, false ceiling, painting, and deductions (*Door Cutouts, Window Openings, Nahani Traps, Core Cuts*).
* **Smart Auto-Unit Switcher**: Automatically switches units (`SFT`, `RFT`, `NOS`) and addition/deduction modes (`+ ADD` vs `- LESS`).
* **Voice Input (Speech-to-Text)**: Tap the microphone to dictate room names or item descriptions hands-free.
* **Haptic Touch**: Real-time vibration feedback for keypresses and saves.

### 2. 📊 Location & Work Measurement Sheets
* **Multi-Area Hierarchy**: Group measurements by Floor, Flat / Unit Number, and Room / Location.
* **Formula Automation**: Real-time calculation of Area (`Length × Height/Width × Qty`), Running Length (`Qty × Length`), and Counts (`Qty`).
* **Deduction Engine**: Accurate subtractions for doors, windows, beams, and columns with automated gross vs. net area roll-ups.
* **1-Second Real-Time Cloud Save**: Automatic debounced background persistence to MongoDB Atlas.

### 3. 💰 RA Bill & Rates Engine
* **Interim Payment Certificates (IPC / RA Bills)**: Toggle between pure Measurement Sheet Mode and Billing Mode with one click.
* **Rates & Item Amounts**: Auto-calculates Line Item Amount (`Quantity × Rate`), Gross Bill, Deductions, Subtotals, and GST/Tax percentages.
* **Executive Summary Dashboard**: Instant roll-up breakdowns grouped by Work Category, Unit, and Floor.

### 4. 📄 Client-Ready Exporting
* **Multi-Sheet Excel Export (`.xlsx`)**: Generates formatted workbooks with formulas, headers, contractor details, and summaries.
* **Contractor Print / PDF View**: Clean, high-contrast, paper-optimized layout with company headers, verification signatures, and notes.

### 5. 🔒 Enterprise-Grade Security & 2FA
* **Two-Step Verification**: Secure 6-digit PIN verification system for sensitive edits.
* **Cloudflare Turnstile Bot Defense**: Integrated human challenge verification with zero CAPTCHA friction.
* **Bcrypt Password Security**: Zero plain-text credentials stored; all passwords encrypted with bcrypt salt rounds.
* **Role-Based Access Control (RBAC)**: Distinct permissions for `ADMIN` and `USER` accounts.

### 6. ☁️ Automated Google Drive Cloud Backups
* **Auto-Backup on Every Save**: Triggers a debounced snapshot upload to your private Google Drive whenever projects are created or modified.
* **12-Hour Cron Scheduler**: Automated background snapshot generation (`MTS_Decor_Backup_YYYY-MM-DD_HH-mm-ss.json`).
* **Admin Control Center**:
  * Live Google Drive connection health monitor.
  * 1-Click **"Backup to Google Drive Now"**.
  * 1-Click **"Download Database Snapshot (.JSON)"** directly to local disk anytime.

### 7. 🖥️ Cross-Platform Desktop App
* **Electron Packaging**: Built for **Windows** (`.exe` standalone installer & portable) and **macOS** (`.dmg`).
* **Automated CI/CD**: GitHub Actions workflow (`.github/workflows/build-desktop.yml`) automatically builds release binaries on push.

### 8. 🎨 Dynamic Login Carousel & Admin Management
* **Founder Spotlight**: Customizable rotating login slides with photos and quotes celebrating leadership.
* **Admin Panel**: User creation, credential management, project audits, and system information.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, Vite, Bootstrap 5, Bootstrap Icons |
| **Routing** | React Router DOM v7 (SPA HTML5 History & Electron Hash) |
| **Backend API** | Node.js, Express 4, RESTful Architecture |
| **Database** | MongoDB Atlas Cloud (Mongoose ODM) |
| **Cloud Storage** | Google Drive API v3 (Service Account integration) |
| **Security & 2FA** | Cloudflare Turnstile, JWT, Bcrypt, Helmet, Express Rate Limit |
| **Desktop Wrapper**| Electron 44, Electron Builder |
| **Export Engines** | SheetJS (XLSX), Native Browser Print CSS Engine |
| **Hosting & CI** | Render (PaaS Web Service), GitHub Actions |

---

## 📂 Project Structure

```
├── .github/
│   └── workflows/
│       └── build-desktop.yml      # CI/CD: Automated Windows/macOS desktop builds
├── electron/
│   ├── main.js                   # Electron main process & window management
│   └── preload.js                # Electron context bridge
├── server/
│   ├── config/
│   │   └── db.js                 # MongoDB Atlas connection
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT & Role validation
│   │   └── errorHandler.js       # Centralized error handler
│   ├── models/
│   │   ├── Project.js            # Projects & measurement sheets schema
│   │   ├── User.js               # Multi-user authentication schema
│   │   └── FounderSlide.js       # Dynamic login carousel schema
│   ├── routes/
│   │   ├── auth.js               # Login, 2FA PIN verification, Cloudflare Turnstile
│   │   ├── projects.js           # Measurement sheet CRUD & auto-backup hooks
│   │   ├── users.js              # Admin user management & password resets
│   │   ├── founderSlides.js      # Founder slide management
│   │   └── backup.js             # Google Drive backup & JSON download endpoints
│   ├── utils/
│   │   ├── googleDrive.js        # Google Drive API upload & cron scheduler
│   │   └── logger.js             # Action audit logging
│   └── index.js                  # Express server entrypoint
├── src/
│   ├── components/
│   │   ├── Header.jsx            # Action ribbon, project metadata & mode toggles
│   │   ├── QuickMeasureModal.jsx # One-handed Mobile Field Mode & large keypad
│   │   ├── AreaBlock.jsx         # Location & Room measurement blocks
│   │   ├── LineItemRow.jsx       # Individual dimension & calculation rows
│   │   ├── QuickStatsBar.jsx     # Top KPI metric cards
│   │   ├── SummaryDashboard.jsx  # Roll-up breakdown cards (Category/Unit/Floor)
│   │   ├── PrintSheetView.jsx    # Contractor PDF printable format
│   │   └── VerifyModal.jsx       # 2FA 6-digit PIN verification modal
│   ├── pages/
│   │   ├── LoginPage.jsx         # Cloudflare Turnstile + rotating founder carousel
│   │   ├── ProjectsPage.jsx      # Project list & creation
│   │   ├── MeasurementSheet.jsx  # Full measurement workbook interface
│   │   ├── AdminPanel.jsx        # Admin controls, Drive sync & user accounts
│   │   └── ProfilePage.jsx       # User profile & security settings
│   ├── utils/
│   │   ├── api.js                # Universal fetch API wrapper
│   │   ├── calculations.js       # Quantity & billing calculation engine
│   │   ├── exportUtils.js        # Excel (.xlsx) workbook builder
│   │   └── storage.js            # API storage helpers
│   ├── App.jsx                   # Role-based route guard
│   └── main.jsx                  # Application root
├── package.json
└── vite.config.js
```

---

## ⚙️ Environment Variables

Create a `.env` file in `server/` (or configure in your Render Dashboard):

```env
# ── Server Configuration ──
PORT=5001
NODE_ENV=production

# ── Database ──
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/ms-pro?retryWrites=true&w=majority

# ── Authentication ──
JWT_SECRET=your_super_secret_jwt_key_here

# ── Cloudflare Turnstile Bot Defense ──
TURNSTILE_SITE_KEY=0x4AAAAAAErkNoW--wJDYO0C
TURNSTILE_SECRET_KEY=0x4AAAAAAErkNqY24DFjseSMClCnKCyU7t4

# ── Google Drive Automated Backups (Optional) ──
GOOGLE_DRIVE_FOLDER_ID=your_google_drive_folder_id_here
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"...","private_key":"..."}
```

---

## 💻 Local Development Setup

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/hiteshsuthar911/Mts-Decor---Measurment-Sheet-Software.git
cd Mts-Decor---Measurment-Sheet-Software

# Install frontend & root dependencies
npm install

# Install backend dependencies
cd server && npm install && cd ..
```

### 2. Run in Development Mode
```bash
# Terminal 1: Start Express API server (Port 5001)
npm start

# Terminal 2: Start Vite Dev Server (Port 5173)
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 📦 Building for Desktop (Windows & Mac)

```bash
# Build Windows Installer (.exe) & Portable executable
npm run electron:build:win

# Build macOS DMG
npm run electron:build:mac
```
Output binaries will be generated in the `release/` directory.

---

## 👥 Default Credentials

| Username | Role | Initial Access |
| :--- | :--- | :--- |
| `admin` | **ADMIN** | Full System & Backup Control |
| `madanlal` | **USER** | Project Measurements & RA Billing |
| `jagdish` | **USER** | Project Measurements & RA Billing |

*(Passwords and user accounts can be managed directly in the Admin Panel)*

---

## 📜 License & Copyright

Copyright &copy; 2026 **MTS DECOR** (Madanlal & Jagdish Suthar).  
Engineered with ❤️ by **Hitesh Suthar**.
