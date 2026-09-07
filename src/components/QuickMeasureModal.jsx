import React, { useState, useEffect, useRef } from 'react';
import { UNIT_OPTIONS, COMMON_ROOM_AREAS, WORK_CATEGORIES } from '../data/categories';
import { createEmptyItem, createEmptyArea } from '../data/sampleData';
import { calculateLineItemTotal, calculateAreaTotals, formatNumber, isLengthUnit, isCountUnit } from '../utils/calculations';

export default function QuickMeasureModal({
  show,
  onClose,
  projectData,
  onUpdateProjectData,
  projectName
}) {
  if (!show || !projectData) return null;

  const areas = projectData.areas || [];
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

  // Keypad click handler
  const handleKeypadPress = (val) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(25); } catch {}
    }

    if (activeField === 'length') {
      applyKeypadInput(length, setLength, val);
    } else if (activeField === 'height') {
      applyKeypadInput(height, setHeight, val);
    } else if (activeField === 'quantity') {
      applyKeypadInput(quantity, setQuantity, val);
    }
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

  // Delete line item from active area
  const handleDeleteItem = (itemId) => {
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
    'Main Hall',
    'Passage',
    'Balcony',
    'Toilet Dado',
    'Skirting',
    'Door Frame',
    'Window Sill',
    'Niche',
    'Platform',
    'Tread',
    'Riser'
  ];

  const currentAreaItems = activeArea.items || [];
  const additions = currentAreaItems.filter(i => !i.isLess);
  const deductions = currentAreaItems.filter(i => i.isLess);

  return (
    <div 
      className="position-fixed top-0 start-0 w-100 h-100 bg-white d-flex flex-column"
      style={{ zIndex: 10500, overflow: 'hidden' }}
    >
      {/* ── TOP HEADER (FULL SCALE) ── */}
      <header className="bg-dark text-white px-3 py-2 d-flex flex-wrap align-items-center justify-content-between gap-2 border-bottom shadow-sm">
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-warning text-dark fw-bold text-uppercase px-2 py-1 fs-6">
            ⚡ FIELD MODE
          </span>
          <div className="d-flex align-items-center gap-2">
            <span className="fw-bold text-light text-uppercase small text-truncate" style={{ maxWidth: '240px' }}>
              {projectName || 'MEASUREMENT SHEET'}
            </span>
            <span className="badge bg-success bg-opacity-75 text-white extra-small text-uppercase d-none d-sm-inline-block">
              ✓ {addedCount} SAVED THIS SESSION
            </span>
          </div>
        </div>

        {/* Center: Area Switcher Pill */}
        <div className="d-flex align-items-center gap-2 flex-grow-1 flex-md-grow-0 justify-content-center">
          <select
            className="form-select form-select-sm bg-dark text-white border-secondary fw-bold text-uppercase"
            style={{ maxWidth: '320px' }}
            value={activeArea.id || ''}
            onChange={(e) => {
              if (e.target.value === '__NEW__') {
                setShowNewAreaForm(true);
              } else {
                setSelectedAreaId(e.target.value);
              }
            }}
          >
            {areas.map((a, idx) => (
              <option key={a.id} value={a.id}>
                Area #{idx + 1}: {a.room || a.parentCategory || 'Main Area'} {a.floor ? `(${a.floor})` : ''}
              </option>
            ))}
            <option value="__NEW__" className="text-warning fw-bold">+ Add New Room / Area...</option>
          </select>
          <button
            type="button"
            className="btn btn-sm btn-outline-warning text-uppercase fw-bold extra-small text-nowrap"
            onClick={() => setShowNewAreaForm(!showNewAreaForm)}
          >
            {showNewAreaForm ? 'Cancel' : '+ New Room'}
          </button>
        </div>

        {/* Right: Close & Return */}
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-sm btn-danger text-uppercase fw-bold px-3 py-1 shadow-sm"
            onClick={onClose}
          >
            <i className="bi bi-x-lg me-1"></i> CLOSE &amp; VIEW SHEET
          </button>
        </div>
      </header>

      {/* ── MOBILE VIEWPORT TAB SWITCHER (< 768px) ── */}
      <div className="d-md-none bg-light p-2 border-bottom d-flex gap-1 justify-content-center">
        <button
          type="button"
          className={`btn btn-sm flex-fill fw-bold text-uppercase py-1 extra-small ${
            mobileTab === 'pad' ? 'btn-dark shadow-sm' : 'btn-outline-secondary bg-white'
          }`}
          onClick={() => setMobileTab('pad')}
        >
          <i className="bi bi-calculator-fill me-1 text-warning"></i> Fast Entry Pad
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

      {/* ── MODAL: CUSTOM AREA CREATION ACCORDION (IF OPEN) ── */}
      {showNewAreaForm && (
        <div className="bg-warning-subtle border-bottom p-3 shadow-sm">
          <div className="container-fluid">
            <div className="row g-2 align-items-center">
              <div className="col-12 col-md-4">
                <label className="form-label extra-small fw-bold text-dark text-uppercase mb-1">
                  New Room / Location Area
                </label>
                <select
                  className="form-select form-select-sm fw-bold text-uppercase"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                >
                  <option value="">Select Room Preset or Type Below...</option>
                  {COMMON_ROOM_AREAS.map((r, i) => (
                    <option key={i} value={r}>{r}</option>
                  ))}
                </select>
                <input
                  type="text"
                  className="form-control form-control-sm mt-1 fw-bold text-uppercase"
                  placeholder="Or enter custom room name..."
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label extra-small fw-bold text-dark text-uppercase mb-1">
                  Work Category (Detail)
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

              <div className="col-12 col-md-4 d-flex gap-2 align-items-end">
                <button
                  type="button"
                  className="btn btn-sm btn-primary fw-bold text-uppercase flex-grow-1"
                  onClick={handleCreateNewArea}
                >
                  <i className="bi bi-plus-circle me-1"></i> Create &amp; Switch Area
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

      {/* ── MAIN WORKSPACE: FULL SCALE DUAL-PANE LAYOUT ── */}
      <div className="flex-grow-1 d-flex overflow-hidden bg-light">
        {/* ── LEFT PANE: LIVE MEASUREMENT SHEET TABLE (Visible on Desktop/Tablet, or on Mobile 'table' Tab) ── */}
        <div 
          className={`flex-grow-1 flex-column bg-white border-end ${
            mobileTab === 'table' ? 'd-flex' : 'd-none d-md-flex'
          }`}
          style={{ width: '55%', minWidth: '320px', overflowY: 'auto' }}
        >
          {/* Area Metadata Strip (Matches Contractor Sheet Header) */}
          <div className="bg-light-subtle p-3 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div>
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-dark rounded-pill px-2 py-1 fw-bold text-uppercase">
                  Area #{areas.findIndex(a => a.id === activeArea?.id) + 1}
                </span>
                <h6 className="fw-bolder text-dark mb-0 text-uppercase">
                  {activeArea.room || 'LIVING ROOM'}
                </h6>
                <span className="text-secondary small fw-semibold">
                  &bull; {activeArea.parentCategory || 'FLOOR TILES'}
                </span>
              </div>
              <div className="text-muted extra-small mt-1 text-uppercase">
                {activeArea.floor ? `${activeArea.floor}` : 'Floor Not Set'} &bull; {activeArea.flat ? `${activeArea.flat}` : 'Unit Not Set'}
              </div>
            </div>

            {/* Area Subtotals Badge */}
            <div className="d-flex align-items-center gap-2">
              <div className="bg-white px-2 py-1 border rounded shadow-sm text-end">
                <div className="extra-small text-muted fw-bold text-uppercase">GROSS</div>
                <div className="fw-bold text-dark font-monospace">{formatNumber(activeAreaTotals.grossQty)}</div>
              </div>
              {activeAreaTotals.lessQty > 0 && (
                <div className="bg-white px-2 py-1 border border-danger-subtle rounded shadow-sm text-end">
                  <div className="extra-small text-danger fw-bold text-uppercase">LESS</div>
                  <div className="fw-bold text-danger font-monospace">-{formatNumber(activeAreaTotals.lessQty)}</div>
                </div>
              )}
              <div className="bg-primary text-white px-3 py-1 rounded shadow-sm text-end">
                <div className="extra-small text-light opacity-75 fw-bold text-uppercase">NET TOTAL</div>
                <div className="fw-bolder fs-6 font-monospace">{formatNumber(activeAreaTotals.netQty)}</div>
              </div>
            </div>
          </div>

          {/* Real Live Contractor Grid Table */}
          <div className="table-responsive flex-grow-1 p-2 p-md-3">
            <table className="table table-bordered sheet-grid-table align-middle mb-0">
              <thead className="text-center text-uppercase fw-bold bg-light-subtle">
                <tr>
                  <th style={{ width: '40px' }}>SR.</th>
                  <th style={{ width: '75px' }}>TYPE</th>
                  <th>REMARK / LOCATION DETAIL</th>
                  <th style={{ width: '55px' }}>UNIT</th>
                  <th style={{ width: '50px' }}>QTY</th>
                  <th style={{ width: '70px' }}>LENGTH</th>
                  <th style={{ width: '70px' }}>HEIGHT</th>
                  <th style={{ width: '80px' }}>TOTAL</th>
                  <th style={{ width: '45px' }}>DEL</th>
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
                      <td className="text-center">{item.quantity || 1}</td>
                      <td className="text-end font-monospace">{item.length ? formatNumber(item.length) : '-'}</td>
                      <td className="text-end font-monospace">
                        {isLengthUnit(item.unit) || isCountUnit(item.unit) ? '-' : (item.height ? formatNumber(item.height) : '-')}
                      </td>
                      <td className="text-end fw-bold font-monospace text-primary">{formatNumber(lineTotal)}</td>
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
                    <td className="text-end font-monospace text-dark">{formatNumber(activeAreaTotals.grossQty)}</td>
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
                      <td className="text-center">{dItem.quantity || 1}</td>
                      <td className="text-end font-monospace">{dItem.length ? formatNumber(dItem.length) : '-'}</td>
                      <td className="text-end font-monospace">
                        {isLengthUnit(dItem.unit) || isCountUnit(dItem.unit) ? '-' : (dItem.height ? formatNumber(dItem.height) : '-')}
                      </td>
                      <td className="text-end fw-bold font-monospace text-danger">-{formatNumber(lineTotal)}</td>
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
                    <td className="text-end font-monospace text-danger">-{formatNumber(activeAreaTotals.lessQty)}</td>
                    <td></td>
                  </tr>
                )}

                {/* Net Total Row */}
                <tr className="fw-bolder bg-light-subtle border-top border-dark border-2">
                  <td colSpan={7} className="text-end pe-2 text-uppercase text-primary fs-6">NET TOTAL (AFTER LESS):</td>
                  <td className="text-end font-monospace text-primary fs-6">{formatNumber(activeAreaTotals.netQty)}</td>
                  <td></td>
                </tr>

                {/* Empty Area Prompt */}
                {currentAreaItems.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-5 text-muted">
                      <div className="display-6 mb-2">📐</div>
                      <h6 className="fw-bold text-uppercase">No Measurements In This Area Yet</h6>
                      <p className="extra-small text-muted mb-0">
                        Enter length &amp; height on the keypad and tap <strong>SAVE &amp; NEXT ITEM</strong> to record measurements.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Quick Mobile Return to Keypad */}
          <div className="d-md-none p-2 border-top bg-light text-center">
            <button
              type="button"
              className="btn btn-sm btn-dark fw-bold text-uppercase w-100 py-2"
              onClick={() => setMobileTab('pad')}
            >
              &larr; Return to Keypad Entry
            </button>
          </div>
        </div>

        {/* ── RIGHT PANE: RAPID MEASUREMENT ENTRY CONSOLE (Visible on Desktop/Tablet, or on Mobile 'pad' Tab) ── */}
        <div 
          className={`flex-grow-1 flex-column bg-light ${
            mobileTab === 'pad' ? 'd-flex' : 'd-none d-md-flex'
          }`}
          style={{ width: '45%', minWidth: '320px', overflowY: 'auto' }}
        >
          {/* Scrollable Entry Form */}
          <div className="flex-grow-1 p-2 p-md-3 d-flex flex-column gap-2 overflow-y-auto">
            {/* 1. ROOM & CATEGORY SELECTOR CARD */}
            <div className="card border-0 shadow-sm rounded-3 p-2 bg-white">
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label extra-small fw-bold text-muted text-uppercase mb-1">Floor / Flat</label>
                  <div className="input-group input-group-sm">
                    <input
                      type="text"
                      className="form-control fw-bold"
                      placeholder="Floor (8th)"
                      value={activeArea.floor || ''}
                      onChange={(e) => handleUpdateActiveAreaField('floor', e.target.value)}
                    />
                    <input
                      type="text"
                      className="form-control fw-bold"
                      placeholder="Flat (801)"
                      value={activeArea.flat || ''}
                      onChange={(e) => handleUpdateActiveAreaField('flat', e.target.value)}
                    />
                  </div>
                </div>

                <div className="col-6">
                  <label className="form-label extra-small fw-bold text-muted text-uppercase mb-1">Room / Location</label>
                  <select
                    className="form-select form-select-sm fw-bold text-uppercase"
                    value={activeArea.room || ''}
                    onChange={(e) => handleUpdateActiveAreaField('room', e.target.value)}
                  >
                    <option value="">Select Room...</option>
                    {COMMON_ROOM_AREAS.map((r, i) => (
                      <option key={i} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div className="col-12">
                  <label className="form-label extra-small fw-bold text-muted text-uppercase mb-1">Work Category</label>
                  <select
                    className="form-select form-select-sm fw-bold text-uppercase"
                    value={activeArea.parentCategory || 'Floor Tiles'}
                    onChange={(e) => handleUpdateActiveAreaField('parentCategory', e.target.value)}
                  >
                    {WORK_CATEGORIES.map((cat, i) => (
                      <option key={i} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 2. TYPE TOGGLE: ADDITION (+) vs DEDUCTION / LESS (-) */}
            <div className="d-flex gap-2">
              <button
                type="button"
                className={`btn btn-sm flex-fill fw-bolder text-uppercase py-2 rounded-3 shadow-sm ${
                  !isLess ? 'btn-success text-white' : 'btn-outline-secondary bg-white'
                }`}
                onClick={() => setIsLess(false)}
              >
                <i className="bi bi-plus-circle-fill me-1"></i> + ADDITION (ADD)
              </button>
              <button
                type="button"
                className={`btn btn-sm flex-fill fw-bolder text-uppercase py-2 rounded-3 shadow-sm ${
                  isLess ? 'btn-danger text-white' : 'btn-outline-secondary bg-white'
                }`}
                onClick={() => setIsLess(true)}
              >
                <i className="bi bi-dash-circle-fill me-1"></i> - LESS (DEDUCT)
              </button>
            </div>

            {/* 3. REMARK / SPECIFIC ITEM CUTOUT WITH VOICE INPUT */}
            <div className="card border-0 shadow-sm rounded-3 p-2 bg-white">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="extra-small fw-bold text-muted text-uppercase mb-0">
                  Item Description / Cutout Note
                </label>
                <button
                  type="button"
                  className={`btn btn-xs extra-small fw-bold ${isListening ? 'btn-danger' : 'btn-outline-secondary'}`}
                  onClick={handleToggleVoice}
                >
                  <i className={`bi ${isListening ? 'bi-mic-fill me-1' : 'bi-mic me-1'}`}></i>
                  {isListening ? 'Listening...' : 'Voice Input'}
                </button>
              </div>

              <input
                type="text"
                className="form-control form-control-sm fw-semibold mb-1"
                placeholder={isLess ? 'e.g. Door Opening, Window Cutout, Nahani Trap' : 'e.g. Main Hall, Passage, Room Corner'}
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />

              {/* Quick chips */}
              <div className="d-flex gap-1 overflow-x-auto pb-1" style={{ whiteSpace: 'nowrap' }}>
                {COMMON_CHIPS.map((chip, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`btn btn-xs rounded-pill extra-small px-2 py-0 text-nowrap ${
                      remark === chip ? 'btn-dark text-white' : 'btn-outline-secondary'
                    }`}
                    onClick={() => setRemark(chip)}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. UNIT SELECTOR */}
            <div className="d-flex gap-1">
              {UNIT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`btn btn-sm flex-grow-1 fw-bold extra-small py-1 rounded-3 ${
                    unit === opt.value ? 'btn-dark shadow-sm' : 'btn-outline-secondary bg-white'
                  }`}
                  onClick={() => setUnit(opt.value)}
                >
                  {opt.value}
                </button>
              ))}
            </div>

            {/* 5. LARGE MEASUREMENT CARDS (TAP TO FOCUS WITH BLUE HIGHLIGHT) */}
            <div className="row g-2">
              {/* LENGTH */}
              <div className={isLengthUnit(unit) || isCountUnit(unit) ? 'col-6' : 'col-4'}>
                <div 
                  className={`card p-2 text-center border-2 rounded-3 cursor-pointer transition-all ${
                    activeField === 'length' 
                      ? 'border-primary bg-primary bg-opacity-10 shadow-sm' 
                      : 'border-secondary border-opacity-25 bg-white'
                  }`}
                  onClick={() => setActiveField('length')}
                  style={{ minHeight: '75px' }}
                >
                  <span className="extra-small fw-bold text-secondary text-uppercase">
                    LENGTH ({unit === 'SQM' || unit === 'RMT' ? 'M' : 'FT'})
                  </span>
                  <span className="fs-4 fw-bolder font-monospace text-dark">
                    {length || <span className="text-muted opacity-50">0.00</span>}
                  </span>
                </div>
              </div>

              {/* HEIGHT / WIDTH */}
              {!isLengthUnit(unit) && !isCountUnit(unit) && (
                <div className="col-4">
                  <div 
                    className={`card p-2 text-center border-2 rounded-3 cursor-pointer transition-all ${
                      activeField === 'height' 
                        ? 'border-primary bg-primary bg-opacity-10 shadow-sm' 
                        : 'border-secondary border-opacity-25 bg-white'
                    }`}
                    onClick={() => setActiveField('height')}
                    style={{ minHeight: '75px' }}
                  >
                    <span className="extra-small fw-bold text-secondary text-uppercase">
                      HEIGHT/WIDTH
                    </span>
                    <span className="fs-4 fw-bolder font-monospace text-dark">
                      {height || <span className="text-muted opacity-50">0.00</span>}
                    </span>
                  </div>
                </div>
              )}

              {/* QUANTITY */}
              <div className={isLengthUnit(unit) || isCountUnit(unit) ? 'col-6' : 'col-4'}>
                <div 
                  className={`card p-2 text-center border-2 rounded-3 cursor-pointer transition-all ${
                    activeField === 'quantity' 
                      ? 'border-primary bg-primary bg-opacity-10 shadow-sm' 
                      : 'border-secondary border-opacity-25 bg-white'
                  }`}
                  onClick={() => setActiveField('quantity')}
                  style={{ minHeight: '75px' }}
                >
                  <span className="extra-small fw-bold text-secondary text-uppercase">
                    QTY (NOS)
                  </span>
                  <span className="fs-4 fw-bolder font-monospace text-dark">
                    {quantity || '1'}
                  </span>
                </div>
              </div>
            </div>

            {/* 6. LIVE FORMULA PREVIEW */}
            <div className="d-flex justify-content-between align-items-center bg-dark text-white px-3 py-2 rounded-3 shadow-sm">
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

          {/* ── BOTTOM FIXED RAPID KEYPAD & ACTION BAR ── */}
          <div className="bg-white border-top p-2 shadow-lg">
            {/* Fractional shortcuts */}
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
            <div className="row g-1 mb-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'BACKSPACE'].map((k) => (
                <div key={k} className="col-4">
                  <button
                    type="button"
                    className={`btn w-100 py-2 fs-5 fw-bolder shadow-sm rounded-3 ${
                      k === 'BACKSPACE' 
                        ? 'btn-outline-secondary' 
                        : 'btn-light border text-dark'
                    }`}
                    onClick={() => handleKeypadPress(k)}
                    style={{ minHeight: '44px' }}
                  >
                    {k === 'BACKSPACE' ? <i className="bi bi-backspace-fill"></i> : k}
                  </button>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm fw-bold text-uppercase px-3"
                onClick={handleNextField}
                style={{ minWidth: '95px' }}
              >
                NEXT &rarr;
              </button>
              <button
                type="button"
                className="btn btn-success btn-lg flex-grow-1 fw-bolder text-uppercase d-flex align-items-center justify-content-center gap-2 shadow"
                onClick={handleSaveAndNext}
                style={{ minHeight: '48px' }}
              >
                <i className="bi bi-check2-circle fs-4"></i>
                <span>SAVE &amp; NEXT ITEM</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
