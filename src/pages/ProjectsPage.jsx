import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { getSession, logout } from '../utils/auth';
import {
  getAllProjects,
  createProject,
  deleteProject,
  getAllExcelFiles,
  deleteExcelFile,
  saveExcelFile,
  downloadExcelFromBase64
} from '../utils/storage';
import { BLANK_PROJECT } from '../data/sampleData';
import AppStoreBadges from '../components/AppStoreBadges';
import ExcelViewerModal from '../components/ExcelViewerModal';

export default function ProjectsPage() {
  const navigate = useNavigate();
  const session = getSession();
  const fileInputRef = useRef(null);

  // Tab State: 'projects' or 'excel'
  const [activeTab, setActiveTab] = useState('projects');

  // Projects State
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Excel Files State
  const [excelFiles, setExcelFiles] = useState([]);
  const [loadingExcel, setLoadingExcel] = useState(false);
  const [selectedExcelId, setSelectedExcelId] = useState(null);
  const [viewerInitialFile, setViewerInitialFile] = useState(null);
  const [uploadingExcel, setUploadingExcel] = useState(false);

  useEffect(() => {
    if (!session) { navigate('/login'); return; }
    if (session.role === 'ADMIN') { navigate('/admin'); return; }
    fetchProjects();
    fetchExcelFiles();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await getAllProjects();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('FAILED TO LOAD PROJECTS. IS THE SERVER RUNNING?');
    } finally {
      setLoading(false);
    }
  };

  const fetchExcelFiles = async () => {
    try {
      setLoadingExcel(true);
      const data = await getAllExcelFiles();
      setExcelFiles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load excel files:', err);
    } finally {
      setLoadingExcel(false);
    }
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const handleNewProject = async () => {
    try {
      const proj = await createProject(JSON.parse(JSON.stringify(BLANK_PROJECT)));
      showToast('NEW PROJECT CREATED');
      navigate(`/sheet/${proj._id}`);
    } catch (err) {
      alert('FAILED TO CREATE PROJECT: ' + err.message);
    }
  };

  const handleDeleteProject = async (id, ownerUsername) => {
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

  const handleDeleteExcel = async (id, ownerUsername) => {
    if (ownerUsername !== session.username && session.role !== 'ADMIN') {
      alert('YOU CAN ONLY DELETE YOUR OWN EXCEL FILES.');
      return;
    }
    if (!confirm('DELETE THIS SAVED EXCEL WORKBOOK?')) return;
    try {
      await deleteExcelFile(id);
      setExcelFiles(prev => prev.filter(f => f._id !== id));
      showToast('EXCEL FILE DELETED');
    } catch (err) {
      alert('DELETE FAILED: ' + err.message);
    }
  };

  const handleDownloadExcelCard = async (excelDoc) => {
    try {
      if (excelDoc.fileBase64) {
        downloadExcelFromBase64(excelDoc.fileName, excelDoc.fileBase64);
        showToast('DOWNLOADING ' + excelDoc.fileName);
      } else {
        // Need to fetch full doc if fileBase64 was omitted in listing
        showToast('FETCHING SPREADSHEET...');
        const res = await fetch(`/api/excel-files/${excelDoc._id}/download`, {
          headers: {
            Authorization: `Bearer ${JSON.parse(localStorage.getItem('MS_PRO_AUTH_V1') || '{}').token || ''}`
          }
        });
        if (!res.ok) throw new Error('DOWNLOAD FAILED');
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = excelDoc.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('DOWNLOAD COMPLETE');
      }
    } catch (err) {
      console.error('Download error:', err);
      alert('DOWNLOAD FAILED: ' + err.message);
    }
  };

  // Upload external .xlsx workbook
  const handleUploadExcelFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingExcel(true);
      showToast('READING EXCEL FILE...');

      const arrayBuffer = await file.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { type: 'array' });
      const base64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });

      // Extract sheet rows
      const sheetsData = wb.SheetNames.map(name => ({
        sheetName: name,
        rows: XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: '' })
      }));

      const payload = {
        projectName: file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
        fileName: file.name,
        fileBase64: base64,
        sheetsData,
        fileSize: file.size,
        billingMode: false,
        metadata: {
          uploaded: true,
          originalName: file.name,
          sheetCount: wb.SheetNames.length,
        }
      };

      const saved = await saveExcelFile(payload);
      setExcelFiles(prev => [saved, ...prev]);
      showToast('EXCEL FILE SAVED TO DASHBOARD!');
    } catch (err) {
      console.error('Upload excel error:', err);
      alert('FAILED TO UPLOAD EXCEL FILE: ' + err.message);
    } finally {
      setUploadingExcel(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Filtered lists
  const safeProjects = Array.isArray(projects) ? projects : [];
  const filteredProjects = safeProjects.filter(p =>
    !search ||
    (p.name || '').toUpperCase().includes(search.toUpperCase()) ||
    (p.ownerName || '').toUpperCase().includes(search.toUpperCase())
  );
  const myProjects    = filteredProjects.filter(p => p.ownerUsername === session?.username);
  const otherProjects = filteredProjects.filter(p => p.ownerUsername !== session?.username);

  const safeExcelFiles = Array.isArray(excelFiles) ? excelFiles : [];
  const filteredExcelFiles = safeExcelFiles.filter(f =>
    !search ||
    (f.fileName || '').toUpperCase().includes(search.toUpperCase()) ||
    (f.projectName || '').toUpperCase().includes(search.toUpperCase()) ||
    (f.ownerName || '').toUpperCase().includes(search.toUpperCase())
  );

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

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
              <button className="btn btn-outline-danger btn-sm fw-bold px-2" onClick={() => handleDeleteProject(id, proj.ownerUsername)}>
                <i className="bi bi-trash3-fill"></i>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const ExcelCard = ({ file }) => {
    const isOwn = file.ownerUsername === session?.username;
    return (
      <div
        className="card border-0 shadow-sm h-100"
        style={{
          borderRadius: '10px',
          overflow: 'hidden',
          borderLeft: '4px solid #107c41',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        }}
      >
        {/* Card Header Ribbon */}
        <div
          style={{
            backgroundColor: '#107c41',
            padding: '5px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span className="extra-small fw-bolder text-uppercase text-white d-flex align-items-center gap-1">
            <i className="bi bi-file-earmark-excel-fill"></i> EXCEL SPREADSHEET
          </span>
          {file.billingMode && (
            <span className="badge bg-warning text-dark extra-small fw-bold">
              BILLING MODE
            </span>
          )}
        </div>

        <div className="card-body p-3 d-flex flex-column justify-content-between">
          <div>
            <h6
              className="fw-bolder text-uppercase mb-1 text-truncate"
              title={file.fileName}
              style={{ color: '#0f172a' }}
            >
              {file.fileName}
            </h6>

            <div className="text-muted extra-small text-uppercase mb-2 text-truncate">
              <i className="bi bi-folder2 text-success me-1"></i>
              PROJECT: <strong>{file.projectName || 'MEASUREMENT SHEET'}</strong>
            </div>

            <div className="d-flex flex-wrap gap-1 mb-3">
              <span className="badge bg-light text-dark border extra-small">
                <i className="bi bi-calendar3 me-1"></i>
                {new Date(file.createdAt).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
              <span className="badge bg-light text-dark border extra-small">
                <i className="bi bi-hdd me-1"></i>
                {formatFileSize(file.fileSize)}
              </span>
              <span className="badge bg-light text-dark border extra-small">
                <i className="bi bi-person me-1"></i>
                {(file.ownerName || 'USER').toUpperCase()}
              </span>
            </div>
          </div>

          {/* Action buttons: Open Excel View & Download */}
          <div className="d-flex gap-2 mt-2">
            <button
              className="btn btn-sm fw-bold text-uppercase flex-grow-1 d-flex align-items-center justify-content-center gap-1"
              style={{
                backgroundColor: '#107c41',
                color: '#ffffff',
                border: 'none',
              }}
              onClick={() => {
                setSelectedExcelId(file._id);
              }}
            >
              <i className="bi bi-eye-fill"></i>
              <span>OPEN EXCEL VIEW</span>
            </button>

            <button
              className="btn btn-outline-success btn-sm fw-bold px-2"
              title="Download .xlsx File"
              onClick={() => handleDownloadExcelCard(file)}
            >
              <i className="bi bi-download"></i>
            </button>

            {(isOwn || session.role === 'ADMIN') && (
              <button
                className="btn btn-outline-danger btn-sm fw-bold px-2"
                title="Delete Excel File"
                onClick={() => handleDeleteExcel(file._id, file.ownerUsername)}
              >
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
        <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 99999 }}>
          <div className="toast show bg-dark text-white border-0 shadow px-3 py-2 rounded">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-check-circle-fill text-success fs-5"></i>
              <span className="small fw-bold text-uppercase">{toast}</span>
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Input for Excel Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUploadExcelFile}
        accept=".xlsx, .xls"
        style={{ display: 'none' }}
      />

      {/* Top Nav */}
      <nav className="navbar navbar-dark bg-dark px-2 px-sm-4 py-2 shadow-sm">
        <div className="d-flex align-items-center gap-2 gap-sm-3">
          <div className="d-flex align-items-center gap-2">
            <img
              src="/mtsdecor.png"
              alt="MTS Decor"
              style={{ height: '26px', maxWidth: '110px', objectFit: 'contain' }}
              onError={(e) => { e.target.onerror = null; e.target.src = '/logo.png'; }}
            />
            <span className="navbar-brand fw-bolder fs-5 text-uppercase mb-0">MS PRO</span>
          </div>
          <span className="text-secondary d-none d-md-inline extra-small text-uppercase">MEASUREMENT SHEET SYSTEM</span>
        </div>
        <div className="d-flex align-items-center gap-1 gap-sm-2">
          <Link
            to="/profile"
            className="btn btn-outline-light btn-sm extra-small fw-bold text-uppercase d-flex align-items-center gap-1 px-2"
            title="View & Edit Profile"
          >
            <i className="bi bi-person-circle text-warning"></i>
            <span className="d-none d-sm-inline">{session.name}</span>
          </Link>
          <button className="btn btn-warning btn-sm fw-bold text-uppercase px-2 px-sm-3" onClick={handleNewProject}>
            <i className="bi bi-plus-circle-fill me-sm-1"></i>
            <span className="d-none d-sm-inline"> NEW PROJECT</span>
            <span className="d-sm-none"> NEW</span>
          </button>
          <button className="btn btn-outline-danger btn-sm fw-bold text-uppercase px-2" onClick={() => { logout(); navigate('/login'); }}>
            <i className="bi bi-box-arrow-right"></i>
          </button>
        </div>
      </nav>

      {/* Dashboard Sub-Header with Navigation Tabs */}
      <div style={{ backgroundColor: '#0d1526', borderBottom: '1px solid #1e293b' }} className="px-2 px-sm-4 py-2">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
          {/* Tabs */}
          <div className="d-flex align-items-center gap-2">
            <button
              onClick={() => setActiveTab('projects')}
              className="btn btn-sm d-flex align-items-center gap-2"
              style={{
                backgroundColor: activeTab === 'projects' ? '#2563eb' : '#1e293b',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '12px',
                padding: '6px 16px',
                borderRadius: '6px',
                border: 'none',
              }}
            >
              <i className="bi bi-folder2-open"></i>
              <span>MY PROJECTS</span>
              <span
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontSize: '10px',
                }}
              >
                {safeProjects.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('excel')}
              className="btn btn-sm d-flex align-items-center gap-2"
              style={{
                backgroundColor: activeTab === 'excel' ? '#107c41' : '#1e293b',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '12px',
                padding: '6px 16px',
                borderRadius: '6px',
                border: 'none',
              }}
            >
              <i className="bi bi-file-earmark-excel-fill"></i>
              <span>SAVED EXCEL WORKBOOKS</span>
              <span
                style={{
                  backgroundColor: activeTab === 'excel' ? 'rgba(0, 0, 0, 0.3)' : '#107c41',
                  color: '#ffffff',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontSize: '10px',
                }}
              >
                {safeExcelFiles.length}
              </span>
            </button>
          </div>

          {/* Quick upload excel button */}
          <div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingExcel}
              className="btn btn-sm d-flex align-items-center gap-1"
              style={{
                backgroundColor: '#1e293b',
                color: '#34d399',
                borderColor: '#334155',
                fontSize: '11px',
                fontWeight: 700,
                padding: '6px 12px',
              }}
              title="Upload an existing .xlsx file to view and save in your dashboard"
            >
              <i className="bi bi-cloud-arrow-up-fill text-success"></i>
              <span>{uploadingExcel ? 'UPLOADING...' : 'UPLOAD EXCEL (.XLSX)'}</span>
            </button>
          </div>
        </div>
      </div>

      <main className="container-fluid py-3 py-sm-4 px-2 px-sm-4 flex-grow-1">
        {/* Title Bar & Search */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
          <div>
            <h4 className="fw-bolder text-uppercase mb-0 fs-5 fs-sm-4">
              {activeTab === 'projects' ? (
                <>
                  <i className="bi bi-folder2-open text-primary me-2"></i>ALL PROJECTS
                </>
              ) : (
                <>
                  <i className="bi bi-file-earmark-excel-fill text-success me-2"></i>SAVED EXCEL SPREADSHEETS
                </>
              )}
            </h4>
            <div className="text-muted extra-small text-uppercase">
              {activeTab === 'projects' ? (
                <>
                  {projects.length} PROJECT{projects.length !== 1 ? 'S' : ''} TOTAL &bull; LOGGED IN AS <strong>{session.name}</strong>
                </>
              ) : (
                <>
                  {excelFiles.length} WORKBOOK{excelFiles.length !== 1 ? 'S' : ''} SAVED &bull; OPEN IN BROWSER OR DOWNLOAD ANYTIME
                </>
              )}
            </div>
          </div>

          <div className="flex-grow-1 flex-sm-grow-0" style={{ minWidth: '220px', maxWidth: '340px' }}>
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0"><i className="bi bi-search text-muted"></i></span>
              <input
                type="text"
                className="form-control border-start-0 text-uppercase fw-semibold"
                placeholder={activeTab === 'projects' ? "SEARCH PROJECTS..." : "SEARCH EXCEL FILES..."}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ── TAB 1: PROJECTS VIEW ── */}
        {activeTab === 'projects' && (
          <>
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
                        <div
                          className="card border-2 h-100 d-flex align-items-center justify-content-center text-center p-4"
                          style={{ borderRadius: '10px', cursor: 'pointer', minHeight: '160px', borderStyle: 'dashed', borderColor: '#cbd5e1' }}
                          onClick={handleNewProject}
                        >
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
          </>
        )}

        {/* ── TAB 2: SAVED EXCEL WORKBOOKS VIEW ── */}
        {activeTab === 'excel' && (
          <>
            {loadingExcel && (
              <div className="text-center py-5">
                <div className="spinner-border text-success mb-3" role="status"></div>
                <div className="text-muted text-uppercase fw-semibold small">LOADING SAVED EXCEL FILES FROM CLOUD...</div>
              </div>
            )}

            {!loadingExcel && safeExcelFiles.length === 0 && (
              <div className="text-center py-5 my-5 bg-white rounded shadow-sm p-4">
                <div className="display-1 mb-3 text-success">📊</div>
                <h5 className="fw-bolder text-uppercase">NO EXCEL FILES SAVED YET</h5>
                <p className="text-muted text-uppercase small mx-auto" style={{ maxWidth: '520px' }}>
                  When you click <strong>EXCEL</strong> export in any project, the spreadsheet is automatically saved here. You can also upload any external <strong>.xlsx</strong> file directly.
                </p>
                <div className="d-flex justify-content-center gap-2 mt-3">
                  <button
                    className="btn btn-outline-success fw-bold text-uppercase px-3"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <i className="bi bi-upload me-1"></i> UPLOAD EXCEL FILE
                  </button>
                  <button
                    className="btn btn-dark fw-bold text-uppercase px-3"
                    onClick={() => setActiveTab('projects')}
                  >
                    <i className="bi bi-folder2-open me-1"></i> GO TO PROJECTS
                  </button>
                </div>
              </div>
            )}

            {!loadingExcel && filteredExcelFiles.length > 0 && (
              <div>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h6 className="fw-bolder text-uppercase text-dark mb-0">
                    <span className="badge bg-success px-3 py-2">
                      SAVED SPREADSHEETS ({filteredExcelFiles.length})
                    </span>
                  </h6>
                  <button
                    className="btn btn-sm btn-outline-secondary extra-small fw-bold text-uppercase"
                    onClick={fetchExcelFiles}
                  >
                    <i className="bi bi-arrow-clockwise me-1"></i> REFRESH
                  </button>
                </div>

                <div className="row g-3">
                  {filteredExcelFiles.map(file => (
                    <div key={file._id} className="col-12 col-sm-6 col-lg-4 col-xl-3">
                      <ExcelCard file={file} />
                    </div>
                  ))}

                  {/* Upload Card */}
                  <div className="col-12 col-sm-6 col-lg-4 col-xl-3">
                    <div
                      className="card border-2 h-100 d-flex align-items-center justify-content-center text-center p-4"
                      style={{
                        borderRadius: '10px',
                        cursor: 'pointer',
                        minHeight: '160px',
                        borderStyle: 'dashed',
                        borderColor: '#86efac',
                        backgroundColor: '#f0fdf4',
                      }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <i className="bi bi-cloud-arrow-up fs-2 text-success mb-2"></i>
                      <div className="text-success fw-bold text-uppercase extra-small">
                        UPLOAD NEW .XLSX
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ── IN-BROWSER EXCEL VIEWER MODAL ── */}
      {(selectedExcelId || viewerInitialFile) && (
        <ExcelViewerModal
          fileId={selectedExcelId}
          initialFile={viewerInitialFile}
          onClose={() => {
            setSelectedExcelId(null);
            setViewerInitialFile(null);
          }}
        />
      )}

      <footer className="bg-white border-top py-4 text-center">
        <div className="container">
          <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3 mb-3">
            <div className="text-start text-muted extra-small">
              <div className="fw-bold text-dark text-uppercase">MTS Decor &bull; MS Pro</div>
              <div>Civil & Interior Contractor Measurement System</div>
            </div>
            <div>
              <AppStoreBadges height={34} showWindowsMac={true} align="center" />
            </div>
          </div>
          <div className="border-top pt-2 text-muted extra-small text-uppercase">
            © {new Date().getFullYear()} MS PRO &bull; CLOUD SYNC: MONGODB ATLAS &bull; <Link to="/download" className="text-decoration-none text-muted fw-bold">DOWNLOAD APPS</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
