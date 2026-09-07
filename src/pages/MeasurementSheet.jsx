import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import QuickStatsBar from '../components/QuickStatsBar';
import AreaBlock from '../components/AreaBlock';
import SummaryDashboard from '../components/SummaryDashboard';
import PrintSheetView from '../components/PrintSheetView';
import VerifyModal from '../components/VerifyModal';
import { getSession, logout } from '../utils/auth';
import { getProject, saveProject } from '../utils/storage';
import { calculateProjectGrandTotals } from '../utils/calculations';
import { exportToExcel } from '../utils/exportUtils';
import { createEmptyArea } from '../data/sampleData';

export default function MeasurementSheet() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const session = getSession();
  const saveTimer = useRef(null);

  const [project, setProject]           = useState(null);
  const [projectData, setProjectData]   = useState(null);
  const [editUnlocked, setEditUnlocked] = useState(false);
  const [showVerify, setShowVerify]     = useState(false);
  const [isPrintView, setIsPrintView]   = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [notFound, setNotFound]         = useState(false);
  const [pageLoading, setPageLoading]   = useState(true);
  const [isSaving, setIsSaving]         = useState(false);
  const [lastSavedAt, setLastSavedAt]   = useState(null);

  // Guard: must be logged-in USER
  useEffect(() => {
    if (!session) { navigate('/login'); return; }
    if (session.role === 'ADMIN') { navigate('/admin'); return; }
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      setPageLoading(true);
      const proj = await getProject(projectId);
      setProject(proj);
      setProjectData(proj.data || {});
      if (proj.updatedAt) setLastSavedAt(new Date(proj.updatedAt));
      if (proj.ownerUsername === session.username) setEditUnlocked(true);
    } catch {
      setNotFound(true);
    } finally {
      setPageLoading(false);
    }
  };

  const isOwn = project?.ownerUsername === session?.username;
  const readOnly = !editUnlocked;

  const showToast = (msg) => { setToastMessage(msg); setTimeout(() => setToastMessage(''), 3000); };

  // Manual save trigger
  const handleManualSave = async () => {
    if (readOnly) return;
    setIsSaving(true);
    clearTimeout(saveTimer.current);
    try {
      await saveProject(projectId, projectData);
      setLastSavedAt(new Date());
      showToast('PROJECT SAVED TO CLOUD');
    } catch (err) {
      showToast('SAVE FAILED: ' + (err.message || 'SERVER ERROR'));
    } finally {
      setIsSaving(false);
    }
  };

  // Debounced auto-save: 1.5s after last change
  const scheduleAutoSave = (data) => {
    if (readOnly) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await saveProject(projectId, data);
        setLastSavedAt(new Date());
      } catch { /* silent fail */ }
    }, 1500);
  };

  const grandTotals = projectData
    ? calculateProjectGrandTotals(
        projectData.areas,
        projectData.settings?.billingMode,
        projectData.settings?.taxPercent
      )
    : null;

  const setAndSave = (updater) => {
    setProjectData(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      scheduleAutoSave(next);
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

  const handleAddNewArea = () => {
    const newArea = createEmptyArea();
    if (projectData.areas?.length > 0) {
      const last = projectData.areas[projectData.areas.length - 1];
      newArea.floor = last.floor;
      newArea.flat = last.flat;
      newArea.room = '';
    }
    setAndSave(prev => ({ ...prev, areas: [...(prev.areas || []), newArea] }));
    showToast('NEW AREA ADDED');
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
    <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-light text-center">
      <div className="display-1 mb-3">🔍</div>
      <h4 className="fw-bolder text-uppercase">PROJECT NOT FOUND</h4>
      <p className="text-muted text-uppercase small">THIS PROJECT MAY HAVE BEEN DELETED.</p>
      <Link to="/projects" className="btn btn-dark fw-bold text-uppercase px-4 mt-2">
        <i className="bi bi-arrow-left me-2"></i> BACK TO PROJECTS
      </Link>
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
      <div className="bg-dark text-white py-1 px-3 d-flex align-items-center justify-content-between no-print" style={{ fontSize: '11px' }}>
        <div className="d-flex align-items-center gap-3 text-uppercase fw-bold">
          <Link to="/projects" className="text-warning text-decoration-none">📐 MS PRO</Link>
          <span className="text-secondary">|</span>
          <span className="text-secondary">{session.name}</span>
          <span className="text-secondary">|</span>
          <span className="text-info">
            {isOwn ? '📁 MY PROJECT' : `👁 VIEWING ${project?.ownerName?.toUpperCase()}'S PROJECT`}
          </span>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <Link to="/projects" className="btn btn-sm btn-outline-light text-uppercase fw-bold px-2 py-0" style={{ fontSize: '10px' }}>
            <i className="bi bi-grid-3x3-gap-fill me-1"></i>ALL PROJECTS
          </Link>
          <button
            className="btn btn-sm btn-outline-danger text-uppercase fw-bold px-2 py-0"
            style={{ fontSize: '10px' }}
            onClick={() => { logout(); navigate('/login'); }}
          >
            <i className="bi bi-box-arrow-right me-1"></i>LOGOUT
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
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
              <h5 className="fw-bolder text-dark mb-0 d-flex align-items-center gap-2 text-uppercase">
                <i className="bi bi-grid-3x3-gap-fill text-primary"></i>
                LOCATION &amp; WORK MEASUREMENT GROUPS ({projectData.areas.length})
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
                      className="btn btn-sm btn-primary d-flex align-items-center gap-1 shadow-sm fw-bold text-uppercase"
                      onClick={handleAddNewArea}
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

            {projectData.areas.map((area, idx) => (
              <AreaBlock
                key={area.id}
                area={area}
                index={idx}
                totalAreas={projectData.areas.length}
                billingMode={projectData.settings?.billingMode}
                currencySymbol={projectData.settings?.currencySymbol}
                onChangeArea={readOnly ? () => {} : handleUpdateArea}
                onDeleteArea={readOnly ? () => {} : handleDeleteArea}
                onDuplicateArea={readOnly ? () => {} : handleDuplicateArea}
                onMoveArea={readOnly ? () => {} : handleMoveArea}
                readOnly={readOnly}
              />
            ))}

            {!readOnly && (
              <div className="text-center my-4 d-flex justify-content-center gap-2">
                <button
                  type="button"
                  className="btn btn-outline-primary px-3 py-2 fw-bold shadow-sm text-uppercase"
                  onClick={handleAddNewArea}
                >
                  <i className="bi bi-plus-circle-fill me-2"></i>
                  + ADD ANOTHER AREA
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
              className="btn btn-sm btn-primary fw-bold text-uppercase px-2 py-1 extra-small"
              onClick={handleAddNewArea}
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

      <footer className="bg-white border-top py-2 text-center text-muted extra-small mt-auto no-print text-uppercase">
        &copy; {new Date().getFullYear()} MS PRO — CONTRACTOR MEASUREMENT &amp; RA BILL SYSTEM
      </footer>
    </div>
  );
}
