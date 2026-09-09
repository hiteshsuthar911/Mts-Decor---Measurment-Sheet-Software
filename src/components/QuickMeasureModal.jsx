import React, { useState, useEffect, useRef } from 'react';
import { UNIT_OPTIONS, COMMON_ROOM_AREAS, WORK_CATEGORIES } from '../data/categories';
import { createEmptyItem, createEmptyArea } from '../data/sampleData';
import { calculateLineItemTotal, calculateAreaTotals, formatNumber, isLengthUnit, isCountUnit } from '../utils/calculations';

// Standard architectural cutout presets for rapid site deductions
const ARCHITECTURAL_CUTOUTS = [
  { label: 'Std Door (3×7)', remark: 'Standard Door Opening', length: '3.00', height: '7.00', area: '21.00 SFT' },
  { label: 'Main Door (3.5×7)', remark: 'Main Door Opening', length: '3.50', height: '7.00', area: '24.50 SFT' },
  { label: 'Toilet Door (2.5×7)', remark: 'Toilet Door Opening', length: '2.50', height: '7.00', area: '17.50 SFT' },
  { label: 'Window 4×4', remark: 'Window Opening 4×4', length: '4.00', height: '4.00', area: '16.00 SFT' },
  { label: 'Window 5×4', remark: 'Wide Window Opening 5×4', length: '5.00', height: '4.00', area: '20.00 SFT' },
  { label: 'Ventilator (2×2)', remark: 'Ventilator Opening', length: '2.00', height: '2.00', area: '4.00 SFT' },
  { label: 'Switchboard', remark: 'Switchboard Cutout', length: '0.75', height: '0.75', area: '0.56 SFT' },
  { label: 'Nahani Trap', remark: 'Nahani Trap Floor Cut', length: '1.00', height: '1.00', area: '1.00 SFT' },
  { label: 'Column (1.5×1.5)', remark: 'Column Offset Deduction', length: '1.50', height: '1.50', area: '2.25 SFT' },
];

