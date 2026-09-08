import React, { useState, useMemo, useEffect } from 'react';
import { formatNumber } from '../utils/calculations';
import { UNIT_OPTIONS } from '../data/categories';

function getOrdinalSuffix(num) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = num % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

export function formatFloorName(num) {
  return `${num}${getOrdinalSuffix(num)} Floor`;
}

export function parseFloorNumber(remark) {
  if (!remark || typeof remark !== 'string') return null;
  const matchOrdinal = remark.match(/^(\d+)(?:st|nd|rd|th)?\s*floor/i);
  if (matchOrdinal) return parseInt(matchOrdinal[1], 10);
  const matchPrefix = remark.match(/^floor\s*(\d+)/i);
  if (matchPrefix) return parseInt(matchPrefix[1], 10);
  return null;
}

export default function MultiFloorReplicateModal({
  show,
  onClose,
  area,
  onApplyReplication
}) {
  if (!show) return null;

  const items = area?.items || [];
  const defaultUnit = items.length > 0 ? (items[0].unit || 'RFT') : 'RFT';

  // Find all floor markers in the existing items
  const floorGroups = useMemo(() => {
    const markers = [];
    items.forEach((it, idx) => {
      const fNum = parseFloorNumber(it.remark);
      if (fNum !== null) {
        markers.push({ floorNum: fNum, index: idx, remark: it.remark });
      }
    });

    const groups = [];
    for (let i = 0; i < markers.length; i++) {
      const startIdx = markers[i].index;
      const endIdx = i + 1 < markers.length ? markers[i + 1].index : items.length;
      groups.push({
        floorNum: markers[i].floorNum,
        label: formatFloorName(markers[i].floorNum),
        startIdx,
        endIdx,
        count: endIdx - startIdx,
        items: items.slice(startIdx, endIdx)
      });
    }

    const detectedSize = groups.length > 0 ? groups[0].count : (items.length > 0 ? Math.min(items.length, 6) : 6);
    const highest = markers.length > 0 ? Math.max(...markers.map(m => m.floorNum)) : 1;

    return {
      markers,
      groups,
      detectedSize: detectedSize || 6,
      highestFloor: highest
    };
  }, [items]);

  // Mode: 'duplicate' (clone measurements) vs 'template' (generate empty floor structure)
  // If user has 6+ items with numbers, default to 'duplicate'. If user only has 1 item, default to 'template'!
  const [activeTab, setActiveTab] = useState(() => {
    return items.length <= 1 ? 'template' : 'duplicate';
  });

  /* ═══════════════════════════════════════════════════════════════
     TAB 1: DUPLICATE EXISTING MEASUREMENTS
     ═══════════════════════════════════════════════════════════════ */
  const [itemsPerFloor, setItemsPerFloor] = useState(floorGroups.detectedSize || 6);
  const [sourceGroupIndex, setSourceGroupIndex] = useState(0);

  // Determine source items
  const sourceItems = useMemo(() => {
    if (floorGroups.groups.length > 0) {
      const grp = floorGroups.groups[sourceGroupIndex] || floorGroups.groups[0];
      return grp.items;
    }
    // Fallback to first N items in area
    return items.slice(0, Math.min(items.length, itemsPerFloor));
  }, [floorGroups.groups, sourceGroupIndex, items, itemsPerFloor]);

  // Target floors for duplication
  const nextFloorStart = floorGroups.highestFloor >= 1 ? floorGroups.highestFloor + 1 : 2;
  const [dupStartFloor, setDupStartFloor] = useState(nextFloorStart);
  const [dupEndFloor, setDupEndFloor] = useState(Math.max(nextFloorStart, 7));
  const [dupSelectedFloors, setDupSelectedFloors] = useState(() => {
    const s = new Set();
    const start = nextFloorStart;
    const end = Math.max(nextFloorStart, 7);
    for (let f = start; f <= end; f++) s.add(f);
    return s;
  });

  const handleDupRangeChange = (start, end) => {
    const s = Math.max(1, Math.min(18, parseInt(start, 10) || 1));
    const e = Math.max(s, Math.min(18, parseInt(end, 10) || s));
    setDupStartFloor(s);
    setDupEndFloor(e);
    const set = new Set();
    for (let f = s; f <= e; f++) set.add(f);
    setDupSelectedFloors(set);
  };

  const toggleDupFloor = (fNum) => {
    const updated = new Set(dupSelectedFloors);
    if (updated.has(fNum)) updated.delete(fNum);
    else updated.add(fNum);
    setDupSelectedFloors(updated);
  };

  /* ═══════════════════════════════════════════════════════════════
     TAB 2: GENERATE EMPTY FLOOR STRUCTURE (FAST ENTRY SKELETON)
     ═══════════════════════════════════════════════════════════════ */
  const [genStartFloor, setGenStartFloor] = useState(1);
  const [genEndFloor, setGenEndFloor] = useState(7);
  const [genRowsPerFloor, setGenRowsPerFloor] = useState(6); // 1 floor row + 5 remarks = 6
  const [genUnit, setGenUnit] = useState(defaultUnit);
  const [genDefaultQty, setGenDefaultQty] = useState('');
  const [genReplaceExisting, setGenReplaceExisting] = useState(items.length <= 1);

  const handleGenRangeChange = (start, end) => {
    const s = Math.max(1, Math.min(18, parseInt(start, 10) || 1));
    const e = Math.max(s, Math.min(18, parseInt(end, 10) || s));
    setGenStartFloor(s);
    setGenEndFloor(e);
  };

  // Execution: Tab 1 Duplicate
  const handleExecuteDuplicate = () => {
    if (sourceItems.length === 0) {
      alert('Please enter at least 1 measurement in the sheet first, or switch to "Create Empty Floor Rows" tab!');
      return;
    }
    const targetFloors = Array.from(dupSelectedFloors).sort((a, b) => a - b);
    if (targetFloors.length === 0) {
      alert('Please select at least 1 target floor.');
      return;
    }

    const newItems = [];
    targetFloors.forEach((fNum) => {
      const fName = formatFloorName(fNum);
      sourceItems.forEach((orig, idx) => {
        newItems.push({
          ...orig,
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          remark: idx === 0 ? fName : (parseFloorNumber(orig.remark) ? '' : (orig.remark || '')),
          quantity: orig.quantity !== undefined ? orig.quantity : '',
          length: orig.length !== undefined ? orig.length : '',
          height: orig.height !== undefined ? orig.height : '',
          unit: orig.unit || defaultUnit,
          rate: orig.rate !== undefined ? orig.rate : '',
          isLess: !!orig.isLess
        });
      });
    });

    onApplyReplication(newItems, false);
    onClose();
  };

  // Execution: Tab 2 Template Generation
  const handleExecuteGenerate = () => {
    const start = Math.min(genStartFloor, genEndFloor);
    const end = Math.max(genStartFloor, genEndFloor);
    const countPerRow = Math.max(1, parseInt(genRowsPerFloor, 10) || 6);

    const newItems = [];
    for (let f = start; f <= end; f++) {
      const fName = formatFloorName(f);
      for (let r = 0; r < countPerRow; r++) {
        newItems.push({
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          remark: r === 0 ? fName : '',
          quantity: genDefaultQty !== '' ? genDefaultQty : '',
          length: '',
          height: '',
          unit: genUnit,
          rate: '',
          isLess: false
        });
      }
    }

    onApplyReplication(newItems, genReplaceExisting);
    onClose();
  };

  const totalGenFloors = Math.max(0, genEndFloor - genStartFloor + 1);
  const totalGenItems = totalGenFloors * Math.max(1, genRowsPerFloor);
  const totalDupItems = dupSelectedFloors.size * sourceItems.length;

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)', zIndex: 1060 }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content shadow-lg border-0 rounded-4 overflow-hidden">
          {/* Header */}
          <div className="modal-header bg-dark text-white py-3 px-4">
            <div className="d-flex align-items-center gap-2">
              <div
                className="d-flex align-items-center justify-content-center rounded-3 bg-primary text-white"
                style={{ width: '38px', height: '38px' }}
              >
                <i className="bi bi-layers-fill fs-5"></i>
              </div>
              <div>
                <h5 className="modal-title fw-bold mb-0">Multi-Floor Fast Entry</h5>
                <p className="extra-small text-white-50 mb-0">
                  Fast floor entry: 1 Floor header + 5 remark rows (or duplicate repeating measurements)
                </p>
              </div>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>

          {/* Nav Tabs */}
          <div className="bg-light border-bottom px-4 pt-2">
            <ul className="nav nav-tabs border-bottom-0">
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link fw-bold px-3 py-2 ${
                    activeTab === 'template' ? 'active text-primary bg-white' : 'text-secondary'
                  }`}
                  onClick={() => setActiveTab('template')}
                >
                  <i className="bi bi-grid-3x3-gap-fill me-1"></i>
                  1. Create Floor Rows (1 to 7 Structure)
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link fw-bold px-3 py-2 ${
                    activeTab === 'duplicate' ? 'active text-primary bg-white' : 'text-secondary'
                  }`}
                  onClick={() => setActiveTab('duplicate')}
                >
                  <i className="bi bi-copy me-1"></i>
                  2. Duplicate Measurements (Copy Numbers to Floors)
                </button>
              </li>
            </ul>
          </div>

          {/* Modal Body */}
          <div className="modal-body p-4">
            {/* ═══════════════════════════════════════════════════════
                TAB 1: CREATE EMPTY FLOOR ROWS (SKELETON)
               ═══════════════════════════════════════════════════════ */}
            {activeTab === 'template' && (
              <div>
                <div className="alert alert-info py-2 px-3 small rounded-3 mb-3 d-flex align-items-center gap-2">
                  <i className="bi bi-info-circle-fill fs-5 flex-shrink-0"></i>
                  <div>
                    <strong>Create full structure in 1-click:</strong> Generates 1 floor row (e.g.{' '}
                    <code>1st Floor</code>) + 5 measurement rows per floor up to 7th floor. You can then immediately
                    type lengths in order!
                  </div>
                </div>

                {/* Floor Range Selection */}
                <div className="p-3 bg-light rounded-3 border mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label extra-small text-muted fw-bold text-uppercase mb-0">
                      Floor Range to Generate
                    </label>
                    {/* Quick Presets */}
                    <div className="d-flex gap-1">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-xs extra-small px-2 py-1 rounded"
                        onClick={() => handleGenRangeChange(1, 7)}
                      >
                        1st to 7th
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-xs extra-small px-2 py-1 rounded"
                        onClick={() => handleGenRangeChange(1, 12)}
                      >
                        1st to 12th
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-xs extra-small px-2 py-1 rounded"
                        onClick={() => handleGenRangeChange(1, 18)}
                      >
                        1st to 18th
                      </button>
                    </div>
                  </div>

                  <div className="row g-2 align-items-center">
                    <div className="col-6 col-sm-4">
                      <label className="form-label extra-small text-muted fw-semibold mb-1">Start Floor</label>
                      <div className="input-group input-group-sm">
                        <input
                          type="number"
                          min="1"
                          max="18"
                          className="form-control fw-bold"
                          value={genStartFloor}
                          onChange={(e) => handleGenRangeChange(e.target.value, genEndFloor)}
                        />
                        <span className="input-group-text">{getOrdinalSuffix(genStartFloor)}</span>
                      </div>
                    </div>

                    <div className="col-6 col-sm-4">
                      <label className="form-label extra-small text-muted fw-semibold mb-1">End Floor</label>
                      <div className="input-group input-group-sm">
                        <input
                          type="number"
                          min={genStartFloor}
                          max="18"
                          className="form-control fw-bold"
                          value={genEndFloor}
                          onChange={(e) => handleGenRangeChange(genStartFloor, e.target.value)}
                        />
                        <span className="input-group-text">{getOrdinalSuffix(genEndFloor)}</span>
                      </div>
                    </div>

                    <div className="col-12 col-sm-4">
                      <label className="form-label extra-small text-muted fw-semibold mb-1">
                        Total Floors
                      </label>
                      <div className="form-control form-control-sm bg-white fw-bold text-primary">
                        {totalGenFloors} Floors ({genStartFloor}{getOrdinalSuffix(genStartFloor)} to {genEndFloor}{getOrdinalSuffix(genEndFloor)})
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floor Structure Details */}
                <div className="p-3 bg-light rounded-3 border mb-3">
                  <div className="row g-3">
                    <div className="col-12 col-sm-4">
                      <label className="form-label extra-small text-muted fw-bold text-uppercase mb-1">
                        Rows per Floor
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        className="form-control form-control-sm fw-bold"
                        value={genRowsPerFloor}
                        onChange={(e) => setGenRowsPerFloor(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      />
                      <span className="extra-small text-muted">
                        1 Floor row + {Math.max(0, genRowsPerFloor - 1)} remark rows
                      </span>
                    </div>

                    <div className="col-6 col-sm-4">
                      <label className="form-label extra-small text-muted fw-bold text-uppercase mb-1">
                        Default Unit
                      </label>
                      <select
                        className="form-select form-select-sm fw-bold"
                        value={genUnit}
                        onChange={(e) => setGenUnit(e.target.value)}
                      >
                        {UNIT_OPTIONS.map((u) => (
                          <option key={u.value} value={u.value}>
                            {u.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-6 col-sm-4">
                      <label className="form-label extra-small text-muted fw-bold text-uppercase mb-1">
                        Default Qty (Optional)
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder="e.g. 1 or 2 (or leave blank)"
                        className="form-control form-control-sm"
                        value={genDefaultQty}
                        onChange={(e) => setGenDefaultQty(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Replace vs Append option */}
                  <div className="form-check mt-3 pt-2 border-top">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="genReplaceCheck"
                      checked={genReplaceExisting}
                      onChange={(e) => setGenReplaceExisting(e.target.checked)}
                    />
                    <label className="form-check-label extra-small fw-semibold text-dark" htmlFor="genReplaceCheck">
                      Replace existing items in this area (recommended if you have 1 empty row)
                    </label>
                  </div>
                </div>

                {/* Summary Pill */}
                <div className="alert alert-primary py-2 px-3 mb-0 rounded-3 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-magic fs-4 text-primary"></i>
                    <div>
                      <strong className="d-block">
                        Ready to generate {totalGenItems} rows for {totalGenFloors} Floors
                      </strong>
                      <span className="extra-small text-muted">
                        {totalGenFloors} floors &times; {genRowsPerFloor} rows each = {totalGenItems} total rows
                      </span>
                    </div>
                  </div>
                  <span className="badge bg-primary px-3 py-2 fs-6 fw-bold">
                    {totalGenItems} Rows
                  </span>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════
                TAB 2: DUPLICATE MEASUREMENTS (COPY NUMBERS TO FLOORS)
               ═══════════════════════════════════════════════════════ */}
            {activeTab === 'duplicate' && (
              <div>
                <div className="alert alert-success py-2 px-3 small rounded-3 mb-3 d-flex align-items-center gap-2">
                  <i className="bi bi-copy fs-5 flex-shrink-0"></i>
                  <div>
                    <strong>Replicate completed measurements:</strong> Copies your 6 measurements (with exact lengths &
                    quantities) and sets the top row to <code>2nd Floor</code>, <code>3rd Floor</code>, etc.!
                  </div>
                </div>

                {/* Source Selection */}
                <div className="p-3 bg-light rounded-3 border mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label extra-small text-muted fw-bold text-uppercase mb-0">
                      Source Floor Measurements
                    </label>
                    <span className="badge bg-success-subtle text-success border border-success-subtle extra-small fw-bold">
                      {sourceItems.length} measurements to copy
                    </span>
                  </div>

                  {floorGroups.groups.length > 0 ? (
                    <select
                      className="form-select form-select-sm fw-bold mb-2"
                      value={sourceGroupIndex}
                      onChange={(e) => setSourceGroupIndex(parseInt(e.target.value, 10))}
                    >
                      {floorGroups.groups.map((grp, gIdx) => (
                        <option key={gIdx} value={gIdx}>
                          {grp.label} ({grp.count} measurements)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="row g-2 mb-2 align-items-center">
                      <div className="col-6">
                        <span className="extra-small text-muted fw-semibold">Using first {sourceItems.length} rows in area</span>
                      </div>
                      <div className="col-6 text-end">
                        <label className="extra-small text-muted me-1">Rows to copy:</label>
                        <input
                          type="number"
                          min="1"
                          max={items.length || 1}
                          className="form-control form-control-sm d-inline-block fw-bold text-center"
                          style={{ width: '65px' }}
                          value={itemsPerFloor}
                          onChange={(e) => setItemsPerFloor(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        />
                      </div>
                    </div>
                  )}

                  {/* Preview of items that will be copied */}
                  {sourceItems.length > 0 ? (
                    <div className="p-2 bg-white rounded border">
                      <div className="d-flex flex-wrap gap-1">
                        {sourceItems.map((it, idx) => (
                          <span
                            key={idx}
                            className="badge bg-light text-dark border extra-small fw-medium"
                            style={{ fontSize: '10.5px' }}
                          >
                            #{idx + 1}: Qty {it.quantity || '—'} &bull; L: {it.length || '—'} {it.unit || 'RFT'}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-danger small p-2 bg-white rounded border">
                      No measurements found yet. Please type your 1st floor rows first or switch to "Create Floor Rows" tab!
                    </div>
                  )}
                </div>

                {/* Target Floors Selection */}
                <div className="p-3 bg-light rounded-3 border mb-3">
                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                    <label className="form-label extra-small text-muted fw-bold text-uppercase mb-0">
                      Copy to Which Floors?
                    </label>

                    {/* Quick Presets */}
                    <div className="d-flex gap-1 flex-wrap">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-xs extra-small px-2 py-1 rounded"
                        onClick={() => handleDupRangeChange(2, 7)}
                      >
                        2nd to 7th
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-xs extra-small px-2 py-1 rounded"
                        onClick={() => handleDupRangeChange(4, 7)}
                      >
                        4th to 7th
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-xs extra-small px-2 py-1 rounded"
                        onClick={() => handleDupRangeChange(2, 12)}
                      >
                        2nd to 12th
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-xs extra-small px-2 py-1 rounded"
                        onClick={() => handleDupRangeChange(1, 18)}
                      >
                        1st to 18th
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-xs extra-small px-2 py-1 rounded"
                        onClick={() => setDupSelectedFloors(new Set())}
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Range inputs */}
                  <div className="row g-2 mb-2 align-items-center">
                    <div className="col-6 col-sm-4">
                      <label className="form-label extra-small text-muted fw-semibold mb-1">From Floor</label>
                      <input
                        type="number"
                        min="1"
                        max="18"
                        className="form-control form-control-sm fw-bold"
                        value={dupStartFloor}
                        onChange={(e) => handleDupRangeChange(e.target.value, dupEndFloor)}
                      />
                    </div>
                    <div className="col-6 col-sm-4">
                      <label className="form-label extra-small text-muted fw-semibold mb-1">To Floor</label>
                      <input
                        type="number"
                        min={dupStartFloor}
                        max="18"
                        className="form-control form-control-sm fw-bold"
                        value={dupEndFloor}
                        onChange={(e) => handleDupRangeChange(dupStartFloor, e.target.value)}
                      />
                    </div>
                    <div className="col-12 col-sm-4">
                      <label className="form-label extra-small text-muted fw-semibold mb-1">Floors Selected</label>
                      <div className="form-control form-control-sm bg-white fw-bold text-success">
                        {dupSelectedFloors.size} Floors chosen
                      </div>
                    </div>
                  </div>

                  {/* Interactive Floor Chips */}
                  <div className="d-flex flex-wrap gap-1 p-2 bg-white rounded border">
                    {Array.from({ length: 18 }, (_, i) => i + 1).map((fNum) => {
                      const isSelected = dupSelectedFloors.has(fNum);
                      return (
                        <button
                          key={fNum}
                          type="button"
                          className={`btn btn-xs extra-small px-2 py-1 rounded-2 text-nowrap fw-bold ${
                            isSelected ? 'btn-success shadow-sm text-white' : 'btn-outline-secondary'
                          }`}
                          style={{ fontSize: '11px', minWidth: '42px' }}
                          onClick={() => toggleDupFloor(fNum)}
                        >
                          {fNum}{getOrdinalSuffix(fNum)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Summary */}
                <div className="alert alert-success py-2 px-3 mb-0 rounded-3 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-lightning-charge-fill fs-4 text-success"></i>
                    <div>
                      <strong className="d-block">
                        Ready to replicate {totalDupItems} measurements
                      </strong>
                      <span className="extra-small text-muted">
                        {dupSelectedFloors.size} floors &times; {sourceItems.length} items each
                      </span>
                    </div>
                  </div>
                  <span className="badge bg-success px-3 py-2 fs-6 fw-bold">
                    {totalDupItems} Items
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="modal-footer bg-light py-3 px-4 border-top">
            <button type="button" className="btn btn-sm btn-secondary fw-bold px-3" onClick={onClose}>
              Cancel
            </button>

            {activeTab === 'template' ? (
              <button
                type="button"
                className="btn btn-sm btn-primary fw-bold px-4 shadow d-flex align-items-center gap-2"
                disabled={totalGenItems === 0}
                onClick={handleExecuteGenerate}
              >
                <i className="bi bi-magic"></i>
                <span>Create {totalGenItems} Rows (Floors {genStartFloor} to {genEndFloor})</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-sm btn-success fw-bold px-4 shadow d-flex align-items-center gap-2"
                disabled={totalDupItems === 0}
                onClick={handleExecuteDuplicate}
              >
                <i className="bi bi-copy"></i>
                <span>Duplicate to {dupSelectedFloors.size} Floors ({totalDupItems} Items)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
