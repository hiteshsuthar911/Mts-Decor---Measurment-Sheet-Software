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
  deleteFounderSlide
} from '../utils/storage';

export default function AdminPanel() {
  const navigate = useNavigate();
  const session = getSession();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  // Founder slides state
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

  useEffect(() => {
    if (!session || session.role !== 'ADMIN') { navigate('/login'); return; }
    loadData();
    loadFounderSlides();
  }, []);

  if (!session || session.role !== 'ADMIN') return null;

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };
  const users = ADMIN_USERS.filter(u => u.role === 'USER');

  const navItems = [
    { key: 'dashboard',   label: 'DASHBOARD',         icon: 'bi-speedometer2' },
    { key: 'projects',    label: 'ALL PROJECTS',       icon: 'bi-folder2-open' },
    { key: 'users',       label: 'USER MANAGEMENT',    icon: 'bi-people-fill'  },
    { key: 'slides',      label: 'FOUNDER SLIDES',     icon: 'bi-images'       },
    { key: 'credentials', label: 'LOGIN CREDENTIALS',  icon: 'bi-key-fill'     },
    { key: 'about',       label: 'SYSTEM INFO',        icon: 'bi-info-circle-fill' },
  ];

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
    // Scroll smoothly to form
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
    <div className="admin-panel d-flex min-vh-100 bg-light">
      {/* Toast */}
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

      {/* ── SIDEBAR ─────────────────────────────────────────── */}
      <aside className="admin-sidebar bg-dark text-white d-flex flex-column" style={{ width: '260px', minHeight: '100vh' }}>
        <div className="p-4 border-bottom border-secondary">
          <div className="d-flex align-items-center gap-2 mb-1">
            <img 
              src="/mtsdecor.png" 
              alt="MTS Decor" 
              style={{ height: 32, maxWidth: '100%', objectFit: 'contain' }} 
              onError={(e) => { e.target.onerror = null; e.target.src = '/logo.png'; }}
            />
          </div>
          <div className="text-secondary extra-small text-uppercase">MS PRO &bull; ADMIN CONTROL PANEL</div>
        </div>

        {/* Logged-in admin info */}
        <div className="px-4 py-3 border-bottom border-secondary">
          <div className="d-flex align-items-center gap-3">
            <div className="rounded-circle bg-danger d-flex align-items-center justify-content-center fw-bolder text-white"
              style={{ width: 40, height: 40, fontSize: 16 }}>A</div>
            <div>
              <div className="fw-bold small text-uppercase">{session.name}</div>
              <span className="badge bg-danger extra-small px-2 py-1">SUPER ADMIN</span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-grow-1 px-3 pt-3">
          {navItems.map(item => (
            <button
              key={item.key}
              className={`btn w-100 text-start mb-1 py-2 px-3 rounded fw-semibold extra-small text-uppercase d-flex align-items-center gap-2 ${
                activeSection === item.key ? 'btn-primary text-white' : 'btn-dark text-secondary border-0'
              }`}
              onClick={() => { 
                setActiveSection(item.key); 
                if (item.key === 'slides') loadFounderSlides();
                else loadData(); 
              }}
            >
              <i className={`bi ${item.icon}`}></i>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-4">
          <button
            className="btn btn-outline-danger text-uppercase fw-bold small w-100 d-flex align-items-center gap-2 justify-content-center"
            onClick={() => { logout(); navigate('/login'); }}
          >
            <i className="bi bi-box-arrow-right"></i> LOGOUT
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ────────────────────────────────────── */}
      <main className="flex-grow-1 p-4">
        {/* Top Bar */}
        <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
          <div>
            <h4 className="fw-bolder text-uppercase mb-0">
              {navItems.find(n => n.key === activeSection)?.label}
            </h4>
            <div className="text-muted extra-small text-uppercase">MS PRO &bull; ADMIN PANEL</div>
          </div>
          <button className="btn btn-sm btn-outline-secondary text-uppercase fw-bold extra-small" onClick={loadData}>
            <i className="bi bi-arrow-clockwise me-1"></i> REFRESH DATA
          </button>
        </div>

        {/* ── DASHBOARD ── */}
        {activeSection === 'dashboard' && (
          <div>
            <div className="row g-3 mb-4">
              {[
                { label: 'TOTAL PROJECTS',   value: projects.length,                icon: 'bi-folder2-open',    color: 'primary'   },
                { label: 'TOTAL USERS',      value: users.length,                   icon: 'bi-people-fill',     color: 'success'   },
                { label: 'JAGDISH PROJECTS', value: stats['jagdish']?.count  || 0,   icon: 'bi-person-fill',     color: 'info'      },
                { label: 'MADANLAL PROJECTS',value: stats['madanlal']?.count || 0,   icon: 'bi-person-fill',     color: 'warning'   },
              ].map((kpi, i) => (
                <div key={i} className="col-6 col-lg-3">
                  <div className={`card border-0 border-start border-${kpi.color} border-4 shadow-sm position-relative overflow-hidden`}>
                    <div className="card-body py-3">
                      <div className="text-muted extra-small fw-bold text-uppercase mb-1">{kpi.label}</div>
                      <div className={`fs-3 fw-bolder text-${kpi.color}`}>{kpi.value}</div>
                    </div>
                    <i className={`bi ${kpi.icon} position-absolute end-0 bottom-0 me-3 mb-1 opacity-10`} style={{ fontSize: '3rem' }}></i>
                  </div>
                </div>
              ))}
            </div>

            {/* Session Info */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-white border-bottom fw-bolder text-uppercase small">
                <i className="bi bi-clock-history me-2 text-primary"></i> ACTIVE SESSION
              </div>
              <div className="card-body">
                <table className="table table-sm table-borderless mb-0">
                  <tbody>
                    {[
                      ['LOGGED IN AS', session.name],
                      ['ROLE', session.role],
                      ['LOGIN TIME', new Date(session.loginTime).toLocaleString('en-IN').toUpperCase()],
                    ].map(([k, v], i) => (
                      <tr key={i}>
                        <td className="text-muted extra-small fw-bold text-uppercase" style={{ width: '180px' }}>{k}</td>
                        <td className="fw-bold text-uppercase small">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Projects Preview */}
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-bottom fw-bolder text-uppercase small d-flex justify-content-between">
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

        {/* ── ALL PROJECTS ── */}
        {activeSection === 'projects' && (
          <div>
            <div className="table-responsive card border-0 shadow-sm">
              <div className="card-header bg-white border-bottom fw-bolder text-uppercase small d-flex justify-content-between align-items-center">
                <span><i className="bi bi-folder2-open me-2 text-primary"></i> ALL PROJECTS ({projects.length})</span>
                <button className="btn btn-sm btn-outline-secondary text-uppercase fw-bold extra-small"
                  onClick={loadData}>
                  <i className="bi bi-arrow-clockwise me-1"></i> REFRESH
                </button>
              </div>
              <table className="table table-hover align-middle mb-0 small">
                <thead className="table-light">
                  <tr className="text-uppercase extra-small fw-bold">
                    <th>#</th>
                    <th>PROJECT NAME</th>
                    <th>OWNER</th>
                    <th>CREATED</th>
                    <th>LAST EDITED BY</th>
                    <th>LAST EDITED</th>
                    <th></th>
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
                      <td>
                        <button
                          className="btn btn-xs btn-outline-danger text-uppercase fw-bold"
                          onClick={async () => {
                            if (!confirm('DELETE THIS PROJECT?')) return;
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

        {/* ── USER MANAGEMENT ── */}
        {activeSection === 'users' && (
          <div>
            <div className="row g-3 mb-4">
              {users.map((u, i) => {
                const userProjects = stats[u.username]?.projects || [];
                const lastProject = userProjects[0];
                return (
                  <div key={i} className="col-12 col-md-6">
                    <div className="card border-0 shadow-sm h-100">
                      <div className={`card-header border-0 fw-bolder text-uppercase ${i === 0 ? 'bg-info bg-opacity-25' : 'bg-warning bg-opacity-25'}`}>
                        <i className="bi bi-person-circle me-2"></i>{u.name}
                        <span className="badge bg-dark ms-2 extra-small">{u.role}</span>
                      </div>
                      <div className="card-body">
                        <table className="table table-sm table-borderless mb-0 small">
                          <tbody>
                            <tr>
                              <td className="text-muted text-uppercase fw-bold extra-small">USERNAME</td>
                              <td className="fw-bold text-uppercase">{u.username}</td>
                            </tr>
                            <tr>
                              <td className="text-muted text-uppercase fw-bold extra-small">TOTAL PROJECTS</td>
                              <td className="fw-bold">{userProjects.length}</td>
                            </tr>
                            <tr>
                              <td className="text-muted text-uppercase fw-bold extra-small">LAST PROJECT</td>
                              <td className="fw-semibold text-uppercase">{lastProject?.name || '—'}</td>
                            </tr>
                            <tr>
                              <td className="text-muted text-uppercase fw-bold extra-small">LAST ACTIVE</td>
                              <td className="text-muted">{lastProject ? new Date(lastProject.lastEditedAt || lastProject.createdAt).toLocaleDateString('en-IN') : '—'}</td>
                            </tr>
                          </tbody>
                        </table>
                        {userProjects.length > 0 && (
                          <div className="mt-3">
                            <div className="extra-small fw-bold text-uppercase text-muted mb-2">PROJECTS:</div>
                            <div className="d-flex flex-wrap gap-1">
                              {userProjects.map((p, j) => (
                                <span key={j} className="badge bg-light text-dark border extra-small text-uppercase">{p.name || 'UNTITLED'}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── FOUNDER SLIDES ── */}
        {activeSection === 'slides' && (
          <div>
            {/* Header info & Preview Button */}
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4 bg-white p-3 rounded shadow-sm border">
              <div>
                <h6 className="fw-bolder text-uppercase mb-1">
                  <i className="bi bi-images text-primary me-2"></i>FOUNDER SLIDESHOW &amp; THOUGHTS
                </h6>
                <div className="text-muted extra-small text-uppercase">
                  PHOTOS AND THOUGHTS CONFIGURED HERE WILL DYNAMICALLY ROTATE ON THE LOGIN PAGE
                </div>
              </div>
              <div className="d-flex align-items-center gap-2">
                <a
                  href="/login"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-sm btn-outline-primary fw-bold text-uppercase extra-small d-flex align-items-center gap-1"
                >
                  <i className="bi bi-box-arrow-up-right"></i> PREVIEW LOGIN PAGE
                </a>
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

        {/* ── CREDENTIALS ── */}
        {activeSection === 'credentials' && (
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom fw-bolder text-uppercase small">
              <i className="bi bi-key-fill me-2 text-primary"></i> LOGIN CREDENTIALS
            </div>
            <div className="card-body">
              <div className="alert alert-warning border-0 text-uppercase fw-semibold small">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                CHANGE DEFAULT PASSWORDS BEFORE LIVE USE.
              </div>
              <table className="table table-bordered align-middle small">
                <thead className="table-dark text-uppercase">
                  <tr><th>#</th><th>NAME</th><th>USERNAME</th><th>PASSWORD</th><th>ROLE</th></tr>
                </thead>
                <tbody>
                  {ADMIN_USERS.map((u, i) => (
                    <tr key={i}>
                      <td className="text-muted">{i + 1}</td>
                      <td className="fw-bold text-uppercase">{u.name}</td>
                      <td className="fw-bold text-uppercase">{u.username}</td>
                      <td className="text-muted fw-semibold">{u.defaultPassword || '••••••••'}</td>
                      <td><span className={`badge text-uppercase ${u.role === 'ADMIN' ? 'bg-danger' : 'bg-primary'}`}>{u.role}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-muted extra-small text-uppercase mt-2">
                <i className="bi bi-info-circle me-1"></i> PASSWORDS ARE SECURELY HASHED IN MONGODB CLOUD ATLAS
              </div>
            </div>
          </div>
        )}

        {/* ── SYSTEM INFO ── */}
        {activeSection === 'about' && (
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom fw-bolder text-uppercase small">
              <i className="bi bi-info-circle-fill me-2 text-primary"></i> SYSTEM INFORMATION
            </div>
            <div className="card-body">
              <table className="table table-sm table-borderless small">
                <tbody>
                  {[
                    ['APPLICATION',   'MS PRO — MULTI-USER CONTRACTOR MEASUREMENT SHEET'],
                    ['VERSION',       'v2.0.0 — MULTI-USER RELEASE'],
                    ['USERS',         'JAGDISH, MADANLAL (FIELD USERS) + ADMIN (ADMIN ONLY)'],
                    ['DATABASE',      'MONGODB ATLAS CLOUD (CLUSTER0.7HZQMCN.MONGODB.NET)'],
                    ['BACKEND API',   'NODE.JS / EXPRESS ON PORT 5001'],
                    ['EDIT GUARD',    'CREDENTIAL VERIFICATION REQUIRED TO EDIT ANOTHER USER\'S PROJECT'],
                    ['EXPORT',        'XLSX (MULTI-SHEET) + BROWSER PRINT TO PDF'],
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
        )}
      </main>
    </div>
  );
}
