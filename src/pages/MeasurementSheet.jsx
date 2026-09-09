import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import QuickStatsBar from '../components/QuickStatsBar';
import AreaBlock from '../components/AreaBlock';
import SummaryDashboard from '../components/SummaryDashboard';
import PrintSheetView from '../components/PrintSheetView';
import VerifyModal from '../components/VerifyModal';
import QuickMeasureModal from '../components/QuickMeasureModal';
import RateMasterModal from '../components/RateMasterModal';
import ClientApprovalModal from '../components/ClientApprovalModal';
import SiteEngineerReviewModal from '../components/SiteEngineerReviewModal';
import SummaryPrintModal from '../components/SummaryPrintModal';
import GstInvoiceModal from '../components/GstInvoiceModal';
import { applyRatesToProject, updateCategoryRateInProject } from '../utils/rateMaster';
import { saveRevision } from '../utils/revisionHistory';
import { getSession, logout } from '../utils/auth';
import { calculateProjectGrandTotals, groupAreasIntoPages, calculateSheetPageTotals, formatNumber } from '../utils/calculations';
import { exportToExcel } from '../utils/exportUtils';
import { createEmptyArea } from '../data/sampleData';
import { getProject, saveProject, duplicateProject, saveExcelFile } from '../utils/storage';
import AppLoader from '../components/AppLoader';

