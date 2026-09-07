import React from 'react';
import { formatNumber, formatCurrency } from '../utils/calculations';

export default function QuickStatsBar({ grandTotals: rawTotals, billingMode, currencySymbol = '₹' }) {
  const grandTotals = rawTotals || {
    unitRollup: {},
    totalLineItems: 0,
    totalLessQty: 0,
    totalNetQty: 0,
    totalNetAmount: 0,
    totalPayable: 0,
    taxAmount: 0
  };
  const sftData = grandTotals.unitRollup?.['SFT'] || { net: 0 };
  const rftData = grandTotals.unitRollup?.['RFT'] || { net: 0 };

  return (
    <div className="container-fluid px-2 px-md-3 mb-3 mb-md-4">
      <div className="row g-2 g-md-3">
        {/* Total Area (SFT) */}
        <div className="col-6 col-md-3 col-lg-2">
          <div className="card stat-card shadow-sm border-0 border-start border-primary border-4 h-100">
            <div className="card-body p-2 p-md-3">
              <div className="text-muted extra-small fw-semibold text-uppercase text-truncate">Total Area (SFT)</div>
              <div className="fs-4 fw-bold text-primary mt-1">
                {formatNumber(sftData.net)} <small className="fs-6 text-secondary fw-normal">sft</small>
              </div>
              {sftData.less > 0 && (
                <div className="text-muted extra-small">
                  Less: <span className="text-danger">-{formatNumber(sftData.less)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Total Linear (RFT) */}
        <div className="col-6 col-md-3 col-lg-2">
          <div className="card stat-card shadow-sm border-0 border-start border-info border-4 h-100">
            <div className="card-body p-2 p-md-3">
              <div className="text-muted extra-small fw-semibold text-uppercase text-truncate">Running Length</div>
              <div className="fs-4 fw-bold text-dark mt-1">
                {formatNumber(rftData.net)} <small className="fs-6 text-secondary fw-normal">rft</small>
              </div>
              <div className="text-muted extra-small">
                Gross: {formatNumber(rftData.gross)}
              </div>
            </div>
          </div>
        </div>

        {/* Total Line Items */}
        <div className="col-6 col-md-3 col-lg-2">
          <div className="card stat-card shadow-sm border-0 border-start border-secondary border-4 h-100">
            <div className="card-body p-2 p-md-3">
              <div className="text-muted extra-small fw-semibold text-uppercase text-truncate">Line Items</div>
              <div className="fs-4 fw-bold text-dark mt-1">
                {grandTotals.totalLineItems} <small className="fs-6 text-muted fw-normal">entries</small>
              </div>
              <div className="text-muted extra-small">
                Deductions: <span className="text-danger">{grandTotals.totalLessQty > 0 ? 'Active' : 'None'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Total Net Quantity across all units */}
        <div className="col-6 col-md-3 col-lg-2">
          <div className="card stat-card shadow-sm border-0 border-start border-success border-4 h-100">
            <div className="card-body p-2 p-md-3">
              <div className="text-muted extra-small fw-semibold text-uppercase text-truncate">Net Measured Qty</div>
              <div className="fs-4 fw-bold text-success mt-1">
                {formatNumber(grandTotals.totalNetQty)}
              </div>
              <div className="text-muted extra-small">
                Gross: {formatNumber(grandTotals.totalGrossQty)}
              </div>
            </div>
          </div>
        </div>

        {/* Billing Mode Amounts */}
        {billingMode ? (
          <>
            <div className="col-12 col-md-6 col-lg-4">
              <div className="card stat-card shadow-sm border-0 border-start border-warning border-4 bg-warning-subtle h-100">
                <div className="card-body p-2 p-md-3 d-flex justify-content-between align-items-center">
                  <div>
                    <div className="text-dark small fw-bold text-uppercase">Total Payable (RA Bill)</div>
                    <div className="fs-3 fw-bolder text-dark mt-1">
                      {formatCurrency(grandTotals.grandTotalPayable, currencySymbol)}
                    </div>
                    {grandTotals.taxAmount > 0 && (
                      <div className="text-secondary extra-small">
                        Net: {formatCurrency(grandTotals.totalNetAmount, currencySymbol)} + Tax: {formatCurrency(grandTotals.taxAmount, currencySymbol)}
                      </div>
                    )}
                  </div>
                  <i className="bi bi-cash-coin fs-1 text-warning opacity-75"></i>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="col-12 col-md-6 col-lg-4">
            <div className="card stat-card shadow-sm border-0 border-start border-light-subtle h-100 bg-white d-flex justify-content-center p-3">
              <div className="d-flex align-items-center gap-3">
                <i className="bi bi-info-circle-fill text-primary fs-3"></i>
                <div className="small text-secondary">
                  <strong>Measurement Mode</strong>: Quantities auto-calculated by formula. Enable <em>RA Bill / Rates Mode</em> in header to enter unit rates and generate billing values.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
