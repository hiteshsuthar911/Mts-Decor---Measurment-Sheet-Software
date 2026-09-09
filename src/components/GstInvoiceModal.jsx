import React, { useState, useEffect } from 'react';
import { formatNumber, formatCurrency } from '../utils/calculations';
import { numberToIndianWords } from '../utils/numberToWords';

export default function GstInvoiceModal({
  show,
  onClose,
  projectData,
  grandTotals,
  currencySymbol = '₹'
}) {
  if (!show || !projectData) return null;

  const header = projectData.header || {};
  const totalNetAmount = grandTotals?.totalNetAmount || 0;

  // Invoice editable state
  const [invoiceNo, setInvoiceNo] = useState(`MTS-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]);
  
  // Tax state
  const [isInterState, setIsInterState] = useState(false);
  const [gstRate, setGstRate] = useState(18); // 18% standard for construction
  const [sacCode, setSacCode] = useState('9954'); // SAC for Construction and Interior Decorating Services

  // Contractor & Client details
  const [contractorName, setContractorName] = useState(header.contractorName || 'MTS DECOR');
  const [contractorGstin, setContractorGstin] = useState(header.contractorGstin || '27AADCM1234F1Z5');
  const [contractorAddress, setContractorAddress] = useState(header.contractorAddress || 'Shop No. 4, Royal Complex, S.V. Road, Mumbai - 400058');
  const [contractorPhone, setContractorPhone] = useState(header.contractorPhone || '+91 98200 12345');

  const [clientName, setClientName] = useState(header.clientName || 'Client Name');
  const [clientGstin, setClientGstin] = useState(header.clientGstin || '27AABCT9876E1Z2');
  const [siteAddress, setSiteAddress] = useState(header.location || header.siteAddress || 'Project Site, Mumbai');
  const [placeOfSupply, setPlaceOfSupply] = useState('Maharashtra (27)');

  // Bank details
  const [bankName, setBankName] = useState('HDFC Bank Ltd');
  const [accountNo, setAccountNo] = useState('50200098765432');
  const [ifscCode, setIfscCode] = useState('HDFC0001234');
  const [branch, setBranch] = useState('Andheri West, Mumbai');

  // Calculations
  const taxableValue = totalNetAmount;
  const cgstRate = isInterState ? 0 : gstRate / 2;
  const sgstRate = isInterState ? 0 : gstRate / 2;
  const igstRate = isInterState ? gstRate : 0;

  const cgstAmount = Math.round(((taxableValue * cgstRate) / 100) * 100) / 100;
  const sgstAmount = Math.round(((taxableValue * sgstRate) / 100) * 100) / 100;
  const igstAmount = Math.round(((taxableValue * igstRate) / 100) * 100) / 100;
  const totalTax = cgstAmount + sgstAmount + igstAmount;
  const totalInvoiceAmount = Math.round((taxableValue + totalTax) * 100) / 100;

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
              <i className="bi bi-receipt-cutoff fs-5 text-warning"></i>
              <div>
                <h6 className="modal-title fw-bold mb-0">Official GST Tax Invoice Generator</h6>
                <small className="text-secondary">Compliant with Indian Goods &amp; Services Tax (GST) Act</small>
              </div>
            </div>
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-sm btn-primary fw-bold px-3 shadow-sm" onClick={handlePrint}>
                <i className="bi bi-printer me-1"></i> Print / Save Invoice PDF
              </button>
              <button type="button" className="btn btn-sm btn-outline-light" onClick={onClose}>
                Close
              </button>
            </div>
          </div>

          {/* Configuration Toolbar - Hidden on Print */}
          <div className="bg-light border-bottom px-4 py-2 d-print-none">
            <div className="row g-2 align-items-center small">
              <div className="col-6 col-md-3">
                <label className="extra-small text-muted fw-bold text-uppercase d-block">Invoice Number:</label>
                <input
                  type="text"
                  className="form-control form-control-sm font-monospace fw-bold"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                />
              </div>
              <div className="col-6 col-md-2">
                <label className="extra-small text-muted fw-bold text-uppercase d-block">Invoice Date:</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                />
              </div>
              <div className="col-6 col-md-2">
                <label className="extra-small text-muted fw-bold text-uppercase d-block">Due Date:</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div className="col-6 col-md-2">
                <label className="extra-small text-muted fw-bold text-uppercase d-block">GST Rate (%):</label>
                <select
                  className="form-select form-select-sm fw-bold"
                  value={gstRate}
                  onChange={(e) => setGstRate(parseFloat(e.target.value) || 0)}
                >
                  <option value="18">18% (Standard Works)</option>
                  <option value="12">12% (Affordable/Govt Works)</option>
                  <option value="5">5% (Specified Concession)</option>
                  <option value="0">0% (Nil / Exempt)</option>
                </select>
              </div>
              <div className="col-12 col-md-3">
                <div className="form-check form-switch pt-3">
                  <input
                    className="form-check-input cursor-pointer"
                    type="checkbox"
                    role="switch"
                    id="interStateSwitch"
                    checked={isInterState}
                    onChange={(e) => setIsInterState(e.target.checked)}
                  />
                  <label className="form-check-label fw-bold text-dark extra-small cursor-pointer ms-1" htmlFor="interStateSwitch">
                    {isInterState ? 'Inter-State Supply (IGST)' : 'Intra-State Supply (CGST + SGST)'}
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Printable Invoice Document Body */}
          <div className="modal-body p-3 p-md-5 bg-light print-modal-body">
            <div className="bg-white p-4 p-md-5 shadow-sm rounded-1 mx-auto print-page-container" style={{ maxWidth: '900px', border: '1px solid #ccc' }}>
              
              {/* Invoice Top Header */}
              <div className="row g-3 align-items-center pb-3 border-bottom border-2 border-dark mb-3">
                <div className="col-7">
                  <h3 className="fw-bolder text-uppercase mb-0 tracking-wider text-dark" style={{ letterSpacing: '1px' }}>
                    {contractorName}
                  </h3>
                  <div className="text-secondary extra-small fw-semibold mb-1">
                    Civil &amp; Interior Turnkey Contracting Specialist
                  </div>
                  <div className="extra-small text-muted" style={{ lineHeight: '1.4' }}>
                    {contractorAddress} • Phone: {contractorPhone}
                  </div>
                  <div className="extra-small fw-bold text-dark mt-1">
                    GSTIN / UIN: <span className="font-monospace text-primary">{contractorGstin}</span>
                  </div>
                </div>

                <div className="col-5 text-end">
                  <span className="badge bg-dark text-white px-3 py-1 fs-6 fw-bold text-uppercase tracking-wide mb-2 d-inline-block">
                    TAX INVOICE
                  </span>
                  <div className="extra-small text-muted">
                    <span className="fw-bold text-dark">Invoice No:</span> <span className="font-monospace fw-bold">{invoiceNo}</span>
                  </div>
                  <div className="extra-small text-muted">
                    <span className="fw-bold text-dark">Date:</span> {new Date(invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                  <div className="extra-small text-muted">
                    <span className="fw-bold text-dark">Payment Due:</span> {new Date(dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Bill To & Ship To Details */}
              <div className="row g-3 mb-4 p-3 bg-light rounded border small">
                <div className="col-12 col-md-6 border-end-md">
                  <div className="extra-small text-uppercase fw-bold text-secondary mb-1">Billed To (Client / Customer):</div>
                  <div className="fw-bold text-dark fs-6">{clientName}</div>
                  <div className="text-muted extra-small mb-1">Project: {header.projectName || 'Measurement Sheet'}</div>
                  <div className="extra-small text-muted mb-1">Site: {siteAddress}</div>
                  <div className="extra-small fw-semibold">
                    Client GSTIN: <span className="font-monospace text-dark">{clientGstin || 'Unregistered / Consumer'}</span>
                  </div>
                </div>

                <div className="col-12 col-md-6 ps-md-3">
                  <div className="extra-small text-uppercase fw-bold text-secondary mb-1">Tax &amp; Supply Details:</div>
                  <div className="d-flex justify-content-between py-1 border-bottom extra-small">
                    <span className="text-muted">Place of Supply:</span>
                    <span className="fw-bold text-dark">{placeOfSupply}</span>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom extra-small">
                    <span className="text-muted">Reverse Charge (RCM):</span>
                    <span className="fw-bold text-dark">No</span>
                  </div>
                  <div className="d-flex justify-content-between py-1 extra-small">
                    <span className="text-muted">Service Accounting Code:</span>
                    <span className="fw-bold font-monospace text-primary">SAC {sacCode}</span>
                  </div>
                </div>
              </div>

              {/* Invoice Items Table */}
              <div className="table-responsive mb-3">
                <table className="table table-bordered border-dark align-middle mb-0" style={{ fontSize: '11.5px' }}>
                  <thead className="table-dark text-center text-uppercase fw-bold">
                    <tr>
                      <th style={{ width: '40px' }}>#</th>
                      <th>Description of Services &amp; Works Executed</th>
                      <th style={{ width: '80px' }}>SAC Code</th>
                      <th style={{ width: '130px' }} className="text-end">Taxable Value ({currencySymbol})</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(grandTotals?.categoryRollup || []).map((row, idx) => (
                      <tr key={idx}>
                        <td className="text-center fw-bold">{idx + 1}</td>
                        <td>
                          <div className="fw-bold text-dark text-uppercase">{row.parentCategory} Works</div>
                          <small className="text-muted extra-small">
                            Measured Net Work: {formatNumber(row.totalQty)} {row.unit}
                          </small>
                        </td>
                        <td className="text-center font-monospace">{sacCode}</td>
                        <td className="text-end font-monospace fw-bold">
                          {formatCurrency(row.totalAmount, currencySymbol)}
                        </td>
                      </tr>
                    ))}

                    {/* Subtotal */}
                    <tr className="table-light fw-bold">
                      <td colSpan={3} className="text-end text-uppercase pe-3">Total Taxable Value:</td>
                      <td className="text-end font-monospace text-dark fs-6">{formatCurrency(taxableValue, currencySymbol)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Tax Computation & Bank Details Grid */}
              <div className="row g-3 mb-4">
                {/* Bank Account Info */}
                <div className="col-12 col-md-6">
                  <div className="p-3 bg-light rounded border h-100 small">
                    <div className="extra-small text-uppercase fw-bold text-secondary mb-2">
                      <i className="bi bi-bank me-1 text-primary"></i> Bank Details for RTGS / NEFT / IMPS Payment
                    </div>
                    <div className="d-flex justify-content-between py-1 border-bottom extra-small">
                      <span className="text-muted">Account Name:</span>
                      <span className="fw-bold text-dark">{contractorName}</span>
                    </div>
                    <div className="d-flex justify-content-between py-1 border-bottom extra-small">
                      <span className="text-muted">Bank Name:</span>
                      <span className="fw-semibold text-dark">{bankName}</span>
                    </div>
                    <div className="d-flex justify-content-between py-1 border-bottom extra-small">
                      <span className="text-muted">Account Number:</span>
                      <span className="fw-bold font-monospace text-primary">{accountNo}</span>
                    </div>
                    <div className="d-flex justify-content-between py-1 border-bottom extra-small">
                      <span className="text-muted">IFSC Code:</span>
                      <span className="fw-bold font-monospace text-dark">{ifscCode}</span>
                    </div>
                    <div className="d-flex justify-content-between py-1 extra-small">
                      <span className="text-muted">Branch:</span>
                      <span className="fw-semibold text-dark">{branch}</span>
                    </div>
                  </div>
                </div>

                {/* Tax Calculation Box */}
                <div className="col-12 col-md-6">
                  <div className="p-3 bg-light rounded border">
                    <div className="d-flex justify-content-between py-1 small">
                      <span className="text-secondary">Taxable Amount:</span>
                      <span className="fw-semibold font-monospace">{formatCurrency(taxableValue, currencySymbol)}</span>
                    </div>

                    {!isInterState ? (
                      <>
                        <div className="d-flex justify-content-between py-1 small border-top text-secondary">
                          <span>CGST ({cgstRate}%):</span>
                          <span className="font-monospace font-semibold">+{formatCurrency(cgstAmount, currencySymbol)}</span>
                        </div>
                        <div className="d-flex justify-content-between py-1 small text-secondary">
                          <span>SGST ({sgstRate}%):</span>
                          <span className="font-monospace font-semibold">+{formatCurrency(sgstAmount, currencySymbol)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="d-flex justify-content-between py-1 small border-top text-secondary">
                        <span>IGST ({igstRate}%):</span>
                        <span className="font-monospace font-semibold">+{formatCurrency(igstAmount, currencySymbol)}</span>
                      </div>
                    )}

                    <div className="d-flex justify-content-between py-1 small border-top text-muted">
                      <span>Total Tax:</span>
                      <span className="font-monospace">+{formatCurrency(totalTax, currencySymbol)}</span>
                    </div>

                    <div className="d-flex justify-content-between pt-2 border-top border-2 border-dark mt-1">
                      <span className="fw-bolder fs-6 text-dark text-uppercase">Total Invoice Value:</span>
                      <span className="fw-bolder fs-5 text-primary font-monospace">
                        {formatCurrency(totalInvoiceAmount, currencySymbol)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Amount In Words */}
              <div className="p-3 bg-light rounded border mb-4">
                <div className="extra-small text-uppercase text-secondary fw-bold">Invoice Amount in Words:</div>
                <div className="fw-bold text-dark fst-italic">
                  {numberToIndianWords(totalInvoiceAmount)}
                </div>
              </div>

              {/* Terms & Authorized Signatory */}
              <div className="row g-3 pt-3 border-top border-dark align-items-end mt-4">
                <div className="col-7">
                  <div className="extra-small text-uppercase fw-bold text-secondary mb-1">Terms &amp; Conditions:</div>
                  <ol className="text-muted extra-small ps-3 mb-0" style={{ lineHeight: '1.5' }}>
                    <li>Payment is strictly due within 15 days of invoice date.</li>
                    <li>Subject to Mumbai jurisdiction. Interest @18% p.a. applicable on overdue accounts.</li>
                    <li>This is a computer-generated tax invoice verified from certified on-site measurements.</li>
                  </ol>
                </div>

                <div className="col-5 text-center">
                  <div style={{ height: '55px' }}></div>
                  <div className="border-top border-dark pt-1">
                    <div className="fw-bold text-dark extra-small text-uppercase">For {contractorName}</div>
                    <small className="text-muted extra-small">Authorized Signatory / Proprietary Seal</small>
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
