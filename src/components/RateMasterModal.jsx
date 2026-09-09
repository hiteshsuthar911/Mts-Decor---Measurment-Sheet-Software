import React, { useState, useEffect } from 'react';
import { getRateMaster, saveRateMaster, DEFAULT_RATES } from '../utils/rateMaster';

export default function RateMasterModal({
  show,
  onClose,
  currencySymbol = '₹',
  onApplyRates
}) {
  const [rates, setRates] = useState({});
  const [search, setSearch] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newRate, setNewRate] = useState('');
  const [newUnit, setNewUnit] = useState('SFT');
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    if (show) {
      setRates(getRateMaster());
      setSaveStatus('');
    }
  }, [show]);

  if (!show) return null;

  const handleRateChange = (category, val) => {
    const num = parseFloat(val) || 0;
    const updated = {
      ...rates,
      [category]: {
        ...(rates[category] || { unit: 'SFT' }),
        rate: num
      }
    };
    setRates(updated);
    saveRateMaster(updated);
    setSaveStatus('Auto-saved to local rate library');
    setTimeout(() => setSaveStatus(''), 2500);
  };

  const handleAddCustomRate = (e) => {
    e.preventDefault();
    if (!newCategory.trim() || !newRate) return;
    const catName = newCategory.trim();
    const updated = {
      ...rates,
      [catName]: {
        rate: parseFloat(newRate) || 0,
        unit: newUnit,
        description: 'Custom contractor rate'
      }
    };
    setRates(updated);
    saveRateMaster(updated);
    setNewCategory('');
    setNewRate('');
    setSaveStatus(`Added rate for "${catName}"`);
    setTimeout(() => setSaveStatus(''), 2500);
  };

  const handleDeleteRate = (catName) => {
    if (!confirm(`Delete rate for "${catName}"?`)) return;
    const updated = { ...rates };
    delete updated[catName];
    setRates(updated);
    saveRateMaster(updated);
  };

  const handleResetDefaults = () => {
    if (!confirm('Reset all rates to standard contractor default rates?')) return;
    setRates(DEFAULT_RATES);
    saveRateMaster(DEFAULT_RATES);
    setSaveStatus('Reset to standard defaults');
    setTimeout(() => setSaveStatus(''), 2500);
  };

  const handleApply = () => {
    if (onApplyRates) {
      onApplyRates(rates, overwriteExisting);
    }
    onClose();
  };

  const filteredCategories = Object.keys(rates).filter(cat =>
    cat.toLowerCase().includes(search.toLowerCase()) ||
    (rates[cat].unit && rates[cat].unit.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content shadow-lg border-0">
          {/* Header */}
          <div className="modal-header bg-dark text-white py-3">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-cash-coin fs-4 text-warning"></i>
              <div>
                <h5 className="modal-title fw-bold mb-0">Rate Master & Library (RA Billing)</h5>
                <small className="text-secondary">Manage standard contractor labor & material rates</small>
              </div>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          {/* Body */}
          <div className="modal-body p-4">
            {saveStatus && (
              <div className="alert alert-success alert-dismissible py-2 px-3 small fade show mb-3" role="alert">
                <i className="bi bi-check-circle-fill me-1"></i> {saveStatus}
              </div>
            )}

            {/* Quick Search & Reset */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
              <div className="input-group" style={{ maxWidth: '320px' }}>
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search work category..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <button
                type="button"
                className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                onClick={handleResetDefaults}
                title="Restore default standard rates"
              >
                <i className="bi bi-arrow-counterclockwise"></i>
                <span>Reset to Defaults</span>
              </button>
            </div>

            {/* Rates Table */}
            <div className="table-responsive border rounded mb-4" style={{ maxHeight: '320px' }}>
              <table className="table table-hover table-sm align-middle mb-0">
                <thead className="table-light text-secondary extra-small text-uppercase sticky-top">
                  <tr>
                    <th style={{ width: '35%' }}>Work Category / Item</th>
                    <th style={{ width: '15%' }}>Unit</th>
                    <th style={{ width: '30%' }}>Standard Rate ({currencySymbol})</th>
                    <th className="text-center" style={{ width: '20%' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-4 text-muted">
                        No categories found matching &quot;{search}&quot;
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map(cat => (
                      <tr key={cat}>
                        <td>
                          <span className="fw-semibold text-dark">{cat}</span>
                          {rates[cat].description && (
                            <small className="d-block text-muted extra-small">{rates[cat].description}</small>
                          )}
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border extra-small">{rates[cat].unit || 'SFT'}</span>
                        </td>
                        <td>
                          <div className="input-group input-group-sm" style={{ maxWidth: '160px' }}>
                            <span className="input-group-text bg-light fw-bold">{currencySymbol}</span>
                            <input
                              type="number"
                              step="any"
                              min="0"
                              className="form-control fw-bold text-end"
                              value={rates[cat].rate || 0}
                              onChange={(e) => handleRateChange(cat, e.target.value)}
                            />
                            <span className="input-group-text bg-light extra-small text-muted">/{rates[cat].unit || 'SFT'}</span>
                          </div>
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-xs py-1 px-2"
                            onClick={() => handleDeleteRate(cat)}
                            title="Remove rate item"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Add New Rate Form */}
            <div className="card bg-light border p-3 mb-3">
              <h6 className="fw-bold mb-2 small text-uppercase text-secondary">
                <i className="bi bi-plus-circle me-1 text-primary"></i> Add Custom Work Category Rate
              </h6>
              <form onSubmit={handleAddCustomRate} className="row g-2 align-items-center">
                <div className="col-12 col-md-5">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Work Category (e.g. Italian Marble Flooring)"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    required
                  />
                </div>
                <div className="col-6 col-md-3">
                  <select
                    className="form-select form-select-sm"
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                  >
                    <option value="SFT">SFT (Sq. Feet)</option>
                    <option value="RFT">RFT (Run. Feet)</option>
                    <option value="SQM">SQM (Sq. Meter)</option>
                    <option value="RMT">RMT (Run. Meter)</option>
                    <option value="CFT">CFT (Cu. Feet)</option>
                    <option value="NOS">NOS (Count)</option>
                  </select>
                </div>
                <div className="col-6 col-md-2">
                  <div className="input-group input-group-sm">
                    <span className="input-group-text">{currencySymbol}</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      className="form-control form-control-sm"
                      placeholder="Rate"
                      value={newRate}
                      onChange={(e) => setNewRate(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="col-12 col-md-2">
                  <button type="submit" className="btn btn-sm btn-primary w-100 fw-semibold">
                    <i className="bi bi-plus-lg me-1"></i> Add
                  </button>
                </div>
              </form>
            </div>

            {/* Apply To Project Options */}
            <div className="border-top pt-3">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="overwriteRatesCheck"
                  checked={overwriteExisting}
                  onChange={(e) => setOverwriteExisting(e.target.checked)}
                />
                <label className="form-check-label small fw-semibold text-secondary" htmlFor="overwriteRatesCheck">
                  Overwrite existing rates on sheet with standard rates (if unchecked, only empty/zero rates will be filled)
                </label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer bg-light py-2">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-success btn-sm fw-bold d-flex align-items-center gap-1 shadow-sm px-3"
              onClick={handleApply}
            >
              <i className="bi bi-lightning-charge-fill"></i>
              <span>Apply Rates to Current Sheet</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
