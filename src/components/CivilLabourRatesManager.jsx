import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { CATEGORIZED_WORK_TYPES, WORK_CATEGORIES } from '../data/categories';
import { 
  DEFAULT_CIVIL_LABOUR_RATES, 
  getCivilLabourRates, 
  saveCivilLabourRates, 
  resetCivilLabourRates 
} from '../data/civilLabourRates';
import { fetchCivilLabourRates, saveCivilLabourRatesRemote, resetCivilLabourRatesRemote } from '../utils/storage';

export default function CivilLabourRatesManager({ companySlug = 'mts-decor' }) {
  const [rates, setRates] = useState([]);
  const [rateTitle, setRateTitle] = useState('CIVIL WORK ONLY LABOUR RATES.');
  const [rateDate, setRateDate] = useState('23/03/2026');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGroup, setFilterGroup] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterUnit, setFilterUnit] = useState('ALL');
  const [filterMapping, setFilterMapping] = useState('ALL'); // 'ALL', 'MAPPED', 'UNMAPPED'
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [activeImagePage, setActiveImagePage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);

  // New item form state
  const [newItem, setNewItem] = useState({
    particulars: '',
    unit: 'SQFT',
    rate: '',
    group: 'Wall Tiles & Slabs',
    workCategory: 'Wall Tiles'
  });

  // Load rates on mount: try backend first, fallback to local storage
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      // 1. Initial load from localStorage / defaults
      const localRates = getCivilLabourRates();
      if (isMounted) setRates(localRates);

      // 2. Try fetching from MongoDB backend
      try {
        const res = await fetchCivilLabourRates(companySlug);
        if (isMounted && res && Array.isArray(res.rates) && res.rates.length > 0) {
          setRates(res.rates);
          if (res.title) setRateTitle(res.title);
          if (res.date) setRateDate(res.date);
          saveCivilLabourRates(res.rates);
        }
      } catch (err) {
        console.warn('Backend rate fetch skipped or offline, using local data:', err);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [companySlug]);

  // Unique groups and units for filters
  const groupsList = useMemo(() => {
    const set = new Set(rates.map(r => r.group).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [rates]);

  const unitsList = useMemo(() => {
    const set = new Set(rates.map(r => r.unit).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [rates]);

  // Filtered rates
  const filteredRates = useMemo(() => {
    return rates.filter(item => {
      if (filterGroup !== 'ALL' && item.group !== filterGroup) return false;
      if (filterUnit !== 'ALL' && item.unit !== filterUnit) return false;
      if (filterCategory !== 'ALL' && item.workCategory !== filterCategory) return false;
      if (filterMapping === 'MAPPED' && (!item.workCategory || item.workCategory === 'Unmapped' || item.workCategory === 'Other')) return false;
      if (filterMapping === 'UNMAPPED' && (item.workCategory && item.workCategory !== 'Unmapped' && item.workCategory !== 'Other')) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const srMatch = String(item.sr || '').includes(q);
        const partMatch = (item.particulars || '').toLowerCase().includes(q);
        const catMatch = (item.workCategory || '').toLowerCase().includes(q);
        const unitMatch = (item.unit || '').toLowerCase().includes(q);
        const rateMatch = String(item.rate || '').includes(q);
        return srMatch || partMatch || catMatch || unitMatch || rateMatch;
      }
      return true;
    });
  }, [rates, filterGroup, filterUnit, filterCategory, filterMapping, searchQuery]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = rates.length;
    const mapped = rates.filter(r => r.workCategory && r.workCategory !== 'Other' && r.workCategory !== 'Unmapped').length;
    const avgRate = total > 0 ? (rates.reduce((acc, curr) => acc + (parseFloat(curr.rate) || 0), 0) / total).toFixed(1) : 0;
    return { total, mapped, unmapped: total - mapped, avgRate };
  }, [rates]);

  // Update specific item field
  const handleItemChange = (id, field, value) => {
    setRates(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'rate') {
          const num = parseFloat(value) || 0;
          updated.rateText = `${num}/- per ${String(item.unit || 'sqft').toLowerCase()}`;
        }
        return updated;
      }
      return item;
    }));
  };

  // Delete single item
  const handleDeleteItem = (id) => {
    if (!window.confirm('Are you sure you want to remove this labour rate item?')) return;
    setRates(prev => {
      const filtered = prev.filter(r => r.id !== id);
      // Re-index serial numbers
      return filtered.map((r, idx) => ({ ...r, sr: idx + 1 }));
    });
  };

  // Duplicate item
  const handleDuplicateItem = (id) => {
    const target = rates.find(r => r.id === id);
    if (!target) return;
    const newItemCopy = {
      ...target,
      id: `clr-${Date.now()}`,
      particulars: `${target.particulars} (COPY)`,
    };
    const index = rates.findIndex(r => r.id === id);
    const updated = [...rates];
    updated.splice(index + 1, 0, newItemCopy);
    setRates(updated.map((r, idx) => ({ ...r, sr: idx + 1 })));
  };

  // Save changes to cloud & local
  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveSuccessMsg('');
    // 1. Always save locally first (instant)
    saveCivilLabourRates(rates);
    try {
      // 2. Save remote to MongoDB
      await saveCivilLabourRatesRemote({
        companySlug,
        title: rateTitle,
        date: rateDate,
        rates
      });
      setSaveSuccessMsg(`✅ Saved ${rates.length} rates to Cloud Database!`);
      setTimeout(() => setSaveSuccessMsg(''), 5000);
    } catch (err) {
      console.error('Error saving rates to cloud:', err);
      const msg = err?.message || 'Unknown error';
      // Still saved locally — inform user clearly
      setSaveSuccessMsg(`⚠️ Saved locally only. Cloud error: ${msg}. Try restarting the server.`);
      setTimeout(() => setSaveSuccessMsg(''), 8000);
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to original 68 rates
  const handleResetToDefault = async () => {
    if (!window.confirm('RESET ALL RATES TO THE ORIGINAL 68 SCANNED ITEMS? Any custom edits will be reverted.')) {
      return;
    }
    const def = resetCivilLabourRates();
    setRates(def);
    try {
      await resetCivilLabourRatesRemote(companySlug);
    } catch (e) {
      console.warn('Backend reset skipped:', e);
    }
    setSaveSuccessMsg('Reset to default 68 labour rates successfully!');
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  // Add new custom item
  const handleCreateItem = (e) => {
    e.preventDefault();
    if (!newItem.particulars.trim()) {
      alert('Please enter particulars description');
      return;
    }
    const item = {
      id: `clr-${Date.now()}`,
      sr: rates.length + 1,
      particulars: newItem.particulars.toUpperCase().trim(),
      unit: newItem.unit,
      rate: parseFloat(newItem.rate) || 0,
      rateText: `${newItem.rate || 0}/- per ${newItem.unit.toLowerCase()}`,
      group: newItem.group || 'Civil, Plaster & Masonry',
      workCategory: newItem.workCategory || 'Wall Tiles'
    };
    setRates(prev => [...prev, item]);
    setShowAddModal(false);
    setNewItem({
      particulars: '',
      unit: 'SQFT',
      rate: '',
      group: 'Wall Tiles & Slabs',
      workCategory: 'Wall Tiles'
    });
    setSaveSuccessMsg('New labour rate item added!');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    const exportData = rates.map(r => ({
      'SR.': r.sr,
      'PARTICULARS': r.particulars,
      'UNITS': r.unit,
      'RATE (₹)': r.rate,
      'RATE DESCRIPTION': r.rateText || `${r.rate}/- per ${r.unit.toLowerCase()}`,
      'MAPPED WORK CATEGORY': r.workCategory || 'Unmapped',
      'TRADE GROUP': r.group || 'General Civil'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Civil Labour Rates');
    XLSX.writeFile(wb, `MTS_Decor_Civil_Labour_Rates_${rateDate.replace(/\//g, '-')}.xlsx`);
  };

  // Print / PDF — opens a clean formatted rate sheet in a new window
  const handlePrint = () => {
    const printRates = filteredRates.length > 0 ? filteredRates : rates;
    const rows = printRates.map((r, idx) => `
      <tr>
        <td class="sr">${r.sr ?? idx + 1}</td>
        <td class="part">${r.particulars || ''}</td>
        <td class="unit">${r.unit || ''}</td>
        <td class="rate">₹${r.rate ?? ''}</td>
        <td class="rtext">${r.rateText || `${r.rate}/- per ${(r.unit || '').toLowerCase()}`}</td>
        <td class="cat">${r.workCategory || '—'}</td>
        <td class="grp">${r.group || '—'}</td>
      </tr>
    `).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Civil Labour Rates — MTS DECOR</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Calibri, Arial, sans-serif; font-size: 11px; color: #111; background: #fff; }
    .header { text-align: center; padding: 14px 20px 8px; border-bottom: 2.5px solid #000; margin-bottom: 8px; }
    .header h1 { font-size: 16px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; }
    .header h2 { font-size: 13px; font-weight: 700; margin-top: 2px; }
    .meta { display: flex; justify-content: space-between; padding: 4px 20px 8px; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #555; }
    table { width: 100%; border-collapse: collapse; page-break-inside: auto; }
    thead tr { background: #1a1a2e; color: #fff; }
    thead th { padding: 6px 5px; font-size: 9.5px; text-transform: uppercase; font-weight: 800; letter-spacing: 0.3px; border: 1px solid #333; }
    tbody tr { page-break-inside: avoid; }
    tbody tr:nth-child(even) { background: #f4f6fb; }
    tbody td { padding: 4px 5px; border: 1px solid #ccc; vertical-align: middle; }
    td.sr { text-align: center; font-weight: 700; width: 32px; }
    td.part { font-weight: 600; min-width: 200px; }
    td.unit { text-align: center; font-weight: 700; width: 60px; }
    td.rate { text-align: right; font-weight: 900; color: #1a4731; width: 65px; }
    td.rtext { width: 110px; font-size: 10px; color: #444; }
    td.cat { font-size: 10px; font-weight: 600; color: #1a3c6e; min-width: 120px; }
    td.grp { font-size: 10px; color: #555; min-width: 110px; }
    .footer { text-align: center; margin-top: 10px; font-size: 9px; color: #888; padding: 6px 20px; border-top: 1px solid #ccc; }
    @page { margin: 12mm 10mm; size: A4 portrait; }
    @media print { thead { display: table-header-group; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>MTS DECOR — Civil Work Only Labour Rates</h1>
    <h2>${rateTitle}</h2>
  </div>
  <div class="meta">
    <span>Date: ${rateDate}</span>
    <span>Total Items: ${printRates.length}</span>
    <span>Printed: ${new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</span>
  </div>
  <table>
    <thead>
      <tr>
        <th>SR.</th>
        <th>PARTICULARS (AS PER RATE SHEET)</th>
        <th>UNIT</th>
        <th>RATE (₹)</th>
        <th>RATE DESC.</th>
        <th>MAPPED CATEGORY</th>
        <th>TRADE GROUP</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">MTS DECOR • Civil Measurement Software • Auto-generated rate sheet • For internal use only</div>
  <script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=900,height=700');
    if (win) {
      win.document.write(html);
      win.document.close();
    } else {
      alert('Pop-up blocked. Please allow pop-ups for this site and try again.');
    }
  };

  return (
    <div className="civil-rates-manager">
      {/* ── TOP BANNER & ACTIONS ── */}
      <div className="card shadow-sm border-0 mb-3 bg-white rounded-3">
        <div className="card-body p-3 p-md-4">
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                <span className="badge bg-danger text-white px-2.5 py-1.5 fw-bold text-uppercase" style={{ letterSpacing: '0.6px' }}>
                  <i className="bi bi-hammer me-1"></i> OFFICIAL RATE MASTER
                </span>
                <span className="badge bg-dark text-white px-2 py-1 extra-small fw-bold">
                  DATE: {rateDate}
                </span>
                <span className="badge bg-primary text-white px-2 py-1 extra-small fw-bold">
                  {rates.length} ITEMS (68 DEFAULT)
                </span>
              </div>
              <h4 className="fw-bolder text-dark mb-1 text-uppercase" style={{ letterSpacing: '0.4px' }}>
                {rateTitle}
              </h4>
              <p className="text-muted small mb-0">
                Official labour rate schedule with configurable <strong>Work Category Mappings</strong> to link directly into Measurement Sheet calculations.
              </p>
            </div>

            {/* Top Action Buttons */}
            <div className="d-flex flex-wrap gap-2 align-items-center">
              <button
                type="button"
                className="btn btn-outline-primary btn-sm fw-bold text-uppercase d-flex align-items-center gap-1.5 px-3 py-2 shadow-sm"
                onClick={() => setShowImageModal(true)}
                title="View uploaded scanned rate sheet images (Page 1 & 2)"
              >
                <i className="bi bi-card-image text-primary fs-6"></i>
                <span>VIEW SCANNED SHEETS</span>
              </button>

              <button
                type="button"
                className="btn btn-outline-success btn-sm fw-bold text-uppercase d-flex align-items-center gap-1.5 px-3 py-2 shadow-sm"
                onClick={handleExportExcel}
                title="Download full rate list as Excel spreadsheet"
              >
                <i className="bi bi-file-earmark-excel-fill text-success fs-6"></i>
                <span>EXCEL</span>
              </button>

              <button
                type="button"
                className="btn btn-outline-secondary btn-sm fw-bold text-uppercase d-flex align-items-center gap-1.5 px-2.5 py-2 shadow-sm"
                onClick={handlePrint}
                title="Print or Save PDF of Labour Rate Schedule"
              >
                <i className="bi bi-printer-fill fs-6"></i>
                <span className="d-none d-sm-inline">PRINT</span>
              </button>

              <button
                type="button"
                className="btn btn-dark btn-sm fw-bold text-uppercase d-flex align-items-center gap-1.5 px-3 py-2 shadow-sm"
                onClick={() => setShowAddModal(true)}
              >
                <i className="bi bi-plus-circle-fill text-warning fs-6"></i>
                <span>ADD ITEM</span>
              </button>

              <button
                type="button"
                className="btn btn-success btn-sm fw-bold text-uppercase d-flex align-items-center gap-1.5 px-3.5 py-2 shadow-sm"
                onClick={handleSaveAll}
                disabled={isSaving}
              >
                {isSaving ? (
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                ) : (
                  <i className="bi bi-cloud-arrow-up-fill fs-6"></i>
                )}
                <span>{isSaving ? 'SAVING...' : 'SAVE TO CLOUD'}</span>
              </button>
            </div>
          </div>

          {/* Success / Warning Toast Banner */}
          {saveSuccessMsg && (
            <div className={`alert ${saveSuccessMsg.startsWith('⚠️') ? 'alert-warning' : 'alert-success'} d-flex align-items-center justify-content-between py-2 px-3 mt-3 mb-0 shadow-sm border-0 rounded-3`}>
              <div className="d-flex align-items-center gap-2">
                <i className={`bi ${saveSuccessMsg.startsWith('⚠️') ? 'bi-exclamation-triangle-fill text-warning' : 'bi-check-circle-fill text-success'} fs-5`}></i>
                <span className="fw-bold extra-small text-uppercase">{saveSuccessMsg}</span>
              </div>
              <button type="button" className="btn-close btn-sm" onClick={() => setSaveSuccessMsg('')}></button>
            </div>
          )}

          {/* KPI Mini-Cards */}
          <div className="row g-2 mt-3 pt-2 border-top">
            <div className="col-6 col-md-3">
              <div className="p-2 border rounded-3 bg-light d-flex align-items-center gap-2">
                <i className="bi bi-list-ol fs-4 text-primary"></i>
                <div>
                  <div className="extra-small text-muted fw-bold text-uppercase">Total Items</div>
                  <div className="fs-6 fw-bolder text-dark">{metrics.total}</div>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-2 border rounded-3 bg-light d-flex align-items-center gap-2">
                <i className="bi bi-check2-all fs-4 text-success"></i>
                <div>
                  <div className="extra-small text-muted fw-bold text-uppercase">Mapped to Category</div>
                  <div className="fs-6 fw-bolder text-success">{metrics.mapped} / {metrics.total}</div>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-2 border rounded-3 bg-light d-flex align-items-center gap-2">
                <i className="bi bi-question-circle fs-4 text-warning"></i>
                <div>
                  <div className="extra-small text-muted fw-bold text-uppercase">Needs Mapping</div>
                  <div className="fs-6 fw-bolder text-warning">{metrics.unmapped}</div>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-2 border rounded-3 bg-light d-flex align-items-center gap-2">
                <i className="bi bi-currency-rupee fs-4 text-danger"></i>
                <div>
                  <div className="extra-small text-muted fw-bold text-uppercase">Avg. Rate (₹)</div>
                  <div className="fs-6 fw-bolder text-dark">₹{metrics.avgRate}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FILTER & SEARCH TOOLBAR ── */}
      <div className="card shadow-sm border-0 mb-3 bg-white rounded-3">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            {/* Search Input */}
            <div className="col-12 col-md-4">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control form-control-sm border-start-0"
                  placeholder="Search by description, Sr., rate or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button className="btn btn-outline-secondary btn-sm" onClick={() => setSearchQuery('')}>
                    <i className="bi bi-x"></i>
                  </button>
                )}
              </div>
            </div>

            {/* Filter by Trade Group */}
            <div className="col-6 col-md-2">
              <select
                className="form-select form-select-sm"
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
              >
                <option value="ALL">Group: All ({groupsList.length - 1})</option>
                {groupsList.filter(g => g !== 'ALL').map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* Filter by Unit */}
            <div className="col-6 col-md-2">
              <select
                className="form-select form-select-sm"
                value={filterUnit}
                onChange={(e) => setFilterUnit(e.target.value)}
              >
                <option value="ALL">Unit: All Units</option>
                {unitsList.filter(u => u !== 'ALL').map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            {/* Filter by Mapping Status */}
            <div className="col-6 col-md-2">
              <select
                className="form-select form-select-sm"
                value={filterMapping}
                onChange={(e) => setFilterMapping(e.target.value)}
              >
                <option value="ALL">Mapping: All</option>
                <option value="MAPPED">Mapped Only</option>
                <option value="UNMAPPED">Unmapped Only</option>
              </select>
            </div>

            {/* Reset Defaults & Count */}
            <div className="col-6 col-md-2 d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-outline-danger btn-sm extra-small fw-bold text-uppercase w-100"
                onClick={handleResetToDefault}
                title="Reset all 68 items to the original scanned rate schedule"
              >
                <i className="bi bi-arrow-counterclockwise me-1"></i> RESET 68
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN RATES TABLE ── */}
      <div className="card shadow-sm border-0 bg-white rounded-3 overflow-hidden">
        <div className="card-header bg-dark text-white py-2.5 px-3 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-warning text-dark fw-bold">RATES TABLE</span>
            <span className="extra-small text-light fw-bold text-uppercase">
              Showing {filteredRates.length} of {rates.length} Rates
            </span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="extra-small text-light text-opacity-75">
              Select category in <strong>Work Category</strong> column to map
            </span>
          </div>
        </div>

        <div className="table-responsive" style={{ maxHeight: '720px' }}>
          <table className="table table-hover table-striped align-middle mb-0" style={{ fontSize: '12px' }}>
            <thead className="table-light sticky-top shadow-sm" style={{ zIndex: 10 }}>
              <tr className="text-uppercase extra-small text-secondary fw-bolder border-bottom">
                <th style={{ width: '45px' }} className="text-center">SR.</th>
                <th style={{ minWidth: '280px' }}>PARTICULARS (DESCRIPTION AS PER RATE SHEET)</th>
                <th style={{ width: '120px' }}>UNITS</th>
                <th style={{ width: '110px' }} className="text-end">RATE (₹)</th>
                <th style={{ minWidth: '230px' }} className="bg-primary-subtle text-primary fw-bold">
                  <i className="bi bi-diagram-3-fill me-1"></i> MAPPED WORK CATEGORY
                </th>
                <th style={{ width: '150px' }}>TRADE GROUP</th>
                <th style={{ width: '85px' }} className="text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredRates.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    <i className="bi bi-search fs-3 d-block mb-2 text-secondary"></i>
                    <span className="fw-bold">No labour rates match your search criteria.</span>
                    <div className="mt-2">
                      <button className="btn btn-sm btn-outline-primary" onClick={() => { setSearchQuery(''); setFilterGroup('ALL'); setFilterCategory('ALL'); setFilterUnit('ALL'); setFilterMapping('ALL'); }}>
                        Clear Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRates.map((item) => (
                  <tr key={item.id}>
                    {/* SR */}
                    <td className="text-center fw-bold text-muted">
                      {item.sr}
                    </td>

                    {/* Particulars (Editable) */}
                    <td>
                      <input
                        type="text"
                        className="form-control form-control-sm border-0 bg-transparent fw-bold text-dark px-1 py-0.5"
                        style={{ fontSize: '12px' }}
                        value={item.particulars || ''}
                        onChange={(e) => handleItemChange(item.id, 'particulars', e.target.value)}
                        title={item.particulars}
                      />
                    </td>

                    {/* Unit */}
                    <td>
                      <select
                        className="form-select form-select-sm py-0.5 px-2 fw-bold text-secondary"
                        style={{ fontSize: '11px', height: '26px' }}
                        value={item.unit || 'SQFT'}
                        onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                      >
                        <option value="RFT">RFT</option>
                        <option value="SQFT">SQFT</option>
                        <option value="NOS">NOS</option>
                        <option value="SQFT/RFT">SQFT/RFT</option>
                        <option value="PER DAY">PER DAY</option>
                        <option value="PER FLOOR PER SQFT">PER FLOOR PER SQFT</option>
                        <option value="AS PER DESING">AS PER DESING</option>
                      </select>
                    </td>

                    {/* Rate (₹) */}
                    <td className="text-end">
                      <div className="input-group input-group-sm justify-content-end" style={{ width: '100px', marginLeft: 'auto' }}>
                        <span className="input-group-text py-0 px-1 bg-light border-end-0 extra-small">₹</span>
                        <input
                          type="number"
                          step="any"
                          className="form-control form-control-sm text-end fw-bolder py-0.5 px-1.5 border-start-0 text-success"
                          style={{ fontSize: '12px', height: '26px' }}
                          value={item.rate === 0 && item.unit === 'AS PER DESING' ? '' : item.rate}
                          placeholder={item.unit === 'AS PER DESING' ? 'Quote' : '0'}
                          onChange={(e) => handleItemChange(item.id, 'rate', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </td>

                    {/* Mapped Work Category Dropdown (Core Feature!) */}
                    <td className="bg-primary-subtle bg-opacity-25">
                      <select
                        className="form-select form-select-sm py-0.5 px-2 fw-bold text-primary border-primary border-opacity-50"
                        style={{ fontSize: '11.5px', height: '28px', backgroundColor: '#eff6ff' }}
                        value={item.workCategory || 'Other'}
                        onChange={(e) => handleItemChange(item.id, 'workCategory', e.target.value)}
                        title="Map this rate to a software work category"
                      >
                        <option value="Other">Custom / Other</option>
                        {Object.entries(CATEGORIZED_WORK_TYPES).map(([groupTitle, catList]) => (
                          <optgroup key={groupTitle} label={groupTitle}>
                            {catList.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </td>

                    {/* Group / Trade Tag */}
                    <td>
                      <span className="badge bg-light text-dark border extra-small text-truncate d-inline-block" style={{ maxWidth: '140px' }}>
                        {item.group || 'Civil'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="text-center">
                      <div className="d-flex align-items-center justify-content-center gap-1">
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm p-1"
                          style={{ width: '24px', height: '24px', lineHeight: 1 }}
                          onClick={() => handleDuplicateItem(item.id)}
                          title="Duplicate item"
                        >
                          <i className="bi bi-copy" style={{ fontSize: '10px' }}></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm p-1"
                          style={{ width: '24px', height: '24px', lineHeight: 1 }}
                          onClick={() => handleDeleteItem(item.id)}
                          title="Delete item"
                        >
                          <i className="bi bi-trash3" style={{ fontSize: '10px' }}></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="card-footer bg-light p-3 d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2">
          <div className="extra-small text-muted">
            Rates auto-sync with Measurement Sheet RA Bill mode for automated estimate and invoice generation.
          </div>
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-success btn-sm fw-bold text-uppercase px-3 shadow-sm"
              onClick={handleSaveAll}
              disabled={isSaving}
            >
              <i className="bi bi-cloud-check-fill me-1"></i> SAVE CHANGES
            </button>
          </div>
        </div>
      </div>

      {/* ── MODAL: SCANNED RATE SHEET VIEWER (Side-by-Side Images) ── */}
      {showImageModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1060 }} tabIndex="-1">
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-dark text-white py-2 px-3">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-danger text-white px-2 py-1">SCANNED RATE SHEETS</span>
                  <span className="fw-bold extra-small text-uppercase">
                    CIVIL WORK ONLY LABOUR RATES — DATE: {rateDate}
                  </span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  {/* Page Switcher */}
                  <div className="btn-group btn-group-sm" role="group">
                    <button
                      type="button"
                      className={`btn btn-sm ${activeImagePage === 1 ? 'btn-primary' : 'btn-outline-light'} px-3 fw-bold`}
                      onClick={() => setActiveImagePage(1)}
                    >
                      PAGE 1 (SR. 1 – 35)
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${activeImagePage === 2 ? 'btn-primary' : 'btn-outline-light'} px-3 fw-bold`}
                      onClick={() => setActiveImagePage(2)}
                    >
                      PAGE 2 (SR. 36 – 68)
                    </button>
                  </div>
                  <button type="button" className="btn-close btn-close-white ms-2" onClick={() => setShowImageModal(false)}></button>
                </div>
              </div>

              <div className="modal-body p-2 text-center bg-secondary bg-opacity-10" style={{ minHeight: '650px' }}>
                <div className="mb-2 text-start px-2 d-flex justify-content-between align-items-center">
                  <span className="extra-small text-muted fw-bold text-uppercase">
                    Showing Original Uploaded Sheet {activeImagePage} of 2
                  </span>
                  <a
                    href={activeImagePage === 1 ? '/civil-rates/civil_labour_rates_page_1.png' : '/civil-rates/civil_labour_rates_page_2.png'}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-outline-dark btn-sm extra-small py-0.5 px-2"
                  >
                    <i className="bi bi-box-arrow-up-right me-1"></i> Open Full Resolution
                  </a>
                </div>

                <div className="border rounded-2 overflow-auto bg-white p-2 shadow-sm d-inline-block" style={{ maxWidth: '100%' }}>
                  <img
                    src={activeImagePage === 1 ? '/civil-rates/civil_labour_rates_page_1.png' : '/civil-rates/civil_labour_rates_page_2.png'}
                    alt={`Civil Labour Rates Page ${activeImagePage}`}
                    className="img-fluid rounded shadow-sm"
                    style={{ maxHeight: '78vh', objectFit: 'contain' }}
                  />
                </div>
              </div>

              <div className="modal-footer bg-light py-2 px-3 justify-content-between">
                <span className="extra-small text-muted">
                  Use this viewer to compare rates directly against your physical printed copy.
                </span>
                <button type="button" className="btn btn-secondary btn-sm fw-bold px-3" onClick={() => setShowImageModal(false)}>
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD CUSTOM LABOUR RATE ITEM ── */}
      {showAddModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }} tabIndex="-1">
          <div className="modal-dialog modal-md modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <form onSubmit={handleCreateItem}>
                <div className="modal-header bg-dark text-white py-2.5 px-3">
                  <h6 className="modal-title fw-bold text-uppercase d-flex align-items-center gap-2">
                    <i className="bi bi-plus-circle-fill text-warning"></i> Add Custom Labour Rate
                  </h6>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowAddModal(false)}></button>
                </div>

                <div className="modal-body p-3">
                  <div className="mb-3">
                    <label className="form-label extra-small fw-bold text-uppercase text-muted">
                      Particulars (Work Description) *
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm text-uppercase fw-bold"
                      placeholder="e.g. 1200 X 1200 SPECIAL TILE FIXING"
                      required
                      value={newItem.particulars}
                      onChange={(e) => setNewItem({ ...newItem, particulars: e.target.value })}
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label extra-small fw-bold text-uppercase text-muted">Unit of Measurement</label>
                      <select
                        className="form-select form-select-sm fw-bold"
                        value={newItem.unit}
                        onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                      >
                        <option value="SQFT">SQFT</option>
                        <option value="RFT">RFT</option>
                        <option value="NOS">NOS</option>
                        <option value="SQFT/RFT">SQFT/RFT</option>
                        <option value="PER DAY">PER DAY</option>
                        <option value="PER FLOOR PER SQFT">PER FLOOR PER SQFT</option>
                        <option value="AS PER DESING">AS PER DESING</option>
                      </select>
                    </div>

                    <div className="col-6">
                      <label className="form-label extra-small fw-bold text-uppercase text-muted">Rate (₹)</label>
                      <input
                        type="number"
                        step="any"
                        className="form-control form-control-sm fw-bold text-success"
                        placeholder="e.g. 85"
                        required
                        value={newItem.rate}
                        onChange={(e) => setNewItem({ ...newItem, rate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label extra-small fw-bold text-uppercase text-primary">
                      Map to Work Category (For Measurement Sheet)
                    </label>
                    <select
                      className="form-select form-select-sm fw-bold border-primary"
                      value={newItem.workCategory}
                      onChange={(e) => setNewItem({ ...newItem, workCategory: e.target.value })}
                    >
                      <option value="Other">Custom / Other</option>
                      {Object.entries(CATEGORIZED_WORK_TYPES).map(([groupTitle, catList]) => (
                        <optgroup key={groupTitle} label={groupTitle}>
                          {catList.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label extra-small fw-bold text-uppercase text-muted">Trade Group</label>
                    <select
                      className="form-select form-select-sm"
                      value={newItem.group}
                      onChange={(e) => setNewItem({ ...newItem, group: e.target.value })}
                    >
                      <option value="Wall Tiles & Slabs">Wall Tiles & Slabs</option>
                      <option value="Flooring & Koba">Flooring & Koba</option>
                      <option value="Sills & Marble">Sills & Marble</option>
                      <option value="Kitchen & Platforms">Kitchen & Platforms</option>
                      <option value="Staircase (Treads & Risers)">Staircase (Treads & Risers)</option>
                      <option value="Cutting & Openings">Cutting & Openings</option>
                      <option value="Moulding & Edges">Moulding & Edges</option>
                      <option value="Civil, Plaster & Masonry">Civil, Plaster & Masonry</option>
                      <option value="Finishing & Joint Treatments">Finishing & Joint Treatments</option>
                      <option value="Labour Wages">Labour Wages</option>
                      <option value="Material Shifting & Labour">Material Shifting & Labour</option>
                    </select>
                  </div>
                </div>

                <div className="modal-footer bg-light py-2 px-3">
                  <button type="button" className="btn btn-secondary btn-sm fw-bold" onClick={() => setShowAddModal(false)}>
                    CANCEL
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm fw-bold text-uppercase">
                    ADD TO LIST
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
