import React, { useState, useMemo } from 'react';
import { formatNumber } from '../utils/calculations';

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

  // Analyze existing floors
  const analysis = useMemo(() => {
    const floorMarkers = [];
    items.forEach((it, idx) => {
      const fNum = parseFloorNumber(it.remark);
      if (fNum !== null) {
        floorMarkers.push({ floorNum: fNum, index: idx, remark: it.remark });
      }
    });

    let detectedGroupSize = 6;
    let templateStartIndex = 0;
    let templateEndIndex = Math.min(items.length, 6);
    let highestFloor = 1;

    if (floorMarkers.length >= 2) {
      detectedGroupSize = floorMarkers[1].index - floorMarkers[0].index;
      templateStartIndex = floorMarkers[0].index;
      templateEndIndex = floorMarkers[1].index;
      highestFloor = Math.max(...floorMarkers.map((m) => m.floorNum));
    } else if (floorMarkers.length === 1) {
      templateStartIndex = floorMarkers[0].index;
      highestFloor = floorMarkers[0].floorNum;
      detectedGroupSize = Math.max(1, items.length - templateStartIndex);
      templateEndIndex = items.length;
    } else if (items.length > 0) {
      detectedGroupSize = Math.min(items.length, 6);
      templateEndIndex = detectedGroupSize;
    }

    return {
      floorMarkers,
      detectedGroupSize: Math.max(1, detectedGroupSize),
      templateStartIndex,
      templateEndIndex,
      highestFloor
    };
  }, [items]);

  // User configurable range of source items
  const [sourceStart, setSourceStart] = useState(analysis.templateStartIndex + 1);
  const [sourceEnd, setSourceEnd] = useState(Math.max(analysis.templateStartIndex + 1, analysis.templateEndIndex));

  // Target floors
  const initialTargetStart = analysis.highestFloor >= 1 ? analysis.highestFloor + 1 : 2;
  const initialTargetEnd = Math.max(initialTargetStart, 7);

  const [targetStartFloor, setTargetStartFloor] = useState(initialTargetStart);
  const [targetEndFloor, setTargetEndFloor] = useState(initialTargetEnd);

  // Selected floor numbers set
  const [selectedFloors, setSelectedFloors] = useState(() => {
    const s = new Set();
    for (let f = initialTargetStart; f <= initialTargetEnd; f++) {
      s.add(f);
    }
    return s;
  });

  const handleRangeChange = (start, end) => {
    const sVal = Math.max(1, Math.min(18, parseInt(start, 10) || 1));
    const eVal = Math.max(sVal, Math.min(18, parseInt(end, 10) || sVal));
    setTargetStartFloor(sVal);
    setTargetEndFloor(eVal);

    const newSet = new Set();
    for (let f = sVal; f <= eVal; f++) {
      newSet.add(f);
    }
    setSelectedFloors(newSet);
  };

  const toggleFloor = (fNum) => {
    const updated = new Set(selectedFloors);
    if (updated.has(fNum)) {
      updated.delete(fNum);
    } else {
      updated.add(fNum);
    }
    setSelectedFloors(updated);
  };

  const selectPreset = (start, end) => {
    handleRangeChange(start, end);
  };

  // Slice of template items
  const templateItems = useMemo(() => {
    const s = Math.max(0, sourceStart - 1);
    const e = Math.min(items.length, sourceEnd);
    if (s >= e) return [];
    return items.slice(s, e);
  }, [items, sourceStart, sourceEnd]);

  // Existing floors already present in the area
  const existingFloorNums = useMemo(() => {
    return new Set(analysis.floorMarkers.map((m) => m.floorNum));
  }, [analysis.floorMarkers]);

  const sortedSelectedFloors = useMemo(() => {
    return Array.from(selectedFloors).sort((a, b) => a - b);
  }, [selectedFloors]);

  const totalNewItemsCount = sortedSelectedFloors.length * templateItems.length;

  const handleGenerate = () => {
    if (templateItems.length === 0) {
      alert('Please select at least 1 source item to replicate.');
      return;
    }
    if (sortedSelectedFloors.length === 0) {
      alert('Please select at least one target floor.');
      return;
    }

    const generatedItems = [];

    sortedSelectedFloors.forEach((fNum) => {
      const floorName = formatFloorName(fNum);

      templateItems.forEach((orig, idx) => {
        const uniqueId = `item-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        // For the first item of each floor, set the floor label.
        // For remaining items, retain their original remark unless it was a floor label (in which case clear it)
        let itemRemark = '';
        if (idx === 0) {
          itemRemark = floorName;
        } else {
          // If original item had a floor remark, don't copy that floor name to subsequent items
          const isOrigFloor = parseFloorNumber(orig.remark) !== null;
          itemRemark = isOrigFloor ? '' : (orig.remark || '');
        }

        generatedItems.push({
          ...orig,
          id: uniqueId,
          remark: itemRemark,
          quantity: orig.quantity !== undefined ? orig.quantity : '',
          length: orig.length !== undefined ? orig.length : '',
          height: orig.height !== undefined ? orig.height : '',
          rate: orig.rate !== undefined ? orig.rate : '',
          isLess: !!orig.isLess
        });
      });
    });

    onApplyReplication(generatedItems);
    onClose();
  };

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
                style={{ width: '36px', height: '36px' }}
              >
                <i className="bi bi-layers-fill fs-5"></i>
              </div>
              <div>
                <h5 className="modal-title fw-bold mb-0">Multi-Floor Auto-Replicator</h5>
                <p className="extra-small text-white-50 mb-0">
                  Instantly duplicate repeating floor measurements across 1st to 18th Floor
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

          <div className="modal-body p-4">
            {/* Step 1: Select Source Measurements Template */}
            <div className="p-3 bg-light rounded-3 border mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="fw-bold text-dark extra-small text-uppercase">
                  <i className="bi bi-1-circle-fill text-primary me-1"></i>
                  Step 1: Source Measurements Template ({templateItems.length} items)
                </span>
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle extra-small fw-bold">
                  {analysis.floorMarkers[0]?.remark || '1st Floor'} pattern detected
                </span>
              </div>

              <div className="row g-2 align-items-center">
                <div className="col-6 col-sm-4">
                  <label className="form-label extra-small text-muted fw-semibold mb-1">From Item #</label>
                  <input
                    type="number"
                    min="1"
                    max={items.length || 1}
                    className="form-control form-control-sm fw-bold"
                    value={sourceStart}
                    onChange={(e) => setSourceStart(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  />
                </div>
                <div className="col-6 col-sm-4">
                  <label className="form-label extra-small text-muted fw-semibold mb-1">To Item #</label>
                  <input
                    type="number"
                    min={sourceStart}
                    max={items.length || 1}
                    className="form-control form-control-sm fw-bold"
                    value={sourceEnd}
                    onChange={(e) => setSourceEnd(Math.max(sourceStart, parseInt(e.target.value, 10) || sourceStart))}
                  />
                </div>
                <div className="col-12 col-sm-4">
                  <label className="form-label extra-small text-muted fw-semibold mb-1">Items in this Floor</label>
                  <div className="form-control form-control-sm bg-white text-muted fw-bold">
                    {templateItems.length} measurements
                  </div>
                </div>
              </div>

              {/* Mini preview of template */}
              {templateItems.length > 0 && (
                <div className="mt-2 pt-2 border-top">
                  <div className="d-flex flex-wrap gap-1 align-items-center">
                    <span className="extra-small text-muted me-1">Sample items:</span>
                    {templateItems.map((it, idx) => (
                      <span
                        key={idx}
                        className="badge bg-white text-dark border extra-small fw-medium"
                        style={{ fontSize: '10px' }}
                      >
                        #{sourceStart + idx}: Qty {it.quantity || 1} &bull; {it.length || '—'} {it.unit || 'RFT'}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Target Floors Selection */}
            <div className="p-3 bg-light rounded-3 border mb-3">
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                <span className="fw-bold text-dark extra-small text-uppercase">
                  <i className="bi bi-2-circle-fill text-primary me-1"></i>
                  Step 2: Choose Target Floors to Generate
                </span>

                {/* Quick preset buttons */}
                <div className="d-flex gap-1 flex-wrap">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-xs extra-small px-2 py-1 rounded"
                    onClick={() => selectPreset(2, 7)}
                  >
                    2nd to 7th
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-xs extra-small px-2 py-1 rounded"
                    onClick={() => selectPreset(1, 7)}
                  >
                    1st to 7th
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-xs extra-small px-2 py-1 rounded"
                    onClick={() => selectPreset(2, 12)}
                  >
                    2nd to 12th
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-xs extra-small px-2 py-1 rounded"
                    onClick={() => selectPreset(1, 18)}
                  >
                    1st to 18th
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-xs extra-small px-2 py-1 rounded"
                    onClick={() => setSelectedFloors(new Set())}
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Range quick inputs */}
              <div className="row g-2 mb-3 align-items-center">
                <div className="col-6 col-sm-3">
                  <label className="form-label extra-small text-muted fw-semibold mb-1">Start Floor</label>
                  <input
                    type="number"
                    min="1"
                    max="18"
                    className="form-control form-control-sm fw-bold"
                    value={targetStartFloor}
                    onChange={(e) => handleRangeChange(e.target.value, targetEndFloor)}
                  />
                </div>
                <div className="col-6 col-sm-3">
                  <label className="form-label extra-small text-muted fw-semibold mb-1">End Floor</label>
                  <input
                    type="number"
                    min={targetStartFloor}
                    max="18"
                    className="form-control form-control-sm fw-bold"
                    value={targetEndFloor}
                    onChange={(e) => handleRangeChange(targetStartFloor, e.target.value)}
                  />
                </div>
                <div className="col-12 col-sm-6">
                  <label className="form-label extra-small text-muted fw-semibold mb-1">Selected Target Floors</label>
                  <div className="form-control form-control-sm bg-white fw-bold text-primary">
                    {sortedSelectedFloors.length} Floors selected
                  </div>
                </div>
              </div>

              {/* Floor Chips 1 to 18 */}
              <div className="d-flex flex-wrap gap-1 p-2 bg-white rounded border">
                {Array.from({ length: 18 }, (_, i) => i + 1).map((fNum) => {
                  const isSelected = selectedFloors.has(fNum);
                  const isExisting = existingFloorNums.has(fNum);

                  return (
                    <button
                      key={fNum}
                      type="button"
                      className={`btn btn-xs extra-small px-2 py-1 rounded-2 text-nowrap fw-bold ${
                        isSelected
                          ? 'btn-primary shadow-sm text-white'
                          : isExisting
                          ? 'btn-outline-warning text-dark border-warning'
                          : 'btn-outline-secondary'
                      }`}
                      style={{ fontSize: '11px', minWidth: '42px' }}
                      onClick={() => toggleFloor(fNum)}
                      title={
                        isExisting
                          ? `${formatFloorName(fNum)} already exists in this area (click to toggle)`
                          : `Click to select ${formatFloorName(fNum)}`
                      }
                    >
                      {fNum}{getOrdinalSuffix(fNum)}
                      {isExisting && !isSelected && ' ✓'}
                    </button>
                  );
                })}
              </div>
              <div className="text-muted extra-small mt-1 d-flex justify-content-between">
                <span>
                  <i className="bi bi-info-circle me-1"></i>
                  Blue = Will be generated &bull; Orange = Already exists in sheet
                </span>
                <span className="fw-semibold">1st item = Floor name, remaining = Blank remark</span>
              </div>
            </div>

            {/* Summary calculation pill */}
            <div className="alert alert-primary py-2 px-3 mb-0 rounded-3 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-calculator-fill fs-5 text-primary"></i>
                <div>
                  <span className="fw-bold d-block">
                    Ready to generate {totalNewItemsCount} line items
                  </span>
                  <span className="extra-small text-muted">
                    {sortedSelectedFloors.length} floors &times; {templateItems.length} items per floor
                  </span>
                </div>
              </div>

              <div className="d-flex gap-1 flex-wrap">
                {sortedSelectedFloors.slice(0, 7).map((f) => (
                  <span key={f} className="badge bg-primary extra-small">
                    {f}{getOrdinalSuffix(f)} Floor
                  </span>
                ))}
                {sortedSelectedFloors.length > 7 && (
                  <span className="badge bg-dark extra-small">
                    +{sortedSelectedFloors.length - 7} more
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer bg-light py-3 px-4 border-top">
            <button type="button" className="btn btn-sm btn-secondary fw-bold px-3" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-sm btn-success fw-bold px-4 shadow d-flex align-items-center gap-2"
              disabled={totalNewItemsCount === 0}
              onClick={handleGenerate}
            >
              <i className="bi bi-lightning-charge-fill"></i>
              <span>Generate {totalNewItemsCount} Line Items</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
