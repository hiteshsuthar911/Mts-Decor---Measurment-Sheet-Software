import React, { useState, useEffect } from 'react';
import { getRateMaster, saveRateMaster, DEFAULT_RATES } from '../utils/rateMaster';

const TRADE_TABS = [
  { id: 'ALL', label: 'All Items', icon: 'bi-grid-fill' },
  { id: 'Tiling', label: 'Tiling & Stone', icon: 'bi-border-all' },
  { id: 'Ceilings & POP', label: 'Ceilings & POP', icon: 'bi-layers-fill' },
  { id: 'Painting', label: 'Painting', icon: 'bi-paint-bucket' },
  { id: 'Civil & Masonry', label: 'Civil & Masonry', icon: 'bi-bricks' },
  { id: 'Electrical', label: 'Electrical', icon: 'bi-lightning-charge' },
  { id: 'Plumbing', label: 'Plumbing', icon: 'bi-droplet-fill' },
  { id: 'Carpentry', label: 'Carpentry & Doors', icon: 'bi-door-open-fill' },
  { id: 'Custom', label: 'Custom Added', icon: 'bi-stars' },
];

export default function RateMasterModal({
  show,
  onClose,
  currencySymbol = '₹',
  onApplyRates
}) {
  const [rates, setRates] = useState({});
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [newCategory, setNewCategory] = useState('');
  const [newRate, setNewRate] = useState('');
  const [newUnit, setNewUnit] = useState('SFT');
  const [newTrade, setNewTrade] = useState('Custom');
  const [newDescription, setNewDescription] = useState('');
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
        ...(rates[category] || { unit: 'SFT', trade: 'Custom' }),
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
        trade: newTrade || 'Custom',
        description: newDescription.trim() || 'Custom contractor rate specification'
      }
    };
    setRates(updated);
    saveRateMaster(updated);
    setNewCategory('');
    setNewRate('');
    setNewDescription('');
    setSaveStatus(`Added rate for "${catName}"`);
    setTimeout(() => setSaveStatus(''), 2500);
  };

  const handleDeleteRate = (catName) => {
    if (!confirm(`Delete rate item for "${catName}" from library?`)) return;
    const updated = { ...rates };
    delete updated[catName];
    setRates(updated);
    saveRateMaster(updated);
  };

  const handleResetDefaults = () => {
    if (!confirm('Reset all rates to standard contractor default rates? Any custom items will be replaced.')) return;
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

  const filteredCategories = Object.keys(rates).filter(cat => {
    const item = rates[cat] || {};
    const matchesSearch = cat.toLowerCase().includes(search.toLowerCase()) ||
      (item.unit && item.unit.toLowerCase().includes(search.toLowerCase())) ||
      (item.trade && item.trade.toLowerCase().includes(search.toLowerCase())) ||
      (item.description && item.description.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeTab === 'ALL') return true;
    if (activeTab === 'Custom') {
      return item.trade === 'Custom' || !DEFAULT_RATES[cat];
    }
    if (activeTab === 'Tiling') {
      return item.trade === 'Tiling' || item.trade === 'Stone & Granite';
    }
    return item.trade === activeTab;
  });

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content shadow-lg border-0 rounded-3 overflow-hidden">
          {/* Header */}
          <div className="modal-header bg-dark text-white py-3 px-4">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-cash-coin fs-4 text-warning"></i>
              <div>
                <h5 className="modal-title fw-bold mb-0">Contractor Rate Master &amp; Items Library</h5>
                <small className="text-secondary">Standardized civil &amp; interior labor/material rate schedule for instant billing &amp; RA bills</small>
              </div>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          {/* Trade Filter Tabs */}
          <div className="bg-light border-bottom px-4 pt-2">
            <div className="d-flex flex-wrap gap-1">
              {TRADE_TABS.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  className={`btn btn-sm ${activeTab === tab.id ? 'btn-primary fw-bold shadow-xs' : 'btn-outline-secondary'} py-1 px-2 extra-small rounded-pill`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <i className={`bi ${tab.icon} me-1`}></i>
                  {tab.label}
                </button>
              ))}
            </div>
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
              <div className="input-group" style={{ maxWidth: '340px' }}>
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 small"
                  placeholder="Search category, item or trade..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-secondary-subtle text-secondary fw-semibold">
                  Showing {filteredCategories.length} items
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1 extra-small"
                  onClick={handleResetDefaults}
                  title="Restore default standard contractor rates"
                >
                  <i className="bi bi-arrow-counterclockwise"></i>
                  <span>Reset Defaults</span>
                </button>
              </div>
            </div>

            {/* Rates Table */}
            <div className="table-responsive border rounded mb-4" style={{ maxHeight: '340px' }}>
              <table className="table table-hover table-sm align-middle mb-0">
                <thead className="table-dark text-white extra-small text-uppercase sticky-top">
                  <tr>
                    <th style={{ width: '38%' }}>Work Category / Item Description</th>
                    <th style={{ width: '15%' }}>Trade Group</th>
                    <th style={{ width: '12%' }} className="text-center">Unit</th>
                    <th style={{ width: '25%' }}>Standard Rate ({currencySymbol})</th>
                    <th className="text-center" style={{ width: '10%' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-muted">
                        No items found matching &quot;{search}&quot;
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map(cat => {
                      const item = rates[cat] || {};
                      return (
                        <tr key={cat}>
                          <td>
                            <div className="fw-semibold text-dark">{cat}</div>
                            {item.description && (
                              <small className="text-muted extra-small d-block text-truncate" style={{ maxWidth: '320px' }}>
                                {item.description}
                              </small>
                            )}
                          </td>
                          <td>
                            <span className="badge bg-primary-subtle text-primary extra-small">
                              {item.trade || 'General'}
                            </span>
                          </td>
                          <td className="text-center">
                            <span className="badge bg-light text-dark border extra-small">{item.unit || 'SFT'}</span>
                          </td>
                          <td>
                            <div className="input-group input-group-sm" style={{ maxWidth: '170px' }}>
                              <span className="input-group-text bg-light fw-bold">{currencySymbol}</span>
                              <input
                                type="number"
                                step="any"
                                min="0"
                                className="form-control fw-bold text-end"
                                value={item.rate === 0 || item.rate ? item.rate : ''}
                                onChange={(e) => handleRateChange(cat, e.target.value)}
                              />
                              <span className="input-group-text bg-light extra-small text-muted">/{item.unit || 'SFT'}</span>
                            </div>
                          </td>
                          <td className="text-center">
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-xs py-1 px-2"
                              onClick={() => handleDeleteRate(cat)}
                              title="Remove item"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Add Custom Rate Form */}
            <div className="card bg-light border p-3 mb-3 rounded-3 shadow-xs">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="fw-bold mb-0 small text-uppercase text-dark d-flex align-items-center gap-1">
                  <i className="bi bi-plus-circle-fill text-primary"></i> Add Custom Work Item to Rate Master
                </h6>
                <span className="badge bg-warning text-dark extra-small">Available in all projects</span>
              </div>
              <form onSubmit={handleAddCustomRate}>
                <div className="row g-2 align-items-center mb-2">
                  <div className="col-12 col-md-5">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Item / Work Category Name (e.g. Italian Marble Polishing)"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-6 col-md-2">
                    <select
                      className="form-select form-select-sm"
                      value={newTrade}
                      onChange={(e) => setNewTrade(e.target.value)}
                    >
                      <option value="Tiling">Tiling & Stone</option>
                      <option value="Ceilings & POP">Ceilings & POP</option>
                      <option value="Painting">Painting</option>
                      <option value="Civil & Masonry">Civil & Masonry</option>
                      <option value="Electrical">Electrical</option>
                      <option value="Plumbing">Plumbing</option>
                      <option value="Carpentry">Carpentry</option>
                      <option value="Custom">Custom / General</option>
                    </select>
                  </div>
                  <div className="col-6 col-md-2">
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
                      <option value="LTR">LTR (Liters)</option>
                      <option value="KG">KG (Kilograms)</option>
                      <option value="LS">LS (Lump Sum)</option>
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
                  <div className="col-6 col-md-1">
                    <button type="submit" className="btn btn-sm btn-primary w-100 fw-semibold">
                      Add
                    </button>
                  </div>
                </div>
                <div className="row g-2">
                  <div className="col-12">
                    <input
                      type="text"
                      className="form-control form-control-sm extra-small"
                      placeholder="Optional material / labor specification note (e.g. 1st quality adhesive with 3mm spacers)"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                    />
                  </div>
                </div>
              </form>
            </div>

            {/* Apply To Project Options */}
            <div className="border-top pt-3">
              <div className="form-check">
                <input
                  className="form-check-input cursor-pointer"
                  type="checkbox"
                  id="overwriteRatesCheck"
                  checked={overwriteExisting}
                  onChange={(e) => setOverwriteExisting(e.target.checked)}
                />
                <label className="form-check-label small fw-semibold text-secondary cursor-pointer" htmlFor="overwriteRatesCheck">
                  Overwrite existing rates on the sheet with these standard rates (if unchecked, only items with empty/zero rates will be filled)
                </label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer bg-light py-2 px-4 d-flex justify-content-between">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-success btn-sm fw-bold d-flex align-items-center gap-1 shadow-sm px-4"
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
