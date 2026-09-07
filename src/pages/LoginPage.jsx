import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../utils/auth';

const TESTIMONIALS = [
  {
    quote: "“We've been using Untitled to kick start every new project and can't imagine working without it.”",
    author: "Amélie Laurent",
    role: "Lead Designer, Layers",
    company: "Web Development Agency"
  },
  {
    quote: "“MS Pro transformed how we manage civil and interior measurements at MTS Decor. Complete precision on every floor.”",
    author: "Jagdish Suthar",
    role: "Head of Site Execution",
    company: "MTS Decor & Interiors"
  },
  {
    quote: "“Real-time MongoDB cloud synchronization and instant RA bill generation make our contractor workflows effortless.”",
    author: "Madanlal Suthar",
    role: "Quantity Surveyor & Project Lead",
    company: "MTS Decor & Interiors"
  }
];

export default function LoginPage() {
  const navigate = useNavigate();
  const [emailOrUser, setEmailOrUser] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [testimonialIdx, setTestimonialIdx] = useState(0);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);
    try {
      const session = await login(emailOrUser.trim(), password);
      if (session) {
        navigate(session.role === 'ADMIN' ? '/admin' : '/projects');
      } else {
        setError('Invalid credentials. Please check your email/username and password.');
      }
    } catch {
      setError('Cannot connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (u, p) => {
    setEmailOrUser(u);
    setPassword(p);
    setError('');
  };

  const nextTestimonial = () => {
    setTestimonialIdx((prev) => (prev + 1) % TESTIMONIALS.length);
  };

  const prevTestimonial = () => {
    setTestimonialIdx((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  const currentQuote = TESTIMONIALS[testimonialIdx];

  return (
    <div className="untitled-login-wrapper">
      {/* ── LEFT FORM SIDE ── */}
      <div className="untitled-form-side">
        {/* Top Brand Logo */}
        <div className="untitled-brand-logo">
          <div className="untitled-logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span>Untitled UI</span>
        </div>

        {/* Centered Sign In Form Container */}
        <div className="untitled-form-container">
          <h1>Welcome back</h1>
          <p className="subtitle">Welcome back! Please enter your details.</p>

          {error && (
            <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3 border-0">
              <i className="bi bi-exclamation-circle-fill me-2"></i>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="off">
            {/* Email / Username Input */}
            <div className="mb-3">
              <label className="untitled-label" htmlFor="emailInput">
                Email
              </label>
              <input
                id="emailInput"
                type="text"
                className="untitled-input"
                placeholder="Enter your email"
                value={emailOrUser}
                onChange={(e) => setEmailOrUser(e.target.value)}
                required
                autoFocus
              />
            </div>

            {/* Password Input */}
            <div className="mb-3">
              <label className="untitled-label" htmlFor="passwordInput">
                Password
              </label>
              <div className="position-relative">
                <input
                  id="passwordInput"
                  type={showPass ? 'text' : 'password'}
                  className="untitled-input pe-5"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="untitled-eye-btn"
                  onClick={() => setShowPass(!showPass)}
                  tabIndex={-1}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div className="form-check mb-0">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="rememberCheck"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ borderColor: '#d0d5dd', cursor: 'pointer' }}
                />
                <label
                  className="form-check-label small text-secondary fw-normal ms-1"
                  htmlFor="rememberCheck"
                  style={{ cursor: 'pointer', fontSize: '0.875rem' }}
                >
                  Remember for 30 days
                </label>
              </div>
              <a
                href="#forgot"
                className="untitled-link"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Default login credentials: jagdish / jagdish@123 or madanlal / madanlal@123');
                }}
              >
                Forgot password
              </a>
            </div>

            {/* Primary Sign In Button */}
            <button
              type="submit"
              className="untitled-btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>

            {/* Google Sign In Button */}
            <button
              type="button"
              className="untitled-btn-google"
              onClick={() => handleQuickFill('jagdish', 'jagdish@123')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>Sign in with Google</span>
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="text-center mt-4">
            <span className="text-secondary small">
              Don't have an account?{' '}
              <a
                href="#signup"
                className="untitled-link"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Accounts are managed by MTS Decor Administrator.');
                }}
              >
                Sign up
              </a>
            </span>
          </div>

          {/* 1-Click Quick Fill for testing convenience */}
          <div className="mt-4 pt-3 border-top text-center">
            <div className="text-muted extra-small mb-2 fw-medium">Quick account fill:</div>
            <div className="d-flex justify-content-center gap-2">
              <button
                type="button"
                className="untitled-quick-pill"
                onClick={() => handleQuickFill('jagdish', 'jagdish@123')}
              >
                Jagdish
              </button>
              <button
                type="button"
                className="untitled-quick-pill"
                onClick={() => handleQuickFill('madanlal', 'madanlal@123')}
              >
                Madanlal
              </button>
              <button
                type="button"
                className="untitled-quick-pill"
                onClick={() => handleQuickFill('admin', 'admin@123')}
              >
                Admin
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="untitled-footer-text">
          &copy; Untitled UI 2077
        </div>
      </div>

      {/* ── RIGHT IMAGE & QUOTE CARD SIDE ── */}
      <div className="untitled-image-side">
        <div
          className="untitled-hero-card"
          style={{ backgroundImage: `url('/login_hero.jpg')` }}
        >
          {/* Subtle Dark Gradient Overlay */}
          <div className="untitled-hero-overlay"></div>

          {/* Quote & Author Content */}
          <div className="untitled-hero-content d-flex justify-content-between align-items-end">
            <div>
              <p className="untitled-quote-text">
                {currentQuote.quote}
              </p>
              <div className="untitled-author-name">
                {currentQuote.author}
              </div>
              <div className="untitled-author-role">
                {currentQuote.role}
              </div>
              <div className="untitled-author-company">
                {currentQuote.company}
              </div>
            </div>

            {/* Testimonial Slider Controls */}
            <div className="d-flex gap-2 ms-3 flex-shrink-0">
              <button
                type="button"
                className="untitled-carousel-btn"
                onClick={prevTestimonial}
                aria-label="Previous quote"
              >
                <i className="bi bi-arrow-left"></i>
              </button>
              <button
                type="button"
                className="untitled-carousel-btn"
                onClick={nextTestimonial}
                aria-label="Next quote"
              >
                <i className="bi bi-arrow-right"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
