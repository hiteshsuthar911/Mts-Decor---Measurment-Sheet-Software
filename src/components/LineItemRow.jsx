import React from 'react';
import { UNIT_OPTIONS, REMARK_OPTIONS } from '../data/categories';
import { calculateLineItemTotal, calculateLineItemAmount, formatNumber, formatCurrency, isLengthUnit, isCountUnit } from '../utils/calculations';

export default function LineItemRow({
  item,
  index,
  billingMode,
  currencySymbol = '₹',
  onChangeItem,
  onDuplicateItem,
  onDeleteItem
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

      {/* Remark / Location Description */}
      <td className="align-middle">
        <input
          type="text"
          list={`remark-suggestions-${item.id}`}
          className="form-control form-control-sm"
          placeholder={item.isLess ? 'e.g. Nahani Trap, Core Cut' : 'e.g. Koba, Floor Tiles, Skirting'}
          value={item.remark || ''}
          onChange={(e) => handleFieldChange('remark', e.target.value)}
        />
        <datalist id={`remark-suggestions-${item.id}`}>
          {REMARK_OPTIONS.map((opt, i) => (
            <option key={i} value={opt} />
          ))}
        </datalist>
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
          className="form-control form-control-sm text-center"
          placeholder="Qty"
          value={item.quantity === 0 || item.quantity ? item.quantity : ''}
          onChange={(e) => handleFieldChange('quantity', e.target.value)}
        />
      </td>

      {/* Length */}
      <td className="align-middle" style={{ width: '105px' }}>
        <input
          type="number"
          step="any"
          min="0"
          disabled={isCount}
          className={`form-control form-control-sm text-end ${isCount ? 'bg-light text-muted' : ''}`}
          placeholder={isCount ? '-' : 'Length'}
          value={item.length === 0 || item.length ? item.length : ''}
          onChange={(e) => handleFieldChange('length', e.target.value)}
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
            className="form-control form-control-sm text-end"
            placeholder="Height"
            value={item.height === 0 || item.height ? item.height : ''}
            onChange={(e) => handleFieldChange('height', e.target.value)}
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
      <td className="text-center align-middle" style={{ width: '80px' }}>
        <div className="btn-group btn-group-sm">
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
