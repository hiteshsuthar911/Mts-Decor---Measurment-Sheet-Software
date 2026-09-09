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
        const res = await fetch(`/api/pdf-files/${pdfDoc._id}/download`, {
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
      <div className="workspace-project-card">
        {/* Card Header Tag */}
        <div className="px-3 pt-3 pb-2 d-flex align-items-center justify-content-between">
          <span className={`workspace-badge-pill ${isOwn ? 'workspace-badge-pill--own' : 'workspace-badge-pill--team'}`}>
            <i className={`bi ${isOwn ? 'bi-person-check-fill' : 'bi-people-fill'}`}></i>
            <span>{isOwn ? 'My Project' : (proj.ownerName || 'Team')}</span>
          </span>

          <span className="text-muted extra-small d-flex align-items-center gap-1" title={new Date(updatedTime).toLocaleString()}>
            <i className="bi bi-clock-history"></i>
            {formatTimeAgo(updatedTime)}
          </span>
        </div>

        {/* Card Body */}
        <div className="px-3 py-2 flex-grow-1 d-flex flex-column justify-content-between">
          <div>
            <h6
              className="fw-bold text-dark mb-1 text-truncate"
              title={proj.name}
              style={{ fontSize: '15px', letterSpacing: '-0.2px' }}
            >
              {proj.name || 'Untitled Project'}
            </h6>

            {/* Client & Location Metadata */}
            <div className="d-flex flex-column gap-1 my-2 text-muted" style={{ fontSize: '11.5px' }}>
              {clientName ? (
                <div className="d-flex align-items-center gap-1.5 text-truncate" title={`Client: ${clientName}`}>
                  <i className="bi bi-building text-secondary" style={{ fontSize: '11px' }}></i>
                  <span className="text-secondary text-truncate">{clientName}</span>
                </div>
              ) : (
                <div className="d-flex align-items-center gap-1.5 text-muted fst-italic">
                  <i className="bi bi-building text-muted" style={{ fontSize: '11px' }}></i>
                  <span>No client specified</span>
                </div>
              )}

              {location ? (
                <div className="d-flex align-items-center gap-1.5 text-truncate" title={`Location: ${location}`}>
                  <i className="bi bi-geo-alt text-secondary" style={{ fontSize: '11px' }}></i>
                  <span className="text-secondary text-truncate">{location}</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Area / Items count chip */}
          <div className="d-flex align-items-center gap-2 pt-2 pb-1">
            <span className="badge workspace-card-chip border px-2 py-1 fw-semibold extra-small">
              <i className="bi bi-grid me-1 text-primary"></i>
              {areasCount} {areasCount === 1 ? 'Area' : 'Areas'}
            </span>
            {proj.lastEditedBy && proj.lastEditedBy !== proj.ownerName && (
              <span className="text-muted extra-small text-truncate" style={{ fontSize: '10.5px' }}>
                Edited by {proj.lastEditedBy}
              </span>
            )}
          </div>
        </div>

        {/* Card Actions Footer */}
        <div className="px-3 py-2.5 workspace-card-footer border-top d-flex align-items-center justify-content-between gap-2">
          <button
            type="button"
            className="btn btn-primary btn-sm fw-bold px-3 py-1.5 flex-grow-1 d-flex align-items-center justify-content-center gap-1.5 shadow-2xs"
            style={{ borderRadius: '8px', fontSize: '12px' }}
            onClick={() => navigate(`/sheet/${id}`)}
          >
            <span>Open Sheet</span>
            <i className="bi bi-arrow-right project-card-arrow"></i>
          </button>

          <div className="d-flex align-items-center gap-1">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary px-2 py-1.5"
              style={{ borderRadius: '8px' }}
              title="Duplicate Project (Make a Copy)"
              onClick={() => handleDuplicateProject(id)}
            >
              <i className="bi bi-copy"></i>
            </button>

            {isOwn && (
              <button
                type="button"
                className="btn btn-sm btn-outline-danger px-2 py-1.5"
                style={{ borderRadius: '8px' }}
                title="Move to Recently Deleted"
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
      <div className="workspace-project-card">
        <div className="px-3 pt-3 pb-2 d-flex align-items-center justify-content-between">
          <span className="workspace-badge-pill workspace-badge-pill--excel">
            <i className="bi bi-file-earmark-excel-fill text-success"></i>
            <span>Excel Workbook</span>
          </span>

          <span className="text-muted extra-small d-flex align-items-center gap-1">
            <i className="bi bi-clock-history"></i>
            {formatTimeAgo(file.createdAt)}
          </span>
        </div>

        <div className="px-3 py-2 flex-grow-1 d-flex flex-column justify-content-between">
          <div>
            <h6
              className="fw-bold text-dark mb-1 text-truncate"
              title={file.fileName}
              style={{ fontSize: '14.5px' }}
            >
              {file.fileName}
            </h6>

            <div className="text-muted extra-small mb-2 text-truncate">
              <i className="bi bi-folder2 text-success me-1"></i>
              Project: <span className="text-dark fw-semibold">{file.projectName || 'Measurement Sheet'}</span>
            </div>

            <div className="d-flex flex-wrap gap-1.5 mb-2">
              <span className="badge workspace-card-chip border extra-small">
                <i className="bi bi-hdd me-1 text-secondary"></i>
                {formatFileSize(file.fileSize)}
              </span>
              <span className="badge workspace-card-chip border extra-small">
                <i className="bi bi-person me-1 text-secondary"></i>
                {file.ownerName || 'User'}
              </span>
            </div>
          </div>
        </div>

        <div className="px-3 py-2.5 workspace-card-footer border-top d-flex align-items-center justify-content-between gap-2">
          <button
            type="button"
            className="btn btn-success btn-sm fw-bold px-3 py-1.5 flex-grow-1 d-flex align-items-center justify-content-center gap-1.5 shadow-2xs"
            style={{ borderRadius: '8px', fontSize: '12px' }}
            onClick={() => setSelectedExcelId(file._id)}
          >
            <i className="bi bi-eye-fill"></i>
            <span>View Sheet</span>
          </button>

          <div className="d-flex align-items-center gap-1">
            <button
              type="button"
              className="btn btn-sm btn-outline-success px-2 py-1.5"
              style={{ borderRadius: '8px' }}
              title="Download .xlsx file"
              onClick={() => handleDownloadExcelCard(file)}
            >
              <i className="bi bi-download"></i>
            </button>

            {(isOwn || session.role === 'ADMIN') && (
              <button
                type="button"
                className="btn btn-sm btn-outline-danger px-2 py-1.5"
                style={{ borderRadius: '8px' }}
                title="Delete Excel file"
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

  const PdfCard = ({ file }) => {
    const isOwn = file.ownerUsername === session?.username;
    return (
      <div className="workspace-project-card">
        <div className="px-3 pt-3 pb-2 d-flex align-items-center justify-content-between">
          <span className="workspace-badge-pill workspace-badge-pill--pdf">
            <i className="bi bi-file-earmark-pdf-fill text-danger"></i>
            <span>PDF Print</span>
          </span>

          <span className="text-muted extra-small d-flex align-items-center gap-1">
            <i className="bi bi-clock-history"></i>
            {formatTimeAgo(file.createdAt)}
          </span>
        </div>

        <div className="px-3 py-2 flex-grow-1 d-flex flex-column justify-content-between">
          <div>
            <h6
              className="fw-bold text-dark mb-1 text-truncate"
              title={file.fileName}
              style={{ fontSize: '14.5px' }}
            >
              {file.fileName}
            </h6>

            <div className="text-muted extra-small mb-2 text-truncate">
              <i className="bi bi-folder2 text-danger me-1"></i>
              Project: <span className="text-dark fw-semibold">{file.projectName || 'Measurement Sheet'}</span>
            </div>

            <div className="d-flex flex-wrap gap-1.5 mb-2">
              <span className="badge workspace-card-chip border extra-small">
                <i className="bi bi-hdd me-1 text-secondary"></i>
                {formatFileSize(file.fileSize)}
              </span>
              {file.pageCount && (
                <span className="badge workspace-card-chip border extra-small">
                  <i className="bi bi-files me-1 text-secondary"></i>
                  {file.pageCount} Pages
                </span>
              )}
              <span className="badge workspace-card-chip border extra-small">
                <i className="bi bi-person me-1 text-secondary"></i>
                {file.ownerName || 'User'}
              </span>
            </div>
          </div>
        </div>

        <div className="px-3 py-2.5 workspace-card-footer border-top d-flex align-items-center justify-content-between gap-2">
          <button
            type="button"
            className="btn btn-danger btn-sm fw-bold px-3 py-1.5 flex-grow-1 d-flex align-items-center justify-content-center gap-1.5 shadow-2xs"
            style={{ borderRadius: '8px', fontSize: '12px' }}
            onClick={() => setSelectedPdfId(file._id)}
          >
            <i className="bi bi-eye-fill"></i>
            <span>View PDF</span>
          </button>

          <div className="d-flex align-items-center gap-1">
            <button
              type="button"
              className="btn btn-sm btn-outline-danger px-2 py-1.5"
              style={{ borderRadius: '8px' }}
              title="Download .pdf document"
              onClick={() => handleDownloadPdfCard(file)}
            >
              <i className="bi bi-download"></i>
            </button>

            {(isOwn || session.role === 'ADMIN') && (
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary px-2 py-1.5"
                style={{ borderRadius: '8px' }}
                title="Delete PDF document"
                onClick={() => handleDeletePdf(file._id, file.ownerUsername)}
              >
                <i className="bi bi-trash3"></i>
              </button>
            )}
          </div>
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
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center gap-2">
            <img
              src="/mtsdecor.png"
              alt="MTS Decor"
              style={{ height: '30px', maxWidth: '120px', objectFit: 'contain' }}
              onError={(e) => { e.target.onerror = null; e.target.src = '/logo.png'; }}
            />
            <span className="fw-bolder fs-5 text-dark mb-0" style={{ letterSpacing: '0.2px' }}>
              MS PRO
            </span>
          </div>
          <span className="d-none d-md-inline extra-small fw-semibold px-2.5 py-1 rounded-pill workspace-brand-pill">
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
      </nav>

      {/* ── 2. WORKSPACE HEADER & HERO SECTION ── */}
      <div className="workspace-hero-banner border-bottom px-3 px-sm-4 py-3">
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

      {/* ── 3. MAIN WORKSPACE CONTENT ── */}
      <main className="container-fluid py-4 px-3 px-sm-4 flex-grow-1">

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
        <div className="workspace-filter-bar border rounded-3 p-2.5 mb-4 shadow-sm d-flex flex-wrap align-items-center justify-content-between gap-3">
          {/* Segmented Filter Pills */}
          <div className="workspace-filter-tabs d-flex flex-wrap align-items-center gap-1 p-1 rounded-2">
            <button
              type="button"
              className={`workspace-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              <i className="bi bi-grid-fill"></i>
              <span>All Projects</span>
              <span className="badge rounded-pill workspace-tab-badge border px-1.5 py-0.5" style={{ fontSize: '10px' }}>
                {safeProjects.length}
              </span>
            </button>

            <button
              type="button"
              className={`workspace-tab-btn ${activeTab === 'my' ? 'active' : ''}`}
              onClick={() => setActiveTab('my')}
            >
              <i className="bi bi-person-fill"></i>
              <span>My Projects</span>
              <span className="badge rounded-pill workspace-tab-badge border px-1.5 py-0.5" style={{ fontSize: '10px' }}>
                {myProjectsAll.length}
              </span>
            </button>

            <button
              type="button"
              className={`workspace-tab-btn ${activeTab === 'team' ? 'active' : ''}`}
              onClick={() => setActiveTab('team')}
            >
              <i className="bi bi-people-fill"></i>
              <span>Team Shared</span>
              <span className="badge rounded-pill workspace-tab-badge border px-1.5 py-0.5" style={{ fontSize: '10px' }}>
                {teamProjectsAll.length}
              </span>
            </button>

            <button
              type="button"
              className={`workspace-tab-btn ${activeTab === 'excel' ? 'active' : ''}`}
              onClick={() => setActiveTab('excel')}
            >
              <i className="bi bi-file-earmark-excel-fill text-success"></i>
              <span>Excel Files</span>
              <span className="badge rounded-pill workspace-tab-badge border px-1.5 py-0.5" style={{ fontSize: '10px' }}>
                {safeExcelFiles.length}
              </span>
            </button>

            <button
              type="button"
              className={`workspace-tab-btn ${activeTab === 'pdf' ? 'active' : ''}`}
              onClick={() => setActiveTab('pdf')}
            >
              <i className="bi bi-file-earmark-pdf-fill text-danger"></i>
              <span>PDF Documents</span>
              <span className="badge rounded-pill workspace-tab-badge border px-1.5 py-0.5" style={{ fontSize: '10px' }}>
                {safePdfFiles.length}
              </span>
            </button>
          </div>

          {/* Right Side: Search and Secondary Actions */}
          <div className="d-flex align-items-center gap-2 flex-grow-1 flex-md-grow-0">
            {/* Search Input */}
            <div className="input-group input-group-sm workspace-search-group" style={{ minWidth: '220px', maxWidth: '300px' }}>
              <span className="input-group-text border-end-0 text-muted">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search projects, client, location..."
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
              className="btn btn-sm btn-outline-success fw-bold d-flex align-items-center gap-1.5"
              style={{ borderRadius: '8px', fontSize: '12px' }}
              title="Upload external .xlsx spreadsheet"
            >
              <i className="bi bi-cloud-arrow-up-fill"></i>
              <span className="d-none d-lg-inline">Import Excel</span>
            </button>

            {/* Recently Deleted Button */}
            <button
              type="button"
              onClick={() => { setShowDeletedModal(true); fetchDeletedProjects(); }}
              className={`btn btn-sm fw-semibold d-flex align-items-center gap-1.5 workspace-trash-btn ${deletedProjects.length > 0 ? 'has-items' : ''}`}
              title="View and Restore Deleted Projects"
            >
              <i className={`bi ${deletedProjects.length > 0 ? 'bi-trash3-fill text-danger' : 'bi-trash3'}`}></i>
              <span className="d-none d-lg-inline">Trash</span>
              {deletedProjects.length > 0 && (
                <span className="badge bg-danger text-white rounded-pill px-1.5 py-0.5" style={{ fontSize: '10px' }}>
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
              <div className="row g-3">
                {displayedProjects.map(proj => (
                  <div key={proj._id || proj.id} className="col-12 col-sm-6 col-lg-4 col-xl-3">
                    <ProjectCard proj={proj} isOwn={proj.ownerUsername === session?.username} />
                  </div>
                ))}
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

                <div className="row g-3">
                  {filteredExcelFiles.map(file => (
                    <div key={file._id} className="col-12 col-sm-6 col-lg-4 col-xl-3">
                      <ExcelCard file={file} />
                    </div>
                  ))}

                  {/* Upload Dashed Card */}
                  <div className="col-12 col-sm-6 col-lg-4 col-xl-3">
                    <div
                      className="card h-100 d-flex flex-column align-items-center justify-content-center text-center p-4 workspace-upload-dashed-card"
                      style={{
                        borderRadius: '12px',
                        cursor: 'pointer',
                        minHeight: '170px',
                        border: '2px dashed #86efac',
                        transition: 'all 0.2s ease',
                      }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(22, 163, 74, 0.15)',
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

                <div className="row g-3">
                  {filteredPdfFiles.map(file => (
                    <div key={file._id} className="col-12 col-sm-6 col-lg-4 col-xl-3">
                      <PdfCard file={file} />
                    </div>
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
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(5px)',
            zIndex: 9999,
          }}
          onClick={() => setShowDeletedModal(false)}
        >
          <div
            className="workspace-modal-card rounded-3 shadow-xl d-flex flex-column border"
            style={{
              width: '100%',
              maxWidth: '720px',
              maxHeight: '85vh',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-4 py-3 border-bottom d-flex align-items-center justify-content-between workspace-modal-header rounded-top-3">
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
                        className="p-3 workspace-deleted-item border rounded-3 d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 shadow-2xs"
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
            <div className="px-4 py-2.5 workspace-modal-footer border-top d-flex justify-content-between align-items-center rounded-bottom-3">
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

      {/* ── CLEAN LIGHT FOOTER ── */}
      <footer className="workspace-footer border-top py-4 text-center mt-auto">
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
