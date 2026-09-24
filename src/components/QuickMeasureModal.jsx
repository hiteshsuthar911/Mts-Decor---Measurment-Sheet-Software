import React, { useState, useEffect, useRef, useMemo } from 'react';
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

// Categorized standard architectural & civil item descriptions
const CATEGORIZED_ITEM_DESCRIPTIONS = {
  'Flooring & Areas': [
    'Main Floor',
    'Living Room Floor',
    'Master Bedroom Floor',
    'Bedroom 1 Floor',
    'Bedroom 2 Floor',
    'Kitchen Floor',
    'Dining Area Floor',
    'Passage Floor',
    'Balcony Deck Floor',
    'Common Toilet Floor',
    'Master Toilet Floor',
    'Utility Floor',
    'Terrace Floor',
    'Lobby Floor'
  ],
  'Walls, Sills & Skirting': [
    'Skirting',
    'Wall Dado',
    'Wall Dado (Elevation 1)',
    'Wall Dado (Elevation 2)',
    'Door Jamb / Patti',
    'Window Sill / Patti',
    'Window Frame Jamming',
    'Kitchen Platform Top',
    'Platform Fascia Patti',
    'Basin Counter Top',
    'Staircase Tread',
    'Staircase Riser',
    'Landing Tiles'
  ],
  'Openings & Deductions (LESS)': [
    'Door Opening Cut',
    'Window Cutout',
    'Nahani Trap Floor Cut',
    'Switchboard Cutout',
    'Electric Box Cutout',
    'Core Cut / Plumbing Hole',
    'Wash Basin Gala Cut',
    'Column Offset Cut',
    'Beam Offset Cut'
  ],
  'Floor Levels': [
    'Ground Floor',
    '1st Floor',
    '2nd Floor',
    '3rd Floor',
    '4th Floor',
    '5th Floor',
    '6th Floor',
    '7th Floor',
    '8th Floor',
    '9th Floor',
    '10th Floor',
    '11th Floor',
    '12th Floor'
  ]
};

// Standard room options for new sheet creation dropdown
const STANDARD_NEW_ROOM_OPTIONS = [
  'Living Room',
  'Master Bedroom',
  'Bedroom 1',
  'Bedroom 2',
  'Bedroom 3',
  'Kitchen',
  'Dining Area',
  'Common Toilet',
  'Master Toilet',
  'Balcony Deck',
  'Passage',
  'Foyer / Main Entrance',
  'Utility Area',
  'Terrace',
  'Lobby',
  'Store Room',
  'Servant Room'
];

// Standard work categories for room creation dropdown
const STANDARD_CATEGORY_OPTIONS = [
  'Floor Tiles',
  'Kota Stone Filling',
  '1200 X 1800 Wall Tiles',
  '800 X 1600 Wall Tiles',
  '600 X 1200 Wall Tiles',
  'Floor Tile with Koba 1200x1800',
  'Floor Tile with Koba 800x1600',
  'Floor Tile with Koba 600x1200',
  'Design Wall Tiles',
  'Dado Italian Marble',
  'Floor Italian Marble',
  'Skirting',
  'Tiles Skirting',
  'Italian Marble / Stone Shempered Edge Skirting',
  'Main Door Frame Install',
  'Bedroom Door Frame Install',
  'Door Frame Removing',
  'Wall Removing',
  'Plaster Removing',
  'Brick Bat Removing',
  'Tiles Removing',
  'Koba Removing',
  'MS Angle Removing',
  'Kadappa Fitting',
  'Stone Sill',
  'Kitchen Platform',
  'Staircase',
  'Civil & Plaster',
  'Waterproofing'
];

