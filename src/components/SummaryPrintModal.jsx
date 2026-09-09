import React from 'react';
import { formatNumber, formatCurrency, formatDateDisplay } from '../utils/calculations';
import { numberToIndianWords } from '../utils/numberToWords';

export default function SummaryPrintModal({
  show,
  onClose,
  projectData,
  grandTotals,
  billingMode = false,
  currencySymbol = '₹',
  raBilling = null
}) {
  if (!show || !projectData) return null;

  const header = projectData.header || {};
  const categoryRollup = grandTotals?.categoryRollup || [];
  const totalNetQty = grandTotals?.totalNetQty || 0;
  const totalNetAmount = grandTotals?.totalNetAmount || 0;
  const totalGrossAmount = grandTotals?.totalGrossAmount || totalNetAmount;
  const taxAmount = grandTotals?.taxAmount || 0;
  const grandTotalPayable = grandTotals?.grandTotalPayable || totalNetAmount;

  // RA Billing parameters if configured
  const raNumber = raBilling?.raBillNumber || 'FINAL PROJECT ABSTRACT';
  const retentionPercent = parseFloat(raBilling?.retentionPercent) || 0;
  const retentionAmount = roundVal((totalNetAmount * retentionPercent) / 100);
  const advanceRecovery = parseFloat(raBilling?.mobilizationAdvanceRecovery) || 0;
  const tdsPercent = parseFloat(raBilling?.tdsPercent) || 0;
  const tdsAmount = roundVal((totalNetAmount * tdsPercent) / 100);
  const otherDeductions = parseFloat(raBilling?.otherDeductions) || 0;
  const previousPaid = parseFloat(raBilling?.previousPaidAmount) || 0;

  const netDeductions = retentionAmount + advanceRecovery + tdsAmount + otherDeductions;
  const currentNetPayable = Math.max(0, grandTotalPayable - netDeductions - previousPaid);

  function roundVal(v) {
    return Math.round((parseFloat(v) || 0) * 100) / 100;
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1070 }}>
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content shadow-lg border-0 rounded-3 overflow-hidden">
          {/* Action Header - Hidden on Print */}
          <div className="modal-header bg-dark text-white py-2 px-4 d-print-none">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-printer-fill fs-5 text-warning"></i>
              <div>
                <h6 className="modal-title fw-bold mb-0">Executive Abstract of Measurement &amp; Billing Summary</h6>
                <small className="text-secondary">Official executive A4 print preview &amp; sign-off sheet</small>
              </div>
            </div>
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-sm btn-primary fw-bold px-3 shadow-sm" onClick={handlePrint}>
                <i className="bi bi-printer me-1"></i> Print / Save PDF
              </button>
              <button type="button" className="btn btn-sm btn-outline-light" onClick={onClose}>
                Close
              </button>
            </div>
          </div>

          {/* Printable A4 Document Body */}
          <div className="modal-body p-3 p-md-5 bg-light print-modal-body" style={{ minHeight: '600px' }}>
            <div className="bg-white p-4 p-md-5 shadow-sm rounded-1 mx-auto print-page-container" style={{ maxWidth: '900px', border: '1px solid #ddd' }}>
              
              {/* Document Header */}
              <div className="text-center pb-3 border-bottom border-2 border-dark mb-4">
                <h3 className="fw-bolder text-uppercase mb-1 tracking-wider text-dark" style={{ letterSpacing: '1.5px', fontSize: '1.35rem' }}>
                  {header.contractorName || 'MTS DECOR'}
                </h3>
                <div className="text-muted small mb-2 fw-semibold">
                  Interior Decoration, Turnkey Contracting &amp; Civil Measurement Specialists
                </div>
                <div className="badge bg-dark text-white text-uppercase px-3 py-1 fs-6 fw-bold tracking-wide">
                  ABSTRACT OF MEASUREMENT &amp; SUMMARY SHEET ({raNumber})
                </div>
              </div>

              {/* Project Meta Info Grid */}
              <div className="row g-3 mb-4 p-3 bg-light rounded border border-secondary-subtle small">
                <div className="col-6 col-md-3">
                  <span className="text-secondary d-block extra-small text-uppercase fw-bold">Project Name:</span>
                  <span className="fw-bold text-dark fs-6">{header.projectName || 'Project'}</span>
                </div>
                <div className="col-6 col-md-3">
                  <span className="text-secondary d-block extra-small text-uppercase fw-bold">Client / Authority:</span>
                  <span className="fw-bold text-dark">{header.clientName || 'Client Representative'}</span>
                </div>
                <div className="col-6 col-md-3">
                  <span className="text-secondary d-block extra-small text-uppercase fw-bold">Site Location:</span>
                  <span className="fw-semibold text-dark">{header.location || header.siteAddress || 'Site'}</span>
                </div>
                <div className="col-6 col-md-3">
                  <span className="text-secondary d-block extra-small text-uppercase fw-bold">Date of Measurement:</span>
                  <span className="fw-semibold text-dark">{formatDateDisplay(header.date) || new Date().toLocaleDateString()}</span>
                </div>
              </div>

              {/* Abstract Table */}
              <div className="table-responsive mb-4">
                <table className="table table-bordered border-dark align-middle mb-0" style={{ fontSize: '12px' }}>
                  <thead className="table-dark text-center text-uppercase fw-bold">
                    <tr>
                      <th style={{ width: '50px' }}>Item</th>
                      <th>Work Description / Work Category</th>
                      <th style={{ width: '80px' }}>Unit</th>
                      <th style={{ width: '130px' }} className="text-end">Measured Net Qty</th>
                      {billingMode && <th style={{ width: '120px' }} className="text-end">Unit Rate ({currencySymbol})</th>}
                      {billingMode && <th style={{ width: '140px' }} className="text-end">Total Amount ({currencySymbol})</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {categoryRollup.map((row, idx) => {
                      const effRate = row.totalQty > 0 ? (row.totalAmount / row.totalQty) : 0;
                      return (
                        <tr key={idx}>
                          <td className="text-center fw-bold">{idx + 1}</td>
                          <td>
                            <span className="fw-bold text-dark text-uppercase">{row.parentCategory}</span>
                            {row.flatsList && (
                              <small className="d-block text-muted extra-small">
                                Location: {row.flatsList} ({row.itemsCount} measurements)
                              </small>
                            )}
                          </td>
                          <td className="text-center fw-semibold">
                            <span className="badge bg-light text-dark border">{row.unit}</span>
                          </td>
                          <td className="text-end fw-bold font-monospace">
                            {formatNumber(row.totalQty)}
                          </td>
                          {billingMode && (
                            <td className="text-end font-monospace">
                              {effRate > 0 ? formatNumber(effRate, 2) : '-'}
                            </td>
                          )}
                          {billingMode && (
                            <td className="text-end fw-bold font-monospace text-dark">
                              {formatCurrency(row.totalAmount, currencySymbol)}
                            </td>
                          )}
                        </tr>
                      );
                    })}

                    {/* Total Net Row */}
                    <tr className="table-light fw-bold border-top border-2 border-dark">
                      <td colSpan={3} className="text-end text-uppercase pe-3">Total Net Measurements:</td>
                      <td className="text-end font-monospace text-primary fs-6">{formatNumber(totalNetQty)}</td>
                      {billingMode && <td></td>}
                      {billingMode && (
                        <td className="text-end font-monospace text-dark fs-6">
                          {formatCurrency(totalNetAmount, currencySymbol)}
                        </td>
                      )}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Financial Deductions & Summary (When Billing Mode is ON) */}
              {billingMode && (
                <div className="row g-4 mb-4">
                  <div className="col-12 col-md-6">
                    <div className="p-3 bg-light rounded border h-100">
                      <h6 className="fw-bold text-dark mb-2 extra-small text-uppercase">
                        <i className="bi bi-info-circle me-1 text-primary"></i> Contract &amp; Billing Notes
                      </h6>
                      <ul className="text-muted extra-small ps-3 mb-0" style={{ lineHeight: '1.6' }}>
                        <li>All measurements executed and checked on site in accordance with standard civil conventions.</li>
                        <li>Net quantities represent gross additions strictly less opening deductions (doors, windows, cutouts).</li>
                        <li>Rates are inclusive of labor, specialized tools, and surface preparation.</li>
                      </ul>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="p-3 bg-light rounded border">
                      <div className="d-flex justify-content-between py-1 small">
                        <span className="text-secondary">Gross Work Done:</span>
                        <span className="fw-semibold font-monospace">{formatCurrency(totalGrossAmount, currencySymbol)}</span>
                      </div>
                      <div className="d-flex justify-content-between py-1 small border-top">
                        <span className="text-dark fw-bold">Net Work Value:</span>
                        <span className="fw-bold font-monospace">{formatCurrency(totalNetAmount, currencySymbol)}</span>
                      </div>
                      {retentionPercent > 0 && (
                        <div className="d-flex justify-content-between py-1 small text-danger">
                          <span>Less: Retention Money ({retentionPercent}%):</span>
                          <span className="font-monospace">-{formatCurrency(retentionAmount, currencySymbol)}</span>
                        </div>
                      )}
                      {advanceRecovery > 0 && (
                        <div className="d-flex justify-content-between py-1 small text-danger">
                          <span>Less: Mobilization Advance Recovery:</span>
                          <span className="font-monospace">-{formatCurrency(advanceRecovery, currencySymbol)}</span>
                        </div>
                      )}
                      {tdsPercent > 0 && (
                        <div className="d-flex justify-content-between py-1 small text-danger">
                          <span>Less: TDS ({tdsPercent}%):</span>
                          <span className="font-monospace">-{formatCurrency(tdsAmount, currencySymbol)}</span>
                        </div>
                      )}
                      {otherDeductions > 0 && (
                        <div className="d-flex justify-content-between py-1 small text-danger">
                          <span>Less: Other Deductions / Debits:</span>
                          <span className="font-monospace">-{formatCurrency(otherDeductions, currencySymbol)}</span>
                        </div>
                      )}
                      {taxAmount > 0 && (
                        <div className="d-flex justify-content-between py-1 small text-secondary border-top">
                          <span>GST / Tax:</span>
                          <span className="font-monospace">+{formatCurrency(taxAmount, currencySymbol)}</span>
                        </div>
                      )}
                      {previousPaid > 0 && (
                        <div className="d-flex justify-content-between py-1 small text-secondary">
                          <span>Less: Amount Certified in Previous Bills:</span>
                          <span className="font-monospace">-{formatCurrency(previousPaid, currencySymbol)}</span>
                        </div>
                      )}
                      <div className="d-flex justify-content-between pt-2 border-top border-2 border-dark mt-1">
                        <span className="fw-bolder fs-6 text-dark text-uppercase">Net Interim Payable:</span>
                        <span className="fw-bolder fs-5 text-primary font-monospace">
                          {formatCurrency(currentNetPayable, currencySymbol)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Amount In Words */}
              {billingMode && (
                <div className="p-3 bg-light rounded border mb-4">
                  <div className="extra-small text-uppercase text-secondary fw-bold">Net Payable Amount in Words:</div>
                  <div className="fw-bold text-dark fst-italic">
                    {numberToIndianWords(currentNetPayable)}
                  </div>
                </div>
              )}

              {/* Formal Tripartite Certification Block */}
              <div className="row g-3 pt-4 border-top border-dark text-center mt-5">
                <div className="col-4">
                  <div style={{ height: '55px' }}></div>
                  <div className="border-top border-dark pt-1">
                    <div className="fw-bold text-dark extra-small text-uppercase">Site Engineer</div>
                    <small className="text-muted extra-small">Measured &amp; Recorded</small>
                  </div>
                </div>
                <div className="col-4">
                  <div style={{ height: '55px' }}></div>
                  <div className="border-top border-dark pt-1">
                    <div className="fw-bold text-dark extra-small text-uppercase">Project Manager / Contractor</div>
                    <small className="text-muted extra-small">Checked &amp; Certified</small>
                  </div>
                </div>
                <div className="col-4">
                  <div style={{ height: '55px' }}>
                    {projectData?.clientApproval?.approved && (
                      <div className="badge bg-success-subtle text-success border border-success extra-small py-1 px-2">
                        <i className="bi bi-patch-check-fill me-1"></i> Digitally Signed &amp; Sealed
                      </div>
                    )}
                  </div>
                  <div className="border-top border-dark pt-1">
                    <div className="fw-bold text-dark extra-small text-uppercase">Client / Architect</div>
                    <small className="text-muted extra-small">
                      {projectData?.clientApproval?.signerName
                        ? `Approved by ${projectData.clientApproval.signerName}`
                        : 'Verified & Accepted'}
                    </small>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
