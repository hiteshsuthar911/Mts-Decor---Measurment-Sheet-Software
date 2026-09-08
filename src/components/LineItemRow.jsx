import React from 'react';
import { UNIT_OPTIONS, REMARK_OPTIONS, CATEGORIZED_REMARKS } from '../data/categories';
import { calculateLineItemTotal, calculateLineItemAmount, formatNumber, formatCurrency, isLengthUnit, isCountUnit } from '../utils/calculations';

export default function LineItemRow({
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

  const handleKeyDown = (e, fieldName) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      const nextRow = e.target.closest('tr')?.nextElementSibling;
      if (nextRow) {
        const nextInput = nextRow.querySelector(`input[data-field="${fieldName}"]`);
        if (nextInput) {
          e.preventDefault();
          nextInput.focus();
          nextInput.select();
        }
      }
    } else if (e.key === 'ArrowUp') {
      const prevRow = e.target.closest('tr')?.previousElementSibling;
      if (prevRow) {
        const prevInput = prevRow.querySelector(`input[data-field="${fieldName}"]`);
        if (prevInput) {
          e.preventDefault();
          prevInput.focus();
          prevInput.select();
        }
      }
    }
  };

  return (
    <tr className={`line-item-row ${item.isLess ? 'table-danger-subtle border-danger border-opacity-25' : ''}`}>
      {/* SR Index */}
      <td className="text-center align-middle text-muted fw-semibold small" style={{ width: '45px' }}>
        {index + 1}
      </td>

      {/* Type Toggle: Addition (+) vs LESS (-) */}
      <td className="text-center align-middle" style={{ width: '90px' }}>
        <button
          type="button"
          className={`btn btn-xs fw-bold px-2 py-1 w-100 ${item.isLess ? 'btn-danger' : 'btn-outline-secondary'}`}
          onClick={toggleLess}
          title={item.isLess ? 'Deduction item (Click to switch to Addition)' : 'Addition item (Click to switch to LESS / Deduction)'}
        >
          {item.isLess ? '- LESS' : '+ ADD'}
        </button>
      </td>

      {/* Remark Dropdown (just like work category) */}
      <td className="align-middle" style={{ minWidth: '175px' }}>
        <div className="d-flex align-items-center gap-1">
          <select
            className="form-select form-select-sm fw-semibold"
            value={item.remark || ''}
            onChange={(e) => {
              if (e.target.value === '__ADD_NEW__') {
                const custom = window.prompt('Enter custom remark / note:', item.remark || '');
                if (custom && custom.trim()) {
                  handleFieldChange('remark', custom.trim());
                }
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
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </optgroup>
            ))}
            <option value="__ADD_NEW__" className="text-primary fw-bold">
              + Custom Remark...
            </option>
          </select>
          {item.remark && !REMARK_OPTIONS.includes(item.remark) && (
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm p-1 d-flex align-items-center"
              style={{ fontSize: '11px', height: '30px', flexShrink: 0 }}
              onClick={() => {
                const edited = window.prompt('Edit remark / note:', item.remark);
                if (edited !== null) handleFieldChange('remark', edited.trim());
              }}
              title="Edit custom remark"
            >
              <i className="bi bi-pencil-square"></i>
            </button>
          )}
        </div>
      </td>

      {/* Unit Dropdown */}
      <td className="align-middle" style={{ width: '110px' }}>
        <select
          className="form-select form-select-sm"
          value={item.unit || 'SFT'}
          onChange={(e) => handleFieldChange('unit', e.target.value)}
        >
          {UNIT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.value}
            </option>
          ))}
        </select>
      </td>

      {/* Qty */}
      <td className="align-middle" style={{ width: '80px' }}>
        <input
          type="number"
          step="any"
          min="0"
          data-field="quantity"
          className="form-control form-control-sm text-center"
          placeholder="Qty"
          value={item.quantity === 0 || item.quantity ? item.quantity : ''}
          onChange={(e) => handleFieldChange('quantity', e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, 'quantity')}
        />
      </td>

      {/* Length */}
      <td className="align-middle" style={{ width: '105px' }}>
        <input
          type="number"
          step="any"
          min="0"
          disabled={isCount}
          data-field="length"
          className={`form-control form-control-sm text-end ${isCount ? 'bg-light text-muted' : ''}`}
          placeholder={isCount ? '-' : 'Length'}
          value={item.length === 0 || item.length ? item.length : ''}
          onChange={(e) => handleFieldChange('length', e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, 'length')}
        />
      </td>

      {/* Height / Width (Conditionally active based on formula rules) */}
      <td className="align-middle" style={{ width: '115px' }}>
        {isLength || isCount ? (
          <div className="text-center text-muted small py-1 bg-light rounded border border-light-subtle">
            <span className="extra-small text-secondary">- N/A -</span>
          </div>
        ) : (
          <input
            type="number"
            step="any"
            min="0"
            data-field="height"
            className="form-control form-control-sm text-end"
            placeholder="Height"
            value={item.height === 0 || item.height ? item.height : ''}
            onChange={(e) => handleFieldChange('height', e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, 'height')}
          />
        )}
      </td>

      {/* Calculated Total */}
      <td className="align-middle text-end fw-bold" style={{ width: '120px' }}>
        <span className={item.isLess ? 'text-danger' : 'text-primary'}>
          {item.isLess ? '-' : ''}{formatNumber(lineTotal)}
        </span>
        <span className="ms-1 text-muted extra-small fw-normal">{item.unit || 'SFT'}</span>
      </td>

      {/* Optional Rate & Amount (RA Bill Mode) */}
      {billingMode && (
        <>
          <td className="align-middle" style={{ width: '105px' }}>
            <div className="input-group input-group-sm">
              <span className="input-group-text px-1 text-muted extra-small">{currencySymbol}</span>
              <input
                type="number"
                step="any"
                min="0"
                className="form-control form-control-sm text-end"
                placeholder="Rate"
                value={item.rate === 0 || item.rate ? item.rate : ''}
                onChange={(e) => handleFieldChange('rate', e.target.value)}
              />
            </div>
          </td>
          <td className="align-middle text-end fw-bold text-dark" style={{ width: '125px' }}>
            <span className={item.isLess ? 'text-danger' : 'text-dark'}>
              {item.isLess ? '-' : ''}{formatCurrency(lineAmount, currencySymbol)}
            </span>
          </td>
        </>
      )}

      {/* Actions */}
      <td className="text-center align-middle" style={{ width: '110px' }}>
        <div className="btn-group btn-group-sm">
          {onMoveItemUp && (
            <button
              type="button"
              className="btn btn-outline-secondary btn-xs"
              disabled={index === 0}
              onClick={() => onMoveItemUp(item.id)}
              title="Move Row Up"
            >
              <i className="bi bi-arrow-up"></i>
            </button>
          )}
          {onMoveItemDown && (
            <button
              type="button"
              className="btn btn-outline-secondary btn-xs"
              disabled={totalItems !== undefined && index >= totalItems - 1}
              onClick={() => onMoveItemDown(item.id)}
              title="Move Row Down"
            >
              <i className="bi bi-arrow-down"></i>
            </button>
          )}
          <button
            type="button"
            className="btn btn-outline-secondary btn-xs"
            onClick={() => onDuplicateItem(item.id)}
            title="Duplicate this line item"
          >
            <i className="bi bi-copy"></i>
          </button>
          <button
            type="button"
            className="btn btn-outline-danger btn-xs"
            onClick={() => onDeleteItem(item.id)}
            title="Delete this line item"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
      </td>
    </tr>
  );
}
