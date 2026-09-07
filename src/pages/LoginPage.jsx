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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const session = await login(username.trim(), password);
      if (session) {
        navigate(session.role === 'ADMIN' ? '/admin' : '/projects');
      } else {
        setError('INVALID USERNAME OR PASSWORD. PLEASE TRY AGAIN.');
      }
    } catch {
      setError('SERVER ERROR. PLEASE TRY AGAIN.');
    }
    setLoading(false);
  };

  return (
    <div className="login-page d-flex align-items-center justify-content-center min-vh-100">
      {/* Background gradient */}
      <div className="login-bg"></div>

      <div className="login-card card shadow-lg border-0 p-0" style={{ width: '420px', zIndex: 2 }}>
        {/* Card Header */}
        <div className="card-header bg-dark text-white text-center py-4 border-0">
          <div className="mb-2">
            <span className="display-4">📐</span>
          </div>
          <h4 className="fw-bolder text-uppercase mb-1 tracking-wider">MS PRO</h4>
          <div className="text-secondary small text-uppercase fw-semibold">
            CONTRACTOR MEASUREMENT SYSTEM
          </div>
        </div>

        {/* Card Body */}
        <div className="card-body p-4">
          <h5 className="fw-bold text-center text-uppercase mb-4 text-dark">
            SIGN IN TO YOUR ACCOUNT
          </h5>

          {error && (
            <div className="alert alert-danger border-0 text-uppercase small fw-semibold py-2 px-3">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="off">
            {/* Username */}
            <div className="mb-3">
              <label className="form-label text-uppercase fw-bold small text-secondary">
                <i className="bi bi-person-fill me-1"></i> USERNAME
              </label>
              <input
                type="text"
                className="form-control form-control-lg fw-semibold text-uppercase"
                placeholder="ENTER USERNAME"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoFocus
                style={{ letterSpacing: '1px' }}
              />
            </div>

            {/* Password */}
            <div className="mb-4">
              <label className="form-label text-uppercase fw-bold small text-secondary">
                <i className="bi bi-lock-fill me-1"></i> PASSWORD
              </label>
              <div className="input-group">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="form-control form-control-lg fw-semibold"
                  placeholder="ENTER PASSWORD"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPass(s => !s)}
                  tabIndex={-1}
                >
                  <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-dark w-100 fw-bold text-uppercase py-3 fs-6"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  SIGNING IN...
                </>
              ) : (
                <>
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  SIGN IN
                </>
              )}
            </button>
          </form>
        </div>

        {/* Credentials hint */}
        <div className="card-footer bg-light-subtle text-center py-3 border-0">
          <div className="text-muted extra-small text-uppercase fw-semibold mb-1">ACCOUNTS:</div>
          <div className="d-flex flex-column gap-1 extra-small">
            <span className="text-dark fw-bold">JAGDISH / jagdish@123 &bull; MADANLAL / madanlal@123</span>
            <span className="text-danger fw-bold">ADMIN / admin@123 (ADMIN PANEL ONLY)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