export default function QuickMeasureModal({
  show,
  onClose,
  projectData,
  onUpdateProjectData,
  projectName
}) {
  const areas = projectData?.areas || [];
  const [selectedAreaId, setSelectedAreaId] = useState(areas[0]?.id || '');
  const [isLess, setIsLess] = useState(false);
  const [remark, setRemark] = useState('');
  const [unit, setUnit] = useState('SFT');
  const [length, setLength] = useState('');
  const [height, setHeight] = useState('');
  const [quantity, setQuantity] = useState('1');

  // Mobile tab state: 'pad' | 'table'
  const [mobileTab, setMobileTab] = useState('pad');

  // Which field is currently focused for the keypad: 'length' | 'height' | 'quantity'
  const [activeField, setActiveField] = useState('length');
  const [addedCount, setAddedCount] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [showNewAreaForm, setShowNewAreaForm] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('Floor Tiles');

  // Advanced site mode states
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSunlightMode, setIsSunlightMode] = useState(false);
  const [showCutoutDrawer, setShowCutoutDrawer] = useState(false);

  // Audio synthesizer for click feedback on noisy sites
  const playClickSound = (freq = 900, duration = 0.04) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  };

  // Keep selectedAreaId synced if areas change
  useEffect(() => {
    if (!selectedAreaId && areas.length > 0) {
      setSelectedAreaId(areas[0].id);
    }
  }, [areas, selectedAreaId]);

  // Find active area object
  const activeArea = areas.find(a => a.id === selectedAreaId) || areas[0] || {};
  const activeAreaTotals = calculateAreaTotals(activeArea);

  // Sync unit when activeArea changes if activeArea has a dominant unit
  useEffect(() => {
    if (activeArea?.items && activeArea.items.length > 0) {
      const lastItem = activeArea.items[activeArea.items.length - 1];
      if (lastItem?.unit) setUnit(lastItem.unit);
    }
  }, [selectedAreaId]);

  // Calculate live preview
  const previewItem = {
    unit,
    quantity: quantity || '0',
    length: length || '0',
    height: isLengthUnit(unit) || isCountUnit(unit) ? '' : (height || '0'),
    isLess
  };
  const liveTotal = calculateLineItemTotal(previewItem);

  // Switch or rename room
  const handleSelectRoomName = (roomName) => {
    const existing = areas.find(a => (a.room || '').toLowerCase() === roomName.toLowerCase());
    if (existing) {
      setSelectedAreaId(existing.id);
      return;
    }

    if (activeArea && (!activeArea.room || activeArea.room === 'Main Floor' || activeArea.room.trim() === '')) {
      const updatedAreas = areas.map(a => a.id === activeArea.id ? { ...a, room: roomName } : a);
      onUpdateProjectData(prev => ({ ...prev, areas: updatedAreas }));
      return;
    }

    const newArea = createEmptyArea();
    newArea.room = roomName;
    newArea.parentCategory = activeArea.parentCategory || 'Floor Tiles';
    if (activeArea) {
      newArea.floor = activeArea.floor || '';
      newArea.flat = activeArea.flat || '';
    }
    const nextAreas = [...areas, newArea];
    onUpdateProjectData(prev => ({ ...prev, areas: nextAreas }));
    setSelectedAreaId(newArea.id);
  };

  // Update active area fields
  const handleUpdateActiveAreaField = (field, val) => {
    const updatedAreas = areas.map(a => a.id === activeArea?.id ? { ...a, [field]: val } : a);
    onUpdateProjectData(prev => ({ ...prev, areas: updatedAreas }));
  };

  // Keypad click handler with audio & haptics
  const handleKeypadPress = (val) => {
    playClickSound(val === 'BACKSPACE' || val === 'CLEAR' ? 600 : 950);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(22); } catch {}
    }

    if (activeField === 'length') {
      applyKeypadInput(length, setLength, val);
    } else if (activeField === 'height') {
      applyKeypadInput(height, setHeight, val);
    } else if (activeField === 'quantity') {
      applyKeypadInput(quantity, setQuantity, val);
    }
  };

  // Inch tape converter: converts inches to decimal feet and applies to active field
  const handleApplyInches = (inchValue) => {
    playClickSound(1100);
    const decimalFt = (inchValue / 12).toFixed(2);
    const setter = activeField === 'height' ? setHeight : setLength;
    const currentVal = activeField === 'height' ? height : length;

    // If current field has a whole feet number (e.g. "10"), append the inches fraction ("10.50")
    if (currentVal && !currentVal.includes('.')) {
      const wholeFt = parseInt(currentVal, 10) || 0;
      const total = (wholeFt + inchValue / 12).toFixed(2);
      setter(total.replace(/\.00$/, ''));
    } else {
      // Otherwise replace or add
      setter(decimalFt.replace(/\.00$/, ''));
    }
  };

  // Apply cutout preset directly in 1-tap
  const handleApplyCutoutPreset = (cutout) => {
    playClickSound(1200);
    setIsLess(true);
    setRemark(cutout.remark);
    setLength(cutout.length);
    setHeight(cutout.height);
    setQuantity('1');
    setActiveField('length');
    setShowCutoutDrawer(false);
  };

  const applyKeypadInput = (currentVal, setter, key) => {
    if (key === 'BACKSPACE') {
      setter(currentVal.slice(0, -1));
    } else if (key === 'CLEAR') {
      setter('');
    } else if (key === '.') {
      if (!currentVal.includes('.')) {
        setter((currentVal || '0') + '.');
      }
    } else if (key === '+0.5') { // 6 inches
      const num = parseFloat(currentVal) || 0;
      setter((num + 0.5).toFixed(2).replace(/\.00$/, ''));
    } else if (key === '+0.25') { // 3 inches
      const num = parseFloat(currentVal) || 0;
      setter((num + 0.25).toFixed(2).replace(/\.00$/, ''));
    } else if (key === '+0.75') { // 9 inches
      const num = parseFloat(currentVal) || 0;
      setter((num + 0.75).toFixed(2).replace(/\.00$/, ''));
    } else {
      setter(currentVal + key);
    }
  };

  const handleNextField = () => {
    playClickSound(1050);
    if (activeField === 'length') {
      if (isLengthUnit(unit) || isCountUnit(unit)) {
        setActiveField('quantity');
      } else {
        setActiveField('height');
      }
    } else if (activeField === 'height') {
      setActiveField('quantity');
    } else if (activeField === 'quantity') {
      handleSaveAndNext();
    }
  };

  // Add Item to active area
  const handleSaveAndNext = () => {
    if (!length && unit !== 'NOS') {
      setActiveField('length');
      return;
    }

    playClickSound(1300, 0.08);
    const newItem = createEmptyItem(unit);
    newItem.remark = remark.trim() || (isLess ? 'Deduction / Cut' : 'Work Item');
    newItem.unit = unit;
    newItem.quantity = quantity || '1';
    newItem.length = length || '';
    newItem.height = (isLengthUnit(unit) || isCountUnit(unit)) ? '' : (height || '');
    newItem.isLess = isLess;

    const updatedAreas = areas.map(a => {
      if (a.id === activeArea?.id) {
        return {
          ...a,
          items: [...(a.items || []), newItem]
        };
      }
      return a;
    });

    onUpdateProjectData(prev => ({ ...prev, areas: updatedAreas }));

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate([40, 30, 40]); } catch {}
    }

    setAddedCount(c => c + 1);

    // Reset dimensions for the next item
    setLength('');
    setHeight('');
    setActiveField('length');
  };

  // 1-Tap Undo Last Item directly from Keypad
  const handleUndoLastItem = () => {
    if (!activeArea?.items || activeArea.items.length === 0) return;
    playClickSound(500);
    const items = [...activeArea.items];
    const removed = items.pop();
    const updatedAreas = areas.map(a => a.id === activeArea.id ? { ...a, items } : a);
    onUpdateProjectData(prev => ({ ...prev, areas: updatedAreas }));
    setAddedCount(c => Math.max(0, c - 1));

    // Restore removed values to keypad for quick correction
    if (removed) {
      setRemark(removed.remark || '');
      setLength(removed.length || '');
      setHeight(removed.height || '');
      setQuantity(removed.quantity || '1');
      setIsLess(Boolean(removed.isLess));
      setActiveField('length');
    }
  };

  // Delete line item from active area
  const handleDeleteItem = (itemId) => {
    playClickSound(450);
    const updatedAreas = areas.map(a => {
      if (a.id === activeArea?.id) {
        return {
          ...a,
          items: (a.items || []).filter(item => item.id !== itemId)
        };
      }
      return a;
    });
    onUpdateProjectData(prev => ({ ...prev, areas: updatedAreas }));
  };

  // Create custom named Area
  const handleCreateNewArea = () => {
    if (!newRoomName.trim()) return;
    const newArea = createEmptyArea();
    newArea.room = newRoomName.trim();
    newArea.parentCategory = newCategoryName || 'Floor Tiles';
    if (activeArea) {
      newArea.floor = activeArea.floor || '';
      newArea.flat = activeArea.flat || '';
    }
    const nextAreas = [...areas, newArea];
    onUpdateProjectData(prev => ({ ...prev, areas: nextAreas }));
    setSelectedAreaId(newArea.id);
    setNewRoomName('');
    setShowNewAreaForm(false);
  };

  // Voice dictation
  const handleToggleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice dictation is not supported by this browser. Please use Chrome on Android or Safari on iPhone.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setRemark(prev => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Common quick remark presets
  const COMMON_CHIPS = isLess ? [
    'Door Opening Cut',
    'Window Cutout',
    'Nahani Trap Cut',
    'Core Cut',
    'Electric Board Cutout',
    'Gala Cut',
    'Column Offset Cut',
    'Plumbing Hole'
  ] : [
    'Main Floor',
    'Skirting',
    'Wall Dado',
    'Door Jamb / Patti',
    'Window Sill',
    'Kitchen Platform',
    'Fascia Patti',
    'Living Room',
    'Master Bedroom',
    'Common Toilet',
    'Balcony Deck'
  ];

  const currentAreaItems = activeArea.items || [];
  const additions = currentAreaItems.filter(i => !i.isLess);
  const deductions = currentAreaItems.filter(i => i.isLess);

  if (!show || !projectData) return null;

  const themeBg = isSunlightMode ? 'bg-black text-warning' : 'bg-white text-dark';
  const themeCard = isSunlightMode ? 'bg-dark border-warning border text-light' : 'bg-white border-0 shadow-sm text-dark';

  return (
    <div
      className={`position-fixed top-0 start-0 w-100 h-100 d-flex flex-column ${themeBg}`}
      style={{ zIndex: 10500, overflow: 'hidden' }}
    >
      {/* ── TOP HEADER (RESPONSIVE FOR ALL SCREEN SIZES) ── */}
      <header className="bg-dark text-white px-2 px-md-3 py-2 d-flex align-items-center justify-content-between gap-2 border-bottom shadow-sm flex-shrink-0">
        {/* Left: Brand / Title */}
        <div className="d-flex align-items-center gap-1.5 min-w-0">
          <span className="badge bg-warning text-dark fw-bold text-uppercase px-2 py-1 flex-shrink-0" style={{ fontSize: '11px' }}>
            ⚡ FIELD
          </span>
          <div className="min-w-0">
            <span className="fw-bold text-light text-uppercase small text-truncate d-block" style={{ maxWidth: '140px' }}>
              {activeArea.room || 'LIVING ROOM'}
            </span>
            <span className="text-white-50 extra-small d-none d-sm-inline">
              {activeArea.parentCategory || 'FLOOR TILES'}
            </span>
          </div>
        </div>

        {/* Center: Live Session Counter Pill */}
        <div className="d-flex align-items-center gap-1.5 flex-shrink-0">
          <span className="badge bg-success bg-opacity-75 text-white extra-small text-uppercase px-2 py-1">
            ✓ {addedCount} ADDED
          </span>
          <span className="badge bg-primary extra-small text-uppercase px-2 py-1 d-none d-sm-inline-block">
            NET: {formatNumber(activeAreaTotals.netQty)} {unit}
          </span>
        </div>

        {/* Right: Quick Controls & Close */}
        <div className="d-flex align-items-center gap-1.5 flex-shrink-0">
          {/* Audio Beep Toggle */}
          <button
            type="button"
            className={`btn btn-xs py-1 px-2 fw-bold ${soundEnabled ? 'btn-outline-warning text-warning' : 'btn-outline-secondary text-white-50'}`}
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Audio click on' : 'Audio click off'}
          >
            <i className={`bi ${soundEnabled ? 'bi-volume-up-fill' : 'bi-volume-mute-fill'}`}></i>
          </button>

          {/* Sunlight Mode Toggle */}
          <button
            type="button"
            className={`btn btn-xs py-1 px-2 fw-bold ${isSunlightMode ? 'btn-warning text-dark' : 'btn-outline-light'}`}
            onClick={() => setIsSunlightMode(!isSunlightMode)}
            title="Toggle Outdoor High-Contrast Sunlight Mode"
          >
            <i className="bi bi-brightness-high-fill"></i>
          </button>

          {/* Close & Exit */}
          <button
            type="button"
            className="btn btn-sm btn-danger text-uppercase fw-bold px-2.5 py-1 shadow-sm d-flex align-items-center gap-1"
            onClick={onClose}
            title="Close Field Mode and view full sheet"
          >
            <i className="bi bi-x-lg"></i>
            <span className="d-none d-sm-inline">EXIT</span>
          </button>
        </div>
      </header>

      {/* ── ROOMS & AREAS SWIPEABLE SHELF ── */}
      <div className="bg-light-subtle px-2 py-1.5 border-bottom d-flex align-items-center gap-1 overflow-x-auto flex-shrink-0" style={{ scrollbarWidth: 'none' }}>
        <span className="extra-small fw-bold text-muted text-uppercase me-1 flex-shrink-0">
          ROOM:
        </span>
        {areas.map((a, idx) => {
          const isCurrent = a.id === activeArea?.id;
          const count = (a.items || []).length;
          return (
            <button
              key={a.id}
              type="button"
              className={`btn btn-xs text-nowrap rounded-pill extra-small px-2.5 py-1 fw-bold ${
                isCurrent ? 'btn-dark text-white shadow-xs' : 'btn-white border text-secondary bg-white'
              }`}
              onClick={() => setSelectedAreaId(a.id)}
            >
              #{idx + 1} {a.room || 'Area'} {count > 0 && `(${count})`}
            </button>
          );
        })}
        <button
          type="button"
          className="btn btn-xs btn-outline-warning text-dark text-nowrap rounded-pill extra-small px-2.5 py-1 fw-bold"
          onClick={() => setShowNewAreaForm(!showNewAreaForm)}
        >
          {showNewAreaForm ? '✕' : '+ New Room'}
        </button>
      </div>

      {/* ── MOBILE VIEWPORT TAB SWITCHER (< 768px) ── */}
      <div className="d-md-none bg-light p-1.5 border-bottom d-flex gap-1 justify-content-center flex-shrink-0">
        <button
          type="button"
          className={`btn btn-sm flex-fill fw-bold text-uppercase py-1 extra-small ${
            mobileTab === 'pad' ? 'btn-dark shadow-sm' : 'btn-outline-secondary bg-white'
          }`}
          onClick={() => setMobileTab('pad')}
        >
          <i className="bi bi-calculator-fill me-1 text-warning"></i> Quick Keypad
        </button>
        <button
          type="button"
          className={`btn btn-sm flex-fill fw-bold text-uppercase py-1 extra-small ${
            mobileTab === 'table' ? 'btn-dark shadow-sm' : 'btn-outline-secondary bg-white'
          }`}
          onClick={() => setMobileTab('table')}
        >
          <i className="bi bi-table me-1 text-primary"></i> Live Sheet ({currentAreaItems.length})
        </button>
      </div>

      {/* ── CUSTOM AREA CREATION FORM ACCORDION (IF OPEN) ── */}
      {showNewAreaForm && (
        <div className="bg-warning-subtle border-bottom p-2.5 shadow-sm flex-shrink-0">
          <div className="container-fluid p-0">
            <div className="row g-2 align-items-center">
              <div className="col-12 col-md-5">
                <label className="form-label extra-small fw-bold text-dark text-uppercase mb-1">
                  Room / Area Name
                </label>
                <div className="d-flex gap-1">
                  <select
                    className="form-select form-select-sm fw-bold text-uppercase"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                  >
                    <option value="">Preset...</option>
                    {COMMON_ROOM_AREAS.map((r, i) => (
                      <option key={i} value={r}>{r}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    className="form-control form-control-sm fw-bold text-uppercase"
                    placeholder="Or type custom..."
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                  />
                </div>
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label extra-small fw-bold text-dark text-uppercase mb-1">
                  Work Category
                </label>
                <select
                  className="form-select form-select-sm fw-bold text-uppercase"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                >
                  {WORK_CATEGORIES.map((cat, i) => (
                    <option key={i} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-md-3 d-flex gap-2 align-items-end">
                <button
                  type="button"
                  className="btn btn-sm btn-primary fw-bold text-uppercase flex-grow-1"
                  onClick={handleCreateNewArea}
                >
                  <i className="bi bi-plus-circle me-1"></i> Add Room
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary fw-bold text-uppercase"
                  onClick={() => setShowNewAreaForm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN WORKSPACE: DUAL-PANE DESKTOP / TABBED MOBILE ── */}
      <div className="flex-grow-1 d-flex overflow-hidden">
        {/* ── LEFT PANE: LIVE SHEET TABLE (Desktop/Tablet, or Mobile 'table' Tab) ── */}
        <div
          className={`flex-grow-1 flex-column bg-white border-end ${
            mobileTab === 'table' ? 'd-flex' : 'd-none d-md-flex'
          }`}
          style={{ width: '50%', minWidth: '320px', overflowY: 'auto' }}
        >
          {/* Active Area Totals Ribbon */}
          <div className="bg-light-subtle p-2 p-md-3 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div>
              <div className="d-flex align-items-center gap-1.5">
                <span className="badge bg-dark rounded-pill px-2 py-0.5 fw-bold text-uppercase" style={{ fontSize: '10px' }}>
                  AREA #{areas.findIndex(a => a.id === activeArea?.id) + 1}
                </span>
                <h6 className="fw-bolder text-dark mb-0 text-uppercase">
                  {activeArea.room || 'LIVING ROOM'}
                </h6>
              </div>
              <div className="text-muted extra-small mt-0.5 text-uppercase">
                {activeArea.floor || 'Floor Not Set'} &bull; {activeArea.flat || 'Flat Not Set'} &bull; {activeArea.parentCategory || 'Floor Tiles'}
              </div>
            </div>

            {/* Subtotals Pill Grid */}
            <div className="d-flex align-items-center gap-1.5">
              <div className="bg-white px-2 py-0.5 border rounded shadow-2xs text-end">
                <div className="extra-small text-muted fw-bold text-uppercase" style={{ fontSize: '9px' }}>GROSS</div>
                <div className="fw-bold text-dark font-monospace small">{formatNumber(activeAreaTotals.grossQty)}</div>
              </div>
              {activeAreaTotals.lessQty > 0 && (
                <div className="bg-white px-2 py-0.5 border border-danger-subtle rounded shadow-2xs text-end">
                  <div className="extra-small text-danger fw-bold text-uppercase" style={{ fontSize: '9px' }}>LESS</div>
                  <div className="fw-bold text-danger font-monospace small">-{formatNumber(activeAreaTotals.lessQty)}</div>
                </div>
              )}
              <div className="bg-primary text-white px-2.5 py-0.5 rounded shadow-2xs text-end">
                <div className="extra-small text-light opacity-75 fw-bold text-uppercase" style={{ fontSize: '9px' }}>NET AREA</div>
                <div className="fw-bolder font-monospace small">{formatNumber(activeAreaTotals.netQty)} {unit}</div>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="table-responsive flex-grow-1 p-2 p-md-3">
            <table className="table table-bordered sheet-grid-table align-middle mb-0">
              <thead className="text-center text-uppercase fw-bold bg-light-subtle">
                <tr>
                  <th style={{ width: '38px' }}>SR.</th>
                  <th style={{ width: '65px' }}>TYPE</th>
                  <th>REMARK / LOCATION DETAIL</th>
                  <th style={{ width: '50px' }}>UNIT</th>
                  <th style={{ width: '45px' }}>QTY</th>
                  <th style={{ width: '65px' }}>L</th>
                  <th style={{ width: '65px' }}>H/W</th>
                  <th style={{ width: '75px' }}>TOTAL</th>
                  <th style={{ width: '40px' }}>DEL</th>
                </tr>
              </thead>
              <tbody>
                {/* Additions */}
                {additions.map((item, idx) => {
                  const lineTotal = calculateLineItemTotal(item);
                  return (
                    <tr key={item.id} className="align-middle">
                      <td className="text-center fw-bold text-muted small">{idx + 1}</td>
                      <td className="text-center">
                        <span className="badge bg-success bg-opacity-75 text-white extra-small text-uppercase">ADD</span>
                      </td>
                      <td className="px-2 text-uppercase fw-semibold small">{item.remark || '-'}</td>
                      <td className="text-center small">{item.unit || 'SFT'}</td>
                      <td className="text-center small">{item.quantity || 1}</td>
                      <td className="text-end font-monospace small">{item.length ? formatNumber(item.length) : '-'}</td>
                      <td className="text-end font-monospace small">
                        {isLengthUnit(item.unit) || isCountUnit(item.unit) ? '-' : (item.height ? formatNumber(item.height) : '-')}
                      </td>
                      <td className="text-end fw-bold font-monospace text-primary small">{formatNumber(lineTotal)}</td>
                      <td className="text-center p-0">
                        <button
                          type="button"
                          className="btn btn-link text-danger p-0"
                          onClick={() => handleDeleteItem(item.id)}
                          title="Delete item"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {/* Subtotal of Additions */}
                {additions.length > 0 && (
                  <tr className="fw-bold bg-light">
                    <td colSpan={7} className="text-end pe-2 text-uppercase extra-small">TOTAL ADDITIONS:</td>
                    <td className="text-end font-monospace text-dark small">{formatNumber(activeAreaTotals.grossQty)}</td>
                    <td></td>
                  </tr>
                )}

                {/* Deductions (LESS) */}
                {deductions.map((dItem, dIdx) => {
                  const lineTotal = calculateLineItemTotal(dItem);
                  return (
                    <tr key={dItem.id} className="table-danger-subtle align-middle">
                      <td className="text-center fw-bold text-danger small">L{dIdx + 1}</td>
                      <td className="text-center">
                        <span className="badge bg-danger text-white extra-small text-uppercase">LESS</span>
                      </td>
                      <td className="px-2 text-uppercase fw-semibold text-danger small">{dItem.remark || 'Deduction'}</td>
                      <td className="text-center small">{dItem.unit || 'SFT'}</td>
                      <td className="text-center small">{dItem.quantity || 1}</td>
                      <td className="text-end font-monospace small">{dItem.length ? formatNumber(dItem.length) : '-'}</td>
                      <td className="text-end font-monospace small">
                        {isLengthUnit(dItem.unit) || isCountUnit(dItem.unit) ? '-' : (dItem.height ? formatNumber(dItem.height) : '-')}
                      </td>
                      <td className="text-end fw-bold font-monospace text-danger small">-{formatNumber(lineTotal)}</td>
                      <td className="text-center p-0">
                        <button
                          type="button"
                          className="btn btn-link text-danger p-0"
                          onClick={() => handleDeleteItem(dItem.id)}
                          title="Delete deduction"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {/* Total Deductions */}
                {deductions.length > 0 && (
                  <tr className="fw-bold table-danger border-dark">
                    <td colSpan={7} className="text-end pe-2 text-uppercase text-danger extra-small">TOTAL LESS (DEDUCTIONS):</td>
                    <td className="text-end font-monospace text-danger small">-{formatNumber(activeAreaTotals.lessQty)}</td>
                    <td></td>
                  </tr>
                )}

                {/* Net Total Row */}
                <tr className="fw-bolder bg-light-subtle border-top border-dark border-2">
                  <td colSpan={7} className="text-end pe-2 text-uppercase text-primary small">NET TOTAL:</td>
                  <td className="text-end font-monospace text-primary small">{formatNumber(activeAreaTotals.netQty)}</td>
                  <td></td>
                </tr>

                {/* Empty Area Prompt */}
                {currentAreaItems.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-5 text-muted">
                      <div className="display-6 mb-2">📐</div>
                      <h6 className="fw-bold text-uppercase">No Measurements in this area yet</h6>
                      <p className="extra-small text-muted mb-0">
                        Tap keypad numbers and hit <strong>SAVE &amp; NEXT</strong> to add items.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Back button */}
          <div className="d-md-none p-2 border-top bg-light text-center flex-shrink-0">
            <button
              type="button"
              className="btn btn-sm btn-dark fw-bold text-uppercase w-100 py-2"
              onClick={() => setMobileTab('pad')}
            >
              &larr; Return to Keypad Entry
            </button>
          </div>
        </div>

        {/* ── RIGHT PANE: RAPID MEASUREMENT CONSOLE & KEYPAD ── */}
        <div
          className={`flex-grow-1 flex-column ${
            mobileTab === 'pad' ? 'd-flex' : 'd-none d-md-flex'
          }`}
          style={{ width: '50%', minWidth: '320px', overflowY: 'auto' }}
        >
          {/* Scrollable inputs wrapper */}
          <div className="flex-grow-1 p-2 d-flex flex-column gap-1.5 overflow-y-auto">
            {/* 1. TYPE TOGGLE & UNIT SELECTOR ROW */}
            <div className="d-flex gap-1.5 align-items-center">
              {/* ADD vs LESS */}
              <div className="btn-group flex-fill" role="group">
                <button
                  type="button"
                  className={`btn btn-sm py-1 fw-bold text-uppercase extra-small ${
                    !isLess ? 'btn-success text-white shadow-xs' : 'btn-outline-secondary bg-white'
                  }`}
                  onClick={() => setIsLess(false)}
                >
                  <i className="bi bi-plus-circle-fill me-1"></i> ADD
                </button>
                <button
                  type="button"
                  className={`btn btn-sm py-1 fw-bold text-uppercase extra-small ${
                    isLess ? 'btn-danger text-white shadow-xs' : 'btn-outline-secondary bg-white'
                  }`}
                  onClick={() => setIsLess(true)}
                >
                  <i className="bi bi-dash-circle-fill me-1"></i> LESS (CUT)
                </button>
              </div>

              {/* Units Bar */}
              <div className="btn-group" role="group">
                {UNIT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`btn btn-sm py-1 px-2 fw-bold extra-small ${
                      unit === opt.value ? 'btn-dark text-white shadow-xs' : 'btn-outline-secondary bg-white'
                    }`}
                    onClick={() => setUnit(opt.value)}
                  >
                    {opt.value}
                  </button>
                ))}
              </div>

              {/* Cutout Presets Dropdown Toggle */}
              <button
                type="button"
                className={`btn btn-sm py-1 px-2 extra-small fw-bold text-uppercase ${
                  showCutoutDrawer ? 'btn-warning text-dark' : 'btn-outline-primary bg-white'
                }`}
                onClick={() => setShowCutoutDrawer(!showCutoutDrawer)}
                title="Open standard architectural door/window cutout presets"
              >
                <i className="bi bi-door-open me-1"></i>PRESETS
              </button>
            </div>

            {/* Architectural Cutout Drawer (If Toggled) */}
            {showCutoutDrawer && (
              <div className="p-2 border rounded-3 bg-warning-subtle shadow-xs">
                <div className="d-flex justify-content-between align-items-center mb-1.5 pb-1 border-bottom border-warning-subtle">
                  <span className="extra-small fw-bold text-dark text-uppercase">
                    <i className="bi bi-lightning-charge-fill text-warning me-1"></i> 1-Tap Cutout Presets (Auto-Less)
                  </span>
                  <button
                    type="button"
                    className="btn-close extra-small"
                    style={{ fontSize: '9px' }}
                    onClick={() => setShowCutoutDrawer(false)}
                  ></button>
                </div>
                <div className="d-flex flex-wrap gap-1">
                  {ARCHITECTURAL_CUTOUTS.map((cut, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="btn btn-xs btn-white border border-secondary-subtle bg-white text-dark rounded-2 py-1 px-2 extra-small fw-semibold shadow-2xs text-start"
                      onClick={() => handleApplyCutoutPreset(cut)}
                    >
                      <span className="fw-bold text-danger me-1">-{cut.area}</span>
                      <span>{cut.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 2. REMARK INPUT WITH VOICE & QUICK CHIPS */}
            <div className={`p-1.5 rounded-3 ${themeCard}`}>
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="extra-small fw-bold text-muted text-uppercase">
                  {isLess ? 'Cutout Reason' : 'Item Description'}
                </span>
                <button
                  type="button"
                  className={`btn btn-xs py-0 px-2 extra-small fw-bold ${isListening ? 'btn-danger text-white' : 'btn-outline-secondary'}`}
                  onClick={handleToggleVoice}
                >
                  <i className={`bi ${isListening ? 'bi-mic-fill' : 'bi-mic'} me-1`}></i>
                  {isListening ? 'Listening...' : 'Voice'}
                </button>
              </div>

              <input
                type="text"
                className="form-control form-control-sm fw-semibold mb-1"
                placeholder={isLess ? 'e.g. Door Cut, Window Cutout, Nahani Trap' : 'e.g. Main Wall, Passage, Window Sill'}
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />

              {/* Fast Chips */}
              <div className="d-flex gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none', whiteSpace: 'nowrap' }}>
                {COMMON_CHIPS.map((chip, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`btn btn-xs rounded-pill extra-small px-2 py-0 text-nowrap ${
                      remark === chip ? 'btn-dark text-white' : 'btn-light border text-secondary'
                    }`}
                    onClick={() => setRemark(chip)}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. LARGE DIMENSION CARDS (TAP TO FOCUS WITH ACTIVE COLOR) */}
            <div className="row g-1.5">
              {/* LENGTH */}
              <div className={isLengthUnit(unit) || isCountUnit(unit) ? 'col-6' : 'col-4'}>
                <div
                  className={`card p-1.5 text-center border-2 rounded-3 cursor-pointer transition-all ${
                    activeField === 'length'
                      ? 'border-primary bg-primary bg-opacity-10 shadow-xs'
                      : (isSunlightMode ? 'border-secondary bg-dark text-light' : 'border-secondary border-opacity-25 bg-white')
                  }`}
                  onClick={() => setActiveField('length')}
                  style={{ minHeight: '62px', cursor: 'pointer' }}
                >
                  <span className="extra-small fw-bold text-secondary text-uppercase" style={{ fontSize: '10px' }}>
                    LENGTH ({unit === 'SQM' || unit === 'RMT' ? 'M' : 'FT'})
                  </span>
                  <span className={`fs-4 fw-bolder font-monospace ${activeField === 'length' ? 'text-primary' : 'text-dark'}`}>
                    {length || <span className="text-muted opacity-50">0.00</span>}
                  </span>
                </div>
              </div>

              {/* HEIGHT / WIDTH */}
              {!isLengthUnit(unit) && !isCountUnit(unit) && (
                <div className="col-4">
                  <div
                    className={`card p-1.5 text-center border-2 rounded-3 cursor-pointer transition-all ${
                      activeField === 'height'
                        ? 'border-primary bg-primary bg-opacity-10 shadow-xs'
                        : (isSunlightMode ? 'border-secondary bg-dark text-light' : 'border-secondary border-opacity-25 bg-white')
                    }`}
                    onClick={() => setActiveField('height')}
                    style={{ minHeight: '62px', cursor: 'pointer' }}
                  >
                    <span className="extra-small fw-bold text-secondary text-uppercase" style={{ fontSize: '10px' }}>
                      HEIGHT/WIDTH
                    </span>
                    <span className={`fs-4 fw-bolder font-monospace ${activeField === 'height' ? 'text-primary' : 'text-dark'}`}>
                      {height || <span className="text-muted opacity-50">0.00</span>}
                    </span>
                  </div>
                </div>
              )}

              {/* QUANTITY */}
              <div className={isLengthUnit(unit) || isCountUnit(unit) ? 'col-6' : 'col-4'}>
                <div
                  className={`card p-1.5 text-center border-2 rounded-3 cursor-pointer transition-all ${
                    activeField === 'quantity'
                      ? 'border-primary bg-primary bg-opacity-10 shadow-xs'
                      : (isSunlightMode ? 'border-secondary bg-dark text-light' : 'border-secondary border-opacity-25 bg-white')
                  }`}
                  onClick={() => setActiveField('quantity')}
                  style={{ minHeight: '62px', cursor: 'pointer' }}
                >
                  <span className="extra-small fw-bold text-secondary text-uppercase" style={{ fontSize: '10px' }}>
                    QTY (NOS)
                  </span>
                  <span className={`fs-4 fw-bolder font-monospace ${activeField === 'quantity' ? 'text-primary' : 'text-dark'}`}>
                    {quantity || '1'}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. LIVE FORMULA & TOTAL STRIP */}
            <div className="d-flex justify-content-between align-items-center bg-dark text-white px-3 py-1.5 rounded-3 shadow-xs">
              <div className="extra-small text-light opacity-75 font-monospace">
                {quantity || 1} &times; {length || 0} {!isLengthUnit(unit) && !isCountUnit(unit) ? `&times; ${height || 0}` : ''}
              </div>
              <div className="d-flex align-items-baseline gap-1">
                <span className="extra-small text-warning fw-bold text-uppercase">
                  {isLess ? 'DEDUCT:' : 'TOTAL:'}
                </span>
                <span className={`fs-5 fw-bolder font-monospace ${isLess ? 'text-danger' : 'text-success'}`}>
                  {isLess ? '-' : ''}{liveTotal.toFixed(2)}
                </span>
                <span className="extra-small text-light">{unit}</span>
              </div>
            </div>
          </div>

          {/* ── FIXED RAPID KEYPAD CONSOLE ── */}
          <div className="bg-white border-top p-1.5 p-sm-2 shadow-lg flex-shrink-0">
            {/* INCH TAPE CONVERTER SHORTCUTS BAR (1" - 11" & Fractions) */}
            <div className="d-flex gap-1 overflow-x-auto mb-1 pb-0.5" style={{ scrollbarWidth: 'none', whiteSpace: 'nowrap' }}>
              <span className="extra-small fw-bold text-muted text-uppercase d-flex align-items-center me-1" style={{ fontSize: '9.5px' }}>
                <i className="bi bi-rulers me-0.5"></i> INCHES:
              </span>
              {[
                { label: '1"', in: 1 },
                { label: '2"', in: 2 },
                { label: '3" (¼\')', in: 3 },
                { label: '4"', in: 4 },
                { label: '5"', in: 5 },
                { label: '6" (½\')', in: 6 },
                { label: '7"', in: 7 },
                { label: '8"', in: 8 },
                { label: '9" (¾\')', in: 9 },
                { label: '10"', in: 10 },
                { label: '11"', in: 11 },
              ].map(inch => (
                <button
                  key={inch.in}
                  type="button"
                  className="btn btn-xs btn-light border py-1 px-2 extra-small fw-bold text-secondary"
                  onClick={() => handleApplyInches(inch.in)}
                  title={`Apply ${inch.label} as decimal to active field`}
                >
                  {inch.label}
                </button>
              ))}
            </div>

            {/* Fractional +/- Shortcuts */}
            <div className="row g-1 mb-1">
              <div className="col-3">
                <button
                  type="button"
                  className="btn btn-light border w-100 py-1 extra-small fw-bold text-secondary"
                  onClick={() => handleKeypadPress('+0.25')}
                >
                  + ¼" (0.25)
                </button>
              </div>
              <div className="col-3">
                <button
                  type="button"
                  className="btn btn-light border w-100 py-1 extra-small fw-bold text-secondary"
                  onClick={() => handleKeypadPress('+0.5')}
                >
                  + ½" (0.50)
                </button>
              </div>
              <div className="col-3">
                <button
                  type="button"
                  className="btn btn-light border w-100 py-1 extra-small fw-bold text-secondary"
                  onClick={() => handleKeypadPress('+0.75')}
                >
                  + ¾" (0.75)
                </button>
              </div>
              <div className="col-3">
                <button
                  type="button"
                  className="btn btn-outline-danger w-100 py-1 extra-small fw-bold text-uppercase"
                  onClick={() => handleKeypadPress('CLEAR')}
                >
                  CLEAR
                </button>
              </div>
            </div>

            {/* Numeric Keypad Grid */}
            <div className="row g-1 mb-1.5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'BACKSPACE'].map((k) => (
                <div key={k} className="col-4">
                  <button
                    type="button"
                    className={`btn w-100 py-2 fs-5 fw-bolder shadow-2xs rounded-3 ${
                      k === 'BACKSPACE'
                        ? 'btn-outline-secondary'
                        : (isSunlightMode ? 'btn-dark border border-warning text-warning' : 'btn-light border text-dark')
                    }`}
                    onClick={() => handleKeypadPress(k)}
                    style={{ minHeight: '42px' }}
                  >
                    {k === 'BACKSPACE' ? <i className="bi bi-backspace-fill"></i> : k}
                  </button>
                </div>
              ))}
            </div>

            {/* Bottom Action Command Bar */}
            <div className="d-flex gap-1.5">
              {/* 1-Tap Undo Last Item */}
              <button
                type="button"
                className="btn btn-outline-danger btn-sm fw-bold extra-small px-2.5 d-flex align-items-center gap-1"
                onClick={handleUndoLastItem}
                disabled={currentAreaItems.length === 0}
                title="Undo last recorded item and restore values to keypad"
              >
                <i className="bi bi-arrow-counterclockwise"></i>
                <span className="d-none d-sm-inline">UNDO</span>
              </button>

              {/* Next Field */}
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm fw-bold text-uppercase px-3"
                onClick={handleNextField}
                style={{ minWidth: '80px' }}
              >
                NEXT &rarr;
              </button>

              {/* SAVE & NEXT ITEM */}
              <button
                type="button"
                className="btn btn-success btn-lg flex-grow-1 fw-bolder text-uppercase d-flex align-items-center justify-content-center gap-2 shadow"
                onClick={handleSaveAndNext}
                style={{ minHeight: '46px' }}
              >
                <i className="bi bi-check2-circle fs-4"></i>
                <span>SAVE &amp; NEXT</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
