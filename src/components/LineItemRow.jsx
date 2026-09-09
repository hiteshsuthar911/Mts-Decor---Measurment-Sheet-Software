import React from 'react';
import { UNIT_OPTIONS, REMARK_OPTIONS, CATEGORIZED_REMARKS } from '../data/categories';
import { calculateLineItemTotal, calculateLineItemAmount, formatNumber, formatCurrency, isLengthUnit, isCountUnit } from '../utils/calculations';

export default function LineItemRow({
  item,
  index,
  totalItems,
  billingMode,
  currencySymbol = '₹',
  isSelected = false,
  onToggleSelect,
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
    <tr
      className={`xls-row ${isSelected ? 'xls-row--selected' : ''} ${item.isLess ? 'xls-row--deduction' : ''}`}
      title={item.isLess ? 'Deduction Row' : ''}
    >
      {/* SR + Checkbox */}
      <td className="xls-cell xls-cell--sr">
        <div className="xls-sr-wrap">
          {onToggleSelect && (
            <input
              type="checkbox"
              className="xls-checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(item.id)}
              title="Select for bulk actions"
            />
          )}
          <span className="xls-sr-num">{index + 1}</span>
        </div>
      </td>

      {/* ADD / LESS Toggle */}
      <td className="xls-cell xls-cell--type">
        <button
          type="button"
          className={`xls-type-btn ${item.isLess ? 'xls-type-btn--less' : 'xls-type-btn--add'}`}
          onClick={toggleLess}
          title={item.isLess ? 'Deduction (click to switch to Addition)' : 'Addition (click to switch to Deduction)'}
        >
          {item.isLess ? '− Less' : '+ Add'}
        </button>
      </td>

      {/* Remark */}
      <td className="xls-cell xls-cell--remark">
        <div className="xls-remark-wrap">
          <select
            className="xls-select xls-select--remark"
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
              className="xls-icon-btn"
              onClick={() => {
                const edited = window.prompt('Edit remark / note:', item.remark);
                if (edited !== null) handleFieldChange('remark', edited.trim());
              }}
              title="Edit custom remark"
            >
              <i className="bi bi-pencil" />
            </button>
          )}
        </div>
      </td>

      {/* Unit */}
      <td className="xls-cell xls-cell--unit">
        <select
          className="xls-select"
          value={item.unit || 'SFT'}
          onChange={(e) => handleFieldChange('unit', e.target.value)}
        >
          {UNIT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.value}</option>
          ))}
        </select>
      </td>

      {/* Qty */}
      <td className="xls-cell xls-cell--num">
        <input
          type="number"
          step="any"
          min="0"
          data-field="quantity"
          className="xls-input xls-input--center"
          placeholder="—"
          value={item.quantity === 0 || item.quantity ? item.quantity : ''}
          onChange={(e) => handleFieldChange('quantity', e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, 'quantity')}
        />
      </td>

      {/* Length */}
      <td className="xls-cell xls-cell--num">
        <input
          type="number"
          step="any"
          min="0"
          disabled={isCount}
          data-field="length"
          className={`xls-input xls-input--right ${isCount ? 'xls-input--disabled' : ''}`}
          placeholder={isCount ? '—' : '0.00'}
          value={item.length === 0 || item.length ? item.length : ''}
          onChange={(e) => handleFieldChange('length', e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, 'length')}
        />
      </td>

      {/* Height / Width */}
      <td className="xls-cell xls-cell--num">
        {isLength || isCount ? (
          <span className="xls-na">N/A</span>
        ) : (
          <input
            type="number"
            step="any"
            min="0"
            data-field="height"
            className="xls-input xls-input--right"
            placeholder="0.00"
            value={item.height === 0 || item.height ? item.height : ''}
            onChange={(e) => handleFieldChange('height', e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, 'height')}
          />
        )}
      </td>

      {/* Calculated Total */}
      <td className="xls-cell xls-cell--total">
        <span className={`xls-total-val ${item.isLess ? 'xls-total-val--less' : 'xls-total-val--add'}`}>
          {item.isLess ? '−' : ''}{formatNumber(lineTotal)}
        </span>
        <span className="xls-total-unit">{item.unit || 'SFT'}</span>
      </td>

      {/* Rate & Amount (RA Bill Mode) */}
      {billingMode && (
        <>
          <td className="xls-cell xls-cell--num">
            <div className="xls-currency-input">
              <span className="xls-currency-prefix">{currencySymbol}</span>
              <input
                type="number"
                step="any"
                min="0"
                className="xls-input xls-input--right"
                placeholder="0.00"
                value={item.rate === 0 || item.rate ? item.rate : ''}
                onChange={(e) => handleFieldChange('rate', e.target.value)}
              />
            </div>
          </td>
          <td className="xls-cell xls-cell--amount">
            <span className={`xls-amount-val ${item.isLess ? 'xls-amount-val--less' : ''}`}>
              {item.isLess ? '−' : ''}{formatCurrency(lineAmount, currencySymbol)}
            </span>
          </td>
        </>
      )}

      {/* Actions */}
      <td className="xls-cell xls-cell--actions">
        <div className="xls-action-group">
          {onMoveItemUp && (
            <button
              type="button"
              className="xls-action-btn"
              disabled={index === 0}
              onClick={() => onMoveItemUp(item.id)}
              title="Move Up"
            >
              <i className="bi bi-chevron-up" />
            </button>
          )}
          {onMoveItemDown && (
            <button
              type="button"
              className="xls-action-btn"
              disabled={totalItems !== undefined && index >= totalItems - 1}
              onClick={() => onMoveItemDown(item.id)}
              title="Move Down"
            >
              <i className="bi bi-chevron-down" />
            </button>
          )}
          <button
            type="button"
            className="xls-action-btn"
            onClick={() => onDuplicateItem(item.id)}
            title="Duplicate Row"
          >
            <i className="bi bi-copy" />
          </button>
          <button
            type="button"
            className="xls-action-btn xls-action-btn--danger"
            onClick={() => onDeleteItem(item.id)}
            title="Delete Row"
          >
            <i className="bi bi-trash3" />
          </button>
        </div>
      </td>
    </tr>
  );
}
