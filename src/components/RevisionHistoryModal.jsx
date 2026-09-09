import React, { useState, useEffect } from 'react';
import { getRevisions, saveRevision, deleteRevision, compareRevisions } from '../utils/revisionHistory';
import { formatNumber, formatCurrency } from '../utils/calculations';

export default function RevisionHistoryModal({
  show,
  onClose,
  projectId = 'default',
  currentProjectData,
  currencySymbol = '₹',
  onRestoreRevision
}) {
  const [revisions, setRevisions] = useState([]);
  const [newNote, setNewNote] = useState('');
  
  // Dual Comparison Selectors
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'diff'
  const [revAId, setRevAId] = useState(''); // Base version
  const [revBId, setRevBId] = useState('CURRENT'); // Compared version

  // Diff filters
  const [diffFilter, setDiffFilter] = useState('all'); // 'all' | 'added' | 'modified' | 'deleted' | 'unchanged'
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (show) {
      const list = getRevisions(projectId);
      setRevisions(list);
      setViewMode('list');
      setNewNote('');
      setDiffFilter('all');
      setSearchQuery('');

      if (list.length >= 2) {
        setRevAId(list[list.length - 1].id); // oldest or Rev-1
        setRevBId(list[0].id); // newest or Rev-2
      } else if (list.length === 1) {
        setRevAId(list[0].id);
        setRevBId('CURRENT');
      } else {
        setRevAId('');
        setRevBId('CURRENT');
      }
    }
  }, [show, projectId]);

  if (!show) return null;

  const handleCreateSnapshot = (e) => {
    e.preventDefault();
    const note = newNote.trim() || `Manual Snapshot #${revisions.length + 1}`;
    const saved = saveRevision(projectId, currentProjectData, note);
    if (saved) {
      const updated = getRevisions(projectId);
      setRevisions(updated);
      setNewNote('');
    }
  };

  const handleDelete = (rId) => {
    if (!confirm('Delete this revision snapshot?')) return;
    const updated = deleteRevision(projectId, rId);
    setRevisions(updated);
  };

  const handleRestore = (rev) => {
    if (!confirm(`Restore this sheet to "${rev.note}" from ${new Date(rev.timestamp).toLocaleString()}? Current unsaved edits will be replaced.`)) {
      return;
    }
    // Auto-create backup before restoring
    saveRevision(projectId, currentProjectData, `Auto-backup before restoring "${rev.note}"`);
    onRestoreRevision(rev.data);
    onClose();
  };

  // Resolve projects for Diff
  const getProjectBySelector = (id) => {
    if (id === 'CURRENT') return currentProjectData;
    const match = revisions.find(r => r.id === id);
    return match ? match.data : currentProjectData;
  };

  const getLabelBySelector = (id) => {
    if (id === 'CURRENT') return 'Current Working Sheet';
    const match = revisions.find(r => r.id === id);
    return match ? `${match.note} (${new Date(match.timestamp).toLocaleDateString()})` : id;
  };

  const projectA = getProjectBySelector(revAId);
  const projectB = getProjectBySelector(revBId);
  const diffResult = (projectA && projectB) ? compareRevisions(projectA, projectB) : null;

  const handleSwapComparison = () => {
    const temp = revAId;
    setRevAId(revBId);
    setRevBId(temp);
  };

  // Filter items
  const filterList = (items) => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(it =>
      (it.areaName && it.areaName.toLowerCase().includes(q)) ||
      (it.item?.remark && it.item.remark.toLowerCase().includes(q)) ||
      (it.newItem?.remark && it.newItem.remark.toLowerCase().includes(q))
    );
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content shadow-lg border-0 rounded-3 overflow-hidden">
          {/* Header */}
          <div className="modal-header bg-dark text-white py-3 px-4">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-clock-history fs-4 text-info"></i>
              <div>
                <h5 className="modal-title fw-bold mb-0">Bill Revision History &amp; Visual Diff</h5>
                <small className="text-secondary">Compare Rev-1 with Rev-2 to resolve measurement and rate disputes</small>
              </div>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          {/* Navigation Bar */}
          <div className="bg-light border-bottom px-4 pt-2 d-flex flex-wrap justify-content-between align-items-center gap-2">
            <ul className="nav nav-tabs border-0">
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link fw-bold ${viewMode === 'list' ? 'active text-primary border-bottom-0' : 'text-secondary'}`}
                  onClick={() => setViewMode('list')}
                >
                  <i className="bi bi-list-columns-reverse me-1"></i> 1. Saved Snapshots ({revisions.length})
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link fw-bold ${viewMode === 'diff' ? 'active text-primary border-bottom-0' : 'text-secondary'}`}
                  onClick={() => setViewMode('diff')}
                >
                  <i className="bi bi-file-diff me-1"></i> 2. Compare Revisions (Visual Diff)
                </button>
              </li>
            </ul>

            {viewMode === 'diff' && (
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 mb-2"
                onClick={() => window.print()}
              >
                <i className="bi bi-printer"></i> Print Deviation Report
              </button>
            )}
          </div>

          <div className="modal-body p-4">
            {/* ══════════════════════════════════════════════════
                VIEW 1: SAVED SNAPSHOTS LIST
            ══════════════════════════════════════════════════ */}
            {viewMode === 'list' && (
              <div>
                {/* Create snapshot form */}
                <form onSubmit={handleCreateSnapshot} className="card bg-light border p-3 mb-4 rounded-3">
                  <h6 className="fw-bold mb-2 small text-uppercase text-secondary">
                    <i className="bi bi-camera me-1 text-primary"></i> Create Instant Revision Snapshot
                  </h6>
                  <div className="row g-2">
                    <div className="col-12 col-md-9">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. Rev-1 Initial Site Measurement, Rev-2 Post Client Inspection..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                      />
                    </div>
                    <div className="col-12 col-md-3">
                      <button type="submit" className="btn btn-sm btn-primary w-100 fw-semibold">
                        <i className="bi bi-save me-1"></i> Save Revision
                      </button>
                    </div>
                  </div>
                </form>

                {/* Revisions Table */}
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="fw-bold text-uppercase small text-secondary mb-0">Saved Bill Revisions</h6>
                  {revisions.length >= 2 && (
                    <button
                      type="button"
                      className="btn btn-sm btn-primary fw-bold"
                      onClick={() => setViewMode('diff')}
                    >
                      <i className="bi bi-file-diff me-1"></i> Compare Any 2 Versions
                    </button>
                  )}
                </div>

                <div className="table-responsive border rounded-3" style={{ maxHeight: '380px' }}>
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light text-secondary extra-small text-uppercase sticky-top">
                      <tr>
                        <th style={{ width: '32%' }}>Revision Name / Note</th>
                        <th style={{ width: '22%' }}>Timestamp</th>
                        <th className="text-end" style={{ width: '15%' }}>Net Measured Qty</th>
                        <th className="text-end" style={{ width: '15%' }}>Net Amount ({currencySymbol})</th>
                        <th className="text-center" style={{ width: '16%' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {revisions.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center py-4 text-muted">
                            <p className="mb-2">No revision snapshots saved yet.</p>
                            <small>Take a snapshot before submitting bills or making site measurement alterations.</small>
                          </td>
                        </tr>
                      ) : (
                        revisions.map((rev) => (
                          <tr key={rev.id}>
                            <td>
                              <span className="fw-bold text-dark d-block">{rev.note}</span>
                              <small className="text-muted extra-small">
                                {rev.data?.areas?.length || 0} Areas &bull; By {rev.author || 'User'}
                              </small>
                            </td>
                            <td>
                              <span className="small text-secondary d-block">
                                {new Date(rev.timestamp).toLocaleDateString()}
                              </span>
                              <small className="text-muted extra-small">
                                {new Date(rev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </small>
                            </td>
                            <td className="text-end fw-semibold text-primary">
                              {formatNumber(rev.totals?.netQty || 0)}
                            </td>
                            <td className="text-end fw-semibold text-dark">
                              {formatCurrency(rev.totals?.netAmount || 0, currencySymbol)}
                            </td>
                            <td className="text-center">
                              <div className="btn-group btn-group-sm">
                                <button
                                  type="button"
                                  className="btn btn-outline-primary btn-xs py-1 px-2"
                                  onClick={() => {
                                    setRevAId(rev.id);
                                    setRevBId('CURRENT');
                                    setViewMode('diff');
                                  }}
                                  title="Compare this revision with current sheet"
                                >
                                  <i className="bi bi-file-diff me-1"></i>Diff
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline-warning btn-xs py-1 px-2"
                                  onClick={() => handleRestore(rev)}
                                  title="Restore this revision"
                                >
                                  <i className="bi bi-arrow-counterclockwise"></i>
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline-danger btn-xs py-1 px-2"
                                  onClick={() => handleDelete(rev.id)}
                                  title="Delete snapshot"
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════
                VIEW 2: DUAL REVISION COMPARISON (DIFF ENGINE)
            ══════════════════════════════════════════════════ */}
            {viewMode === 'diff' && (
              <div>
                {/* Comparison Selector Bar */}
                <div className="bg-light p-3 rounded-3 border mb-4 shadow-sm">
                  <div className="row g-2 align-items-center">
                    {/* Base Version (Rev A) */}
                    <div className="col-12 col-md-5">
                      <label className="form-label extra-small fw-bold text-muted text-uppercase mb-1">
                        Base Version (Revision A):
                      </label>
                      <select
                        className="form-select form-select-sm fw-bold border-danger border-opacity-50"
                        value={revAId}
                        onChange={(e) => setRevAId(e.target.value)}
                      >
                        <option value="" disabled>Select Base Revision...</option>
                        {revisions.map((r, i) => (
                          <option key={r.id} value={r.id}>
                            Rev-{revisions.length - i}: {r.note} ({new Date(r.timestamp).toLocaleDateString()})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Swap Button */}
                    <div className="col-12 col-md-2 text-center">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-dark rounded-circle px-2 py-1 shadow-sm mt-md-3"
                        onClick={handleSwapComparison}
                        title="Swap Revision A & Revision B"
                      >
                        <i className="bi bi-arrow-left-right"></i>
                      </button>
                    </div>

                    {/* Compared Version (Rev B) */}
                    <div className="col-12 col-md-5">
                      <label className="form-label extra-small fw-bold text-muted text-uppercase mb-1">
                        Compared Version (Revision B):
                      </label>
                      <select
                        className="form-select form-select-sm fw-bold border-success border-opacity-50"
                        value={revBId}
                        onChange={(e) => setRevBId(e.target.value)}
                      >
                        <option value="CURRENT">Current Working Sheet</option>
                        {revisions.map((r, i) => (
                          <option key={r.id} value={r.id}>
                            Rev-{revisions.length - i}: {r.note} ({new Date(r.timestamp).toLocaleDateString()})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Variance Metrics Bar */}
                {diffResult && (
                  <div className="row g-3 mb-4">
                    <div className="col-6 col-md-3">
                      <div className="card border-0 bg-success-subtle p-3 text-center shadow-sm">
                        <span className="text-success extra-small text-uppercase fw-bold">Items Added</span>
                        <span className="fs-4 fw-bold text-success">+{diffResult.addedItems.length}</span>
                        <small className="text-success extra-small">+{formatNumber(diffResult.totalAddedQty)} Qty</small>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="card border-0 bg-danger-subtle p-3 text-center shadow-sm">
                        <span className="text-danger extra-small text-uppercase fw-bold">Items Deducted / Removed</span>
                        <span className="fs-4 fw-bold text-danger">-{diffResult.deletedItems.length}</span>
                        <small className="text-danger extra-small">-{formatNumber(diffResult.totalDeductedQty)} Qty</small>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="card border-0 bg-warning-subtle p-3 text-center shadow-sm">
                        <span className="text-dark extra-small text-uppercase fw-bold">Items Modified</span>
                        <span className="fs-4 fw-bold text-dark">{diffResult.modifiedItems.length}</span>
                        <small className="text-secondary extra-small">Dimensions/rates altered</small>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className={`card border-0 p-3 text-center shadow-sm ${diffResult.qtyVariance >= 0 ? 'bg-primary-subtle text-primary' : 'bg-danger-subtle text-danger'}`}>
                        <span className="extra-small text-uppercase fw-bold">Net Deviation / Variance</span>
                        <span className="fs-4 fw-bold">
                          {diffResult.qtyVariance >= 0 ? '+' : ''}{formatNumber(diffResult.qtyVariance)}
                        </span>
                        <small className="fw-semibold extra-small">
                          {diffResult.amountVariance >= 0 ? '+' : ''}{formatCurrency(diffResult.amountVariance, currencySymbol)}
                        </small>
                      </div>
                    </div>
                  </div>
                )}

                {/* Filter and Search Bar */}
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                  <div className="btn-group btn-group-sm">
                    <button
                      type="button"
                      className={`btn ${diffFilter === 'all' ? 'btn-dark' : 'btn-outline-secondary'}`}
                      onClick={() => setDiffFilter('all')}
                    >
                      All Changes ({((diffResult?.addedItems.length || 0) + (diffResult?.modifiedItems.length || 0) + (diffResult?.deletedItems.length || 0))})
                    </button>
                    <button
                      type="button"
                      className={`btn ${diffFilter === 'added' ? 'btn-success' : 'btn-outline-success'}`}
                      onClick={() => setDiffFilter('added')}
                    >
                      + Added ({diffResult?.addedItems.length || 0})
                    </button>
                    <button
                      type="button"
                      className={`btn ${diffFilter === 'deleted' ? 'btn-danger' : 'btn-outline-danger'}`}
                      onClick={() => setDiffFilter('deleted')}
                    >
                      - Deducted ({diffResult?.deletedItems.length || 0})
                    </button>
                    <button
                      type="button"
                      className={`btn ${diffFilter === 'modified' ? 'btn-warning text-dark' : 'btn-outline-warning text-dark'}`}
                      onClick={() => setDiffFilter('modified')}
                    >
                      ~ Modified ({diffResult?.modifiedItems.length || 0})
                    </button>
                    <button
                      type="button"
                      className={`btn ${diffFilter === 'unchanged' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                      onClick={() => setDiffFilter('unchanged')}
                    >
                      = Unchanged ({diffResult?.unchangedCount || 0})
                    </button>
                  </div>

                  <div className="input-group input-group-sm" style={{ maxWidth: '240px' }}>
                    <span className="input-group-text bg-white border-end-0"><i className="bi bi-search text-muted"></i></span>
                    <input
                      type="text"
                      className="form-control border-start-0"
                      placeholder="Filter area / remark..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* Detailed Comparison Table */}
                <div className="table-responsive border rounded-3" style={{ maxHeight: '420px' }}>
                  <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: '12px' }}>
                    <thead className="table-light text-secondary extra-small text-uppercase sticky-top">
                      <tr>
                        <th style={{ width: '100px' }}>Status</th>
                        <th style={{ width: '22%' }}>Location / Description</th>
                        <th style={{ width: '22%' }}>Remark</th>
                        <th className="text-end" style={{ width: '15%' }}>Rev A (Base)</th>
                        <th className="text-end" style={{ width: '15%' }}>Rev B (Compared)</th>
                        <th className="text-end" style={{ width: '16%' }}>Variance (Δ)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {diffResult && diffResult.addedItems.length === 0 && diffResult.modifiedItems.length === 0 && diffResult.deletedItems.length === 0 && (
                        <tr>
                          <td colSpan="6" className="text-center py-4 text-muted">
                            <i className="bi bi-check2-circle text-success fs-2 d-block mb-1"></i>
                            <span className="fw-bold">No differences!</span> Both versions have identical measurements.
                          </td>
                        </tr>
                      )}

                      {/* ADDED ITEMS (GREEN) */}
                      {(diffFilter === 'all' || diffFilter === 'added') &&
                        filterList(diffResult?.addedItems || []).map((a, idx) => (
                          <tr key={`add-${idx}`} className="table-success border-success border-opacity-25">
                            <td>
                              <span className="badge bg-success fw-bold">+ ADDED</span>
                            </td>
                            <td className="fw-semibold text-dark">{a.areaName}</td>
                            <td>{a.item.remark || '-'}</td>
                            <td className="text-end text-muted fst-italic">—</td>
                            <td className="text-end fw-bold text-success">
                              {formatNumber(a.lineTotal)} {a.item.unit}
                            </td>
                            <td className="text-end fw-bold text-success">
                              +{formatNumber(a.lineTotal)}
                            </td>
                          </tr>
                        ))}

                      {/* DEDUCTED / DELETED ITEMS (RED) */}
                      {(diffFilter === 'all' || diffFilter === 'deleted') &&
                        filterList(diffResult?.deletedItems || []).map((d, idx) => (
                          <tr key={`del-${idx}`} className="table-danger border-danger border-opacity-25">
                            <td>
                              <span className="badge bg-danger fw-bold">- DEDUCTED</span>
                            </td>
                            <td className="fw-semibold text-dark">{d.areaName}</td>
                            <td>{d.item.remark || '-'}</td>
                            <td className="text-end text-danger fw-bold">
                              {formatNumber(d.lineTotal)} {d.item.unit}
                            </td>
                            <td className="text-end text-muted fst-italic">—</td>
                            <td className="text-end fw-bold text-danger">
                              -{formatNumber(d.lineTotal)}
                            </td>
                          </tr>
                        ))}

                      {/* MODIFIED ITEMS (YELLOW / AMBER) */}
                      {(diffFilter === 'all' || diffFilter === 'modified') &&
                        filterList(diffResult?.modifiedItems || []).map((m, idx) => (
                          <tr key={`mod-${idx}`} className="table-warning border-warning border-opacity-25">
                            <td>
                              <span className="badge bg-warning text-dark fw-bold">~ MODIFIED</span>
                            </td>
                            <td className="fw-semibold text-dark">{m.areaName}</td>
                            <td>
                              <div>{m.newItem.remark || m.oldItem.remark || '-'}</div>
                              <small className="text-muted extra-small">
                                L: {m.oldItem.length || '-'} &rarr; <strong>{m.newItem.length || '-'}</strong> |
                                H: {m.oldItem.height || '-'} &rarr; <strong>{m.newItem.height || '-'}</strong>
                              </small>
                            </td>
                            <td className="text-end text-muted">
                              {formatNumber(m.oldTotal)} {m.oldItem.unit}
                            </td>
                            <td className="text-end fw-bold text-dark">
                              {formatNumber(m.newTotal)} {m.newItem.unit}
                            </td>
                            <td className={`text-end fw-bold ${m.qtyDiff >= 0 ? 'text-success' : 'text-danger'}`}>
                              {m.qtyDiff >= 0 ? '+' : ''}{formatNumber(m.qtyDiff)}
                            </td>
                          </tr>
                        ))}

                      {/* UNCHANGED ITEMS */}
                      {(diffFilter === 'unchanged') &&
                        filterList(diffResult?.unchangedItems || []).map((u, idx) => (
                          <tr key={`un-${idx}`}>
                            <td>
                              <span className="badge bg-secondary extra-small">= SAME</span>
                            </td>
                            <td className="text-secondary">{u.areaName}</td>
                            <td>{u.item.remark || '-'}</td>
                            <td className="text-end text-muted">{formatNumber(u.lineTotal)}</td>
                            <td className="text-end text-muted">{formatNumber(u.lineTotal)}</td>
                            <td className="text-end text-muted">0.00</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer bg-light py-2 px-4">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
