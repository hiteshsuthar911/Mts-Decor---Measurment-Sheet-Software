import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { login } from '../utils/auth';

export default function LoginPage() {
  const navigate = useNavigate();

  // Force clean light theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.setAttribute('data-bs-theme', 'light');
  }, []);

  const [emailOrUser, setEmailOrUser] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showLostInfo, setShowLostInfo] = useState(false);

  // Direct login — no 2-step verification code
  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!emailOrUser.trim() || !password) {
      setError('Please fill in both Email / Username and Password.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const session = await login(emailOrUser.trim(), password);
      if (session && session.token) {
        navigate(session.role === 'ADMIN' ? '/admin' : '/projects');
      } else {
        setError('Invalid credentials. Check your username or password.');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="minimal-login-wrapper">
      <div className="minimal-login-card">
        {/* Proper MTS Decor Logo */}
        <div className="mb-4 text-center">
          <img
            src="/mtsdecor.png"
            alt="MTS Decor"
            style={{
              height: '72px',
              maxWidth: '200px',
              objectFit: 'contain',
              display: 'inline-block'
            }}
            onError={(e) => { e.target.onerror = null; e.target.src = '/logo.png'; }}
          />
        </div>

        {/* Heading */}
        <h1 className="minimal-login-title">Log in to MTS Decor</h1>

        {/* Error Alert */}
        {error && (
          <div
            className="w-100 text-start py-2.5 px-3 mb-3 rounded-2"
            style={{
              backgroundColor: '#fee2e2',
              border: '1px solid #fca5a5',
              color: '#991b1b',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form className="minimal-login-form" onSubmit={handleSubmit} autoComplete="on">
          <label className="minimal-login-label" htmlFor="email" style={{ textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Email or Username
          </label>
          <input
            id="email"
            type="text"
            className="minimal-login-input"
            placeholder="ENTER EMAIL OR USERNAME (E.G. JAGDISH)"
            value={emailOrUser}
            onChange={(e) => setEmailOrUser(e.target.value.toUpperCase())}
            style={{ textTransform: 'uppercase' }}
            required
            autoFocus
          />

          <label className="minimal-login-label" htmlFor="password">
            Password
          </label>
          <div style={{ position: 'relative', width: '100%', marginBottom: '18px' }}>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className="minimal-login-input"
              style={{ marginBottom: 0, paddingRight: '42px' }}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#6b7280',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title={showPassword ? 'Hide password' : 'Show password'}
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            className="minimal-login-btn"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>

          {/* Lost your password? box */}
          <div
            className="minimal-login-lost-box"
            onClick={() => setShowLostInfo(!showLostInfo)}
            role="button"
            tabIndex={0}
          >
            Lost your password?
          </div>

          {showLostInfo && (
            <div
              className="mt-2.5 p-3 rounded-2 text-start"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e8dfcf',
                fontSize: '13px',
                color: '#4b5563',
                lineHeight: 1.5,
              }}
            >
              <div className="fw-semibold text-dark mb-1">Standard Login Accounts:</div>
              <ul className="mb-2 ps-3" style={{ fontSize: '12.5px' }}>
                <li><strong>jagdish</strong> (Password: <code>jagdish@123</code> or <code>jagdish</code>)</li>
                <li><strong>engineer</strong> (Password: <code>engineer@123</code>) &bull; <span className="text-muted extra-small">Site Engineer</span></li>
                <li><strong>admin</strong> (Password: <code>admin@123</code>)</li>
                <li><strong>madanlal</strong> (Password: <code>madanlal@123</code>)</li>
                <li><strong>hitesh</strong> (Password: <code>hitesh@123</code>)</li>
              </ul>
              <div>
                Need a password reset? Email{' '}
                <a href="mailto:support@mtsdecor.com?subject=Password%20Reset%20Request" className="fw-bold text-dark">
                  support@mtsdecor.com
                </a>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
