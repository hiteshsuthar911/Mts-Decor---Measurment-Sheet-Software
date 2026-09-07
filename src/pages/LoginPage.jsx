import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../utils/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [oauthToast, setOauthToast] = useState('');

  // 36 colorful glass mosaic tiles for shimmering background
  const tiles = [
    'tile-amber', 'tile-cyan', 'tile-emerald', 'tile-violet', 'tile-rose', 'tile-blue',
    'tile-cyan', 'tile-emerald', 'tile-violet', 'tile-amber', 'tile-blue', 'tile-rose',
    'tile-violet', 'tile-rose', 'tile-blue', 'tile-cyan', 'tile-emerald', 'tile-amber',
    'tile-emerald', 'tile-amber', 'tile-cyan', 'tile-rose', 'tile-violet', 'tile-blue',
    'tile-blue', 'tile-violet', 'tile-rose', 'tile-amber', 'tile-cyan', 'tile-emerald',
    'tile-rose', 'tile-cyan', 'tile-amber', 'tile-blue', 'tile-emerald', 'tile-violet',
  ];

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);
    try {
      const session = await login(username.trim(), password);
      if (session) {
        navigate(session.role === 'ADMIN' ? '/admin' : '/projects');
      } else {
        setError('INVALID USERNAME OR PASSWORD. PLEASE CHECK CREDENTIALS.');
      }
    } catch {
      setError('CANNOT REACH CLOUD SERVER. IS THE BACKEND RUNNING?');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (user, pass) => {
    setUsername(user);
    setPassword(pass);
    setError('');
  };

  const handleOAuthClick = (provider) => {
    setOauthToast(`${provider.toUpperCase()} SSO: FOR DEMO, USE 1-CLICK QUICK ACCESS BELOW`);
    setTimeout(() => setOauthToast(''), 4000);
  };

  return (
    <div className="login-split-page">
      {/* Background Gradient Mesh */}
      <div className="login-mesh-bg"></div>

      {/* Floating Animated Light Orbs */}
      <div className="light-orb orb-1"></div>
      <div className="light-orb orb-2"></div>
      <div className="light-orb orb-3"></div>

      {/* Shimmering Colorful Glass Tiles Background */}
      <div className="shimmer-glass-grid">
        {tiles.map((tileClass, i) => (
          <div key={i} className={`glass-mosaic-tile ${tileClass}`}></div>
        ))}
      </div>

      {/* OAuth Notification Toast */}
      {oauthToast && (
        <div className="position-fixed top-0 start-50 translate-middle-x p-3" style={{ zIndex: 9999 }}>
          <div className="toast show bg-dark text-white border border-primary px-3 py-2 rounded shadow-lg">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-info-circle-fill text-info fs-5"></i>
              <span className="small fw-bold text-uppercase">{oauthToast}</span>
            </div>
          </div>
        </div>
      )}

      {/* Split Layout Container */}
      <div className="login-split-wrapper">
        {/* ── LEFT HERO BRANDING COLUMN ── */}
        <div className="login-brand-col">
          {/* Top Brand Tag */}
          <div>
            <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill bg-white bg-opacity-10 border border-white border-opacity-25 text-white small fw-bold text-uppercase mb-4">
              <span className="fs-6">📐</span>
              <span>MS PRO &bull; ENTERPRISE CLOUD</span>
              <span className="badge bg-success bg-opacity-75 rounded-pill px-2">v2.0</span>
            </div>

            <h1 className="display-5 fw-bolder text-white text-uppercase tracking-wider mb-3" style={{ lineHeight: 1.15 }}>
              MTS DECOR <br />
              <span style={{
                background: 'linear-gradient(135deg, #60a5fa 0%, #34d399 50%, #fbbf24 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                MEASUREMENT &amp; RA BILL
              </span>
            </h1>

            <p className="text-light text-opacity-75 text-uppercase fw-medium mb-4" style={{ maxWidth: '520px', fontSize: '0.95rem' }}>
              Civil contractor &amp; interior measurement software with automated formula calculations, cross-user edit verification, and live MongoDB Atlas Cloud sync.
            </p>
          </div>

          {/* Shimmering Glass Feature Highlights */}
          <div className="d-flex flex-column gap-3 my-4" style={{ maxWidth: '540px' }}>
            <div className="hero-glass-card d-flex align-items-center gap-3">
              <div className="p-3 rounded-3 bg-primary bg-opacity-25 text-primary fs-4">
                <i className="bi bi-calculator-fill text-info"></i>
              </div>
              <div>
                <div className="text-white fw-bold text-uppercase small">AUTOMATED FORMULA CALCULATION</div>
                <div className="text-light text-opacity-50 extra-small text-uppercase mt-1">
                  Instant multiplication for SFT &amp; RFT with automatic LESS / deductions handling.
                </div>
              </div>
            </div>

            <div className="hero-glass-card d-flex align-items-center gap-3">
              <div className="p-3 rounded-3 bg-success bg-opacity-25 text-success fs-4">
                <i className="bi bi-shield-lock-fill text-success"></i>
              </div>
              <div>
                <div className="text-white fw-bold text-uppercase small">CROSS-USER PROJECT SHARING &amp; GUARD</div>
                <div className="text-light text-opacity-50 extra-small text-uppercase mt-1">
                  Jagdish and Madanlal collaborate seamlessly with password-verified edit locks.
                </div>
              </div>
            </div>

            <div className="hero-glass-card d-flex align-items-center gap-3">
              <div className="p-3 rounded-3 bg-warning bg-opacity-25 text-warning fs-4">
                <i className="bi bi-cloud-check-fill text-warning"></i>
              </div>
              <div>
                <div className="text-white fw-bold text-uppercase small">MONGODB ATLAS CLOUD SYNC</div>
                <div className="text-light text-opacity-50 extra-small text-uppercase mt-1">
                  Direct database persistence with auto-save and zero data loss on field devices.
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Trust Metrics */}
          <div className="pt-3 border-top border-white border-opacity-10 d-flex flex-wrap gap-4 text-uppercase">
            <div>
              <div className="fs-5 fw-bolder text-white">100%</div>
              <div className="extra-small text-light text-opacity-50 fw-semibold">ACCURATE QUANTITIES</div>
            </div>
            <div>
              <div className="fs-5 fw-bolder text-info">CLOUD</div>
              <div className="extra-small text-light text-opacity-50 fw-semibold">REAL-TIME ATLAS DB</div>
            </div>
            <div>
              <div className="fs-5 fw-bolder text-warning">RA BILL</div>
              <div className="extra-small text-light text-opacity-50 fw-semibold">RATE &amp; GST READY</div>
            </div>
          </div>
        </div>

        {/* ── RIGHT SIGN-IN FORM COLUMN ── */}
        <div className="login-form-col">
          <div className="login-glass-box">
            {/* Form Header */}
            <div className="text-center mb-4">
              <div className="d-inline-flex p-3 rounded-circle bg-primary bg-opacity-20 text-primary mb-3 shadow">
                <span className="fs-3">📐</span>
              </div>
              <h3 className="fw-bolder text-white text-uppercase tracking-wider mb-1">
                WELCOME BACK
              </h3>
              <div className="text-light text-opacity-50 extra-small text-uppercase fw-semibold">
                SIGN IN TO ACCESS MEASUREMENT PROJECTS
              </div>
            </div>

            {/* ── OAuth Buttons ── */}
            <div className="d-flex flex-column gap-2 mb-3">
              {/* Google OAuth Button */}
              <button
                type="button"
                className="oauth-btn"
                onClick={() => handleOAuthClick('Google')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span>CONTINUE WITH GOOGLE</span>
              </button>

              {/* Microsoft OAuth Button */}
              <button
                type="button"
                className="oauth-btn"
                onClick={() => handleOAuthClick('Microsoft')}
              >
                <svg width="18" height="18" viewBox="0 0 23 23">
                  <path fill="#f35325" d="M1 1h10v10H1z"/>
                  <path fill="#81bc06" d="M12 1h10v10H12z"/>
                  <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                  <path fill="#ffba08" d="M12 12h10v10H12z"/>
                </svg>
                <span>CONTINUE WITH MICROSOFT</span>
              </button>
            </div>

            {/* Divider */}
            <div className="login-divider">
              OR SIGN IN WITH CREDENTIALS
            </div>

            {/* Error Message */}
            {error && (
              <div className="alert alert-danger border-0 text-uppercase extra-small fw-bold py-2 px-3 mb-3">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {error}
              </div>
            )}

            {/* ── Sign-In Form ── */}
            <form onSubmit={handleSubmit} autoComplete="off">
              {/* Username Field */}
              <div className="mb-3">
                <label className="form-label text-uppercase fw-bold extra-small text-light text-opacity-75 mb-1">
                  <i className="bi bi-person-fill me-1 text-info"></i> USERNAME
                </label>
                <div className="input-group login-input-group">
                  <span className="input-group-text"><i className="bi bi-person"></i></span>
                  <input
                    type="text"
                    className="form-control fw-semibold text-uppercase"
                    placeholder="ENTER YOUR USERNAME"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="mb-3">
                <label className="form-label text-uppercase fw-bold extra-small text-light text-opacity-75 mb-1">
                  <i className="bi bi-lock-fill me-1 text-warning"></i> PASSWORD
                </label>
                <div className="input-group login-input-group">
                  <span className="input-group-text"><i className="bi bi-shield-lock"></i></span>
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="form-control fw-semibold"
                    placeholder="ENTER YOUR PASSWORD"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-eye"
                    onClick={() => setShowPass(!showPass)}
                    tabIndex={-1}
                  >
                    <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
              </div>

              {/* Remember Me & Help */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="form-check mb-0">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="rememberCheck"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                  />
                  <label className="form-check-label extra-small text-light text-opacity-75 text-uppercase fw-semibold" htmlFor="rememberCheck">
                    REMEMBER ME
                  </label>
                </div>
                <span className="extra-small text-info text-uppercase fw-bold" style={{ cursor: 'pointer' }} onClick={() => handleQuickFill('jagdish', 'jagdish@123')}>
                  NEED HELP?
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn btn-login-submit w-100 mb-3"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    VERIFYING...
                  </>
                ) : (
                  <>
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    SIGN IN TO CLOUD
                  </>
                )}
              </button>
            </form>

            {/* Quick 1-Click Role Login Pills */}
            <div className="pt-3 border-top border-white border-opacity-10 text-center">
              <div className="text-light text-opacity-50 extra-small text-uppercase fw-bold mb-2">
                ⚡ 1-CLICK QUICK TEST LOGIN:
              </div>
              <div className="d-flex flex-wrap justify-content-center gap-1">
                <button
                  type="button"
                  className="user-pill-btn"
                  onClick={() => handleQuickFill('jagdish', 'jagdish@123')}
                  title="Click to autofill Jagdish credentials"
                >
                  <i className="bi bi-person-fill me-1 text-info"></i> JAGDISH
                </button>
                <button
                  type="button"
                  className="user-pill-btn"
                  onClick={() => handleQuickFill('madanlal', 'madanlal@123')}
                  title="Click to autofill Madanlal credentials"
                >
                  <i className="bi bi-person-fill me-1 text-warning"></i> MADANLAL
                </button>
                <button
                  type="button"
                  className="user-pill-btn user-pill-admin"
                  onClick={() => handleQuickFill('admin', 'admin@123')}
                  title="Click to autofill Admin credentials"
                >
                  <i className="bi bi-shield-fill me-1"></i> ADMIN
                </button>
              </div>
            </div>

            {/* Security Badge Footer */}
            <div className="text-center mt-3 text-light text-opacity-40 extra-small text-uppercase">
              <i className="bi bi-shield-check me-1 text-success"></i> 256-BIT SSL &bull; MONGODB ATLAS SECURE
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
