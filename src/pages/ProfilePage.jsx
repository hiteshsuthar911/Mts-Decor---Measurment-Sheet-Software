import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getSession, updateSession, logout } from '../utils/auth';
import { getUserProfile, updateUserProfile, changeUserPassword } from '../utils/storage';
import AppLoader from '../components/AppLoader';

export default function ProfilePage() {
  const navigate = useNavigate();
  const session = getSession();

  // Profile data states
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ totalProjects: 0, recentProjects: [] });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Edit Name form state
  const [nameInput, setNameInput] = useState('');
  const [updatingName, setUpdatingName] = useState(false);

  // Password Change form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (!session) {
      navigate('/login');
      return;
    }
    loadUserProfile();
  }, []);

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3500);
  };

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const res = await getUserProfile();
      if (res?.user) {
        setProfile(res.user);
        setNameInput(res.user.name || '');
      }
      if (res?.stats) {
        setStats(res.stats);
      }
    } catch (err) {
      triggerToast(err.message || 'FAILED TO LOAD PROFILE DETAILS', 'danger');
    } finally {
      setLoading(false);
    }
  };

  // Handle Name update
  const handleUpdateName = async (e) => {
    e.preventDefault();
    if (!nameInput.trim() || nameInput.trim().length < 2) {
      triggerToast('NAME MUST BE AT LEAST 2 CHARACTERS', 'danger');
      return;
    }

    try {
      setUpdatingName(true);
      const res = await updateUserProfile({ name: nameInput.trim() });
      if (res?.user) {
        setProfile(res.user);
        updateSession({ name: res.user.name });
        triggerToast('PROFILE NAME UPDATED SUCCESSFULLY', 'success');
      }
    } catch (err) {
      triggerToast(err.message || 'FAILED TO UPDATE NAME', 'danger');
    } finally {
      setUpdatingName(false);
    }
  };

  // Password strength helper
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, text: 'NOT SET', color: 'secondary' };
    if (pass.length < 4) return { score: 1, text: 'TOO SHORT', color: 'danger' };
    if (pass.length < 6) return { score: 2, text: 'FAIR', color: 'warning' };
    if (pass.length < 8) return { score: 3, text: 'GOOD', color: 'info' };
    return { score: 4, text: 'STRONG', color: 'success' };
  };

  // Handle Password change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');

    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword) {
      setPasswordError('CURRENT PASSWORD IS REQUIRED');
      return;
    }
    if (!newPassword || newPassword.length < 4) {
      setPasswordError('NEW PASSWORD MUST BE AT LEAST 4 CHARACTERS');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('NEW PASSWORD AND CONFIRMATION DO NOT MATCH');
      return;
    }

    try {
      setUpdatingPassword(true);
      await changeUserPassword({ currentPassword, newPassword });
      triggerToast('PASSWORD CHANGED SUCCESSFULLY', 'success');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      setPasswordError(err.message || 'FAILED TO CHANGE PASSWORD');
      triggerToast(err.message || 'PASSWORD CHANGE FAILED', 'danger');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const strength = getPasswordStrength(passwordForm.newPassword);
  const homeLink = session?.role === 'ADMIN' ? '/admin' : '/projects';
  const homeLabel = session?.role === 'ADMIN' ? 'ADMIN PANEL' : 'ALL PROJECTS';

  if (!session) return null;

  return (
    <div className="min-vh-100 bg-light d-flex flex-column">
      {/* Toast Alert */}
      {toast.show && (
        <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 9999 }}>
          <div className={`toast show bg-dark text-white border-0 shadow px-3 py-2 rounded`}>
            <div className="d-flex align-items-center gap-2">
              <i className={`bi ${toast.type === 'success' ? 'bi-check-circle-fill text-success' : 'bi-exclamation-triangle-fill text-danger'} fs-5`}></i>
              <span className="small fw-bold text-uppercase">{toast.message}</span>
            </div>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <nav className="navbar navbar-dark bg-dark px-3 px-md-4 py-2 shadow-sm sticky-top">
        <div className="d-flex align-items-center gap-3">
          <Link to={homeLink} className="d-flex align-items-center gap-2 text-decoration-none">
            <img
              src="/mtsdecor.png"
              alt="MTS Decor"
              style={{ height: '28px', maxWidth: '120px', objectFit: 'contain' }}
              onError={(e) => { e.target.onerror = null; e.target.src = '/logo.png'; }}
            />
            <span className="navbar-brand fw-bolder fs-5 text-uppercase mb-0">MS PRO</span>
          </Link>
          <span className="text-secondary d-none d-sm-inline extra-small text-uppercase">
            USER PROFILE &amp; SECURITY
          </span>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Link
            to={homeLink}
            className="btn btn-outline-light btn-sm extra-small fw-bold text-uppercase d-flex align-items-center gap-1"
          >
            <i className="bi bi-arrow-left"></i>
            <span>{homeLabel}</span>
          </Link>
          <button
            className="btn btn-outline-danger btn-sm extra-small fw-bold text-uppercase d-flex align-items-center gap-1"
            onClick={() => { logout(); navigate('/login'); }}
          >
            <i className="bi bi-box-arrow-right"></i>
            <span className="d-none d-sm-inline">LOGOUT</span>
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <main className="container-fluid container-xl py-4 px-3 px-md-4 flex-grow-1">
        {loading && !profile ? (
          <div className="text-center py-5">
            <AppLoader text="LOADING USER PROFILE..." />
          </div>
        ) : (
          <>
            {/* Profile Hero Header Card */}
            <div className="card border-0 shadow-sm mb-4 overflow-hidden" style={{ borderRadius: '14px' }}>
              <div
                className="p-4 text-white position-relative"
                style={{
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #1e40af 100%)',
                }}
              >
                <div className="d-flex flex-column flex-md-row align-items-center gap-3 gap-md-4">
                  {/* Avatar Initials Badge */}
                  <div
                    className="d-flex align-items-center justify-content-center text-white fw-bolder shadow"
                    style={{
                      width: '88px',
                      height: '88px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      fontSize: '32px',
                      border: '4px solid rgba(255, 255, 255, 0.2)',
                      letterSpacing: '1px',
                    }}
                  >
                    {getInitials(profile?.name || session?.name)}
                  </div>

                  {/* Profile Meta Details */}
                  <div className="text-center text-md-start flex-grow-1">
                    <div className="d-flex flex-wrap align-items-center justify-content-center justify-content-md-start gap-2 mb-1">
                      <h3 className="fw-bolder text-uppercase mb-0 text-white">
                        {profile?.name || session?.name || 'FIELD USER'}
                      </h3>
                      <span className={`badge ${session?.role === 'ADMIN' ? 'bg-danger' : 'bg-primary'} extra-small text-uppercase px-2 py-1`}>
                        <i className={`bi ${session?.role === 'ADMIN' ? 'bi-shield-lock-fill' : 'bi-person-check-fill'} me-1`}></i>
                        {session?.role === 'ADMIN' ? 'SUPER ADMIN' : 'FIELD USER'}
                      </span>
                    </div>

                    <div className="d-flex flex-wrap align-items-center justify-content-center justify-content-md-start gap-3 text-white-50 extra-small text-uppercase">
                      <div>
                        <i className="bi bi-person-fill me-1 text-info"></i>
                        USERNAME: <strong className="text-white">@{profile?.username || session?.username}</strong>
                      </div>
                      <div>
                        <i className="bi bi-shield-check me-1 text-success"></i>
                        2FA OTP: <strong className="text-success">ACTIVE &bull; SECURE</strong>
                      </div>
                      {profile?.createdAt && (
                        <div>
                          <i className="bi bi-calendar-check me-1 text-warning"></i>
                          MEMBER SINCE: <strong className="text-white">{new Date(profile.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Quick Button */}
                  <div>
                    <Link
                      to={homeLink}
                      className="btn btn-light btn-sm fw-bold text-uppercase px-3 py-2 shadow-sm d-flex align-items-center gap-2"
                    >
                      <i className={`bi ${session?.role === 'ADMIN' ? 'bi-gear-fill' : 'bi-folder2-open'}`}></i>
                      <span>{session?.role === 'ADMIN' ? 'ADMIN DASHBOARD' : 'VIEW PROJECTS'}</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Mini Quick Stats Bar */}
              <div className="bg-white border-top px-4 py-3 d-flex flex-wrap align-items-center justify-content-around text-center gap-3">
                <div className="px-2">
                  <div className="extra-small text-muted text-uppercase fw-bold">TOTAL PROJECTS</div>
                  <div className="fs-5 fw-bolder text-dark">
                    {stats.totalProjects ?? 0}
                  </div>
                </div>
                <div className="border-end d-none d-md-block" style={{ height: '30px' }}></div>
                <div className="px-2">
                  <div className="extra-small text-muted text-uppercase fw-bold">ACCESS ROLE</div>
                  <div className="fs-6 fw-bolder text-primary text-uppercase">
                    {profile?.role || session?.role}
                  </div>
                </div>
                <div className="border-end d-none d-md-block" style={{ height: '30px' }}></div>
                <div className="px-2">
                  <div className="extra-small text-muted text-uppercase fw-bold">AUTHENTICATION</div>
                  <div className="fs-6 fw-bolder text-success text-uppercase">
                    <i className="bi bi-shield-fill-check me-1"></i>2-STEP OTP
                  </div>
                </div>
                <div className="border-end d-none d-md-block" style={{ height: '30px' }}></div>
                <div className="px-2">
                  <div className="extra-small text-muted text-uppercase fw-bold">DATABASE CLOUD</div>
                  <div className="fs-6 fw-bolder text-secondary text-uppercase">
                    MONGODB ATLAS
                  </div>
                </div>
              </div>
            </div>

            {/* Two Column Grid: Personal Details & Password Change */}
            <div className="row g-4 mb-4">
              {/* Left Column: Personal Details */}
              <div className="col-12 col-lg-6">
                <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
                  <div className="card-header bg-white border-bottom py-3 px-4">
                    <h6 className="fw-bolder text-uppercase mb-0 d-flex align-items-center gap-2">
                      <i className="bi bi-person-bounding-box text-primary fs-5"></i>
                      PERSONAL INFORMATION
                    </h6>
                    <span className="extra-small text-muted text-uppercase">
                      UPDATE YOUR ACCOUNT DISPLAY NAME
                    </span>
                  </div>
                  <div className="card-body p-4">
                    <form onSubmit={handleUpdateName}>
                      {/* Name Field */}
                      <div className="mb-3">
                        <label className="form-label extra-small fw-bold text-uppercase text-secondary">
                          FULL NAME
                        </label>
                        <div className="input-group">
                          <span className="input-group-text bg-light border-end-0">
                            <i className="bi bi-person text-muted"></i>
                          </span>
                          <input
                            type="text"
                            className="form-control border-start-0 text-uppercase fw-semibold"
                            placeholder="YOUR FULL NAME"
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value)}
                            required
                          />
                        </div>
                        <div className="extra-small text-muted mt-1">
                          This name will be displayed as the project owner and on generated measurement sheets.
                        </div>
                      </div>

                      {/* Username (Read Only) */}
                      <div className="mb-3">
                        <label className="form-label extra-small fw-bold text-uppercase text-secondary">
                          USERNAME (SYSTEM IDENTIFIER)
                        </label>
                        <div className="input-group">
                          <span className="input-group-text bg-light border-end-0">
                            <i className="bi bi-at text-muted"></i>
                          </span>
                          <input
                            type="text"
                            className="form-control border-start-0 bg-light text-muted fw-bold"
                            value={profile?.username || session?.username}
                            readOnly
                            disabled
                          />
                          <span className="input-group-text bg-light text-muted" title="Username cannot be changed">
                            <i className="bi bi-lock-fill"></i>
                          </span>
                        </div>
                        <div className="extra-small text-muted mt-1">
                          Unique system username used for two-step authentication login.
                        </div>
                      </div>

                      {/* Role (Read Only) */}
                      <div className="mb-4">
                        <label className="form-label extra-small fw-bold text-uppercase text-secondary">
                          ASSIGNED SYSTEM ROLE
                        </label>
                        <div className="input-group">
                          <span className="input-group-text bg-light border-end-0">
                            <i className="bi bi-shield-check text-muted"></i>
                          </span>
                          <input
                            type="text"
                            className="form-control border-start-0 bg-light text-muted fw-bold text-uppercase"
                            value={profile?.role || session?.role}
                            readOnly
                            disabled
                          />
                        </div>
                      </div>

                      <div className="d-flex justify-content-end">
                        <button
                          type="submit"
                          className="btn btn-dark fw-bold text-uppercase px-4 d-flex align-items-center gap-2"
                          disabled={updatingName}
                        >
                          {updatingName ? (
                            <>
                              <span className="spinner-border spinner-border-sm" role="status"></span>
                              SAVING...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-check2-circle"></i>
                              SAVE PROFILE
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              {/* Right Column: Security & Change Password */}
              <div className="col-12 col-lg-6">
                <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
                  <div className="card-header bg-white border-bottom py-3 px-4">
                    <h6 className="fw-bolder text-uppercase mb-0 d-flex align-items-center gap-2">
                      <i className="bi bi-key-fill text-warning fs-5"></i>
                      SECURITY &amp; PASSWORD
                    </h6>
                    <span className="extra-small text-muted text-uppercase">
                      CHANGE YOUR ACCOUNT PASSWORD DIRECTLY
                    </span>
                  </div>
                  <div className="card-body p-4">
                    {passwordError && (
                      <div className="alert alert-danger py-2 px-3 extra-small fw-bold text-uppercase d-flex align-items-center gap-2 mb-3">
                        <i className="bi bi-exclamation-triangle-fill"></i>
                        <span>{passwordError}</span>
                      </div>
                    )}

                    <form onSubmit={handleChangePassword}>
                      {/* Current Password */}
                      <div className="mb-3">
                        <label className="form-label extra-small fw-bold text-uppercase text-secondary">
                          CURRENT PASSWORD
                        </label>
                        <div className="input-group">
                          <span className="input-group-text bg-light border-end-0">
                            <i className="bi bi-shield-lock text-muted"></i>
                          </span>
                          <input
                            type={showCurrentPassword ? 'text' : 'password'}
                            className="form-control border-start-0 border-end-0"
                            placeholder="ENTER YOUR CURRENT PASSWORD"
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                            required
                          />
                          <button
                            type="button"
                            className="btn btn-light border border-start-0 text-muted"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          >
                            <i className={`bi ${showCurrentPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                          </button>
                        </div>
                      </div>

                      {/* New Password */}
                      <div className="mb-3">
                        <label className="form-label extra-small fw-bold text-uppercase text-secondary">
                          NEW PASSWORD (MINIMUM 4 CHARACTERS)
                        </label>
                        <div className="input-group">
                          <span className="input-group-text bg-light border-end-0">
                            <i className="bi bi-lock text-muted"></i>
                          </span>
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            className="form-control border-start-0 border-end-0"
                            placeholder="ENTER NEW PASSWORD"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            required
                          />
                          <button
                            type="button"
                            className="btn btn-light border border-start-0 text-muted"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            <i className={`bi ${showNewPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                          </button>
                        </div>

                        {/* Password strength indicator */}
                        {passwordForm.newPassword && (
                          <div className="mt-2">
                            <div className="d-flex justify-content-between extra-small text-uppercase mb-1">
                              <span className="text-muted">STRENGTH:</span>
                              <strong className={`text-${strength.color}`}>{strength.text}</strong>
                            </div>
                            <div className="progress" style={{ height: '4px' }}>
                              <div
                                className={`progress-bar bg-${strength.color}`}
                                style={{ width: `${(strength.score / 4) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Confirm New Password */}
                      <div className="mb-4">
                        <label className="form-label extra-small fw-bold text-uppercase text-secondary">
                          CONFIRM NEW PASSWORD
                        </label>
                        <div className="input-group">
                          <span className="input-group-text bg-light border-end-0">
                            <i className="bi bi-check2-circle text-muted"></i>
                          </span>
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            className="form-control border-start-0 border-end-0"
                            placeholder="RE-ENTER NEW PASSWORD"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            required
                          />
                          <button
                            type="button"
                            className="btn btn-light border border-start-0 text-muted"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            <i className={`bi ${showConfirmPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                          </button>
                        </div>
                        {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                          <div className="extra-small text-danger mt-1">
                            <i className="bi bi-x-circle me-1"></i> Passwords do not match
                          </div>
                        )}
                      </div>

                      <div className="d-flex justify-content-end">
                        <button
                          type="submit"
                          className="btn btn-warning fw-bold text-uppercase px-4 d-flex align-items-center gap-2"
                          disabled={updatingPassword}
                        >
                          {updatingPassword ? (
                            <>
                              <span className="spinner-border spinner-border-sm" role="status"></span>
                              CHANGING...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-key-fill"></i>
                              UPDATE PASSWORD
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section: My Recent Projects */}
            <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
              <div className="card-header bg-white border-bottom py-3 px-4 d-flex flex-wrap align-items-center justify-content-between gap-2">
                <div>
                  <h6 className="fw-bolder text-uppercase mb-0 d-flex align-items-center gap-2">
                    <i className="bi bi-folder2-open text-primary fs-5"></i>
                    MY RECENT PROJECTS
                  </h6>
                  <span className="extra-small text-muted text-uppercase">
                    PROJECTS CREATED AND OWNED BY YOUR ACCOUNT
                  </span>
                </div>
                <Link
                  to={homeLink}
                  className="btn btn-outline-dark btn-sm extra-small fw-bold text-uppercase"
                >
                  VIEW ALL IN {homeLabel}
                </Link>
              </div>

              <div className="card-body p-4">
                {stats.recentProjects && stats.recentProjects.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr className="extra-small text-uppercase text-secondary">
                          <th style={{ width: '40%' }}>PROJECT NAME</th>
                          <th>CREATED DATE</th>
                          <th>LAST ACTIVITY</th>
                          <th className="text-end">ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentProjects.map((proj) => (
                          <tr key={proj._id}>
                            <td>
                              <div className="fw-bold text-uppercase text-dark">
                                <i className="bi bi-file-earmark-spreadsheet-fill text-primary me-2"></i>
                                {proj.name || 'UNTITLED PROJECT'}
                              </div>
                            </td>
                            <td>
                              <span className="badge bg-light text-dark border extra-small">
                                <i className="bi bi-calendar3 me-1"></i>
                                {new Date(proj.createdAt).toLocaleDateString('en-IN')}
                              </span>
                            </td>
                            <td>
                              <span className="extra-small text-muted text-uppercase">
                                {proj.lastEditedBy ? `Edited by ${proj.lastEditedBy}` : 'Created'}
                              </span>
                            </td>
                            <td className="text-end">
                              <button
                                className="btn btn-dark btn-sm extra-small fw-bold text-uppercase"
                                onClick={() => navigate(`/sheet/${proj._id}`)}
                              >
                                <i className="bi bi-pencil-square me-1"></i> OPEN SHEET
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted">
                    <div className="display-6 mb-2">📁</div>
                    <div className="fw-bold text-uppercase small">NO PROJECTS CREATED YET</div>
                    <p className="extra-small text-uppercase mb-3">
                      Start by creating your first measurement sheet project.
                    </p>
                    <Link to={homeLink} className="btn btn-dark btn-sm fw-bold text-uppercase">
                      <i className="bi bi-plus-circle me-1"></i> GO TO {homeLabel}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-top py-2 text-center text-muted extra-small text-uppercase">
        &copy; {new Date().getFullYear()} MTS DECOR &bull; MEASUREMENT SHEET SOFTWARE &bull; ALL RIGHTS RESERVED
      </footer>
    </div>
  );
}
