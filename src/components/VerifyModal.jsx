import React, { useState } from 'react';
import { verifyPassword } from '../utils/auth';

export default function VerifyModal({ show, currentUser, ownerName, onVerified, onCancel }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  if (!show) return null;

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const ok = await verifyPassword(password);
      if (ok) {
        setPassword('');
        onVerified();
      } else {
        setError('INCORRECT PASSWORD. PLEASE TRY AGAIN.');
      }
    } catch {
      setError('SERVER ERROR. PLEASE TRY AGAIN.');
    }
    setLoading(false);
  };

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.65)', zIndex: 9999 }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '420px' }}>
        <div className="modal-content border-0 shadow-lg rounded-3 overflow-hidden">
          {/* Header */}
          <div className="modal-header bg-warning border-0 px-4 py-3">
            <div>
              <h5 className="fw-bolder text-uppercase mb-0">
                <i className="bi bi-shield-lock-fill me-2"></i>
                VERIFY YOUR IDENTITY
              </h5>
              <div className="small text-dark text-uppercase fw-semibold mt-1" style={{ fontSize: '11px' }}>
                TO EDIT <span className="fw-bolder">{ownerName?.toUpperCase()}'S</span> PROJECT
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="modal-body px-4 py-4">
            <div className="alert alert-light border text-uppercase small fw-semibold py-2 mb-3">
              <i className="bi bi-info-circle-fill me-2 text-primary"></i>
              ENTER YOUR PASSWORD (<span className="fw-bolder">{currentUser?.name}</span>) TO UNLOCK EDITING.
            </div>

            {error && (
              <div className="alert alert-danger border-0 text-uppercase small fw-bold py-2">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {error}
              </div>
            )}

            <form onSubmit={handleVerify}>
              <div className="mb-3">
                <label className="form-label text-uppercase fw-bold small text-secondary">
                  <i className="bi bi-person-fill me-1"></i> LOGGED IN AS
                </label>
                <input
                  type="text"
                  className="form-control text-uppercase fw-bold bg-light"
                  value={currentUser?.name || ''}
                  readOnly
                />
              </div>

              <div className="mb-4">
                <label className="form-label text-uppercase fw-bold small text-secondary">
                  <i className="bi bi-lock-fill me-1"></i> YOUR PASSWORD
                </label>
                <div className="input-group">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="form-control fw-semibold"
                    placeholder="ENTER YOUR PASSWORD"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoFocus
                    required
                  />
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPass(s => !s)} tabIndex={-1}>
                    <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
              </div>

              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-dark fw-bold text-uppercase flex-grow-1" disabled={loading}>
                  {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>VERIFYING...</> : <><i className="bi bi-unlock-fill me-2"></i>UNLOCK TO EDIT</>}
                </button>
                <button type="button" className="btn btn-outline-secondary fw-bold text-uppercase px-3" onClick={() => { setPassword(''); setError(''); onCancel(); }}>
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
