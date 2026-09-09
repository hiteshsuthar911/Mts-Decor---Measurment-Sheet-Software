import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppStoreBadge, GooglePlayBadge } from '../components/AppStoreBadges';

export default function DownloadPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="download-page min-vh-100 d-flex flex-column bg-light" style={{ fontFamily: 'var(--ms-font-family)' }}>
      {/* ── Top Navbar ── */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark py-3 px-3 px-md-5 border-bottom border-secondary border-opacity-25 sticky-top">
        <div className="container-fluid max-w-7xl d-flex justify-content-between align-items-center">
          <Link to="/" className="navbar-brand d-flex align-items-center gap-2 text-decoration-none">
            <img
              src="/mtsdecor.png"
              alt="MTS Decor"
              style={{ height: '36px', maxWidth: '140px', objectFit: 'contain' }}
              onError={(e) => { e.target.onerror = null; e.target.src = '/logo.png'; }}
            />
            <span className="badge bg-primary text-uppercase px-2 py-1 fs-6">
              MS PRO
            </span>
          </Link>

          <div className="d-flex align-items-center gap-2">
            <Link
              to="/login"
              className="btn btn-outline-light btn-sm px-3 py-1 fw-bold text-uppercase extra-small d-flex align-items-center gap-1"
            >
              <i className="bi bi-box-arrow-in-right"></i>
              <span>Open Web App</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="download-hero text-center py-5 px-3" style={{ background: 'linear-gradient(180deg, #0b0f19 0%, #111827 100%)', color: '#ffffff' }}>
        <div className="container py-4" style={{ maxWidth: '900px' }}>
          <div className="d-inline-flex align-items-center gap-2 px-3 py-1 mb-3 rounded-pill" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <span className="badge bg-primary rounded-pill extra-small">NEW</span>
            <span className="text-light small fw-semibold">Cross-Platform Mobile & Desktop Suite</span>
          </div>

          <h1 className="display-4 fw-bolder mb-3 text-white tracking-tight" style={{ letterSpacing: '-0.03em' }}>
            MTS Decor Everywhere
          </h1>
          <p className="lead text-secondary mx-auto mb-4" style={{ maxWidth: '680px', color: '#94a3b8' }}>
            The ultra-fast civil and interior measurement sheet and RA billing software — always at your fingertips on site, at the office, or on the move.
          </p>

          {/* Primary Mobile Store Badges */}
          <div className="d-flex flex-wrap justify-content-center align-items-center gap-3 mt-4 mb-4">
            <a
              href="#ios-section"
              className="text-decoration-none"
              onClick={(e) => { e.preventDefault(); document.getElementById('ios-section')?.scrollIntoView({ behavior: 'smooth' }); }}
            >
              <AppStoreBadge height={52} />
            </a>
            <a
              href="#android-section"
              className="text-decoration-none"
              onClick={(e) => { e.preventDefault(); document.getElementById('android-section')?.scrollIntoView({ behavior: 'smooth' }); }}
            >
              <GooglePlayBadge height={52} />
            </a>
            <a
              href="#windows-section"
              className="btn btn-outline-light d-inline-flex align-items-center gap-2 fw-semibold px-4"
              style={{ height: '52px', borderRadius: '9px', borderColor: 'rgba(255, 255, 255, 0.35)', backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
              onClick={(e) => { e.preventDefault(); document.getElementById('windows-section')?.scrollIntoView({ behavior: 'smooth' }); }}
            >
              <i className="bi bi-microsoft fs-5 text-info"></i>
              <div className="text-start" style={{ lineHeight: 1.1 }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#94a3b8' }}>Download for</div>
                <div style={{ fontSize: '15px', fontWeight: 700 }}>Windows PC</div>
              </div>
            </a>
            <a
              href="#mac-section"
              className="btn btn-outline-light d-inline-flex align-items-center gap-2 fw-semibold px-4"
              style={{ height: '52px', borderRadius: '9px', borderColor: 'rgba(255, 255, 255, 0.35)', backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
              onClick={(e) => { e.preventDefault(); document.getElementById('mac-section')?.scrollIntoView({ behavior: 'smooth' }); }}
            >
              <i className="bi bi-apple fs-5 text-light"></i>
              <div className="text-start" style={{ lineHeight: 1.1 }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#94a3b8' }}>Download for</div>
                <div style={{ fontSize: '15px', fontWeight: 700 }}>macOS</div>
              </div>
            </a>
          </div>

          <div className="text-secondary extra-small text-uppercase fw-semibold" style={{ color: '#64748b' }}>
            <i className="bi bi-shield-check text-success me-1"></i> Verified & Secure &bull; Works 100% Offline &bull; Instant Cloud Sync
          </div>
        </div>
      </section>

      {/* ── Platform Download Cards ── */}
      <section className="py-5">
        <div className="container" style={{ maxWidth: '1100px' }}>
          <div className="text-center mb-5">
            <h2 className="fw-bold text-dark mb-2">Choose Your Platform</h2>
            <p className="text-muted">Select your device below to download the app or install on your home screen.</p>
          </div>

          <div className="row g-4">
            {/* ── CARD 1: Android (Phone & Tablet) ── */}
            <div className="col-12 col-md-6 col-lg-3" id="android-section">
              <div className="card h-100 border-0 shadow-sm rounded-4 p-4 text-center d-flex flex-column justify-content-between hover-elevate" style={{ backgroundColor: '#ffffff', borderTop: '4px solid #34a853' }}>
                <div>
                  <div className="d-inline-flex p-3 rounded-circle mb-3" style={{ backgroundColor: 'rgba(52, 168, 83, 0.1)' }}>
                    <i className="bi bi-android2 fs-1" style={{ color: '#34a853' }}></i>
                  </div>
                  <h4 className="fw-bold text-dark mb-1">Android</h4>
                  <p className="text-muted extra-small text-uppercase fw-bold mb-3">Phones & Tablets</p>
                  <p className="text-secondary small mb-4">
                    Install on Samsung, Xiaomi, OnePlus, Vivo, Oppo or any Android device.
                  </p>
                </div>

                <div className="d-flex flex-column gap-2">
                  <div className="d-flex justify-content-center">
                    <GooglePlayBadge height={44} />
                  </div>
                  <div className="extra-small text-muted mt-2">
                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1">
                      Supports Android 8.0 to 15
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── CARD 2: Apple iOS (iPhone & iPad) ── */}
            <div className="col-12 col-md-6 col-lg-3" id="ios-section">
              <div className="card h-100 border-0 shadow-sm rounded-4 p-4 text-center d-flex flex-column justify-content-between hover-elevate" style={{ backgroundColor: '#ffffff', borderTop: '4px solid #007aff' }}>
                <div>
                  <div className="d-inline-flex p-3 rounded-circle mb-3" style={{ backgroundColor: 'rgba(0, 122, 255, 0.1)' }}>
                    <i className="bi bi-apple fs-1" style={{ color: '#007aff' }}></i>
                  </div>
                  <h4 className="fw-bold text-dark mb-1">iPhone & iPad</h4>
                  <p className="text-muted extra-small text-uppercase fw-bold mb-3">iOS & iPadOS</p>
                  <p className="text-secondary small mb-4">
                    Optimized for iPad Pro, iPad Air, iPad Mini, and all iPhone models.
                  </p>
                </div>

                <div className="d-flex flex-column gap-2">
                  <div className="d-flex justify-content-center">
                    <AppStoreBadge height={44} />
                  </div>
                  <div className="extra-small text-muted mt-2">
                    <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-1">
                      Supports iOS / iPadOS 14+
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── CARD 3: Windows PC ── */}
            <div className="col-12 col-md-6 col-lg-3" id="windows-section">
              <div className="card h-100 border-0 shadow-sm rounded-4 p-4 text-center d-flex flex-column justify-content-between hover-elevate" style={{ backgroundColor: '#ffffff', borderTop: '4px solid #00a4ef' }}>
                <div>
                  <div className="d-inline-flex p-3 rounded-circle mb-3" style={{ backgroundColor: 'rgba(0, 164, 239, 0.1)' }}>
                    <i className="bi bi-microsoft fs-1" style={{ color: '#00a4ef' }}></i>
                  </div>
                  <h4 className="fw-bold text-dark mb-1">Windows PC</h4>
                  <p className="text-muted extra-small text-uppercase fw-bold mb-3">64-Bit Desktop App</p>
                  <p className="text-secondary small mb-4">
                    Full-featured desktop app with keyboard shortcuts, high-resolution printing & offline mode.
                  </p>
                </div>

                <div className="d-flex flex-column gap-2">
                  <a
                    href="/api/download/windows"
                    className="btn btn-primary d-flex align-items-center justify-content-center gap-2 fw-bold py-2 rounded-3 text-uppercase extra-small"
                  >
                    <i className="bi bi-download"></i>
                    <span>Download .EXE (123 MB)</span>
                  </a>
                  <div className="extra-small text-muted">
                    Compatible with Windows 10 & 11
                  </div>
                </div>
              </div>
            </div>

            {/* ── CARD 4: Apple Mac ── */}
            <div className="col-12 col-md-6 col-lg-3" id="mac-section">
              <div className="card h-100 border-0 shadow-sm rounded-4 p-4 text-center d-flex flex-column justify-content-between hover-elevate" style={{ backgroundColor: '#ffffff', borderTop: '4px solid #1e293b' }}>
                <div>
                  <div className="d-inline-flex p-3 rounded-circle mb-3" style={{ backgroundColor: 'rgba(30, 41, 59, 0.1)' }}>
                    <i className="bi bi-laptop fs-1 text-dark"></i>
                  </div>
                  <h4 className="fw-bold text-dark mb-1">macOS</h4>
                  <p className="text-muted extra-small text-uppercase fw-bold mb-3">MacBook & iMac</p>
                  <p className="text-secondary small mb-4">
                    Native Apple Silicon & Intel Mac application with macOS dark mode support.
                  </p>
                </div>

                <div className="d-flex flex-column gap-2">
                  <a
                    href="/api/download/mac"
                    className="btn btn-dark d-flex align-items-center justify-content-center gap-2 fw-bold py-2 rounded-3 text-uppercase extra-small"
                  >
                    <i className="bi bi-download"></i>
                    <span>Download .DMG (143 MB)</span>
                  </a>
                  <div className="extra-small text-muted">
                    macOS Big Sur, Monterey, Sonoma, Sequoia
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Instant Mobile Web App / Add to Home Screen Section ── */}
      <section className="py-5 bg-white border-top border-bottom">
        <div className="container" style={{ maxWidth: '960px' }}>
          <div className="row align-items-center g-5">
            <div className="col-12 col-md-7">
              <div className="badge bg-warning text-dark text-uppercase fw-bold px-3 py-1 mb-2">Instant Access</div>
              <h3 className="fw-bold text-dark mb-3">Open on Any Phone in Seconds</h3>
              <p className="text-muted mb-4">
                You can also run MTS Decor directly in your mobile browser without installing anything from an app store. Tap below to copy the link, or scan the QR code to open on your smartphone immediately.
              </p>

              <div className="d-flex flex-wrap align-items-center gap-3 mb-4">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="btn btn-outline-dark px-3 py-2 fw-semibold d-flex align-items-center gap-2 rounded-3"
                >
                  <i className={`bi ${copiedLink ? 'bi-check-circle-fill text-success' : 'bi-link-45deg'}`}></i>
                  <span>{copiedLink ? 'App Link Copied!' : 'Copy App Link'}</span>
                </button>
                <Link to="/login" className="btn btn-primary px-4 py-2 fw-bold rounded-3">
                  Open Web App Now →
                </Link>
              </div>

              <div className="p-3 bg-light rounded-3 border small">
                <div className="fw-bold text-dark mb-1">
                  <i className="bi bi-phone me-1 text-primary"></i> Pro-Tip: Add to Phone Home Screen
                </div>
                <div className="text-muted" style={{ fontSize: '12px' }}>
                  On <strong>iPhone/iPad</strong>: Open Safari ➔ Tap <strong>Share (⎋)</strong> ➔ Tap <strong>"Add to Home Screen"</strong>.<br />
                  On <strong>Android</strong>: Open Chrome ➔ Tap <strong>Menu (⋮)</strong> ➔ Tap <strong>"Install app"</strong>.
                </div>
              </div>
            </div>

            <div className="col-12 col-md-5 text-center">
              <div className="card p-4 border-0 shadow-sm rounded-4 d-inline-block bg-light">
                {/* SVG QR Code */}
                <div className="p-3 bg-white rounded-3 shadow-sm mb-3 d-inline-block">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 200 200"
                    style={{ width: '160px', height: '160px' }}
                  >
                    {/* Simplified decorative high-contrast QR mockup */}
                    <rect width="200" height="200" fill="#ffffff" />
                    {/* Top-Left Finder */}
                    <rect x="10" y="10" width="50" height="50" fill="#1e293b" rx="4" />
                    <rect x="20" y="20" width="30" height="30" fill="#ffffff" rx="2" />
                    <rect x="27" y="27" width="16" height="16" fill="#1e293b" rx="1" />
                    {/* Top-Right Finder */}
                    <rect x="140" y="10" width="50" height="50" fill="#1e293b" rx="4" />
                    <rect x="150" y="20" width="30" height="30" fill="#ffffff" rx="2" />
                    <rect x="157" y="27" width="16" height="16" fill="#1e293b" rx="1" />
                    {/* Bottom-Left Finder */}
                    <rect x="10" y="140" width="50" height="50" fill="#1e293b" rx="4" />
                    <rect x="20" y="150" width="30" height="30" fill="#ffffff" rx="2" />
                    <rect x="27" y="157" width="16" height="16" fill="#1e293b" rx="1" />
                    {/* Pattern bits */}
                    <rect x="75" y="15" width="12" height="12" fill="#1e293b" />
                    <rect x="100" y="15" width="20" height="12" fill="#1e293b" />
                    <rect x="75" y="35" width="20" height="12" fill="#1e293b" />
                    <rect x="110" y="40" width="12" height="12" fill="#1e293b" />
                    <rect x="15" y="75" width="12" height="20" fill="#1e293b" />
                    <rect x="35" y="85" width="20" height="12" fill="#1e293b" />
                    <rect x="70" y="70" width="60" height="60" fill="#2563eb" rx="6" />
                    <text x="100" y="106" fill="#ffffff" fontSize="18" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">MS</text>
                    <rect x="145" y="75" width="20" height="12" fill="#1e293b" />
                    <rect x="175" y="85" width="12" height="20" fill="#1e293b" />
                    <rect x="75" y="145" width="20" height="12" fill="#1e293b" />
                    <rect x="105" y="155" width="12" height="20" fill="#1e293b" />
                    <rect x="140" y="140" width="12" height="12" fill="#1e293b" />
                    <rect x="165" y="145" width="20" height="12" fill="#1e293b" />
                    <rect x="145" y="170" width="30" height="15" fill="#1e293b" />
                  </svg>
                </div>
                <div className="fw-bold text-dark small text-uppercase">Scan with Phone Camera</div>
                <div className="text-muted extra-small">Instant mobile access</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature Highlights ── */}
      <section className="py-5 bg-light">
        <div className="container" style={{ maxWidth: '1000px' }}>
          <div className="text-center mb-5">
            <h3 className="fw-bold text-dark">Built for Construction & Interior Teams</h3>
            <p className="text-muted">Everything you need to capture measurements on site and generate billing.</p>
          </div>

          <div className="row g-4 text-center">
            <div className="col-12 col-md-4">
              <div className="p-4 bg-white rounded-3 shadow-sm h-100">
                <i className="bi bi-calculator fs-1 text-primary mb-3 d-inline-block"></i>
                <h5 className="fw-bold">Dynamic Calculations</h5>
                <p className="text-muted small mb-0">Automatic deduplication, math expressions, and instant area/volume rollups.</p>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="p-4 bg-white rounded-3 shadow-sm h-100">
                <i className="bi bi-file-earmark-pdf fs-1 text-danger mb-3 d-inline-block"></i>
                <h5 className="fw-bold">PDF & Excel Reports</h5>
                <p className="text-muted small mb-0">One-click professional measurement sheets, client summaries, and RA bill exports.</p>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="p-4 bg-white rounded-3 shadow-sm h-100">
                <i className="bi bi-cloud-arrow-up fs-1 text-success mb-3 d-inline-block"></i>
                <h5 className="fw-bold">Atlas Cloud Sync</h5>
                <p className="text-muted small mb-0">Work offline and sync seamlessly with MongoDB Atlas whenever connected.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="mt-auto bg-dark text-white py-4 border-top border-secondary border-opacity-25 text-center">
        <div className="container">
          <div className="d-flex flex-wrap justify-content-center align-items-center gap-3 mb-3">
            <Link to="/download" className="text-light text-decoration-none small text-uppercase fw-semibold">
              Download Apps
            </Link>
            <span className="text-secondary">&bull;</span>
            <Link to="/login" className="text-light text-decoration-none small text-uppercase fw-semibold">
              Login to Web App
            </Link>
          </div>
          <div className="text-secondary extra-small text-uppercase">
            &copy; {new Date().getFullYear()} MTS Decor &bull; Civil & Interior Measurement Sheet Software
          </div>
          <div className="text-muted extra-small mt-1">
            Crafted with precision by Hitesh Jagdish Suthar
          </div>
        </div>
      </footer>
    </div>
  );
}
