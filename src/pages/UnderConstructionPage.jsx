import React from 'react';
import { Link, useParams } from 'react-router-dom';

export default function UnderConstructionPage() {
  const { companySlug } = useParams();

  return (
    <div
      className="min-vh-100 d-flex flex-column justify-content-between"
      style={{ backgroundColor: '#f8fafc', color: '#0f172a', fontFamily: 'var(--ms-font-family)' }}
    >
      {/* Top Navbar */}
      <header className="bg-white border-bottom py-3 px-4 shadow-sm">
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <img
              src="/mtsdecor.png"
              alt="MTS Decor"
              style={{ height: '32px', maxWidth: '140px', objectFit: 'contain' }}
              onError={(e) => { e.target.onerror = null; e.target.src = '/logo.png'; }}
            />
            <span className="fw-bolder fs-5 text-dark text-uppercase tracking-wider">MS PRO</span>
          </div>
          <Link
            to="/login"
            className="btn btn-outline-dark btn-sm extra-small fw-bold text-uppercase px-3"
            style={{ borderRadius: '8px' }}
          >
            <i className="bi bi-box-arrow-in-right me-1"></i> MTS LOGIN
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container my-auto py-5 text-center">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6">
            <div className="card border-0 shadow-sm p-4 p-md-5" style={{ borderRadius: '16px', backgroundColor: '#ffffff' }}>
              {/* Construction Icon */}
              <div
                className="mx-auto mb-4 d-flex align-items-center justify-content-center"
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: '#fef3c7',
                  color: '#d97706',
                  fontSize: '36px',
                }}
              >
                <i className="bi bi-cone-striped"></i>
              </div>

              {/* Status Badge */}
              <div className="mb-3">
                <span
                  className="badge px-3 py-2 text-uppercase fw-bold"
                  style={{
                    backgroundColor: '#fffbeb',
                    color: '#b45309',
                    border: '1px solid #fde68a',
                    fontSize: '12px',
                    letterSpacing: '0.8px',
                  }}
                >
                  <i className="bi bi-tools me-1"></i> PAGE UNDER CONSTRUCTION
                </span>
              </div>

              <h2 className="fw-bolder text-uppercase mb-2" style={{ letterSpacing: '0.5px' }}>
                CLIENT PORTAL ON HOLD
              </h2>

              {companySlug && (
                <div className="mb-3">
                  <span className="badge bg-light text-secondary border font-monospace px-3 py-1">
                    PORTAL: /c/{companySlug}
                  </span>
                </div>
              )}

              <p className="text-muted small mb-4" style={{ lineHeight: 1.6 }}>
                The multi-company client portal service is currently being upgraded and is temporarily on hold.
                All core measurement sheets, contractor project calculations, and cloud databases are 100% active on the main system.
              </p>

              <div className="d-flex flex-wrap justify-content-center gap-3">
                <Link
                  to="/login"
                  className="btn btn-primary fw-bold text-uppercase px-4 py-2"
                  style={{ borderRadius: '8px' }}
                >
                  <i className="bi bi-person-fill me-1"></i> GO TO LOGIN
                </Link>
                <Link
                  to="/download"
                  className="btn btn-outline-secondary fw-bold text-uppercase px-4 py-2"
                  style={{ borderRadius: '8px' }}
                >
                  <i className="bi bi-phone me-1"></i> DOWNLOAD APPS
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-3 text-center text-muted extra-small text-uppercase border-top bg-white">
        &copy; {new Date().getFullYear()} MTS DECOR &bull; CIVIL &amp; INTERIOR CONTRACTOR SYSTEM
      </footer>
    </div>
  );
}
