import React, { useState, useMemo } from 'react';
import { WORK_CATEGORIES, CATEGORIZED_WORK_TYPES, COMMON_ROOM_AREAS, UNIT_OPTIONS, REMARK_OPTIONS, CATEGORIZED_REMARKS } from '../data/categories';
import LineItemRow from './LineItemRow';
import { calculateAreaTotals, formatNumber, formatCurrency } from '../utils/calculations';
import { createEmptyItem } from '../data/sampleData';
import MultiFloorReplicateModal, { parseFloorNumber, formatFloorName } from './MultiFloorReplicateModal';

export default function AreaBlock({
  area = {},
  index = 0,
  totalAreas = 1,
  sheetPageNumber,
  billingMode,
  currencySymbol = '₹',
  onChangeArea,
  onDeleteArea,
  onDuplicateArea,
  onMoveArea,
  readOnly
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showReplicateModal, setShowReplicateModal] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [customCategories, setCustomCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('mts_custom_work_categories');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const allCategories = useMemo(() => {
    const list = [...WORK_CATEGORIES];
    customCategories.forEach((cat) => {
      if (!list.includes(cat)) list.push(cat);
    });
    return list;
  }, [customCategories]);

  const handleAddCustomCategory = (categoryName) => {
    if (!categoryName || !categoryName.trim()) return;
    const trimmed = categoryName.trim();
    if (!allCategories.includes(trimmed)) {
      const updated = [...customCategories, trimmed];
      setCustomCategories(updated);
      try {
        localStorage.setItem('mts_custom_work_categories', JSON.stringify(updated));
      } catch {}
    }
    handleFieldChange('parentCategory', trimmed);
  };

  const handlePromptAddCategory = () => {
    const entered = window.prompt('Enter new Work Category / Detail name:');
    if (entered) handleAddCustomCategory(entered);
  };

  const [customRooms, setCustomRooms] = useState(() => {
    try {
      const saved = localStorage.getItem('mts_custom_rooms');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const allRooms = useMemo(() => {
    const list = [...COMMON_ROOM_AREAS];
    customRooms.forEach((r) => {
      if (!list.includes(r)) {
        const otherIdx = list.indexOf('Other');
        if (otherIdx !== -1) {
          list.splice(otherIdx, 0, r);
        } else {
          list.push(r);
        }
      }
    });
    return list;
  }, [customRooms]);

  const handlePromptAddRoom = () => {
    const entered = window.prompt('Enter new Description (e.g. Design Wall Tiles, Italian Marble):');
    if (!entered || !entered.trim()) return;
    const trimmed = entered.trim();
    if (!allRooms.includes(trimmed)) {
      const updated = [...customRooms, trimmed];
      setCustomRooms(updated);
      try {
        localStorage.setItem('mts_custom_rooms', JSON.stringify(updated));
      } catch {}
    }
    handleFieldChange('room', trimmed);
  };

  const totals = calculateAreaTotals(area);

  const handleFieldChange = (field, value) => {
    const updated = { ...area, [field]: value };
    onChangeArea(area.id, updated);
  };

  // Next floor auto-detection for 1-click duplication
  const nextFloorInfo = useMemo(() => {
    const items = area.items || [];
    const floorMarkers = [];
    items.forEach((it, idx) => {
      const fNum = parseFloorNumber(it.remark);
      if (fNum !== null) floorMarkers.push({ floorNum: fNum, index: idx, remark: it.remark });
    });

    if (floorMarkers.length === 0) return null;

    const highestFloor = Math.max(...floorMarkers.map((m) => m.floorNum));
    const nextFloorNum = highestFloor + 1;
    if (nextFloorNum > 18) return null;

    let template = [];
    if (floorMarkers.length >= 2) {
      const lastMarker = floorMarkers[floorMarkers.length - 1];
      template = items.slice(lastMarker.index);
    } else {
      template = items.slice(floorMarkers[0].index);
    }

    if (template.length === 0) return null;

    return {
      highestFloor,
      nextFloorNum,
      nextFloorName: formatFloorName(nextFloorNum),
      template
    };
  }, [area.items]);

  const handleQuickAddNextFloor = () => {
    if (!nextFloorInfo || !nextFloorInfo.template.length) return;
    const newItems = nextFloorInfo.template.map((orig, idx) => ({
      ...orig,
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      remark: idx === 0 ? nextFloorInfo.nextFloorName : (parseFloorNumber(orig.remark) ? '' : (orig.remark || ''))
    }));
    onChangeArea(area.id, {
      ...area,
      items: [...(area.items || []), ...newItems]
    });
  };

  const handleApplyReplication = (newGeneratedItems, replaceExisting = false) => {
    onChangeArea(area.id, {
      ...area,
      items: replaceExisting ? newGeneratedItems : [...(area.items || []), ...newGeneratedItems]
    });
  };

  // Line item handlers
  const handleAddItem = (isLess = false) => {
    const defaultUnit = area.items?.length > 0 ? area.items[area.items.length - 1].unit : 'SFT';
    const newItem = createEmptyItem(defaultUnit);
    newItem.isLess = isLess;
    if (isLess) newItem.remark = 'Deduction / Opening';
    onChangeArea(area.id, {
      ...area,
      items: [...(area.items || []), newItem]
    });
  };

  const handleChangeItem = (itemId, updatedItem) => {
    const updatedItems = (area.items || []).map(i => i.id === itemId ? updatedItem : i);
    onChangeArea(area.id, { ...area, items: updatedItems });
  };

  const handleDuplicateItem = (itemId) => {
    const targetIdx = (area.items || []).findIndex(i => i.id === itemId);
    if (targetIdx === -1) return;
    const targetItem = area.items[targetIdx];
    const cloned = {
      ...targetItem,
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      remark: `${targetItem.remark} (Copy)`
    };
    const newItems = [...area.items];
    newItems.splice(targetIdx + 1, 0, cloned);
    onChangeArea(area.id, { ...area, items: newItems });
  };

  const handleDeleteItem = (itemId) => {
    if ((area.items || []).length <= 1) {
      if (!confirm('This is the last line item in this area. Remove it?')) return;
    }
    const updatedItems = (area.items || []).filter(i => i.id !== itemId);
    setSelectedItemIds(prev => prev.filter(id => id !== itemId));
    onChangeArea(area.id, { ...area, items: updatedItems });
  };

  const handleMoveItem = (itemId, direction) => {
    const items = area.items || [];
    const idx = items.findIndex(i => i.id === itemId);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;
    const newItems = [...items];
    const [moved] = newItems.splice(idx, 1);
    newItems.splice(targetIdx, 0, moved);
    onChangeArea(area.id, { ...area, items: newItems });
  };

  // Bulk Selection Handlers
  const handleToggleSelectItem = (itemId) => {
    setSelectedItemIds(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const allSelected = (area.items || []).length > 0 && selectedItemIds.length === (area.items || []).length;

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds((area.items || []).map(i => i.id));
    }
  };

  const handleBulkSetUnit = (unit) => {
    if (!selectedItemIds.length) return;
    const updatedItems = (area.items || []).map(i =>
      selectedItemIds.includes(i.id) ? { ...i, unit } : i
    );
    onChangeArea(area.id, { ...area, items: updatedItems });
  };

  const handleBulkSetRemark = (remark) => {
    if (!selectedItemIds.length) return;
    const updatedItems = (area.items || []).map(i =>
      selectedItemIds.includes(i.id) ? { ...i, remark } : i
    );
    onChangeArea(area.id, { ...area, items: updatedItems });
  };

  const handleBulkSetRate = (rate) => {
    if (!selectedItemIds.length) return;
    const updatedItems = (area.items || []).map(i =>
      selectedItemIds.includes(i.id) ? { ...i, rate } : i
    );
    onChangeArea(area.id, { ...area, items: updatedItems });
  };

  const handleBulkDelete = () => {
    if (!selectedItemIds.length) return;
    if (!confirm(`Delete ${selectedItemIds.length} selected line item(s)?`)) return;
    const updatedItems = (area.items || []).filter(i => !selectedItemIds.includes(i.id));
    setSelectedItemIds([]);
    onChangeArea(area.id, { ...area, items: updatedItems });
  };

  // Area title for display
  const areaTitle = [area.floor, area.flat, area.room]
    .filter(Boolean)
    .join(' · ') || 'Untitled Area';
  const categoryLabel = area.parentCategory === 'Other'
    ? (area.customParentCategory || 'Other')
    : (area.parentCategory || 'General Work');

  return (
    <div className="ent-area-block">

      {/* ─── Compact Enterprise Area Header Bar ─────────── */}
      {/* ─── Enterprise Area Header Bar ─────────── */}
      <div className="ent-area-header">
        {/* Top Header Row (Badges on left, Actions on right in mobile; flattened on desktop) */}
        <div className="ent-area-top-row">
          <div className="d-flex align-items-center gap-1.5 flex-shrink-0">
            <span className="ent-area-id-badge">
              <i className="bi bi-grid-3x3 me-1" />
              AREA #{index + 1}
            </span>

            {sheetPageNumber && (
              <span className="ent-area-page-tag d-none d-sm-inline-flex">
                Sheet {sheetPageNumber}
              </span>
            )}
          </div>

          {/* Right: Actions */}
          <div className="ent-area-actions">
            {/* Page break toggle - clean, subtle button */}
            <button
              type="button"
              className={`ent-hdr-btn ${area.startNewPage ? 'ent-hdr-btn--active' : ''}`}
              disabled={readOnly}
              onClick={() => handleFieldChange('startNewPage', !area.startNewPage)}
              title={area.startNewPage ? 'Starts on new sheet page' : 'Click to start this area on a new page'}
            >
              <i className="bi bi-file-earmark-break" />
              <span className="d-none d-xl-inline">{area.startNewPage ? 'Break Active' : 'Break'}</span>
            </button>

            <button
              type="button"
              className="ent-hdr-btn"
              disabled={index === 0 || readOnly}
              onClick={() => onMoveArea(area.id, -1)}
              title="Move Area Up"
            >
              <i className="bi bi-arrow-up" />
            </button>
            <button
              type="button"
              className="ent-hdr-btn"
              disabled={index === totalAreas - 1 || readOnly}
              onClick={() => onMoveArea(area.id, 1)}
              title="Move Area Down"
            >
              <i className="bi bi-arrow-down" />
            </button>
            <button
              type="button"
              className="ent-hdr-btn"
              disabled={readOnly}
              onClick={() => onDuplicateArea(area.id)}
              title="Clone Area"
            >
              <i className="bi bi-copy" />
              <span className="d-none d-sm-inline">Clone</span>
            </button>
            <button
              type="button"
              className="ent-hdr-btn ent-hdr-btn--danger"
              disabled={readOnly}
              onClick={() => onDeleteArea(area.id)}
              title="Delete Area"
            >
              <i className="bi bi-trash3" />
            </button>
            <button
              type="button"
              className="ent-hdr-btn"
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? 'Expand Area Table' : 'Collapse Area Table'}
            >
              <i className={`bi ${isCollapsed ? 'bi-chevron-down' : 'bi-chevron-up'}`} />
            </button>
          </div>
        </div>

        {/* Area Controls (Room, Category, Floor, Unit) */}
        <div className="ent-area-controls">
          {/* Description / Room Dropdown */}
          <div className="ent-meta-item ent-meta-item--room">
            <select
              className="ent-meta-select ent-meta-select-room"
              value={area.room || ''}
              disabled={readOnly}
              onChange={(e) => {
                if (e.target.value === '__ADD_NEW__') {
                  handlePromptAddRoom();
                } else {
                  handleFieldChange('room', e.target.value);
                }
              }}
              title="Select Room / Area Description"
            >
              <option value="" disabled>Select Room / Description...</option>
              {area.room && !allRooms.includes(area.room) && (
                <option value={area.room}>{area.room} (Custom)</option>
              )}
              {allRooms.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
              <option value="__ADD_NEW__">+ Custom Room...</option>
            </select>
          </div>

          {/* Work Category Dropdown */}
          <div className="ent-meta-item ent-meta-item--cat">
            <select
              className="ent-meta-select ent-meta-select-cat"
              value={area.parentCategory || 'Floor Tiles'}
              disabled={readOnly}
              onChange={(e) => {
                if (e.target.value === '__ADD_NEW__') {
                  handlePromptAddCategory();
                } else {
                  handleFieldChange('parentCategory', e.target.value);
                }
              }}
              title="Select Work Category"
            >
              <option value="" disabled>Category...</option>
              {area.parentCategory && !allCategories.includes(area.parentCategory) && (
                <option value={area.parentCategory}>{area.parentCategory} (Custom)</option>
              )}
              {Object.entries(CATEGORIZED_WORK_TYPES).map(([groupTitle, catList]) => (
                <optgroup key={groupTitle} label={groupTitle}>
                  {catList.map((catKey) => (
                    <option key={catKey} value={catKey}>{catKey}</option>
                  ))}
                </optgroup>
              ))}
              {customCategories.length > 0 && (
                <optgroup label="Custom Categories">
                  {customCategories.map((catKey) => (
                    <option key={catKey} value={catKey}>{catKey}</option>
                  ))}
                </optgroup>
              )}
              <option value="__ADD_NEW__">+ Custom Category...</option>
            </select>
          </div>

          {/* Floor Input */}
          <div className="ent-meta-chip">
            <span className="ent-meta-lbl">FLR:</span>
            <input
              type="text"
              className="ent-meta-input"
              style={{ width: '48px' }}
              placeholder="8th"
              value={area.floor || ''}
              disabled={readOnly}
              onChange={(e) => handleFieldChange('floor', e.target.value)}
              title="Floor Number (e.g. 8th, Ground)"
            />
          </div>

          {/* Flat Input */}
          <div className="ent-meta-chip">
            <span className="ent-meta-lbl">UNIT:</span>
            <input
              type="text"
              className="ent-meta-input"
              style={{ width: '52px' }}
              placeholder="801"
              value={area.flat || ''}
              disabled={readOnly}
              onChange={(e) => handleFieldChange('flat', e.target.value)}
              title="Flat / Unit Number (e.g. 801, A-102)"
            />
          </div>
        </div>
      </div>

      {/* Custom Name Prompt Row if 'Other' selected */}
      {!isCollapsed && (area.room === 'Other' || area.parentCategory === 'Other') && (
        <div className="px-3 py-1.5 bg-light border-bottom d-flex gap-2 align-items-center">
          {area.room === 'Other' && (
            <input
              type="text"
              className="form-control form-control-sm"
              style={{ fontSize: '11px', maxWidth: '240px' }}
              placeholder="Enter Custom Room / Area Name"
              value={area.customRoom || ''}
              onChange={(e) => handleFieldChange('customRoom', e.target.value)}
            />
          )}
          {area.parentCategory === 'Other' && (
            <input
              type="text"
              className="form-control form-control-sm"
              style={{ fontSize: '11px', maxWidth: '240px' }}
              placeholder="Enter Custom Work Category"
              value={area.customParentCategory || ''}
              onChange={(e) => handleFieldChange('customParentCategory', e.target.value)}
            />
          )}
        </div>
      )}

      {/* ─── Area Body (Table Grid & Subtotals) ─────────── */}
      {!isCollapsed && (
        <>

          {/* ─── Bulk Selection Toolbar ───────────────── */}
          {selectedItemIds.length > 0 && (
            <div className="ent-bulk-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="ent-bulk-badge">
                  <i className="bi bi-check2-square" />
                  {selectedItemIds.length} item{selectedItemIds.length > 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="ent-bulk-controls">
                {/* Batch Set Unit */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#374151', textTransform: 'uppercase' }}>Unit:</span>
                  <select
                    className="ent-field-select"
                    style={{ width: '100px', fontSize: '11px', padding: '3px 6px' }}
                    onChange={(e) => {
                      if (e.target.value) {
                        handleBulkSetUnit(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>Apply...</option>
                    {UNIT_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.value}</option>
                    ))}
                  </select>
                </div>

                {/* Batch Set Remark */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#374151', textTransform: 'uppercase' }}>Remark:</span>
                  <select
                    className="ent-field-select"
                    style={{ width: '140px', fontSize: '11px', padding: '3px 6px' }}
                    onChange={(e) => {
                      if (e.target.value) {
                        handleBulkSetRemark(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>Apply...</option>
                    {Object.entries(CATEGORIZED_REMARKS).map(([grp, list]) => (
                      <optgroup key={grp} label={grp}>
                        {list.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {/* Batch Set Rate */}
                {billingMode && (
                  <button
                    type="button"
                    className="ent-add-btn ent-add-btn--primary"
                    onClick={() => {
                      const r = window.prompt(`Rate (${currencySymbol}) for ${selectedItemIds.length} items:`);
                      if (r !== null && !isNaN(parseFloat(r))) handleBulkSetRate(parseFloat(r));
                    }}
                  >
                    <i className="bi bi-tag" /> Set Rate
                  </button>
                )}

                {/* Bulk Delete */}
                <button
                  type="button"
                  className="ent-add-btn ent-add-btn--danger"
                  onClick={handleBulkDelete}
                >
                  <i className="bi bi-trash3" /> Delete ({selectedItemIds.length})
                </button>

                <button
                  type="button"
                  className="ent-add-btn ent-add-btn--primary"
                  onClick={() => setSelectedItemIds([])}
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* ─── Mobile Swipe Hint ──────────────────────── */}
          <div className="ent-swipe-hint">
            <span><i className="bi bi-arrow-left-right" style={{ color: '#2563eb' }} /> Scroll to view all columns</span>
            <span style={{ background: '#e2e8f0', borderRadius: '3px', padding: '2px 7px', fontSize: '10px', fontWeight: 700 }}>
              {area.items?.length || 0} rows
            </span>
          </div>

          {/* ─── Data Grid Table ────────────────────────── */}
          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className={`xls-grid-table ${billingMode ? 'billing-active' : ''}`}>
              <thead className="xls-grid-thead">
                <tr>
                  <th className="th-center th-rn">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <input
                        type="checkbox"
                        className="xls-checkbox"
                        checked={allSelected}
                        onChange={handleToggleSelectAll}
                        title="Select / Deselect All"
                      />
                      <span>SR.</span>
                    </div>
                  </th>
                  <th className="th-center" style={{ width: '80px' }}>TYPE</th>
                  <th>REMARK / DESCRIPTION</th>
                  <th style={{ width: '105px' }}>UNIT</th>
                  <th className="th-center" style={{ width: '90px' }}>QTY</th>
                  <th className="th-right" style={{ width: '100px' }}>LENGTH</th>
                  <th className="th-right" style={{ width: '100px' }}>HT / WIDTH</th>
                  <th className="th-right" style={{ width: '130px', borderLeft: '2px solid #bfdbfe' }}>TOTAL</th>
                  {billingMode && (
                    <>
                      <th className="th-right" style={{ width: '105px' }}>RATE</th>
                      <th className="th-right" style={{ width: '130px', borderLeft: '2px solid #fde68a' }}>AMOUNT</th>
                    </>
                  )}
                  <th className="th-center" style={{ width: '104px', borderLeft: '2px solid #c8d3de' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {(area.items || []).map((item, itemIdx) => (
                  <LineItemRow
                    key={item.id}
                    item={item}
                    index={itemIdx}
                    totalItems={area.items?.length || 0}
                    billingMode={billingMode}
                    currencySymbol={currencySymbol}
                    isSelected={selectedItemIds.includes(item.id)}
                    onToggleSelect={handleToggleSelectItem}
                    onChangeItem={handleChangeItem}
                    onDuplicateItem={handleDuplicateItem}
                    onDeleteItem={handleDeleteItem}
                    onMoveItemUp={() => handleMoveItem(item.id, 'up')}
                    onMoveItemDown={() => handleMoveItem(item.id, 'down')}
                  />
                ))}

                {(!area.items || area.items.length === 0) && (
                  <tr className="ent-empty-row">
                    <td colSpan={billingMode ? 11 : 9}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <i className="bi bi-table" style={{ fontSize: '20px', color: '#d1d5db' }} />
                        <span>No measurement rows yet.</span>
                        <button
                          type="button"
                          className="ent-add-btn ent-add-btn--primary"
                          onClick={() => handleAddItem(false)}
                        >
                          <i className="bi bi-plus-lg" /> Add First Row
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ─── Area Footer ────────────────────────────── */}
          <div className="ent-area-footer">
            {/* Add Item Buttons */}
            <div className="ent-footer-actions">
              <button
                type="button"
                className="ent-add-btn ent-add-btn--primary"
                onClick={() => handleAddItem(false)}
              >
                <i className="bi bi-plus-lg" />
                <span>Add Row</span>
              </button>

              <button
                type="button"
                className="ent-add-btn ent-add-btn--danger"
                onClick={() => handleAddItem(true)}
                title="Add deduction row (door opening, column cutout, etc.)"
              >
                <i className="bi bi-dash-lg" />
                <span>Add Deduction</span>
              </button>

              <span className="ent-vdivider" />

              <button
                type="button"
                className="ent-add-btn ent-add-btn--ghost"
                onClick={() => setShowReplicateModal(true)}
                title="Replicate measurements to multiple floors"
              >
                <i className="bi bi-layers" />
                <span>Replicate Floors</span>
              </button>

              {nextFloorInfo && (
                <button
                  type="button"
                  className="ent-add-btn ent-add-btn--ghost text-success"
                  onClick={handleQuickAddNextFloor}
                  title={`1-Click: Add ${nextFloorInfo.nextFloorName} (${nextFloorInfo.template.length} rows)`}
                >
                  <i className="bi bi-lightning-charge-fill" />
                  <span>+ {nextFloorInfo.nextFloorName}</span>
                </button>
              )}
            </div>

            {/* Subtotals */}
            <div className="ent-subtotals">
              <div className="ent-subtotal-pill">
                <span className="ent-subtotal-label">GROSS</span>
                <span className="ent-subtotal-val">{formatNumber(totals.grossQty)}</span>
              </div>

              {totals.lessQty > 0 && (
                <div className="ent-subtotal-pill ent-subtotal-pill--less">
                  <span className="ent-subtotal-label">LESS</span>
                  <span className="ent-subtotal-val">−{formatNumber(totals.lessQty)}</span>
                </div>
              )}

              <div className="ent-subtotal-pill ent-subtotal-pill--total">
                <span className="ent-subtotal-label">NET TOTAL</span>
                <span className="ent-subtotal-val">{formatNumber(totals.netQty)}</span>
              </div>

              {billingMode && (
                <div className="ent-subtotal-pill ent-subtotal-pill--amount">
                  <span className="ent-subtotal-label">NET AMOUNT</span>
                  <span className="ent-subtotal-val">{formatCurrency(totals.netAmount, currencySymbol)}</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Multi-Floor Replicate Modal */}
      <MultiFloorReplicateModal
        show={showReplicateModal}
        onClose={() => setShowReplicateModal(false)}
        area={area}
        onApplyReplication={handleApplyReplication}
      />
    </div>
  );
}
