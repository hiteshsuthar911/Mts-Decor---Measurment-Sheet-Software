import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getSession, logout, ADMIN_USERS } from '../utils/auth';
import { getAllProjects, deleteProject, getProjectStats } from '../utils/storage';

export default function AdminPanel() {
  const navigate = useNavigate();
  const session = getSession();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

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

  useEffect(() => {
    if (!session || session.role !== 'ADMIN') { navigate('/login'); return; }
    loadData();
  }, []);

  if (!session || session.role !== 'ADMIN') return null;

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };
  const users = ADMIN_USERS.filter(u => u.role === 'USER');

  const navItems = [
    { key: 'dashboard',  label: 'DASHBOARD',         icon: 'bi-speedometer2' },
    { key: 'projects',   label: 'ALL PROJECTS',       icon: 'bi-folder2-open' },
    { key: 'users',      label: 'USER MANAGEMENT',    icon: 'bi-people-fill'  },
    { key: 'credentials',label: 'LOGIN CREDENTIALS',  icon: 'bi-key-fill'     },
    { key: 'about',      label: 'SYSTEM INFO',        icon: 'bi-info-circle-fill' },
  ];

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
            <span className="fs-4">📐</span>
            <span className="fw-bolder fs-5 text-uppercase">MS PRO</span>
          </div>
          <div className="text-secondary extra-small text-uppercase">ADMIN CONTROL PANEL</div>
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
              onClick={() => { setActiveSection(item.key); loadData(); }}
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
