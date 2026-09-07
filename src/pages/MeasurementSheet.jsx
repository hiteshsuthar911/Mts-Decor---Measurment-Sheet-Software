import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import QuickStatsBar from '../components/QuickStatsBar';
import AreaBlock from '../components/AreaBlock';
import SummaryDashboard from '../components/SummaryDashboard';
import PrintSheetView from '../components/PrintSheetView';
import VerifyModal from '../components/VerifyModal';
import QuickMeasureModal from '../components/QuickMeasureModal';
import { getSession, logout } from '../utils/auth';
import { calculateProjectGrandTotals, groupAreasIntoPages, calculateSheetPageTotals, formatNumber } from '../utils/calculations';
import { exportToExcel } from '../utils/exportUtils';
import { createEmptyArea } from '../data/sampleData';
import { getProject, saveProject } from '../utils/storage';

export default function MeasurementSheet() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const session = getSession();

  const [project, setProject]           = useState(null);
  const [projectData, setProjectData]   = useState(null);
  const [editUnlocked, setEditUnlocked] = useState(false);
  const [showVerify, setShowVerify]     = useState(false);
  const [isPrintView, setIsPrintView]   = useState(false);
  const [showQuickMeasure, setShowQuickMeasure] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [notFound, setNotFound]         = useState(false);
  const [fetchError, setFetchError]     = useState('');
  const [pageLoading, setPageLoading]   = useState(true);
  const [isSaving, setIsSaving]         = useState(false);
  const [lastSavedAt, setLastSavedAt]   = useState(null);
  const [activeSheetPage, setActiveSheetPage] = useState('ALL');

  // Guard: must be logged in
  useEffect(() => {
    if (!session) { navigate('/login'); return; }
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      setPageLoading(true);
      setNotFound(false);
      setFetchError('');
      const proj = await getProject(projectId);
      if (!proj) {
        setNotFound(true);
        return;
      }
      setProject(proj);
      const rawData = proj?.data || {};
      const safeData = {
        header: rawData.header || {},
        settings: {
          billingMode: false,
          currencySymbol: '₹',
          taxPercent: 18,
          ...(rawData.settings || {})
        },
        areas: Array.isArray(rawData.areas) && rawData.areas.length > 0
          ? rawData.areas
          : [createEmptyArea()]
      };
      setProjectData(safeData);
      if (proj?.updatedAt) setLastSavedAt(new Date(proj.updatedAt));
      if (proj?.ownerUsername === session?.username || session?.role === 'ADMIN') setEditUnlocked(true);
    } catch (err) {
      console.error('Failed to load project:', err);
      const msg = err?.message || '';
      if (msg.includes('NOT FOUND')) {
        setNotFound(true);
      } else if (msg.includes('UNAUTHORIZED') || msg.includes('TOKEN')) {
        logout();
        navigate('/login');
      } else {
        setFetchError(msg || 'Failed to connect to server');
      }
    } finally {
      setPageLoading(false);
    }
  };

  const isOwn = project?.ownerUsername === session?.username;
  const readOnly = !editUnlocked;

  const showToast = (msg) => { setToastMessage(msg); setTimeout(() => setToastMessage(''), 3000); };

  const isDirtyRef = useRef(false);
  const latestDataRef = useRef(null);

  // Auto-save every 1 second if changes were detected
  useEffect(() => {
    if (readOnly || !projectId) return;

    const interval = setInterval(async () => {
      if (isDirtyRef.current && latestDataRef.current) {
        isDirtyRef.current = false;
        setIsSaving(true);
        try {
          await saveProject(projectId, latestDataRef.current);
          setLastSavedAt(new Date());
        } catch {
          // If save failed, re-mark dirty to retry on next 1-second tick
          isDirtyRef.current = true;
        } finally {
          setIsSaving(false);
        }
      }
    }, 1000);

    // Save on beforeunload if dirty
    const handleBeforeUnload = () => {
      if (isDirtyRef.current && latestDataRef.current) {
        saveProject(projectId, latestDataRef.current).catch(() => {});
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [projectId, readOnly]);

  // Manual save trigger
  const handleManualSave = async () => {
    if (readOnly) return;
    setIsSaving(true);
    isDirtyRef.current = false;
    const toSave = latestDataRef.current || projectData;
    try {
      await saveProject(projectId, toSave);
      setLastSavedAt(new Date());
      showToast('PROJECT SAVED TO CLOUD');
    } catch (err) {
      isDirtyRef.current = true;
      showToast('SAVE FAILED: ' + (err.message || 'SERVER ERROR'));
    } finally {
      setIsSaving(false);
    }
  };

  const grandTotals = calculateProjectGrandTotals(
    projectData?.areas || [],
    projectData?.settings?.billingMode,
    projectData?.settings?.taxPercent
  );

  const setAndSave = (updater) => {
    setProjectData(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      latestDataRef.current = next;
      isDirtyRef.current = true;
      return next;
    });
  };

  const handleUpdateHeader = (newHeader) =>
    setAndSave(prev => ({ ...prev, header: newHeader }));

  const handleToggleBillingMode = (enable, taxPercent) => {
    setAndSave(prev => ({
      ...prev,
      settings: { ...prev.settings, billingMode: enable, taxPercent: taxPercent !== undefined ? taxPercent : prev.settings?.taxPercent || 18 }
    }));
    showToast(enable ? 'RA BILL MODE ENABLED' : 'MEASUREMENT SHEET MODE ACTIVE');
  };

  const handleAddNewArea = (targetCategory = null, forceNewPage = false) => {
    // Guard: reject event objects or non-string values accidentally passed as targetCategory
    const safeCategory = (targetCategory && typeof targetCategory === 'string') ? targetCategory : null;
    const newArea = createEmptyArea();
    if (projectData.areas?.length > 0) {
      const last = projectData.areas[projectData.areas.length - 1];
      newArea.floor = last.floor || '';
      newArea.flat = last.flat || '';
      newArea.room = '';
      if (safeCategory) {
        newArea.parentCategory = safeCategory;
      } else {
        newArea.parentCategory = (typeof last.parentCategory === 'string' && last.parentCategory) ? last.parentCategory : 'Floor Tiles';
      }
    }
    if (forceNewPage) {
      newArea.startNewPage = true;
    }
    setAndSave(prev => ({ ...prev, areas: [...(prev.areas || []), newArea] }));
    showToast(forceNewPage ? 'NEW SHEET PAGE CREATED' : 'NEW AREA ADDED');
  };

  const handleAddNewSheetPage = () => {
    handleAddNewArea(null, true);
  };

  const handleAddAreaToPage = (page) => {
    const newArea = createEmptyArea();
    newArea.floor = page.floor || '';
    newArea.flat = page.flat || '';
    newArea.parentCategory = page.category || 'Floor Tiles';
    newArea.room = '';

    const pageAreaIds = (page.areas || []).map(a => a.id);
    let insertIndex = -1;
    (projectData.areas || []).forEach((a, idx) => {
      if (pageAreaIds.includes(a.id)) {
        insertIndex = idx;
      }
    });

    setAndSave(prev => {
      const currentAreas = [...(prev.areas || [])];
      if (insertIndex >= 0 && insertIndex < currentAreas.length - 1) {
        currentAreas.splice(insertIndex + 1, 0, newArea);
      } else {
        currentAreas.push(newArea);
      }
      return { ...prev, areas: currentAreas };
    });
    showToast(`AREA ADDED TO SHEET PAGE #${page.pageNumber}`);
  };

  const handleUpdateArea = (areaId, updatedArea) =>
    setAndSave(prev => ({ ...prev, areas: prev.areas.map(a => a.id === areaId ? updatedArea : a) }));

  const handleDeleteArea = (areaId) => {
    if (projectData.areas.length <= 1) { alert('AT LEAST ONE AREA BLOCK IS REQUIRED.'); return; }
    if (!confirm('DELETE THIS AREA AND ALL ITS MEASUREMENTS?')) return;
    setAndSave(prev => ({ ...prev, areas: prev.areas.filter(a => a.id !== areaId) }));
    showToast('AREA DELETED');
  };

  const handleDuplicateArea = (areaId) => {
    const idx = projectData.areas.findIndex(a => a.id === areaId);
    if (idx === -1) return;
    const orig = projectData.areas[idx];
    const clone = {
      ...JSON.parse(JSON.stringify(orig)),
      id: `area-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      room: `${orig.room || 'AREA'} (COPY)`,
      items: orig.items.map(item => ({ ...item, id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` }))
    };
    const newAreas = [...projectData.areas];
    newAreas.splice(idx + 1, 0, clone);
    setAndSave(prev => ({ ...prev, areas: newAreas }));
    showToast('AREA DUPLICATED');
  };

  const handleMoveArea = (areaId, direction) => {
    const idx = projectData.areas.findIndex(a => a.id === areaId);
    if (idx === -1) return;
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= projectData.areas.length) return;
    const newAreas = [...projectData.areas];
    [newAreas[idx], newAreas[targetIdx]] = [newAreas[targetIdx], newAreas[idx]];
    setAndSave(prev => ({ ...prev, areas: newAreas }));
  };

  const handleResetSheet = () => {
    if (!confirm('CLEAR ALL MEASUREMENTS IN THIS PROJECT?')) return;
    setProjectData(prev => ({ ...prev, areas: [createEmptyArea()] }));
    showToast('SHEET CLEARED');
  };

  const handleExportExcel = () => {
    exportToExcel(projectData, projectData.settings?.billingMode);
    showToast('EXPORTED TO EXCEL (.XLSX)');
  };

  // ── Render States ───────────────────────────────────────────
  if (!session) return null;

  if (pageLoading) return (
    <div className="d-flex flex-column align-items-center justify-content-center min-vh-100">
      <div className="spinner-border text-dark mb-3" role="status"></div>
      <div className="text-muted text-uppercase fw-semibold small">LOADING PROJECT FROM CLOUD...</div>
    </div>
  );

  if (notFound) return (
    <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-light text-center p-4">
      <div className="display-1 mb-3">🔍</div>
      <h4 className="fw-bolder text-uppercase">PROJECT NOT FOUND</h4>
      <p className="text-muted text-uppercase small">THIS PROJECT MAY HAVE BEEN DELETED.</p>
      <Link to="/projects" className="btn btn-dark fw-bold text-uppercase px-4 mt-2">
        <i className="bi bi-arrow-left me-2"></i> BACK TO PROJECTS
      </Link>
    </div>
  );

  if (fetchError) return (
    <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-light text-center p-4">
      <div className="display-1 mb-3 text-warning">⚠️</div>
      <h4 className="fw-bolder text-uppercase">COULD NOT LOAD PROJECT</h4>
      <p className="text-muted text-uppercase small mb-4">{fetchError}</p>
      <div className="d-flex gap-2">
        <button className="btn btn-primary fw-bold text-uppercase px-4" onClick={fetchProject}>
          <i className="bi bi-arrow-clockwise me-2"></i> RETRY
        </button>
        <Link to="/projects" className="btn btn-outline-dark fw-bold text-uppercase px-4">
          <i className="bi bi-arrow-left me-2"></i> BACK TO PROJECTS
        </Link>
      </div>
    </div>
  );

  if (!projectData) return (
    <div className="d-flex align-items-center justify-content-center min-vh-100">
      <div className="spinner-border text-dark" role="status"></div>
    </div>
  );

  return (
    <div className="app-container min-vh-100 d-flex flex-column bg-light">
      {/* Identity Verify Modal */}
      <VerifyModal
        show={showVerify}
        currentUser={session}
        ownerName={project?.ownerName}
        onVerified={() => { setShowVerify(false); setEditUnlocked(true); showToast('EDIT MODE UNLOCKED'); }}
        onCancel={() => setShowVerify(false)}
      />

      {/* Toast */}
      {toastMessage && (
        <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 9999 }}>
          <div className="toast show text-white bg-dark border-0 shadow-lg px-3 py-2 rounded">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-check-circle-fill text-success fs-5"></i>
              <div className="toast-body p-0 small fw-bold text-uppercase">{toastMessage}</div>
            </div>
          </div>
        </div>
      )}

      {/* Top Nav Bar */}
      <div className="bg-dark text-white py-1 px-2 px-md-3 d-flex flex-wrap align-items-center justify-content-between gap-1 no-print" style={{ fontSize: '11px' }}>
        <div className="d-flex align-items-center flex-wrap gap-2 text-uppercase fw-bold">
          <Link to="/projects" className="text-warning text-decoration-none">📐 MS PRO</Link>
          <span className="text-secondary d-none d-sm-inline">|</span>
          <span className="text-secondary">{session.name}</span>
          <span className="text-secondary d-none d-md-inline">|</span>
          <span className="text-info d-none d-md-inline">
            {isOwn ? '📁 MY PROJECT' : `👁 VIEWING ${project?.ownerName?.toUpperCase()}'S PROJECT`}
          </span>
        </div>
        <div className="d-flex gap-1 gap-sm-2 align-items-center">
          <Link to="/profile" className="btn btn-sm btn-outline-light text-uppercase fw-bold px-2 py-0" style={{ fontSize: '10px' }}>
            <i className="bi bi-person-circle me-sm-1"></i><span className="d-none d-sm-inline">PROFILE</span>
          </Link>
          <Link to="/projects" className="btn btn-sm btn-outline-light text-uppercase fw-bold px-2 py-0" style={{ fontSize: '10px' }}>
            <i className="bi bi-grid-3x3-gap-fill me-sm-1"></i><span className="d-none d-sm-inline">PROJECTS</span>
          </Link>
          <button
            className="btn btn-sm btn-outline-danger text-uppercase fw-bold px-2 py-0"
            style={{ fontSize: '10px' }}
            onClick={() => { logout(); navigate('/login'); }}
          >
            <i className="bi bi-box-arrow-right me-sm-1"></i><span className="d-none d-sm-inline">LOGOUT</span>
          </button>
        </div>
      </div>

      {/* READ-ONLY BANNER */}
      {readOnly && !isOwn && (
        <div className="bg-warning text-dark py-2 px-4 d-flex align-items-center justify-content-between no-print">
          <div className="fw-bold text-uppercase small">
            <i className="bi bi-eye-fill me-2"></i>
            READ-ONLY MODE — YOU ARE VIEWING <strong>{project?.ownerName?.toUpperCase()}'S</strong> PROJECT.
            UNLOCK TO MAKE CHANGES.
          </div>
          <button
            className="btn btn-dark btn-sm fw-bold text-uppercase"
            onClick={() => setShowVerify(true)}
          >
            <i className="bi bi-unlock-fill me-2"></i>UNLOCK TO EDIT
          </button>
        </div>
      )}

      {/* EDIT UNLOCKED BANNER (other user's project) */}
      {editUnlocked && !isOwn && (
        <div className="bg-success text-white py-1 px-4 d-flex align-items-center justify-content-between no-print" style={{ fontSize: '12px' }}>
          <div className="fw-bold text-uppercase">
            <i className="bi bi-unlock-fill me-2"></i>
            EDIT MODE ACTIVE — EDITING <strong>{project?.ownerName?.toUpperCase()}'S</strong> PROJECT AS <strong>{session.name}</strong>.
          </div>
        </div>
      )}

      {/* Main Header Component */}
      <Header
        headerData={projectData.header}
        onChangeHeader={readOnly ? () => {} : handleUpdateHeader}
        settings={projectData.settings}
        onToggleBillingMode={readOnly ? () => {} : handleToggleBillingMode}
        onLoadSample={() => {}}
        onResetSheet={readOnly ? () => {} : handleResetSheet}
        onExportExcel={handleExportExcel}
        onOpenPrintView={() => setIsPrintView(!isPrintView)}
        onAddNewArea={readOnly ? () => {} : handleAddNewArea}
        onOpenQuickMeasure={readOnly ? () => {} : () => setShowQuickMeasure(true)}
        onSave={handleManualSave}
        isSaving={isSaving}
        lastSavedAt={lastSavedAt}
        isPrintView={isPrintView}
        readOnly={readOnly}
      />

      {isPrintView ? (
        <PrintSheetView
          projectData={projectData}
          billingMode={projectData.settings?.billingMode}
          currencySymbol={projectData.settings?.currencySymbol}
          onClose={() => setIsPrintView(false)}
        />
      ) : (
        <main className="container-fluid flex-grow-1 px-2 px-md-4">
          <QuickStatsBar
            grandTotals={grandTotals}
            billingMode={projectData.settings?.billingMode}
            currencySymbol={projectData.settings?.currencySymbol}
          />

          <div className="areas-container">
            {/* Top Bar: Section Title & Cloud Actions */}
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
              <h5 className="fw-bolder text-dark mb-0 d-flex align-items-center gap-2 text-uppercase">
                <i className="bi bi-grid-3x3-gap-fill text-primary"></i>
                LOCATION &amp; WORK MEASUREMENT GROUPS ({projectData?.areas?.length || 0})
              </h5>
              <div className="d-flex gap-2">
                {!readOnly && (
                  <>
                    <button
                      type="button"
                      className="btn btn-sm btn-success d-flex align-items-center gap-1 shadow-sm fw-bold text-uppercase px-3"
                      onClick={handleManualSave}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                      ) : (
                        <i className="bi bi-cloud-arrow-up-fill"></i>
                      )}
                      <span>SAVE</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1 shadow-sm fw-bold text-uppercase"
                      onClick={handleAddNewSheetPage}
                      title="Start a new sheet page with a different work category"
                    >
                      <i className="bi bi-file-earmark-plus"></i>
                      <span>+ NEW SHEET PAGE</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary d-flex align-items-center gap-1 shadow-sm fw-bold text-uppercase"
                      onClick={() => handleAddNewArea()}
                    >
                      <i className="bi bi-plus-circle-fill"></i>
                      <span>+ ADD AREA</span>
                    </button>
                  </>
                )}
                {readOnly && (
                  <button
                    className="btn btn-sm btn-warning fw-bold text-uppercase"
                    onClick={() => setShowVerify(true)}
                  >
                    <i className="bi bi-unlock-fill me-1"></i>UNLOCK TO EDIT
                  </button>
                )}
              </div>
            </div>

            {/* Compute Sequential Sheet Pages (1-1-2-3-1 logic) */}
            {(() => {
              const pagesList = groupAreasIntoPages(projectData?.areas || []);
              const sheetPageMap = {};
              pagesList.forEach(p => {
                (p.areas || []).forEach(a => {
                  sheetPageMap[a.id] = p.pageNumber;
                });
              });

              const isSinglePageView = activeSheetPage !== 'ALL';
              const currentPage = isSinglePageView
                ? (pagesList.find(p => p.pageNumber === Number(activeSheetPage)) || pagesList[0])
                : null;
              const pageIdx = currentPage
                ? pagesList.findIndex(p => p.pageNumber === currentPage.pageNumber)
                : -1;

              return (
                <>
                  {/* Sheet Page Navigation Tabs Bar */}
                  {pagesList.length > 0 && (
                    <div className="sheet-page-nav-bar bg-white p-2 p-md-3 border rounded-3 mb-3 shadow-sm">
                      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2 pb-2 border-bottom">
                        <div className="d-flex align-items-center flex-wrap gap-2">
                          <span className="extra-small fw-bolder text-muted text-uppercase d-flex align-items-center">
                            <i className="bi bi-file-earmark-spreadsheet-fill text-primary me-1 fs-6"></i>
                            SHEET PAGES ({pagesList.length} TOTAL):
                          </span>
                          <span className="badge bg-primary-subtle text-primary border border-primary-subtle fw-bold extra-small text-uppercase">
                            Sequential 1-1-2-3-1 Flow
                          </span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <span className="text-muted extra-small d-none d-lg-inline">
                            Switch tabs to focus on one page without clutter, or select View All Pages
                          </span>
                          {!readOnly && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary fw-bold extra-small text-uppercase py-1"
                              onClick={handleAddNewSheetPage}
                              title="Start a new separate sheet page"
                            >
                              <i className="bi bi-file-earmark-plus me-1"></i>+ New Sheet Page
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Scrollable Page Tabs */}
                      <div className="d-flex align-items-center gap-2 overflow-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
                        <button
                          type="button"
                          className={`btn btn-sm ${activeSheetPage === 'ALL' ? 'btn-dark shadow-sm' : 'btn-light border text-secondary'} fw-bold text-uppercase extra-small text-nowrap py-1 px-3`}
                          onClick={() => setActiveSheetPage('ALL')}
                        >
                          <i className="bi bi-collection me-1"></i> View All Pages ({pagesList.length})
                        </button>

                        {pagesList.map((pg) => {
                          const isSelected = activeSheetPage === pg.pageNumber;
                          return (
                            <button
                              key={pg.pageNumber}
                              type="button"
                              className={`btn btn-sm ${isSelected ? 'btn-primary shadow-sm' : 'btn-light border text-dark'} fw-bold extra-small text-nowrap py-1 px-3 d-flex align-items-center gap-1`}
                              onClick={() => setActiveSheetPage(pg.pageNumber)}
                            >
                              <i className="bi bi-file-earmark-text"></i>
                              <span>Page #{pg.pageNumber}:</span>
                              <span className={isSelected ? 'text-white' : 'text-primary'}>{pg.category}</span>
                              <span className={`badge ${isSelected ? 'bg-white text-primary' : 'bg-secondary-subtle text-secondary'} rounded-pill ms-1`}>
                                {pg.areas.length}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Mode 1: Single Focused Sheet Page View */}
                  {isSinglePageView && currentPage && (() => {
                    const pageTotals = calculateSheetPageTotals(currentPage);
                    return (
                      <div className="single-sheet-page-view mb-4">
                        {/* Focused Sheet Page Card Banner */}
                        <div className="card border-primary-subtle shadow-sm mb-3" style={{ borderLeft: '5px solid #0d6efd' }}>
                          <div className="card-body py-3 px-3 bg-light">
                            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                              {/* Left details */}
                              <div className="d-flex align-items-center flex-wrap gap-2">
                                <span className="badge bg-primary px-3 py-2 rounded-pill fw-bold text-uppercase fs-6">
                                  <i className="bi bi-file-earmark-text-fill me-1"></i>
                                  SHEET PAGE #{currentPage.pageNumber} OF {pagesList.length}
                                </span>
                                <h5 className="mb-0 fw-bolder text-dark text-uppercase">{currentPage.category}</h5>
                                <span className="text-secondary extra-small">
                                  ({currentPage.areas.length} {currentPage.areas.length === 1 ? 'Location Area' : 'Location Areas'})
                                </span>
                              </div>

                              {/* Right: Totals & Quick Add */}
                              <div className="d-flex align-items-center flex-wrap gap-2">
                                <span className="badge bg-white text-dark border px-3 py-2 fs-6 fw-bold shadow-sm">
                                  PAGE TOTAL: {pageTotals.netQty} {pageTotals.dominantUnit}
                                </span>
                                {projectData?.settings?.billingMode && (
                                  <span className="badge bg-success text-white px-3 py-2 fs-6 fw-bold shadow-sm">
                                    ₹{formatNumber(pageTotals.netAmount)}
                                  </span>
                                )}
                                {!readOnly && (
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-primary fw-bold text-uppercase d-flex align-items-center gap-1 shadow-sm px-3"
                                    onClick={() => handleAddAreaToPage(currentPage)}
                                    title="Add another area to this sheet page"
                                  >
                                    <i className="bi bi-plus-circle-fill"></i>
                                    <span>+ Add Area to Page #{currentPage.pageNumber}</span>
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Page Navigation & Pagination Toolbar */}
                            <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary extra-small fw-bold text-uppercase"
                                disabled={pageIdx === 0}
                                onClick={() => setActiveSheetPage(pagesList[pageIdx - 1].pageNumber)}
                              >
                                <i className="bi bi-arrow-left me-1"></i> Prev Page
                              </button>

                              <div className="d-flex align-items-center gap-2">
                                <span className="text-muted extra-small fw-bold text-uppercase">
                                  Showing Page {currentPage.pageNumber} of {pagesList.length} &bull; Work Detail: {currentPage.category}
                                </span>
                                <button
                                  type="button"
                                  className="btn btn-link btn-sm extra-small fw-bold text-decoration-none text-primary p-0"
                                  onClick={() => setActiveSheetPage('ALL')}
                                >
                                  (View All)
                                </button>
                              </div>

                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary extra-small fw-bold text-uppercase"
                                disabled={pageIdx === pagesList.length - 1}
                                onClick={() => setActiveSheetPage(pagesList[pageIdx + 1].pageNumber)}
                              >
                                Next Page <i className="bi bi-arrow-right ms-1"></i>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Render ONLY areas belonging to this page */}
                        {(currentPage.areas || []).map((area) => {
                          const originalIndex = (projectData?.areas || []).findIndex(a => a.id === area.id);
                          return (
                            <AreaBlock
                              key={area.id}
                              area={area}
                              index={originalIndex >= 0 ? originalIndex : 0}
                              sheetPageNumber={currentPage.pageNumber}
                              totalAreas={projectData?.areas?.length || 1}
                              billingMode={projectData?.settings?.billingMode}
                              currencySymbol={projectData?.settings?.currencySymbol}
                              onChangeArea={readOnly ? () => {} : handleUpdateArea}
                              onDeleteArea={readOnly ? () => {} : handleDeleteArea}
                              onDuplicateArea={readOnly ? () => {} : handleDuplicateArea}
                              onMoveArea={readOnly ? () => {} : handleMoveArea}
                              readOnly={readOnly}
                            />
                          );
                        })}

                        {/* Bottom pagination & actions */}
                        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 my-3 p-3 bg-white border rounded shadow-sm">
                          <button
                            type="button"
                            className="btn btn-outline-secondary fw-bold extra-small text-uppercase"
                            disabled={pageIdx === 0}
                            onClick={() => setActiveSheetPage(pagesList[pageIdx - 1].pageNumber)}
                          >
                            <i className="bi bi-chevron-left me-1"></i> Previous Sheet Page
                          </button>

                          <div className="d-flex gap-2">
                            {!readOnly && (
                              <>
                                <button
                                  type="button"
                                  className="btn btn-outline-primary fw-bold extra-small text-uppercase"
                                  onClick={() => handleAddAreaToPage(currentPage)}
                                >
                                  <i className="bi bi-plus-circle me-1"></i>+ Add Area to Page #{currentPage.pageNumber}
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-primary fw-bold extra-small text-uppercase"
                                  onClick={handleAddNewSheetPage}
                                >
                                  <i className="bi bi-file-earmark-plus me-1"></i>+ Start New Sheet Page
                                </button>
                              </>
                            )}
                          </div>

                          <button
                            type="button"
                            className="btn btn-outline-secondary fw-bold extra-small text-uppercase"
                            disabled={pageIdx === pagesList.length - 1}
                            onClick={() => setActiveSheetPage(pagesList[pageIdx + 1].pageNumber)}
                          >
                            Next Sheet Page <i className="bi bi-chevron-right ms-1"></i>
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Mode 2: All Pages View (Structured with distinct Sheet Page divider headers) */}
                  {!isSinglePageView && (
                    <div className="all-sheet-pages-view">
                      {pagesList.map((pg) => {
                        const pageTotals = calculateSheetPageTotals(pg);
                        return (
                          <div key={`page-section-${pg.pageNumber}`} className="sheet-page-section mb-4">
                            {/* Page Header Divider */}
                            <div className="bg-dark text-white p-2 p-md-3 rounded-top d-flex flex-wrap justify-content-between align-items-center gap-2 shadow-sm">
                              <div className="d-flex align-items-center flex-wrap gap-2">
                                <span className="badge bg-primary fs-6 px-3 py-1 rounded-pill fw-bold">
                                  SHEET PAGE #{pg.pageNumber}
                                </span>
                                <span className="fs-6 fw-bold text-uppercase text-white">{pg.category}</span>
                                <span className="badge bg-secondary rounded-pill extra-small">
                                  {pg.areas.length} {pg.areas.length === 1 ? 'Area' : 'Areas'}
                                </span>
                              </div>

                              <div className="d-flex align-items-center flex-wrap gap-2">
                                <span className="badge bg-light text-dark px-3 py-1 fw-bold">
                                  PAGE TOTAL: {pageTotals.netQty} {pageTotals.dominantUnit}
                                </span>
                                {projectData?.settings?.billingMode && (
                                  <span className="badge bg-success text-white px-3 py-1 fw-bold">
                                    ₹{formatNumber(pageTotals.netAmount)}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-light extra-small fw-bold text-uppercase py-1 px-2"
                                  onClick={() => setActiveSheetPage(pg.pageNumber)}
                                  title="Focus on this sheet page only"
                                >
                                  <i className="bi bi-arrows-angle-expand me-1"></i> Focus Page #{pg.pageNumber}
                                </button>
                              </div>
                            </div>

                            {/* Areas in this Page */}
                            <div className="border border-top-0 rounded-bottom p-2 p-md-3 bg-light-subtle">
                              {(pg.areas || []).map((area) => {
                                const originalIndex = (projectData?.areas || []).findIndex(a => a.id === area.id);
                                return (
                                  <AreaBlock
                                    key={area.id}
                                    area={area}
                                    index={originalIndex >= 0 ? originalIndex : 0}
                                    sheetPageNumber={pg.pageNumber}
                                    totalAreas={projectData?.areas?.length || 1}
                                    billingMode={projectData?.settings?.billingMode}
                                    currencySymbol={projectData?.settings?.currencySymbol}
                                    onChangeArea={readOnly ? () => {} : handleUpdateArea}
                                    onDeleteArea={readOnly ? () => {} : handleDeleteArea}
                                    onDuplicateArea={readOnly ? () => {} : handleDuplicateArea}
                                    onMoveArea={readOnly ? () => {} : handleMoveArea}
                                    readOnly={readOnly}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}

                      {/* Global Add & Save buttons */}
                      {!readOnly && (
                        <div className="text-center my-4 d-flex justify-content-center flex-wrap gap-2">
                          <button
                            type="button"
                            className="btn btn-outline-primary px-3 py-2 fw-bold shadow-sm text-uppercase"
                            onClick={() => handleAddNewArea()}
                          >
                            <i className="bi bi-plus-circle-fill me-2"></i>
                            + ADD ANOTHER AREA
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary px-3 py-2 fw-bold shadow-sm text-uppercase"
                            onClick={handleAddNewSheetPage}
                          >
                            <i className="bi bi-file-earmark-plus me-2"></i>
                            + START NEW SHEET PAGE
                          </button>
                          <button
                            type="button"
                            className="btn btn-success px-4 py-2 fw-bold shadow-sm text-uppercase"
                            onClick={handleManualSave}
                            disabled={isSaving}
                          >
                            <i className="bi bi-cloud-arrow-up-fill me-2"></i>
                            {isSaving ? 'SAVING...' : 'SAVE TO CLOUD'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          <SummaryDashboard
            grandTotals={grandTotals}
            billingMode={projectData.settings?.billingMode}
            currencySymbol={projectData.settings?.currencySymbol}
          />
        </main>
      )}

      {/* Mobile Sticky Bottom Bar */}
      {!readOnly && !isPrintView && (
        <div className="mobile-sticky-bar d-flex align-items-center justify-content-between gap-2 shadow">
          <div className="text-white extra-small fw-bold text-uppercase text-truncate" style={{ maxWidth: '40%' }}>
            <span className="text-secondary">TOTAL: </span>
            <span className="text-warning">{grandTotals?.totalNetQty ? grandTotals.totalNetQty.toFixed(2) : '0'}</span>
          </div>
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-sm btn-warning text-dark fw-bold text-uppercase px-2 py-1 extra-small"
              onClick={() => setShowQuickMeasure(true)}
            >
              <i className="bi bi-phone-fill me-1"></i>FIELD
            </button>
            <button
              type="button"
              className="btn btn-sm btn-primary fw-bold text-uppercase px-2 py-1 extra-small"
              onClick={() => handleAddNewArea()}
            >
              <i className="bi bi-plus-circle-fill me-1"></i>AREA
            </button>
            <button
              type="button"
              className="btn btn-sm btn-success fw-bold text-uppercase px-3 py-1 extra-small"
              onClick={handleManualSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <span className="spinner-border spinner-border-sm" role="status"></span>
              ) : (
                <><i className="bi bi-cloud-arrow-up-fill me-1"></i>SAVE</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Quick Measure Field Mode Modal */}
      <QuickMeasureModal
        show={showQuickMeasure}
        onClose={() => setShowQuickMeasure(false)}
        projectData={projectData}
        onUpdateProjectData={setAndSave}
        projectName={projectData?.header?.projectName || project?.name}
      />

      <footer className="bg-white border-top py-2 text-center text-muted extra-small mt-auto no-print text-uppercase">
        &copy; {new Date().getFullYear()} MS PRO — CONTRACTOR MEASUREMENT &amp; RA BILL SYSTEM
      </footer>
    </div>
  );
}
