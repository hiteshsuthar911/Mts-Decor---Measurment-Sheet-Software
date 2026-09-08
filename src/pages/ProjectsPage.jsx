import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { getSession, logout } from '../utils/auth';
import {
  getAllProjects,
  createProject,
  duplicateProject,
  deleteProject,
  getDeletedProjects,
  restoreProject,
  deleteProjectPermanently,
  emptyTrash,
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

  // Active Tab: 'projects' or 'excel'
  const [activeTab, setActiveTab] = useState('projects');

  // Projects State
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Recently Deleted State
  const [deletedProjects, setDeletedProjects] = useState([]);
  const [showDeletedModal, setShowDeletedModal] = useState(false);
  const [loadingDeleted, setLoadingDeleted] = useState(false);

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
    fetchDeletedProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await getAllProjects();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('FAILED TO LOAD PROJECTS. PLEASE CHECK NETWORK CONNECTION.');
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

  const fetchDeletedProjects = async () => {
    try {
      setLoadingDeleted(true);
      const data = await getDeletedProjects();
      setDeletedProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load deleted projects:', err);
    } finally {
      setLoadingDeleted(false);
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
    if (ownerUsername !== session.username && session.role !== 'ADMIN') {
      alert('YOU CAN ONLY DELETE YOUR OWN PROJECTS.');
      return;
    }
    if (!confirm('MOVE THIS PROJECT TO RECENTLY DELETED? (YOU CAN RESTORE IT ANYTIME)')) return;
    try {
      await deleteProject(id);
      const deletedProj = projects.find(p => (p._id || p.id) === id);
      setProjects(prev => prev.filter(p => (p._id || p.id) !== id));
      if (deletedProj) {
        setDeletedProjects(prev => [{ ...deletedProj, isDeleted: true, deletedAt: new Date().toISOString() }, ...prev]);
      } else {
        fetchDeletedProjects();
      }
      showToast('PROJECT MOVED TO RECENTLY DELETED');
    } catch (err) {
      alert('DELETE FAILED: ' + err.message);
    }
  };

  const handleRestoreProject = async (id) => {
    try {
      const res = await restoreProject(id);
      const restored = res.project || deletedProjects.find(p => (p._id || p.id) === id);
      setDeletedProjects(prev => prev.filter(p => (p._id || p.id) !== id));
      if (restored) {
        setProjects(prev => [restored, ...prev]);
      } else {
        fetchProjects();
      }
      showToast('PROJECT RESTORED SUCCESSFULLY');
    } catch (err) {
      alert('RESTORE FAILED: ' + err.message);
    }
  };

  const handleDuplicateProject = async (id) => {
    try {
      showToast('DUPLICATING PROJECT...');
      const duplicated = await duplicateProject(id);
      if (duplicated) {
        setProjects(prev => [duplicated, ...prev]);
        showToast('PROJECT DUPLICATED SUCCESSFULLY');
      }
    } catch (err) {
      alert('DUPLICATE FAILED: ' + err.message);
    }
  };

  const handleDeletePermanent = async (id) => {
    if (!confirm('PERMANENTLY DELETE THIS PROJECT? THIS CANNOT BE UNDONE!')) return;
    try {
      await deleteProjectPermanently(id);
      setDeletedProjects(prev => prev.filter(p => (p._id || p.id) !== id));
      showToast('PROJECT PERMANENTLY DELETED');
    } catch (err) {
      alert('DELETE FAILED: ' + err.message);
    }
  };

  const handleEmptyTrash = async () => {
    if (!confirm('PURGE ALL RECENTLY DELETED PROJECTS? THIS CANNOT BE UNDONE!')) return;
    try {
      await emptyTrash();
      setDeletedProjects([]);
      showToast('TRASH EMPTIED SUCCESSFULLY');
    } catch (err) {
      alert('EMPTY TRASH FAILED: ' + err.message);
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

  const handleUploadExcelFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingExcel(true);
      showToast('PARSING EXCEL FILE...');

      const arrayBuffer = await file.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { type: 'array' });
      const base64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });

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
      <div
        className="card h-100 bg-white border shadow-sm"
        style={{
          borderRadius: '12px',
          borderColor: '#e2e8f0',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        }}
      >
        <div
          className="px-3 py-2 border-bottom d-flex align-items-center justify-content-between"
          style={{
            backgroundColor: isOwn ? '#f0f9ff' : '#fefce8',
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px',
            borderBottomColor: isOwn ? '#e0f2fe' : '#fef08a',
          }}
        >
          <span
            className="fw-bolder text-uppercase extra-small d-flex align-items-center gap-1"
            style={{ color: isOwn ? '#0369a1' : '#a16207' }}
          >
            <i className={`bi ${isOwn ? 'bi-folder-check' : 'bi-person-badge'}`}></i>
            {isOwn ? 'MY PROJECT' : `${(proj.ownerName || '').toUpperCase()}'S PROJECT`}
          </span>

          <span className="text-muted extra-small fw-medium">
            <i className="bi bi-calendar3 me-1"></i>
            {new Date(proj.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        <div className="card-body p-3 d-flex flex-column justify-content-between">
          <div>
            <h6
              className="fw-bolder text-dark text-uppercase mb-2 text-truncate"
              title={proj.name}
              style={{ fontSize: '15px', letterSpacing: '0.3px' }}
            >
              {proj.name || 'UNTITLED PROJECT'}
            </h6>

            <div className="text-muted extra-small text-uppercase mb-3 d-flex flex-wrap align-items-center gap-2">
              <span className="d-flex align-items-center gap-1">
                <i className="bi bi-person-fill text-secondary"></i>
                OWNER: <strong className="text-dark">{proj.ownerName}</strong>
              </span>
              {proj.lastEditedBy && (
                <span className="text-secondary">
                  &bull; LAST: <strong className="text-dark">{(proj.lastEditedBy || '').toUpperCase()}</strong>
                </span>
              )}
            </div>
          </div>

          <div className="d-flex gap-2 pt-2 border-top" style={{ borderColor: '#f1f5f9' }}>
            <button
              className="btn btn-primary btn-sm fw-bold text-uppercase flex-grow-1 d-flex align-items-center justify-content-center gap-1 shadow-sm"
              style={{ borderRadius: '8px', padding: '7px 12px', fontSize: '12px' }}
              onClick={() => navigate(`/sheet/${id}`)}
            >
              <i className={`bi ${isOwn ? 'bi-pencil-square' : 'bi-eye'}`}></i>
              <span>{isOwn ? 'OPEN & EDIT' : 'VIEW / EDIT'}</span>
            </button>
            <button
              className="btn btn-outline-secondary btn-sm px-2 d-flex align-items-center gap-1"
              style={{ borderRadius: '8px', fontSize: '12px' }}
              title="Duplicate Project (Make a Copy)"
              onClick={() => handleDuplicateProject(id)}
            >
              <i className="bi bi-copy"></i>
              <span className="d-none d-sm-inline">COPY</span>
            </button>
            {isOwn && (
              <button
                className="btn btn-outline-danger btn-sm px-2"
                style={{ borderRadius: '8px' }}
                title="Delete Project"
                onClick={() => handleDeleteProject(id, proj.ownerUsername)}
              >
                <i className="bi bi-trash3"></i>
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
        className="card h-100 bg-white border shadow-sm"
        style={{
          borderRadius: '12px',
          borderColor: '#e2e8f0',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        }}
      >
        <div
          className="px-3 py-2 border-bottom d-flex align-items-center justify-content-between"
          style={{
            backgroundColor: '#f0fdf4',
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px',
            borderBottomColor: '#dcfce7',
          }}
        >
          <span className="fw-bolder text-uppercase extra-small text-success d-flex align-items-center gap-1">
            <i className="bi bi-file-earmark-excel-fill"></i> EXCEL SPREADSHEET
          </span>
          {file.billingMode && (
            <span className="badge bg-warning text-dark extra-small fw-bold">
              BILLING
            </span>
          )}
        </div>

        <div className="card-body p-3 d-flex flex-column justify-content-between">
          <div>
            <h6
              className="fw-bolder text-dark text-uppercase mb-1 text-truncate"
              title={file.fileName}
              style={{ fontSize: '14px' }}
            >
              {file.fileName}
            </h6>

            <div className="text-muted extra-small text-uppercase mb-2 text-truncate">
              <i className="bi bi-folder2 text-success me-1"></i>
              PROJECT: <strong className="text-dark">{file.projectName || 'MEASUREMENT SHEET'}</strong>
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

          <div className="d-flex gap-2 pt-2 border-top" style={{ borderColor: '#f1f5f9' }}>
            <button
              className="btn btn-success btn-sm fw-bold text-uppercase flex-grow-1 d-flex align-items-center justify-content-center gap-1 shadow-sm"
              style={{ borderRadius: '8px', padding: '7px 12px', fontSize: '12px' }}
              onClick={() => setSelectedExcelId(file._id)}
            >
              <i className="bi bi-eye-fill"></i>
              <span>OPEN EXCEL VIEW</span>
            </button>

            <button
              className="btn btn-outline-success btn-sm fw-bold px-2"
              style={{ borderRadius: '8px' }}
              title="Download .xlsx File"
              onClick={() => handleDownloadExcelCard(file)}
            >
              <i className="bi bi-download"></i>
            </button>

            {(isOwn || session.role === 'ADMIN') && (
              <button
                className="btn btn-outline-danger btn-sm px-2"
                style={{ borderRadius: '8px' }}
                title="Delete Excel File"
                onClick={() => handleDeleteExcel(file._id, file.ownerUsername)}
              >
                <i className="bi bi-trash3"></i>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!session || session.role === 'ADMIN') return null;

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ backgroundColor: '#f8fafc' }}>
      {/* Toast Notification */}
      {toast && (
        <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 99999 }}>
          <div className="toast show bg-white text-dark border shadow-lg px-3 py-2 rounded-3" style={{ borderColor: '#e2e8f0' }}>
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

      {/* ── 1. MODERN LIGHT TOP NAVBAR ── */}
      <nav
        className="navbar bg-white border-bottom px-3 px-sm-4 py-2 sticky-top"
        style={{ borderColor: '#e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}
      >
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center gap-2">
            <img
              src="/mtsdecor.png"
              alt="MTS Decor"
              style={{ height: '28px', maxWidth: '120px', objectFit: 'contain' }}
              onError={(e) => { e.target.onerror = null; e.target.src = '/logo.png'; }}
            />
            <span className="fw-bolder fs-5 text-dark text-uppercase mb-0" style={{ letterSpacing: '0.5px' }}>
              MS PRO
            </span>
          </div>
          <span
            className="d-none d-md-inline extra-small text-uppercase fw-semibold px-2 py-1 rounded"
            style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}
          >
            CIVIL &amp; INTERIOR CONTRACTOR SYSTEM
          </span>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Link
            to="/profile"
            className="btn btn-light btn-sm extra-small fw-bold text-uppercase d-flex align-items-center gap-2 px-3 border"
            style={{ borderRadius: '8px', backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}
            title="View & Edit Profile"
          >
            <i className="bi bi-person-circle text-primary fs-6"></i>
            <span className="text-dark d-none d-sm-inline">{session.name}</span>
          </Link>

          <button
            className="btn btn-primary btn-sm fw-bold text-uppercase px-3 shadow-sm d-flex align-items-center gap-1"
            style={{ borderRadius: '8px', padding: '6px 14px' }}
            onClick={handleNewProject}
          >
            <i className="bi bi-plus-lg"></i>
            <span className="d-none d-sm-inline">NEW PROJECT</span>
            <span className="d-sm-none">NEW</span>
          </button>

          <button
            className="btn btn-outline-danger btn-sm fw-bold px-2"
            style={{ borderRadius: '8px' }}
            title="Logout"
            onClick={() => { logout(); navigate('/login'); }}
          >
            <i className="bi bi-box-arrow-right"></i>
          </button>
        </div>
      </nav>

      {/* ── 2. DASHBOARD LIGHT SUBHEADER ── */}
      <div
        className="bg-white border-bottom px-3 px-sm-4 py-3"
        style={{ borderColor: '#e2e8f0' }}
      >
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <h5 className="fw-bolder text-dark text-uppercase mb-1" style={{ letterSpacing: '0.5px' }}>
              {activeTab === 'projects' ? (
                <span>
                  <i className="bi bi-folder2-open text-primary me-2"></i>PROJECT WORKSPACE
                </span>
              ) : (
                <span>
                  <i className="bi bi-file-earmark-excel-fill text-success me-2"></i>SAVED EXCEL SPREADSHEETS
                </span>
              )}
            </h5>
            <div className="text-muted extra-small text-uppercase">
              {activeTab === 'projects' ? (
                <>
                  {safeProjects.length} PROJECT{safeProjects.length !== 1 ? 'S' : ''} TOTAL &bull; LOGGED IN AS <strong className="text-dark">{session.name}</strong>
                </>
              ) : (
                <>
                  {safeExcelFiles.length} EXCEL WORKBOOK{safeExcelFiles.length !== 1 ? 'S' : ''} SAVED &bull; OPEN IN BROWSER OR DOWNLOAD ANYTIME
                </>
              )}
            </div>
          </div>

          {/* Search Box */}
          <div style={{ minWidth: '240px', maxWidth: '340px' }} className="flex-grow-1 flex-sm-grow-0">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white border-end-0" style={{ borderColor: '#cbd5e1' }}>
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0 text-uppercase fw-semibold"
                style={{ borderColor: '#cbd5e1' }}
                placeholder={activeTab === 'projects' ? 'SEARCH PROJECTS...' : 'SEARCH SPREADSHEETS...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  className="btn btn-outline-secondary border-start-0 bg-white"
                  style={{ borderColor: '#cbd5e1' }}
                  onClick={() => setSearch('')}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Segmented Light Tabs Switcher */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3 pt-2 border-top" style={{ borderColor: '#f1f5f9' }}>
          <div
            className="d-inline-flex p-1 rounded-3"
            style={{ backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0' }}
          >
            <button
              onClick={() => setActiveTab('projects')}
              className="btn btn-sm d-flex align-items-center gap-2 fw-bold text-uppercase"
              style={{
                backgroundColor: activeTab === 'projects' ? '#ffffff' : 'transparent',
                color: activeTab === 'projects' ? '#0f172a' : '#64748b',
                boxShadow: activeTab === 'projects' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                borderRadius: '6px',
                padding: '6px 16px',
                fontSize: '12px',
                border: 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <i className="bi bi-folder2-open text-primary"></i>
              <span>MY PROJECTS</span>
              <span
                className="badge"
                style={{
                  backgroundColor: activeTab === 'projects' ? '#eff6ff' : '#e2e8f0',
                  color: activeTab === 'projects' ? '#1d4ed8' : '#475569',
                  fontSize: '10px',
                  padding: '2px 6px',
                }}
              >
                {safeProjects.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('excel')}
              className="btn btn-sm d-flex align-items-center gap-2 fw-bold text-uppercase"
              style={{
                backgroundColor: activeTab === 'excel' ? '#ffffff' : 'transparent',
                color: activeTab === 'excel' ? '#0f172a' : '#64748b',
                boxShadow: activeTab === 'excel' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                borderRadius: '6px',
                padding: '6px 16px',
                fontSize: '12px',
                border: 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <i className="bi bi-file-earmark-excel-fill text-success"></i>
              <span>SAVED EXCEL WORKBOOKS</span>
              <span
                className="badge"
                style={{
                  backgroundColor: activeTab === 'excel' ? '#f0fdf4' : '#e2e8f0',
                  color: activeTab === 'excel' ? '#15803d' : '#475569',
                  fontSize: '10px',
                  padding: '2px 6px',
                }}
              >
                {safeExcelFiles.length}
              </span>
            </button>
          </div>

          {/* Action buttons on the right */}
          <div className="d-flex align-items-center gap-2">
            {/* Recently Deleted Button */}
            <button
              onClick={() => { setShowDeletedModal(true); fetchDeletedProjects(); }}
              className="btn btn-sm btn-outline-secondary fw-bold text-uppercase d-flex align-items-center gap-1.5 shadow-xs"
              style={{
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                borderColor: deletedProjects.length > 0 ? '#fca5a5' : '#e2e8f0',
                color: deletedProjects.length > 0 ? '#dc2626' : '#64748b',
                fontSize: '11px',
                padding: '6px 12px',
                transition: 'all 0.15s ease',
              }}
              title="View and Restore Recently Deleted Projects"
            >
              <i className={`bi ${deletedProjects.length > 0 ? 'bi-trash3-fill text-danger' : 'bi-trash3'}`}></i>
              <span className="d-none d-sm-inline">RECENTLY DELETED</span>
              <span className="d-sm-none">TRASH</span>
              {deletedProjects.length > 0 && (
                <span className="badge bg-danger text-white rounded-pill px-1.5 py-0.5" style={{ fontSize: '10px' }}>
                  {deletedProjects.length}
                </span>
              )}
            </button>

            {/* Quick upload excel button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingExcel}
              className="btn btn-sm btn-outline-success fw-bold text-uppercase d-flex align-items-center gap-1 shadow-xs"
              style={{
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                borderColor: '#86efac',
                fontSize: '11px',
                padding: '6px 14px',
              }}
              title="Upload external .xlsx spreadsheet"
            >
              <i className="bi bi-cloud-arrow-up-fill text-success"></i>
              <span>{uploadingExcel ? 'UPLOADING...' : 'UPLOAD EXCEL (.XLSX)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 3. MAIN DASHBOARD CONTENT (LIGHT THEME) ── */}
      <main className="container-fluid py-4 px-3 px-sm-4 flex-grow-1">
        {/* ── TAB 1: PROJECTS VIEW ── */}
        {activeTab === 'projects' && (
          <>
            {loading && (
              <div className="text-center py-5">
                <div className="spinner-border text-primary mb-3" role="status"></div>
                <div className="text-muted text-uppercase fw-semibold small">LOADING PROJECTS FROM CLOUD...</div>
              </div>
            )}

            {error && !loading && (
              <div className="alert alert-danger border-0 text-uppercase fw-semibold shadow-sm">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>{error}
                <button className="btn btn-sm btn-outline-danger ms-3 fw-bold" onClick={fetchProjects}>RETRY</button>
              </div>
            )}

            {!loading && !error && projects.length === 0 && (
              <div className="text-center py-5 my-5 bg-white border rounded-3 shadow-sm p-4">
                <div className="display-1 mb-3 text-muted">📋</div>
                <h5 className="fw-bolder text-uppercase text-dark">NO PROJECTS FOUND</h5>
                <p className="text-muted text-uppercase small">CREATE YOUR FIRST MEASUREMENT PROJECT TO GET STARTED.</p>
                <button className="btn btn-primary fw-bold text-uppercase px-4 mt-2 shadow-sm" onClick={handleNewProject}>
                  <i className="bi bi-plus-lg me-2"></i> CREATE FIRST PROJECT
                </button>
              </div>
            )}

            {!loading && !error && (
              <>
                {myProjects.length > 0 && (
                  <div className="mb-4">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h6 className="fw-bolder text-uppercase text-dark mb-0 d-flex align-items-center gap-2">
                        <span className="badge bg-white text-primary border px-3 py-2 shadow-2xs">
                          MY PROJECTS ({myProjects.length})
                        </span>
                      </h6>
                    </div>

                    <div className="row g-3">
                      {myProjects.map(proj => (
                        <div key={proj._id || proj.id} className="col-12 col-sm-6 col-lg-4 col-xl-3">
                          <ProjectCard proj={proj} isOwn={true} />
                        </div>
                      ))}

                      {/* New Project Dashed Card */}
                      <div className="col-12 col-sm-6 col-lg-4 col-xl-3">
                        <div
                          className="card h-100 d-flex flex-column align-items-center justify-content-center text-center p-4 bg-white"
                          style={{
                            borderRadius: '12px',
                            cursor: 'pointer',
                            minHeight: '170px',
                            border: '2px dashed #cbd5e1',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#3b82f6';
                            e.currentTarget.style.backgroundColor = '#eff6ff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#cbd5e1';
                            e.currentTarget.style.backgroundColor = '#ffffff';
                          }}
                          onClick={handleNewProject}
                        >
                          <div
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '50%',
                              backgroundColor: '#eff6ff',
                              color: '#2563eb',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginBottom: '8px',
                            }}
                          >
                            <i className="bi bi-plus-lg fs-5"></i>
                          </div>
                          <div className="fw-bold text-dark text-uppercase small">CREATE NEW PROJECT</div>
                          <div className="text-muted extra-small text-uppercase mt-1">Start fresh measurement sheet</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {otherProjects.length > 0 && (
                  <div className="mb-4">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h6 className="fw-bolder text-uppercase text-dark mb-0 d-flex align-items-center gap-2">
                        <span className="badge bg-white text-warning-emphasis border border-warning-subtle px-3 py-2 shadow-2xs">
                          OTHER USERS' PROJECTS ({otherProjects.length})
                        </span>
                        <span className="extra-small text-muted fw-normal">— CREDENTIAL VERIFICATION REQUIRED TO EDIT</span>
                      </h6>
                    </div>

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
                <div className="text-muted text-uppercase fw-semibold small">LOADING SAVED EXCEL WORKBOOKS...</div>
              </div>
            )}

            {!loadingExcel && safeExcelFiles.length === 0 && (
              <div className="text-center py-5 my-5 bg-white border rounded-3 shadow-sm p-4">
                <div className="display-1 mb-3 text-success">📊</div>
                <h5 className="fw-bolder text-uppercase text-dark">NO EXCEL FILES SAVED YET</h5>
                <p className="text-muted text-uppercase small mx-auto" style={{ maxWidth: '520px' }}>
                  When you click <strong>EXCEL</strong> export inside any project sheet, the workbook will be automatically saved here in your dashboard. You can also upload any external <strong>.xlsx</strong> file directly.
                </p>
                <div className="d-flex justify-content-center gap-2 mt-3">
                  <button
                    className="btn btn-outline-success fw-bold text-uppercase px-3 shadow-sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <i className="bi bi-upload me-1"></i> UPLOAD EXCEL FILE
                  </button>
                  <button
                    className="btn btn-primary fw-bold text-uppercase px-3 shadow-sm"
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
                    <span className="badge bg-white text-success border border-success-subtle px-3 py-2 shadow-2xs">
                      SAVED SPREADSHEETS ({filteredExcelFiles.length})
                    </span>
                  </h6>
                  <button
                    className="btn btn-sm btn-outline-secondary extra-small fw-bold text-uppercase bg-white"
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

                  {/* Upload Dashed Card */}
                  <div className="col-12 col-sm-6 col-lg-4 col-xl-3">
                    <div
                      className="card h-100 d-flex flex-column align-items-center justify-content-center text-center p-4 bg-white"
                      style={{
                        borderRadius: '12px',
                        cursor: 'pointer',
                        minHeight: '170px',
                        border: '2px dashed #86efac',
                        backgroundColor: '#f0fdf4',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#16a34a';
                        e.currentTarget.style.backgroundColor = '#dcfce7';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#86efac';
                        e.currentTarget.style.backgroundColor = '#f0fdf4';
                      }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          backgroundColor: '#dcfce7',
                          color: '#16a34a',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '8px',
                        }}
                      >
                        <i className="bi bi-cloud-arrow-up fs-5"></i>
                      </div>
                      <div className="fw-bold text-success text-uppercase small">UPLOAD NEW .XLSX</div>
                      <div className="text-muted extra-small text-uppercase mt-1">Add spreadsheet to cloud</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ── RECENTLY DELETED (TRASH) MODAL ── */}
      {showDeletedModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(5px)',
            zIndex: 9999,
          }}
          onClick={() => setShowDeletedModal(false)}
        >
          <div
            className="bg-white rounded-3 shadow-xl d-flex flex-column border"
            style={{
              width: '100%',
              maxWidth: '720px',
              maxHeight: '85vh',
              borderColor: '#e2e8f0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-4 py-3 border-bottom d-flex align-items-center justify-content-between bg-light rounded-top-3">
              <div className="d-flex align-items-center gap-2">
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: '#fee2e2',
                    color: '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <i className="bi bi-trash3-fill fs-6"></i>
                </div>
                <div>
                  <h6 className="fw-bolder text-dark text-uppercase mb-0" style={{ letterSpacing: '0.5px' }}>
                    RECENTLY DELETED PROJECTS
                  </h6>
                  <span className="text-muted extra-small text-uppercase">
                    {deletedProjects.length} PROJECT{deletedProjects.length !== 1 ? 'S' : ''} IN RECYCLE BIN
                  </span>
                </div>
              </div>

              <div className="d-flex align-items-center gap-2">
                {deletedProjects.length > 0 && (
                  <button
                    className="btn btn-outline-danger btn-sm extra-small fw-bold text-uppercase px-2.5 py-1"
                    onClick={handleEmptyTrash}
                    title="Permanently remove all deleted projects"
                  >
                    <i className="bi bi-trash3 me-1"></i> EMPTY TRASH
                  </button>
                )}
                <button
                  className="btn btn-light btn-sm text-secondary px-2 py-1 border"
                  onClick={() => setShowDeletedModal(false)}
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-auto flex-grow-1">
              <p className="text-muted extra-small text-uppercase mb-3">
                <i className="bi bi-info-circle me-1 text-primary"></i>
                Deleted projects stay here safely until you restore them or delete them permanently.
              </p>

              {loadingDeleted && (
                <div className="text-center py-4">
                  <div className="spinner-border spinner-border-sm text-danger mb-2" role="status"></div>
                  <div className="text-muted extra-small text-uppercase">LOADING DELETED PROJECTS...</div>
                </div>
              )}

              {!loadingDeleted && deletedProjects.length === 0 && (
                <div className="text-center py-5 bg-light rounded-3 border">
                  <div className="display-4 text-muted mb-2">🗑️</div>
                  <h6 className="fw-bold text-dark text-uppercase mb-1">RECYCLE BIN IS EMPTY</h6>
                  <p className="text-muted extra-small text-uppercase mb-0">
                    No deleted projects found. When you delete a project, it will appear here.
                  </p>
                </div>
              )}

              {!loadingDeleted && deletedProjects.length > 0 && (
                <div className="d-flex flex-column gap-2.5">
                  {deletedProjects.map((proj) => {
                    const id = proj._id || proj.id;
                    return (
                      <div
                        key={id}
                        className="p-3 bg-white border rounded-3 d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 shadow-2xs"
                        style={{ borderColor: '#e2e8f0' }}
                      >
                        <div className="min-w-0 flex-grow-1">
                          <h6 className="fw-bold text-dark text-uppercase mb-1 text-truncate" title={proj.name}>
                            {proj.name || 'UNTITLED PROJECT'}
                          </h6>
                          <div className="d-flex flex-wrap align-items-center gap-2 extra-small text-muted text-uppercase">
                            <span>
                              <i className="bi bi-person me-1"></i>
                              {proj.ownerName || proj.ownerUsername}
                            </span>
                            <span>&bull;</span>
                            <span>
                              <i className="bi bi-clock-history me-1 text-danger"></i>
                              DELETED: {proj.deletedAt ? new Date(proj.deletedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'RECENTLY'}
                            </span>
                          </div>
                        </div>

                        <div className="d-flex align-items-center gap-2 flex-shrink-0">
                          <button
                            className="btn btn-success btn-sm fw-bold text-uppercase d-flex align-items-center gap-1.5 px-3"
                            style={{ borderRadius: '6px', fontSize: '11px', padding: '6px 12px' }}
                            onClick={() => handleRestoreProject(id)}
                            title="Restore project back to your workspace"
                          >
                            <i className="bi bi-arrow-counterclockwise"></i>
                            <span>RESTORE</span>
                          </button>

                          <button
                            className="btn btn-outline-danger btn-sm fw-bold text-uppercase d-flex align-items-center gap-1 px-2.5"
                            style={{ borderRadius: '6px', fontSize: '11px', padding: '6px 10px' }}
                            onClick={() => handleDeletePermanent(id)}
                            title="Delete forever (irreversible)"
                          >
                            <i className="bi bi-x-circle"></i>
                            <span className="d-none d-md-inline">DELETE FOREVER</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-2.5 bg-light border-top d-flex justify-content-between align-items-center rounded-bottom-3">
              <span className="text-muted extra-small text-uppercase">
                TIP: Restored projects return immediately to your active projects list.
              </span>
              <button
                className="btn btn-secondary btn-sm fw-bold text-uppercase px-3"
                style={{ borderRadius: '6px', fontSize: '11px' }}
                onClick={() => setShowDeletedModal(false)}
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* ── CLEAN LIGHT FOOTER ── */}
      <footer className="bg-white border-top py-4 text-center mt-auto" style={{ borderColor: '#e2e8f0' }}>
        <div className="container">
          <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3 mb-3">
            <div className="text-start text-muted extra-small">
              <div className="fw-bold text-dark text-uppercase">MTS Decor &bull; MS Pro</div>
              <div>Civil &amp; Interior Contractor Measurement System</div>
            </div>
            <div>
              <AppStoreBadges height={34} showWindowsMac={true} align="center" />
            </div>
          </div>
          <div className="border-top pt-2 text-muted extra-small text-uppercase" style={{ borderColor: '#f1f5f9' }}>
            © {new Date().getFullYear()} MS PRO &bull; CLOUD SYNC: MONGODB ATLAS &bull;{' '}
            <Link to="/download" className="text-decoration-none text-primary fw-bold">
              DOWNLOAD APPS
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
