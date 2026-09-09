import React, { useState } from 'react';
import { formatNumber, formatCurrency } from '../utils/calculations';
import { numberToIndianWords } from '../utils/numberToWords';

export default function SummaryDashboard({
  grandTotals: rawTotals,
  billingMode = false,
  currencySymbol = '₹',
  projectData,
  onUpdateCategoryRate,
  onOpenRateMaster,
  onOpenSummaryPrint,
  onOpenGstInvoice,
  onUpdateRaBilling
}) {
  const [activeTab, setActiveTab] = useState('category'); // 'category' | 'unit' | 'floor' | 'raBilling'
  const [expandedCategory, setExpandedCategory] = useState(null);

  const grandTotals = rawTotals || {
    categoryRollup: [],
    unitRollup: {},
    floorRollup: {},
    totalGrossQty: 0,
    totalLessQty: 0,
    totalNetQty: 0,
    totalGrossAmount: 0,
    totalNetAmount: 0,
    taxAmount: 0,
    grandTotalPayable: 0
  };

  const areas = projectData?.areas || [];
  const raBilling = projectData?.data?.raBilling || projectData?.raBilling || {};

  // RA Billing state
  const [raEnabled, setRaEnabled] = useState(raBilling.enabled || false);
  const [raBillNumber, setRaBillNumber] = useState(raBilling.raBillNumber || 'RA Bill 01');
  const [previousCertified, setPreviousCertified] = useState(raBilling.previousCertifiedAmount || 0);
  const [retentionPercent, setRetentionPercent] = useState(raBilling.retentionPercent !== undefined ? raBilling.retentionPercent : 5);
  const [advanceRecovery, setAdvanceRecovery] = useState(raBilling.mobilizationAdvanceRecovery || 0);
  const [tdsPercent, setTdsPercent] = useState(raBilling.tdsPercent !== undefined ? raBilling.tdsPercent : 2);
  const [otherDeductions, setOtherDeductions] = useState(raBilling.otherDeductions || 0);

  // Financial calculations
  const netWorkValue = grandTotals.totalNetAmount || 0;
  const retentionAmount = Math.round(((netWorkValue * (parseFloat(retentionPercent) || 0)) / 100) * 100) / 100;
  const tdsAmount = Math.round(((netWorkValue * (parseFloat(tdsPercent) || 0)) / 100) * 100) / 100;
  const numAdvRecovery = parseFloat(advanceRecovery) || 0;
  const numOtherDeductions = parseFloat(otherDeductions) || 0;
  const numPrevPaid = parseFloat(previousCertified) || 0;
  const totalDeductions = retentionAmount + tdsAmount + numAdvRecovery + numOtherDeductions;
  const netDueThisBill = Math.max(0, netWorkValue - totalDeductions - numPrevPaid);

  const handleSaveRaSettings = () => {
    const updated = {
      enabled: raEnabled,
      raBillNumber: raBillNumber.trim(),
      previousCertifiedAmount: numPrevPaid,
      retentionPercent: parseFloat(retentionPercent) || 0,
      mobilizationAdvanceRecovery: numAdvRecovery,
      tdsPercent: parseFloat(tdsPercent) || 0,
      otherDeductions: numOtherDeductions
    };
    if (onUpdateRaBilling) {
      onUpdateRaBilling(updated);
    }
  };

  const handleRateInput = (parentCategory, unit, newRate) => {
    if (onUpdateCategoryRate) {
      onUpdateCategoryRate(parentCategory, newRate, unit);
    }
  };

  return (
    <div className="card summary-dashboard shadow-sm border rounded-3 overflow-hidden my-2">
      {/* Top Header & Actions Bar */}
      <div className="card-header bg-white py-2.5 px-3 px-md-4 border-bottom">
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-2">
          <div>
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-primary text-white fw-bold px-2 py-0.5" style={{ fontSize: '10px', letterSpacing: '0.4px' }}>ABSTRACT</span>
              <h6 className="card-title fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-pie-chart-fill text-primary"></i>
                Measurement Summary &amp; Bill Abstract
              </h6>
            </div>
            <div className="text-muted extra-small mt-0.5">
              Consolidated measurements, in-place rate editing, and progressive Running Account (RA) billing
            </div>
          </div>

          {/* Action Buttons */}
          <div className="d-flex flex-wrap align-items-center gap-2">
            {onOpenSummaryPrint && (
              <button
                type="button"
                className="btn btn-sm btn-outline-dark fw-bold d-inline-flex align-items-center gap-1 px-2.5 py-1"
                style={{ fontSize: '11px' }}
                onClick={onOpenSummaryPrint}
                title="Print official A4 Abstract of Measurement"
              >
                <i className="bi bi-printer-fill text-primary"></i>
                <span>Print Abstract</span>
              </button>
            )}

            {billingMode && onOpenGstInvoice && (
              <button
                type="button"
                className="btn btn-sm btn-outline-primary fw-bold d-inline-flex align-items-center gap-1 px-2.5 py-1"
                style={{ fontSize: '11px' }}
                onClick={onOpenGstInvoice}
                title="Generate GST Tax Invoice"
              >
                <i className="bi bi-receipt-cutoff text-success"></i>
                <span>GST Tax Invoice</span>
              </button>
            )}

            {onOpenRateMaster && (
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary fw-semibold d-inline-flex align-items-center gap-1 px-2 py-1"
                style={{ fontSize: '11px' }}
                onClick={onOpenRateMaster}
                title="Manage Rate Master Library"
              >
                <i className="bi bi-cash-coin text-warning"></i>
                <span>Rate Master</span>
              </button>
            )}
          </div>
        </div>

        {/* View Switcher Tabs Strip */}
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-2 pt-2 border-top">
          <div className="ms-nav-segmented" role="tablist">
            <button
              type="button"
              className={`ms-nav-seg-btn ${activeTab === 'category' ? 'active' : ''}`}
              onClick={() => setActiveTab('category')}
            >
              <i className="bi bi-layers-half me-1"></i> Category Abstract
            </button>
            <button
              type="button"
              className={`ms-nav-seg-btn ${activeTab === 'raBilling' ? 'active' : ''}`}
              onClick={() => setActiveTab('raBilling')}
            >
              <i className="bi bi-receipt me-1"></i> Progressive RA Billing
            </button>
            <button
              type="button"
              className={`ms-nav-seg-btn ${activeTab === 'unit' ? 'active' : ''}`}
              onClick={() => setActiveTab('unit')}
            >
              <i className="bi bi-rulers me-1"></i> By Unit
            </button>
            <button
              type="button"
              className={`ms-nav-seg-btn ${activeTab === 'floor' ? 'active' : ''}`}
              onClick={() => setActiveTab('floor')}
            >
              <i className="bi bi-building me-1"></i> By Floor
            </button>
          </div>

          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-light text-dark border extra-small">
              Total Net Qty: <strong>{formatNumber(grandTotals.totalNetQty)}</strong>
            </span>
            {billingMode && (
              <span className="badge bg-success-subtle text-success border border-success extra-small">
                Net Value: <strong>{formatCurrency(grandTotals.totalNetAmount, currencySymbol)}</strong>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="card-body p-2 p-sm-3 p-md-4">
        {/* TAB 1: Category Roll-Up with In-Place Editable Rates */}
        {activeTab === 'category' && (
          <div className="summary-tab-category">
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-2 px-1">
              <span className="text-secondary extra-small fw-semibold">
                <i className="bi bi-pencil-square me-1 text-primary"></i> Edit Unit Rates directly in the table below to automatically update sheet line items.
              </span>
              <span className="badge bg-secondary-subtle text-secondary extra-small">
                {grandTotals.categoryRollup.length} WORK CATEGORIES
              </span>
            </div>

            <div className="table-responsive border rounded-2 shadow-xs">
              <table className="table table-hover table-bordered align-middle mb-0" style={{ fontSize: '12.5px' }}>
                <thead className="xls-summary-thead text-uppercase extra-small text-center">
                  <tr>
                    <th style={{ width: '40px' }}>#</th>
                    <th style={{ width: '28%' }} className="text-start">Work Category</th>
                    <th style={{ width: '8%' }}>Unit</th>
                    <th style={{ width: '15%' }} className="text-end">Net Measured Qty</th>
                    {billingMode && (
                      <th style={{ width: '18%' }} className="text-end bg-warning-subtle text-dark">
                        Unit Rate ({currencySymbol})
                      </th>
                    )}
                    {billingMode && (
                      <th style={{ width: '18%' }} className="text-end">
                        Total Amount ({currencySymbol})
                      </th>
                    )}
                    {billingMode && (
                      <th style={{ width: '13%' }} className="text-center">
                        % Share
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {grandTotals.categoryRollup.map((row, idx) => {
                    const effRate = row.totalQty > 0 ? (row.totalAmount / row.totalQty) : 0;
                    const percentShare = grandTotals.totalNetAmount > 0
                      ? Math.round((row.totalAmount / grandTotals.totalNetAmount) * 100)
                      : 0;

                    const isExpanded = expandedCategory === row.parentCategory;
                    const categoryAreas = areas.filter(a => {
                      const catName = (a.parentCategory === 'Other' && a.customParentCategory)
                        ? a.customParentCategory
                        : (a.parentCategory || 'General Work');
                      return catName === row.parentCategory;
                    });

                    return (
                      <React.Fragment key={idx}>
                        <tr className={isExpanded ? 'table-active' : ''}>
                          <td className="text-center text-muted small">{idx + 1}</td>
                          <td>
                            <div className="d-flex align-items-center justify-content-between">
                              <span className="fw-bold text-dark text-uppercase">{row.parentCategory}</span>
                              <button
                                type="button"
                                className="btn btn-link btn-xs text-decoration-none p-0 extra-small text-primary"
                                onClick={() => setExpandedCategory(isExpanded ? null : row.parentCategory)}
                                title="View room/flat breakdown"
                              >
                                <i className={`bi ${isExpanded ? 'bi-chevron-up' : 'bi-chevron-down'} me-1`}></i>
                                {categoryAreas.length} Areas
                              </button>
                            </div>
                            {row.flatsList && (
                              <small className="text-muted extra-small d-block text-truncate" style={{ maxWidth: '300px' }}>
                                Locations: {row.flatsList} ({row.itemsCount} rows)
                              </small>
                            )}
                          </td>
                          <td className="text-center">
                            <span className="badge bg-light text-dark border fw-semibold">
                              {row.unit}
                            </span>
                          </td>
                          <td className="text-end fw-bold font-monospace text-primary">
                            {formatNumber(row.totalQty)}
                          </td>

                          {/* Editable Rate Input Column */}
                          {billingMode && (
                            <td className="text-end bg-warning-subtle">
                              <div className="input-group input-group-sm" style={{ maxWidth: '140px', marginLeft: 'auto' }}>
                                <span className="input-group-text bg-white px-1 fw-bold extra-small">{currencySymbol}</span>
                                <input
                                  type="number"
                                  step="any"
                                  min="0"
                                  className="form-control form-control-sm text-end fw-bold bg-white"
                                  defaultValue={effRate > 0 ? effRate : ''}
                                  placeholder="0.00"
                                  onBlur={(e) => handleRateInput(row.parentCategory, row.unit, e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleRateInput(row.parentCategory, row.unit, e.target.value);
                                      e.target.blur();
                                    }
                                  }}
                                />
                              </div>
                            </td>
                          )}

                          {/* Total Amount Column */}
                          {billingMode && (
                            <td className="text-end fw-bold font-monospace text-dark">
                              {formatCurrency(row.totalAmount, currencySymbol)}
                            </td>
                          )}

                          {/* Percentage Share Progress */}
                          {billingMode && (
                            <td className="text-center">
                              <div className="d-flex align-items-center gap-1 justify-content-center">
                                <div className="progress flex-fill" style={{ height: '6px' }}>
                                  <div
                                    className="progress-bar bg-primary"
                                    role="progressbar"
                                    style={{ width: `${percentShare}%` }}
                                  ></div>
                                </div>
                                <span className="extra-small font-monospace text-muted">{percentShare}%</span>
                              </div>
                            </td>
                          )}
                        </tr>

                        {/* Expandable Breakdown of Areas under this category */}
                        {isExpanded && (
                          <tr className="bg-light">
                            <td colSpan={billingMode ? 7 : 4} className="p-3">
                              <div className="bg-white p-3 rounded border shadow-xs">
                                <h6 className="fw-bold extra-small text-uppercase text-secondary mb-2">
                                  <i className="bi bi-geo-alt-fill text-danger me-1"></i> Measured Areas Breakdown for &quot;{row.parentCategory}&quot;
                                </h6>
                                <div className="table-responsive">
                                  <table className="table table-sm table-bordered extra-small mb-0">
                                    <thead className="table-light">
                                      <tr>
                                        <th>Floor</th>
                                        <th>Flat / Unit</th>
                                        <th>Room / Area Name</th>
                                        <th className="text-center">Items</th>
                                        <th className="text-end">Area Net Qty</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {categoryAreas.map(a => (
                                        <tr key={a.id}>
                                          <td>{a.floor || '-'}</td>
                                          <td>{a.flat ? `Flat ${a.flat}` : '-'}</td>
                                          <td className="fw-semibold">{a.descriptionHeader || a.room || 'Area'}</td>
                                          <td className="text-center">{(a.items || []).length}</td>
                                          <td className="text-end font-monospace fw-bold text-primary">
                                            {formatNumber((a.items || []).reduce((acc, item) => {
                                              const qty = parseFloat(item.quantity) || 0;
                                              const l = parseFloat(item.length) || 0;
                                              const h = parseFloat(item.height) || 0;
                                              const lineTot = (qty > 0 ? qty : 1) * (l > 0 ? l : 1) * (h > 0 ? h : 1);
                                              return acc + (item.isLess ? -lineTot : lineTot);
                                            }, 0))}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}

                  {grandTotals.categoryRollup.length === 0 && (
                    <tr>
                      <td colSpan={billingMode ? 7 : 4} className="text-center py-4 text-muted">
                        No measurements available on this sheet yet.
                      </td>
                    </tr>
                  )}
                </tbody>

                <tfoot className="table-light fw-bold border-top border-2 border-dark">
                  <tr>
                    <td colSpan={3} className="text-end text-uppercase pe-3">Grand Total Net Work Done:</td>
                    <td className="text-end font-monospace text-primary fs-6">{formatNumber(grandTotals.totalNetQty)}</td>
                    {billingMode && <td></td>}
                    {billingMode && (
                      <td className="text-end font-monospace text-dark fs-6">
                        {formatCurrency(grandTotals.totalNetAmount, currencySymbol)}
                      </td>
                    )}
                    {billingMode && <td className="text-center font-monospace small">100%</td>}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: Progressive RA Billing & Statutory Deductions */}
        {activeTab === 'raBilling' && (
          <div className="summary-tab-ra-billing">
            <div className="row g-4">
              {/* Configuration Controls */}
              <div className="col-12 col-lg-6">
                <div className="card border bg-light p-3 p-md-4 rounded-3 h-100 shadow-xs">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                      <i className="bi bi-sliders text-primary"></i> RA Billing Parameters
                    </h6>
                    <span className="badge bg-warning text-dark extra-small fw-bold">Contractor Mode</span>
                  </div>

                  <div className="row g-3 small">
                    <div className="col-12 col-sm-6">
                      <label className="fw-bold text-secondary extra-small text-uppercase">RA Bill Number / Title:</label>
                      <input
                        type="text"
                        className="form-control form-control-sm fw-bold"
                        value={raBillNumber}
                        onChange={(e) => setRaBillNumber(e.target.value)}
                        placeholder="e.g. RA Bill 01"
                      />
                    </div>

                    <div className="col-12 col-sm-6">
                      <label className="fw-bold text-secondary extra-small text-uppercase">Previous Certified Paid (₹):</label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        className="form-control form-control-sm font-monospace"
                        value={previousCertified}
                        onChange={(e) => setPreviousCertified(e.target.value)}
                        placeholder="0.00"
                      />
                      <div className="extra-small text-muted mt-1">Deducts what was certified in previous bills</div>
                    </div>

                    <div className="col-6 col-sm-6">
                      <label className="fw-bold text-secondary extra-small text-uppercase">Retention Money (%):</label>
                      <div className="input-group input-group-sm">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="20"
                          className="form-control form-control-sm font-monospace"
                          value={retentionPercent}
                          onChange={(e) => setRetentionPercent(e.target.value)}
                        />
                        <span className="input-group-text">%</span>
                      </div>
                      <div className="extra-small text-muted mt-1">Standard: 5% withheld until DLP ends</div>
                    </div>

                    <div className="col-6 col-sm-6">
                      <label className="fw-bold text-secondary extra-small text-uppercase">TDS Deduction (%):</label>
                      <div className="input-group input-group-sm">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="10"
                          className="form-control form-control-sm font-monospace"
                          value={tdsPercent}
                          onChange={(e) => setTdsPercent(e.target.value)}
                        />
                        <span className="input-group-text">%</span>
                      </div>
                      <div className="extra-small text-muted mt-1">Income Tax TDS (1% or 2%)</div>
                    </div>

                    <div className="col-12 col-sm-6">
                      <label className="fw-bold text-secondary extra-small text-uppercase">Mobilization Advance Recovery (₹):</label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        className="form-control form-control-sm font-monospace"
                        value={advanceRecovery}
                        onChange={(e) => setAdvanceRecovery(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="col-12 col-sm-6">
                      <label className="fw-bold text-secondary extra-small text-uppercase">Other Debits / Penalties (₹):</label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        className="form-control form-control-sm font-monospace"
                        value={otherDeductions}
                        onChange={(e) => setOtherDeductions(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="col-12 pt-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-dark w-100 fw-bold"
                        onClick={handleSaveRaSettings}
                      >
                        <i className="bi bi-save me-1"></i> Save RA Parameters to Project
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Interim Payment Certificate Card */}
              <div className="col-12 col-lg-6">
                <div className="card border p-4 rounded-3 h-100 bg-white shadow-sm d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                      <div>
                        <span className="badge bg-primary text-white text-uppercase extra-small">Interim Payment Certificate</span>
                        <h6 className="fw-bold text-dark mt-1 mb-0">{raBillNumber || 'RA Bill Summary'}</h6>
                      </div>
                      <span className="text-muted extra-small">
                        Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    {/* Progressive Financial Statement */}
                    <div className="py-2">
                      <div className="d-flex justify-content-between py-1 small">
                        <span className="text-secondary">Gross Work Done (Cumulative):</span>
                        <span className="fw-semibold font-monospace">{formatCurrency(grandTotals.totalGrossAmount, currencySymbol)}</span>
                      </div>
                      <div className="d-flex justify-content-between py-1 small border-top">
                        <span className="text-dark fw-bold">Net Work Value to Date:</span>
                        <span className="fw-bold font-monospace text-dark">{formatCurrency(netWorkValue, currencySymbol)}</span>
                      </div>

                      {/* Deductions breakdown */}
                      {retentionPercent > 0 && (
                        <div className="d-flex justify-content-between py-1 small text-danger">
                          <span>Less: Retention Money ({retentionPercent}%):</span>
                          <span className="font-monospace fw-semibold">-{formatCurrency(retentionAmount, currencySymbol)}</span>
                        </div>
                      )}

                      {numAdvRecovery > 0 && (
                        <div className="d-flex justify-content-between py-1 small text-danger">
                          <span>Less: Mobilization Advance Recovery:</span>
                          <span className="font-monospace fw-semibold">-{formatCurrency(numAdvRecovery, currencySymbol)}</span>
                        </div>
                      )}

                      {tdsPercent > 0 && (
                        <div className="d-flex justify-content-between py-1 small text-danger">
                          <span>Less: TDS ({tdsPercent}%):</span>
                          <span className="font-monospace fw-semibold">-{formatCurrency(tdsAmount, currencySymbol)}</span>
                        </div>
                      )}

                      {numOtherDeductions > 0 && (
                        <div className="d-flex justify-content-between py-1 small text-danger">
                          <span>Less: Other Debits / Penalties:</span>
                          <span className="font-monospace fw-semibold">-{formatCurrency(numOtherDeductions, currencySymbol)}</span>
                        </div>
                      )}

                      {numPrevPaid > 0 && (
                        <div className="d-flex justify-content-between py-1 small text-secondary border-top">
                          <span>Less: Paid in Previous RA Bills:</span>
                          <span className="font-monospace fw-semibold">-{formatCurrency(numPrevPaid, currencySymbol)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Net Payable Highlight */}
                  <div className="mt-3 pt-3 border-top border-2 border-dark">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-bolder fs-6 text-dark text-uppercase">Net Interim Payable:</span>
                      <span className="fw-bolder fs-4 text-success font-monospace">
                        {formatCurrency(netDueThisBill, currencySymbol)}
                      </span>
                    </div>
                    <div className="extra-small text-muted fst-italic">
                      {numberToIndianWords(netDueThisBill)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Roll-up grouped by Unit */}
        {activeTab === 'unit' && (
          <div className="row g-3">
            {Object.entries(grandTotals.unitRollup).map(([unit, data]) => (
              <div key={unit} className="col-12 col-md-6 col-lg-3">
                <div className="p-3 rounded border bg-light shadow-xs">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="badge bg-dark fs-6">{unit}</span>
                    <span className="text-muted extra-small">Unit Summary</span>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom small">
                    <span className="text-secondary">Gross Additions:</span>
                    <span className="fw-semibold">{formatNumber(data.gross)} {unit}</span>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom small">
                    <span className="text-danger">Deductions (LESS):</span>
                    <span className="fw-semibold text-danger">-{formatNumber(data.less)} {unit}</span>
                  </div>
                  <div className="d-flex justify-content-between pt-2">
                    <span className="fw-bold text-dark">Net Quantity:</span>
                    <span className="fw-bold text-primary fs-5">{formatNumber(data.net)} {unit}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: Roll-up grouped by Floor */}
        {activeTab === 'floor' && (
          <div className="summary-tab-floor">
            <div className="table-responsive border rounded">
              <table className="table table-bordered table-hover align-middle mb-0">
                <thead className="xls-summary-thead text-uppercase extra-small text-center">
                  <tr>
                    <th style={{ width: '30%' }} className="text-start">Floor Level</th>
                    <th style={{ width: '25%' }}>Line Items Measured</th>
                    <th style={{ width: '25%' }} className="text-end">Total Net Quantity</th>
                    {billingMode && <th style={{ width: '20%' }} className="text-end">Total Billing Amount</th>}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(grandTotals.floorRollup || {}).map(([floor, data], i) => (
                    <tr key={i}>
                      <td className="fw-bold text-dark">{floor}</td>
                      <td className="text-center">{data.itemsCount}</td>
                      <td className="text-end fw-semibold text-primary font-monospace">{formatNumber(data.netQty)}</td>
                      {billingMode && (
                        <td className="text-end fw-semibold text-dark font-monospace">{formatCurrency(data.netAmount, currencySymbol)}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