export default function QuickMeasureModal({
  show,
  onClose,
  projectData,
  onUpdateProjectData,
  projectName,
  onOpenPrintView
}) {
  const areas = projectData?.areas || [];
  const [selectedAreaId, setSelectedAreaId] = useState(areas[0]?.id || '');

  // Active navigation tab for Field Mode: 'measure' | 'items' | 'rooms' | 'tools'
  const [fieldTab, setFieldTab] = useState('measure');

  // Input states
  const [isLess, setIsLess] = useState(false);
  const [remark, setRemark] = useState('Main Floor');
  const [unit, setUnit] = useState('SFT');
  const [length, setLength] = useState('');
  const [height, setHeight] = useState('');
  const [quantity, setQuantity] = useState('1');

  // Modal drawers states
  const [showRemarkModal, setShowRemarkModal] = useState(false);
  const [remarkSearchQuery, setRemarkSearchQuery] = useState('');
  const [showSectionBreakModal, setShowSectionBreakModal] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [currentSection, setCurrentSection] = useState('');
  const [roomSearchQuery, setRoomSearchQuery] = useState('');
  const [showNewAreaForm, setShowNewAreaForm] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('Floor Tiles');

  // Keypad active field: 'length' | 'height' | 'quantity'
  const [activeField, setActiveField] = useState('length');
  const [addedCount, setAddedCount] = useState(0);
  const [lastAddedFeedback, setLastAddedFeedback] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

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

  // Current active area object & index
  const currentAreaIndex = Math.max(0, areas.findIndex(a => a.id === selectedAreaId));
  const activeArea = areas[currentAreaIndex] || areas[0] || {};
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

  // Room navigation steppers (Prev / Next)
  const handlePrevRoom = () => {
    if (currentAreaIndex > 0) {
      playClickSound(800);
      setSelectedAreaId(areas[currentAreaIndex - 1].id);
    }
  };

  const handleNextRoom = () => {
    if (currentAreaIndex < areas.length - 1) {
      playClickSound(800);
      setSelectedAreaId(areas[currentAreaIndex + 1].id);
    }
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

    if (currentVal && !currentVal.includes('.')) {
      const wholeFt = parseInt(currentVal, 10) || 0;
      const total = (wholeFt + inchValue / 12).toFixed(2);
      setter(total.replace(/\.00$/, ''));
    } else {
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
    setFieldTab('measure');
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
    if (currentSection) {
      newItem.section = currentSection;
    }

    const calculatedTotal = calculateLineItemTotal(newItem);

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
    setLastAddedFeedback({
      desc: newItem.remark,
      formula: `${newItem.quantity} × ${newItem.length}${newItem.height ? ' × ' + newItem.height : ''}`,
      total: formatNumber(calculatedTotal),
      unit: newItem.unit,
      isLess: newItem.isLess
    });

    setTimeout(() => {
      setLastAddedFeedback(null);
    }, 3000);

    setLength('');
    setHeight('');
    setActiveField('length');
  };

  // 1-Tap Undo Last Item
  const handleUndoLastItem = () => {
    if (!activeArea?.items || activeArea.items.length === 0) return;
    playClickSound(500);
    const items = [...activeArea.items];
    const removed = items.pop();
    const updatedAreas = areas.map(a => a.id === activeArea.id ? { ...a, items } : a);
    onUpdateProjectData(prev => ({ ...prev, areas: updatedAreas }));
    setAddedCount(c => Math.max(0, c - 1));

    if (removed) {
      setRemark(removed.remark || '');
      setLength(removed.length || '');
      setHeight(removed.height || '');
      setQuantity(removed.quantity || '1');
      setIsLess(Boolean(removed.isLess));
      setActiveField('length');
    }
  };

  // Delete line item
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
    setFieldTab('measure');
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

  const currentAreaItems = activeArea.items || [];
  const additions = currentAreaItems.filter(i => !i.isLess);
  const deductions = currentAreaItems.filter(i => i.isLess);

  // Filter rooms for modal search
  const filteredAreas = useMemo(() => {
    if (!roomSearchQuery.trim()) return areas;
    const q = roomSearchQuery.toLowerCase();
    return areas.filter((a, idx) => {
      const name = (a.room || '').toLowerCase();
      const cat = (a.parentCategory || '').toLowerCase();
      const num = `#${idx + 1}`;
      return name.includes(q) || cat.includes(q) || num.includes(q);
    });
  }, [areas, roomSearchQuery]);

  if (!show || !projectData) return null;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column"
      style={{
        zIndex: 10500,
        overflow: 'hidden',
        background: '#f8fafc',
        color: '#0f172a',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
        paddingTop: 'max(0px, env(safe-area-inset-top, 0px))',
        paddingBottom: '0px'
      }}
    >
      {/* ── 1. CLEAN TOP HEADER BAR ── */}
      <header
        className="px-3 py-2 border-bottom flex-shrink-0"
        style={{
          background: '#ffffff',
          borderColor: '#e2e8f0',
          paddingTop: 'max(8px, env(safe-area-inset-top, 44px))'
        }}
      >
        <div className="d-flex align-items-center justify-content-between gap-2">
          {/* Back to Full Spreadsheet Table */}
          <button
            type="button"
            className="btn btn-sm d-flex align-items-center gap-1 px-2.5 py-1 fw-bold text-dark rounded-pill border shadow-2xs"
            style={{
              background: '#ffffff',
              borderColor: '#cbd5e1',
              fontSize: '11px',
              letterSpacing: '0.3px'
            }}
            onClick={onClose}
            title="Return to Spreadsheet Table"
          >
            <i className="bi bi-chevron-left" style={{ fontSize: '12px' }}></i>
            <span>SHEET</span>
          </button>

          {/* Room Title with Prev/Next Steppers */}
          <div className="d-flex align-items-center gap-1 min-w-0">
            <button
              type="button"
              className="btn btn-xs p-1 text-muted border-0"
              onClick={handlePrevRoom}
              disabled={currentAreaIndex <= 0}
              title="Previous Room"
            >
              <i className="bi bi-chevron-left"></i>
            </button>

            <button
              type="button"
              className="btn btn-xs p-0 border-0 bg-transparent text-center min-w-0"
              onClick={() => setFieldTab('rooms')}
              title="Tap to switch room"
            >
              <div className="fw-bolder text-dark text-truncate small" style={{ maxWidth: '160px', fontSize: '13px' }}>
                #{currentAreaIndex + 1} {activeArea.room || 'Room'}
              </div>
              <div className="extra-small text-muted font-monospace" style={{ fontSize: '9.5px' }}>
                {activeArea.parentCategory || 'Floor Tiles'} • {formatNumber(activeAreaTotals.netQty)} {unit}
              </div>
            </button>

            <button
              type="button"
              className="btn btn-xs p-1 text-muted border-0"
              onClick={handleNextRoom}
              disabled={currentAreaIndex >= areas.length - 1}
              title="Next Room"
            >
              <i className="bi bi-chevron-right"></i>
            </button>
          </div>

          {/* Quick Print Shortcut */}
          {onOpenPrintView && (
            <button
              type="button"
              className="btn btn-xs btn-light border rounded-pill p-1 d-flex align-items-center justify-content-center text-dark"
              style={{ width: '28px', height: '28px' }}
              onClick={onOpenPrintView}
              title="Print View / PDF"
            >
              <i className="bi bi-printer-fill" style={{ fontSize: '13px' }}></i>
            </button>
          )}
        </div>
      </header>

      {/* ── 2. SEPARATE FIELD MODE NAVIGATION BAR (CLEAN & MODULAR) ── */}
      <nav
        className="d-flex align-items-center justify-content-around p-1.5 border-bottom flex-shrink-0"
        style={{
          background: '#ffffff',
          borderColor: '#e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          position: 'relative',
          zIndex: 100,
          touchAction: 'manipulation'
        }}
      >
        <button
          type="button"
          className={`btn flex-fill py-2 px-2.5 rounded-2 fw-bold transition-all d-flex align-items-center justify-content-center gap-1.5 ${
            fieldTab === 'measure'
              ? 'bg-primary text-white shadow-xs'
              : 'text-secondary bg-transparent border-0'
          }`}
          style={{ fontSize: '12.5px', cursor: 'pointer', touchAction: 'manipulation', minHeight: '38px' }}
          onClick={() => { playClickSound(950); setFieldTab('measure'); }}
          onTouchEnd={(e) => { e.preventDefault(); playClickSound(950); setFieldTab('measure'); }}
        >
          <i className="bi bi-calculator" style={{ fontSize: '14px' }}></i>
          <span>Measure</span>
        </button>

        <button
          type="button"
          className={`btn flex-fill py-2 px-2.5 rounded-2 fw-bold transition-all d-flex align-items-center justify-content-center gap-1.5 ${
            fieldTab === 'items'
              ? 'bg-primary text-white shadow-xs'
              : 'text-secondary bg-transparent border-0'
          }`}
          style={{ fontSize: '12.5px', cursor: 'pointer', touchAction: 'manipulation', minHeight: '38px' }}
          onClick={() => { playClickSound(950); setFieldTab('items'); }}
          onTouchEnd={(e) => { e.preventDefault(); playClickSound(950); setFieldTab('items'); }}
        >
          <i className="bi bi-list-check" style={{ fontSize: '14px' }}></i>
          <span>Items ({currentAreaItems.length})</span>
        </button>

        <button
          type="button"
          className={`btn flex-fill py-2 px-2.5 rounded-2 fw-bold transition-all d-flex align-items-center justify-content-center gap-1.5 ${
            fieldTab === 'rooms'
              ? 'bg-primary text-white shadow-xs'
              : 'text-secondary bg-transparent border-0'
          }`}
          style={{ fontSize: '12.5px', cursor: 'pointer', touchAction: 'manipulation', minHeight: '38px' }}
          onClick={() => { playClickSound(950); setFieldTab('rooms'); }}
          onTouchEnd={(e) => { e.preventDefault(); playClickSound(950); setFieldTab('rooms'); }}
        >
          <i className="bi bi-door-open" style={{ fontSize: '14px' }}></i>
          <span>Rooms ({areas.length})</span>
        </button>

        <button
          type="button"
          className={`btn flex-fill py-2 px-2.5 rounded-2 fw-bold transition-all d-flex align-items-center justify-content-center gap-1.5 ${
            fieldTab === 'tools'
              ? 'bg-primary text-white shadow-xs'
              : 'text-secondary bg-transparent border-0'
          }`}
          style={{ fontSize: '12.5px', cursor: 'pointer', touchAction: 'manipulation', minHeight: '38px' }}
          onClick={() => { playClickSound(950); setFieldTab('tools'); }}
          onTouchEnd={(e) => { e.preventDefault(); playClickSound(950); setFieldTab('tools'); }}
        >
          <i className="bi bi-gear-fill" style={{ fontSize: '14px' }}></i>
          <span>Tools</span>
        </button>
      </nav>

      {/* ── 3. MAIN WORKSPACE CONTENT BASED ON ACTIVE NAVIGATION TAB ── */}
      <div className="d-flex flex-column flex-grow-1 overflow-hidden" style={{ minHeight: 0 }}>
        {/* ════ TAB 1: MEASURE (THE CLEANEST, POWERFUL COCKPIT) ════ */}
        {fieldTab === 'measure' && (
          <div className="d-flex flex-column flex-grow-1 overflow-hidden" style={{ background: '#f8fafc' }}>
            {/* Context & Description Row (Clean, 1 Line) */}
            <div className="p-2 pb-1.5 flex-shrink-0 d-flex flex-column gap-1.5" style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
              <div className="d-flex align-items-center justify-content-between gap-1.5">
                {/* ADD vs LESS Pill */}
                <div className="d-flex p-0.5 rounded-pill" style={{ background: '#f1f5f9', border: '1px solid #cbd5e1' }}>
                  <button
                    type="button"
                    className="btn btn-xs rounded-pill px-2.5 py-1 fw-bold extra-small transition-all"
                    style={{
                      background: !isLess ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
                      color: !isLess ? '#ffffff' : '#64748b',
                      border: 'none',
                      boxShadow: !isLess ? '0 2px 6px rgba(16, 185, 129, 0.3)' : 'none'
                    }}
                    onClick={() => setIsLess(false)}
                  >
                    + ADD
                  </button>
                  <button
                    type="button"
                    className="btn btn-xs rounded-pill px-2.5 py-1 fw-bold extra-small transition-all"
                    style={{
                      background: isLess ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'transparent',
                      color: isLess ? '#ffffff' : '#64748b',
                      border: 'none',
                      boxShadow: isLess ? '0 2px 6px rgba(239, 68, 68, 0.3)' : 'none'
                    }}
                    onClick={() => setIsLess(true)}
                  >
                    − LESS
                  </button>
                </div>

                {/* Description Pill Dropdown Button */}
                <button
                  type="button"
                  className="btn btn-sm d-flex align-items-center justify-content-between flex-grow-1 px-2.5 py-1 rounded-3 border shadow-2xs text-start bg-white"
                  style={{ borderColor: '#cbd5e1', maxWidth: '210px' }}
                  onClick={() => setShowRemarkModal(true)}
                  title="Choose item description"
                >
                  <div className="d-flex align-items-center gap-1 text-truncate">
                    <i className="bi bi-tag-fill text-primary" style={{ fontSize: '11px' }}></i>
                    <span className="fw-bold text-dark text-truncate small" style={{ fontSize: '12px' }}>
                      {remark || 'Main Floor'}
                    </span>
                  </div>
                  <i className="bi bi-chevron-down text-muted ms-1" style={{ fontSize: '11px' }}></i>
                </button>

                {/* Voice Dictation Button */}
                <button
                  type="button"
                  className={`btn btn-xs p-1.5 rounded-circle border d-flex align-items-center justify-content-center ${
                    isListening ? 'btn-danger text-white' : 'btn-light text-muted'
                  }`}
                  style={{ width: '32px', height: '32px', borderColor: '#cbd5e1' }}
                  onClick={handleToggleVoice}
                  title="Voice Dictation"
                >
                  <i className={`bi ${isListening ? 'bi-mic-fill' : 'bi-mic'} ${isListening ? 'text-white' : 'text-danger'}`} style={{ fontSize: '14px' }}></i>
                </button>
              </div>

              {/* Quick Preset Chips */}
              <div className="d-flex align-items-center gap-1 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none', whiteSpace: 'nowrap' }}>
                {['Main Floor', 'Skirting', 'Wall Dado', 'Door Jamb', 'Window Sill', 'Kitchen Top'].map((chip, i) => (
                  <button
                    key={i}
                    type="button"
                    className="btn btn-xs rounded-pill extra-small px-2 py-0.5 text-nowrap transition-all border"
                    style={{
                      background: remark === chip ? '#2563eb' : '#ffffff',
                      color: remark === chip ? '#ffffff' : '#475569',
                      borderColor: remark === chip ? '#2563eb' : '#e2e8f0',
                      fontSize: '10.5px',
                      fontWeight: 600
                    }}
                    onClick={() => {
                      playClickSound(1000);
                      setRemark(chip);
                    }}
                  >
                    {chip}
                  </button>
                ))}
                <button
                  type="button"
                  className="btn btn-xs rounded-pill extra-small px-2 py-0.5 text-nowrap fw-bold text-primary border"
                  style={{ background: '#eff6ff', borderColor: '#bfdbfe', fontSize: '10.5px' }}
                  onClick={() => setShowRemarkModal(true)}
                >
                  ▾ More
                </button>
              </div>
            </div>

            {/* Live Trust Banner (Shows Instant Feedback & Running Total) */}
            <div className="px-2.5 pt-1 flex-shrink-0">
              <div className="p-1.5 px-2 rounded-2 border d-flex align-items-center justify-content-between extra-small bg-white" style={{ borderColor: '#e2e8f0' }}>
                <div className="d-flex align-items-center gap-1.5 font-monospace">
                  <span className="fw-bold text-muted text-uppercase" style={{ fontSize: '9px' }}>NET TOTAL:</span>
                  <span className="fw-bolder text-primary" style={{ fontSize: '13px' }}>{formatNumber(activeAreaTotals.netQty)} {unit}</span>
                  <span className="text-muted">({currentAreaItems.length} items)</span>
                </div>

                {lastAddedFeedback && (
                  <span className="fw-bold text-success animate-fade" style={{ fontSize: '10.5px' }}>
                    ✓ Saved #{currentAreaItems.length} ({lastAddedFeedback.total} {lastAddedFeedback.unit})
                  </span>
                )}
              </div>
            </div>

            {/* ── THE HERO DIMENSION HUD (100% UNOBSTRUCTED, SPACIOUS & CLEAN) ── */}
            <div className="px-2.5 py-1.5 flex-grow-1 d-flex flex-column justify-content-center">
              <div
                className="p-2.5 rounded-4 shadow-sm d-flex flex-column justify-content-between"
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  minHeight: '135px'
                }}
              >
                {/* 3 HUD Tiles */}
                <div className="row g-2 text-center align-items-stretch">
                  {/* LENGTH */}
                  <div className={isLengthUnit(unit) || isCountUnit(unit) ? 'col-6' : 'col-4'}>
                    <div
                      className="p-2 rounded-3 transition-all h-100 d-flex flex-column justify-content-center"
                      style={{
                        cursor: 'pointer',
                        background: activeField === 'length' ? '#eff6ff' : '#f8fafc',
                        border: activeField === 'length' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                        boxShadow: activeField === 'length' ? '0 0 10px rgba(37, 99, 235, 0.15)' : 'none'
                      }}
                      onClick={() => setActiveField('length')}
                    >
                      <div
                        className="extra-small fw-bold text-uppercase"
                        style={{
                          fontSize: '10px',
                          letterSpacing: '0.4px',
                          color: activeField === 'length' ? '#2563eb' : '#64748b'
                        }}
                      >
                        LENGTH ({unit === 'SQM' || unit === 'RMT' ? 'M' : 'FT'})
                      </div>
                      <div
                        className="fs-3 fw-bolder font-monospace mt-0.5 text-truncate"
                        style={{ color: activeField === 'length' ? '#1d4ed8' : '#0f172a' }}
                      >
                        {length || <span className="opacity-25 text-muted">0.00</span>}
                      </div>
                    </div>
                  </div>

                  {/* HEIGHT / WIDTH */}
                  {!isLengthUnit(unit) && !isCountUnit(unit) && (
                    <div className="col-4">
                      <div
                        className="p-2 rounded-3 transition-all h-100 d-flex flex-column justify-content-center"
                        style={{
                          cursor: 'pointer',
                          background: activeField === 'height' ? '#eff6ff' : '#f8fafc',
                          border: activeField === 'height' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                          boxShadow: activeField === 'height' ? '0 0 10px rgba(37, 99, 235, 0.15)' : 'none'
                        }}
                        onClick={() => setActiveField('height')}
                      >
                        <div
                          className="extra-small fw-bold text-uppercase"
                          style={{
                            fontSize: '10px',
                            letterSpacing: '0.4px',
                            color: activeField === 'height' ? '#2563eb' : '#64748b'
                          }}
                        >
                          HEIGHT/WIDTH
                        </div>
                        <div
                          className="fs-3 fw-bolder font-monospace mt-0.5 text-truncate"
                          style={{ color: activeField === 'height' ? '#1d4ed8' : '#0f172a' }}
                        >
                          {height || <span className="opacity-25 text-muted">0.00</span>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* QUANTITY */}
                  <div className={isLengthUnit(unit) || isCountUnit(unit) ? 'col-6' : 'col-4'}>
                    <div
                      className="p-2 rounded-3 transition-all h-100 d-flex flex-column justify-content-center"
                      style={{
                        cursor: 'pointer',
                        background: activeField === 'quantity' ? '#eff6ff' : '#f8fafc',
                        border: activeField === 'quantity' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                        boxShadow: activeField === 'quantity' ? '0 0 10px rgba(37, 99, 235, 0.15)' : 'none'
                      }}
                      onClick={() => setActiveField('quantity')}
                    >
                      <div
                        className="extra-small fw-bold text-uppercase"
                        style={{
                          fontSize: '10px',
                          letterSpacing: '0.4px',
                          color: activeField === 'quantity' ? '#2563eb' : '#64748b'
                        }}
                      >
                        QTY (NOS)
                      </div>
                      <div
                        className="fs-3 fw-bolder font-monospace mt-0.5 text-truncate"
                        style={{ color: activeField === 'quantity' ? '#1d4ed8' : '#0f172a' }}
                      >
                        {quantity || '1'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Formula Banner */}
                <div
                  className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top px-1"
                  style={{ borderColor: '#f1f5f9' }}
                >
                  <div className="extra-small text-muted font-monospace" style={{ fontSize: '11.5px' }}>
                    {quantity || 1} × {length || 0} {!isLengthUnit(unit) && !isCountUnit(unit) ? `× ${height || 0}` : ''}
                  </div>
                  <div className="d-flex align-items-baseline gap-1.5">
                    <span className={`extra-small fw-bold text-uppercase ${isLess ? 'text-danger' : 'text-primary'}`} style={{ fontSize: '10px' }}>
                      {isLess ? 'DEDUCT:' : 'LINE TOTAL:'}
                    </span>
                    <span className={`fs-5 fw-bolder font-monospace ${isLess ? 'text-danger' : 'text-success'}`}>
                      {isLess ? '−' : ''}{liveTotal.toFixed(2)}
                    </span>
                    <span className="extra-small text-muted" style={{ fontSize: '10px' }}>{unit}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── KEYPAD & INCH RIBBON CONSOLE (PINNED TO BOTTOM) ── */}
            <div
              className="border-top px-3 pt-2 shadow-lg flex-shrink-0"
              style={{
                background: '#ffffff',
                borderColor: '#e2e8f0',
                paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))'
              }}
            >
              {/* Inch Tape Ribbon */}
              <div className="d-flex gap-1 overflow-x-auto mb-2 pb-0.5" style={{ scrollbarWidth: 'none', whiteSpace: 'nowrap' }}>
                {[
                  { label: '1"', in: 1 },
                  { label: '2"', in: 2 },
                  { label: '3"', in: 3 },
                  { label: '4"', in: 4 },
                  { label: '5"', in: 5 },
                  { label: '6"', in: 6 },
                  { label: '7"', in: 7 },
                  { label: '8"', in: 8 },
                  { label: '9"', in: 9 },
                  { label: '10"', in: 10 },
                  { label: '11"', in: 11 },
                ].map(inch => (
                  <button
                    key={inch.in}
                    type="button"
                    className="btn btn-xs rounded-pill py-1 px-2.5 extra-small fw-bold border shadow-2xs"
                    style={{
                      background: '#f8fafc',
                      borderColor: '#cbd5e1',
                      color: '#334155',
                      fontSize: '11px'
                    }}
                    onClick={() => handleApplyInches(inch.in)}
                    title={`Apply ${inch.label} as decimal`}
                  >
                    {inch.label}
                  </button>
                ))}

                <button
                  type="button"
                  className="btn btn-xs rounded-pill py-1 px-2.5 extra-small fw-bold text-primary border shadow-2xs"
                  style={{ background: '#eff6ff', borderColor: '#bfdbfe', fontSize: '11px' }}
                  onClick={() => handleKeypadPress('+0.5')}
                  title="Add 6 inches (0.50 ft)"
                >
                  ½" (6")
                </button>
                <button
                  type="button"
                  className="btn btn-xs rounded-pill py-1 px-2.5 extra-small fw-bold text-primary border shadow-2xs"
                  style={{ background: '#eff6ff', borderColor: '#bfdbfe', fontSize: '11px' }}
                  onClick={() => handleKeypadPress('+0.25')}
                  title="Add 3 inches (0.25 ft)"
                >
                  ¼" (3")
                </button>
                <button
                  type="button"
                  className="btn btn-xs rounded-pill py-1 px-2.5 extra-small fw-bold text-primary border shadow-2xs"
                  style={{ background: '#eff6ff', borderColor: '#bfdbfe', fontSize: '11px' }}
                  onClick={() => handleKeypadPress('+0.75')}
                  title="Add 9 inches (0.75 ft)"
                >
                  ¾" (9")
                </button>
              </div>

              {/* 3x4 iOS Numeric Keypad Grid */}
              <div className="row g-1.5 mb-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'BACKSPACE'].map((k) => (
                  <div className="col-4" key={k}>
                    <button
                      type="button"
                      className="btn w-100 fw-bold font-monospace d-flex align-items-center justify-content-center user-select-none shadow-2xs"
                      style={{
                        height: '46px',
                        borderRadius: '12px',
                        fontSize: k === 'BACKSPACE' ? '18px' : '21px',
                        background: k === 'BACKSPACE' ? '#fef2f2' : '#ffffff',
                        border: k === 'BACKSPACE' ? '1px solid #fecaca' : '1px solid #cbd5e1',
                        color: k === 'BACKSPACE' ? '#dc2626' : '#0f172a',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                      }}
                      onClick={() => handleKeypadPress(k)}
                    >
                      {k === 'BACKSPACE' ? <i className="bi bi-backspace-fill fs-5"></i> : k}
                    </button>
                  </div>
                ))}
              </div>

              {/* Bottom Action Command Bar */}
              <div className="d-flex align-items-center gap-2">
                {/* 1-Tap Undo Last Item */}
                <button
                  type="button"
                  className="btn btn-sm fw-bold extra-small px-3 d-flex align-items-center justify-content-center gap-1 shadow-2xs"
                  style={{
                    height: '48px',
                    borderRadius: '12px',
                    background: '#fef2f2',
                    color: '#dc2626',
                    border: '1px solid #fecaca'
                  }}
                  onClick={handleUndoLastItem}
                  disabled={currentAreaItems.length === 0}
                  title="Undo last recorded item"
                >
                  <i className="bi bi-arrow-counterclockwise fs-6"></i>
                  <span>UNDO</span>
                </button>

                {/* Next Field */}
                <button
                  type="button"
                  className="btn btn-sm fw-bold text-uppercase px-3 shadow-2xs"
                  style={{
                    height: '48px',
                    borderRadius: '12px',
                    background: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    minWidth: '78px'
                  }}
                  onClick={handleNextField}
                >
                  NEXT &rarr;
                </button>

                {/* SAVE & NEXT ITEM */}
                <button
                  type="button"
                  className="btn btn-lg flex-grow-1 fw-bolder text-uppercase d-flex align-items-center justify-content-center gap-2 shadow"
                  style={{
                    height: '48px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '15px',
                    letterSpacing: '0.4px',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                  }}
                  onClick={handleSaveAndNext}
                >
                  <i className="bi bi-check2-circle fs-4"></i>
                  <span>SAVE &amp; NEXT</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════ TAB 2: ITEMS (FULL ROOM MEASUREMENT LEDGER) ════ */}
        {fieldTab === 'items' && (
          <div className="d-flex flex-column flex-grow-1 h-100 overflow-hidden" style={{ background: '#ffffff' }}>
            {/* Header Totals */}
            <div className="p-3 border-bottom d-flex align-items-center justify-content-between flex-shrink-0" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
              <div>
                <span className="extra-small text-muted text-uppercase d-block fw-bold" style={{ fontSize: '10px' }}>Active Room Net Total</span>
                <span className="fs-3 fw-bolder font-monospace text-primary">
                  {formatNumber(activeAreaTotals.netQty)} <span className="fs-6 text-muted">{unit}</span>
                </span>
              </div>
              <div className="d-flex gap-3 text-end">
                <div>
                  <span className="extra-small text-success text-uppercase d-block fw-bold" style={{ fontSize: '9.5px' }}>Total Add</span>
                  <span className="font-monospace small fw-bold text-success">+{formatNumber(activeAreaTotals.addQty)}</span>
                </div>
                <div>
                  <span className="extra-small text-danger text-uppercase d-block fw-bold" style={{ fontSize: '9.5px' }}>Total Less</span>
                  <span className="font-monospace small fw-bold text-danger">−{formatNumber(activeAreaTotals.lessQty)}</span>
                </div>
              </div>
            </div>

            {/* Scrollable Items Table */}
            <div className="flex-grow-1 overflow-auto p-2">
              <table className="table table-sm table-bordered table-hover align-middle mb-0" style={{ fontSize: '12px' }}>
                <thead className="table-light text-uppercase extra-small text-dark sticky-top">
                  <tr>
                    <th style={{ width: '32px' }} className="text-center">#</th>
                    <th style={{ width: '48px' }} className="text-center">Type</th>
                    <th>Description</th>
                    <th className="text-center" style={{ width: '38px' }}>Qty</th>
                    <th className="text-end" style={{ width: '52px' }}>L</th>
                    <th className="text-end" style={{ width: '52px' }}>H/W</th>
                    <th className="text-end" style={{ width: '64px' }}>Total</th>
                    <th style={{ width: '32px' }} className="text-center"></th>
                  </tr>
                </thead>
                <tbody>
                  {additions.map((item, idx) => {
                    const lineTotal = calculateLineItemTotal(item);
                    return (
                      <tr key={item.id} className="table-success-subtle">
                        <td className="text-center text-muted small">{idx + 1}</td>
                        <td className="text-center">
                          <span className="badge bg-success text-white extra-small">ADD</span>
                        </td>
                        <td className="fw-semibold text-truncate text-dark" style={{ maxWidth: '130px' }}>
                          {item.remark || 'Work Item'}
                        </td>
                        <td className="text-center font-monospace">{item.quantity || 1}</td>
                        <td className="text-end font-monospace">{item.length || '-'}</td>
                        <td className="text-end font-monospace">{item.height || '-'}</td>
                        <td className="text-end font-monospace fw-bold text-success">+{formatNumber(lineTotal)}</td>
                        <td className="text-center p-0">
                          <button
                            type="button"
                            className="btn btn-link text-danger p-0"
                            onClick={() => handleDeleteItem(item.id)}
                            title="Delete item"
                          >
                            <i className="bi bi-trash" style={{ fontSize: '13px' }}></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {deductions.map((dItem, dIdx) => {
                    const lineTotal = calculateLineItemTotal(dItem);
                    return (
                      <tr key={dItem.id} className="table-danger-subtle">
                        <td className="text-center text-danger small">L{dIdx + 1}</td>
                        <td className="text-center">
                          <span className="badge bg-danger text-white extra-small">LESS</span>
                        </td>
                        <td className="fw-semibold text-danger text-truncate" style={{ maxWidth: '130px' }}>
                          {dItem.remark || 'Deduction'}
                        </td>
                        <td className="text-center font-monospace text-danger">{dItem.quantity || 1}</td>
                        <td className="text-end font-monospace text-danger">{dItem.length || '-'}</td>
                        <td className="text-end font-monospace text-danger">{dItem.height || '-'}</td>
                        <td className="text-end font-monospace fw-bold text-danger">−{formatNumber(lineTotal)}</td>
                        <td className="text-center p-0">
                          <button
                            type="button"
                            className="btn btn-link text-danger p-0"
                            onClick={() => handleDeleteItem(dItem.id)}
                            title="Delete deduction"
                          >
                            <i className="bi bi-trash" style={{ fontSize: '13px' }}></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {currentAreaItems.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-5 text-muted">
                        <div className="fs-1 mb-2 opacity-50">📐</div>
                        <h6 className="fw-bold text-uppercase">No items in this room yet</h6>
                        <p className="extra-small mb-0">Switch to Measure tab to start recording measurements.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Quick Action to return to Measure */}
            <div className="p-2.5 border-top text-center flex-shrink-0" style={{ background: '#ffffff', borderColor: '#e2e8f0', paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))' }}>
              <button
                type="button"
                className="btn btn-primary w-100 py-2.5 fw-bold text-uppercase rounded-pill shadow-xs"
                onClick={() => setFieldTab('measure')}
              >
                &larr; Return to Keypad Measure
              </button>
            </div>
          </div>
        )}

        {/* ════ TAB 3: ROOMS (THE 50-SHEET MANAGER & SEARCH) ════ */}
        {fieldTab === 'rooms' && (
          <div className="d-flex flex-column flex-grow-1 h-100 overflow-hidden" style={{ background: '#f8fafc' }}>
            {/* Search & New Room Button */}
            <div className="p-2.5 border-bottom flex-shrink-0 d-flex gap-2" style={{ background: '#ffffff' }}>
              <div className="position-relative flex-grow-1">
                <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-2.5 text-muted"></i>
                <input
                  type="text"
                  className="form-control form-control-sm ps-5 rounded-pill"
                  placeholder="Search all 50 sheets..."
                  value={roomSearchQuery}
                  onChange={(e) => setRoomSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>

              <button
                type="button"
                className="btn btn-sm btn-primary rounded-pill px-3 fw-bold extra-small text-nowrap"
                onClick={() => setShowNewAreaForm(!showNewAreaForm)}
              >
                {showNewAreaForm ? '✕ Close' : '+ New Room'}
              </button>
            </div>

            {/* New Room Creation Panel with Dropdowns */}
            {showNewAreaForm && (
              <div className="p-3 border-bottom flex-shrink-0" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <div className="d-flex align-items-center justify-content-between mb-2 pb-1 border-bottom">
                  <div className="fw-bold extra-small text-uppercase text-primary d-flex align-items-center gap-1.5">
                    <i className="bi bi-plus-circle-fill"></i>
                    <span>Create New Room / Sheet</span>
                  </div>
                  <button
                    type="button"
                    className="btn-close extra-small"
                    style={{ fontSize: '9px' }}
                    onClick={() => setShowNewAreaForm(false)}
                  ></button>
                </div>

                {/* 1. Room Name Dropdown Selector */}
                <div className="mb-2">
                  <label className="extra-small fw-bold text-muted text-uppercase mb-1 d-block" style={{ fontSize: '10px' }}>
                    Select Room / Space (Dropdown)
                  </label>
                  <select
                    className="form-select form-select-sm fw-bold text-dark rounded-3"
                    style={{
                      background: '#ffffff',
                      borderColor: '#2563eb',
                      fontSize: '13px',
                      boxShadow: '0 1px 3px rgba(37, 99, 235, 0.08)'
                    }}
                    value={STANDARD_NEW_ROOM_OPTIONS.includes(newRoomName) ? newRoomName : (newRoomName ? '__CUSTOM__' : '')}
                    onChange={(e) => {
                      if (e.target.value === '__CUSTOM__') {
                        setNewRoomName('');
                      } else {
                        setNewRoomName(e.target.value);
                      }
                    }}
                  >
                    <option value="">Choose Standard Room / Space...</option>
                    {STANDARD_NEW_ROOM_OPTIONS.map((rm, idx) => (
                      <option key={idx} value={rm}>{rm}</option>
                    ))}
                    <option value="__CUSTOM__">✍ Custom Room Name...</option>
                  </select>
                </div>

                {/* Custom Room Name Input */}
                <div className="mb-2">
                  <input
                    type="text"
                    className="form-control form-control-sm rounded-3 fw-semibold"
                    placeholder="Or type custom room name..."
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    style={{ fontSize: '12.5px', borderColor: '#cbd5e1' }}
                  />
                </div>

                {/* Quick 1-Tap Room Pills */}
                <div className="d-flex flex-wrap gap-1 mb-2.5">
                  {['Living Room', 'Master Bedroom', 'Bedroom 1', 'Kitchen', 'Common Toilet', 'Balcony Deck', 'Passage'].map((rm, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`btn btn-xs rounded-pill extra-small py-0.5 px-2 border transition-all ${
                        newRoomName === rm ? 'btn-primary text-white border-primary shadow-xs fw-bold' : 'btn-light text-dark border-slate-200'
                      }`}
                      style={{ fontSize: '11px' }}
                      onClick={() => setNewRoomName(rm)}
                    >
                      {rm}
                    </button>
                  ))}
                </div>

                {/* 2. Category Dropdown Selector */}
                <div className="mb-3">
                  <label className="extra-small fw-bold text-muted text-uppercase mb-1 d-block" style={{ fontSize: '10px' }}>
                    Work Category / Specification (Dropdown)
                  </label>
                  <select
                    className="form-select form-select-sm fw-semibold text-dark rounded-3"
                    style={{ background: '#ffffff', borderColor: '#cbd5e1', fontSize: '12.5px' }}
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                  >
                    {STANDARD_CATEGORY_OPTIONS.map((cat, idx) => (
                      <option key={idx} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-light border flex-fill rounded-pill fw-semibold"
                    onClick={() => setShowNewAreaForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary flex-fill rounded-pill fw-bold shadow-xs"
                    onClick={handleCreateNewArea}
                    disabled={!newRoomName.trim()}
                  >
                    + Add Room Sheet
                  </button>
                </div>
              </div>
            )}

            {/* List of all sheets */}
            <div className="flex-grow-1 overflow-auto p-2">
              <div className="d-flex flex-column gap-1.5">
                {filteredAreas.map((a, idx) => {
                  const isCurrent = a.id === activeArea?.id;
                  const count = (a.items || []).length;
                  const totals = calculateAreaTotals(a);

                  return (
                    <button
                      key={a.id}
                      type="button"
                      className={`btn text-start p-2.5 rounded-3 border d-flex align-items-center justify-content-between transition-all ${
                        isCurrent
                          ? 'border-primary shadow-xs'
                          : 'border-slate-200 hover-bg-light'
                      }`}
                      style={{
                        background: isCurrent ? '#eff6ff' : '#ffffff',
                        borderColor: isCurrent ? '#2563eb' : '#e2e8f0'
                      }}
                      onClick={() => {
                        setSelectedAreaId(a.id);
                        setFieldTab('measure');
                      }}
                    >
                      <div className="min-w-0 flex-grow-1">
                        <div className="d-flex align-items-center gap-2">
                          <span className={`badge rounded-pill extra-small fw-bold ${isCurrent ? 'bg-primary text-white' : 'bg-secondary bg-opacity-10 text-secondary'}`}>
                            #{idx + 1}
                          </span>
                          <span className={`fw-bold text-truncate ${isCurrent ? 'text-primary' : 'text-dark'}`} style={{ fontSize: '13.5px' }}>
                            {a.room || 'Unnamed Area'}
                          </span>
                          {isCurrent && (
                            <span className="badge bg-primary text-white extra-small px-1.5 py-0.5">CURRENT</span>
                          )}
                        </div>

                        <div className="d-flex align-items-center gap-2 text-muted extra-small mt-1" style={{ fontSize: '11px' }}>
                          <span>{a.parentCategory || 'Floor Tiles'}</span>
                          {a.floor && <span>• Flr: {a.floor}</span>}
                          {a.flat && <span>• Flat: {a.flat}</span>}
                          <span>• {count} items</span>
                        </div>
                      </div>

                      <div className="text-end ps-2 flex-shrink-0">
                        <div className="fw-bold font-monospace text-primary" style={{ fontSize: '14px' }}>
                          {formatNumber(totals.netQty)}
                        </div>
                        <div className="extra-small text-muted">{a.items?.[0]?.unit || 'SFT'}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ════ TAB 4: TOOLS (ALL EXTRA FEATURES ORGANIZED) ════ */}
        {fieldTab === 'tools' && (
          <div className="d-flex flex-column flex-grow-1 h-100 overflow-auto p-3" style={{ background: '#f8fafc' }}>
            <div className="d-flex flex-column gap-3" style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
              {/* Tool 1: 1-Tap Architectural Cutout Presets */}
              <div className="p-3 bg-white rounded-3 border shadow-2xs">
                <div className="fw-bold text-dark mb-1 d-flex align-items-center gap-1.5">
                  <i className="bi bi-door-open-fill text-warning"></i>
                  <span>1-Tap Cutout Presets (Auto-Less)</span>
                </div>
                <p className="extra-small text-muted mb-2.5">
                  Tap any preset to apply standard door/window opening deductions:
                </p>
                <div className="d-flex flex-wrap gap-1.5">
                  {ARCHITECTURAL_CUTOUTS.map((cut, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="btn btn-xs rounded-2 py-1.5 px-2.5 extra-small fw-semibold text-start border shadow-2xs bg-white text-dark"
                      style={{ borderColor: '#cbd5e1' }}
                      onClick={() => handleApplyCutoutPreset(cut)}
                    >
                      <span className="fw-bold text-danger me-1">−{cut.area}</span>
                      <span>{cut.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tool 2: Section Break */}
              <div className="p-3 bg-white rounded-3 border shadow-2xs">
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <div className="fw-bold text-dark d-flex align-items-center gap-1.5">
                    <i className="bi bi-layout-split text-primary"></i>
                    <span>Break Section</span>
                  </div>
                  {currentSection && (
                    <span className="badge bg-warning text-dark extra-small">Active: {currentSection}</span>
                  )}
                </div>
                <p className="extra-small text-muted mb-2.5">
                  Segment measurements into distinct architectural elevations (e.g. French Window, Corner Opening, Door Patti).
                </p>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary fw-bold w-100 py-2 rounded-pill"
                  onClick={() => setShowSectionBreakModal(true)}
                >
                  <i className="bi bi-layout-split me-1"></i>
                  {currentSection ? `Switch Section (${currentSection})` : '+ Add Section Break'}
                </button>
              </div>

              {/* Tool 3: Flat No & Floor No Editor */}
              <div className="p-3 bg-white rounded-3 border shadow-2xs">
                <div className="fw-bold text-dark mb-1 d-flex align-items-center gap-1.5">
                  <i className="bi bi-building text-info"></i>
                  <span>Flat &amp; Floor Identifiers</span>
                </div>
                <div className="row g-2 mt-1">
                  <div className="col-6">
                    <label className="extra-small text-muted fw-bold text-uppercase mb-1">Flat No.</label>
                    <input
                      type="text"
                      className="form-control form-control-sm rounded-3"
                      placeholder="e.g. 101"
                      value={activeArea.flat || ''}
                      onChange={(e) => handleUpdateActiveAreaField('flat', e.target.value)}
                    />
                  </div>
                  <div className="col-6">
                    <label className="extra-small text-muted fw-bold text-uppercase mb-1">Floor No.</label>
                    <input
                      type="text"
                      className="form-control form-control-sm rounded-3"
                      placeholder="e.g. 1"
                      value={activeArea.floor || ''}
                      onChange={(e) => handleUpdateActiveAreaField('floor', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Tool 4: Measurement Units */}
              <div className="p-3 bg-white rounded-3 border shadow-2xs">
                <div className="fw-bold text-dark mb-1 d-flex align-items-center gap-1.5">
                  <i className="bi bi-rulers text-success"></i>
                  <span>Measurement Unit</span>
                </div>
                <p className="extra-small text-muted mb-2">
                  Select the standard unit for this measurement session:
                </p>
                <div className="d-flex gap-1.5">
                  {UNIT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`btn btn-sm flex-fill fw-bold rounded-2 ${
                        unit === opt.value ? 'btn-primary text-white shadow-xs' : 'btn-light border text-dark'
                      }`}
                      onClick={() => setUnit(opt.value)}
                    >
                      {opt.value}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tool 5: Sound & Audio Feedback */}
              <div className="p-3 bg-white rounded-3 border shadow-2xs d-flex align-items-center justify-content-between">
                <div>
                  <div className="fw-bold text-dark">Audio Click Feedback</div>
                  <div className="extra-small text-muted">Audible beep confirmation for noisy construction sites</div>
                </div>
                <div className="form-check form-switch fs-5">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={soundEnabled}
                    onChange={(e) => setSoundEnabled(e.target.checked)}
                  />
                </div>
              </div>

              {/* Tool 6: Return to Keypad CTA */}
              <button
                type="button"
                className="btn btn-primary w-100 py-2.5 fw-bold text-uppercase rounded-pill shadow-xs"
                onClick={() => setFieldTab('measure')}
              >
                &larr; Back to Keypad Measure
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── DESCRIPTION BOTTOM SHEET MODAL (SLIDES UP FROM BOTTOM, NEVER COVERS HUD) ── */}
      {showRemarkModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column justify-content-end p-0"
          style={{ zIndex: 12000, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(6px)' }}
          onClick={() => setShowRemarkModal(false)}
        >
          <div
            className="w-100 bg-white shadow-2xl d-flex flex-column"
            style={{
              maxHeight: '75vh',
              borderRadius: '24px 24px 0 0',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-3 border-bottom d-flex align-items-center justify-content-between flex-shrink-0" style={{ background: '#f8fafc' }}>
              <div>
                <h6 className="fw-bolder text-dark mb-0 d-flex align-items-center gap-1.5">
                  <i className="bi bi-tag-fill text-primary"></i>
                  <span>Select Item Description</span>
                </h6>
                <p className="extra-small text-muted mb-0 mt-0.5">
                  Tap any description to apply immediately
                </p>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowRemarkModal(false)}
              ></button>
            </div>

            {/* Live Search Input */}
            <div className="p-2.5 border-bottom flex-shrink-0" style={{ background: '#ffffff' }}>
              <div className="position-relative">
                <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-2.5 text-muted"></i>
                <input
                  type="text"
                  className="form-control form-control-sm ps-5 rounded-pill"
                  placeholder="Type to filter descriptions..."
                  value={remarkSearchQuery}
                  onChange={(e) => setRemarkSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            {/* Categorized Options List */}
            <div className="flex-grow-1 overflow-auto p-3">
              <div className="d-flex flex-column gap-3">
                {Object.entries(CATEGORIZED_ITEM_DESCRIPTIONS).map(([category, items]) => {
                  const filtered = items.filter(it => 
                    !remarkSearchQuery.trim() || it.toLowerCase().includes(remarkSearchQuery.toLowerCase())
                  );
                  if (filtered.length === 0) return null;

                  return (
                    <div key={category}>
                      <div className="extra-small fw-bold text-muted text-uppercase mb-1.5" style={{ fontSize: '10px', letterSpacing: '0.4px' }}>
                        {category}
                      </div>
                      <div className="d-flex flex-wrap gap-1.5">
                        {filtered.map((it, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className={`btn btn-sm rounded-pill py-1 px-3 extra-small text-start border transition-all ${
                              remark === it
                                ? 'btn-primary text-white border-primary shadow-xs fw-bold'
                                : 'btn-light text-dark border-slate-200'
                            }`}
                            style={{ fontSize: '12px' }}
                            onClick={() => {
                              playClickSound(1050);
                              setRemark(it);
                              if (category.includes('Deductions') || category.includes('LESS') || it.toLowerCase().includes('cut')) {
                                setIsLess(true);
                              }
                              setShowRemarkModal(false);
                              setRemarkSearchQuery('');
                              setActiveField('length');
                            }}
                          >
                            {it}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION BREAK MODAL ── */}
      {showSectionBreakModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{ zIndex: 12500, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(6px)' }}
        >
          <div
            className="p-4 bg-white shadow-2xl"
            style={{
              maxWidth: '420px',
              width: '100%',
              borderRadius: '20px',
              border: '1px solid #e2e8f0'
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="fw-bold text-dark d-flex align-items-center gap-2">
                <i className="bi bi-layout-split text-warning fs-5"></i>
                <span className="text-uppercase tracking-wide">Break Section</span>
              </div>
              <button type="button" className="btn-close" onClick={() => setShowSectionBreakModal(false)}></button>
            </div>
            <p className="extra-small text-muted mb-3">
              Insert a distinct section header (e.g. French Window, Corner Opening, Door Opening).
            </p>
            <div className="mb-3">
              <label className="extra-small text-dark text-uppercase fw-bold mb-1">Section Title</label>
              <input
                type="text"
                className="form-control form-control-sm rounded-3 border-secondary-subtle"
                placeholder="e.g. French Window (Balcony)"
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                autoFocus
              />
            </div>
            <div className="d-flex flex-wrap gap-1.5 mb-4">
              {['Window 1 (French)', 'Window 2 (Corner L)', 'Main Door', 'Study Nook', 'Wardrobe Wall', 'Balcony Deck'].map((s, i) => (
                <button
                  key={i}
                  type="button"
                  className="btn btn-xs rounded-pill extra-small btn-light border"
                  onClick={() => setNewSectionTitle(s)}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-sm btn-light border flex-fill rounded-pill"
                onClick={() => setShowSectionBreakModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-sm flex-fill rounded-pill fw-bold text-dark"
                style={{ background: 'linear-gradient(135deg, #fde047 0%, #eab308 100%)', border: 'none' }}
                onClick={() => {
                  if (newSectionTitle.trim()) {
                    const title = newSectionTitle.trim();
                    setCurrentSection(title);
                    const breakItem = createEmptyItem(unit);
                    breakItem.remark = `══ SECTION: ${title.toUpperCase()} ══`;
                    breakItem.quantity = '0';
                    breakItem.length = '0';
                    breakItem.height = '0';
                    breakItem.section = title;
                    breakItem.isSectionHeader = true;

                    const updatedAreas = areas.map(a => {
                      if (a.id === activeArea?.id) {
                        return { ...a, items: [...(a.items || []), breakItem] };
                      }
                      return a;
                    });
                    onUpdateProjectData(prev => ({ ...prev, areas: updatedAreas }));
                    setNewSectionTitle('');
                    setShowSectionBreakModal(false);
                    setFieldTab('measure');
                  }
                }}
              >
                Apply Section
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
