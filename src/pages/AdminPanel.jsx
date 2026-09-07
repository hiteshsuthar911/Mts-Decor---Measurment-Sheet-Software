import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getSession, logout, ADMIN_USERS } from '../utils/auth';
import { 
  getAllProjects, 
  deleteProject, 
  getProjectStats,
  getFounderSlides,
  createFounderSlide,
  updateFounderSlide,
  deleteFounderSlide,
  getAllUsers,
  createUser,
  updateUserPassword,
  deleteUser
} from '../utils/storage';

export default function AdminPanel() {
  const navigate = useNavigate();
  const session = getSession();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  // Dynamic Users State
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    username: '',
    password: '',
    role: 'USER'
  });
  const [resetModal, setResetModal] = useState({
    open: false,
    userId: null,
    username: '',
    password: ''
  });
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Founder Slides State
  const [founderSlides, setFounderSlides] = useState([]);
  const [loadingSlides, setLoadingSlides] = useState(false);
  const [editingSlideId, setEditingSlideId] = useState(null);
  const [savingSlide, setSavingSlide] = useState(false);
  const [slideForm, setSlideForm] = useState({
    name: '',
    role: '',
    company: 'MTS Decor & Interiors',
    quote: '',
    imageUrl: '',
    order: 0
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [projList, statsData] = await Promise.all([
        getAllProjects().catch(() => []),
        getProjectStats().catch(() => []),
      ]);
      setProjects(projList || []);
      const statsMap = {};
      if (Array.isArray(statsData)) {
        statsData.forEach(item => {
          statsMap[item._id] = item;
        });
      }
      setStats(statsMap);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const loadFounderSlides = async () => {
    try {
      setLoadingSlides(true);
      const data = await getFounderSlides();
      setFounderSlides(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    } finally {
      setLoadingSlides(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const data = await getAllUsers();
      setUsersList(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (!session || session.role !== 'ADMIN') { navigate('/login'); return; }
    loadData();
    loadUsers();
    loadFounderSlides();
  }, []);

  if (!session || session.role !== 'ADMIN') return null;

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const navItems = [
    { key: 'dashboard',   label: 'DASHBOARD',         icon: 'bi-speedometer2' },
    { key: 'projects',    label: 'ALL PROJECTS',       icon: 'bi-folder2-open' },
    { key: 'users',       label: 'USER MANAGEMENT',    icon: 'bi-people-fill'  },
    { key: 'slides',      label: 'FOUNDER SLIDES',     icon: 'bi-images'       },
    { key: 'credentials', label: 'LOGIN CREDENTIALS',  icon: 'bi-key-fill'     },
    { key: 'about',       label: 'SYSTEM INFO',        icon: 'bi-info-circle-fill' },
  ];

  // ── USER MANAGEMENT HANDLERS ──
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUserForm.name.trim() || !newUserForm.username.trim() || !newUserForm.password.trim()) {
      alert('ALL FIELDS ARE REQUIRED');
      return;
    }
    try {
      setCreatingUser(true);
      await createUser(newUserForm);
      showToast('USER CREATED SUCCESSFULLY');
      setNewUserForm({ name: '', username: '', password: '', role: 'USER' });
      await loadUsers();
    } catch (err) {
      alert('FAILED TO CREATE USER: ' + (err.message || 'SERVER ERROR'));
    } finally {
      setCreatingUser(false);
    }
  };

  const handleOpenResetModal = (user) => {
    setResetModal({
      open: true,
      userId: user._id,
      username: user.username,
      password: ''
    });
  };

  const handleSaveResetPassword = async (e) => {
    e.preventDefault();
    if (!resetModal.password || resetModal.password.trim().length < 4) {
      alert('PASSWORD MUST BE AT LEAST 4 CHARACTERS');
      return;
    }
    try {
      setUpdatingPassword(true);
      await updateUserPassword(resetModal.userId, resetModal.password.trim());
      showToast(`PASSWORD UPDATED FOR ${resetModal.username.toUpperCase()}`);
      setResetModal({ open: false, userId: null, username: '', password: '' });
      await loadUsers();
    } catch (err) {
      alert('FAILED TO UPDATE PASSWORD: ' + err.message);
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (user.username === session.username) {
      alert('CANNOT DELETE CURRENT LOGGED-IN ADMIN');
      return;
    }
    if (!confirm(`DELETE USER "${user.username.toUpperCase()}" AND REVOKE ALL ACCESS?`)) return;
    try {
      await deleteUser(user._id);
      showToast('USER DELETED');
      await loadUsers();
    } catch (err) {
      alert('FAILED TO DELETE: ' + err.message);
    }
  };

  // ── FOUNDER SLIDES HANDLERS ──
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      alert('IMAGE SIZE MUST BE UNDER 8MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSlideForm(prev => ({ ...prev, imageUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleEditSlide = (slide) => {
    setEditingSlideId(slide._id);
    setSlideForm({
      name: slide.name || '',
      role: slide.role || '',
      company: slide.company || 'MTS Decor & Interiors',
      quote: slide.quote || '',
      imageUrl: slide.imageUrl || '',
      order: slide.order ?? 0
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingSlideId(null);
    setSlideForm({
      name: '',
      role: '',
      company: 'MTS Decor & Interiors',
      quote: '',
      imageUrl: '',
      order: 0
    });
  };

  const handleSaveSlide = async (e) => {
    e.preventDefault();
    if (!slideForm.name.trim() || !slideForm.quote.trim()) {
      alert('FOUNDER NAME AND QUOTE / THOUGHT ARE REQUIRED');
      return;
    }
    if (!slideForm.imageUrl) {
      alert('PLEASE UPLOAD A PHOTO OR PROVIDE AN IMAGE URL');
      return;
    }

    try {
      setSavingSlide(true);
      if (editingSlideId) {
        await updateFounderSlide(editingSlideId, slideForm);
        showToast('FOUNDER SLIDE UPDATED');
      } else {
        await createFounderSlide(slideForm);
        showToast('NEW FOUNDER SLIDE ADDED');
      }
      handleCancelEdit();
      await loadFounderSlides();
    } catch (err) {
      alert('FAILED TO SAVE SLIDE: ' + err.message);
    } finally {
      setSavingSlide(false);
    }
  };

  const handleDeleteSlide = async (id, name) => {
    if (!confirm(`DELETE FOUNDER SLIDE FOR "${name?.toUpperCase()}"?`)) return;
    try {
      await deleteFounderSlide(id);
      showToast('FOUNDER SLIDE DELETED');
      await loadFounderSlides();
    } catch (err) {
      alert('FAILED TO DELETE SLIDE: ' + err.message);
    }
  };

  return (
    <div className="admin-app-container min-vh-100 bg-light">
      {/* Toast Alert */}
      {toast && (
        <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 9999 }}>
          <div className="toast show bg-dark text-white border-0 shadow px-3 py-2 rounded">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-check-circle-fill text-success fs-5"></i>
              <span className="small fw-bold text-uppercase">{toast}</span>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {resetModal.open && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9998 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title fw-bold extra-small text-uppercase">
                  <i className="bi bi-key-fill text-warning me-2"></i>
                  SET NEW PASSWORD FOR {resetModal.username.toUpperCase()}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setResetModal({ open: false, userId: null, username: '', password: '' })}
                ></button>
              </div>
              <form onSubmit={handleSaveResetPassword}>
                <div className="modal-body p-4">
                  <label className="form-label extra-small fw-bold text-uppercase text-secondary mb-1">
                    NEW PASSWORD (MIN 4 CHARS)
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="ENTER NEW PASSWORD"
                    value={resetModal.password}
                    onChange={(e) => setResetModal({ ...resetModal, password: e.target.value })}
                    required
                    autoFocus
                  />
                  <div className="extra-small text-muted mt-2">
                    Password will be hashed and updated in MongoDB Atlas Cloud.
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm fw-bold text-uppercase"
                    onClick={() => setResetModal({ open: false, userId: null, username: '', password: '' })}
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="btn btn-warning btn-sm fw-bold text-uppercase"
                    disabled={updatingPassword}
                  >
                    {updatingPassword ? 'SAVING...' : 'UPDATE PASSWORD'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── RESPONSIVE TOP SCREEN NAVIGATION BAR ────────────────── */}
      <header className="bg-dark text-white border-bottom border-secondary sticky-top shadow-sm">
        {/* Brand & Admin Bar */}
        <div className="container-fluid px-3 px-md-4 py-2 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <img
              src="/mtsdecor.png"
              alt="MTS Decor"
              style={{ height: '32px', maxWidth: '120px', objectFit: 'contain' }}
              onError={(e) => { e.target.onerror = null; e.target.src = '/logo.png'; }}
            />
            <span className="fw-bolder fs-6 text-uppercase d-none d-sm-inline tracking-wider">MTS DECOR</span>
            <span className="badge bg-danger ms-1 extra-small">ADMIN</span>
          </div>

          <div className="d-flex align-items-center gap-2 gap-md-3">
            <div className="text-end d-none d-md-block">
              <div className="fw-bold extra-small text-uppercase">{session.name}</div>
              <div className="text-secondary extra-small">SUPER ADMIN</div>
            </div>
            <Link to="/login" target="_blank" className="btn btn-outline-light btn-sm extra-small fw-bold text-uppercase d-none d-lg-inline-flex align-items-center gap-1">
              <i className="bi bi-box-arrow-up-right"></i> PREVIEW LOGIN
            </Link>
            <button
              className="btn btn-outline-danger btn-sm text-uppercase fw-bold extra-small d-flex align-items-center gap-1"
              onClick={() => { logout(); navigate('/login'); }}
            >
              <i className="bi bi-box-arrow-right"></i> LOGOUT
            </button>
          </div>
        </div>

        {/* Horizontal Screen Navigation Tabs (Scrollable on Mobile) */}
        <div className="screen-navbar-scroll bg-black bg-opacity-25 border-top border-secondary border-opacity-25 px-2 px-md-4 py-1">
          <div className="d-flex flex-nowrap overflow-x-auto gap-1 py-1 no-scrollbar">
            {navItems.map(item => (
              <button
                key={item.key}
                type="button"
                className={`btn btn-sm text-nowrap extra-small fw-bold text-uppercase d-flex align-items-center gap-2 px-3 py-2 rounded-pill ${
                  activeSection === item.key 
                    ? 'btn-primary text-white shadow-sm' 
                    : 'text-light border-0 opacity-75'
                }`}
                onClick={() => {
                  setActiveSection(item.key);
                  if (item.key === 'slides') loadFounderSlides();
                  else if (item.key === 'users') loadUsers();
                  else loadData();
                }}
              >
                <i className={`bi ${item.icon}`}></i>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT (FLUID & FULLY RESPONSIVE) ─────────────── */}
      <main className="container-fluid px-3 px-md-4 py-4">
        {/* Top Header Row */}
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4 pb-3 border-bottom">
          <div>
            <h4 className="fw-bolder text-uppercase mb-0">
              {navItems.find(n => n.key === activeSection)?.label}
            </h4>
            <div className="text-muted extra-small text-uppercase">MTS DECOR &bull; ADMIN CONTROL PANEL</div>
          </div>
          <button
            className="btn btn-sm btn-outline-secondary text-uppercase fw-bold extra-small"
            onClick={() => {
              if (activeSection === 'slides') loadFounderSlides();
              else if (activeSection === 'users') loadUsers();
              else loadData();
            }}
          >
            <i className="bi bi-arrow-clockwise me-1"></i> REFRESH DATA
          </button>
        </div>

        {/* ── 1. DASHBOARD ── */}
        {activeSection === 'dashboard' && (
          <div>
            <div className="row g-3 mb-4">
              {[
                { label: 'TOTAL PROJECTS',   value: projects.length,                icon: 'bi-folder2-open',    color: 'primary'   },
                { label: 'SYSTEM USERS',     value: usersList.length || 3,          icon: 'bi-people-fill',     color: 'success'   },
                { label: 'JAGDISH PROJECTS', value: stats['jagdish']?.count  || 0,   icon: 'bi-person-fill',     color: 'info'      },
                { label: 'MADANLAL PROJECTS',value: stats['madanlal']?.count || 0,   icon: 'bi-person-fill',     color: 'warning'   },
              ].map((kpi, i) => (
                <div key={i} className="col-6 col-md-3">
                  <div className={`card border-0 border-start border-${kpi.color} border-4 shadow-sm position-relative overflow-hidden h-100`}>
                    <div className="card-body py-3">
                      <div className="text-muted extra-small fw-bold text-uppercase mb-1">{kpi.label}</div>
                      <div className={`fs-3 fw-bolder text-${kpi.color}`}>{kpi.value}</div>
                    </div>
                    <i className={`bi ${kpi.icon} position-absolute end-0 bottom-0 me-3 mb-1 opacity-10`} style={{ fontSize: '3rem' }}></i>
                  </div>
                </div>
              ))}
            </div>

            {/* Active Session Card */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-white border-bottom fw-bolder text-uppercase small">
                <i className="bi bi-clock-history me-2 text-primary"></i> ACTIVE SESSION
              </div>
              <div className="card-body">
                <div className="row g-2">
                  <div className="col-12 col-md-4">
                    <span className="text-muted extra-small fw-bold text-uppercase d-block">LOGGED IN AS</span>
                    <span className="fw-bold text-uppercase">{session.name}</span>
                  </div>
                  <div className="col-12 col-md-4">
                    <span className="text-muted extra-small fw-bold text-uppercase d-block">ROLE</span>
                    <span className="badge bg-danger text-uppercase">{session.role}</span>
                  </div>
                  <div className="col-12 col-md-4">
                    <span className="text-muted extra-small fw-bold text-uppercase d-block">LOGIN TIME</span>
                    <span className="fw-semibold small">{new Date(session.loginTime).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Projects Table */}
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-bottom fw-bolder text-uppercase small d-flex justify-content-between align-items-center">
                <span><i className="bi bi-folder2-open me-2 text-primary"></i> RECENT PROJECTS</span>
                <button className="btn btn-link btn-sm text-uppercase fw-bold p-0 extra-small" onClick={() => setActiveSection('projects')}>
                  VIEW ALL →
                </button>
              </div>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 small">
                  <thead className="table-light">
                    <tr className="text-uppercase extra-small fw-bold">
                      <th>#</th><th>PROJECT NAME</th><th>OWNER</th><th>LAST EDITED BY</th><th>DATE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.slice(0, 5).map((p, i) => (
                      <tr key={p._id || p.id || i}>
                        <td className="text-muted">{i + 1}</td>
                        <td className="fw-bold text-uppercase">{p.name || 'UNTITLED'}</td>
                        <td><span className="badge bg-dark text-uppercase">{p.ownerName}</span></td>
                        <td className="text-uppercase">{p.lastEditedBy || '—'}</td>
                        <td className="text-muted">{new Date(p.lastEditedAt || p.createdAt).toLocaleDateString('en-IN')}</td>
                      </tr>
                    ))}
                    {projects.length === 0 && (
                      <tr><td colSpan={5} className="text-center text-muted text-uppercase py-3">NO PROJECTS YET</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── 2. ALL PROJECTS ── */}
        {activeSection === 'projects' && (
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom fw-bolder text-uppercase small d-flex justify-content-between align-items-center">
              <span><i className="bi bi-folder2-open me-2 text-primary"></i> ALL PROJECTS ({projects.length})</span>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 small">
                <thead className="table-light">
                  <tr className="text-uppercase extra-small fw-bold">
                    <th>#</th>
                    <th>PROJECT NAME</th>
                    <th>OWNER</th>
                    <th>CREATED</th>
                    <th>LAST EDITED BY</th>
                    <th>LAST EDITED</th>
                    <th className="text-end">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p, i) => (
                    <tr key={p._id || p.id || i}>
                      <td className="text-muted">{i + 1}</td>
                      <td className="fw-bold text-uppercase">{p.name || 'UNTITLED'}</td>
                      <td>
                        <span className={`badge text-uppercase ${p.ownerUsername === 'jagdish' ? 'bg-info text-dark' : 'bg-warning text-dark'}`}>
                          {p.ownerName}
                        </span>
                      </td>
                      <td className="text-muted">{new Date(p.createdAt).toLocaleDateString('en-IN')}</td>
                      <td className="text-uppercase fw-semibold">{p.lastEditedBy || '—'}</td>
                      <td className="text-muted">{p.lastEditedAt ? new Date(p.lastEditedAt).toLocaleDateString('en-IN') : '—'}</td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-outline-danger"
                          title="Delete Project"
                          onClick={async () => {
                            if (!confirm('DELETE THIS PROJECT AND ALL MEASUREMENT DATA?')) return;
                            try {
                              await deleteProject(p._id || p.id);
                              await loadData();
                              showToast('PROJECT DELETED');
                            } catch (err) {
                              alert('FAILED TO DELETE: ' + err.message);
                            }
                          }}
                        >
                          <i className="bi bi-trash3-fill"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {projects.length === 0 && (
                    <tr><td colSpan={7} className="text-center text-muted text-uppercase py-4">NO PROJECTS FOUND</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── 3. USER MANAGEMENT (CREATE USERS & PASSWORDS) ── */}
        {activeSection === 'users' && (
          <div>
            {/* Create New User Card */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-white border-bottom fw-bolder text-uppercase small d-flex align-items-center gap-2">
                <i className="bi bi-person-plus-fill text-primary"></i>
                CREATE NEW USER &amp; SET PASSWORD
              </div>
              <div className="card-body">
                <form onSubmit={handleCreateUser}>
                  <div className="row g-3">
                    <div className="col-12 col-md-4">
                      <label className="form-label extra-small fw-bold text-uppercase text-secondary mb-1">
                        FULL NAME *
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. Ramesh Patel"
                        value={newUserForm.name}
                        onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-3">
                      <label className="form-label extra-small fw-bold text-uppercase text-secondary mb-1">
                        USERNAME (LOGIN ID) *
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. ramesh"
                        value={newUserForm.username}
                        onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-3">
                      <label className="form-label extra-small fw-bold text-uppercase text-secondary mb-1">
                        PASSWORD *
                      </label>
                      <input
                        type="password"
                        className="form-control form-control-sm"
                        placeholder="SET PASSWORD"
                        value={newUserForm.password}
                        onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-2">
                      <label className="form-label extra-small fw-bold text-uppercase text-secondary mb-1">
                        ROLE
                      </label>
                      <select
                        className="form-select form-select-sm"
                        value={newUserForm.role}
                        onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                      >
                        <option value="USER">USER (FIELD)</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-3 text-end">
                    <button
                      type="submit"
                      className="btn btn-sm btn-primary fw-bold text-uppercase px-4"
                      disabled={creatingUser}
                    >
                      {creatingUser ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          CREATING...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-person-check-fill me-1"></i> CREATE USER
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Users List Table */}
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-bottom fw-bolder text-uppercase small d-flex justify-content-between align-items-center">
                <span>
                  <i className="bi bi-people-fill text-primary me-2"></i>
                  ACTIVE SYSTEM USERS ({usersList.length})
                </span>
                <button className="btn btn-sm btn-outline-secondary extra-small fw-bold" onClick={loadUsers}>
                  <i className="bi bi-arrow-clockwise me-1"></i> REFRESH
                </button>
              </div>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 small">
                  <thead className="table-light">
                    <tr className="text-uppercase extra-small fw-bold">
                      <th>#</th>
                      <th>NAME</th>
                      <th>USERNAME</th>
                      <th>ROLE</th>
                      <th>CREATED</th>
                      <th className="text-end">MANAGE PASSWORD &amp; ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map((u, i) => (
                      <tr key={u._id || i}>
                        <td className="text-muted">{i + 1}</td>
                        <td className="fw-bold text-uppercase">{u.name}</td>
                        <td className="fw-bold font-monospace text-primary">{u.username}</td>
                        <td>
                          <span className={`badge text-uppercase ${u.role === 'ADMIN' ? 'bg-danger' : 'bg-primary'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="text-muted">{u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : 'DEFAULT'}</td>
                        <td className="text-end">
                          <div className="btn-group btn-group-sm">
                            <button
                              type="button"
                              className="btn btn-outline-warning text-dark fw-bold extra-small text-uppercase"
                              onClick={() => handleOpenResetModal(u)}
                              title="Reset Password"
                            >
                              <i className="bi bi-key-fill me-1"></i> RESET PASSWORD
                            </button>
                            {u.username !== session.username && (
                              <button
                                type="button"
                                className="btn btn-outline-danger extra-small"
                                onClick={() => handleDeleteUser(u)}
                                title="Delete User"
                              >
                                <i className="bi bi-trash3-fill"></i>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {usersList.length === 0 && (
                      <tr><td colSpan={6} className="text-center text-muted text-uppercase py-4">LOADING USERS...</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── 4. FOUNDER SLIDES & THOUGHTS ── */}
        {activeSection === 'slides' && (
          <div>
            {/* Top Info Banner */}
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4 bg-white p-3 rounded shadow-sm border">
              <div>
                <h6 className="fw-bolder text-uppercase mb-1">
                  <i className="bi bi-images text-primary me-2"></i>FOUNDER SLIDESHOW &amp; THOUGHTS
                </h6>
                <div className="text-muted extra-small text-uppercase">
                  PHOTOS AND THOUGHTS CONFIGURED HERE WILL ROTATE SMOOTHLY ON THE LOGIN PAGE ACROSS ALL DEVICES
                </div>
              </div>
              <div className="d-flex align-items-center gap-2">
                <Link
                  to="/login"
                  target="_blank"
                  className="btn btn-sm btn-outline-primary fw-bold text-uppercase extra-small d-flex align-items-center gap-1"
                >
                  <i className="bi bi-box-arrow-up-right"></i> PREVIEW LOGIN PAGE
                </Link>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary fw-bold text-uppercase extra-small"
                  onClick={loadFounderSlides}
                  disabled={loadingSlides}
                >
                  <i className={`bi bi-arrow-clockwise me-1 ${loadingSlides ? 'spin' : ''}`}></i> REFRESH
                </button>
              </div>
            </div>

            {/* Slide Creation / Edit Form */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-white border-bottom fw-bolder text-uppercase small d-flex justify-content-between align-items-center">
                <span>
                  <i className={`bi ${editingSlideId ? 'bi-pencil-square text-warning' : 'bi-plus-circle-fill text-primary'} me-2`}></i>
                  {editingSlideId ? 'EDIT FOUNDER SLIDE' : 'ADD NEW FOUNDER SLIDE'}
                </span>
                {editingSlideId && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary extra-small fw-bold text-uppercase"
                    onClick={handleCancelEdit}
                  >
                    CANCEL EDIT
                  </button>
                )}
              </div>
              <div className="card-body">
                <form onSubmit={handleSaveSlide}>
                  <div className="row g-3">
                    {/* Founder Name */}
                    <div className="col-12 col-md-6">
                      <label className="form-label extra-small fw-bold text-uppercase text-secondary mb-1">
                        FOUNDER NAME *
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. Jagdish Suthar"
                        value={slideForm.name}
                        onChange={(e) => setSlideForm({ ...slideForm, name: e.target.value })}
                        required
                      />
                    </div>

                    {/* Role / Designation */}
                    <div className="col-12 col-md-6">
                      <label className="form-label extra-small fw-bold text-uppercase text-secondary mb-1">
                        ROLE / DESIGNATION *
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. Founder & Managing Director"
                        value={slideForm.role}
                        onChange={(e) => setSlideForm({ ...slideForm, role: e.target.value })}
                        required
                      />
                    </div>

                    {/* Company */}
                    <div className="col-12 col-md-6">
                      <label className="form-label extra-small fw-bold text-uppercase text-secondary mb-1">
                        COMPANY NAME
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. MTS Decor & Interiors"
                        value={slideForm.company}
                        onChange={(e) => setSlideForm({ ...slideForm, company: e.target.value })}
                      />
                    </div>

                    {/* Order / Priority */}
                    <div className="col-12 col-md-6">
                      <label className="form-label extra-small fw-bold text-uppercase text-secondary mb-1">
                        DISPLAY ORDER (LOWER APPEARS FIRST)
                      </label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        placeholder="0"
                        value={slideForm.order}
                        onChange={(e) => setSlideForm({ ...slideForm, order: parseInt(e.target.value, 10) || 0 })}
                      />
                    </div>

                    {/* Founder Quote / Thought */}
                    <div className="col-12">
                      <label className="form-label extra-small fw-bold text-uppercase text-secondary mb-1">
                        FOUNDER THOUGHT / QUOTE *
                      </label>
                      <textarea
                        className="form-control form-control-sm"
                        rows="3"
                        placeholder="e.g. “Precision in civil and interior measurements is the foundation of flawless execution...”"
                        value={slideForm.quote}
                        onChange={(e) => setSlideForm({ ...slideForm, quote: e.target.value })}
                        required
                      ></textarea>
                    </div>

                    {/* Founder Photo Upload or URL */}
                    <div className="col-12 col-md-8">
                      <label className="form-label extra-small fw-bold text-uppercase text-secondary mb-1">
                        FOUNDER PHOTO (UPLOAD IMAGE OR ENTER IMAGE URL) *
                      </label>
                      <div className="input-group input-group-sm mb-2">
                        <input
                          type="file"
                          className="form-control"
                          accept="image/*"
                          onChange={handleImageFileChange}
                        />
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <span className="text-muted extra-small text-uppercase">OR URL:</span>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="https://... or /photo.jpg"
                          value={slideForm.imageUrl}
                          onChange={(e) => setSlideForm({ ...slideForm, imageUrl: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Image Preview */}
                    <div className="col-12 col-md-4">
                      <label className="form-label extra-small fw-bold text-uppercase text-secondary mb-1">
                        PHOTO PREVIEW
                      </label>
                      <div
                        className="rounded-3 border overflow-hidden position-relative d-flex align-items-center justify-content-center bg-dark"
                        style={{ height: '110px', background: '#18181b' }}
                      >
                        {slideForm.imageUrl ? (
                          <img
                            src={slideForm.imageUrl}
                            alt="Preview"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div className="text-center text-muted extra-small text-uppercase p-2">
                            <i className="bi bi-image fs-3 d-block mb-1"></i>
                            NO PHOTO SELECTED
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                    {editingSlideId && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary fw-bold text-uppercase extra-small px-3"
                        onClick={handleCancelEdit}
                      >
                        CANCEL
                      </button>
                    )}
                    <button
                      type="submit"
                      className="btn btn-sm btn-primary fw-bold text-uppercase extra-small px-4"
                      disabled={savingSlide}
                    >
                      {savingSlide ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          SAVING...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-cloud-arrow-up-fill me-1"></i>
                          {editingSlideId ? 'UPDATE SLIDE' : 'SAVE FOUNDER SLIDE'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Active Slides List */}
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-bottom fw-bolder text-uppercase small d-flex justify-content-between align-items-center">
                <span>
                  <i className="bi bi-collection-play-fill text-primary me-2"></i>
                  ACTIVE FOUNDER SLIDES ({founderSlides.length})
                </span>
                <span className="badge bg-light text-secondary border extra-small">
                  ROTATES EVERY 6 SECONDS ON LOGIN
                </span>
              </div>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 small">
                  <thead className="table-light">
                    <tr className="text-uppercase extra-small fw-bold">
                      <th style={{ width: '60px' }}>ORDER</th>
                      <th style={{ width: '80px' }}>PHOTO</th>
                      <th>FOUNDER INFO</th>
                      <th>THOUGHT / QUOTE</th>
                      <th style={{ width: '110px' }} className="text-end">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {founderSlides.map((slide, idx) => (
                      <tr key={slide._id || idx}>
                        <td>
                          <span className="badge bg-secondary text-uppercase">{slide.order ?? idx}</span>
                        </td>
                        <td>
                          <img
                            src={slide.imageUrl || '/login_hero.jpg'}
                            alt={slide.name}
                            className="rounded-3 shadow-sm"
                            style={{ width: '56px', height: '56px', objectFit: 'cover' }}
                            onError={(e) => { e.target.onerror = null; e.target.src = '/login_hero.jpg'; }}
                          />
                        </td>
                        <td>
                          <div className="fw-bold text-uppercase text-dark">{slide.name}</div>
                          <div className="extra-small text-primary fw-semibold">{slide.role}</div>
                          <div className="extra-small text-muted">{slide.company || 'MTS DECOR'}</div>
                        </td>
                        <td>
                          <div className="text-secondary small fst-italic" style={{ maxWidth: '480px' }}>
                            "{slide.quote}"
                          </div>
                        </td>
                        <td className="text-end">
                          <div className="btn-group btn-group-sm">
                            <button
                              type="button"
                              className="btn btn-outline-secondary"
                              onClick={() => handleEditSlide(slide)}
                              title="Edit slide"
                            >
                              <i className="bi bi-pencil-fill"></i>
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger"
                              onClick={() => handleDeleteSlide(slide._id, slide.name)}
                              title="Delete slide"
                            >
                              <i className="bi bi-trash3-fill"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {founderSlides.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center text-muted text-uppercase py-5">
                          <i className="bi bi-images fs-2 d-block mb-2 text-secondary opacity-50"></i>
                          NO FOUNDER SLIDES ADDED YET. ADD ONE ABOVE TO SHOW ON THE LOGIN PAGE!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── 5. LOGIN CREDENTIALS ── */}
        {activeSection === 'credentials' && (
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom fw-bolder text-uppercase small">
              <i className="bi bi-key-fill me-2 text-primary"></i> SYSTEM CREDENTIALS OVERVIEW
            </div>
            <div className="card-body">
              <div className="alert alert-warning border-0 text-uppercase fw-semibold small">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                PASSWORDS CAN BE CREATED OR RESET DIRECTLY IN THE "USER MANAGEMENT" TAB.
              </div>
              <div className="table-responsive">
                <table className="table table-bordered align-middle small">
                  <thead className="table-dark text-uppercase">
                    <tr><th>#</th><th>NAME</th><th>USERNAME</th><th>ROLE</th><th>STATUS</th></tr>
                  </thead>
                  <tbody>
                    {usersList.map((u, i) => (
                      <tr key={u._id || i}>
                        <td className="text-muted">{i + 1}</td>
                        <td className="fw-bold text-uppercase">{u.name}</td>
                        <td className="fw-bold font-monospace text-primary">{u.username}</td>
                        <td>
                          <span className={`badge text-uppercase ${u.role === 'ADMIN' ? 'bg-danger' : 'bg-primary'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td><span className="badge bg-success text-uppercase">ACTIVE &amp; ENCRYPTED</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-muted extra-small text-uppercase mt-2">
                <i className="bi bi-info-circle me-1"></i> PASSWORDS ARE SECURELY BCRYPT HASHED IN MONGODB CLOUD ATLAS
              </div>
            </div>
          </div>
        )}

        {/* ── 6. SYSTEM INFO ── */}
        {activeSection === 'about' && (
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom fw-bolder text-uppercase small">
              <i className="bi bi-info-circle-fill me-2 text-primary"></i> SYSTEM INFORMATION
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-sm table-borderless small">
                  <tbody>
                    {[
                      ['APPLICATION',   'MTS DECOR — MS PRO CONTRACTOR MEASUREMENT SYSTEM'],
                      ['VERSION',       'v2.2.0 — MULTI-USER + 2FA SECURITY RELEASE'],
                      ['DATABASE',      'MONGODB ATLAS CLOUD (CLUSTER0.7HZQMCN.MONGODB.NET)'],
                      ['AUTO-SAVE',     'ENABLED (SAVES EVERY 1 SECOND AUTOMATICALLY TO CLOUD)'],
                      ['AUTHENTICATION','TWO-STEP 6-DIGIT SECURITY VERIFICATION'],
                      ['EXPORT',        'EXCEL (.XLSX) MULTI-SHEET + BROWSER PDF PRINT'],
                    ].map(([k, v], i) => (
                      <tr key={i}>
                        <td className="fw-bold text-uppercase text-secondary extra-small" style={{ width: '220px' }}>{k}</td>
                        <td className="fw-semibold small text-uppercase">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
