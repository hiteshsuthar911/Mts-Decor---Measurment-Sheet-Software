import { api, BASE_URL } from '../utils/api';
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
  downloadExcelFromBase64,
  getAllPdfFiles,
  deletePdfFile,
  downloadPdfFromBase64
} from '../utils/storage';
import { BLANK_PROJECT } from '../data/sampleData';
import AppStoreBadges from '../components/AppStoreBadges';
import ExcelViewerModal from '../components/ExcelViewerModal';
import PdfViewerModal from '../components/PdfViewerModal';
import ThemeToggle from '../components/ThemeToggle';
import AppLoader from '../components/AppLoader';

export default function ProjectsPage() {
  const navigate = useNavigate();
  const session = getSession();
  const fileInputRef = useRef(null);

  // Active Tab: 'all', 'my', 'team', 'excel', or 'pdf'
  const [activeTab, setActiveTab] = useState('all');

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

  // PDF Files State
  const [pdfFiles, setPdfFiles] = useState([]);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [selectedPdfId, setSelectedPdfId] = useState(null);
  const [pdfViewerInitialFile, setPdfViewerInitialFile] = useState(null);
  useEffect(() => {
    if (!session) { navigate('/login'); return; }
    fetchProjects();
    fetchExcelFiles();
    fetchPdfFiles();
    fetchDeletedProjects();

    // Auto-resume to active Field Mode on mobile if previous project exists
    const isMobileDevice = typeof window !== 'undefined' && window.innerWidth < 768;
    const hasExitedField = sessionStorage.getItem('mts_exited_field_mode');
    const lastProject = localStorage.getItem('mts_last_project_id') || '6aa8f92c3bb049cf50fdc6c4';
    if (isMobileDevice && !hasExitedField && lastProject) {
      navigate(`/sheet/${lastProject}?field=1`);
    }
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

  const fetchPdfFiles = async () => {
    try {
      setLoadingPdf(true);
      const data = await getAllPdfFiles();
      setPdfFiles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load pdf files:', err);
    } finally {
      setLoadingPdf(false);
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
        const res = await fetch(`${BASE_URL}/excel-files/${excelDoc._id}/download`, {
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

  const handleDeletePdf = async (id, ownerUsername) => {
    if (ownerUsername !== session.username && session.role !== 'ADMIN') {
      alert('YOU CAN ONLY DELETE YOUR OWN PDF FILES.');
      return;
    }
    if (!confirm('DELETE THIS SAVED PDF DOCUMENT?')) return;
    try {
      await deletePdfFile(id);
      setPdfFiles(prev => prev.filter(f => f._id !== id));
      showToast('PDF DOCUMENT DELETED');
    } catch (err) {
      alert('DELETE FAILED: ' + err.message);
    }
  };

  const handleDownloadPdfCard = async (pdfDoc) => {
    try {
      if (pdfDoc.fileBase64) {
        downloadPdfFromBase64(pdfDoc.fileName, pdfDoc.fileBase64);
        showToast('DOWNLOADING ' + pdfDoc.fileName);
      } else {
        showToast('FETCHING PDF DOCUMENT...');
        const res = await fetch(`${BASE_URL}/pdf-files/${pdfDoc._id}/download`, {
          headers: {
            Authorization: `Bearer ${JSON.parse(localStorage.getItem('MS_PRO_AUTH_V1') || '{}').token || ''}`
          }
        });
        if (!res.ok) throw new Error('DOWNLOAD FAILED');
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = pdfDoc.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('DOWNLOAD COMPLETE');
      }
    } catch (err) {
      console.error('Download PDF error:', err);
      alert('DOWNLOAD FAILED: ' + err.message);
    }
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'Recently';
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 2) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  // Filtered lists
  const safeProjects = Array.isArray(projects) ? projects : [];
  const myProjectsAll = safeProjects.filter(p => p.ownerUsername === session?.username);
  const teamProjectsAll = safeProjects.filter(p => p.ownerUsername !== session?.username);

  const filteredProjects = safeProjects.filter(p => {
    if (!search) return true;
    const q = search.toUpperCase();
    return (
      (p.name || '').toUpperCase().includes(q) ||
      (p.clientName || '').toUpperCase().includes(q) ||
      (p.location || '').toUpperCase().includes(q) ||
      (p.ownerName || '').toUpperCase().includes(q)
    );
  });
  const myProjectsFiltered = filteredProjects.filter(p => p.ownerUsername === session?.username);
  const teamProjectsFiltered = filteredProjects.filter(p => p.ownerUsername !== session?.username);

  const displayedProjects = activeTab === 'my'
    ? myProjectsFiltered
    : activeTab === 'team'
    ? teamProjectsFiltered
    : filteredProjects;

  const safeExcelFiles = Array.isArray(excelFiles) ? excelFiles : [];
  const filteredExcelFiles = safeExcelFiles.filter(f =>
    !search ||
    (f.fileName || '').toUpperCase().includes(search.toUpperCase()) ||
    (f.projectName || '').toUpperCase().includes(search.toUpperCase()) ||
    (f.ownerName || '').toUpperCase().includes(search.toUpperCase())
  );

  const safePdfFiles = Array.isArray(pdfFiles) ? pdfFiles : [];
  const filteredPdfFiles = safePdfFiles.filter(f =>
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
    const clientName = proj.clientName || proj.data?.header?.clientName || '';
    const location = proj.location || proj.data?.header?.location || proj.data?.header?.siteAddress || '';
    const areasCount = proj.areasCount || (Array.isArray(proj.data?.areas) ? proj.data.areas.length : 0);
    const updatedTime = proj.updatedAt || proj.lastEditedAt || proj.createdAt;

    return (
      <div className="workspace-project-card p-4 d-flex flex-column justify-content-between">
        <div>
          {/* Top Header Row: Ownership Pill + Top-Right Ghost Actions */}
          <div className="d-flex align-items-center justify-content-between mb-3">
            <span className={`workspace-badge-pill ${isOwn ? 'workspace-badge-pill--own' : 'workspace-badge-pill--team'}`}>
              <i className={`bi ${isOwn ? 'bi-person-check-fill' : 'bi-people-fill'}`}></i>
              <span>{isOwn ? 'My Project' : (proj.ownerName || 'Team')}</span>
            </span>

            <div className="d-flex align-items-center gap-1.5">
              <button
                type="button"
                className="workspace-card-icon-btn"
                title="Duplicate Project (Make a Copy)"
                onClick={(e) => { e.stopPropagation(); handleDuplicateProject(id); }}
              >
                <i className="bi bi-copy"></i>
              </button>

              {isOwn && (
                <button
                  type="button"
                  className="workspace-card-icon-btn text-danger"
                  title="Move to Trash"
                  onClick={(e) => { e.stopPropagation(); handleDeleteProject(id, proj.ownerUsername); }}
                >
                  <i className="bi bi-trash3"></i>
                </button>
              )}
            </div>
          </div>

          {/* Project Title with Integrated Document Avatar */}
          <div className="d-flex align-items-start gap-3 mb-3">
            <div
              className="d-flex align-items-center justify-content-center flex-shrink-0"
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                border: '1px solid #bfdbfe',
                color: '#2563eb',
                fontSize: '18px',
                boxShadow: '0 1px 2px rgba(37, 99, 235, 0.08)',
              }}
            >
              <i className="bi bi-file-earmark-spreadsheet-fill"></i>
            </div>
            <div className="flex-grow-1 min-w-0" style={{ minWidth: 0 }}>
              <h6
                className="fw-bold text-dark mb-1 text-truncate"
                title={proj.name}
                style={{ fontSize: '16px', letterSpacing: '-0.25px', cursor: 'pointer', lineHeight: '1.3' }}
                onClick={() => navigate(`/sheet/${id}`)}
              >
                {proj.name || 'Untitled Project'}
              </h6>
              <div className="text-muted text-truncate" style={{ fontSize: '12px' }}>
                Measurement Sheet • BOQ
              </div>
            </div>
          </div>

          {/* Client & Site Details Box */}
          <div
            className="p-2.5 rounded-3 mb-3"
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #f1f5f9',
              fontSize: '12px',
            }}
          >
            <div className="d-flex align-items-center gap-2 text-truncate" title={clientName ? `Client: ${clientName}` : 'No client specified'}>
              <i className="bi bi-building text-secondary" style={{ fontSize: '12px', flexShrink: 0 }}></i>
              <span className="text-secondary fw-semibold text-truncate">
                {clientName || 'General / Unassigned'}
              </span>
            </div>
            {location && (
              <div className="d-flex align-items-center gap-2 text-truncate mt-1 text-muted" title={`Location: ${location}`}>
                <i className="bi bi-geo-alt text-secondary" style={{ fontSize: '11px', flexShrink: 0 }}></i>
                <span className="text-truncate" style={{ fontSize: '11.5px' }}>{location}</span>
              </div>
            )}
          </div>
        </div>

        <div>
          {/* Metadata Row */}
          <div className="d-flex align-items-center justify-content-between pt-2.5 pb-2 border-top" style={{ borderColor: '#f1f5f9' }}>
            <span
              className="badge border fw-semibold d-inline-flex align-items-center gap-1.5"
              style={{
                backgroundColor: '#ffffff',
                color: '#334155',
                borderColor: '#e2e8f0',
                borderRadius: '6px',
                fontSize: '11px',
                padding: '4px 9px',
              }}
            >
              <i className="bi bi-grid-fill text-primary" style={{ fontSize: '10px' }}></i>
              {areasCount} {areasCount === 1 ? 'Area' : 'Areas'}
            </span>

            <span className="text-muted extra-small d-flex align-items-center gap-1.5" style={{ fontSize: '11.5px' }}>
              <i className="bi bi-clock" style={{ fontSize: '11px' }}></i>
              <span>Updated {formatTimeAgo(updatedTime)}</span>
            </span>
          </div>

          {/* Action Buttons */}
          <div className="d-flex gap-2 mt-2">
            <button
              type="button"
              className="btn btn-primary flex-grow-1 fw-semibold d-flex align-items-center justify-content-center gap-2 shadow-2xs"
              style={{
                borderRadius: '9px',
                fontSize: '13.5px',
                padding: '9px 14px',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                border: 'none',
                boxShadow: '0 2px 4px rgba(37, 99, 235, 0.15)',
              }}
              onClick={() => navigate(`/sheet/${id}`)}
            >
              <span>Open Sheet</span>
              <i className="bi bi-arrow-right project-card-arrow"></i>
            </button>
            <button
              type="button"
              className="btn fw-bold d-flex align-items-center justify-content-center gap-1.5 shadow-2xs text-dark px-3"
              style={{
                borderRadius: '9px',
                fontSize: '13px',
                padding: '9px 14px',
                background: 'linear-gradient(135deg, #f5d77f 0%, #d4af37 100%)',
                border: 'none',
                boxShadow: '0 2px 6px rgba(212, 175, 55, 0.3)',
              }}
              onClick={() => navigate(`/sheet/${id}?field=1`)}
              title="Open directly in Mobile Field Mode"
            >
              <i className="bi bi-phone-fill"></i>
              <span>FIELD</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ExcelCard = ({ file }) => {
    const isOwn = file.ownerUsername === session?.username;
    return (
      <div className="workspace-project-card p-4 d-flex flex-column justify-content-between">
        <div>
          {/* Top Header Row */}
          <div className="d-flex align-items-center justify-content-between mb-3">
            <span className="workspace-badge-pill workspace-badge-pill--excel">
              <i className="bi bi-file-earmark-excel-fill text-success"></i>
              <span>Excel Workbook</span>
            </span>

            <div className="d-flex align-items-center gap-1.5">
              <button
                type="button"
                className="workspace-card-icon-btn"
                title="Download .xlsx file"
                onClick={(e) => { e.stopPropagation(); handleDownloadExcelCard(file); }}
              >
                <i className="bi bi-download"></i>
              </button>

              {(isOwn || session.role === 'ADMIN') && (
                <button
                  type="button"
                  className="workspace-card-icon-btn text-danger"
                  title="Delete Excel file"
                  onClick={(e) => { e.stopPropagation(); handleDeleteExcel(file._id, file.ownerUsername); }}
                >
                  <i className="bi bi-trash3"></i>
                </button>
              )}
            </div>
          </div>

          {/* File Title with Icon */}
          <div className="d-flex align-items-start gap-3 mb-3">
            <div
              className="d-flex align-items-center justify-content-center flex-shrink-0"
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                border: '1px solid #bbf7d0',
                color: '#16a34a',
                fontSize: '18px',
                boxShadow: '0 1px 2px rgba(22, 163, 74, 0.08)',
              }}
            >
              <i className="bi bi-file-earmark-excel-fill"></i>
            </div>
            <div className="flex-grow-1 min-w-0" style={{ minWidth: 0 }}>
              <h6
                className="fw-bold text-dark mb-1 text-truncate"
                title={file.fileName}
                style={{ fontSize: '16px', letterSpacing: '-0.25px', cursor: 'pointer', lineHeight: '1.3' }}
                onClick={() => setSelectedExcelId(file._id)}
              >
                {file.fileName}
              </h6>
              <div className="text-muted text-truncate" style={{ fontSize: '12px' }}>
                Excel Spreadsheet • Imported
              </div>
            </div>
          </div>

          {/* Project Association Box */}
          <div
            className="p-2.5 rounded-3 mb-3"
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #f1f5f9',
              fontSize: '12px',
            }}
          >
            <div className="d-flex align-items-center gap-2 text-truncate" title={`Project: ${file.projectName || 'Measurement Sheet'}`}>
              <i className="bi bi-folder2 text-success" style={{ fontSize: '12px', flexShrink: 0 }}></i>
              <span className="text-muted">Project:</span>
              <span className="text-dark fw-semibold text-truncate">{file.projectName || 'Measurement Sheet'}</span>
            </div>
          </div>
        </div>

        <div>
          {/* Metadata Row */}
          <div className="d-flex align-items-center justify-content-between pt-2.5 pb-2 border-top" style={{ borderColor: '#f1f5f9' }}>
            <div className="d-flex align-items-center gap-1.5">
              <span className="badge border fw-semibold extra-small" style={{ backgroundColor: '#ffffff', color: '#475569', borderColor: '#e2e8f0', borderRadius: '6px', fontSize: '11px', padding: '4px 9px' }}>
                <i className="bi bi-hdd me-1 text-secondary"></i>
                {formatFileSize(file.fileSize)}
              </span>
              <span className="badge border extra-small" style={{ backgroundColor: '#f8fafc', color: '#475569', borderColor: '#e2e8f0', borderRadius: '6px', fontSize: '11px', padding: '4px 8px' }}>
                {file.ownerName || 'User'}
              </span>
            </div>

            <span className="text-muted extra-small d-flex align-items-center gap-1.5" style={{ fontSize: '11.5px' }}>
              <i className="bi bi-clock" style={{ fontSize: '11px' }}></i>
              <span>Updated {formatTimeAgo(file.createdAt)}</span>
            </span>
          </div>

          <button
            type="button"
            className="btn btn-success w-100 fw-semibold d-flex align-items-center justify-content-center gap-2 mt-2 shadow-2xs"
            style={{
              borderRadius: '9px',
              fontSize: '13.5px',
              padding: '9px 16px',
              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
              border: 'none',
              boxShadow: '0 2px 4px rgba(22, 163, 74, 0.15)',
            }}
            onClick={() => setSelectedExcelId(file._id)}
          >
            <i className="bi bi-eye-fill"></i>
            <span>View Sheet</span>
          </button>
        </div>
      </div>
    );
  };

  const PdfCard = ({ file }) => {
    const isOwn = file.ownerUsername === session?.username;
    return (
      <div className="workspace-project-card p-4 d-flex flex-column justify-content-between">
        <div>
          {/* Top Header Row */}
          <div className="d-flex align-items-center justify-content-between mb-3">
            <span className="workspace-badge-pill workspace-badge-pill--pdf">
              <i className="bi bi-file-earmark-pdf-fill text-danger"></i>
              <span>PDF Document</span>
            </span>

            <div className="d-flex align-items-center gap-1.5">
              <button
                type="button"
                className="workspace-card-icon-btn"
                title="Download .pdf document"
                onClick={(e) => { e.stopPropagation(); handleDownloadPdfCard(file); }}
              >
                <i className="bi bi-download"></i>
              </button>

              {(isOwn || session.role === 'ADMIN') && (
                <button
                  type="button"
                  className="workspace-card-icon-btn text-danger"
                  title="Delete PDF document"
                  onClick={(e) => { e.stopPropagation(); handleDeletePdf(file._id, file.ownerUsername); }}
                >
                  <i className="bi bi-trash3"></i>
                </button>
              )}
            </div>
          </div>

          {/* File Title with Icon */}
          <div className="d-flex align-items-start gap-3 mb-3">
            <div
              className="d-flex align-items-center justify-content-center flex-shrink-0"
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                border: '1px solid #fecaca',
                color: '#dc2626',
                fontSize: '18px',
                boxShadow: '0 1px 2px rgba(220, 38, 38, 0.08)',
              }}
            >
              <i className="bi bi-file-earmark-pdf-fill"></i>
            </div>
            <div className="flex-grow-1 min-w-0" style={{ minWidth: 0 }}>
              <h6
                className="fw-bold text-dark mb-1 text-truncate"
                title={file.fileName}
                style={{ fontSize: '16px', letterSpacing: '-0.25px', cursor: 'pointer', lineHeight: '1.3' }}
                onClick={() => setSelectedPdfId(file._id)}
              >
                {file.fileName}
              </h6>
              <div className="text-muted text-truncate" style={{ fontSize: '12px' }}>
                PDF Document • Exported
              </div>
            </div>
          </div>

          {/* Project Association Box */}
          <div
            className="p-2.5 rounded-3 mb-3"
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #f1f5f9',
              fontSize: '12px',
            }}
          >
            <div className="d-flex align-items-center gap-2 text-truncate" title={`Project: ${file.projectName || 'Measurement Sheet'}`}>
              <i className="bi bi-folder2 text-danger" style={{ fontSize: '12px', flexShrink: 0 }}></i>
              <span className="text-muted">Project:</span>
              <span className="text-dark fw-semibold text-truncate">{file.projectName || 'Measurement Sheet'}</span>
            </div>
          </div>
        </div>

        <div>
          {/* Metadata Row */}
          <div className="d-flex align-items-center justify-content-between pt-2.5 pb-2 border-top" style={{ borderColor: '#f1f5f9' }}>
            <div className="d-flex align-items-center gap-1.5">
              <span className="badge border fw-semibold extra-small" style={{ backgroundColor: '#ffffff', color: '#475569', borderColor: '#e2e8f0', borderRadius: '6px', fontSize: '11px', padding: '4px 9px' }}>
                <i className="bi bi-hdd me-1 text-secondary"></i>
                {formatFileSize(file.fileSize)}
              </span>
              {file.pageCount && (
                <span className="badge border extra-small" style={{ backgroundColor: '#f8fafc', color: '#475569', borderColor: '#e2e8f0', borderRadius: '6px', fontSize: '11px', padding: '4px 8px' }}>
                  {file.pageCount} Pages
                </span>
              )}
            </div>

            <span className="text-muted extra-small d-flex align-items-center gap-1.5" style={{ fontSize: '11.5px' }}>
              <i className="bi bi-clock" style={{ fontSize: '11px' }}></i>
              <span>Updated {formatTimeAgo(file.createdAt)}</span>
            </span>
          </div>

          <button
            type="button"
            className="btn btn-danger w-100 fw-semibold d-flex align-items-center justify-content-center gap-2 mt-2 shadow-2xs"
            style={{
              borderRadius: '9px',
              fontSize: '13.5px',
              padding: '9px 16px',
              background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
              border: 'none',
              boxShadow: '0 2px 4px rgba(220, 38, 38, 0.15)',
            }}
            onClick={() => setSelectedPdfId(file._id)}
          >
            <i className="bi bi-eye-fill"></i>
            <span>View PDF</span>
          </button>
        </div>
      </div>
    );
  };

  if (!session) return null;

  return (
    <div className="workspace-page-wrapper min-vh-100 d-flex flex-column">
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

      {/* ── 1. MODERN SAAS TOP NAVBAR ── */}
      <nav
        className="navbar workspace-navbar border-bottom px-3 px-sm-4 py-2.5 sticky-top"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.03)', zIndex: 1020 }}
      >
        <div className="w-100 d-flex align-items-center justify-content-between" style={{ maxWidth: '1440px', margin: '0 auto' }}>
          <div className="d-flex align-items-center" style={{ gap: '10px' }}>
            <div className="d-flex align-items-center" style={{ gap: '8px' }}>
              <img
                src="/mtsdecor.png"
                alt="MTS Decor"
                style={{ height: '28px', maxWidth: '110px', objectFit: 'contain' }}
                onError={(e) => { e.target.onerror = null; e.target.src = '/logo.png'; }}
              />
              <span
                className="fw-bold text-dark mb-0"
                style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.2px', whiteSpace: 'nowrap' }}
              >
                MS PRO
              </span>
            </div>
            <div className="d-none d-md-block" style={{ width: '1px', height: '16px', backgroundColor: '#e2e8f0', margin: '0 4px' }} />
            <span
              className="d-none d-md-inline-flex align-items-center workspace-brand-pill"
              style={{
                padding: '3px 10px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.2px',
                lineHeight: 1.4,
                whiteSpace: 'nowrap',
                border: '1px solid #e2e8f0',
                gap: '6px',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
              Contractor Measurement Suite
            </span>
          </div>

          <div className="d-flex align-items-center gap-2">
            <ThemeToggle className="d-none d-sm-inline-flex me-1" />

            {/* User Profile Pill */}
            <Link
              to="/profile"
              className="btn btn-sm workspace-user-pill border d-flex align-items-center gap-2 px-2.5 py-1.5"
              title="Account Profile & Settings"
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: '#eff6ff',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 700
                }}
              >
                {(session.name || 'U').charAt(0).toUpperCase()}
              </div>
              <span className="text-dark fw-semibold d-none d-sm-inline" style={{ fontSize: '12.5px' }}>
                {session.name}
              </span>
            </Link>



            {/* Single Primary Action: + New Project */}
            <button
              type="button"
              className="btn btn-primary btn-sm fw-bold px-3 py-1.5 shadow-sm d-flex align-items-center gap-1.5"
              style={{ borderRadius: '8px', fontSize: '12.5px' }}
              onClick={handleNewProject}
            >
              <i className="bi bi-plus-lg"></i>
              <span>New Project</span>
            </button>

            {/* Logout Button */}
            <button
              type="button"
              className="btn btn-outline-danger btn-sm px-2 py-1.5"
              style={{ borderRadius: '8px' }}
              title="Log out of system"
              onClick={() => { logout(); navigate('/login'); }}
            >
              <i className="bi bi-box-arrow-right"></i>
            </button>
          </div>
        </div>
      </nav>

      {/* ── 2. WORKSPACE HEADER & HERO SECTION ── */}
      <div className="workspace-hero-banner border-bottom px-3 px-sm-4 py-3">
        <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <h5 className="fw-bold text-dark mb-0" style={{ letterSpacing: '-0.2px' }}>
                  Project Workspace
                </h5>
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2 py-0.5" style={{ fontSize: '11px' }}>
                  Cloud Sync Active
                </span>
              </div>
              <div className="text-muted small">
                Welcome back, <strong>{session.name}</strong> &bull; Manage measurement sheets, BOQ estimates, and export archives.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. MAIN WORKSPACE CONTENT ── */}
      <main className="container-fluid py-4 px-3 px-sm-4 flex-grow-1" style={{ maxWidth: '1440px', margin: '0 auto', minHeight: 'calc(100vh - 240px)' }}>

        {/* KPI METRIC TILES */}
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-3">
            <div
              className="workspace-metric-card d-flex align-items-center justify-content-between"
              style={{ cursor: 'pointer' }}
              onClick={() => setActiveTab('all')}
            >
              <div>
                <div className="text-muted extra-small fw-semibold text-uppercase">Total Projects</div>
                <div className="fs-4 fw-bold text-dark mt-0.5">{safeProjects.length}</div>
              </div>
              <div className="workspace-metric-icon workspace-metric-icon--blue">
                <i className="bi bi-folder2-open"></i>
              </div>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div
              className="workspace-metric-card d-flex align-items-center justify-content-between"
              style={{ cursor: 'pointer' }}
              onClick={() => setActiveTab('my')}
            >
              <div>
                <div className="text-muted extra-small fw-semibold text-uppercase">My Projects</div>
                <div className="fs-4 fw-bold text-primary mt-0.5">{myProjectsAll.length}</div>
              </div>
              <div className="workspace-metric-icon workspace-metric-icon--indigo">
                <i className="bi bi-person-check-fill"></i>
              </div>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div
              className="workspace-metric-card d-flex align-items-center justify-content-between"
              style={{ cursor: 'pointer' }}
              onClick={() => setActiveTab('team')}
            >
              <div>
                <div className="text-muted extra-small fw-semibold text-uppercase">Team Shared</div>
                <div className="fs-4 fw-bold text-dark mt-0.5">{teamProjectsAll.length}</div>
              </div>
              <div className="workspace-metric-icon workspace-metric-icon--amber">
                <i className="bi bi-people-fill"></i>
              </div>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div
              className="workspace-metric-card d-flex align-items-center justify-content-between"
              style={{ cursor: 'pointer' }}
              onClick={() => setActiveTab('excel')}
            >
              <div>
                <div className="text-muted extra-small fw-semibold text-uppercase">Cloud Archives</div>
                <div className="fs-4 fw-bold text-success mt-0.5">{safeExcelFiles.length + safePdfFiles.length}</div>
              </div>
              <div className="workspace-metric-icon workspace-metric-icon--emerald">
                <i className="bi bi-cloud-arrow-down-fill"></i>
              </div>
            </div>
          </div>
        </div>

        {/* VIEW FILTER & SEARCH BAR */}
        <div className="workspace-filter-bar border rounded-3 p-2 mb-4 shadow-sm d-flex flex-wrap align-items-center justify-content-between gap-2" style={{ minHeight: '52px' }}>
          {/* Segmented Filter Pills — scrollable on small screens */}
          <div className="workspace-filter-tabs d-flex align-items-center gap-1 p-1 rounded-2" style={{ overflowX: 'auto', flexShrink: 1, minWidth: 0 }}>
            <button
              type="button"
              className={`workspace-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
              style={{ whiteSpace: 'nowrap' }}
            >
              <i className="bi bi-grid-fill"></i>
              <span>All Projects</span>
              <span className="badge rounded-pill workspace-tab-badge border px-1 py-0" style={{ fontSize: '10px' }}>
                {safeProjects.length}
              </span>
            </button>

            <button
              type="button"
              className={`workspace-tab-btn ${activeTab === 'my' ? 'active' : ''}`}
              onClick={() => setActiveTab('my')}
              style={{ whiteSpace: 'nowrap' }}
            >
              <i className="bi bi-person-fill"></i>
              <span>My Projects</span>
              <span className="badge rounded-pill workspace-tab-badge border px-1 py-0" style={{ fontSize: '10px' }}>
                {myProjectsAll.length}
              </span>
            </button>

            <button
              type="button"
              className={`workspace-tab-btn ${activeTab === 'team' ? 'active' : ''}`}
              onClick={() => setActiveTab('team')}
              style={{ whiteSpace: 'nowrap' }}
            >
              <i className="bi bi-people-fill"></i>
              <span>Team Shared</span>
              <span className="badge rounded-pill workspace-tab-badge border px-1 py-0" style={{ fontSize: '10px' }}>
                {teamProjectsAll.length}
              </span>
            </button>

            <button
              type="button"
              className={`workspace-tab-btn ${activeTab === 'excel' ? 'active' : ''}`}
              onClick={() => setActiveTab('excel')}
              style={{ whiteSpace: 'nowrap' }}
            >
              <i className="bi bi-file-earmark-excel-fill text-success"></i>
              <span>Excel Files</span>
              <span className="badge rounded-pill workspace-tab-badge border px-1 py-0" style={{ fontSize: '10px' }}>
                {safeExcelFiles.length}
              </span>
            </button>

            <button
              type="button"
              className={`workspace-tab-btn ${activeTab === 'pdf' ? 'active' : ''}`}
              onClick={() => setActiveTab('pdf')}
              style={{ whiteSpace: 'nowrap' }}
            >
              <i className="bi bi-file-earmark-pdf-fill text-danger"></i>
              <span>PDF Documents</span>
              <span className="badge rounded-pill workspace-tab-badge border px-1 py-0" style={{ fontSize: '10px' }}>
                {safePdfFiles.length}
              </span>
            </button>
          </div>

          {/* Right Side: Search and Secondary Actions */}
          <div className="d-flex align-items-center gap-2 flex-shrink-0" style={{ minWidth: 0 }}>
            {/* Search Input */}
            <div className="input-group input-group-sm workspace-search-group" style={{ width: 'clamp(160px, 22vw, 280px)' }}>
              <span className="input-group-text border-end-0 text-muted">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search by project, client, site..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button className="btn btn-outline-secondary border-start-0" onClick={() => setSearch('')}>
                  ✕
                </button>
              )}
            </div>

            {/* Quick upload excel button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingExcel}
              className="btn btn-sm btn-outline-success fw-bold d-flex align-items-center gap-1"
              style={{ borderRadius: '8px', fontSize: '12px', whiteSpace: 'nowrap', flexShrink: 0 }}
              title="Upload external .xlsx spreadsheet"
            >
              <i className="bi bi-cloud-arrow-up-fill"></i>
              <span className="d-none d-sm-inline">Import Excel</span>
            </button>

            {/* Recently Deleted Button */}
            <button
              type="button"
              onClick={() => { setShowDeletedModal(true); fetchDeletedProjects(); }}
              className={`btn btn-sm fw-semibold d-flex align-items-center gap-1 workspace-trash-btn ${deletedProjects.length > 0 ? 'has-items' : ''}`}
              style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
              title="View and Restore Deleted Projects"
            >
              <i className={`bi ${deletedProjects.length > 0 ? 'bi-trash3-fill text-danger' : 'bi-trash3'}`}></i>
              <span className="d-none d-sm-inline">Trash</span>
              {deletedProjects.length > 0 && (
                <span className="badge bg-danger text-white rounded-pill" style={{ fontSize: '10px', padding: '2px 5px' }}>
                  {deletedProjects.length}
                </span>
              )}
            </button>
          </div>
        </div>


        {/* ── PROJECTS VIEW (FOR 'all', 'my', 'team' TABS) ── */}

        {(activeTab === 'all' || activeTab === 'my' || activeTab === 'team' || activeTab === 'projects') && (
          <>
            {loading && (
              <div className="text-center py-5">
                <AppLoader text="LOADING PROJECTS FROM CLOUD..." />
              </div>
            )}

            {error && !loading && (
              <div className="alert alert-danger border-0 text-uppercase fw-semibold shadow-sm">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>{error}
                <button className="btn btn-sm btn-outline-danger ms-3 fw-bold" onClick={fetchProjects}>RETRY</button>
              </div>
            )}

            {!loading && !error && displayedProjects.length === 0 && (
              <div className="text-center py-5 my-4 workspace-empty-card border rounded-3 shadow-sm p-4">
                <div className="display-4 mb-3 text-muted opacity-75">
                  <i className="bi bi-folder-plus text-primary"></i>
                </div>
                <h6 className="fw-bold text-dark mb-1">
                  {search ? 'No projects match your search' : 'No projects found in this view'}
                </h6>
                <p className="text-muted small mb-3">
                  {search ? 'Try clearing the search query or checking another tab.' : 'Create a new project to start taking measurements.'}
                </p>
                {search ? (
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => setSearch('')}>
                    Clear Search
                  </button>
                ) : (
                  <button className="btn btn-sm btn-primary fw-bold px-3 py-2 shadow-sm" onClick={handleNewProject}>
                    <i className="bi bi-plus-lg me-1"></i> Create First Project
                  </button>
                )}
              </div>
            )}

            {!loading && !error && displayedProjects.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                  gap: '1.25rem',
                }}
              >
                {displayedProjects.map(proj => (
                  <ProjectCard key={proj._id || proj.id} proj={proj} isOwn={proj.ownerUsername === session?.username} />
                ))}

                {/* Quick Add Project Tile — structured to match ProjectCard */}
                {!search && (activeTab === 'all' || activeTab === 'my') && (
                  <div
                    className="workspace-project-card p-4 d-flex flex-column justify-content-between"
                    style={{
                      border: '1.5px dashed #93c5fd',
                      backgroundColor: '#f8fbff',
                      cursor: 'pointer',
                    }}
                    onClick={handleNewProject}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleNewProject()}
                    title="Create New Project"
                  >
                    <div>
                      {/* Top Header Row */}
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <span className="workspace-badge-pill" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #dbeafe' }}>
                          <i className="bi bi-sparkles"></i>
                          <span>Quick Action</span>
                        </span>
                        <span className="badge" style={{ backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', fontSize: '11px', padding: '3px 8px', borderRadius: '6px' }}>
                          New Sheet
                        </span>
                      </div>

                      {/* Icon + Title */}
                      <div className="d-flex align-items-start gap-3 mb-3">
                        <div
                          className="d-flex align-items-center justify-content-center flex-shrink-0"
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                            color: '#ffffff',
                            fontSize: '18px',
                            boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
                          }}
                        >
                          <i className="bi bi-plus-lg"></i>
                        </div>
                        <div className="flex-grow-1 min-w-0">
                          <h6 className="fw-bold text-dark mb-1 text-truncate" style={{ fontSize: '16px', letterSpacing: '-0.25px' }}>
                            Create New Project
                          </h6>
                          <div className="text-muted text-truncate" style={{ fontSize: '12px' }}>
                            Measurement Sheet • BOQ
                          </div>
                        </div>
                      </div>

                      <div
                        className="p-2.5 rounded-3 mb-3"
                        style={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e0edff',
                          fontSize: '12px',
                        }}
                      >
                        <p className="text-muted mb-0" style={{ fontSize: '11.5px', lineHeight: '1.4' }}>
                          Start taking measurements, room deductions &amp; calculate BOQ instantly.
                        </p>
                      </div>
                    </div>

                    <div>
                      {/* Metadata Row Divider */}
                      <div className="d-flex align-items-center justify-content-between pt-2.5 pb-2 border-top" style={{ borderColor: '#e0edff' }}>
                        <span className="text-muted extra-small d-flex align-items-center gap-1.5" style={{ fontSize: '11.5px' }}>
                          <i className="bi bi-lightning-charge-fill text-primary" style={{ fontSize: '11px' }}></i>
                          <span>Instant Setup</span>
                        </span>
                        <span className="text-muted extra-small" style={{ fontSize: '11.5px' }}>Ready to edit</span>
                      </div>

                      {/* Action Button */}
                      <button
                        type="button"
                        className="btn btn-outline-primary w-100 fw-semibold d-flex align-items-center justify-content-center gap-2 mt-2"
                        style={{
                          borderRadius: '9px',
                          fontSize: '13.5px',
                          padding: '9px 16px',
                          borderColor: '#93c5fd',
                          background: '#ffffff',
                          color: '#1d4ed8',
                        }}
                      >
                        <i className="bi bi-plus-circle-fill"></i>
                        <span>Create Project</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ── TAB 2: SAVED EXCEL WORKBOOKS VIEW ── */}
        {activeTab === 'excel' && (
          <>
            {loadingExcel && (
              <div className="text-center py-5">
                <AppLoader text="LOADING SAVED EXCEL WORKBOOKS..." />
              </div>
            )}

            {!loadingExcel && safeExcelFiles.length === 0 && (
              <div className="text-center py-5 my-5 workspace-empty-card border rounded-3 shadow-sm p-4">
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
                    onClick={() => setActiveTab('all')}
                  >
                    <i className="bi bi-folder2-open me-1"></i> Go to Projects
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

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                    gap: '1.25rem',
                  }}
                >
                  {filteredExcelFiles.map(file => (
                    <ExcelCard key={file._id} file={file} />
                  ))}

                  {/* Upload Dashed Card */}
                  <div
                    className="card h-100 d-flex flex-column align-items-center justify-content-center text-center p-4 workspace-upload-dashed-card"
                    style={{
                      borderRadius: '16px',
                      cursor: 'pointer',
                      minHeight: '220px',
                      border: '2px dashed #86efac',
                      transition: 'all 0.2s ease',
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(22, 163, 74, 0.15)',
                        color: '#16a34a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '10px',
                        fontSize: '1.25rem',
                      }}
                    >
                      <i className="bi bi-cloud-arrow-up"></i>
                    </div>
                    <div className="fw-bold text-success text-uppercase small">UPLOAD NEW .XLSX</div>
                    <div className="text-muted extra-small text-uppercase mt-1">Add spreadsheet to cloud</div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── TAB 3: SAVED PDF DOCUMENTS VIEW ── */}
        {activeTab === 'pdf' && (
          <>
            {loadingPdf && (
              <div className="text-center py-5">
                <AppLoader text="LOADING SAVED PDF DOCUMENTS..." />
              </div>
            )}

            {!loadingPdf && safePdfFiles.length === 0 && (
              <div className="text-center py-5 my-5 workspace-empty-card border rounded-3 shadow-sm p-4">
                <div className="display-1 mb-3 text-danger">📄</div>
                <h5 className="fw-bolder text-uppercase text-dark">NO PDF DOCUMENTS SAVED YET</h5>
                <p className="text-muted text-uppercase small mx-auto" style={{ maxWidth: '520px' }}>
                  When you open any project sheet, click <strong>PRINT / BROWSER PDF</strong>, and choose <strong>SAVE PDF TO DASHBOARD</strong>, the rendered multi-page PDF will be permanently saved here in your dashboard for quick viewing, printing, and downloading.
                </p>
                <div className="d-flex justify-content-center gap-2 mt-3">
                  <button
                    className="btn btn-primary fw-bold text-uppercase px-3 shadow-sm"
                    onClick={() => setActiveTab('all')}
                  >
                    <i className="bi bi-folder2-open me-1"></i> Go to Projects
                  </button>
                </div>
              </div>
            )}

            {!loadingPdf && filteredPdfFiles.length > 0 && (
              <div>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h6 className="fw-bolder text-uppercase text-dark mb-0">
                    <span className="badge bg-white text-danger border border-danger-subtle px-3 py-2 shadow-2xs">
                      SAVED PDF DOCUMENTS ({filteredPdfFiles.length})
                    </span>
                  </h6>
                  <button
                    className="btn btn-sm btn-outline-secondary extra-small fw-bold text-uppercase bg-white"
                    onClick={fetchPdfFiles}
                  >
                    <i className="bi bi-arrow-clockwise me-1"></i> REFRESH
                  </button>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                    gap: '1.25rem',
                  }}
                >
                  {filteredPdfFiles.map(file => (
                    <PdfCard key={file._id} file={file} />
                  ))}
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
            backgroundColor: 'rgba(8, 10, 20, 0.75)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            zIndex: 9999,
            animation: 'rdpFadeIn 0.22s ease',
          }}
          onClick={() => setShowDeletedModal(false)}
        >
          <style>{`
            @keyframes rdpFadeIn {
              from { opacity: 0; }
              to   { opacity: 1; }
            }
            @keyframes rdpSlideUp {
              from { opacity: 0; transform: translateY(24px) scale(0.97); }
              to   { opacity: 1; transform: translateY(0) scale(1); }
            }
            @keyframes rdpTrashWiggle {
              0%, 100% { transform: rotate(0deg); }
              20%       { transform: rotate(-10deg); }
              40%       { transform: rotate(10deg); }
              60%       { transform: rotate(-6deg); }
              80%       { transform: rotate(6deg); }
            }
            .rdp-modal-card {
              width: 100%;
              max-width: 740px;
              max-height: 88vh;
              display: flex;
              flex-direction: column;
              background: #ffffff;
              border-radius: 20px;
              overflow: hidden;
              box-shadow:
                0 32px 80px rgba(0,0,0,0.28),
                0 8px 24px rgba(0,0,0,0.14),
                0 0 0 1px rgba(255,255,255,0.08);
              animation: rdpSlideUp 0.28s cubic-bezier(0.22, 1, 0.36, 1) both;
            }
            .rdp-header {
              background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #1a0a2e 100%);
              padding: 22px 28px 18px;
              position: relative;
              overflow: hidden;
              flex-shrink: 0;
            }
            .rdp-header::before {
              content: '';
              position: absolute;
              width: 220px; height: 220px;
              border-radius: 50%;
              background: radial-gradient(circle, rgba(239,68,68,0.12) 0%, transparent 70%);
              top: -60px; right: -40px;
              pointer-events: none;
            }
            .rdp-header::after {
              content: '';
              position: absolute;
              width: 140px; height: 140px;
              border-radius: 50%;
              background: radial-gradient(circle, rgba(127,86,217,0.10) 0%, transparent 70%);
              bottom: -40px; left: 40px;
              pointer-events: none;
            }
            .rdp-trash-icon {
              width: 48px; height: 48px;
              border-radius: 14px;
              background: linear-gradient(135deg, rgba(239,68,68,0.2) 0%, rgba(185,28,28,0.25) 100%);
              border: 1px solid rgba(239,68,68,0.3);
              display: flex; align-items: center; justify-content: center;
              font-size: 22px;
              color: #fca5a5;
              animation: rdpTrashWiggle 1.5s ease 0.3s 1;
              flex-shrink: 0;
            }
            .rdp-title {
              font-size: 1.1rem;
              font-weight: 800;
              color: #ffffff;
              letter-spacing: 0.5px;
              margin: 0;
              line-height: 1.2;
            }
            .rdp-subtitle {
              font-size: 0.75rem;
              color: rgba(255,255,255,0.5);
              text-transform: uppercase;
              letter-spacing: 0.8px;
              margin-top: 3px;
            }
            .rdp-count-badge {
              background: rgba(239,68,68,0.18);
              border: 1px solid rgba(239,68,68,0.35);
              color: #fca5a5;
              border-radius: 20px;
              padding: 3px 12px;
              font-size: 0.72rem;
              font-weight: 700;
              letter-spacing: 0.5px;
              text-transform: uppercase;
            }
            .rdp-close-btn {
              width: 36px; height: 36px;
              border-radius: 10px;
              border: 1px solid rgba(255,255,255,0.15);
              background: rgba(255,255,255,0.08);
              color: rgba(255,255,255,0.7);
              display: flex; align-items: center; justify-content: center;
              cursor: pointer;
              transition: all 0.18s ease;
              font-size: 0.95rem;
              flex-shrink: 0;
            }
            .rdp-close-btn:hover {
              background: rgba(255,255,255,0.16);
              border-color: rgba(255,255,255,0.3);
              color: #ffffff;
              transform: scale(1.05);
            }
            .rdp-empty-trash-btn {
              height: 34px;
              padding: 0 14px;
              border-radius: 9px;
              border: 1px solid rgba(239,68,68,0.4);
              background: rgba(239,68,68,0.12);
              color: #fca5a5;
              font-size: 0.72rem;
              font-weight: 700;
              letter-spacing: 0.5px;
              text-transform: uppercase;
              cursor: pointer;
              display: flex; align-items: center; gap: 6px;
              transition: all 0.18s ease;
              flex-shrink: 0;
            }
            .rdp-empty-trash-btn:hover {
              background: rgba(239,68,68,0.22);
              border-color: rgba(239,68,68,0.6);
              transform: translateY(-1px);
            }
            .rdp-body {
              flex: 1;
              overflow-y: auto;
              padding: 24px 28px;
              background: #f8f7ff;
            }
            .rdp-info-banner {
              background: linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%);
              border: 1px solid #bfdbfe;
              border-radius: 10px;
              padding: 10px 14px;
              font-size: 0.8rem;
              color: #1d4ed8;
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 20px;
            }
            .rdp-empty-state {
              text-align: center;
              padding: 52px 24px;
              background: white;
              border-radius: 16px;
              border: 1.5px dashed #e0d9ff;
            }
            .rdp-empty-icon {
              width: 80px; height: 80px;
              margin: 0 auto 16px;
              border-radius: 50%;
              background: linear-gradient(135deg, #f3f0ff 0%, #ede9fe 100%);
              display: flex; align-items: center; justify-content: center;
              font-size: 2rem;
              border: 2px solid #e9d5ff;
            }
            .rdp-empty-title {
              font-size: 1rem;
              font-weight: 800;
              color: #1a1a2e;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 6px;
            }
            .rdp-empty-sub {
              font-size: 0.78rem;
              color: #7a7a9a;
              text-transform: uppercase;
              letter-spacing: 0.3px;
            }
            .rdp-project-card {
              background: white;
              border: 1.5px solid #ede9fe;
              border-radius: 14px;
              padding: 16px 18px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 16px;
              margin-bottom: 10px;
              transition: all 0.2s ease;
              box-shadow: 0 2px 8px rgba(127,86,217,0.05);
            }
            .rdp-project-card:hover {
              border-color: #c4b5fd;
              box-shadow: 0 6px 20px rgba(127,86,217,0.10);
              transform: translateY(-1px);
            }
            .rdp-project-icon {
              width: 40px; height: 40px;
              border-radius: 10px;
              background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
              border: 1px solid #fecaca;
              display: flex; align-items: center; justify-content: center;
              color: #ef4444;
              font-size: 1rem;
              flex-shrink: 0;
            }
            .rdp-project-name {
              font-size: 0.92rem;
              font-weight: 800;
              color: #0d0620;
              text-transform: uppercase;
              letter-spacing: 0.3px;
              margin-bottom: 5px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .rdp-meta-chip {
              display: inline-flex;
              align-items: center;
              gap: 4px;
              font-size: 0.7rem;
              font-weight: 600;
              letter-spacing: 0.4px;
              text-transform: uppercase;
              padding: 2px 8px;
              border-radius: 6px;
            }
            .rdp-meta-chip.owner {
              background: #f0f9ff;
              color: #0369a1;
              border: 1px solid #bae6fd;
            }
            .rdp-meta-chip.deleted {
              background: #fff1f2;
              color: #be123c;
              border: 1px solid #fecdd3;
            }
            .rdp-restore-btn {
              height: 36px;
              padding: 0 16px;
              border-radius: 9px;
              border: none;
              background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
              color: white;
              font-size: 0.72rem;
              font-weight: 700;
              letter-spacing: 0.5px;
              text-transform: uppercase;
              cursor: pointer;
              display: flex; align-items: center; gap: 6px;
              transition: all 0.18s ease;
              box-shadow: 0 2px 8px rgba(22,163,74,0.3);
              flex-shrink: 0;
              white-space: nowrap;
            }
            .rdp-restore-btn:hover {
              background: linear-gradient(135deg, #15803d 0%, #166534 100%);
              transform: translateY(-1px);
              box-shadow: 0 4px 14px rgba(22,163,74,0.4);
            }
            .rdp-delete-btn {
              height: 36px;
              padding: 0 14px;
              border-radius: 9px;
              border: 1.5px solid #fca5a5;
              background: #fff1f2;
              color: #dc2626;
              font-size: 0.72rem;
              font-weight: 700;
              letter-spacing: 0.5px;
              text-transform: uppercase;
              cursor: pointer;
              display: flex; align-items: center; gap: 6px;
              transition: all 0.18s ease;
              flex-shrink: 0;
              white-space: nowrap;
            }
            .rdp-delete-btn:hover {
              background: #fee2e2;
              border-color: #f87171;
              transform: translateY(-1px);
              box-shadow: 0 3px 10px rgba(220,38,38,0.15);
            }
            .rdp-footer {
              background: white;
              border-top: 1px solid #ede9fe;
              padding: 14px 28px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 12px;
              flex-shrink: 0;
            }
            .rdp-footer-tip {
              font-size: 0.73rem;
              color: #7a7a9a;
              text-transform: uppercase;
              letter-spacing: 0.4px;
              display: flex;
              align-items: center;
              gap: 6px;
            }
            .rdp-close-footer-btn {
              height: 36px;
              padding: 0 20px;
              border-radius: 9px;
              border: 1.5px solid #ddd6fe;
              background: linear-gradient(135deg, #7f56d9 0%, #6941c6 100%);
              color: white;
              font-size: 0.75rem;
              font-weight: 700;
              letter-spacing: 0.5px;
              text-transform: uppercase;
              cursor: pointer;
              transition: all 0.18s ease;
              box-shadow: 0 2px 8px rgba(105,65,198,0.25);
              flex-shrink: 0;
            }
            .rdp-close-footer-btn:hover {
              background: linear-gradient(135deg, #6941c6 0%, #5a35b8 100%);
              transform: translateY(-1px);
              box-shadow: 0 4px 14px rgba(105,65,198,0.35);
            }
            .rdp-loading {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 48px 0;
              gap: 12px;
            }
            .rdp-spinner {
              width: 36px; height: 36px;
              border: 3px solid rgba(239,68,68,0.15);
              border-top-color: #ef4444;
              border-radius: 50%;
              animation: spin 0.75s linear infinite;
            }
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>

          {/* Modal Card */}
          <div className="rdp-modal-card" onClick={(e) => e.stopPropagation()}>

            {/* ── HEADER ── */}
            <div className="rdp-header">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                {/* Left: Icon + Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div className="rdp-trash-icon">
                    <i className="bi bi-trash3-fill"></i>
                  </div>
                  <div>
                    <div className="rdp-title">Recently Deleted Projects</div>
                    <div className="rdp-subtitle">Recycle Bin — safely stored until restored or purged</div>
                  </div>
                </div>

                {/* Right: Count badge + buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="rdp-count-badge">
                    {deletedProjects.length} {deletedProjects.length !== 1 ? 'Projects' : 'Project'}
                  </span>
                  {deletedProjects.length > 0 && (
                    <button className="rdp-empty-trash-btn" onClick={handleEmptyTrash} title="Permanently remove all deleted projects">
                      <i className="bi bi-trash3"></i>
                      <span className="d-none d-sm-inline">Empty Trash</span>
                    </button>
                  )}
                  <button className="rdp-close-btn" onClick={() => setShowDeletedModal(false)} title="Close">
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>
              </div>
            </div>

            {/* ── BODY ── */}
            <div className="rdp-body">

              {/* Info banner */}
              <div className="rdp-info-banner">
                <i className="bi bi-shield-check" style={{ fontSize: '1rem', flexShrink: 0 }}></i>
                <span>Deleted projects are safely stored here. Restore anytime or permanently remove them.</span>
              </div>

              {/* Loading state */}
              {loadingDeleted && (
                <div className="rdp-loading">
                  <div className="rdp-spinner"></div>
                  <span style={{ fontSize: '0.78rem', color: '#7a7a9a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Loading deleted projects...
                  </span>
                </div>
              )}

              {/* Empty state */}
              {!loadingDeleted && deletedProjects.length === 0 && (
                <div className="rdp-empty-state">
                  <div className="rdp-empty-icon">🗑️</div>
                  <div className="rdp-empty-title">Recycle Bin is Empty</div>
                  <div className="rdp-empty-sub">No deleted projects found. Deleted projects will appear here.</div>
                </div>
              )}

              {/* Project list */}
              {!loadingDeleted && deletedProjects.length > 0 && (
                <div>
                  {deletedProjects.map((proj) => {
                    const id = proj._id || proj.id;
                    return (
                      <div key={id} className="rdp-project-card">
                        {/* Left: icon */}
                        <div className="rdp-project-icon">
                          <i className="bi bi-folder-x"></i>
                        </div>

                        {/* Center: info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="rdp-project-name" title={proj.name}>
                            {proj.name || 'UNTITLED PROJECT'}
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                            <span className="rdp-meta-chip owner">
                              <i className="bi bi-person-fill"></i>
                              {proj.ownerName || proj.ownerUsername || 'Unknown'}
                            </span>
                            <span className="rdp-meta-chip deleted">
                              <i className="bi bi-clock-history"></i>
                              {proj.deletedAt
                                ? new Date(proj.deletedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
                                : 'Recently deleted'}
                            </span>
                          </div>
                        </div>

                        {/* Right: action buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                          <button
                            className="rdp-restore-btn"
                            onClick={() => handleRestoreProject(id)}
                            title="Restore this project"
                          >
                            <i className="bi bi-arrow-counterclockwise"></i>
                            <span>Restore</span>
                          </button>
                          <button
                            className="rdp-delete-btn"
                            onClick={() => handleDeletePermanent(id)}
                            title="Delete permanently (irreversible)"
                          >
                            <i className="bi bi-x-circle-fill"></i>
                            <span className="d-none d-md-inline">Delete Forever</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── FOOTER ── */}
            <div className="rdp-footer">
              <div className="rdp-footer-tip">
                <i className="bi bi-lightning-charge-fill" style={{ color: '#7f56d9' }}></i>
                Restored projects return immediately to your active workspace.
              </div>
              <button className="rdp-close-footer-btn" onClick={() => setShowDeletedModal(false)}>
                Close
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

      {/* ── IN-BROWSER PDF VIEWER MODAL ── */}
      {(selectedPdfId || pdfViewerInitialFile) && (
        <PdfViewerModal
          fileId={selectedPdfId}
          initialFile={pdfViewerInitialFile}
          onClose={() => {
            setSelectedPdfId(null);
            setPdfViewerInitialFile(null);
          }}
        />
      )}



      {/* ── CLEAN SAAS FOOTER ── */}
      <footer className="workspace-footer border-top py-3 mt-auto" style={{ backgroundColor: '#ffffff' }}>
        <div className="container-fluid d-flex flex-column flex-sm-row align-items-center justify-content-between gap-2" style={{ maxWidth: '1440px' }}>
          <div className="d-flex align-items-center gap-2 text-muted extra-small">
            <span className="fw-bold text-dark text-uppercase">MTS Decor &bull; MS Pro</span>
            <span>&bull;</span>
            <span>Civil &amp; Interior Contractor Measurement Suite</span>
          </div>
          <div className="d-flex align-items-center gap-3 text-muted extra-small">
            <span className="d-inline-flex align-items-center gap-1.5 text-success fw-medium">
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
              MongoDB Atlas Active
            </span>
            <span>&bull;</span>
            <span>&copy; {new Date().getFullYear()} MS PRO. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
