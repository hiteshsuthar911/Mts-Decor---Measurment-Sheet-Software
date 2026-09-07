import React, { useState, useEffect, useRef } from 'react';
import { WORK_CATEGORIES, REMARK_OPTIONS, UNIT_OPTIONS } from '../data/categories';
import { createEmptyItem, createEmptyArea } from '../data/sampleData';
import { calculateLineItemTotal } from '../utils/calculations';

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
  
  // Which field is currently focused for the keypad: 'length' | 'height' | 'quantity'
  const [activeField, setActiveField] = useState('length');
  const [addedCount, setAddedCount] = useState(0);
  const [recentItems, setRecentItems] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [showNewAreaForm, setShowNewAreaForm] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');

  // Keep selectedAreaId synced if areas change
  useEffect(() => {
    if (!selectedAreaId && areas.length > 0) {
      setSelectedAreaId(areas[0].id);
    }
  }, [areas, selectedAreaId]);

  // Find active area object
  const activeArea = areas.find(a => a.id === selectedAreaId) || areas[0];

  // Calculate live preview
  const previewItem = {
    unit,
    quantity: quantity || '0',
    length: length || '0',
    height: unit === 'RFT' || unit === 'NOS' ? '' : (height || '0'),
    isLess
  };
  const liveTotal = calculateLineItemTotal(previewItem);

  // Keypad click handler
  const handleKeypadPress = (val) => {
    // Haptic feedback for touch devices
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
    } else if (key === '+0.5') { // 6 inches / half foot
      const num = parseFloat(currentVal) || 0;
      setter((num + 0.5).toFixed(2).replace(/\.00$/, ''));
    } else if (key === '+0.25') { // 3 inches / quarter foot
      const num = parseFloat(currentVal) || 0;
      setter((num + 0.25).toFixed(2).replace(/\.00$/, ''));
    } else if (key === '+0.75') { // 9 inches
      const num = parseFloat(currentVal) || 0;
      setter((num + 0.75).toFixed(2).replace(/\.00$/, ''));
    } else {
      // Number input
      setter(currentVal + key);
    }
  };

  const handleNextField = () => {
    if (activeField === 'length') {
      if (unit === 'RFT' || unit === 'NOS') {
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
    newItem.remark = remark.trim() || (isLess ? 'Deduction / Cut' : 'Item');
    newItem.unit = unit;
    newItem.quantity = quantity || '1';
    newItem.length = length || '';
    newItem.height = (unit === 'RFT' || unit === 'NOS') ? '' : (height || '');
    newItem.isLess = isLess;

    // Insert into projectData
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

    // Haptic confirmation
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate([40, 30, 40]); } catch {}
    }

    // Keep history of items added in this quick session
    setRecentItems(prev => [
      {
        id: newItem.id,
        areaName: activeArea?.room || activeArea?.parentCategory || 'Area',
        remark: newItem.remark,
        total: liveTotal,
        unit: newItem.unit,
        isLess: newItem.isLess,
        dims: `${newItem.length || '-'}${newItem.height ? ' × ' + newItem.height : ''} (Qty: ${newItem.quantity})`
      },
      ...prev.slice(0, 4)
    ]);

    setAddedCount(c => c + 1);

    // Reset length & height for the next entry, preserve room and quantity
    setLength('');
    setHeight('');
    setActiveField('length');
  };

  // Create new Area from field mode
  const handleCreateNewArea = () => {
    if (!newRoomName.trim()) return;
    const newArea = createEmptyArea();
    newArea.room = newRoomName.trim();
    newArea.parentCategory = 'Main Floor';
    
    // Copy floor & flat from previous area if present
    if (areas.length > 0) {
      const last = areas[areas.length - 1];
      newArea.floor = last.floor || '';
      newArea.flat = last.flat || '';
    }

    const nextAreas = [...areas, newArea];
    onUpdateProjectData(prev => ({ ...prev, areas: nextAreas }));
    setSelectedAreaId(newArea.id);
    setNewRoomName('');
    setShowNewAreaForm(false);
  };

  // Web Speech API for voice dictation
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

  return (
    <div 
      className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-75 d-flex flex-column align-items-center justify-content-end justify-content-md-center p-0 p-md-3"
      style={{ zIndex: 10500, backdropFilter: 'blur(4px)' }}
    >
      <div 
        className="card border-0 shadow-lg bg-white w-100 d-flex flex-column"
        style={{ 
          maxWidth: '560px', 
          height: '100%', 
          maxHeight: '94vh',
          borderRadius: '24px 24px 0 0',
          overflow: 'hidden'
        }}
      >
        {/* ── TOP HEADER BAR ── */}
        <div className="bg-dark text-white px-3 py-2 d-flex align-items-center justify-content-between border-bottom">
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-warning text-dark fw-bold text-uppercase px-2 py-1">
              ⚡ FIELD MODE
            </span>
            <div>
              <div className="extra-small text-light opacity-75 text-uppercase text-truncate" style={{ maxWidth: '180px' }}>
                {projectName || 'QUICK MEASURE'}
              </div>
              <div className="fw-bold extra-small text-success">
                {addedCount > 0 ? `✓ ${addedCount} ITEMS SAVED THIS SESSION` : 'READY TO MEASURE'}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-light text-uppercase fw-bold extra-small px-3 py-1 rounded-pill"
            onClick={onClose}
          >
            VIEW SHEET &times;
          </button>
        </div>

        {/* ── SCROLLABLE BODY ── */}
        <div className="flex-grow-1 overflow-y-auto px-3 py-2 d-flex flex-column gap-2 bg-light">
          
          {/* 1. ROOM / LOCATION AREA SELECTOR */}
          <div className="bg-white p-2 rounded-3 border shadow-sm">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label className="extra-small fw-bold text-secondary text-uppercase mb-0">
                1. LOCATION / ROOM
              </label>
              <button
                type="button"
                className="btn btn-link btn-sm p-0 extra-small fw-bold text-uppercase text-decoration-none"
                onClick={() => setShowNewAreaForm(!showNewAreaForm)}
              >
                {showNewAreaForm ? 'CANCEL' : '+ NEW ROOM'}
              </button>
            </div>

            {showNewAreaForm ? (
              <div className="d-flex gap-2">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="e.g. Master Bedroom, Balcony"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  autoFocus
                />
                <button
                  type="button"
                  className="btn btn-sm btn-primary text-uppercase fw-bold text-nowrap"
                  onClick={handleCreateNewArea}
                >
                  ADD
                </button>
              </div>
            ) : (
              <select
                className="form-select form-select-sm fw-bold text-uppercase"
                value={selectedAreaId}
                onChange={(e) => setSelectedAreaId(e.target.value)}
              >
                {areas.map((a, idx) => (
                  <option key={a.id} value={a.id}>
                    Area #{idx + 1}: {a.room || a.parentCategory || 'Main Area'} {a.flat ? `(Flat ${a.flat})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 2. ITEM DESCRIPTION & TYPE */}
          <div className="bg-white p-2 rounded-3 border shadow-sm">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label className="extra-small fw-bold text-secondary text-uppercase mb-0">
                2. ITEM &amp; WORK DETAIL
              </label>
              
              {/* Type Switch: ADD vs LESS */}
              <div className="btn-group btn-group-sm" role="group">
                <button
                  type="button"
                  className={`btn btn-xs fw-bold px-2 py-0 ${!isLess ? 'btn-success' : 'btn-outline-secondary'}`}
                  onClick={() => setIsLess(false)}
                >
                  + ADD
                </button>
                <button
                  type="button"
                  className={`btn btn-xs fw-bold px-2 py-0 ${isLess ? 'btn-danger' : 'btn-outline-secondary'}`}
                  onClick={() => setIsLess(true)}
                >
                  - LESS (DEDUCT)
                </button>
              </div>
            </div>

            <div className="input-group input-group-sm mb-2">
              <input
                type="text"
                className="form-control fw-semibold"
                placeholder={isLess ? 'e.g. Door Cut, Window Opening' : 'e.g. Flooring, Wardrobe, Skirting'}
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />
              <button
                type="button"
                className={`btn ${isListening ? 'btn-danger' : 'btn-outline-secondary'}`}
                onClick={handleToggleVoice}
                title="Voice Input (Speech-to-Text)"
              >
                <i className={`bi ${isListening ? 'bi-mic-fill' : 'bi-mic'}`}></i>
              </button>
            </div>

            {/* Quick chips for common works */}
            <div className="d-flex gap-1 overflow-x-auto pb-1" style={{ whiteSpace: 'nowrap' }}>
              {(isLess ? ['Window Cut', 'Door Opening', 'Nahani Trap', 'Column Cut'] : ['Flooring', 'Skirting', 'Wardrobe', 'Wall Tiles', 'TV Unit', 'False Ceiling', 'Kitchen Platform']).map((chip, i) => (
                <button
                  key={i}
                  type="button"
                  className="btn btn-outline-secondary btn-xs rounded-pill extra-small px-2 py-0 text-nowrap"
                  onClick={() => setRemark(chip)}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* 3. UNIT SELECTOR */}
          <div className="d-flex gap-2">
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

          {/* 4. LARGE MEASUREMENT CARDS (TAP TO FOCUS) */}
          <div className="row g-2">
            {/* LENGTH */}
            <div className={unit === 'RFT' || unit === 'NOS' ? 'col-6' : 'col-4'}>
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

            {/* HEIGHT / WIDTH (Hidden or Disabled if RFT or NOS) */}
            {unit !== 'RFT' && unit !== 'NOS' && (
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
            <div className={unit === 'RFT' || unit === 'NOS' ? 'col-6' : 'col-4'}>
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

          {/* LIVE FORMULA CALCULATION DISPLAY */}
          <div className="d-flex justify-content-between align-items-center bg-dark text-white px-3 py-2 rounded-3 shadow-sm">
            <div className="extra-small text-light opacity-75 font-monospace">
              {quantity || 1} &times; {length || 0} {unit !== 'RFT' && unit !== 'NOS' ? `&times; ${height || 0}` : ''}
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

          {/* RECENT SESSION ITEMS MINI DRAWER */}
          {recentItems.length > 0 && (
            <div className="bg-white p-2 rounded-3 border extra-small">
              <div className="fw-bold text-secondary text-uppercase mb-1 d-flex justify-content-between">
                <span>RECENT ENTRIES</span>
                <span className="text-muted">AUTO-SAVED IN SHEET</span>
              </div>
              {recentItems.map((r, i) => (
                <div key={i} className="d-flex justify-content-between py-1 border-bottom border-light">
                  <span className="text-truncate" style={{ maxWidth: '200px' }}>
                    <strong>{r.areaName}:</strong> {r.remark} ({r.dims})
                  </span>
                  <span className={`fw-bold font-monospace ${r.isLess ? 'text-danger' : 'text-success'}`}>
                    {r.isLess ? '-' : ''}{r.total.toFixed(2)} {r.unit}
                  </span>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* ── BIG THUMB-FRIENDLY KEYPAD & SAVE ACTION ── */}
        <div className="bg-white border-top p-2 shadow-lg">
          {/* Fractional measurement shortcuts */}
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
                  style={{ minHeight: '48px' }}
                >
                  {k === 'BACKSPACE' ? <i className="bi bi-backspace-fill"></i> : k}
                </button>
              </div>
            ))}
          </div>

          {/* Action Row: NEXT FIELD & SAVE & ADD NEXT */}
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
              style={{ minHeight: '52px' }}
            >
              <i className="bi bi-check2-circle fs-4"></i>
              <span>SAVE &amp; NEXT ITEM</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
