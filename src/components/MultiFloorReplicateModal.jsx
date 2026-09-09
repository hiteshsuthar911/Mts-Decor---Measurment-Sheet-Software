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

  // Room / Work item presets for rapid skeleton creation
  const ROOM_PRESETS = [
    { id: 'blank', label: 'Empty Rows (Blank remarks)', items: [] },
    { id: 'custom', label: 'Custom List (Comma-separated custom rooms)', items: ['Toilet 1', 'Toilet 2', 'Toilet 3', 'Toilet 4', 'Toilet 5'] },
    { id: 'toilet_package', label: 'Toilet / Dado Package (5 Remarks)', items: ['Toilet 1 Dado', 'Toilet 1 Floor', 'Toilet 2 Dado', 'Toilet 2 Floor', 'Kitchen Dado'] },
    { id: '1bhk', label: '1 BHK Residential (5 Rooms)', items: ['Living Room', 'Kitchen', 'Master Bedroom', 'Common Bath', 'Balcony'] },
    { id: '2bhk', label: '2 BHK Residential (8 Rooms)', items: ['Living Room', 'Dining', 'Kitchen', 'Master Bed', 'Bed 2', 'Toilet 1', 'Toilet 2', 'Balcony'] },
    { id: '3bhk', label: '3 BHK Residential (10 Rooms)', items: ['Living Room', 'Dining', 'Kitchen', 'Master Bed', 'Bed 2', 'Bed 3', 'Toilet 1', 'Toilet 2', 'Toilet 3', 'Balcony'] }
  ];

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

  const handleDupFilter = (type) => {
    const set = new Set();
    const start = Math.min(dupStartFloor, dupEndFloor);
    const end = Math.max(dupStartFloor, dupEndFloor);
    for (let f = start; f <= end; f++) {
      if (type === 'odd' && f % 2 !== 0) set.add(f);
      if (type === 'even' && f % 2 === 0) set.add(f);
      if (type === 'all') set.add(f);
    }
    setDupSelectedFloors(set);
  };

  const toggleDupFloor = (fNum) => {
    const updated = new Set(dupSelectedFloors);
    if (updated.has(fNum)) updated.delete(fNum);
    else updated.add(fNum);
    setDupSelectedFloors(updated);
  };

  /* ═══════════════════════════════════════════════════════════════
     TAB 2: GENERATE EMPTY / PRESET FLOOR STRUCTURE (FAST ENTRY SKELETON)
     ═══════════════════════════════════════════════════════════════ */
  const [genStartFloor, setGenStartFloor] = useState(1);
  const [genEndFloor, setGenEndFloor] = useState(7);
  const [genSelectedFloors, setGenSelectedFloors] = useState(() => {
    const s = new Set();
    for (let f = 1; f <= 7; f++) s.add(f);
    return s;
  });
  const [skip13th, setSkip13th] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState('blank');
  const [customRoomsInput, setCustomRoomsInput] = useState('Toilet 1, Toilet 2, Toilet 3, Toilet 4, Toilet 5');
  const [includeDedicatedHeaderRow, setIncludeDedicatedHeaderRow] = useState(true);

  const [genRowsPerFloor, setGenRowsPerFloor] = useState(6); // 1 floor row + 5 remarks = 6
  const [genUnit, setGenUnit] = useState(defaultUnit);
  const [genDefaultQty, setGenDefaultQty] = useState('');
  const [genReplaceExisting, setGenReplaceExisting] = useState(items.length <= 1);

  // Synchronize rows per floor when preset changes
  useEffect(() => {
    if (selectedPreset === 'blank') {
      // keep current genRowsPerFloor
    } else if (selectedPreset === 'custom') {
      const list = customRoomsInput.split(',').map(s => s.trim()).filter(Boolean);
      const total = (includeDedicatedHeaderRow ? 1 : 0) + Math.max(1, list.length);
      setGenRowsPerFloor(total);
    } else {
      const p = ROOM_PRESETS.find(x => x.id === selectedPreset);
      if (p) {
        const total = (includeDedicatedHeaderRow ? 1 : 0) + p.items.length;
        setGenRowsPerFloor(total);
      }
    }
  }, [selectedPreset, customRoomsInput, includeDedicatedHeaderRow]);

  const handleGenRangeChange = (start, end) => {
    const s = Math.max(1, Math.min(18, parseInt(start, 10) || 1));
    const e = Math.max(s, Math.min(18, parseInt(end, 10) || s));
    setGenStartFloor(s);
    setGenEndFloor(e);
    const set = new Set();
    for (let f = s; f <= e; f++) {
      if (skip13th && f === 13) continue;
      set.add(f);
    }
    setGenSelectedFloors(set);
  };

  const handleGenFilter = (type) => {
    const set = new Set();
    const start = Math.min(genStartFloor, genEndFloor);
    const end = Math.max(genStartFloor, genEndFloor);
    for (let f = start; f <= end; f++) {
      if (skip13th && f === 13) continue;
      if (type === 'odd' && f % 2 !== 0) set.add(f);
      if (type === 'even' && f % 2 === 0) set.add(f);
      if (type === 'all') set.add(f);
    }
    setGenSelectedFloors(set);
  };

  const toggleGenFloor = (fNum) => {
    const updated = new Set(genSelectedFloors);
    if (updated.has(fNum)) updated.delete(fNum);
    else updated.add(fNum);
    setGenSelectedFloors(updated);
  };

  // Execution: Tab 1 Duplicate
  const handleExecuteDuplicate = () => {
    if (sourceItems.length === 0) {
      alert('Please enter at least 1 measurement in the sheet first, or switch to "Create Floor Rows" tab!');
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
    const targetFloors = Array.from(genSelectedFloors).sort((a, b) => a - b);
    if (targetFloors.length === 0) {
      alert('Please select at least 1 floor to generate.');
      return;
    }

    // Resolve room labels
    let roomList = [];
    if (selectedPreset === 'custom') {
      roomList = customRoomsInput.split(',').map(s => s.trim()).filter(Boolean);
      if (roomList.length === 0) roomList = ['Toilet 1', 'Toilet 2', 'Toilet 3', 'Toilet 4', 'Toilet 5'];
    } else if (selectedPreset !== 'blank') {
      const p = ROOM_PRESETS.find(x => x.id === selectedPreset);
      roomList = p ? p.items : [];
    }

    const newItems = [];
    targetFloors.forEach((fNum) => {
      const fName = formatFloorName(fNum);

      if (roomList.length > 0) {
        // Has room preset labels
        if (includeDedicatedHeaderRow) {
          // 1. Dedicated Header Row (e.g. "1st Floor")
          newItems.push({
            id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            remark: fName,
            quantity: genDefaultQty !== '' ? genDefaultQty : '',
            length: '',
            height: '',
            unit: genUnit,
            rate: '',
            isLess: false
          });
          // 2. Each room as its own remark row
          roomList.forEach((rm) => {
            newItems.push({
              id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
              remark: rm,
              quantity: genDefaultQty !== '' ? genDefaultQty : '',
              length: '',
              height: '',
              unit: genUnit,
              rate: '',
              isLess: false
            });
          });
        } else {
          // No dedicated header row, tag floor name to each room
          roomList.forEach((rm) => {
            newItems.push({
              id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
              remark: `${fName} - ${rm}`,
              quantity: genDefaultQty !== '' ? genDefaultQty : '',
              length: '',
              height: '',
              unit: genUnit,
              rate: '',
              isLess: false
            });
          });
        }
      } else {
        // Blank rows mode
        const countPerRow = Math.max(1, parseInt(genRowsPerFloor, 10) || 6);
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
    });

    onApplyReplication(newItems, genReplaceExisting);
    onClose();
  };

  const totalGenFloors = genSelectedFloors.size;
  const rowsCalculatedPerFloor = selectedPreset !== 'blank'
    ? (selectedPreset === 'custom'
        ? (customRoomsInput.split(',').map(s => s.trim()).filter(Boolean).length || 5) + (includeDedicatedHeaderRow ? 1 : 0)
        : (ROOM_PRESETS.find(x => x.id === selectedPreset)?.items?.length || 5) + (includeDedicatedHeaderRow ? 1 : 0))
    : Math.max(1, genRowsPerFloor);
  const totalGenItems = totalGenFloors * rowsCalculatedPerFloor;
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
                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                    <label className="form-label extra-small text-muted fw-bold text-uppercase mb-0">
                      Floor Range &amp; Selection
                    </label>
                    {/* Quick Presets & Filters */}
                    <div className="d-flex gap-1 flex-wrap align-items-center">
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
                      <div className="vr my-1"></div>
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-xs extra-small px-2 py-1 rounded"
                        onClick={() => handleGenFilter('all')}
                      >
                        All
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-xs extra-small px-2 py-1 rounded"
                        onClick={() => handleGenFilter('odd')}
                      >
                        Odd (1,3,5..)
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-xs extra-small px-2 py-1 rounded"
                        onClick={() => handleGenFilter('even')}
                      >
                        Even (2,4,6..)
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-xs extra-small px-2 py-1 rounded"
                        onClick={() => setGenSelectedFloors(new Set())}
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="row g-2 align-items-center mb-2">
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
                        Selected Floors
                      </label>
                      <div className="form-control form-control-sm bg-white fw-bold text-primary">
                        {totalGenFloors} Floors Selected
                      </div>
                    </div>
                  </div>

                  {/* Floor chips */}
                  <div className="d-flex flex-wrap gap-1 p-2 bg-white rounded border mb-2">
                    {Array.from({ length: 18 }, (_, i) => i + 1).map((fNum) => {
                      const isSelected = genSelectedFloors.has(fNum);
                      return (
                        <button
                          key={fNum}
                          type="button"
                          className={`btn btn-xs extra-small px-2 py-1 rounded-2 text-nowrap fw-bold ${
                            isSelected ? 'btn-primary shadow-sm text-white' : 'btn-outline-secondary'
                          }`}
                          style={{ fontSize: '11px', minWidth: '42px' }}
                          onClick={() => toggleGenFloor(fNum)}
                        >
                          {fNum}{getOrdinalSuffix(fNum)}
                        </button>
                      );
                    })}
                  </div>

                  {/* Skip 13th floor checkbox */}
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="skip13thCheck"
                      checked={skip13th}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setSkip13th(val);
                        if (val) {
                          const updated = new Set(genSelectedFloors);
                          updated.delete(13);
                          setGenSelectedFloors(updated);
                        }
                      }}
                    />
                    <label className="form-check-label extra-small text-muted fw-semibold" htmlFor="skip13thCheck">
                      Skip 13th Floor (Avoid unlucky / mechanical refuge floor)
                    </label>
                  </div>
                </div>

                {/* Room / Location Presets & Structure */}
                <div className="p-3 bg-light rounded-3 border mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label extra-small text-muted fw-bold text-uppercase mb-0">
                      Room &amp; Remarks Preset
                    </label>
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle extra-small fw-bold">
                      {rowsCalculatedPerFloor} rows per floor
                    </span>
                  </div>

                  <div className="row g-2 mb-2">
                    <div className="col-12 col-sm-6">
                      <select
                        className="form-select form-select-sm fw-bold"
                        value={selectedPreset}
                        onChange={(e) => setSelectedPreset(e.target.value)}
                      >
                        {ROOM_PRESETS.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-6 col-sm-3">
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

                    <div className="col-6 col-sm-3">
                      <input
                        type="number"
                        step="any"
                        placeholder="Default Qty (e.g. 1)"
                        className="form-control form-control-sm"
                        value={genDefaultQty}
                        onChange={(e) => setGenDefaultQty(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Custom Rooms Input */}
                  {selectedPreset === 'custom' && (
                    <div className="mb-2">
                      <label className="form-label extra-small text-muted fw-bold mb-1">
                        Enter Custom Room / Remark Names (Comma Separated):
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={customRoomsInput}
                        onChange={(e) => setCustomRoomsInput(e.target.value)}
                        placeholder="e.g. Toilet 1, Toilet 2, Toilet 3, Toilet 4, Toilet 5"
                      />
                      <span className="extra-small text-muted">
                        Each item will become a separate row on every selected floor.
                      </span>
                    </div>
                  )}

                  {/* Blank Rows Mode: Number input */}
                  {selectedPreset === 'blank' && (
                    <div className="row g-2 mb-2 align-items-center">
                      <div className="col-sm-4">
                        <label className="form-label extra-small text-muted fw-semibold mb-0">Total rows per floor:</label>
                      </div>
                      <div className="col-sm-4">
                        <input
                          type="number"
                          min="1"
                          max="20"
                          className="form-control form-control-sm fw-bold"
                          value={genRowsPerFloor}
                          onChange={(e) => setGenRowsPerFloor(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        />
                      </div>
                      <div className="col-sm-4">
                        <span className="extra-small text-muted">
                          1 Floor header + {Math.max(0, genRowsPerFloor - 1)} blank rows
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Preset Preview Badges */}
                  {selectedPreset !== 'blank' && (
                    <div className="p-2 bg-white rounded border mb-2">
                      <div className="extra-small text-muted fw-bold mb-1">Each floor will contain:</div>
                      <div className="d-flex flex-wrap gap-1">
                        {includeDedicatedHeaderRow && (
                          <span className="badge bg-dark text-white extra-small">
                            1st Floor (Header)
                          </span>
                        )}
                        {(selectedPreset === 'custom'
                          ? customRoomsInput.split(',').map(s => s.trim()).filter(Boolean)
                          : ROOM_PRESETS.find(x => x.id === selectedPreset)?.items || []
                        ).map((rm, idx) => (
                          <span key={idx} className="badge bg-light text-dark border extra-small">
                            {rm}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dedicated Header Row Toggle & Replace Existing */}
                  <div className="d-flex flex-column gap-1 pt-2 border-top">
                    {selectedPreset !== 'blank' && (
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="includeDedicatedHeaderRowCheck"
                          checked={includeDedicatedHeaderRow}
                          onChange={(e) => setIncludeDedicatedHeaderRow(e.target.checked)}
                        />
                        <label className="form-check-label extra-small fw-semibold text-dark" htmlFor="includeDedicatedHeaderRowCheck">
                          Add dedicated floor header row (e.g. <code>1st Floor</code>) above the room items
                        </label>
                      </div>
                    )}

                    <div className="form-check">
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
                </div>

                {/* Summary Pill */}
                <div className="alert alert-primary py-2 px-3 mb-2 rounded-3 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-magic fs-4 text-primary"></i>
                    <div>
                      <strong className="d-block">
                        Ready to generate {totalGenItems} rows for {totalGenFloors} Floors
                      </strong>
                      <span className="extra-small text-muted">
                        {totalGenFloors} floors &times; {rowsCalculatedPerFloor} rows each = {totalGenItems} total rows
                      </span>
                    </div>
                  </div>
                  <span className="badge bg-primary px-3 py-2 fs-6 fw-bold">
                    {totalGenItems} Rows
                  </span>
                </div>

                {/* Multiplier Pro-Tip */}
                <div className="p-2 bg-light rounded border extra-small text-muted d-flex align-items-center gap-2">
                  <i className="bi bi-lightbulb-fill text-warning fs-6"></i>
                  <span>
                    <strong>Pro-Tip:</strong> If all 7 floors have 100% identical dimensions, you can also use the <strong>Floor Multiplier (&times; 7)</strong> directly in the area header instead of creating repetitive rows!
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
                    <strong>Replicate completed measurements:</strong> Copies your source floor measurements (with exact lengths &amp;
                    quantities) and automatically re-labels the top row to <code>2nd Floor</code>, <code>3rd Floor</code>, etc.!
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

                    {/* Quick Presets & Filters */}
                    <div className="d-flex gap-1 flex-wrap align-items-center">
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
                      <div className="vr my-1"></div>
                      <button
                        type="button"
                        className="btn btn-outline-success btn-xs extra-small px-2 py-1 rounded"
                        onClick={() => handleDupFilter('all')}
                      >
                        All
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-success btn-xs extra-small px-2 py-1 rounded"
                        onClick={() => handleDupFilter('odd')}
                      >
                        Odd
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-success btn-xs extra-small px-2 py-1 rounded"
                        onClick={() => handleDupFilter('even')}
                      >
                        Even
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
                <span>Create {totalGenItems} Rows ({genSelectedFloors.size} Floors)</span>
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
