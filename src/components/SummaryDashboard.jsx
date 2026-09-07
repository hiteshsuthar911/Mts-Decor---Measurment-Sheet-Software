import React, { useState } from 'react';
import { formatNumber, formatCurrency } from '../utils/calculations';

export default function SummaryDashboard({ grandTotals: rawTotals, billingMode, currencySymbol = '₹' }) {
  const [activeTab, setActiveTab] = useState('category'); // 'category' | 'unit' | 'floor'
  const grandTotals = rawTotals || {
    categoryRollup: [],
    unitRollup: {},
    floorRollup: {},
    totalNetQty: 0,
    totalNetAmount: 0,
    totalPayable: 0
  };

  return (
    <div className="card summary-dashboard shadow-sm border-0 border-top border-4 border-dark mt-5 mb-5">
      <div className="card-header bg-white py-3">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div>
            <h5 className="card-title fw-bold text-dark mb-0 d-flex align-items-center gap-2">
              <i className="bi bi-pie-chart-fill text-primary"></i>
              Executive Summary Dashboard &amp; Roll-Up
            </h5>
            <div className="text-muted small">
              Automated consolidation of measurements and billings grouped across all flats and rooms.
            </div>
          </div>

          {/* View Filter Tabs */}
          <div className="btn-group btn-group-sm" role="group">
            <button
              type="button"
              className={`btn ${activeTab === 'category' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setActiveTab('category')}
            >
              <i className="bi bi-layers-half me-1"></i> By Work Category
            </button>
            <button
              type="button"
              className={`btn ${activeTab === 'unit' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setActiveTab('unit')}
            >
              <i className="bi bi-rulers me-1"></i> By Unit (SFT/RFT)
            </button>
            <button
              type="button"
              className={`btn ${activeTab === 'floor' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setActiveTab('floor')}
            >
              <i className="bi bi-building me-1"></i> By Floor
            </button>
          </div>
        </div>
      </div>

      <div className="card-body p-3 p-md-4">
        {/* Tab 1: Roll-up grouped by Work Category across all flats */}
        {activeTab === 'category' && (
          <div className="table-responsive">
            <table className="table table-hover table-bordered align-middle">
              <thead className="table-dark small text-uppercase">
                <tr>
                  <th>#</th>
                  <th>Work Category (Work Detail)</th>
                  <th className="text-center">Unit</th>
                  <th>Flats / Units Covered</th>
                  <th className="text-center">Items Count</th>
                  <th className="text-end">Total Net Quantity</th>
                  {billingMode && <th className="text-end">Total Net Amount</th>}
                </tr>
              </thead>
              <tbody>
                {grandTotals.categoryRollup.map((row, idx) => (
                  <tr key={idx}>
                    <td className="text-center text-muted small">{idx + 1}</td>
                    <td className="fw-semibold text-dark">{row.parentCategory}</td>
                    <td className="text-center">
                      <span className="badge bg-secondary-subtle text-secondary fw-semibold">
                        {row.unit}
                      </span>
                    </td>
                    <td className="small text-muted">
                      {row.flatsList || 'All Locations'}
                    </td>
                    <td className="text-center small">{row.itemsCount}</td>
                    <td className="text-end fw-bold text-primary">
                      {formatNumber(row.totalQty)} <small className="text-muted fw-normal">{row.unit}</small>
                    </td>
                    {billingMode && (
                      <td className="text-end fw-bold text-dark">
                        {formatCurrency(row.totalAmount, currencySymbol)}
                      </td>
                    )}
                  </tr>
                ))}

                {grandTotals.categoryRollup.length === 0 && (
                  <tr>
                    <td colSpan={billingMode ? 7 : 6} className="text-center py-4 text-muted">
                      No measurements available to summarize.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="table-light fw-bold border-top border-2">
                <tr>
                  <td colSpan={5} className="text-end text-uppercase">Grand Total Net Quantity:</td>
                  <td className="text-end text-primary fs-6">{formatNumber(grandTotals.totalNetQty)}</td>
                  {billingMode && (
                    <td className="text-end text-dark fs-6">{formatCurrency(grandTotals.totalNetAmount, currencySymbol)}</td>
                  )}
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Tab 2: Roll-up grouped by Unit (SFT, SQM, RFT, RMT, NOS) */}
        {activeTab === 'unit' && (
          <div className="row g-3">
            {Object.entries(grandTotals.unitRollup).map(([unit, data]) => (
              <div key={unit} className="col-12 col-md-6 col-lg-3">
                <div className="p-3 rounded border bg-light">
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

        {/* Tab 3: Roll-up grouped by Floor */}
        {activeTab === 'floor' && (
          <div className="table-responsive">
            <table className="table table-bordered table-hover">
              <thead className="table-light small text-uppercase">
                <tr>
                  <th>Floor Number</th>
                  <th className="text-center">Line Items Measured</th>
                  <th className="text-end">Total Net Quantity</th>
                  {billingMode && <th className="text-end">Total Billing Amount</th>}
                </tr>
              </thead>
              <tbody>
                {Object.entries(grandTotals.floorRollup).map(([floor, data], i) => (
                  <tr key={i}>
                    <td className="fw-bold text-dark">{floor}</td>
                    <td className="text-center">{data.itemsCount}</td>
                    <td className="text-end fw-semibold text-primary">{formatNumber(data.netQty)}</td>
                    {billingMode && (
                      <td className="text-end fw-semibold text-dark">{formatCurrency(data.netAmount, currencySymbol)}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Financial Billing Roll-up (When billing mode is ON) */}
        {billingMode && (
          <div className="mt-4 p-3 bg-warning-subtle rounded border border-warning">
            <div className="row g-3 align-items-center">
              <div className="col-12 col-md-7">
                <h6 className="fw-bold text-dark mb-1">
                  <i className="bi bi-receipt me-1"></i> Interim Payment Certificate (RA Bill) Summary
                </h6>
                <p className="text-secondary small mb-0">
                  Calculated from net quantities (Gross additions minus LESS deductions) multiplied by corresponding unit rates.
                </p>
              </div>
              <div className="col-12 col-md-5">
                <div className="bg-white p-3 rounded border shadow-sm">
                  <div className="d-flex justify-content-between py-1 small">
                    <span className="text-secondary">Gross Amount:</span>
                    <span className="fw-semibold">{formatCurrency(grandTotals.totalGrossAmount, currencySymbol)}</span>
                  </div>
                  {grandTotals.totalLessQty > 0 && (
                    <div className="d-flex justify-content-between py-1 small">
                      <span className="text-danger">Less Deductions:</span>
                      <span className="fw-semibold text-danger">-{formatCurrency(grandTotals.totalGrossAmount - grandTotals.totalNetAmount, currencySymbol)}</span>
                    </div>
                  )}
                  <div className="d-flex justify-content-between py-1 border-top small">
                    <span className="text-dark fw-bold">Net Work Done:</span>
                    <span className="fw-bold">{formatCurrency(grandTotals.totalNetAmount, currencySymbol)}</span>
                  </div>
                  {grandTotals.taxAmount > 0 && (
                    <div className="d-flex justify-content-between py-1 small text-secondary">
                      <span>GST / Tax:</span>
                      <span>+{formatCurrency(grandTotals.taxAmount, currencySymbol)}</span>
                    </div>
                  )}
                  <div className="d-flex justify-content-between pt-2 border-top border-2">
                    <span className="fs-6 fw-bolder text-dark">Total Net Payable:</span>
                    <span className="fs-5 fw-bolder text-primary">
                      {formatCurrency(grandTotals.grandTotalPayable, currencySymbol)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
