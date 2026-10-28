import React from 'react';
import { UNIT_OPTIONS, REMARK_OPTIONS, CATEGORIZED_REMARKS } from '../data/categories';
import { calculateLineItemTotal, calculateLineItemAmount, formatNumber, formatCurrency, isLengthUnit, isCountUnit } from '../utils/calculations';

export default function MobileLineItemCard({
  item,
  index,
  totalItems,
  billingMode,
  currencySymbol = '₹',
  onChangeItem,
  onDuplicateItem,
  onDeleteItem,
  onMoveItemUp,
  onMoveItemDown,
}) {
  const lineTotal = calculateLineItemTotal(item);
  const lineAmount = calculateLineItemAmount(item, lineTotal);
  const isLength = isLengthUnit(item.unit);
  const isCount = isCountUnit(item.unit);

  const handleFieldChange = (field, value) => {
    onChangeItem(item.id, { ...item, [field]: value });
  };

  const toggleLess = () => {
    onChangeItem(item.id, { ...item, isLess: !item.isLess });
  };

  return (
    <div
      className={`card mb-2.5 border shadow-xs rounded-3 overflow-hidden ${
        item.isLess ? 'border-danger-subtle bg-danger-subtle bg-opacity-10' : 'border-secondary-subtle bg-white'
      }`}
      style={{
        borderLeft: item.isLess ? '4px solid #ef4444' : '4px solid #2563eb',
        transition: 'all 0.15s ease'
      }}
    >
      {/* ── CARD TOP BAR: SR, ADD/LESS TOGGLE & ACTIONS ── */}
      <div className="card-header py-1.5 px-2.5 bg-light d-flex align-items-center justify-content-between border-bottom">
        <div className="d-flex align-items-center gap-2">
          {/* SR Badge */}
          <span
            className="badge rounded-pill fw-bolder"
            style={{
              background: '#0f172a',
              color: '#ffffff',
              fontSize: '11px',
              minWidth: '24px',
              padding: '3px 6px'
            }}
          >
            #{index + 1}
          </span>

          {/* Add / Less Toggle */}
          <button
            type="button"
            className={`btn btn-xs fw-bold rounded-pill px-2.5 py-1 d-flex align-items-center gap-1 border ${
              item.isLess
                ? 'btn-danger text-white border-danger'
                : 'btn-success text-white border-success'
            }`}
            onClick={toggleLess}
            style={{ fontSize: '11px', letterSpacing: '0.3px' }}
            title={item.isLess ? 'Deduction Item (tap to switch to Addition)' : 'Addition Item (tap to switch to Deduction)'}
          >
            <i className={`bi ${item.isLess ? 'bi-dash-circle-fill' : 'bi-plus-circle-fill'}`} />
            <span>{item.isLess ? 'LESS (Deduct)' : 'ADD'}</span>
          </button>
        </div>

        {/* Row Action Buttons */}
        <div className="d-flex align-items-center gap-1">
          {onMoveItemUp && (
            <button
              type="button"
              className="btn btn-xs btn-outline-secondary p-1 border-0"
              disabled={index === 0}
              onClick={() => onMoveItemUp(item.id)}
              title="Move Up"
            >
              <i className="bi bi-chevron-up" style={{ fontSize: '13px' }} />
            </button>
          )}
          {onMoveItemDown && (
            <button
              type="button"
              className="btn btn-xs btn-outline-secondary p-1 border-0"
              disabled={totalItems !== undefined && index >= totalItems - 1}
              onClick={() => onMoveItemDown(item.id)}
              title="Move Down"
            >
              <i className="bi bi-chevron-down" style={{ fontSize: '13px' }} />
            </button>
          )}
          <button
            type="button"
            className="btn btn-xs btn-outline-primary p-1 border-0"
            onClick={() => onDuplicateItem(item.id)}
            title="Duplicate Row"
          >
            <i className="bi bi-copy" style={{ fontSize: '12px' }} />
          </button>
          <button
            type="button"
            className="btn btn-xs btn-outline-danger p-1 border-0"
            onClick={() => onDeleteItem(item.id)}
            title="Delete Row"
          >
            <i className="bi bi-trash3-fill" style={{ fontSize: '12px' }} />
          </button>
        </div>
      </div>

      {/* ── CARD BODY: INPUTS & DIMENSIONS ── */}
      <div className="card-body p-2.5">
        {/* Remark & Unit Row */}
        <div className="row g-2 mb-2">
          <div className="col-8">
            <label className="extra-small text-muted fw-bold text-uppercase mb-0.5 d-block" style={{ fontSize: '9.5px' }}>
              Description / Remark
            </label>
            <div className="d-flex gap-1">
              <select
                className="form-select form-select-sm fw-medium"
                style={{ fontSize: '13px', padding: '4px 8px', borderRadius: '6px' }}
                value={item.remark || ''}
                onChange={(e) => {
                  if (e.target.value === '__ADD_NEW__') {
                    const custom = window.prompt('Enter custom remark / note:', item.remark || '');
                    if (custom && custom.trim()) handleFieldChange('remark', custom.trim());
                  } else if (e.target.value === 'Other') {
                    const custom = window.prompt('Enter custom remark for Other:', '');
                    handleFieldChange('remark', custom && custom.trim() ? custom.trim() : 'Other');
                  } else {
                    handleFieldChange('remark', e.target.value);
                  }
                }}
              >
                <option value="">Select Remark...</option>
                {item.remark && !REMARK_OPTIONS.includes(item.remark) && (
                  <option value={item.remark}>{item.remark} (Custom)</option>
                )}
                {Object.entries(CATEGORIZED_REMARKS).map(([groupTitle, list]) => (
                  <optgroup key={groupTitle} label={groupTitle}>
                    {list.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </optgroup>
                ))}
                <option value="__ADD_NEW__">+ Custom Remark...</option>
              </select>
              {item.remark && !REMARK_OPTIONS.includes(item.remark) && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary px-1.5 py-0"
                  onClick={() => {
                    const edited = window.prompt('Edit remark / note:', item.remark);
                    if (edited !== null) handleFieldChange('remark', edited.trim());
                  }}
                  title="Edit custom remark"
                >
                  <i className="bi bi-pencil" style={{ fontSize: '11px' }} />
                </button>
              )}
            </div>
          </div>

          <div className="col-4">
            <label className="extra-small text-muted fw-bold text-uppercase mb-0.5 d-block" style={{ fontSize: '9.5px' }}>
              Unit
            </label>
            <select
              className="form-select form-select-sm fw-bold text-primary"
              style={{ fontSize: '13px', padding: '4px 8px', borderRadius: '6px' }}
              value={item.unit || 'SFT'}
              onChange={(e) => handleFieldChange('unit', e.target.value)}
            >
              {UNIT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.value}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Dimensions Row (Qty, Length, Ht/Width) */}
        <div className="row g-2 mb-2">
          {/* Qty */}
          <div className="col-4">
            <label className="extra-small text-muted fw-bold text-uppercase mb-0.5 d-block" style={{ fontSize: '9.5px' }}>
              Qty (Nos)
            </label>
            <input
              type="number"
              step="any"
              min="0"
              inputMode="decimal"
              className="form-control form-control-sm text-center font-monospace fw-bold"
              style={{ fontSize: '14px', borderRadius: '6px' }}
              placeholder="1"
              value={item.quantity === 0 || item.quantity ? item.quantity : ''}
              onChange={(e) => handleFieldChange('quantity', e.target.value)}
            />
          </div>

          {/* Length */}
          <div className="col-4">
            <label className="extra-small text-muted fw-bold text-uppercase mb-0.5 d-block" style={{ fontSize: '9.5px' }}>
              Length
            </label>
            <input
              type="number"
              step="any"
              min="0"
              disabled={isCount}
              inputMode="decimal"
              className="form-control form-control-sm text-end font-monospace fw-bold"
              style={{ fontSize: '14px', borderRadius: '6px' }}
              placeholder={isCount ? '—' : '0.00'}
              value={item.length === 0 || item.length ? item.length : ''}
              onChange={(e) => handleFieldChange('length', e.target.value)}
            />
          </div>

          {/* Height / Width */}
          <div className="col-4">
            <label className="extra-small text-muted fw-bold text-uppercase mb-0.5 d-block" style={{ fontSize: '9.5px' }}>
              Ht / Width
            </label>
            {isLength || isCount ? (
              <div
                className="form-control form-control-sm text-center text-muted bg-light"
                style={{ fontSize: '12px', borderRadius: '6px', lineHeight: '22px' }}
              >
                N/A
              </div>
            ) : (
              <input
                type="number"
                step="any"
                min="0"
                inputMode="decimal"
                className="form-control form-control-sm text-end font-monospace fw-bold"
                style={{ fontSize: '14px', borderRadius: '6px' }}
                placeholder="0.00"
                value={item.height === 0 || item.height ? item.height : ''}
                onChange={(e) => handleFieldChange('height', e.target.value)}
              />
            )}
          </div>
        </div>

        {/* Billing Mode (Rate & Amount) */}
        {billingMode && (
          <div className="row g-2 mb-2 p-2 rounded-2 bg-warning-subtle bg-opacity-25 border border-warning-subtle">
            <div className="col-6">
              <label className="extra-small text-dark fw-bold text-uppercase mb-0.5 d-block" style={{ fontSize: '9.5px' }}>
                Rate ({currencySymbol})
              </label>
              <div className="input-group input-group-sm">
                <span className="input-group-text px-1.5 text-muted">{currencySymbol}</span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  inputMode="decimal"
                  className="form-control form-control-sm text-end font-monospace fw-bold"
                  style={{ fontSize: '13px' }}
                  placeholder="0.00"
                  value={item.rate === 0 || item.rate ? item.rate : ''}
                  onChange={(e) => handleFieldChange('rate', e.target.value)}
                />
              </div>
            </div>
            <div className="col-6 d-flex flex-column justify-content-end text-end">
              <span className="extra-small text-muted fw-bold text-uppercase" style={{ fontSize: '9.5px' }}>
                Item Amount
              </span>
              <span className={`fw-bolder font-monospace fs-6 ${item.isLess ? 'text-danger' : 'text-success'}`}>
                {item.isLess ? '− ' : ''}{formatCurrency(lineAmount, currencySymbol)}
              </span>
            </div>
          </div>
        )}

        {/* ── CARD FOOTER / CALCULATION PREVIEW ── */}
        <div className="d-flex align-items-center justify-content-between pt-1.5 border-top">
          {/* Formula */}
          <div className="extra-small text-muted font-monospace" style={{ fontSize: '11px' }}>
            {item.quantity || 1} × {item.length || 0}
            {!isLength && !isCount ? ` × ${item.height || 0}` : ''}
          </div>

          {/* Line Total */}
          <div className="d-flex align-items-baseline gap-1">
            <span className="extra-small text-muted text-uppercase fw-bold" style={{ fontSize: '9.5px' }}>
              Total:
            </span>
            <span
              className={`fw-bolder font-monospace fs-6 ${
                item.isLess ? 'text-danger' : 'text-success'
              }`}
            >
              {item.isLess ? '− ' : ''}{formatNumber(lineTotal)}
            </span>
            <span className="extra-small text-muted fw-bold" style={{ fontSize: '10px' }}>
              {item.unit || 'SFT'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
