import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getSession, logout } from '../utils/auth';
import { getAllProjects, createProject, deleteProject } from '../utils/storage';
import { BLANK_PROJECT } from '../data/sampleData';

export default function ProjectsPage() {
  const navigate = useNavigate();
  const session = getSession();
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session || session.role === 'ADMIN') { navigate('/admin'); return; }
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await getAllProjects();
      setProjects(data);
    } catch (err) {
      setError('FAILED TO LOAD PROJECTS. IS THE SERVER RUNNING?');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleNewProject = async () => {
    try {
      const proj = await createProject(JSON.parse(JSON.stringify(BLANK_PROJECT)));
      showToast('NEW PROJECT CREATED');
      navigate(`/sheet/${proj._id}`);
    } catch (err) {
      alert('FAILED TO CREATE PROJECT: ' + err.message);
    }
  };

  const handleDelete = async (id, ownerUsername) => {
    if (ownerUsername !== session.username) { alert('YOU CAN ONLY DELETE YOUR OWN PROJECTS.'); return; }
    if (!confirm('DELETE THIS PROJECT AND ALL ITS DATA?')) return;
    try {
      await deleteProject(id);
      setProjects(prev => prev.filter(p => (p._id || p.id) !== id));
      showToast('PROJECT DELETED');
    } catch (err) {
      alert('DELETE FAILED: ' + err.message);
    }
  };

  const filtered = projects.filter(p =>
    !search ||
    (p.name || '').toUpperCase().includes(search.toUpperCase()) ||
    (p.ownerName || '').toUpperCase().includes(search.toUpperCase())
  );

  const myProjects    = filtered.filter(p => p.ownerUsername === session?.username);
  const otherProjects = filtered.filter(p => p.ownerUsername !== session?.username);

  const ProjectCard = ({ proj, isOwn }) => {
    const id = proj._id || proj.id;
    return (
      <div className={`card border-0 shadow-sm h-100`} style={{ borderRadius: '10px', overflow: 'hidden', borderLeft: isOwn ? undefined : '4px solid #ffc107' }}>
        <div className={`py-1 px-3 ${isOwn ? 'bg-dark' : 'bg-warning'}`}>
          <span className={`extra-small fw-bolder text-uppercase ${isOwn ? 'text-white' : 'text-dark'}`}>
            {isOwn ? '📁 MY PROJECT' : `👤 ${(proj.ownerName || '').toUpperCase()}'S PROJECT`}
          </span>
        </div>
        <div className="card-body p-3">
          <h6 className="fw-bolder text-uppercase mb-1 text-truncate">{proj.name || 'UNTITLED PROJECT'}</h6>
          <div className="text-muted extra-small text-uppercase mb-2">
            <i className="bi bi-person-fill me-1"></i>OWNER: <strong>{proj.ownerName}</strong>
          </div>
          <div className="d-flex flex-wrap gap-1 mb-3">
            <span className="badge bg-light text-dark border extra-small">
              <i className="bi bi-calendar3 me-1"></i>
              {new Date(proj.createdAt).toLocaleDateString('en-IN')}
            </span>
            {proj.lastEditedBy && (
              <span className="badge bg-light text-dark border extra-small">
                <i className="bi bi-pencil-fill me-1"></i>LAST: {(proj.lastEditedBy || '').toUpperCase()}
              </span>
            )}
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-dark btn-sm fw-bold text-uppercase flex-grow-1" onClick={() => navigate(`/sheet/${id}`)}>
              <i className={`bi ${isOwn ? 'bi-pencil-square' : 'bi-eye'} me-1`}></i>
              {isOwn ? 'OPEN & EDIT' : 'VIEW / EDIT'}
            </button>
            {isOwn && (
              <button className="btn btn-outline-danger btn-sm fw-bold px-2" onClick={() => handleDelete(id, proj.ownerUsername)}>
                <i className="bi bi-trash3-fill"></i>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!session || session.role === 'ADMIN') return null;

  return (
    <div className="min-vh-100 bg-light d-flex flex-column">
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

      {/* Top Nav */}
      <nav className="navbar navbar-dark bg-dark px-4 py-2 shadow-sm">
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center gap-2">
            <img
              src="/mtsdecor.png"
              alt="MTS Decor"
              style={{ height: '28px', maxWidth: '120px', objectFit: 'contain' }}
              onError={(e) => { e.target.onerror = null; e.target.src = '/logo.png'; }}
            />
            <span className="navbar-brand fw-bolder fs-5 text-uppercase mb-0">MS PRO</span>
          </div>
          <span className="text-secondary d-none d-md-inline extra-small text-uppercase">MEASUREMENT SHEET SYSTEM</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Link
            to="/profile"
            className="btn btn-outline-light btn-sm extra-small fw-bold text-uppercase d-flex align-items-center gap-1"
            title="View & Edit Profile"
          >
            <i className="bi bi-person-circle text-warning"></i>
            <span className="d-none d-sm-inline">{session.name}</span>
          </Link>
          <button className="btn btn-warning btn-sm fw-bold text-uppercase" onClick={handleNewProject}>
            <i className="bi bi-plus-circle-fill me-1"></i> NEW PROJECT
          </button>
          <button className="btn btn-outline-danger btn-sm fw-bold text-uppercase" onClick={() => { logout(); navigate('/login'); }}>
            <i className="bi bi-box-arrow-right"></i>
          </button>
        </div>
      </nav>

      <main className="container-fluid py-4 px-4 flex-grow-1">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
          <div>
            <h4 className="fw-bolder text-uppercase mb-0">
              <i className="bi bi-folder2-open text-primary me-2"></i>ALL PROJECTS
            </h4>
            <div className="text-muted extra-small text-uppercase">
              {projects.length} PROJECT{projects.length !== 1 ? 'S' : ''} TOTAL &bull; LOGGED IN AS <strong>{session.name}</strong>
            </div>
          </div>
          <div style={{ width: '280px' }}>
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0"><i className="bi bi-search text-muted"></i></span>
              <input type="text" className="form-control border-start-0 text-uppercase fw-semibold" placeholder="SEARCH PROJECTS..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </div>

        {/* States */}
        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-dark mb-3" role="status"></div>
            <div className="text-muted text-uppercase fw-semibold small">LOADING PROJECTS FROM CLOUD...</div>
          </div>
        )}

        {error && !loading && (
          <div className="alert alert-danger border-0 text-uppercase fw-semibold">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>{error}
            <button className="btn btn-sm btn-outline-danger ms-3 fw-bold" onClick={fetchProjects}>RETRY</button>
          </div>
        )}

        {!loading && !error && projects.length === 0 && (
          <div className="text-center py-5 my-5">
            <div className="display-1 mb-3">📋</div>
            <h5 className="fw-bolder text-uppercase">NO PROJECTS YET</h5>
            <p className="text-muted text-uppercase small">CREATE YOUR FIRST MEASUREMENT PROJECT TO GET STARTED.</p>
            <button className="btn btn-dark fw-bold text-uppercase px-4 mt-2" onClick={handleNewProject}>
              <i className="bi bi-plus-circle-fill me-2"></i> CREATE FIRST PROJECT
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {myProjects.length > 0 && (
              <div className="mb-4">
                <h6 className="fw-bolder text-uppercase text-dark mb-3">
                  <span className="badge bg-dark px-3 py-2">MY PROJECTS ({myProjects.length})</span>
                </h6>
                <div className="row g-3">
                  {myProjects.map(proj => (
                    <div key={proj._id || proj.id} className="col-12 col-sm-6 col-lg-4 col-xl-3">
                      <ProjectCard proj={proj} isOwn={true} />
                    </div>
                  ))}
                  <div className="col-12 col-sm-6 col-lg-4 col-xl-3">
                    <div className="card border-2 h-100 d-flex align-items-center justify-content-center text-center p-4"
                      style={{ borderRadius: '10px', cursor: 'pointer', minHeight: '160px', borderStyle: 'dashed', borderColor: '#cbd5e1' }}
                      onClick={handleNewProject}>
                      <i className="bi bi-plus-circle fs-2 text-muted mb-2"></i>
                      <div className="text-muted fw-bold text-uppercase extra-small">NEW PROJECT</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {otherProjects.length > 0 && (
              <div className="mb-4">
                <h6 className="fw-bolder text-uppercase text-dark mb-3 d-flex align-items-center gap-2">
                  <span className="badge bg-warning text-dark px-3 py-2">OTHER USERS' PROJECTS ({otherProjects.length})</span>
                  <span className="extra-small text-muted fw-normal">— CREDENTIAL VERIFICATION REQUIRED TO EDIT</span>
                </h6>
                <div className="row g-3">
                  {otherProjects.map(proj => (
                    <div key={proj._id || proj.id} className="col-12 col-sm-6 col-lg-4 col-xl-3">
                      <ProjectCard proj={proj} isOwn={false} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="bg-white border-top py-2 text-center text-muted extra-small text-uppercase">
        © {new Date().getFullYear()} MS PRO — CONTRACTOR MEASUREMENT SYSTEM &bull; CLOUD SYNC: MONGODB ATLAS
      </footer>
    </div>
  );
}