export default function MeasurementSheet() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const session = getSession();
  const [searchParams, setSearchParams] = useSearchParams();

  const [project, setProject]           = useState(null);
  const [projectData, setProjectData]   = useState(null);
  const [editUnlocked, setEditUnlocked] = useState(false);
  const [showVerify, setShowVerify]     = useState(false);
  const [isPrintView, setIsPrintView]   = useState(false);
  const [showQuickMeasure, setShowQuickMeasure] = useState(false);
  const [showRateMaster, setShowRateMaster] = useState(false);
  const [showSummaryPrint, setShowSummaryPrint] = useState(false);
  const [showGstInvoice, setShowGstInvoice]     = useState(false);
  const [showClientApproval, setShowClientApproval] = useState(false);
  const [showEngineerReview, setShowEngineerReview] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [notFound, setNotFound]         = useState(false);
  const [fetchError, setFetchError]     = useState('');
  const [pageLoading, setPageLoading]   = useState(true);
  const [isSaving, setIsSaving]         = useState(false);
  const [lastSavedAt, setLastSavedAt]   = useState(null);
  const [activeSheetPage, setActiveSheetPage] = useState('ALL');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenRef = useRef(null);

  const pagesList = useMemo(() => groupAreasIntoPages(projectData?.areas || []), [projectData?.areas]);
  const isSinglePageView = activeSheetPage !== 'ALL';
  const currentPage = isSinglePageView
    ? (pagesList.find(p => p.pageNumber === Number(activeSheetPage)) || pagesList[0])
    : null;
  const pageIdx = currentPage
    ? pagesList.findIndex(p => p.pageNumber === currentPage.pageNumber)
    : -1;

  const enterFocusFullscreen = (pageNumber) => {
    setActiveSheetPage(pageNumber);
    setIsFullscreen(true);
    // Try native browser fullscreen on the overlay element
    setTimeout(() => {
      if (fullscreenRef.current && fullscreenRef.current.requestFullscreen) {
        fullscreenRef.current.requestFullscreen().catch(() => {});
      }
    }, 50);
  };

  const exitFocusFullscreen = () => {
    setIsFullscreen(false);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Sync Escape key / native fullscreen exit
  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // 3-Page Section Switcher: 'info' (Page 1) | 'measurements' (Page 2) | 'summary' (Page 3) | 'all'
  const tabParam = searchParams.get('tab');
  const [activeSection, setActiveSectionState] = useState(tabParam || 'measurements');

  const setActiveSection = (section) => {
    setActiveSectionState(section);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('tab', section);
      return next;
    }, { replace: true });
  };

  useEffect(() => {
    if (tabParam && tabParam !== activeSection) {
      setActiveSectionState(tabParam);
    }
  }, [tabParam]);

  // Guard: must be logged in & scroll to top
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
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
          : [createEmptyArea()],
        engineerQueries: Array.isArray(rawData.engineerQueries) ? rawData.engineerQueries : [],
        clientApproval: rawData.clientApproval || null
      };

      // ── Local Storage Safety Net: Check for newer local backup ──
      let finalData = safeData;
      try {
        const rawBackup = localStorage.getItem(`mts_local_backup_${projectId}`);
        if (rawBackup) {
          const backup = JSON.parse(rawBackup);
          const serverItemsCount = (safeData.areas || []).reduce((sum, a) => sum + (a.items?.length || 0), 0);
          const backupItemsCount = backup.itemCount || (backup.data?.areas || []).reduce((sum, a) => sum + (a.items?.length || 0), 0);
          const serverTime = proj?.updatedAt ? new Date(proj.updatedAt).getTime() : 0;

          // If local backup has MORE items or was saved more recently by >2s
          if (backup.data && (backupItemsCount > serverItemsCount || (backup.savedAt && backup.savedAt > serverTime + 3000))) {
            console.log(`[Auto-Recovery] Found local backup with ${backupItemsCount} items vs server ${serverItemsCount} items.`);
            // Merge queries so local backup never drops server queries
            const serverQueries = safeData.engineerQueries || [];
            const backupQueries = Array.isArray(backup.data.engineerQueries) ? backup.data.engineerQueries : [];
            const queryMap = new Map();
            [...serverQueries, ...backupQueries].forEach(q => {
              if (q && q.id) queryMap.set(q.id, q);
            });

            finalData = {
              ...backup.data,
              engineerQueries: Array.from(queryMap.values()),
              clientApproval: safeData.clientApproval || backup.data.clientApproval || null
            };
            isDirtyRef.current = true; // schedule immediate sync to cloud
            setTimeout(() => {
              showToast(`RESTORED ${backupItemsCount} ITEMS FROM LOCAL BACKUP`);
            }, 500);
          }
        }
      } catch (err) {
        console.warn('Backup recovery check failed', err);
      }

      setProjectData(finalData);
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
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
      setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }, 50);
    }
  };

  const isOwn = project?.ownerUsername === session?.username;
  const readOnly = !editUnlocked;

  const showToast = (msg) => { setToastMessage(msg); setTimeout(() => setToastMessage(''), 3000); };

  const isDirtyRef = useRef(false);
  const latestDataRef = useRef(null);

  // Undo & Redo History Stacks
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const lastSnapshotTimeRef = useRef(0);

  // ── Synchronous local storage backup (zero-loss guarantee on every keystroke) ──
  useEffect(() => {
    if (!projectId || !projectData || !projectData.areas) return;
    try {
      const payload = {
        projectId,
        savedAt: Date.now(),
        itemCount: (projectData.areas || []).reduce((sum, a) => sum + (a.items?.length || 0), 0),
        data: projectData
      };
      localStorage.setItem(`mts_local_backup_${projectId}`, JSON.stringify(payload));
    } catch (e) {
      console.warn('Local draft storage error', e);
    }
  }, [projectId, projectData]);

  // ── Background Polling for Site Engineer Queries (Live Inbox Sync) ──
  const fetchEngineerQueries = async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/projects/engineer-portal/${projectId}`);
      if (res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.engineerQueries)) {
          setProjectData(prev => {
            if (!prev) return prev;
            const prevQueries = prev.engineerQueries || [];
            const prevStr = JSON.stringify(prevQueries);
            const newStr = JSON.stringify(json.engineerQueries);
            if (prevStr !== newStr) {
              const updated = {
                ...prev,
                engineerQueries: json.engineerQueries
              };
              latestDataRef.current = updated;
              return updated;
            }
            return prev;
          });
        }
      }
    } catch (err) {
      console.warn('Failed to background-refresh engineer queries', err);
    }
  };

  useEffect(() => {
    if (!projectId) return;
    const timer = setInterval(fetchEngineerQueries, 3000);
    return () => clearInterval(timer);
  }, [projectId]);

  // ── Cross-tab synchronization via BroadcastChannel ──
  useEffect(() => {
    if (!projectId) return;
    let channel;
    try {
      channel = new BroadcastChannel(`mts_sheet_sync_${projectId}`);
      channel.onmessage = (event) => {
        if (event.data?.type === 'ENGINEER_QUERY_SUBMITTED' && event.data?.query) {
          const newQ = event.data.query;
          setProjectData(prev => {
            if (!prev) return prev;
            const existing = Array.isArray(prev.engineerQueries) ? prev.engineerQueries : [];
            const filtered = existing.filter(q => q.id !== newQ.id);
            const updated = {
              ...prev,
              engineerQueries: [newQ, ...filtered]
            };
            latestDataRef.current = updated;
            return updated;
          });
          showToast(`NEW SITE QUERY FROM ${newQ.engineerName || 'SITE ENGINEER'}`);
        } else if (event.data?.type === 'CLOUD_SAVED' && event.data?.data) {
          const incomingCount = (event.data.data.areas || []).reduce((sum, a) => sum + (a.items?.length || 0), 0);
          const currentCount = (projectData?.areas || []).reduce((sum, a) => sum + (a.items?.length || 0), 0);
          if (incomingCount >= currentCount && !isDirtyRef.current) {
            setProjectData(event.data.data);
            showToast('SYNCED UPDATES FROM ANOTHER TAB');
          }
        }
      };
    } catch {}

    return () => {
      if (channel) channel.close();
    };
  }, [projectId, projectData]);

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

          // Broadcast to other open tabs of this project
          try {
            const ch = new BroadcastChannel(`mts_sheet_sync_${projectId}`);
            ch.postMessage({ type: 'CLOUD_SAVED', data: latestDataRef.current });
            ch.close();
          } catch {}
        } catch {
          // If save failed, re-mark dirty to retry on next 1-second tick
          isDirtyRef.current = true;
        } finally {
          setIsSaving(false);
        }
      }
    }, 1000);

    // Save on beforeunload synchronously to localStorage + keepalive fetch
    const handleBeforeUnload = () => {
      if (isDirtyRef.current && latestDataRef.current) {
        // 1. Synchronous localStorage write
        try {
          localStorage.setItem(`mts_local_backup_${projectId}`, JSON.stringify({
            projectId,
            savedAt: Date.now(),
            itemCount: (latestDataRef.current.areas || []).reduce((sum, a) => sum + (a.items?.length || 0), 0),
            data: latestDataRef.current
          }));
        } catch {}

        // 2. Keepalive fetch (browser guarantees completion even after page unloads)
        try {
          const token = localStorage.getItem('mts_token') || localStorage.getItem('token');
          fetch(`/api/projects/${projectId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ data: latestDataRef.current }),
            keepalive: true
          }).catch(() => {});
        } catch {}
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

  const setAndSave = (updater, options = {}) => {
    setProjectData(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;

      // Push snapshot to undo stack if not skipped
      if (!options.skipUndo && prev) {
        const now = Date.now();
        // If immediate action or > 500ms since last typing snapshot, record a new step
        if (options.immediate || now - lastSnapshotTimeRef.current > 500) {
          try {
            undoStackRef.current.push(JSON.parse(JSON.stringify(prev)));
            if (undoStackRef.current.length > 40) undoStackRef.current.shift();
            redoStackRef.current = []; // Clear redo stack on new action
            setCanUndo(true);
            setCanRedo(false);
            lastSnapshotTimeRef.current = now;
          } catch { /* ignore snapshot error */ }
        }
      }

      latestDataRef.current = next;
      isDirtyRef.current = true;
      return next;
    });
  };

  const handleUndo = () => {
    if (undoStackRef.current.length === 0) return;
    const previousState = undoStackRef.current.pop();

    if (latestDataRef.current || projectData) {
      redoStackRef.current.push(JSON.parse(JSON.stringify(latestDataRef.current || projectData)));
      if (redoStackRef.current.length > 40) redoStackRef.current.shift();
    }

    latestDataRef.current = previousState;
    isDirtyRef.current = true;
    lastSnapshotTimeRef.current = 0;
    setProjectData(previousState);

    setCanUndo(undoStackRef.current.length > 0);
    setCanRedo(true);
    showToast('ACTION UNDONE (UNDO)');
  };

  const handleRedo = () => {
    if (redoStackRef.current.length === 0) return;
    const nextState = redoStackRef.current.pop();

    if (latestDataRef.current || projectData) {
      undoStackRef.current.push(JSON.parse(JSON.stringify(latestDataRef.current || projectData)));
      if (undoStackRef.current.length > 40) undoStackRef.current.shift();
    }

    latestDataRef.current = nextState;
    isDirtyRef.current = true;
    lastSnapshotTimeRef.current = 0;
    setProjectData(nextState);

    setCanUndo(true);
    setCanRedo(redoStackRef.current.length > 0);
    showToast('ACTION RESTORED (REDO)');
  };

  // Keyboard Shortcuts: Ctrl+Z / Cmd+Z (Undo) and Ctrl+Y / Cmd+Shift+Z / Cmd+Y (Redo)
  useEffect(() => {
    if (readOnly) return;

    const handleKeyDown = (e) => {
      const modKey = e.ctrlKey || e.metaKey;
      if (!modKey) return;

      const key = e.key.toLowerCase();
      if (key === 'z') {
        if (e.shiftKey) {
          // Redo: Ctrl+Shift+Z or Cmd+Shift+Z
          e.preventDefault();
          handleRedo();
        } else {
          // Undo: Ctrl+Z or Cmd+Z
          e.preventDefault();
          handleUndo();
        }
      } else if (key === 'y') {
        // Redo: Ctrl+Y or Cmd+Y
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [readOnly, projectData]);

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

  const handleDeleteWholePage = (pageNumber) => {
    const pagesList = groupAreasIntoPages(projectData?.areas || []);
    const page = pagesList.find(p => p.pageNumber === pageNumber);
    if (!page) return;
    const pageAreaIds = (page.areas || []).map(a => a.id);
    const remainingAreas = (projectData.areas || []).filter(a => !pageAreaIds.includes(a.id));
    if (remainingAreas.length === 0) {
      alert('CANNOT DELETE THE ONLY SHEET PAGE. AT LEAST ONE AREA BLOCK IS REQUIRED.');
      return;
    }
    if (!confirm(`DELETE SHEET PAGE #${pageNumber} (${page.category}) AND ALL ${pageAreaIds.length} AREA(S) ON IT?`)) return;
    setAndSave(prev => ({ ...prev, areas: prev.areas.filter(a => !pageAreaIds.includes(a.id)) }));
    setActiveSheetPage('ALL');
    showToast(`SHEET PAGE #${pageNumber} DELETED`);
  };

  const handleResetSheet = () => {
    if (!confirm('CLEAR ALL MEASUREMENTS IN THIS PROJECT?')) return;
    setProjectData(prev => ({ ...prev, areas: [createEmptyArea()] }));
    showToast('SHEET CLEARED');
  };

  const handleApplyRates = (rateMaster, overwriteExisting) => {
    if (!projectData) return;
    const updated = applyRatesToProject(projectData, rateMaster, overwriteExisting);
    const finalProject = {
      ...updated,
      settings: { ...updated.settings, billingMode: true }
    };
    setAndSave(finalProject);
    showToast('STANDARD RATES APPLIED & BILLING MODE ACTIVATED');
  };

  const handleUpdateCategoryRate = (categoryName, newRate, unit) => {
    if (!projectData) return;
    const updated = updateCategoryRateInProject(projectData, categoryName, newRate, unit);
    const finalProject = {
      ...updated,
      settings: { ...updated.settings, billingMode: true }
    };
    setAndSave(finalProject);
    const symbol = projectData.settings?.currencySymbol || '₹';
    showToast(`RATE FOR "${categoryName.toUpperCase()}" UPDATED TO ${symbol}${newRate}`);
  };

  const handleUpdateRaBilling = (raBillingData) => {
    if (!projectData) return;
    const updated = {
      ...projectData,
      raBilling: raBillingData
    };
    setAndSave(updated);
    showToast('RA BILLING PARAMETERS SAVED TO PROJECT');
  };

  const handleSaveClientApproval = (approvalData) => {
    if (!projectData) return;
    const updated = {
      ...projectData,
      clientApproval: approvalData
    };
    setAndSave(updated);
    saveRevision(projectId || 'default', updated, `Client Sign-Off: ${approvalData.signerName}`, approvalData.signerName);
    showToast(`DIGITAL APPROVAL SAVED FOR ${approvalData.signerName.toUpperCase()}`);
  };

  const handleRevokeClientApproval = () => {
    if (!projectData) return;
    const updated = {
      ...projectData,
      clientApproval: null
    };
    setAndSave(updated);
    showToast('CLIENT APPROVAL REVOKED');
  };

  const handleUpdateSignPortalPin = (pin) => {
    if (!projectData) return;
    const updated = {
      ...projectData,
      signPortalPin: pin || null
    };
    setAndSave(updated);
    showToast(pin ? 'SIGN-OFF PORTAL PIN SAVED' : 'PIN PROTECTION REMOVED');
  };

  const handleCommitEngineerQuery = (queryId) => {
    if (!projectData) return;
    const queries = projectData.engineerQueries || [];
    const targetQuery = queries.find(q => q.id === queryId);
    if (!targetQuery) return;

    // Deep copy areas
    const updatedAreas = JSON.parse(JSON.stringify(projectData.areas || []));

    (targetQuery.changes || []).forEach(change => {
      const area = updatedAreas.find(a => a.id === change.areaId);
      if (!area) return;
      const item = (area.items || []).find(it => it.id === change.itemId);
      if (!item) return;

      if (change.proposed.length !== undefined && change.proposed.length !== '') item.length = change.proposed.length;
      if (change.proposed.height !== undefined && change.proposed.height !== '') item.height = change.proposed.height;
      if (change.proposed.quantity !== undefined && change.proposed.quantity !== '') item.quantity = change.proposed.quantity;
      if (change.proposed.isLess !== undefined) item.isLess = change.proposed.isLess;
      if (change.proposed.remark) item.remark = change.proposed.remark;
      change.status = 'COMMITTED';
    });

    targetQuery.status = 'COMMITTED';

    const updated = {
      ...projectData,
      areas: updatedAreas,
      engineerQueries: queries.map(q => q.id === queryId ? targetQuery : q)
    };

    setAndSave(updated);
    showToast('SITE ENGINEER CORRECTIONS COMMITTED TO MEASUREMENT SHEET');
  };

  const handleRejectEngineerQuery = (queryId) => {
    if (!projectData) return;
    const queries = projectData.engineerQueries || [];
    const updated = {
      ...projectData,
      engineerQueries: queries.map(q => q.id === queryId ? { ...q, status: 'REJECTED' } : q)
    };
    setAndSave(updated);
    showToast('SITE QUERY REJECTED');
  };

  const handleDuplicateProject = async () => {
    const pId = project?._id || projectId;
    if (!pId) return;

    const currentName = project?.name || projectData?.header?.projectName || 'Project';
    const confirmMsg = `Duplicate this entire project?\n\nThis will create a new separate project file "${currentName} (COPY)" and open it.\n\nYour current project will remain saved and intact.\n\nClick OK to duplicate, or Cancel to stay in this file.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      showToast('SAVING CURRENT FILE & DUPLICATING...');
      // 1. Save pending changes to cloud first
      const toSave = latestDataRef.current || projectData;
      if (toSave) {
        await saveProject(pId, toSave);
      }
      // 2. Duplicate on backend
      const duplicated = await duplicateProject(pId);
      showToast('PROJECT DUPLICATED SUCCESSFULLY');
      if (duplicated && duplicated._id) {
        navigate(`/sheet/${duplicated._id}`);
      }
    } catch (err) {
      alert('DUPLICATE FAILED: ' + err.message);
    }
  };

  const handleExportExcel = async () => {
    try {
      showToast('EXPORTING EXCEL (.XLSX)...');
      const exportResult = exportToExcel(projectData, projectData.settings?.billingMode);

      // Auto-save generated workbook to user dashboard in database
      if (exportResult && exportResult.base64) {
        try {
          await saveExcelFile({
            projectId: projectData._id || projectId,
            projectName: projectData.header?.projectName || 'MEASUREMENT SHEET',
            fileName: exportResult.fileName,
            fileBase64: exportResult.base64,
            sheetsData: exportResult.sheetsData,
            fileSize: exportResult.fileSize,
            billingMode: Boolean(projectData.settings?.billingMode),
            metadata: exportResult.metadata,
          });
          showToast('EXCEL EXPORTED & SAVED TO DASHBOARD!');
        } catch (saveErr) {
          console.warn('Auto-save excel to cloud failed:', saveErr);
          showToast('EXPORTED TO EXCEL (.XLSX)');
        }
      } else {
        showToast('EXPORTED TO EXCEL (.XLSX)');
      }
    } catch (err) {
      console.error('Export excel error:', err);
      alert('EXPORT FAILED: ' + err.message);
    }
  };

  // ── Render States ───────────────────────────────────────────
  if (!session) return null;

  if (pageLoading) return (
    <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-light">
      <AppLoader text="LOADING PROJECT..." subtext="FETCHING DATA FROM CLOUD" />
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
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
      <AppLoader text="INITIALIZING PROJECT..." />
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

      {/* Top nav bar merged into Header component */}

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
        onResetSheet={readOnly ? () => {} : handleResetSheet}
        onExportExcel={handleExportExcel}
        onOpenPrintView={() => setIsPrintView(!isPrintView)}
        onAddNewArea={readOnly ? () => {} : () => {
          handleAddNewArea();
          setActiveSection('measurements');
        }}
        onOpenQuickMeasure={readOnly ? () => {} : () => setShowQuickMeasure(true)}
        onSave={handleManualSave}
        onUndo={readOnly ? () => {} : handleUndo}
        onRedo={readOnly ? () => {} : handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        onDuplicateProject={handleDuplicateProject}
        onOpenRateMaster={() => setShowRateMaster(true)}
        onOpenEngineerReview={() => {
          fetchEngineerQueries();
          setShowEngineerReview(true);
        }}
        pendingEngineerQueriesCount={(projectData?.engineerQueries || []).filter(q => q.status === 'PENDING').length}
        onOpenClientApproval={() => setShowClientApproval(true)}
        clientApproval={projectData?.clientApproval}
        isSaving={isSaving}
        lastSavedAt={lastSavedAt}
        isPrintView={isPrintView}
        readOnly={readOnly}
        activeSection={activeSection}
        onChangeSection={setActiveSection}
        areasCount={projectData?.areas?.length || 0}
        grandTotals={grandTotals}
        showMetadataForm={activeSection === 'info' || activeSection === 'all'}
        session={session}
        isOwn={isOwn}
        ownerName={project?.ownerName}
        onLogout={() => { logout(); navigate('/login'); }}
      />
      {isPrintView ? (
        <PrintSheetView
          projectData={projectData}
          projectId={projectId}
          billingMode={projectData.settings?.billingMode}
          currencySymbol={projectData.settings?.currencySymbol}
          onClose={() => setIsPrintView(false)}
        />
      ) : (
        <main className="container-fluid flex-grow-1 px-2 px-md-4 pt-4">

          {/* ══════════════════════════════════════════════════════════ */}
          {/* SECTION / PAGE 1: PROJECT DETAILS & QUICK STATS OVERVIEW */}
          {/* ══════════════════════════════════════════════════════════ */}
          {(activeSection === 'info' || activeSection === 'all') && (
            <div className="section-page-info mb-4">
              <QuickStatsBar
                grandTotals={grandTotals}
                billingMode={projectData.settings?.billingMode}
                currencySymbol={projectData.settings?.currencySymbol}
              />

              {activeSection === 'info' && (
                <div className="container-fluid px-2 px-md-3 my-4">
                  <div className="card border-primary border-opacity-25 shadow-sm rounded-3 p-4 bg-white">
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <span className="badge bg-primary px-2 py-1 text-uppercase fw-bold">PAGE 1 OF 3 COMPLETED</span>
                          <span className="text-success extra-small fw-bold text-uppercase">
                            <i className="bi bi-check-circle-fill me-1"></i>Project Specifications Active
                          </span>
                        </div>
                        <h5 className="fw-bolder text-dark mb-1">
                          {projectData?.header?.projectName || 'Project Details Configured'}
                        </h5>
                        <p className="text-secondary small mb-0">
                          {projectData?.areas?.length || 0} measurement area(s) ready. Head to Page 2 to record room dimensions, deductions, and work lines.
                        </p>
                      </div>
                      <div className="d-flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn btn-primary fw-bold text-uppercase d-flex align-items-center gap-2 px-4 py-2 shadow-sm"
                          onClick={() => setActiveSection('measurements')}
                        >
                          <span>Go to Measurements (Page 2)</span>
                          <i className="bi bi-arrow-right"></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-secondary fw-semibold text-uppercase d-flex align-items-center gap-2 px-3 py-2"
                          onClick={() => setActiveSection('summary')}
                        >
                          <i className="bi bi-pie-chart-fill text-info"></i>
                          <span>View Summary (Page 3)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* SECTION / PAGE 2: LOCATION & WORK MEASUREMENT GROUPS     */}
          {/* ══════════════════════════════════════════════════════════ */}
          {(activeSection === 'measurements' || activeSection === 'all') && (
            <div className="areas-container mb-4">
              {/* Consolidated Enterprise Workspace Card for Section 2 (Measurements) */}
              {activeSection === 'measurements' && (
                <div className="enterprise-workspace-card mb-3">
                  {/* Top Deck: Project Context & Metadata Chips & Actions */}
                  <div className="p-2.5 p-md-3 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
                    
                    {/* Left: Project Context & Metadata Chips */}
                    <div className="d-flex flex-column gap-1 min-w-0">
                      <div className="d-flex align-items-center flex-wrap gap-2">
                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-0.5 extra-small fw-bold text-uppercase rounded-pill">
                          <i className="bi bi-grid-3x3-gap-fill me-1"></i>PAGE 2 &bull; MEASUREMENTS
                        </span>
                        {projectData?.header?.sheetNo && (
                          <span className="enterprise-meta-chip">
                            <i className="bi bi-hash"></i>{projectData.header.sheetNo}
                          </span>
                        )}
                        <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle rounded-pill extra-small fw-bold">
                          {projectData?.areas?.length || 0} Area{projectData?.areas?.length !== 1 ? 's' : ''}
                        </span>
                        {grandTotals?.totalQty > 0 && (
                          <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill extra-small fw-bold">
                            <i className="bi bi-calculator me-1"></i>{formatNumber(grandTotals.totalQty, 2)} Total Qty
                          </span>
                        )}
                      </div>

                      <div className="d-flex align-items-center flex-wrap gap-2 pt-1">
                        <h5 className="enterprise-context-title mb-0 text-uppercase text-truncate" title={projectData?.header?.projectName}>
                          {projectData?.header?.projectName || 'MEASUREMENT SHEET'}
                        </h5>

                        {projectData?.header?.clientName && (
                          <span className="enterprise-meta-chip text-truncate" style={{ maxWidth: '180px' }} title={`Client: ${projectData.header.clientName}`}>
                            <i className="bi bi-person text-secondary"></i>
                            <span className="text-truncate">{projectData.header.clientName}</span>
                          </span>
                        )}

                        {projectData?.header?.location && (
                          <span className="enterprise-meta-chip text-truncate" style={{ maxWidth: '180px' }} title={`Location: ${projectData.header.location}`}>
                            <i className="bi bi-geo-alt text-danger"></i>
                            <span className="text-truncate">{projectData.header.location}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Enterprise Actions */}
                    <div className="d-flex align-items-center flex-wrap gap-2 align-self-stretch align-self-md-auto justify-content-end">
                      {readOnly ? (
                        <button
                          type="button"
                          className="btn btn-sm btn-warning fw-bold text-uppercase extra-small px-3 py-1.5 shadow-xs"
                          onClick={() => setShowVerify(true)}
                          style={{ borderRadius: '6px' }}
                        >
                          <i className="bi bi-unlock-fill me-1"></i>UNLOCK TO EDIT
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary extra-small fw-bold text-uppercase d-flex align-items-center gap-1.5 px-2.5 py-1.5 shadow-2xs"
                            onClick={() => setActiveSection('info')}
                            style={{ borderRadius: '6px', backgroundColor: '#ffffff' }}
                            title="Edit Project Details & Header"
                          >
                            <i className="bi bi-sliders2 text-muted"></i>
                            <span className="d-none d-sm-inline">PROJECT DETAILS</span>
                            <span className="d-sm-none">INFO</span>
                          </button>

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary extra-small fw-bold text-uppercase d-flex align-items-center gap-1.5 px-2.5 py-1.5 shadow-2xs"
                            onClick={() => setActiveSection('summary')}
                            style={{ borderRadius: '6px', backgroundColor: '#ffffff' }}
                            title="View Summary Dashboard & Grand Totals"
                          >
                            <i className="bi bi-pie-chart-fill"></i>
                            <span className="d-none d-sm-inline">SUMMARY</span>
                            <span className="d-sm-none">SUM</span>
                            <i className="bi bi-arrow-right extra-small"></i>
                          </button>

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary extra-small fw-bold text-uppercase d-flex align-items-center gap-1 px-2.5 py-1.5 shadow-2xs"
                            onClick={handleAddNewSheetPage}
                            style={{ borderRadius: '6px', backgroundColor: '#ffffff' }}
                            title="Start a new separate sheet page"
                          >
                            <i className="bi bi-file-earmark-plus"></i>
                            <span>+ NEW PAGE</span>
                          </button>

                          <button
                            type="button"
                            className="btn btn-sm btn-primary extra-small fw-bold text-uppercase d-flex align-items-center gap-1.5 px-3 py-1.5 shadow-xs"
                            onClick={handleAddNewArea}
                            style={{ borderRadius: '6px' }}
                            title="Add a new measurement area group"
                          >
                            <i className="bi bi-plus-lg"></i>
                            <span>ADD AREA</span>
                          </button>
                        </>
                      )}
                    </div>

                  </div>

                  {/* Integrated Bottom Shelf: Sheet Pages Tab Navigation Strip */}
                  {pagesList.length > 0 && (
                    <div className="enterprise-workspace-shelf px-3 py-2 border-top d-flex align-items-center justify-content-between gap-2 overflow-auto" style={{ scrollbarWidth: 'thin' }}>
                      <div className="d-flex align-items-center gap-1.5 flex-nowrap">
                        <span className="extra-small fw-bold text-uppercase text-muted d-flex align-items-center me-1 flex-shrink-0">
                          <i className="bi bi-layers text-primary me-1"></i>PAGES ({pagesList.length}):
                        </span>

                        <button
                          type="button"
                          className={`sheet-page-tab-btn ${activeSheetPage === 'ALL' ? 'active' : ''}`}
                          onClick={() => setActiveSheetPage('ALL')}
                        >
                          <i className="bi bi-collection"></i>
                          <span>ALL ({pagesList.length})</span>
                        </button>

                        {pagesList.map((pg) => {
                          const isSelected = activeSheetPage === pg.pageNumber;
                          return (
                            <button
                              key={pg.pageNumber}
                              type="button"
                              className={`sheet-page-tab-btn ${isSelected ? 'active' : ''}`}
                              onClick={() => setActiveSheetPage(pg.pageNumber)}
                            >
                              <i className="bi bi-file-earmark-text"></i>
                              <span>P{pg.pageNumber}: {pg.category}</span>
                              <span className="sheet-page-tab-count">{pg.areas.length}</span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="d-none d-lg-flex align-items-center text-muted extra-small flex-shrink-0">
                        <i className="bi bi-info-circle me-1"></i>Sequential 1-1-2-3-1 Flow
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Section Header when in 'View All' mode */}
              {activeSection === 'all' && (
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3 pb-2 border-bottom">
                  <h5 className="fw-bolder text-dark mb-0 d-flex align-items-center gap-2 text-uppercase">
                    <i className="bi bi-grid-3x3-gap-fill text-primary"></i>
                    SECTION 2: LOCATION &amp; WORK MEASUREMENTS ({projectData?.areas?.length || 0})
                  </h5>
                  {!readOnly && (
                    <button
                      type="button"
                      className="btn btn-sm btn-primary d-flex align-items-center gap-1 shadow-sm fw-bold text-uppercase px-3"
                      onClick={() => handleAddNewArea()}
                    >
                      <i className="bi bi-plus-lg"></i>
                      <span>ADD AREA</span>
                    </button>
                  )}
                </div>
              )}


                    {/* Mode 1: Single Focused Sheet Page View */}
                    {isSinglePageView && currentPage && (() => {
                      const pageTotals = calculateSheetPageTotals(currentPage);
                      return (
                        <div
                          ref={isFullscreen ? fullscreenRef : null}
                          className={isFullscreen
                            ? 'fullscreen-focus-overlay'
                            : 'single-sheet-page-view mb-4'}
                        >
                          {/* Fullscreen Header Bar */}
                          {isFullscreen && (
                            <div className="fullscreen-focus-header d-flex align-items-center justify-content-between px-4 py-2 bg-dark text-white" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                              <div className="d-flex align-items-center gap-2">
                                <i className="bi bi-fullscreen text-warning fs-5"></i>
                                <span className="fw-bolder text-uppercase text-white fs-6">
                                  FULLSCREEN — SHEET PAGE #{currentPage.pageNumber}: {currentPage.category}
                                </span>
                                <span className="badge bg-primary-subtle text-primary border border-primary-subtle extra-small ms-2">
                                  {currentPage.areas.length} Area(s)
                                </span>
                              </div>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-light fw-bold text-uppercase d-flex align-items-center gap-1 px-3"
                                onClick={exitFocusFullscreen}
                                title="Exit fullscreen mode (Esc)"
                              >
                                <i className="bi bi-fullscreen-exit"></i> Exit Fullscreen
                              </button>
                            </div>
                          )}
                          <div className={isFullscreen ? 'fullscreen-focus-content p-3 p-md-4' : ''}>

                          {/* Focused Sheet Page Card Banner */}
                          <div className="sheet-page-header-enterprise single-view p-2.5 p-sm-3 mb-3">
                            <div className="d-flex flex-column flex-md-row justify-content-between align-items-stretch align-items-md-center gap-2">
                              {/* Row 1 on mobile, Left details on desktop */}
                              <div className="d-flex align-items-center justify-content-between justify-content-md-start flex-grow-1 min-w-0 gap-2">
                                <div className="d-flex align-items-center gap-2 min-w-0">
                                  <span className="badge bg-primary text-white px-2.5 py-1 rounded-pill fw-bold text-uppercase extra-small flex-shrink-0">
                                    <i className="bi bi-file-earmark-text-fill me-1"></i>
                                    PAGE #{currentPage.pageNumber}{pagesList.length > 1 ? ` OF ${pagesList.length}` : ''}
                                  </span>
                                  <h5 className="mb-0 fw-bold text-dark text-uppercase tracking-tight text-truncate" title={currentPage.category}>
                                    {currentPage.category}
                                  </h5>
                                </div>
                                <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle rounded-pill extra-small fw-semibold flex-shrink-0">
                                  {currentPage.areas.length} {currentPage.areas.length === 1 ? 'Area' : 'Areas'}
                                </span>
                              </div>

                              {/* Row 2 on mobile, Right details & actions on desktop */}
                              <div className="d-flex align-items-center justify-content-between justify-content-md-end flex-wrap gap-2 flex-shrink-0 pt-1.5 pt-md-0 border-top border-md-0 border-light-subtle">
                                <div className="d-flex align-items-center gap-1.5 flex-wrap">
                                  <span className="sheet-page-total-pill">
                                    <i className="bi bi-calculator text-primary"></i>
                                    <span>PAGE TOTAL: <strong>{pageTotals.netQty}</strong> {pageTotals.dominantUnit}</span>
                                  </span>
                                  {projectData?.settings?.billingMode && (
                                    <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 extra-small fw-bold">
                                      ₹{formatNumber(pageTotals.netAmount)}
                                    </span>
                                  )}
                                </div>

                                <div className="d-flex align-items-center gap-1.5">
                                  {!readOnly && (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-primary extra-small fw-bold text-uppercase d-flex align-items-center gap-1 px-2.5 py-1 rounded shadow-2xs"
                                      onClick={() => handleAddAreaToPage(currentPage)}
                                      title="Add another area to this sheet page"
                                    >
                                      <i className="bi bi-plus-lg"></i>
                                      <span>+ AREA</span>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-secondary extra-small fw-bold text-uppercase px-2 py-1 rounded d-flex align-items-center gap-1"
                                    onClick={() => enterFocusFullscreen(currentPage.pageNumber)}
                                    title="Open in fullscreen focus mode"
                                  >
                                    <i className="bi bi-arrows-fullscreen"></i>
                                    <span className="d-none d-lg-inline">Focus</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Render only areas on this sheet page */}
                          {currentPage.areas.map((area) => {
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
                                onDeleteWholePage={readOnly ? () => {} : handleDeleteWholePage}
                                onDuplicateArea={readOnly ? () => {} : handleDuplicateArea}
                                onMoveArea={readOnly ? () => {} : handleMoveArea}
                                readOnly={readOnly}
                              />
                            );
                          })}

                          {/* Page Bottom Navigation */}
                          <div className="d-flex justify-content-between align-items-center my-3 p-3 bg-white border rounded shadow-sm">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary fw-bold text-uppercase"
                              disabled={pageIdx <= 0}
                              onClick={() => {
                                if (pageIdx > 0) setActiveSheetPage(pagesList[pageIdx - 1].pageNumber);
                              }}
                            >
                              &larr; Previous Page (#{pagesList[pageIdx - 1]?.pageNumber})
                            </button>

                            <div className="text-center">
                              <span className="badge bg-dark text-white px-3 py-2 text-uppercase fw-bold">
                                Page {currentPage.pageNumber} of {pagesList.length}
                              </span>
                              <div className="text-muted extra-small mt-1">
                                {currentPage.areas.length} Area(s) on this page
                              </div>
                            </div>

                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary fw-bold text-uppercase"
                              disabled={pageIdx >= pagesList.length - 1}
                              onClick={() => {
                                if (pageIdx < pagesList.length - 1) setActiveSheetPage(pagesList[pageIdx + 1].pageNumber);
                              }}
                            >
                              Next Page (#{pagesList[pageIdx + 1]?.pageNumber}) &rarr;
                            </button>
                          </div>
                          {/* Bottom Exit Fullscreen Bar */}
                          {isFullscreen && (
                            <div className="d-flex justify-content-center py-3 bg-dark border-top border-secondary">
                              <button
                                type="button"
                                className="btn btn-outline-light fw-bold text-uppercase d-flex align-items-center gap-2 px-4"
                                onClick={exitFocusFullscreen}
                              >
                                <i className="bi bi-fullscreen-exit"></i> Exit Fullscreen Mode
                              </button>
                            </div>
                          )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Mode 2: View All Pages Sequentially */}
                    {!isSinglePageView && (
                      <div className="all-sheet-pages-view mb-4">
                        {pagesList.map((pg) => {
                          const pageTotals = calculateSheetPageTotals(pg);
                          return (
                            <div key={pg.pageNumber} className="sheet-page-section-block mb-4">
                              {/* Enterprise Page Break Header Banner */}
                              <div className="sheet-page-header-enterprise p-2.5 p-sm-3">
                                <div className="d-flex flex-column flex-md-row justify-content-between align-items-stretch align-items-md-center gap-2">
                                  {/* Row 1 on mobile, Left details on desktop */}
                                  <div className="d-flex align-items-center justify-content-between justify-content-md-start flex-grow-1 min-w-0 gap-2">
                                    <div className="d-flex align-items-center gap-2 min-w-0">
                                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-1 extra-small fw-bold text-uppercase rounded-pill flex-shrink-0">
                                        <i className="bi bi-file-earmark-text me-1"></i>PAGE #{pg.pageNumber}
                                      </span>
                                      <h6 className="mb-0 fw-bold text-dark text-uppercase tracking-tight text-truncate" title={pg.category}>
                                        {pg.category}
                                      </h6>
                                    </div>
                                    <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle rounded-pill extra-small fw-semibold flex-shrink-0">
                                      {pg.areas.length} {pg.areas.length === 1 ? 'Area' : 'Areas'}
                                    </span>
                                  </div>

                                  {/* Row 2 on mobile, Right details & actions on desktop */}
                                  <div className="d-flex align-items-center justify-content-between justify-content-md-end flex-wrap gap-2 flex-shrink-0 pt-1.5 pt-md-0 border-top border-md-0 border-light-subtle">
                                    <div className="d-flex align-items-center gap-1.5 flex-wrap">
                                      <span className="sheet-page-total-pill">
                                        <i className="bi bi-calculator text-primary"></i>
                                        <span>PAGE TOTAL: <strong>{pageTotals.netQty}</strong> {pageTotals.dominantUnit}</span>
                                      </span>
                                      {projectData?.settings?.billingMode && (
                                        <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 extra-small fw-bold">
                                          ₹{formatNumber(pageTotals.netAmount)}
                                        </span>
                                      )}
                                    </div>

                                    <div className="d-flex align-items-center gap-1.5">
                                      {!readOnly && (
                                        <button
                                          type="button"
                                          className="btn btn-sm btn-outline-primary extra-small fw-bold text-uppercase d-flex align-items-center gap-1 px-2.5 py-1 rounded shadow-2xs"
                                          onClick={() => handleAddAreaToPage(pg)}
                                          title="Add area to this sheet page"
                                        >
                                          <i className="bi bi-plus-lg"></i>
                                          <span>+ AREA</span>
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-secondary extra-small fw-bold text-uppercase px-2 py-1 rounded d-flex align-items-center gap-1"
                                        onClick={() => enterFocusFullscreen(pg.pageNumber)}
                                        title="Open this page in fullscreen focus mode"
                                      >
                                        <i className="bi bi-arrows-fullscreen"></i>
                                        <span className="d-none d-lg-inline">Focus</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Areas in this Page */}
                              <div className="sheet-page-body p-2 p-md-3">
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

               {/* Page 2 Bottom Navigation */}
              {activeSection === 'measurements' && (
                <div className="container-fluid px-2 px-md-3 my-4">
                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 p-3 bg-white border rounded-3 shadow-sm">
                    <button
                      type="button"
                      className="btn btn-outline-dark fw-bold text-uppercase extra-small d-flex align-items-center gap-2 px-3 py-2"
                      onClick={() => setActiveSection('info')}
                    >
                      <i className="bi bi-arrow-left"></i>
                      <span>&larr; Page 1: Project Details &amp; Stats</span>
                    </button>

                    <div className="text-muted extra-small fw-bold text-uppercase d-none d-md-block">
                      {projectData?.areas?.length || 0} Areas &bull; {grandTotals?.totalLineItems || 0} Line Items
                    </div>

                    <button
                      type="button"
                      className="btn btn-primary fw-bold text-uppercase extra-small d-flex align-items-center gap-2 px-4 py-2 shadow-sm"
                      onClick={() => setActiveSection('summary')}
                    >
                      <span>Page 3: View Summary Dashboard</span>
                      <i className="bi bi-arrow-right"></i>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* SECTION / PAGE 3: EXECUTIVE SUMMARY DASHBOARD & ROLL-UP  */}
          {/* ══════════════════════════════════════════════════════════ */}
          {(activeSection === 'summary' || activeSection === 'all') && (
            <div className="summary-section-container mb-4">
              {activeSection === 'summary' && (
                <div className="container-fluid px-2 px-md-3 mb-3">
                  <div className="bg-dark text-white rounded-3 p-2 px-3 d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 shadow-sm">
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-success fw-bold text-uppercase px-2 py-1">PAGE 3 OF 3</span>
                      <span className="fw-bold text-uppercase extra-small text-light">EXECUTIVE SUMMARY &amp; ROLL-UP</span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-light extra-small fw-bold text-uppercase py-1 px-2 w-100 w-sm-auto text-nowrap"
                      onClick={() => setActiveSection('measurements')}
                    >
                      <i className="bi bi-rulers me-1"></i> Back to Measurements
                    </button>
                  </div>
                </div>
              )}

              <SummaryDashboard
                grandTotals={grandTotals}
                billingMode={projectData.settings?.billingMode}
                currencySymbol={projectData.settings?.currencySymbol}
                projectData={projectData}
                onUpdateCategoryRate={handleUpdateCategoryRate}
                onOpenRateMaster={() => setShowRateMaster(true)}
                onOpenSummaryPrint={() => setShowSummaryPrint(true)}
                onOpenGstInvoice={() => setShowGstInvoice(true)}
                onUpdateRaBilling={handleUpdateRaBilling}
              />

              {activeSection === 'summary' && (
                <div className="container-fluid px-2 px-md-3 my-4">
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-stretch align-items-md-center gap-2 p-3 bg-white border rounded-3 shadow-sm">
                    <button
                      type="button"
                      className="btn btn-outline-dark fw-bold text-uppercase extra-small d-flex align-items-center justify-content-center gap-2 px-3 py-2"
                      onClick={() => setActiveSection('measurements')}
                    >
                      <i className="bi bi-arrow-left"></i>
                      <span>&larr; Back to Measurements (Page 2)</span>
                    </button>

                    <div className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center gap-2">
                      <button
                        type="button"
                        className="btn btn-dark fw-bold text-uppercase extra-small px-3 py-2 d-flex align-items-center justify-content-center gap-2 shadow-sm"
                        onClick={() => setShowSummaryPrint(true)}
                        title="Print standalone Abstract of Measurement"
                      >
                        <i className="bi bi-printer-fill text-warning"></i>
                        <span>Print Abstract / Summary</span>
                      </button>

                      {projectData.settings?.billingMode && (
                        <button
                          type="button"
                          className="btn btn-outline-primary fw-bold text-uppercase extra-small px-3 py-2 d-flex align-items-center justify-content-center gap-2 shadow-sm"
                          onClick={() => setShowGstInvoice(true)}
                          title="Generate official GST Tax Invoice"
                        >
                          <i className="bi bi-receipt-cutoff text-success"></i>
                          <span>GST Tax Invoice</span>
                        </button>
                      )}

                      <button
                        type="button"
                        className="btn btn-warning text-dark fw-bold text-uppercase extra-small px-3 py-2 d-flex align-items-center justify-content-center gap-2 shadow-sm"
                        onClick={() => setIsPrintView(true)}
                      >
                        <i className="bi bi-file-earmark-pdf-fill"></i>
                        <span>Print Full Sheet</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-success fw-bold text-uppercase extra-small px-3 py-2 d-flex align-items-center justify-content-center gap-2 shadow-sm"
                        onClick={handleExportExcel}
                      >
                        <i className="bi bi-file-earmark-excel-fill"></i>
                        <span>Export Excel</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      )}

      {/* Mobile Sticky Bottom Bar */}
      {!readOnly && !isPrintView && (
        <div className="mobile-sticky-bar d-flex align-items-center justify-content-between gap-2 shadow">
          {/* Quick Page Jump on Mobile */}
          <div className="btn-group btn-group-sm" role="group">
            <button
              type="button"
              className={`btn btn-sm ${activeSection === 'info' ? 'btn-primary' : 'btn-dark'} px-2 py-1 extra-small fw-bold`}
              onClick={() => setActiveSection('info')}
              title="Page 1: Project Details"
            >
              1:INFO
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeSection === 'measurements' ? 'btn-primary' : 'btn-dark'} px-2 py-1 extra-small fw-bold`}
              onClick={() => setActiveSection('measurements')}
              title="Page 2: Measurements"
            >
              2:SHEET
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeSection === 'summary' ? 'btn-primary' : 'btn-dark'} px-2 py-1 extra-small fw-bold`}
              onClick={() => setActiveSection('summary')}
              title="Page 3: Summary"
            >
              3:SUMM
            </button>
          </div>

          <div className="d-flex gap-1">
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
              onClick={() => {
                handleAddNewArea();
                setActiveSection('measurements');
              }}
            >
              <i className="bi bi-plus-circle-fill me-1"></i>AREA
            </button>
            <button
              type="button"
              className="btn btn-sm btn-success fw-bold text-uppercase px-2 py-1 extra-small"
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

      {/* Rate Master Library Modal */}
      <RateMasterModal
        show={showRateMaster}
        onClose={() => setShowRateMaster(false)}
        currencySymbol={projectData?.settings?.currencySymbol || '₹'}
        onApplyRates={handleApplyRates}
      />

      {/* Client Approval & Sign-Off Modal */}
      <ClientApprovalModal
        show={showClientApproval}
        onClose={() => setShowClientApproval(false)}
        approvalData={projectData?.clientApproval}
        projectId={projectId || 'default'}
        projectData={projectData}
        onSaveApproval={handleSaveClientApproval}
        onRevokeApproval={handleRevokeClientApproval}
        onUpdatePin={handleUpdateSignPortalPin}
      />

      {/* Site Engineer Review & Query Modal */}
      <SiteEngineerReviewModal
        show={showEngineerReview}
        onClose={() => setShowEngineerReview(false)}
        projectId={projectId || 'default'}
        projectData={projectData}
        onCommitQuery={handleCommitEngineerQuery}
        onRejectQuery={handleRejectEngineerQuery}
        onRefresh={fetchEngineerQueries}
      />

      {/* Standalone Executive Summary / Abstract Print Modal */}
      <SummaryPrintModal
        show={showSummaryPrint}
        onClose={() => setShowSummaryPrint(false)}
        projectData={projectData}
        grandTotals={grandTotals}
        billingMode={projectData?.settings?.billingMode}
        currencySymbol={projectData?.settings?.currencySymbol || '₹'}
        raBilling={projectData?.raBilling || projectData?.data?.raBilling}
      />

      {/* Official GST Tax Invoice Modal */}
      <GstInvoiceModal
        show={showGstInvoice}
        onClose={() => setShowGstInvoice(false)}
        projectData={projectData}
        grandTotals={grandTotals}
        currencySymbol={projectData?.settings?.currencySymbol || '₹'}
      />

      <footer className="bg-white border-top py-2 text-center text-muted extra-small mt-auto no-print text-uppercase">
        &copy; {new Date().getFullYear()} MS PRO — CONTRACTOR MEASUREMENT &amp; RA BILL SYSTEM &bull; <Link to="/download" className="text-decoration-none text-muted fw-bold">GET MOBILE &amp; DESKTOP APPS</Link>
      </footer>
    </div>
  );
}
