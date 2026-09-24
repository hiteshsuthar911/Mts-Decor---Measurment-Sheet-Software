import { api, BASE_URL } from '../utils/api';
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
import { getProject, saveProject, revokeClientApproval, duplicateProject, saveExcelFile } from '../utils/storage';
import AppLoader from '../components/AppLoader';

export default function MeasurementSheet() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const session = getSession();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (projectId) {
      localStorage.setItem('mts_last_project_id', projectId);
    }
  }, [projectId]);

  const [project, setProject]           = useState(null);
  const [projectData, setProjectData]   = useState(null);
  const [editUnlocked, setEditUnlocked] = useState(false);
  const [showVerify, setShowVerify]     = useState(false);
  const [isPrintView, setIsPrintView]   = useState(false);
  const [printInitialMode, setPrintInitialMode] = useState('full');
  const [showQuickMeasure, setShowQuickMeasure] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      return p.get('field') === '1' || p.get('field') === 'true';
    }
    return false;
  });
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
  const [sheetDropdownOpen, setSheetDropdownOpen] = useState(false);
  const [sheetSearchQuery, setSheetSearchQuery] = useState('');
  const fullscreenRef = useRef(null);
  const sheetDropdownRef = useRef(null);

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
    try {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.set('tab', section);
        return next;
      }, { replace: true });
    } catch {}
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

            // If server has no approval (e.g. revoked), do NOT resurrect old approval from local cache
            const verifiedApproval = safeData.clientApproval || null;
            if (!verifiedApproval && backup.data?.clientApproval) {
              backup.data.clientApproval = null;
              try {
                localStorage.setItem(`mts_local_backup_${projectId}`, JSON.stringify(backup));
              } catch {}
            }

            finalData = {
              ...backup.data,
              engineerQueries: Array.from(queryMap.values()),
              clientApproval: verifiedApproval
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

      // If server does not have client approval, ensure local backup is also cleansed of stale approval
      if (!safeData.clientApproval) {
        try {
          const raw = localStorage.getItem(`mts_local_backup_${projectId}`);
          if (raw) {
            const b = JSON.parse(raw);
            if (b?.data?.clientApproval) {
              b.data.clientApproval = null;
              localStorage.setItem(`mts_local_backup_${projectId}`, JSON.stringify(b));
            }
          }
        } catch {}
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
      const res = await fetch(`${BASE_URL}/projects/engineer-portal/${projectId}`);
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
        } else if (event.data?.type === 'APPROVAL_REVOKED') {
          setProjectData(prev => prev ? ({ ...prev, clientApproval: null }) : prev);
          if (latestDataRef.current) latestDataRef.current.clientApproval = null;
          showToast('APPROVAL STAMP REVOKED');
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
          fetch(`${BASE_URL}/projects/${projectId}`, {
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

  const handleSaveClientApproval = async (approvalData) => {
    if (!projectData) return;
    const updated = {
      ...projectData,
      clientApproval: approvalData
    };
    setProjectData(updated);
    latestDataRef.current = updated;
    isDirtyRef.current = false;
    saveRevision(projectId || 'default', updated, `Client Sign-Off: ${approvalData.signerName}`, approvalData.signerName);
    showToast(`DIGITAL APPROVAL SAVED FOR ${approvalData.signerName.toUpperCase()}`);
    try {
      setIsSaving(true);
      await saveProject(projectId, updated);
      setLastSavedAt(new Date());
    } catch (err) {
      console.warn('Immediate save failed, queueing for autosave:', err);
      isDirtyRef.current = true;
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevokeClientApproval = async () => {
    if (!projectData) return;
    const updated = {
      ...projectData,
      clientApproval: null
    };

    // 1. Immediately update local state and refs
    setProjectData(updated);
    latestDataRef.current = updated;
    isDirtyRef.current = false;

    // 2. Clear from local storage backup immediately so recovery or unload won't revive it
    try {
      const backupKey = `mts_local_backup_${projectId}`;
      const raw = localStorage.getItem(backupKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.data) {
          parsed.data.clientApproval = null;
          localStorage.setItem(backupKey, JSON.stringify(parsed));
        }
      }
    } catch (e) {
      console.warn('Failed to clear clientApproval in local backup', e);
    }

    // 3. Immediately persist revocation to server
    setIsSaving(true);
    try {
      await revokeClientApproval(projectId);
      setLastSavedAt(new Date());
    } catch (err) {
      console.warn('Dedicated revoke endpoint failed, falling back to saveProject:', err);
      try {
        await saveProject(projectId, updated, { revokeApproval: true });
        setLastSavedAt(new Date());
      } catch (saveErr) {
        console.error('Failed to revoke client approval on server:', saveErr);
      }
    } finally {
      setIsSaving(false);
    }

    // 4. Save revision history and show confirmation
    saveRevision(projectId || 'default', updated, 'Client Approval Revoked', session?.name || 'User');
    showToast('CLIENT APPROVAL REVOKED');

    // 5. Broadcast to other tabs
    try {
      const ch = new BroadcastChannel(`mts_sheet_sync_${projectId}`);
      ch.postMessage({ type: 'APPROVAL_REVOKED', projectId });
      ch.close();
    } catch {}
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
        onOpenPrintView={() => {
          if (!isPrintView) {
            setPrintInitialMode(activeSection === 'summary' ? 'summary' : 'full');
          }
          setIsPrintView(!isPrintView);
        }}
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
          initialViewMode={printInitialMode}
        />
      ) : (
        <main className="container-fluid flex-grow-1 px-2 px-md-3 pt-2">

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


            </div>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* SECTION / PAGE 2: LOCATION & WORK MEASUREMENT GROUPS     */}
          {/* ══════════════════════════════════════════════════════════ */}
          {(activeSection === 'measurements' || activeSection === 'all') && (
            <div className="areas-container mb-4">
              {/* ── Premium Sheet Navigator ── */}
              {pagesList.length > 1 && (() => {
                const filteredPages = sheetSearchQuery
                  ? pagesList.filter(pg =>
                      `P${pg.pageNumber} ${pg.category}`.toLowerCase().includes(sheetSearchQuery.toLowerCase())
                    )
                  : pagesList;

                // Current position info
                const currentPageIdx = activeSheetPage === 'ALL'
                  ? -1
                  : pagesList.findIndex(p => p.pageNumber === Number(activeSheetPage));
                const currentPg = currentPageIdx >= 0 ? pagesList[currentPageIdx] : null;
                const posLabel = activeSheetPage === 'ALL'
                  ? 'All Sheets'
                  : currentPg ? `P${currentPg.pageNumber}: ${currentPg.category}` : 'Select Sheet';
                const posCounter = activeSheetPage === 'ALL'
                  ? `ALL · ${pagesList.length}`
                  : `${currentPageIdx + 1} / ${pagesList.length}`;

                // Prev / Next helpers
                const goPrev = () => {
                  if (activeSheetPage === 'ALL') { setActiveSheetPage(pagesList[pagesList.length - 1].pageNumber); return; }
                  if (currentPageIdx <= 0) { setActiveSheetPage('ALL'); return; }
                  setActiveSheetPage(pagesList[currentPageIdx - 1].pageNumber);
                };
                const goNext = () => {
                  if (activeSheetPage === 'ALL') { setActiveSheetPage(pagesList[0].pageNumber); return; }
                  if (currentPageIdx >= pagesList.length - 1) { setActiveSheetPage('ALL'); return; }
                  setActiveSheetPage(pagesList[currentPageIdx + 1].pageNumber);
                };

                // Color palette for page badges (cycles every 8)
                const PAGE_COLORS = [
                  { bg: 'linear-gradient(135deg,#7f56d9,#6941c6)', text: 'white' },
                  { bg: 'linear-gradient(135deg,#0ea5e9,#0284c7)', text: 'white' },
                  { bg: 'linear-gradient(135deg,#10b981,#059669)', text: 'white' },
                  { bg: 'linear-gradient(135deg,#f59e0b,#d97706)', text: 'white' },
                  { bg: 'linear-gradient(135deg,#ef4444,#dc2626)', text: 'white' },
                  { bg: 'linear-gradient(135deg,#ec4899,#db2777)', text: 'white' },
                  { bg: 'linear-gradient(135deg,#14b8a6,#0d9488)', text: 'white' },
                  { bg: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', text: 'white' },
                ];
                const pageColor = (num) => PAGE_COLORS[(num - 1) % PAGE_COLORS.length];

                // Progress %
                const progressPct = activeSheetPage === 'ALL' ? 0
                  : Math.round(((currentPageIdx + 1) / pagesList.length) * 100);

                return (
                  <div
                    className="xls-workbook-tabs mb-2"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      flexWrap: 'nowrap',
                      padding: '5px 8px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #f8f7ff 0%, #f1f5f9 100%)',
                      border: '1.5px solid #ddd6fe',
                      boxShadow: '0 2px 8px rgba(127,86,217,0.08)',
                      position: 'relative',
                    }}
                    ref={sheetDropdownRef}
                  >
                    <style>{`
                      /* ── Trigger ── */
                      .sdd-trigger {
                        height: 34px; padding: 0 10px;
                        border-radius: 9px; border: 1.5px solid #c4b5fd;
                        background: white; color: #0d0620;
                        font-size: 12px; font-weight: 700; letter-spacing: 0.3px;
                        text-transform: uppercase; cursor: pointer;
                        display: flex; align-items: center; gap: 6px;
                        min-width: 0; max-width: 320px; flex: 1 1 auto;
                        box-shadow: 0 1px 3px rgba(127,86,217,0.1);
                        transition: all 0.15s ease;
                        white-space: nowrap; overflow: hidden;
                        position: relative;
                      }
                      .sdd-trigger:hover { border-color: #7f56d9; box-shadow: 0 2px 8px rgba(127,86,217,0.18); }
                      .sdd-trigger.open  { border-color: #7f56d9; box-shadow: 0 0 0 3px rgba(127,86,217,0.16); }
                      .sdd-label { flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-align:left; }
                      .sdd-pos   { font-size:10px; color:#9c84cc; font-weight:600; flex-shrink:0; padding:1px 6px; background:#f3f0ff; border-radius:5px; }
                      .sdd-chevron { flex-shrink:0; font-size:11px; color:#6941c6; transition:transform 0.2s ease; }
                      .sdd-chevron.open { transform: rotate(180deg); }

                      /* Progress strip under trigger */
                      .sdd-progress {
                        position: absolute; bottom: 0; left: 0; height: 2px;
                        background: linear-gradient(90deg, #7f56d9, #c4b5fd);
                        border-radius: 0 0 8px 8px; transition: width 0.3s ease;
                      }

                      /* ── Nav arrows ── */
                      .sdd-nav {
                        width: 30px; height: 34px; border-radius: 9px;
                        border: 1.5px solid #ddd6fe;
                        background: white; color: #6941c6;
                        display: flex; align-items: center; justify-content: center;
                        cursor: pointer; font-size: 11px; flex-shrink: 0;
                        transition: all 0.14s ease;
                        box-shadow: 0 1px 3px rgba(127,86,217,0.08);
                      }
                      .sdd-nav:hover { background: #ede9fe; border-color: #c4b5fd; transform: scale(1.06); }
                      .sdd-nav:active { transform: scale(0.96); }

                      /* ── Label pill ── */
                      .sdd-icon-label {
                        display:flex; align-items:center; gap:5px; flex-shrink:0;
                        font-size:11px; font-weight:800; letter-spacing:0.5px;
                        color:white; text-transform:uppercase;
                        background: linear-gradient(135deg,#7f56d9,#6941c6);
                        padding:0 10px; height:34px; border-radius:9px;
                        box-shadow: 0 2px 6px rgba(105,65,198,0.25);
                      }

                      /* ── Stats badge & New Sheet btn ── */
                      .sdd-stats-badge {
                        background: rgba(127,86,217,0.08); color: #6941c6;
                        border: 1px solid rgba(127,86,217,0.18); border-radius: 7px;
                        padding: 4px 8px; font-weight: 700; font-size: 11px;
                        white-space: nowrap; flex-shrink: 0; display: inline-flex;
                        align-items: center; height: 34px;
                      }
                      .sdd-new-sheet-btn {
                        height: 34px; padding: 0 10px; border-radius: 9px;
                        border: 1.5px solid #c4b5fd; background: white; color: #6941c6;
                        font-size: 12px; font-weight: 700; cursor: pointer;
                        display: flex; align-items: center; gap: 5px;
                        white-space: nowrap; flex-shrink: 0;
                        box-shadow: 0 1px 3px rgba(127,86,217,0.1);
                        transition: all 0.14s ease;
                      }
                      .sdd-new-sheet-btn:hover { background: #ede9fe; border-color: #7f56d9; }

                      /* ── Panel ── */
                      .sdd-panel {
                        position: absolute; top: calc(100% + 8px); left: 38px;
                        width: 380px; max-width: calc(100vw - 32px);
                        background: white; border-radius: 16px;
                        border: 1.5px solid #e0d9ff;
                        box-shadow: 0 20px 60px rgba(0,0,0,0.16), 0 4px 16px rgba(127,86,217,0.12), 0 0 0 1px rgba(127,86,217,0.05);
                        z-index: 9999; overflow: hidden;
                        animation: sddSlide 0.2s cubic-bezier(0.22,1,0.36,1);
                      }
                      @keyframes sddSlide {
                        from { opacity:0; transform: translateY(-8px) scale(0.97); }
                        to   { opacity:1; transform: translateY(0) scale(1); }
                      }

                      /* Panel header */
                      .sdd-panel-header {
                        background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #2d1b69 100%);
                        padding: 12px 14px 10px;
                        position: relative; overflow: hidden;
                      }
                      .sdd-panel-header::before {
                        content:''; position:absolute; width:160px; height:160px; border-radius:50%;
                        background: radial-gradient(circle, rgba(127,86,217,0.2) 0%, transparent 70%);
                        top:-60px; right:-30px; pointer-events:none;
                      }
                      .sdd-panel-header-content { padding-right: 50px; }
                      .sdd-panel-title { font-size:10px; font-weight:800; color:rgba(255,255,255,0.5); text-transform:uppercase; letter-spacing:0.8px; }
                      .sdd-panel-current { font-size:13.5px; font-weight:800; color:white; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
                      .sdd-panel-meta { font-size:9.5px; color:rgba(255,255,255,0.5); margin-top:2px; text-transform:uppercase; letter-spacing:0.5px; }
                      .sdd-panel-pos-badge {
                        position:absolute; top:12px; right:12px;
                        background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.2);
                        border-radius:20px; padding:2px 8px;
                        font-size:10.5px; font-weight:700; color:white;
                        z-index:1;
                      }

                      /* Search */
                      .sdd-search-wrap { padding:8px 10px; border-bottom:1px solid #f3f0ff; background:#faf8ff; position:relative; }
                      .sdd-search {
                        width:100%; height:32px;
                        border:1.5px solid #ddd6fe; border-radius:9px;
                        padding:0 10px 0 30px; font-size:12px; font-weight:600;
                        color:#0d0620; background:white; outline:none; transition:border 0.15s;
                      }
                      .sdd-search:focus { border-color:#7f56d9; box-shadow: 0 0 0 3px rgba(127,86,217,0.1); }
                      .sdd-search-icon { position:absolute; left:20px; top:50%; transform:translateY(-50%); color:#9c84cc; font-size:12px; pointer-events:none; }
                      .sdd-search-clear {
                        position:absolute; right:18px; top:50%; transform:translateY(-50%);
                        background:none; border:none; cursor:pointer; color:#9c84cc; font-size:12px; padding:2px;
                      }

                      /* List */
                      .sdd-list { max-height:220px; overflow-y:auto; padding:4px 0; -webkit-overflow-scrolling:touch; }
                      .sdd-list::-webkit-scrollbar { width:4px; }
                      .sdd-list::-webkit-scrollbar-track { background:transparent; }
                      .sdd-list::-webkit-scrollbar-thumb { background:#ddd6fe; border-radius:4px; }

                      /* Options */
                      .sdd-opt {
                        display:flex; align-items:center; gap:8px; padding:6px 12px;
                        cursor:pointer; transition:background 0.1s; border:none;
                        background:none; width:100%; text-align:left;
                      }
                      .sdd-opt:hover   { background:#f5f0ff; }
                      .sdd-opt.active  { background:#ede9fe; }
                      .sdd-opt.focused { background:#f0ebff; outline:none; }

                      .sdd-opt-badge {
                        flex-shrink:0; width:28px; height:28px; border-radius:7px;
                        font-size:9.5px; font-weight:800; display:flex; align-items:center; justify-content:center;
                        letter-spacing:0.2px; color:white;
                      }
                      .sdd-opt-info { flex:1; min-width:0; }
                      .sdd-opt-name {
                        font-size:11.5px; font-weight:700; color:#0d0620;
                        text-transform:uppercase; letter-spacing:0.3px;
                        white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
                      }
                      .sdd-opt-sub { font-size:9.5px; color:#7a7a9a; text-transform:uppercase; letter-spacing:0.3px; margin-top:1px; }
                      .sdd-opt-count {
                        flex-shrink:0; border-radius:5px; font-size:9.5px; font-weight:700;
                        padding:2px 6px; white-space:nowrap;
                        background:rgba(127,86,217,0.08); color:#6941c6; border:1px solid rgba(127,86,217,0.15);
                      }
                      .sdd-opt-check { flex-shrink:0; color:#7f56d9; font-size:13px; }

                      .sdd-divider { height:1px; background:#f3f0ff; margin:2px 0; }
                      .sdd-empty { text-align:center; padding:18px 0; font-size:10.5px; color:#9c84cc; text-transform:uppercase; letter-spacing:0.5px; }

                      /* Footer */
                      .sdd-panel-footer {
                        padding:7px 12px; border-top:1px solid #f3f0ff; background:#faf8ff;
                        display:flex; align-items:center; justify-content:space-between; gap:6px;
                      }
                      .sdd-panel-footer-tip { font-size:9.5px; color:#9c84cc; text-transform:uppercase; letter-spacing:0.3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
                      .sdd-panel-add-btn {
                        height:26px; padding:0 9px; border-radius:7px; border:none;
                        background:linear-gradient(135deg,#7f56d9,#6941c6); color:white;
                        font-size:10px; font-weight:700; cursor:pointer;
                        display:flex; align-items:center; gap:4px; flex-shrink:0;
                        transition:opacity 0.15s;
                      }
                      .sdd-panel-add-btn:hover { opacity:0.88; }

                      /* ── Responsive Mobile Optimizations ── */
                      @media (max-width: 576px) {
                        .xls-workbook-tabs {
                          padding: 4px 6px !important;
                          gap: 4px !important;
                        }
                        .sdd-icon-label {
                          height: 32px !important;
                          padding: 0 8px !important;
                        }
                        .sdd-nav {
                          width: 28px !important;
                          height: 32px !important;
                        }
                        .sdd-trigger {
                          height: 32px !important;
                          padding: 0 7px !important;
                          font-size: 11px !important;
                          gap: 4px !important;
                        }
                        .sdd-pos {
                          font-size: 9px !important;
                          padding: 1px 4px !important;
                        }
                        .sdd-stats-badge {
                          height: 32px !important;
                          padding: 0 6px !important;
                          font-size: 10px !important;
                        }
                        .sdd-new-sheet-btn {
                          height: 32px !important;
                          padding: 0 8px !important;
                        }
                        .sdd-panel {
                          left: 0 !important;
                          right: 0 !important;
                          top: calc(100% + 5px) !important;
                          width: 100% !important;
                          max-width: 100% !important;
                          border-radius: 13px !important;
                          box-shadow: 0 12px 36px rgba(15,23,42,0.2), 0 2px 8px rgba(127,86,217,0.12) !important;
                        }
                      }
                    `}</style>

                    {/* ── Label pill ── */}
                    <div className="sdd-icon-label" title="Sheets Navigator">
                      <i className="bi bi-layers-fill" style={{ fontSize: '13px' }} />
                      <span className="d-none d-sm-inline">Sheet</span>
                    </div>

                    {/* ── Prev arrow ── */}
                    <button type="button" className="sdd-nav" onClick={goPrev} title="Previous sheet">
                      <i className="bi bi-chevron-left" />
                    </button>

                    {/* ── Trigger button ── */}
                    <button
                      type="button"
                      className={`sdd-trigger${sheetDropdownOpen ? ' open' : ''}`}
                      onClick={() => { setSheetDropdownOpen(o => !o); setSheetSearchQuery(''); }}
                      title={posLabel}
                    >
                      <i
                        className={`bi ${activeSheetPage === 'ALL' ? 'bi-collection-fill' : 'bi-file-earmark-text-fill'}`}
                        style={{ color: activeSheetPage === 'ALL' ? '#7f56d9' : (currentPg ? pageColor(currentPg.pageNumber).bg.match(/#[0-9a-f]{6}/i)?.[0] : '#7f56d9'), fontSize: '12px', flexShrink: 0 }}
                      />
                      <span className="sdd-label">{posLabel}</span>
                      <span className="sdd-pos">{posCounter}</span>
                      <i className={`bi bi-chevron-down sdd-chevron${sheetDropdownOpen ? ' open' : ''}`} />
                      {/* Progress strip */}
                      {activeSheetPage !== 'ALL' && (
                        <div className="sdd-progress" style={{ width: `${progressPct}%` }} />
                      )}
                    </button>

                    {/* ── Next arrow ── */}
                    <button type="button" className="sdd-nav" onClick={goNext} title="Next sheet">
                      <i className="bi bi-chevron-right" />
                    </button>

                    {/* ── Stats badge ── */}
                    <span
                      className="sdd-stats-badge"
                      title={`${projectData?.areas?.length || 0} Areas in Project`}
                    >
                      <span>{projectData?.areas?.length || 0}</span>
                      <span className="d-none d-sm-inline ms-1">Areas</span>
                      {grandTotals?.totalQty > 0 && <span className="d-none d-lg-inline"> · {formatNumber(grandTotals.totalQty, 2)} Qty</span>}
                    </span>

                    {/* ── New Sheet button (outside panel) ── */}
                    {!readOnly && (
                      <button
                        type="button"
                        className="sdd-new-sheet-btn"
                        onClick={handleAddNewSheetPage}
                        title="Add a new sheet page"
                      >
                        <i className="bi bi-plus-lg" style={{ fontSize: '12px' }} />
                        <span className="d-none d-sm-inline">New Sheet</span>
                      </button>
                    )}

                    {/* ── Responsive Dropdown Panel (direct child of xls-workbook-tabs) ── */}
                    {sheetDropdownOpen && (
                      <div className="sdd-panel" onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div className="sdd-panel-header">
                          <div className="sdd-panel-header-content">
                            <div className="sdd-panel-title">Current Sheet</div>
                            <div className="sdd-panel-current">{posLabel}</div>
                            <div className="sdd-panel-meta">
                              {activeSheetPage === 'ALL'
                                ? `${pagesList.length} pages · ${projectData?.areas?.length || 0} areas`
                                : currentPg
                                  ? `${currentPg.areas.length} area${currentPg.areas.length !== 1 ? 's' : ''} · Sheet page ${currentPg.pageNumber} of ${pagesList.length}`
                                  : ''
                              }
                            </div>
                          </div>
                          <div className="sdd-panel-pos-badge">{posCounter}</div>
                        </div>

                        {/* Search */}
                        {pagesList.length > 4 && (
                          <div className="sdd-search-wrap">
                            <i className="bi bi-search sdd-search-icon" />
                            <input
                              autoFocus
                              type="text"
                              className="sdd-search"
                              placeholder="Search sheets by name..."
                              value={sheetSearchQuery}
                              onChange={e => setSheetSearchQuery(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Escape') { setSheetDropdownOpen(false); setSheetSearchQuery(''); }
                                if (e.key === 'ArrowDown') { e.preventDefault(); document.querySelector('.sdd-opt')?.focus(); }
                              }}
                            />
                            {sheetSearchQuery && (
                              <button className="sdd-search-clear" onClick={() => setSheetSearchQuery('')}>
                                <i className="bi bi-x-lg" />
                              </button>
                            )}
                          </div>
                        )}

                        {/* List */}
                        <div className="sdd-list">
                          {/* All Sheets */}
                          {!sheetSearchQuery && (
                            <>
                              <button
                                type="button"
                                className={`sdd-opt${activeSheetPage === 'ALL' ? ' active' : ''}`}
                                onClick={() => { setActiveSheetPage('ALL'); setSheetDropdownOpen(false); setSheetSearchQuery(''); }}
                                onKeyDown={e => { if (e.key === 'ArrowDown') { e.preventDefault(); e.currentTarget.nextElementSibling?.nextElementSibling?.focus(); } }}
                              >
                                <span className="sdd-opt-badge" style={{ background: 'linear-gradient(135deg,#7f56d9,#6941c6)' }}>
                                  <i className="bi bi-collection" />
                                </span>
                                <span className="sdd-opt-info">
                                  <div className="sdd-opt-name">All Sheets</div>
                                  <div className="sdd-opt-sub">View all {pagesList.length} pages together</div>
                                </span>
                                <span className="sdd-opt-count">{pagesList.length} pages</span>
                                {activeSheetPage === 'ALL' && <i className="bi bi-check2 sdd-opt-check" />}
                              </button>
                              <div className="sdd-divider" />
                            </>
                          )}

                          {/* Individual pages */}
                          {filteredPages.length === 0 && (
                            <div className="sdd-empty">
                              <i className="bi bi-search d-block mb-1" style={{ fontSize: '18px' }} />
                              No sheets match "{sheetSearchQuery}"
                            </div>
                          )}
                          {filteredPages.map((pg) => {
                            const col = pageColor(pg.pageNumber);
                            return (
                              <button
                                key={pg.pageNumber}
                                type="button"
                                className={`sdd-opt${activeSheetPage === pg.pageNumber ? ' active' : ''}`}
                                onClick={() => { setActiveSheetPage(pg.pageNumber); setSheetDropdownOpen(false); setSheetSearchQuery(''); }}
                                onKeyDown={e => {
                                  if (e.key === 'ArrowDown') { e.preventDefault(); e.currentTarget.nextElementSibling?.focus(); }
                                  if (e.key === 'ArrowUp')   { e.preventDefault(); e.currentTarget.previousElementSibling?.focus(); }
                                  if (e.key === 'Escape')    { setSheetDropdownOpen(false); }
                                }}
                              >
                                <span className="sdd-opt-badge" style={{ background: col.bg }}>P{pg.pageNumber}</span>
                                <span className="sdd-opt-info">
                                  <div className="sdd-opt-name">{pg.category}</div>
                                  <div className="sdd-opt-sub">Sheet {pg.pageNumber} · {pg.areas.length} area{pg.areas.length !== 1 ? 's' : ''}</div>
                                </span>
                                <span className="sdd-opt-count">{pg.areas.length}</span>
                                {activeSheetPage === pg.pageNumber && <i className="bi bi-check2 sdd-opt-check" />}
                              </button>
                            );
                          })}
                        </div>

                        {/* Footer */}
                        <div className="sdd-panel-footer">
                          <span className="sdd-panel-footer-tip">
                            <i className="bi bi-layers me-1" />{pagesList.length} sheets · {projectData?.areas?.length || 0} areas
                          </span>
                          {!readOnly && (
                            <button
                              type="button"
                              className="sdd-panel-add-btn"
                              onClick={() => { handleAddNewSheetPage(); setSheetDropdownOpen(false); }}
                            >
                              <i className="bi bi-plus-lg" /> New Sheet
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Click-outside overlay */}
                    {sheetDropdownOpen && (
                      <div
                        style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
                        onClick={() => { setSheetDropdownOpen(false); setSheetSearchQuery(''); }}
                      />
                    )}
                  </div>
                );
              })()}






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

                          {/* Clean Focused Page Header Bar */}
                          {pagesList.length > 1 && (
                            <div className="d-flex align-items-center justify-content-between mb-2 px-1 py-1">
                              <div className="d-flex align-items-center gap-2">
                                <span className="badge bg-dark text-white text-uppercase px-2 py-1 extra-small fw-bold">
                                  PAGE #{currentPage.pageNumber} OF {pagesList.length}
                                </span>
                                <span className="fw-bold text-dark text-uppercase small">
                                  {currentPage.category}
                                </span>
                                <span className="badge bg-secondary-subtle text-secondary extra-small">
                                  {currentPage.areas.length} Area{currentPage.areas.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                              <div className="d-flex align-items-center gap-2">
                                <span className="sheet-page-total-pill">
                                  <span>PAGE TOTAL: <strong>{pageTotals.netQty}</strong> {pageTotals.dominantUnit}</span>
                                </span>
                                {!readOnly && (
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-primary extra-small fw-bold text-uppercase py-0.5 px-2"
                                    onClick={() => handleAddAreaToPage(currentPage)}
                                    title="Add another area to this sheet page"
                                  >
                                    + Area
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

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
                          <div className="d-flex justify-content-between align-items-center my-3 p-3 xls-page-nav border rounded shadow-sm">
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
                              {/* Minimal Page Divider (only if project has multiple sheet pages) */}
                              {pagesList.length > 1 && (
                                <div className="d-flex align-items-center justify-content-between mb-2 px-1 py-1">
                                  <div className="d-flex align-items-center gap-2">
                                    <span className="badge bg-dark text-white text-uppercase px-2 py-1 extra-small fw-bold">
                                      PAGE #{pg.pageNumber}
                                    </span>
                                    <span className="fw-bold text-dark text-uppercase small">
                                      {pg.category}
                                    </span>
                                    <span className="badge bg-secondary-subtle text-secondary extra-small">
                                      {pg.areas.length} Area{pg.areas.length !== 1 ? 's' : ''}
                                    </span>
                                  </div>
                                  <div className="d-flex align-items-center gap-2">
                                    <span className="sheet-page-total-pill">
                                      <span>PAGE TOTAL: <strong>{pageTotals.netQty}</strong> {pageTotals.dominantUnit}</span>
                                    </span>
                                    {!readOnly && (
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-primary extra-small fw-bold text-uppercase py-0.5 px-2"
                                        onClick={() => handleAddAreaToPage(pg)}
                                        title="Add area to this page"
                                      >
                                        + Area
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Areas in this Page */}
                              <div className="sheet-page-body">
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
                      </div>
                    )}

               {/* Clean Enterprise Bottom Status Bar */}
              {activeSection === 'measurements' && (
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3 pt-2 border-top text-muted small">
                  <div className="d-flex align-items-center gap-2">
                    {!readOnly && (
                      <>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary px-3 py-1.5 fw-bold extra-small text-uppercase shadow-2xs d-inline-flex align-items-center gap-1.5"
                          onClick={() => handleAddNewArea()}
                          style={{ borderRadius: '6px' }}
                        >
                          <i className="bi bi-plus-lg" />
                          <span>Add Area</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary px-2.5 py-1.5 fw-bold extra-small text-uppercase d-inline-flex align-items-center gap-1.5"
                          onClick={handleAddNewSheetPage}
                          style={{ borderRadius: '6px' }}
                        >
                          <i className="bi bi-file-earmark-plus" />
                          <span>+ New Sheet Page</span>
                        </button>
                      </>
                    )}
                    <span className="ms-2 extra-small text-secondary fw-semibold">
                      {projectData?.areas?.length || 0} Areas &bull; {grandTotals?.totalLineItems || 0} Line Items
                    </span>
                  </div>

                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary px-3 py-1.5 fw-bold extra-small text-uppercase d-inline-flex align-items-center gap-1.5"
                    onClick={() => setActiveSection('summary')}
                    style={{ borderRadius: '6px' }}
                  >
                    <span>View Summary Abstract (Page 3)</span>
                    <i className="bi bi-arrow-right" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* SECTION / PAGE 3: EXECUTIVE SUMMARY DASHBOARD & ROLL-UP  */}
          {/* ══════════════════════════════════════════════════════════ */}
          {(activeSection === 'summary' || activeSection === 'all') && (
            <div className="summary-section-container mb-4">
              <SummaryDashboard
                grandTotals={grandTotals}
                billingMode={projectData.settings?.billingMode}
                currencySymbol={projectData.settings?.currencySymbol}
                projectData={projectData}
                onUpdateCategoryRate={handleUpdateCategoryRate}
                onOpenRateMaster={() => setShowRateMaster(true)}
                onOpenSummaryPrint={() => {
                  setPrintInitialMode('summary');
                  setIsPrintView(true);
                }}
                onOpenGstInvoice={() => setShowGstInvoice(true)}
                onUpdateRaBilling={handleUpdateRaBilling}
              />
            </div>
          )}
        </main>
      )}

      {/* Mobile Sticky Bottom Bar */}
      {/* Mobile Sticky Bottom Bar */}
      {!isPrintView && (
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

          {!readOnly && (
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
          )}
        </div>
      )}

      {/* Quick Measure Field Mode Modal */}
      <QuickMeasureModal
        show={showQuickMeasure}
        onClose={() => setShowQuickMeasure(false)}
        projectData={projectData}
        onUpdateProjectData={setAndSave}
        projectName={projectData?.header?.projectName || project?.name}
        onOpenPrintView={() => { setShowQuickMeasure(false); setIsPrintView(true); }}
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
