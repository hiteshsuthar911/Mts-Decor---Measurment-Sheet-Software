import React, { useState } from 'react';
import { WORK_CATEGORIES, COMMON_ROOM_AREAS } from '../data/categories';
import LineItemRow from './LineItemRow';
import { calculateAreaTotals, formatNumber, formatCurrency } from '../utils/calculations';
import { createEmptyItem } from '../data/sampleData';

export default function AreaBlock({
  area,
  index,
  totalAreas,
  billingMode,
  currencySymbol = '₹',
  onChangeArea,
  onDeleteArea,
  onDuplicateArea,
  onMoveArea
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const totals = calculateAreaTotals(area);

  const handleFieldChange = (field, value) => {
    const updated = { ...area, [field]: value };
    onChangeArea(area.id, updated);
  };

  // Line item handlers
  const handleAddItem = (isLess = false) => {
    // Detect predominant unit in current area or default to SFT
    const defaultUnit = area.items?.length > 0 ? area.items[area.items.length - 1].unit : 'SFT';
    const newItem = createEmptyItem(defaultUnit);
    newItem.isLess = isLess;
    if (isLess) {
      newItem.remark = 'Deduction / Opening';
    }
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
    onChangeArea(area.id, { ...area, items: updatedItems });
  };

  return (
    <div className="card area-block shadow-sm mb-4 border border-secondary-subtle">
      {/* Area Card Header */}
      <div className="card-header bg-white py-3 border-bottom">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          {/* Title and location badge */}
          <div className="d-flex align-items-center flex-wrap gap-2">
            <span className="badge bg-dark rounded-pill px-3 py-2 fw-semibold">
              Area #{index + 1}
            </span>
            <div className="d-flex align-items-center gap-2">
              <span className="fw-bold text-dark fs-6">
                {area.floor || 'Floor'} &bull; {area.flat || 'Unit'} &bull; {area.room || 'Room'}
              </span>
              <span className="text-secondary small">
                ({area.parentCategory === 'Other' ? (area.customParentCategory || 'Other') : (area.parentCategory || 'General Work')})
              </span>
            </div>
          </div>

          {/* Card action buttons */}
          <div className="d-flex align-items-center gap-1">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              disabled={index === 0}
              onClick={() => onMoveArea(area.id, -1)}
              title="Move this area up"
            >
              <i className="bi bi-arrow-up"></i>
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              disabled={index === totalAreas - 1}
              onClick={() => onMoveArea(area.id, 1)}
              title="Move this area down"
            >
              <i className="bi bi-arrow-down"></i>
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              onClick={() => onDuplicateArea(area.id)}
              title="Duplicate entire area"
            >
              <i className="bi bi-copy me-1"></i> Clone Area
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={() => onDeleteArea(area.id)}
              title="Delete this area"
            >
              <i className="bi bi-trash"></i>
            </button>
            <button
              type="button"
              className="btn btn-sm btn-light border ms-2"
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? 'Expand Area' : 'Collapse Area'}
            >
              <i className={`bi ${isCollapsed ? 'bi-chevron-down' : 'bi-chevron-up'}`}></i>
            </button>
          </div>
        </div>

        {/* Location & Hierarchical Work Category Form */}
        <div className="row g-2 mt-2 pt-2 border-top">
          {/* Floor Number */}
          <div className="col-6 col-md-2">
            <label className="form-label extra-small text-muted fw-bold mb-1">Floor Number</label>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="e.g. 8th Floor"
              value={area.floor || ''}
              onChange={(e) => handleFieldChange('floor', e.target.value)}
            />
          </div>

          {/* Flat / Unit Number */}
          <div className="col-6 col-md-2">
            <label className="form-label extra-small text-muted fw-bold mb-1">Flat / Unit Number</label>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="e.g. Flat 801"
              value={area.flat || ''}
              onChange={(e) => handleFieldChange('flat', e.target.value)}
            />
          </div>

          {/* Room / Area */}
          <div className="col-12 col-md-4">
            <label className="form-label extra-small text-muted fw-bold mb-1">Room / Location Area</label>
            <input
              type="text"
              list={`room-suggestions-${area.id}`}
              className="form-control form-control-sm"
              placeholder="e.g. Master Toilet, Living Room"
              value={area.room || ''}
              onChange={(e) => handleFieldChange('room', e.target.value)}
            />
            <datalist id={`room-suggestions-${area.id}`}>
              {COMMON_ROOM_AREAS.map((r, i) => (
                <option key={i} value={r} />
              ))}
            </datalist>
          </div>

          {/* Work Category (Work Detail) */}
          <div className="col-12 col-md-4">
            <label className="form-label extra-small text-muted fw-bold mb-1">Work Category (Work Detail)</label>
            <select
              className="form-select form-select-sm fw-semibold"
              value={area.parentCategory || 'Main Floor'}
              onChange={(e) => handleFieldChange('parentCategory', e.target.value)}
            >
              {WORK_CATEGORIES.map((catKey) => (
                <option key={catKey} value={catKey}>
                  {catKey}
                </option>
              ))}
            </select>
          </div>

          {/* Conditional "Other" inputs */}
          {area.parentCategory === 'Other' && (
            <div className="col-12 mt-1">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-warning-subtle text-dark fw-bold">Custom Work Category:</span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter custom work description"
                  value={area.customParentCategory || ''}
                  onChange={(e) => handleFieldChange('customParentCategory', e.target.value)}
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Header Description on Sheet (e.g. ITALIAN MARBLE FLOORING WITH KOBA) */}
          <div className="col-12 mt-2">
            <div className="input-group input-group-sm">
              <span className="input-group-text text-secondary fw-semibold">Sheet Description Header:</span>
              <input
                type="text"
                className="form-control fw-bold"
                placeholder="e.g. ITALIAN MARBLE FLOORING WITH KOBA, or leave empty for auto title"
                value={area.descriptionHeader || ''}
                onChange={(e) => handleFieldChange('descriptionHeader', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Area Body: Line Items */}
      {!isCollapsed && (
        <div className="card-body p-0">
          {/* Mobile Swipe Hint */}
          <div className="d-md-none text-muted extra-small py-1 px-3 bg-light border-bottom text-uppercase d-flex align-items-center justify-content-between">
            <span><i className="bi bi-arrow-left-right me-1 text-primary"></i> SWIPE TABLE TO VIEW ALL COLUMNS</span>
            <span className="badge bg-secondary extra-small">{area.items?.length || 0} ITEMS</span>
          </div>

          <div className="table-responsive">
            <table className={`table table-sm table-hover align-middle mb-0 line-items-table ${billingMode ? 'billing-active' : ''}`}>
              <thead className="table-light text-secondary small text-uppercase">
                <tr>
                  <th className="text-center" style={{ width: '45px' }}>SR.</th>
                  <th className="text-center" style={{ width: '90px' }}>TYPE</th>
                  <th>REMARK / LOCATION DETAIL</th>
                  <th style={{ width: '110px' }}>UNIT</th>
                  <th className="text-center" style={{ width: '80px' }}>QTY</th>
                  <th className="text-end" style={{ width: '105px' }}>LENGTH</th>
                  <th className="text-end" style={{ width: '115px' }}>
                    HEIGHT / WIDTH
                  </th>
                  <th className="text-end" style={{ width: '120px' }}>TOTAL</th>
                  {billingMode && (
                    <>
                      <th className="text-end" style={{ width: '105px' }}>RATE</th>
                      <th className="text-end" style={{ width: '125px' }}>AMOUNT</th>
                    </>
                  )}
                  <th className="text-center" style={{ width: '80px' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {(area.items || []).map((item, itemIdx) => (
                  <LineItemRow
                    key={item.id}
                    item={item}
                    index={itemIdx}
                    billingMode={billingMode}
                    currencySymbol={currencySymbol}
                    onChangeItem={handleChangeItem}
                    onDuplicateItem={handleDuplicateItem}
                    onDeleteItem={handleDeleteItem}
                  />
                ))}

                {(!area.items || area.items.length === 0) && (
                  <tr>
                    <td colSpan={billingMode ? 10 : 8} className="text-center py-4 text-muted">
                      <p className="mb-2">No line items in this area yet.</p>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() => handleAddItem(false)}
                      >
                        <i className="bi bi-plus me-1"></i> Add First Item
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Area Footer Bar: Add buttons & Subtotal calculation */}
          <div className="p-3 bg-light border-top d-flex flex-column flex-md-row justify-content-between align-items-stretch align-items-md-center gap-3">
            <div className="d-flex flex-wrap align-items-center gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-primary fw-bold text-uppercase flex-grow-1 flex-md-grow-0"
                onClick={() => handleAddItem(false)}
              >
                <i className="bi bi-plus-lg me-1"></i> ADD LINE ITEM
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger fw-bold text-uppercase flex-grow-1 flex-md-grow-0"
                onClick={() => handleAddItem(true)}
                title="Add a deduction item (e.g. door opening, column cutout, duct)"
              >
                <i className="bi bi-dash-lg me-1"></i> ADD DEDUCTION (LESS)
              </button>
            </div>

            {/* Area Subtotals */}
            <div className="d-flex align-items-center flex-wrap gap-2 gap-md-3 justify-content-end">
              <div className="text-end">
                <span className="text-muted extra-small d-block text-uppercase fw-bold">GROSS:</span>
                <span className="fw-semibold text-dark small">{formatNumber(totals.grossQty)}</span>
              </div>

              {totals.lessQty > 0 && (
                <div className="text-end">
                  <span className="text-danger extra-small d-block text-uppercase fw-bold">LESS:</span>
                  <span className="fw-semibold text-danger small">-{formatNumber(totals.lessQty)}</span>
                </div>
              )}

              <div className="text-end bg-white px-3 py-1 rounded border border-primary-subtle shadow-sm">
                <span className="text-primary extra-small d-block text-uppercase fw-bold">TOTAL AFTER LESS:</span>
                <span className="fw-bold text-primary fs-6">{formatNumber(totals.netQty)}</span>
              </div>

              {billingMode && (
                <div className="text-end bg-warning-subtle px-3 py-1 rounded border border-warning shadow-sm">
                  <span className="text-dark extra-small d-block text-uppercase fw-bold">NET AMOUNT:</span>
                  <span className="fw-bold text-dark fs-6">{formatCurrency(totals.netAmount, currencySymbol)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
