import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginInit, loginVerify2FA } from '../utils/auth';
import { getFounderSlides } from '../utils/storage';

const DEFAULT_SLIDES = [
  {
    name: 'Jagdish Suthar',
    role: 'Founder & Managing Director',
    company: 'MTS Decor & Interiors',
    quote: '“Precision in civil and interior measurements is the foundation of flawless execution. MS Pro ensures every site calculation is 100% accurate.”',
    imageUrl: '/login_hero.jpg'
  },
  {
    name: 'Madanlal Suthar',
    role: 'Co-Founder & Technical Lead',
    company: 'MTS Decor & Interiors',
    quote: '“Our goal with MTS Decor has always been trust and perfection. Real-time cloud synchronization empowers our team to deliver on time, every time.”',
    imageUrl: '/login_hero.jpg'
  }
];

export default function LoginPage() {
  const navigate = useNavigate();

  // Step 1: Credentials | Step 2: Two-Step 6-Digit Verification
  const [step, setStep] = useState(1);
  const [emailOrUser, setEmailOrUser] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 2FA state
  const [twoFAData, setTwoFAData] = useState(null);
  const [otpCode, setOtpCode] = useState('');

  // Founder Slides
  const [slides, setSlides] = useState(DEFAULT_SLIDES);
  const [testimonialIdx, setTestimonialIdx] = useState(0);

  // Load founder slides from MongoDB Atlas
  useEffect(() => {
    getFounderSlides()
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setSlides(data);
        }
      })
      .catch(() => {});
  }, []);

  // Automatic sliding every 6 seconds
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setTestimonialIdx(prev => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [slides.length]);

  // Step 1 Submit: Validate credentials and initialize 2FA
  const handleStep1Submit = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await loginInit(emailOrUser.trim(), password);
      if (res && res.require2FA) {
        setTwoFAData(res);
        setOtpCode(res.verificationCode || '');
        setStep(2);
      } else {
        setError('Invalid credentials. Please check your username and password.');
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials or server unavailable.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 Submit: Verify 6-digit OTP code
  const handleVerify2FASubmit = async (e) => {
    e?.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const session = await loginVerify2FA(twoFAData.challengeId, otpCode.trim());
      if (session) {
        navigate(session.role === 'ADMIN' ? '/admin' : '/projects');
      } else {
        setError('Verification failed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  const nextTestimonial = () => {
    setTestimonialIdx((prev) => (prev + 1) % slides.length);
  };

  const prevTestimonial = () => {
    setTestimonialIdx((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const currentQuote = slides[testimonialIdx] || slides[0] || DEFAULT_SLIDES[0];

  return (
    <div className="untitled-login-wrapper">
      {/* ── LEFT FORM SIDE ── */}
      <div className="untitled-form-side">
        {/* Top Brand Logo */}
        <div className="untitled-brand-logo mb-4">
          <img
            src="/mtsdecor.png"
            alt="MTS Decor"
            style={{ height: '44px', maxWidth: '170px', objectFit: 'contain' }}
            onError={(e) => { e.target.onerror = null; e.target.src = '/logo.png'; }}
          />
        </div>

        {/* Form Container */}
        <div className="untitled-form-container">
          {error && (
            <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3 border-0">
              <i className="bi bi-exclamation-circle-fill me-2"></i>
              {error}
            </div>
          )}

          {/* STEP 1: Enter Username & Password */}
          {step === 1 && (
            <>
              <h1>Welcome back</h1>
              <p className="subtitle">Please enter your credentials to proceed.</p>

              <form onSubmit={handleStep1Submit} autoComplete="off">
                {/* Email / Username Input */}
                <div className="mb-3">
                  <label className="untitled-label" htmlFor="emailInput">
                    Username or Email
                  </label>
                  <input
                    id="emailInput"
                    type="text"
                    className="untitled-input"
                    placeholder="ENTER YOUR USERNAME"
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

                {/* Remember Me */}
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
                  <span className="badge bg-light text-dark border extra-small text-uppercase">
                    <i className="bi bi-shield-check text-success me-1"></i>2FA ENABLED
                  </span>
                </div>

                {/* Submit Credentials Button */}
                <button
                  type="submit"
                  className="untitled-btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Authenticating...
                    </>
                  ) : (
                    'Continue with Two-Step Verification →'
                  )}
                </button>
              </form>
            </>
          )}

          {/* STEP 2: Two-Step 6-Digit Number Verification */}
          {step === 2 && (
            <div>
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="p-2 bg-primary bg-opacity-10 text-primary rounded-circle">
                  <i className="bi bi-shield-lock-fill fs-4"></i>
                </span>
                <div>
                  <h3 className="mb-0 fw-bold">Two-Step Verification</h3>
                  <div className="extra-small text-muted text-uppercase">STEP 2 OF 2 &bull; 6-DIGIT CODE</div>
                </div>
              </div>

              <p className="subtitle mt-2">
                Hello <strong>{twoFAData?.name || twoFAData?.username}</strong>, enter the 6-digit security code to verify your sign-in.
              </p>

              {/* Display code alert */}
              {twoFAData?.verificationCode && (
                <div className="alert alert-primary py-2 px-3 rounded-3 mb-4 border d-flex align-items-center justify-content-between">
                  <div>
                    <span className="extra-small fw-bold text-uppercase d-block text-secondary">
                      SECURITY VERIFICATION CODE:
                    </span>
                    <span className="fs-4 fw-bolder font-monospace text-primary tracking-wider">
                      {twoFAData.verificationCode}
                    </span>
                  </div>
                  <span className="badge bg-primary px-2 py-1 extra-small">
                    <i className="bi bi-clock-history me-1"></i>VALID FOR 5 MIN
                  </span>
                </div>
              )}

              <form onSubmit={handleVerify2FASubmit} autoComplete="off">
                <div className="mb-4">
                  <label className="untitled-label mb-2" htmlFor="otpInput">
                    ENTER 6-DIGIT CODE
                  </label>
                  <input
                    id="otpInput"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    className="form-control otp-input-field w-100"
                    placeholder="000000"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  className="untitled-btn-primary"
                  disabled={loading || otpCode.length !== 6}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Verifying...
                    </>
                  ) : (
                    'Verify & Sign in'
                  )}
                </button>

                <div className="text-center mt-3">
                  <button
                    type="button"
                    className="btn btn-link text-decoration-none text-muted extra-small text-uppercase fw-bold p-0"
                    onClick={() => { setStep(1); setError(''); }}
                  >
                    ← BACK TO LOGIN
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Bottom Copyright */}
        <div className="untitled-footer-text mt-4">
          &copy; MTS Decor {new Date().getFullYear()} &bull; All Rights Reserved
        </div>
      </div>

      {/* ── RIGHT IMAGE & QUOTE CARD SIDE (FOUNDER SLIDES) ── */}
      <div className="untitled-image-side">
        <div className="untitled-hero-card position-relative overflow-hidden">
          {/* Active Founder Image */}
          <img
            key={currentQuote.imageUrl || testimonialIdx}
            src={currentQuote.imageUrl || '/login_hero.jpg'}
            alt={currentQuote.name || 'Founder'}
            className="position-absolute top-0 start-0 w-100 h-100"
            style={{ objectFit: 'cover', zIndex: 1, transition: 'opacity 0.5s ease' }}
            onError={(e) => { e.target.onerror = null; e.target.src = '/login_hero.jpg'; }}
          />

          {/* Dark Gradient Overlay for Readability */}
          <div className="untitled-hero-overlay" style={{ zIndex: 2 }}></div>

          {/* Quote & Author Content */}
          <div className="untitled-hero-content d-flex justify-content-between align-items-end" style={{ zIndex: 3 }}>
            <div>
              <p className="untitled-quote-text">
                {currentQuote.quote}
              </p>
              <div className="untitled-author-name">
                {currentQuote.name || 'MTS Decor Founder'}
              </div>
              <div className="untitled-author-role">
                {currentQuote.role || 'Founder'}
              </div>
              <div className="untitled-author-company">
                {currentQuote.company || 'MTS Decor & Interiors'}
              </div>

              {/* Slide dots indicator */}
              {slides.length > 1 && (
                <div className="d-flex gap-1 mt-3">
                  {slides.map((_, i) => (
                    <span
                      key={i}
                      onClick={() => setTestimonialIdx(i)}
                      style={{
                        width: testimonialIdx === i ? '24px' : '8px',
                        height: '8px',
                        borderRadius: '4px',
                        backgroundColor: testimonialIdx === i ? '#ffffff' : 'rgba(255, 255, 255, 0.4)',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer'
                      }}
                      title={`Slide ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Testimonial Slider Controls */}
            <div className="d-flex gap-2 ms-3 flex-shrink-0">
              <button
                type="button"
                className="untitled-carousel-btn"
                onClick={prevTestimonial}
                aria-label="Previous slide"
              >
                <i className="bi bi-arrow-left"></i>
              </button>
              <button
                type="button"
                className="untitled-carousel-btn"
                onClick={nextTestimonial}
                aria-label="Next slide"
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
