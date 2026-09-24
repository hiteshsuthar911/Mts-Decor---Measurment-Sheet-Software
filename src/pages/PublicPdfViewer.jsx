import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import PrintSheetView from '../components/PrintSheetView';
import { getSession } from '../utils/auth';

export default function PublicPdfViewer() {
  const params = useParams();
  const [searchParams] = useSearchParams();

  // Extract projectId from /pdf/:projectId, /verify/:projectId, or query ?id=..., or hash #verify?id=...
  let resolvedId = params.projectId || searchParams.get('id') || '';
  if (!resolvedId && typeof window !== 'undefined' && window.location.hash) {
    const match = window.location.hash.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      resolvedId = match[1];
    }
  }

  const [projectId, setProjectId] = useState(resolvedId);
  const [projectData, setProjectData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const session = getSession();

  useEffect(() => {
    if (!resolvedId) {
      setError('Invalid or missing project link. Please scan the QR code again.');
      setLoading(false);
      return;
    }

    setProjectId(resolvedId);

    const fetchPublicProject = async () => {
      try {
        setLoading(true);
        setError('');

        const res = await fetch(`/api/projects/public-pdf/${resolvedId}`);
        if (res.ok) {
          const data = await res.json();
          // Structure expected by PrintSheetView: header, areas, settings, clientApproval, etc.
          setProjectData({
            id: data.id,
            projectTitle: data.projectName,
            header: data.header || {},
            areas: data.areas || [],
            settings: data.settings || {},
            clientApproval: data.clientApproval || null,
            engineerQueries: data.engineerQueries || [],
            companySlug: data.companySlug || 'mts-decor'
          });
          setLoading(false);
          return;
        }

        // If server responded with 404 or error, check local storage fallback (for offline or localhost demo)
        const localProjectsStr = localStorage.getItem('mts_projects_cloud') || localStorage.getItem('mts_decor_projects');
        if (localProjectsStr) {
          try {
            const localProjects = JSON.parse(localProjectsStr);
            const found = Array.isArray(localProjects)
              ? localProjects.find(p => String(p.id) === String(resolvedId) || String(p._id) === String(resolvedId))
              : null;
            if (found) {
              setProjectData(found.data || found);
              setLoading(false);
              return;
            }
          } catch (e) {
            console.warn('LocalStorage project fallback check failed:', e);
          }
        }

        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Measurement sheet not found or link has expired.');
      } catch (err) {
        console.error('Failed to load public PDF document:', err);
        // Fallback check in case network failed
        const localProjectsStr = localStorage.getItem('mts_projects_cloud') || localStorage.getItem('mts_decor_projects');
        if (localProjectsStr) {
          try {
            const localProjects = JSON.parse(localProjectsStr);
            const found = Array.isArray(localProjects)
              ? localProjects.find(p => String(p.id) === String(resolvedId) || String(p._id) === String(resolvedId))
              : null;
            if (found) {
              setProjectData(found.data || found);
              setLoading(false);
              return;
            }
          } catch (e) {
            // ignore
          }
        }
        setError(err.message || 'Could not load measurement sheet. Please verify your connection.');
        setLoading(false);
      }
    };

    fetchPublicProject();
  }, [resolvedId]);

  if (loading) {
    return (
      <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center bg-light p-4">
        <div className="spinner-border text-success mb-3" style={{ width: '3rem', height: '3rem' }} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <h5 className="fw-bold text-dark text-uppercase" style={{ letterSpacing: '1px' }}>
          Opening Verified Measurement Sheet PDF…
        </h5>
        <p className="text-muted small">Accessing official contractor certified copy</p>
      </div>
    );
  }

  if (error || !projectData) {
    return (
      <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center bg-light p-4">
        <div className="card shadow-sm border-0 p-4 text-center" style={{ maxWidth: '480px' }}>
          <div className="text-danger mb-3">
            <i className="bi bi-file-earmark-x" style={{ fontSize: '3rem' }}></i>
          </div>
          <h4 className="fw-bold text-dark text-uppercase mb-2">Document Unavailable</h4>
          <p className="text-secondary small mb-4">
            {error || 'This measurement sheet could not be found or has been moved.'}
          </p>
          <div className="d-flex justify-content-center gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm fw-bold px-3"
              onClick={() => window.location.reload()}
            >
              <i className="bi bi-arrow-clockwise me-1"></i> Retry
            </button>
            <Link to="/login" className="btn btn-dark btn-sm fw-bold px-3">
              <i className="bi bi-box-arrow-in-right me-1"></i> Login to Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="public-pdf-container min-vh-100 bg-secondary-subtle">
      {/* ── Public Verified Document Top Bar ── */}
      <header className="d-print-none bg-dark text-white py-2 px-3 shadow-sm border-bottom border-secondary sticky-top">
        <div className="container-fluid d-flex flex-wrap justify-content-between align-items-center gap-2">
          {/* Brand & Verification Badge */}
          <div className="d-flex align-items-center gap-2">
            <img
              src="/mtsdecor.png"
              alt="MTS"
              style={{ height: '26px', objectFit: 'contain' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <span className="badge bg-success text-white fw-bold text-uppercase d-flex align-items-center gap-1" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>
              <i className="bi bi-patch-check-fill"></i>
              <span>OFFICIAL VERIFIED COPY</span>
            </span>
            <span className="text-white-50 d-none d-md-inline" style={{ fontSize: '12px' }}>|</span>
            <span className="fw-bold text-light small d-none d-sm-inline">
              {projectData.projectTitle || projectData.header?.projectName || 'MEASUREMENT SHEET'}
            </span>
          </div>

          {/* Quick Actions */}
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-sm btn-light fw-bold text-dark d-flex align-items-center gap-1 shadow-sm"
              onClick={() => window.print()}
              style={{ fontSize: '11px', padding: '5px 12px' }}
            >
              <i className="bi bi-printer-fill text-dark"></i>
              <span>PRINT / PDF</span>
            </button>

            {session?.token && (
              <Link
                to={`/sheet/${projectId}`}
                className="btn btn-sm btn-outline-light fw-bold d-none d-sm-inline-flex align-items-center gap-1"
                style={{ fontSize: '11px', padding: '5px 10px' }}
              >
                <i className="bi bi-pencil-square"></i>
                <span>EDIT SHEET</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Print & PDF Rendering ── */}
      <main className="py-2 py-md-4">
        <PrintSheetView
          projectData={projectData}
          projectId={projectId}
          billingMode={projectData.settings?.billingMode}
          currencySymbol={projectData.settings?.currencySymbol || '₹'}
          isReadOnly={true}
          initialViewMode="full"
        />
      </main>
    </div>
  );
}
