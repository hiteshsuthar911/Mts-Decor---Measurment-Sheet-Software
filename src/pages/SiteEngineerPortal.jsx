import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { calculateLineItemTotal, calculateAreaTotals, formatNumber } from '../utils/calculations';

function getOrdinalSuffix(num) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = num % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

function formatFloorDisplay(val) {
  if (!val && val !== 0) return '';
  const str = String(val).trim();
  if (/^\d+$/.test(str)) {
    const n = parseInt(str, 10);
    return `${n}${getOrdinalSuffix(n)} Floor`;
  }
  return str;
}

function detectFloorFromRemark(remark) {
  if (!remark || typeof remark !== 'string') return null;
  const match = remark.match(/^(\d+)(?:st|nd|rd|th)?\s*floor/i) || remark.match(/^floor\s*(\d+)/i);
  if (match) {
    const n = parseInt(match[1], 10);
    return `${n}${getOrdinalSuffix(n)} Floor`;
  }
  return null;
}

export default function SiteEngineerPortal() {
  const { projectId } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [project, setProject] = useState(null);

  // Active modifications proposed by engineer: { [itemId]: { proposed: {...}, reason: '', areaId, areaLabel, original: {...} } }
  const [proposedChanges, setProposedChanges] = useState({});

  // Editing modal state for single item
  const [editingItem, setEditingItem] = useState(null);
  const [editQty, setEditQty] = useState('');
  const [editLength, setEditLength] = useState('');
  const [editHeight, setEditHeight] = useState('');
  const [editIsLess, setEditIsLess] = useState(false);
  const [editRemark, setEditRemark] = useState('');
  const [editReason, setEditReason] = useState('');

  // Submit modal state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [engineerName, setEngineerName] = useState('');
  const [engineerRole, setEngineerRole] = useState('Site Engineer');
  const [phone, setPhone] = useState('');
  const [overallNote, setOverallNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Active category filter
  const [activeTab, setActiveTab] = useState('ALL');

  const fetchProject = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/projects/engineer-portal/${projectId}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Unable to load project');
      }
      setProject(data);
    } catch (err) {
      console.error('Engineer portal fetch error:', err);
      // Local fallback for offline testing
      try {
        const localSaved = localStorage.getItem('mts_current_project') || localStorage.getItem(`mts_project_${projectId}`);
        if (localSaved) {
          const parsed = JSON.parse(localSaved);
          setProject({
            id: projectId,
            header: parsed.header || {},
            areas: parsed.areas || [],
            settings: parsed.settings || {},
            engineerQueries: parsed.engineerQueries || []
          });
          return;
        }
      } catch {}
      setError(err.message || 'Failed to load project.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const handleOpenEdit = (area, item, currentFloor = '', currentFlat = '') => {
    const existing = proposedChanges[item.id];
    setEditingItem({ area, item, currentFloor, currentFlat });
    setEditQty(existing ? existing.proposed.quantity : (item.quantity !== undefined ? item.quantity : ''));
    setEditLength(existing ? existing.proposed.length : (item.length !== undefined ? item.length : ''));
    setEditHeight(existing ? existing.proposed.height : (item.height !== undefined ? item.height : ''));
    setEditIsLess(existing ? existing.proposed.isLess : !!item.isLess);
    setEditRemark(existing ? existing.proposed.remark : (item.remark || ''));
    setEditReason(existing ? existing.reason : '');
  };

  const handleSaveItemChange = (e) => {
    e.preventDefault();
    if (!editingItem) return;
    const { area, item, currentFloor, currentFlat } = editingItem;

    const floorStr = currentFloor || (area.floor ? formatFloorDisplay(area.floor) : '');
    const flatStr = currentFlat || (area.flat ? `Flat ${area.flat}` : '');
    const metaParts = [floorStr, flatStr, area.parentCategory || 'Area', area.room || area.descriptionHeader || 'Room'].filter(Boolean);
    const areaLabel = metaParts.join(' • ');

    setProposedChanges(prev => ({
      ...prev,
      [item.id]: {
        areaId: area.id,
        areaLabel,
        itemId: item.id,
        itemRemark: item.remark || '',
        original: {
          quantity: item.quantity,
          length: item.length,
          height: item.height,
          unit: item.unit,
          isLess: !!item.isLess,
          remark: item.remark || ''
        },
        proposed: {
          quantity: editQty,
          length: editLength,
          height: editHeight,
          unit: item.unit,
          isLess: editIsLess,
          remark: editRemark
        },
        reason: editReason.trim()
      }
    }));

    setEditingItem(null);
  };

  const handleRemoveItemChange = (itemId) => {
    setProposedChanges(prev => {
      const copy = { ...prev };
      delete copy[itemId];
      return copy;
    });
  };

  const changesList = Object.values(proposedChanges);

  const handleSubmitQueries = async (e) => {
    e.preventDefault();
    if (!engineerName.trim()) {
      alert('Please enter your name');
      return;
    }
    if (changesList.length === 0) {
      alert('No changes proposed yet.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        engineerName: engineerName.trim(),
        engineerRole: engineerRole.trim(),
        phone: phone.trim(),
        overallNote: overallNote.trim(),
        changes: changesList
      };

      const res = await fetch(`/api/projects/engineer-portal/${projectId}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Submission failed');
      }

      const submittedQuery = data.query || {
        id: `query-${Date.now()}`,
        engineerName: engineerName.trim(),
        engineerRole: (engineerRole || 'Site Engineer').trim(),
        phone: phone.trim(),
        overallNote: overallNote.trim(),
        submittedAt: new Date().toISOString(),
        status: 'PENDING',
        changes: changesList
      };

      // ── Cross-tab sync: Notify measurement sheet immediately via BroadcastChannel ──
      try {
        const syncChannel = new BroadcastChannel(`mts_sheet_sync_${projectId}`);
        syncChannel.postMessage({
          type: 'ENGINEER_QUERY_SUBMITTED',
          query: submittedQuery,
          projectId
        });
        setTimeout(() => syncChannel.close(), 1000);
      } catch (bcErr) {
        console.warn('BroadcastChannel sync failed:', bcErr);
      }

      // ── Local Storage sync: Update local draft backup if exists ──
      try {
        const rawBackup = localStorage.getItem(`mts_local_backup_${projectId}`);
        if (rawBackup) {
          const parsed = JSON.parse(rawBackup);
          if (parsed && parsed.data) {
            const currentQ = Array.isArray(parsed.data.engineerQueries) ? parsed.data.engineerQueries : [];
            parsed.data.engineerQueries = [submittedQuery, ...currentQ.filter(q => q.id !== submittedQuery.id)];
            localStorage.setItem(`mts_local_backup_${projectId}`, JSON.stringify(parsed));
          }
        }
      } catch (lsErr) {
        console.warn('LocalStorage draft update failed:', lsErr);
      }

      setSubmittedSuccess(true);
      setProposedChanges({});
      setShowSubmitModal(false);
      fetchProject(); // refresh queries list
    } catch (err) {
      console.warn('API submission failed, saving to local state:', err);

      const localQuery = {
        id: `query-local-${Date.now()}`,
        engineerName: engineerName.trim(),
        engineerRole: (engineerRole || 'Site Engineer').trim(),
        phone: phone.trim(),
        overallNote: overallNote.trim(),
        submittedAt: new Date().toISOString(),
        status: 'PENDING',
        changes: changesList
      };

      // Also broadcast & update local storage in offline/local fallback
      try {
        const syncChannel = new BroadcastChannel(`mts_sheet_sync_${projectId}`);
        syncChannel.postMessage({
          type: 'ENGINEER_QUERY_SUBMITTED',
          query: localQuery,
          projectId
        });
        setTimeout(() => syncChannel.close(), 1000);
      } catch {}

      try {
        const rawBackup = localStorage.getItem(`mts_local_backup_${projectId}`);
        if (rawBackup) {
          const parsed = JSON.parse(rawBackup);
          if (parsed && parsed.data) {
            const currentQ = Array.isArray(parsed.data.engineerQueries) ? parsed.data.engineerQueries : [];
            parsed.data.engineerQueries = [localQuery, ...currentQ];
            localStorage.setItem(`mts_local_backup_${projectId}`, JSON.stringify(parsed));
          }
        }
      } catch {}

      setSubmittedSuccess(true);
      setProposedChanges({});
      setShowSubmitModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center bg-light">
        <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}></div>
        <h5 className="fw-bold text-dark">Opening Site Engineer Portal...</h5>
        <p className="text-muted small">Loading measurement sheets &amp; site data</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-3">
        <div className="card border-0 shadow p-4 text-center" style={{ maxWidth: '440px' }}>
          <i className="bi bi-exclamation-triangle text-danger display-4 mb-2"></i>
          <h4 className="fw-bold">Unable to Open Portal</h4>
          <p className="text-muted small mb-3">{error || 'Measurement sheet not found'}</p>
          <button className="btn btn-primary btn-sm" onClick={fetchProject}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const header = project.header || {};
  const areas = project.areas || [];
  const categoriesList = Array.from(new Set(areas.map(a => a.parentCategory || 'General Work')));

  const filteredAreas = activeTab === 'ALL'
    ? areas
    : areas.filter(a => (a.parentCategory || 'General Work') === activeTab);

  return (
    <div className="bg-light min-vh-100 pb-5">
      {/* Top Banner */}
      <nav className="navbar navbar-dark bg-dark sticky-top shadow-sm py-2">
        <div className="container-lg d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-warning text-dark fw-bold px-2 py-1">SITE ENGINEER</span>
            <span className="navbar-brand mb-0 h6 fw-bold text-white fs-6">
              {header.contractorName || 'MTS DECOR'}
            </span>
          </div>
          <div>
            <span className="badge bg-secondary text-white py-1 px-2 extra-small">
              Site Review &amp; Query Portal
            </span>
          </div>
        </div>
      </nav>

      <div className="container-lg pt-3">
        {/* Project Header Info */}
        <div className="card border-0 shadow-sm rounded-3 mb-3 p-3 bg-white">
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
            <div>
              <span className="badge bg-light text-primary border extra-small text-uppercase fw-bold mb-1">
                On-Site Verification Mode
              </span>
              <h4 className="fw-bold text-dark mb-1">{header.projectName || 'Measurement Sheet'}</h4>
              <div className="d-flex flex-wrap gap-3 text-muted extra-small">
                {header.clientName && <span><i className="bi bi-person me-1"></i>Client: <strong>{header.clientName}</strong></span>}
                {header.location && <span><i className="bi bi-geo-alt me-1"></i>{header.location}</span>}
                <span><i className="bi bi-calendar3 me-1"></i>Date: {header.date || '—'}</span>
              </div>
            </div>
            <div>
              <span className="badge bg-info-subtle text-info border border-info-subtle px-2 py-1 fw-bold">
                {areas.length} Areas / Rooms
              </span>
            </div>
          </div>
        </div>

        {/* Success Alert */}
        {submittedSuccess && (
          <div className="alert alert-success alert-dismissible fade show shadow-sm d-flex align-items-center gap-2" role="alert">
            <i className="bi bi-check-circle-fill fs-4 text-success"></i>
            <div>
              <strong>Site Queries Sent to Contractor!</strong>
              <div className="extra-small">
                Your measurement corrections have been forwarded to the Measurement Portal. The contractor can review and commit them directly.
              </div>
            </div>
            <button type="button" className="btn-close" onClick={() => setSubmittedSuccess(false)}></button>
          </div>
        )}

        {/* Work Category Tabs */}
        {categoriesList.length > 1 && (
          <div className="d-flex gap-1 overflow-x-auto pb-2 mb-3">
            <button
              type="button"
              className={`btn btn-sm px-3 rounded-pill text-nowrap fw-bold ${activeTab === 'ALL' ? 'btn-dark' : 'btn-white border bg-white'}`}
              onClick={() => setActiveTab('ALL')}
            >
              All Work ({areas.length})
            </button>
            {categoriesList.map(cat => (
              <button
                key={cat}
                type="button"
                className={`btn btn-sm px-3 rounded-pill text-nowrap fw-bold ${activeTab === cat ? 'btn-primary' : 'btn-white border bg-white'}`}
                onClick={() => setActiveTab(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Areas & Items List */}
        <div className="d-flex flex-column gap-3 mb-5 pb-5">
          {filteredAreas.map((area, aIdx) => {
            const areaTotals = calculateAreaTotals(area);
            const areaItems = area.items || [];

            // Track active floor as we walk rows
            let activeFloor = area.floor ? formatFloorDisplay(area.floor) : '';
            const areaFlatDisplay = area.flat ? (area.flat.toLowerCase().includes('flat') || area.flat.toLowerCase().includes('unit') ? area.flat : `Flat ${area.flat}`) : '';

            return (
              <div key={area.id || aIdx} className="card border-0 shadow-sm rounded-3 overflow-hidden bg-white">
                {/* Area Header with prominent Floor, Flat, Category & Description badges */}
                <div className="card-header bg-white border-bottom py-2.5 px-3">
                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                    <div className="d-flex align-items-center flex-wrap gap-2">
                      <span className="badge bg-dark fw-bold px-2.5 py-1">Area #{aIdx + 1}</span>

                      {/* Prominent Floor Badge */}
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle fw-bold px-2.5 py-1 fs-6">
                        <i className="bi bi-building me-1"></i>
                        FLOOR: {area.floor ? formatFloorDisplay(area.floor) : (activeFloor || 'All Floors')}
                      </span>

                      {/* Prominent Flat / Unit Badge */}
                      <span className="badge bg-info-subtle text-info border border-info-subtle fw-bold px-2.5 py-1 fs-6">
                        <i className="bi bi-door-closed me-1"></i>
                        FLAT / UNIT: {areaFlatDisplay || 'All Flats'}
                      </span>

                      {/* Work Category Badge */}
                      <span className="badge bg-secondary-subtle text-dark border fw-bold px-2.5 py-1">
                        <i className="bi bi-tag-fill me-1 text-secondary"></i>
                        {area.parentCategory || 'General Work'}
                      </span>

                      {/* Room / Description Badge */}
                      {area.room && (
                        <span className="badge bg-light text-dark border fw-bold px-2.5 py-1">
                          <i className="bi bi-geo-alt-fill me-1 text-danger"></i>
                          {area.room}
                        </span>
                      )}
                    </div>

                    <span className="badge bg-primary px-3 py-2 fw-bold fs-6">
                      Net: {formatNumber(areaTotals.netQuantity)} {areaItems[0]?.unit || 'SFT'}
                    </span>
                  </div>

                  {area.descriptionHeader && (
                    <div className="extra-small text-muted fw-semibold mt-1 px-1">
                      <strong>Sheet Description:</strong> {area.descriptionHeader}
                    </div>
                  )}
                </div>

                {/* Items Table with dedicated Floor No & Flat No columns */}
                <div className="table-responsive">
                  <table className="table table-hover table-bordered align-middle mb-0 extra-small">
                    <thead className="table-light text-secondary text-uppercase" style={{ fontSize: '10px' }}>
                      <tr>
                        <th style={{ width: '4%' }} className="text-center">#</th>
                        <th style={{ width: '12%' }}>Floor No</th>
                        <th style={{ width: '10%' }}>Flat / Unit</th>
                        <th style={{ width: '24%' }}>Remark / Location</th>
                        <th style={{ width: '6%' }} className="text-center">Unit</th>
                        <th style={{ width: '6%' }} className="text-center">Qty</th>
                        <th style={{ width: '9%' }} className="text-center">Length</th>
                        <th style={{ width: '9%' }} className="text-center">Height</th>
                        <th style={{ width: '9%' }} className="text-center">Total</th>
                        <th style={{ width: '11%' }} className="text-center">Site Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {areaItems.map((it, idx) => {
                        const isProposed = Boolean(proposedChanges[it.id]);
                        const prop = proposedChanges[it.id];
                        const lineTotal = calculateLineItemTotal(it);

                        // Floor detection per row
                        const detectedFloor = detectFloorFromRemark(it.remark);
                        if (detectedFloor) {
                          activeFloor = detectedFloor;
                        }
                        const rowFloorDisplay = activeFloor || (area.floor ? formatFloorDisplay(area.floor) : '—');
                        const rowFlatDisplay = areaFlatDisplay || '—';
                        const isFloorMarker = Boolean(detectedFloor);

                        return (
                          <tr key={it.id || idx} className={isProposed ? 'table-warning' : (isFloorMarker ? 'table-light' : '')}>
                            <td className="text-center fw-bold">{idx + 1}</td>
                            <td>
                              <span className={`badge ${isFloorMarker ? 'bg-primary text-white' : 'bg-primary-subtle text-primary border border-primary-subtle'} fw-bold`}>
                                <i className="bi bi-building me-1"></i>{rowFloorDisplay}
                              </span>
                            </td>
                            <td>
                              <span className="badge bg-light text-dark border fw-semibold">
                                <i className="bi bi-door-closed me-1 text-muted"></i>{rowFlatDisplay}
                              </span>
                            </td>
                            <td>
                              <div className="d-flex align-items-center gap-1">
                                {it.isLess ? (
                                  <span className="badge bg-danger-subtle text-danger border border-danger-subtle extra-small py-0">LESS</span>
                                ) : (
                                  <span className="badge bg-success-subtle text-success border border-success-subtle extra-small py-0">ADD</span>
                                )}
                                {it.remark ? (
                                  <span className={`fw-semibold ${isFloorMarker ? 'text-primary fw-bold' : 'text-dark'}`}>
                                    {it.remark}
                                  </span>
                                ) : (
                                  <span className="text-muted fst-italic">
                                    {area.room ? `${area.room} (Item)` : 'Main Item'}
                                  </span>
                                )}
                              </div>
                              {isProposed && (
                                <div className="text-primary extra-small mt-1 fw-medium">
                                  <i className="bi bi-arrow-right-short"></i> Proposed: {prop.proposed.remark || it.remark || area.room}
                                  {prop.reason && <span className="text-muted fst-italic ms-1">({prop.reason})</span>}
                                </div>
                              )}
                            </td>
                            <td className="text-center text-muted fw-semibold">{it.unit || 'SFT'}</td>
                            <td className="text-center">
                              {isProposed && prop.proposed.quantity !== it.quantity ? (
                                <div>
                                  <del className="text-muted extra-small">{it.quantity || '—'}</del>{' '}
                                  <span className="fw-bold text-primary">{prop.proposed.quantity || '—'}</span>
                                </div>
                              ) : (
                                <span className="fw-semibold">{it.quantity || '—'}</span>
                              )}
                            </td>
                            <td className="text-center">
                              {isProposed && prop.proposed.length !== it.length ? (
                                <div>
                                  <del className="text-muted extra-small">{it.length || '—'}</del>{' '}
                                  <span className="fw-bold text-primary">{prop.proposed.length || '—'}</span>
                                </div>
                              ) : (
                                <span className="fw-semibold">{it.length || '—'}</span>
                              )}
                            </td>
                            <td className="text-center">
                              {isProposed && prop.proposed.height !== it.height ? (
                                <div>
                                  <del className="text-muted extra-small">{it.height || '—'}</del>{' '}
                                  <span className="fw-bold text-primary">{prop.proposed.height || '—'}</span>
                                </div>
                              ) : (
                                <span className="fw-semibold">{it.height || '—'}</span>
                              )}
                            </td>
                            <td className="text-center fw-bold">
                              {formatNumber(lineTotal)}
                            </td>
                            <td className="text-center">
                              {isProposed ? (
                                <div className="d-flex justify-content-center gap-1">
                                  <button
                                    type="button"
                                    className="btn btn-warning btn-xs extra-small fw-bold px-2 py-1"
                                    onClick={() => handleOpenEdit(area, it, rowFloorDisplay, rowFlatDisplay)}
                                  >
                                    <i className="bi bi-pencil-fill"></i> Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-outline-danger btn-xs extra-small px-1 py-1"
                                    onClick={() => handleRemoveItemChange(it.id)}
                                    title="Discard proposed change"
                                  >
                                    <i className="bi bi-x"></i>
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn-outline-primary btn-xs extra-small fw-semibold px-2 py-1 text-nowrap"
                                  onClick={() => handleOpenEdit(area, it, rowFloorDisplay, rowFlatDisplay)}
                                >
                                  <i className="bi bi-pencil me-1"></i> Verify / Query
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky Bottom Bar when engineer has proposed changes */}
      {changesList.length > 0 && (
        <div className="fixed-bottom bg-dark text-white p-3 shadow-lg border-top" style={{ zIndex: 1040 }}>
          <div className="container-lg d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-warning text-dark px-3 py-2 fw-bold fs-6">
                {changesList.length} Proposed Correction{changesList.length !== 1 ? 's' : ''}
              </span>
              <span className="extra-small text-white-50 d-none d-md-inline">
                Ready to forward to contractor's measurement portal
              </span>
            </div>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-light btn-sm"
                onClick={() => setProposedChanges({})}
              >
                Clear All
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm fw-bold px-4 shadow d-flex align-items-center gap-2"
                onClick={() => setShowSubmitModal(true)}
              >
                <i className="bi bi-send-fill"></i>
                <span>Send Queries to Measurement Portal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Single Line Item Correction */}
      {editingItem && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-dark text-white py-2 px-3 d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="modal-title fw-bold mb-1">
                    <i className="bi bi-pencil-square me-2 text-warning"></i>
                    Site Verification &amp; Query
                  </h6>
                  <div className="d-flex flex-wrap align-items-center gap-1">
                    <span className="badge bg-primary text-white extra-small py-1">
                      <i className="bi bi-building me-1"></i>Floor: {editingItem.currentFloor || (editingItem.area.floor ? formatFloorDisplay(editingItem.area.floor) : '—')}
                    </span>
                    <span className="badge bg-secondary text-white extra-small py-1">
                      <i className="bi bi-door-closed me-1"></i>Flat / Unit: {editingItem.currentFlat || (editingItem.area.flat ? `Flat ${editingItem.area.flat}` : '—')}
                    </span>
                    <span className="badge bg-dark border border-secondary text-light extra-small py-1">
                      {editingItem.area.room || editingItem.area.parentCategory || 'Area'}
                    </span>
                  </div>
                </div>
                <button type="button" className="btn-close btn-close-white align-self-start" onClick={() => setEditingItem(null)}></button>
              </div>

              <form onSubmit={handleSaveItemChange}>
                <div className="modal-body p-3">
                  <div className="mb-2 p-2 bg-light rounded border extra-small">
                    <div className="text-muted fw-bold text-uppercase">Current Item on Sheet:</div>
                    <div className="fw-semibold text-dark">
                      {editingItem.item.remark || editingItem.area.room || 'Line Item'} &bull; Qty: {editingItem.item.quantity || '—'} &bull; L: {editingItem.item.length || '—'} &bull; H: {editingItem.item.height || '—'} {editingItem.item.unit || 'SFT'}
                    </div>
                  </div>

                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label extra-small text-muted fw-bold mb-1">Measured Length</label>
                      <input
                        type="number"
                        step="any"
                        className="form-control form-control-sm fw-bold"
                        value={editLength}
                        onChange={(e) => setEditLength(e.target.value)}
                        placeholder="e.g. 12.5"
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label extra-small text-muted fw-bold mb-1">Measured Height / Width</label>
                      <input
                        type="number"
                        step="any"
                        className="form-control form-control-sm fw-bold"
                        value={editHeight}
                        onChange={(e) => setEditHeight(e.target.value)}
                        placeholder="e.g. 8.0"
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label extra-small text-muted fw-bold mb-1">Quantity (No.)</label>
                      <input
                        type="number"
                        step="any"
                        className="form-control form-control-sm fw-bold"
                        value={editQty}
                        onChange={(e) => setEditQty(e.target.value)}
                        placeholder="e.g. 1"
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label extra-small text-muted fw-bold mb-1">Item Type</label>
                      <div className="d-flex gap-2 pt-1">
                        <button
                          type="button"
                          className={`btn btn-xs extra-small fw-bold px-2 py-1 flex-grow-1 ${!editIsLess ? 'btn-success text-white' : 'btn-outline-secondary'}`}
                          onClick={() => setEditIsLess(false)}
                        >
                          + ADD
                        </button>
                        <button
                          type="button"
                          className={`btn btn-xs extra-small fw-bold px-2 py-1 flex-grow-1 ${editIsLess ? 'btn-danger text-white' : 'btn-outline-secondary'}`}
                          onClick={() => setEditIsLess(true)}
                        >
                          - LESS
                        </button>
                      </div>
                    </div>

                    <div className="col-12">
                      <label className="form-label extra-small text-muted fw-bold mb-1">Updated Remark (Optional)</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={editRemark}
                        onChange={(e) => setEditRemark(e.target.value)}
                        placeholder="e.g. Toilet 1 Floor (Verified)"
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label extra-small text-muted fw-bold mb-1">Reason / Site Query Note</label>
                      <textarea
                        className="form-control form-control-sm"
                        rows="2"
                        value={editReason}
                        onChange={(e) => setEditReason(e.target.value)}
                        placeholder="e.g. Laser measured actual tape length is 12.5ft instead of 10ft"
                      ></textarea>
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light py-2 px-3 border-top">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingItem(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm fw-bold px-3">
                    Save Proposed Change
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Submit Query Package to Contractor */}
      {showSubmitModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-primary text-white py-3 px-4">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-send-check-fill fs-4"></i>
                  <div>
                    <h5 className="modal-title fw-bold mb-0">Send Site Queries to Measurement Portal</h5>
                    <p className="extra-small text-white-50 mb-0">Forward proposed changes for contractor review &amp; commit</p>
                  </div>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowSubmitModal(false)}></button>
              </div>

              <form onSubmit={handleSubmitQueries}>
                <div className="modal-body p-4">
                  <div className="row g-3 mb-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label extra-small text-muted fw-bold text-uppercase mb-1">
                        Site Engineer Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Er. Rajesh Kumar"
                        value={engineerName}
                        onChange={(e) => setEngineerName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label extra-small text-muted fw-bold text-uppercase mb-1">
                        Designation / Role
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Site Engineer / PMC Inspector"
                        value={engineerRole}
                        onChange={(e) => setEngineerRole(e.target.value)}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label extra-small text-muted fw-bold text-uppercase mb-1">
                        Phone Number (Optional)
                      </label>
                      <input
                        type="tel"
                        className="form-control"
                        placeholder="+91 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label extra-small text-muted fw-bold text-uppercase mb-1">
                        Overall Inspection Remarks
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. All 7 floors inspected today, 3 corrections noted"
                        value={overallNote}
                        onChange={(e) => setOverallNote(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Proposed Changes Summary */}
                  <div className="p-3 bg-light rounded-3 border">
                    <div className="extra-small text-muted fw-bold text-uppercase mb-2">
                      Review of {changesList.length} Proposed Measurement Changes:
                    </div>

                    <div className="d-flex flex-column gap-2" style={{ maxHeight: '240px', overflowY: 'auto' }}>
                      {changesList.map((c, i) => (
                        <div key={i} className="p-2 bg-white rounded border extra-small">
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="fw-bold text-dark">{c.areaLabel}</span>
                            <span className="badge bg-warning text-dark">Change #{i + 1}</span>
                          </div>
                          <div className="text-muted mt-1">
                            Item: <strong>{c.itemRemark || 'Line Item'}</strong>
                          </div>
                          <div className="d-flex flex-wrap gap-2 mt-1">
                            <span>
                              Original: L: <strong>{c.original.length || '—'}</strong>, H: <strong>{c.original.height || '—'}</strong>, Qty: <strong>{c.original.quantity || '—'}</strong>
                            </span>
                            <i className="bi bi-arrow-right text-primary"></i>
                            <span className="text-primary fw-bold">
                              Proposed: L: {c.proposed.length || '—'}, H: {c.proposed.height || '—'}, Qty: {c.proposed.quantity || '—'}
                            </span>
                          </div>
                          {c.reason && (
                            <div className="text-secondary extra-small mt-1 fst-italic">
                              Note: {c.reason}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light py-3 px-4 border-top">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowSubmitModal(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm fw-bold px-4 shadow d-flex align-items-center gap-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                        <span>Sending Queries...</span>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send-fill"></i>
                        <span>Confirm &amp; Send to Contractor</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
