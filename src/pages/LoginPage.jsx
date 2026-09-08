import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginInit, loginVerify2FA } from '../utils/auth';
import { getFounderSlides } from '../utils/storage';
import AppStoreBadges from '../components/AppStoreBadges';
import UiverseLoginButton from '../components/UiverseLoginButton';

const STATIC_FOUNDER_SLIDES = [
  {
    name: 'MADANLAL T SUTHAR',
    role: 'FOUNDER',
    company: 'MTS Decor',
    quote: 'True quality starts where no one looks—in the concrete, framing, and waterproofing—long before the marble is laid or the lighting is installed.',
    imageUrl: '/founder_madanlal.jpg',
  },
  {
    name: 'JAGDISH SUTHAR',
    role: 'FOUNDER',
    company: 'MTS Decor',
    quote: 'Every millimeter counts on site. Master craftsmanship is not just what you build, but the precision, dedication, and integrity you build it with.',
    imageUrl: '/founder_jagdish.jpg',
  }
];

export default function LoginPage() {
  const navigate = useNavigate();

  // Official MTS DECOR Website URL
  const websiteUrl = 'https://mts-decor-website.onrender.com';

  // Step 1: Credentials | Step 2: Two-Step 6-Digit Verification
  const [step, setStep] = useState(1);
  const [emailOrUser, setEmailOrUser] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Cloudflare Turnstile Verification State (Free Human / Bot Defense)
  const [cfToken, setCfToken] = useState('');
  const [cfVerified, setCfVerified] = useState(false);
  const turnstileContainerRef = useRef(null);
  const turnstileWidgetId = useRef(null);

  // 2FA state
  const [twoFAData, setTwoFAData] = useState(null);
  const [otpCode, setOtpCode] = useState('');

  // Permanent Static Founder Slides for Both Founders (Always visible, never disappears on refresh)
  const [slides, setSlides] = useState(() => {
    try {
      const cached = localStorage.getItem('MTS_FOUNDER_SLIDES_CACHE');
      const parsed = cached ? JSON.parse(cached) : null;
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
    return STATIC_FOUNDER_SLIDES;
  });
  const [testimonialIdx, setTestimonialIdx] = useState(0);

  // Initialize Cloudflare Turnstile Human Verification Widget
  useEffect(() => {
    if (step !== 1) return;

    const siteKey = import.meta.env.VITE_CLOUDFLARE_SITE_KEY || '0x4AAAAAAErkNoW--wJDYO0C';

    const renderTurnstile = () => {
      if (window.turnstile && turnstileContainerRef.current && !turnstileWidgetId.current) {
        try {
          turnstileWidgetId.current = window.turnstile.render(turnstileContainerRef.current, {
            sitekey: siteKey,
            theme: 'light',
            callback: (token) => {
              setCfToken(token);
              setCfVerified(true);
            },
            'expired-callback': () => {
              setCfToken('');
              setCfVerified(false);
            },
            'error-callback': () => {
              // If Turnstile blocked or network unavailable, allow graceful bypass
              setCfVerified(true);
            },
          });
        } catch (e) {
          setCfVerified(true);
        }
      }
    };

    if (window.turnstile) {
      renderTurnstile();
    } else {
      const timer = setInterval(() => {
        if (window.turnstile) {
          clearInterval(timer);
          renderTurnstile();
        }
      }, 300);
      return () => clearInterval(timer);
    }
  }, [step]);

  // Load founder slides uploaded by admin from MongoDB Atlas
  useEffect(() => {
    getFounderSlides()
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setSlides(data);
          try {
            localStorage.setItem('MTS_FOUNDER_SLIDES_CACHE', JSON.stringify(data));
          } catch {}
        } else {
          setSlides(STATIC_FOUNDER_SLIDES);
        }
      })
      .catch(() => {
        setSlides(STATIC_FOUNDER_SLIDES);
      });
  }, []);

  // Automatic sliding every 6 seconds if multiple slides exist
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
      const res = await loginInit(emailOrUser.trim(), password, cfToken);
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
    if (slides.length > 0) {
      setTestimonialIdx((prev) => (prev + 1) % slides.length);
    }
  };

  const prevTestimonial = () => {
    if (slides.length > 0) {
      setTestimonialIdx((prev) => (prev - 1 + slides.length) % slides.length);
    }
  };

  const currentQuote = (slides.length > 0 ? (slides[testimonialIdx] || slides[0]) : null) || STATIC_FOUNDER_SLIDES[0];

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
                  <label className="untitled-label text-uppercase" htmlFor="emailInput">
                    User ID or Email
                  </label>
                  <input
                    id="emailInput"
                    type="text"
                    className="untitled-input text-uppercase"
                    placeholder="ENTER YOUR USER ID OR EMAIL"
                    value={emailOrUser}
                    onChange={(e) => setEmailOrUser(e.target.value.toUpperCase())}
                    style={{ textTransform: 'uppercase' }}
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

                {/* Cloudflare Turnstile Human Verification Screen (Free Bot Defense) */}
                <div className="mb-3 d-flex flex-column align-items-center">
                  <div ref={turnstileContainerRef} id="cf-turnstile-container" style={{ minHeight: '65px' }}></div>
                </div>

                {/* Hidden submit button for native Enter key support */}
                <button type="submit" style={{ display: 'none' }} aria-hidden="true" tabIndex={-1} />

                {/* Submit Credentials Button (Uiverse Button Mastery 13) */}
                <div className="d-flex flex-column align-items-center my-2">
                  <UiverseLoginButton loading={loading} disabled={loading} />
                  {loading && (
                    <div className="text-muted extra-small fw-bold text-uppercase mt-2 d-flex align-items-center gap-2">
                      <span className="spinner-border spinner-border-sm text-primary" role="status"></span>
                      <span>Authenticating...</span>
                    </div>
                  )}
                </div>
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

        {/* App Store & Google Play Download Badges */}
        <div className="mt-4 pt-2 text-center border-top border-light">
          <div className="text-muted extra-small text-uppercase fw-bold mb-2" style={{ letterSpacing: '0.05em' }}>
            Get MTS Decor on Mobile & Desktop
          </div>
          <AppStoreBadges height={38} showWindowsMac={false} align="center" />
          <div className="mt-2">
            <Link to="/download" className="text-decoration-none extra-small text-muted fw-semibold">
              <i className="bi bi-display me-1 text-primary"></i>
              <span>Also available for Windows PC & Mac →</span>
            </Link>
          </div>
        </div>

        {/* Bottom Copyright & Official Website Link */}
        <div className="untitled-footer-text mt-3 text-center">
          <div className="mb-2">
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="badge bg-light text-dark border border-secondary border-opacity-25 px-3 py-1.5 text-decoration-none extra-small fw-bold d-inline-flex align-items-center gap-1 shadow-xs"
              style={{ transition: 'all 0.2s ease' }}
            >
              <i className="bi bi-globe2 text-primary"></i>
              <span>Official MTS DECOR Website</span>
              <i className="bi bi-box-arrow-up-right text-muted"></i>
            </a>
          </div>
          <div className="text-secondary extra-small text-uppercase fw-semibold">
            &copy; {new Date().getFullYear()} MTS Decor &bull; All Rights Reserved
          </div>
          <div className="extra-small text-muted text-uppercase mt-1 fw-bold">
            Built by <span className="text-dark fw-bolder">Hitesh Jagdish Suthar</span>
          </div>
        </div>
      </div>

      {/* ── RIGHT HERO CARD SIDE (Desktop Only) ── */}
      <div className="untitled-image-side d-none d-lg-flex">
        {/* CASE A: Admin Uploaded Founder Slides Exist */}
        {currentQuote ? (
          <div
            className="untitled-hero-card position-relative overflow-hidden d-flex flex-column justify-content-between"
            style={{
              minHeight: '100%',
              backgroundColor: '#0a0a0c',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            {/* Active Founder Image (Full height, wide, grounded, with feathered edges so no hard borders are visible) */}
            {currentQuote.imageUrl && (
              <div
                className="position-absolute top-0 end-0 h-100 w-100 d-flex justify-content-end align-items-end"
                style={{
                  zIndex: 1,
                  pointerEvents: 'none',
                  overflow: 'hidden',
                  paddingRight: 'clamp(4px, 1.5vw, 24px)',
                }}
              >
                <img
                  key={currentQuote.imageUrl || testimonialIdx}
                  src={currentQuote.imageUrl}
                  alt={currentQuote.name || 'Founder'}
                  style={{
                    height: '100%',
                    width: 'auto',
                    maxWidth: '88%',
                    objectFit: 'contain',
                    objectPosition: 'right bottom',
                    maskImage: 'radial-gradient(ellipse 85% 90% at 55% 52%, black 50%, rgba(0, 0, 0, 0.85) 72%, transparent 100%)',
                    WebkitMaskImage: 'radial-gradient(ellipse 85% 90% at 55% 52%, black 50%, rgba(0, 0, 0, 0.85) 72%, transparent 100%)',
                    transition: 'opacity 0.4s ease-in-out',
                  }}
                />
              </div>
            )}

            {/* Soft, minimal gradient strictly on the far-left - keeps the photo 100% crisp, vibrant and seamless */}
            <div
              className="position-absolute top-0 start-0 w-100 h-100"
              style={{
                zIndex: 2,
                pointerEvents: 'none',
                background: 'linear-gradient(90deg, #0a0a0c 0%, rgba(10, 10, 12, 0.85) 26%, rgba(10, 10, 12, 0.3) 48%, rgba(10, 10, 12, 0) 66%)'
              }}
            ></div>

            {/* Top Logo (Clean Branding) */}
            <div className="position-relative" style={{ zIndex: 3 }}>
              <img
                src="/mtsdecor.png"
                alt="MTS Decor"
                style={{ height: '52px', maxWidth: '180px', objectFit: 'contain' }}
                onError={(e) => { e.target.onerror = null; e.target.src = '/logo.png'; }}
              />
            </div>

            {/* Quote & Author Content (Anchored in the bottom-left corner) */}
            <div className="untitled-hero-content d-flex justify-content-between align-items-end mt-auto mb-2" style={{ zIndex: 3 }}>
              <div style={{ maxWidth: 'clamp(300px, 38vw, 420px)' }}>
                <p className="untitled-quote-text mb-3" style={{ fontSize: 'clamp(1.05rem, 1.35vw, 1.25rem)', lineHeight: 1.5, fontWeight: 500 }}>
                  "{currentQuote.quote}"
                </p>
                <div className="untitled-author-name fs-6 fw-bold">
                  {currentQuote.name || 'MTS Decor Founder'}
                </div>
                <div className="untitled-author-role extra-small text-uppercase tracking-wider opacity-75">
                  {currentQuote.role || 'Founder'} &bull; {currentQuote.company || 'MTS Decor'}
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

              {/* Slider Next/Previous Controls */}
              {slides.length > 1 && (
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
              )}
            </div>

            {/* Bottom Footer Note (Uniform across all states) */}
            <div className="position-relative pt-3 border-top border-light border-opacity-25" style={{ zIndex: 3 }}>
              <div className="text-light opacity-75 extra-small text-uppercase d-flex flex-wrap justify-content-between align-items-center gap-2">
                <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="text-light text-decoration-none fw-bold d-inline-flex align-items-center gap-1">
                  <i className="bi bi-globe2"></i>
                  <span>OFFICIAL WEBSITE</span>
                  <i className="bi bi-arrow-up-right"></i>
                </a>
                <span className="fw-bold text-white">BUILT BY HITESH JAGDISH SUTHAR</span>
              </div>
            </div>
          </div>
        ) : (
          /* CASE B: No Slides Uploaded Yet -> Sleek MTS Decor Branded Showcase Card */
          <div
            className="untitled-hero-card position-relative overflow-hidden d-flex flex-column justify-content-between"
            style={{
              background: 'linear-gradient(145deg, #0d131f 0%, #151e2e 50%, #1e293b 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            {/* Top Logo */}
            <div className="position-relative" style={{ zIndex: 2 }}>
              <img
                src="/mtsdecor.png"
                alt="MTS Decor"
                style={{ height: '56px', maxWidth: '180px', objectFit: 'contain' }}
                onError={(e) => { e.target.onerror = null; e.target.src = '/logo.png'; }}
              />
            </div>

            {/* Middle Value Proposition */}
            <div className="position-relative my-auto py-4" style={{ zIndex: 2 }}>
              <h2 className="text-white fw-bold display-6 mb-3">
                Precision In Every Measurement
              </h2>
              <p className="text-light opacity-75 fs-6 mb-4" style={{ maxWidth: '460px', lineHeight: 1.6 }}>
                Streamlined multi-user site calculations, formula-driven progress tracking, and instant Excel / PDF reporting.
              </p>

              <div className="d-flex flex-wrap gap-2">
                <span className="badge bg-dark bg-opacity-75 border border-secondary text-light px-3 py-2 extra-small">
                  <i className="bi bi-shield-check text-success me-1"></i> TWO-STEP VERIFICATION
                </span>
                <span className="badge bg-dark bg-opacity-75 border border-secondary text-light px-3 py-2 extra-small">
                  <i className="bi bi-cloud-check text-info me-1"></i> 1-SECOND CLOUD SYNC
                </span>
                <span className="badge bg-dark bg-opacity-75 border border-secondary text-light px-3 py-2 extra-small">
                  <i className="bi bi-calculator-fill text-warning me-1"></i> AUTOMATED RA BILLING
                </span>
              </div>
            </div>

            {/* Bottom Footer Note */}
            <div className="position-relative pt-3 border-top border-secondary border-opacity-25" style={{ zIndex: 2 }}>
              <div className="text-light opacity-75 extra-small text-uppercase d-flex flex-wrap justify-content-between align-items-center gap-2">
                <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="text-light text-decoration-none fw-bold d-inline-flex align-items-center gap-1">
                  <i className="bi bi-globe2"></i>
                  <span>OFFICIAL WEBSITE</span>
                  <i className="bi bi-arrow-up-right"></i>
                </a>
                <span className="fw-bold text-light opacity-75">BUILT BY HITESH JAGDISH SUTHAR</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
