import React, { useState, useEffect } from 'react';
import {
  calculateLineItemTotal,
  calculateLineItemAmount,
  calculateAreaTotals,
  calculateProjectGrandTotals,
  calculateSheetPageTotals,
  groupAreasIntoPages,
  formatNumber,
  formatCurrency,
  roundNumber,
  formatDateDisplay
} from '../utils/calculations';
import { numberToIndianWords } from '../utils/numberToWords';
import { generatePdfBase64FromPages } from '../utils/pdfExport';
import { savePdfFile } from '../utils/storage';
import { generateVerificationQRCode } from '../utils/qrCode';

// ── Signature Block Component ─────────────────────────────────────────────────
function SignatureBlock({ signatories, clientApproval }) {
  return (
    <div className="mt-4 pt-2 border-top signature-block-print">
      <div className="d-flex flex-wrap justify-content-between align-items-end" style={{ gap: '1.5rem' }}>
        {/* If client approval is stamped */}
        {clientApproval?.approved && (
          <div className="p-2 border border-2 border-success rounded text-center bg-success-subtle shadow-sm" style={{ minWidth: '190px', maxWidth: '240px' }}>
            <div className="text-success fw-bold text-uppercase d-flex align-items-center justify-content-center gap-1" style={{ fontSize: '9.5px' }}>
              <i className="bi bi-patch-check-fill text-success"></i> DIGITALLY VERIFIED & APPROVED
            </div>
            {clientApproval.signatureDataUrl && (
              <div className="my-1">
                <img src={clientApproval.signatureDataUrl} alt="Signature" style={{ height: '36px', maxWidth: '100%', objectFit: 'contain' }} />
              </div>
            )}
            <div className="fw-bold text-dark" style={{ fontSize: '11px' }}>{clientApproval.signerName}</div>
            <div className="text-secondary extra-small" style={{ fontSize: '9px' }}>
              {clientApproval.designation} {clientApproval.company ? `• ${clientApproval.company}` : ''}
            </div>
            <div className="text-muted extra-small" style={{ fontSize: '8.5px' }}>
              Approved: {new Date(clientApproval.signedAt || clientApproval.approvalDate).toLocaleDateString()}
            </div>
          </div>
        )}

        <div className="d-flex flex-wrap justify-content-around align-items-end flex-grow-1" style={{ gap: '2rem' }}>
          {signatories && signatories.map((sig, i) => (
            <div key={i} className="text-center" style={{ minWidth: '160px', flex: '1 1 140px', maxWidth: '240px' }}>
              <div style={{ height: '36px', borderBottom: '1.5px solid #222', marginBottom: '6px' }}></div>
              <div className="fw-bold text-uppercase sig-label" style={{ fontSize: '11px' }}>{sig.label}</div>
              {sig.sub && <div className="text-muted sig-sub" style={{ fontSize: '9px' }}>{sig.sub}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PrintSheetView({
  projectData,
  projectId,
  billingMode,
  currencySymbol = '₹',
  isClientPortal = false,
  onOpenSignModal,
  onClose,
  initialViewMode = 'full'
}) {
  const header = projectData?.header || {};
  const areas = Array.isArray(projectData?.areas) ? projectData.areas : [];
  const grandTotals = calculateProjectGrandTotals(areas, billingMode, projectData?.settings?.taxPercent || 0);
  const raBilling = projectData?.raBilling || projectData?.data?.raBilling || {};

  // View Mode: 'summary' | 'full' | 'category'
  const [viewMode, setViewMode] = useState(initialViewMode);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [summaryType, setSummaryType] = useState('category'); // 'category' | 'sheets'

  // Print item ordering mode: 'sequential' (as entered 1-14 Add -> 15-20 Less -> 21-26 Add) vs 'grouped'
  const [orderMode, setOrderMode] = useState('sequential');

  const pages = groupAreasIntoPages(areas);
  const displayedPages = viewMode === 'category'
    ? (selectedCategory === 'ALL' ? pages : pages.filter(p => p.category === selectedCategory))
    : pages;

  const [signatories, setSignatories] = useState([
    { label: header.preparedBy || 'Site Engineer', sub: 'Measured & Recorded' },
    { label: header.checkedBy || 'Contractor / Project Manager', sub: 'Checked & Certified' },
    { label: header.clientName || 'Client / Architect', sub: 'Approved & Accepted' },
  ]);
  const [showSigEditor, setShowSigEditor] = useState(false);
  const [showAbstract, setShowAbstract] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    generateVerificationQRCode(projectData).then(url => {
      if (url) setQrCodeUrl(url);
    });
  }, [projectData]);

  const [savingPdf, setSavingPdf] = useState(false);
  const [savePdfProgress, setSavePdfProgress] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const handlePrint = () => window.print();

  const handleDirectDownloadPdf = async () => {
    try {
      setSavingPdf(true);
      setSavePdfProgress('Rendering PDF pages...');
      setSaveSuccessMsg('');

      const pageEls = document.querySelectorAll('.contractor-sheet-page');
      if (!pageEls || pageEls.length === 0) {
        throw new Error('No sheet pages found to export');
      }

      const cleanProjectName = (header.projectName || 'MEASUREMENT_SHEET').trim().replace(/[^a-zA-Z0-9_\- ]/g, '_');
      const dateStr = new Date().toISOString().split('T')[0];
      const suffix = viewMode === 'summary' ? '_SUMMARY' : (viewMode === 'category' ? `_${selectedCategory.replace(/[^a-zA-Z0-9_\- ]/g, '_')}` : '');
      const fileName = `${cleanProjectName}${suffix}_${dateStr}.pdf`;

      const result = await generatePdfBase64FromPages(Array.from(pageEls), (cur, total) => {
        setSavePdfProgress(`Rendering page ${cur} of ${total}...`);
      });

      const link = document.createElement('a');
      link.href = result.dataUri;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSaveSuccessMsg(`OFFICIAL BILL PDF DOWNLOADED (${(result.fileSize / 1024).toFixed(1)} KB)`);
      setTimeout(() => setSaveSuccessMsg(''), 6000);
    } catch (err) {
      console.error('Download PDF error:', err);
      alert('Failed to generate PDF: ' + (err.message || 'Unknown error'));
    } finally {
      setSavingPdf(false);
      setSavePdfProgress('');
    }
  };

  const handleSavePdfToDashboard = async () => {
    try {
      setSavingPdf(true);
      setSavePdfProgress('Preparing pages...');
      setSaveSuccessMsg('');

      const pageEls = document.querySelectorAll('.contractor-sheet-page');
      if (!pageEls || pageEls.length === 0) {
        throw new Error('No sheet pages found to export');
      }

      const cleanProjectName = (header.projectName || 'MEASUREMENT_SHEET').trim().replace(/[^a-zA-Z0-9_\- ]/g, '_');
      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `${cleanProjectName}_${dateStr}.pdf`;

      const result = await generatePdfBase64FromPages(Array.from(pageEls), (cur, total) => {
        setSavePdfProgress(`Rendering page ${cur} of ${total}...`);
      });

      setSavePdfProgress('Saving PDF to dashboard...');

      await savePdfFile({
        projectId: projectId || null,
        projectName: header.projectName || 'MEASUREMENT SHEET',
        fileName,
        fileBase64: result.base64,
        pageCount: result.pageCount,
        fileSize: result.fileSize,
        billingMode: Boolean(billingMode),
        metadata: {
          clientName: header.clientName || '',
          location: header.location || '',
          date: header.date || '',
          pageCount: result.pageCount,
        }
      });

      setSaveSuccessMsg(`PDF successfully saved to dashboard! (${(result.fileSize / 1024).toFixed(1)} KB)`);
      setTimeout(() => setSaveSuccessMsg(''), 6000);
    } catch (err) {
      console.error('Failed to save PDF to dashboard:', err);
      alert('FAILED TO SAVE PDF: ' + (err.message || 'Unknown error'));
    } finally {
      setSavingPdf(false);
      setSavePdfProgress('');
    }
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}`;
    } catch { /* ignore */ }
    return dateStr;
  };

  const isApproved = Boolean(projectData?.clientApproval?.approved);

  const renderSummarySheet = () => {
    const categoryRollup = grandTotals?.categoryRollup || [];
    const totalNetQty = grandTotals?.totalNetQty || 0;
    const totalNetAmount = grandTotals?.totalNetAmount || 0;
    const totalGrossAmount = grandTotals?.totalGrossAmount || totalNetAmount;
    const taxPercent = parseFloat(projectData?.settings?.taxPercent) || 0;
    const taxAmount = grandTotals?.taxAmount || 0;
    const grandTotalPayable = grandTotals?.grandTotalPayable || totalNetAmount;

    const raEnabled = Boolean(raBilling?.enabled);
    const raNumber = raBilling?.raBillNumber || 'FINAL PROJECT ABSTRACT';
    const retentionPercent = parseFloat(raBilling?.retentionPercent) || 0;
    const retentionAmount = Math.round(((totalNetAmount * retentionPercent) / 100) * 100) / 100;
    const advanceRecovery = parseFloat(raBilling?.mobilizationAdvanceRecovery) || 0;
    const tdsPercent = parseFloat(raBilling?.tdsPercent) || 0;
    const tdsAmount = Math.round(((totalNetAmount * tdsPercent) / 100) * 100) / 100;
    const otherDeductions = parseFloat(raBilling?.otherDeductions) || 0;
    const previousPaid = parseFloat(raBilling?.previousPaidAmount || raBilling?.previousCertifiedAmount) || 0;
    const netDeductions = retentionAmount + advanceRecovery + tdsAmount + otherDeductions;
    const currentNetPayable = Math.max(0, grandTotalPayable - netDeductions - previousPaid);

    return (
      <div className="contractor-sheet-page bg-white p-2 p-sm-3 p-md-4 mx-auto shadow-sm mb-4 mb-md-5">
        {/* Screen badge */}
        <div className="d-print-none d-flex flex-wrap justify-content-between align-items-center mb-2 pb-2 border-bottom gap-2">
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-dark px-3 py-1 text-uppercase fw-bold">
              <i className="bi bi-file-earmark-check me-1"></i> EXECUTIVE ABSTRACT OF MEASUREMENT
            </span>
            <span className="badge bg-success text-white text-uppercase fw-bold">
              {summaryType === 'category' ? `${categoryRollup.length} WORK CATEGORIES` : `${pages.length} SHEET PAGES`}
            </span>
            {raEnabled && (
              <span className="badge bg-primary text-white text-uppercase fw-bold">
                {raNumber}
              </span>
            )}
          </div>
          <div className="d-flex align-items-center gap-1 bg-light border p-1 rounded">
            <span className="text-secondary extra-small fw-bold px-1 text-uppercase">Summary View:</span>
            <button
              type="button"
              className={`btn btn-xs fw-bold ${summaryType === 'category' ? 'btn-primary shadow-xs' : 'btn-outline-secondary border-0'}`}
              onClick={() => setSummaryType('category')}
              title="Consolidated roll-up by work category"
            >
              Category Roll-Up ({categoryRollup.length})
            </button>
            <button
              type="button"
              className={`btn btn-xs fw-bold ${summaryType === 'sheets' ? 'btn-primary shadow-xs' : 'btn-outline-secondary border-0'}`}
              onClick={() => setSummaryType('sheets')}
              title="Sheet-by-sheet detailed abstract"
            >
              Sheet Pages ({pages.length})
            </button>
          </div>
        </div>

        {/* Company Header with Site Verification QR Code */}
        <div className="d-flex justify-content-between align-items-center mb-2 company-header-block">
          <div style={{ width: '56px' }}></div>
          <div className="text-center flex-grow-1">
            <h3 className="fw-bold text-uppercase mb-0" style={{ letterSpacing: '2px', fontSize: '1.05rem' }}>
              {header.contractorName || 'MTS DECOR'}
            </h3>
            {header.clientName && (
              <div className="text-muted client-subtitle" style={{ fontSize: '11px' }}>
                Client: {header.clientName}
              </div>
            )}
          </div>
          <div className="text-center" style={{ width: '56px' }}>
            {qrCodeUrl ? (
              <div>
                <img
                  src={qrCodeUrl}
                  alt="Verified Copy QR"
                  style={{ width: '46px', height: '46px', border: '1px solid #d1d5db', borderRadius: '3px', padding: '2px', background: '#fff' }}
                />
                <div className="text-muted extra-small text-uppercase fw-semibold" style={{ fontSize: '6.5px', lineHeight: 1.1, marginTop: '1px' }}>
                  SCAN VERIFY
                </div>
              </div>
            ) : (
              <div style={{ width: '46px', height: '46px' }}></div>
            )}
          </div>
        </div>

        {/* Measurement Table */}
        <div className="table-responsive">
          <table className="table table-bordered border-dark sheet-grid-table align-middle mb-0" style={{ fontSize: '11px' }}>
            <thead className="text-center text-uppercase fw-bold">
              <tr className="bg-light-subtle align-middle project-header-row" style={{ borderBottom: '2px solid #000' }}>
                <th colSpan={billingMode ? 4 : 3} className="text-start py-1 px-2 align-middle">
                  <div className="mb-0.5 project-name">
                    <span className="fw-bolder" style={{ fontSize: '12px', letterSpacing: '0.5px' }}>
                      {header.projectName || 'MTS DECOR PROJECT'}
                    </span>
                  </div>
                  <div className="d-flex align-items-center gap-2 text-uppercase fw-bold meta-item" style={{ fontSize: '9.5px', color: '#111827' }}>
                    <span><strong>SCOPE:</strong> ALL FLOORS &amp; UNITS</span>
                    <span className="text-muted">|</span>
                    <span><strong>AREAS:</strong> {areas.length}</span>
                    {header.siteAddress && (
                      <>
                        <span className="text-muted">|</span>
                        <span><strong>SITE:</strong> {header.siteAddress}</span>
                      </>
                    )}
                  </div>
                </th>
                <th colSpan={billingMode ? 2 : 1} className="text-center py-1 px-2 align-middle">
                  <div className="fw-bolder text-uppercase" style={{ fontSize: '11.5px' }}>
                    ABSTRACT OF MEASUREMENT
                  </div>
                  <div className="extra-small text-muted fw-normal">
                    {raEnabled ? raNumber : 'BILLING SUMMARY & ROLL-UP'}
                  </div>
                </th>
                <th colSpan={1} className="text-center fw-bold py-1 align-middle">
                  <div style={{ fontSize: '10.5px' }}>DATE: {formatDateDisplay(header.date) || '—'}</div>
                </th>
              </tr>
              <tr className="bg-light-subtle text-center">
                <th style={{ width: '5%' }}>SR.</th>
                <th style={{ width: billingMode ? '34%' : '48%' }}>
                  {summaryType === 'category' ? 'WORK CATEGORY / WORK DESCRIPTION' : 'WORK CATEGORY & TITLE'}
                </th>
                <th style={{ width: billingMode ? '16%' : '25%' }}>
                  {summaryType === 'category' ? 'LOCATIONS / COVERAGE' : 'FLOOR / FLAT'}
                </th>
                <th style={{ width: '8%' }}>UNIT</th>
                <th style={{ width: '13%' }} className="text-end">NET MEASURED QTY</th>
                {billingMode && <th style={{ width: '11%' }} className="text-end">RATE ({currencySymbol})</th>}
                {billingMode && <th style={{ width: '13%' }} className="text-end">AMOUNT ({currencySymbol})</th>}
              </tr>
            </thead>
            <tbody>
              {summaryType === 'category' ? (
                categoryRollup.map((row, idx) => {
                  const effRate = row.totalQty > 0 ? (row.totalAmount / row.totalQty) : 0;
                  return (
                    <tr key={idx}>
                      <td className="text-center fw-bold">{idx + 1}</td>
                      <td className="px-2 fw-bold text-uppercase">{row.parentCategory}</td>
                      <td className="px-2 extra-small text-muted">
                        {row.flatsList ? `${row.flatsList} (${row.itemsCount} items)` : `${row.itemsCount} items`}
                      </td>
                      <td className="text-center fw-semibold">{row.unit}</td>
                      <td className="text-end fw-bold font-monospace">{formatNumber(row.totalQty)}</td>
                      {billingMode && (
                        <td className="text-end font-monospace">
                          {effRate > 0 ? formatNumber(effRate, 2) : '—'}
                        </td>
                      )}
                      {billingMode && (
                        <td className="text-end fw-bold font-monospace text-dark">
                          {formatCurrency(row.totalAmount, currencySymbol)}
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                pages.map((p, idx) => {
                  const pTotals = calculateSheetPageTotals(p);
                  return (
                    <tr key={p.pageNumber || idx}>
                      <td className="text-center fw-bold">{p.pageNumber || idx + 1}</td>
                      <td className="px-2 fw-bold text-uppercase">{p.category}</td>
                      <td className="px-2 extra-small text-muted">
                        {p.floor ? `FL: ${p.floor}` : ''} {p.flat ? `FLAT: ${p.flat}` : ''}
                      </td>
                      <td className="text-center fw-semibold">{pTotals.dominantUnit}</td>
                      <td className="text-end fw-bold font-monospace">{formatNumber(pTotals.netQty)}</td>
                      {billingMode && (
                        <td className="text-end font-monospace">
                          {pTotals.netQty > 0 && pTotals.netAmount > 0 ? formatNumber(pTotals.netAmount / pTotals.netQty, 2) : '—'}
                        </td>
                      )}
                      {billingMode && (
                        <td className="text-end fw-bold font-monospace text-dark">
                          {formatCurrency(pTotals.netAmount, currencySymbol)}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}

              {/* Total Net Measurements Row */}
              <tr className="bg-light-subtle fw-bold" style={{ borderTop: '2px solid #000', fontSize: '11.5px' }}>
                <td colSpan={3} className="text-end text-uppercase pe-2">TOTAL MEASURED WORKS (NET QUANTITY):</td>
                <td className="text-center fw-bold">{summaryType === 'category' && categoryRollup.length === 1 ? categoryRollup[0].unit : ''}</td>
                <td className="text-end font-monospace text-dark fw-bold">{formatNumber(totalNetQty)}</td>
                {billingMode && <td></td>}
                {billingMode && (
                  <td className="text-end font-monospace text-dark fw-bold fs-6">
                    {formatCurrency(totalNetAmount, currencySymbol)}
                  </td>
                )}
              </tr>

              {/* Progressive RA Billing & Financial Deductions */}
              {billingMode && (
                <>
                  {retentionPercent > 0 && (
                    <tr className="text-danger extra-small">
                      <td colSpan={6} className="text-end pe-2">
                        Less: Retention Money ({retentionPercent}%):
                      </td>
                      <td className="text-end font-monospace text-danger">
                        -{formatCurrency(retentionAmount, currencySymbol)}
                      </td>
                    </tr>
                  )}
                  {advanceRecovery > 0 && (
                    <tr className="text-danger extra-small">
                      <td colSpan={6} className="text-end pe-2">
                        Less: Mobilization Advance Recovery:
                      </td>
                      <td className="text-end font-monospace text-danger">
                        -{formatCurrency(advanceRecovery, currencySymbol)}
                      </td>
                    </tr>
                  )}
                  {tdsPercent > 0 && (
                    <tr className="text-danger extra-small">
                      <td colSpan={6} className="text-end pe-2">
                        Less: TDS Deductions ({tdsPercent}%):
                      </td>
                      <td className="text-end font-monospace text-danger">
                        -{formatCurrency(tdsAmount, currencySymbol)}
                      </td>
                    </tr>
                  )}
                  {otherDeductions > 0 && (
                    <tr className="text-danger extra-small">
                      <td colSpan={6} className="text-end pe-2">
                        Less: Other Deductions / Debits:
                      </td>
                      <td className="text-end font-monospace text-danger">
                        -{formatCurrency(otherDeductions, currencySymbol)}
                      </td>
                    </tr>
                  )}
                  {taxAmount > 0 && (
                    <tr className="extra-small">
                      <td colSpan={6} className="text-end pe-2">
                        Add: GST / Taxes ({taxPercent}%):
                      </td>
                      <td className="text-end font-monospace text-dark">
                        +{formatCurrency(taxAmount, currencySymbol)}
                      </td>
                    </tr>
                  )}
                  {previousPaid > 0 && (
                    <tr className="text-secondary extra-small">
                      <td colSpan={6} className="text-end pe-2">
                        Less: Amount Certified &amp; Paid in Previous Bills:
                      </td>
                      <td className="text-end font-monospace text-secondary">
                        -{formatCurrency(previousPaid, currencySymbol)}
                      </td>
                    </tr>
                  )}
                  <tr className="bg-light fw-bolder" style={{ borderTop: '2px solid #000', borderBottom: '3px double #000', fontSize: '12px' }}>
                    <td colSpan={billingMode ? 6 : 4} className="text-end pe-2 text-uppercase text-dark">
                      NET CERTIFIED PAYABLE THIS BILL / CERTIFICATE:
                    </td>
                    <td className="text-end font-monospace text-dark fw-bolder fs-6">
                      {formatCurrency(currentNetPayable, currencySymbol)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={7} className="px-2 py-1 bg-light-subtle extra-small text-dark">
                      <strong>AMOUNT IN WORDS:</strong> {numberToIndianWords(currentNetPayable)} ONLY
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Abstract Sheet Footer */}
        <div className="mt-2 pt-1 border-top d-flex justify-content-between align-items-center" style={{ fontSize: '9px', color: '#888' }}>
          <span className="text-uppercase">{header.contractorName || 'MTS DECOR'}</span>
          <span className="text-uppercase">EXECUTIVE SUMMARY &amp; ABSTRACT OF MEASUREMENT — 1 PAGE</span>
          <span>DATE: {formatDateDisplay(header.date) || ''}</span>
        </div>

        {/* Signature Block */}
        <SignatureBlock
          signatories={signatories}
          clientApproval={projectData?.clientApproval}
        />
      </div>
    );
  };

  return (
    <div className="print-view-wrapper py-2 py-sm-3 py-md-4 px-1 px-sm-2 px-md-4">

      {/* ACTION BAR */}
      <div className="no-print mb-3 d-flex flex-wrap justify-content-between align-items-center gap-2 bg-white p-2 p-sm-3 rounded shadow-sm border">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          {onClose && (
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose}>
              <i className="bi bi-arrow-left me-1"></i> Back to Editor
            </button>
          )}

          {/* VIEW / PRINT MODE TABS */}
          <div className="btn-group shadow-xs">
            <button
              type="button"
              className={`btn btn-sm fw-bold ${viewMode === 'summary' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setViewMode('summary')}
              title="Print 1-page executive summary & abstract of all measurements"
            >
              <i className="bi bi-pie-chart-fill me-1 text-warning"></i> Summary Sheet (1 Page)
            </button>
            <button
              type="button"
              className={`btn btn-sm fw-bold ${viewMode === 'full' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setViewMode('full')}
              title="Print full detailed measurement book with all areas"
            >
              <i className="bi bi-files me-1"></i> Full Book ({pages.length} Pages)
            </button>
            <button
              type="button"
              className={`btn btn-sm fw-bold ${viewMode === 'category' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setViewMode('category')}
              title="Filter and print only a specific work category"
            >
              <i className="bi bi-funnel-fill me-1"></i> Filter Category
            </button>
          </div>

          {viewMode === 'category' && (
            <select
              className="form-select form-select-sm fw-bold border-primary shadow-xs"
              style={{ width: 'auto', maxWidth: '240px' }}
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            >
              <option value="ALL">All Categories ({pages.length} Pages)</option>
              {Array.from(new Set(pages.map(p => p.category))).map(cat => (
                <option key={cat} value={cat}>
                  {cat} ({pages.filter(p => p.category === cat).length} {pages.filter(p => p.category === cat).length === 1 ? 'Page' : 'Pages'})
                </option>
              ))}
            </select>
          )}

          {viewMode === 'summary' ? (
            <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1.5 fw-bold text-uppercase d-flex align-items-center gap-1">
              <i className="bi bi-check2-circle"></i> Abstract (1 Page)
            </span>
          ) : (
            <span className="badge bg-primary text-white text-uppercase">
              <i className="bi bi-files me-1"></i>
              {displayedPages.length} Sheet Page{displayedPages.length !== 1 ? 's' : ''}
            </span>
          )}

          {isApproved && (
            <span className="badge bg-success py-1 px-2 fw-bold d-inline-flex align-items-center gap-1">
              <i className="bi bi-check-all"></i> Digitally Approved
            </span>
          )}
        </div>

        {/* ORDERING & PAGINATION OPTIONS */}
        <div className="d-flex align-items-center gap-2 flex-wrap">
          {viewMode === 'summary' ? (
            /* Sub-toggle for Summary */
            <div className="d-flex align-items-center gap-1 bg-light border p-1 rounded">
              <span className="text-secondary extra-small fw-bold px-1 d-none d-md-inline text-uppercase">Roll-up:</span>
              <button
                type="button"
                className={`btn btn-xs fw-bold ${summaryType === 'category' ? 'btn-primary shadow-xs' : 'btn-outline-secondary border-0'}`}
                onClick={() => setSummaryType('category')}
                title="Roll-up by Work Category (Executive bill format)"
              >
                Category Roll-Up
              </button>
              <button
                type="button"
                className={`btn btn-xs fw-bold ${summaryType === 'sheets' ? 'btn-primary shadow-xs' : 'btn-outline-secondary border-0'}`}
                onClick={() => setSummaryType('sheets')}
                title="List individual sheet pages"
              >
                Sheet Pages
              </button>
            </div>
          ) : (
            /* Order Mode Toggle */
            <div className="d-flex align-items-center gap-1 bg-light border p-1 rounded">
              <span className="text-secondary extra-small fw-bold px-1 d-none d-md-inline text-uppercase">Row Order:</span>
              <button
                type="button"
                className={`btn btn-xs fw-bold ${orderMode === 'sequential' ? 'btn-primary shadow-xs' : 'btn-outline-secondary border-0'}`}
                onClick={() => setOrderMode('sequential')}
                title="Print items in exact order entered (1-14 Add -> 15-20 Less -> 21-26 Add)"
              >
                <i className="bi bi-list-ol me-1"></i> Sequential
              </button>
              <button
                type="button"
                className={`btn btn-xs fw-bold ${orderMode === 'grouped' ? 'btn-primary shadow-xs' : 'btn-outline-secondary border-0'}`}
                onClick={() => setOrderMode('grouped')}
                title="Group all additions at top and deductions at bottom"
              >
                <i className="bi bi-layers me-1"></i> Grouped
              </button>
            </div>
          )}

          {viewMode === 'full' && (
            <button
              type="button"
              className={`btn btn-xs fw-bold ${showAbstract ? 'btn-primary shadow-xs' : 'btn-outline-secondary border'}`}
              onClick={() => setShowAbstract(v => !v)}
              title="Toggle separate Abstract & Summary page at end"
            >
              <i className="bi bi-file-earmark-text me-1"></i> Abstract at End {showAbstract ? 'ON' : 'OFF'}
            </button>
          )}

          {!isClientPortal && (
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setShowSigEditor(v => !v)}>
              <i className="bi bi-pen me-1"></i> Signatures
            </button>
          )}

          {/* Direct PDF Download */}
          <button
            type="button"
            className="btn btn-danger btn-sm px-3 fw-bold shadow-sm text-uppercase d-flex align-items-center gap-1"
            onClick={handleDirectDownloadPdf}
            disabled={savingPdf}
            title="Download clean official PDF document to your device"
          >
            {savingPdf ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status"></span>
                <span>{savePdfProgress || 'SAVING PDF...'}</span>
              </>
            ) : (
              <>
                <i className="bi bi-file-earmark-arrow-down-fill"></i>
                <span>Download PDF</span>
              </>
            )}
          </button>

          {/* Save to contractor dashboard if logged in contractor */}
          {!isClientPortal && (
            <button
              type="button"
              className="btn btn-outline-danger btn-sm px-2 fw-bold text-uppercase d-none d-lg-inline-flex align-items-center gap-1"
              onClick={handleSavePdfToDashboard}
              disabled={savingPdf}
              title="Save copy to local dashboard"
            >
              <i className="bi bi-folder-check"></i>
              <span>Save in App</span>
            </button>
          )}

          {/* Client Sign Button if in portal */}
          {isClientPortal && !isApproved && onOpenSignModal && (
            <button
              type="button"
              className="btn btn-success btn-sm px-3 fw-bold shadow-sm d-flex align-items-center gap-1"
              onClick={onOpenSignModal}
            >
              <i className="bi bi-pen-fill"></i>
              <span>Sign &amp; Approve Bill</span>
            </button>
          )}

          <button type="button" className="btn btn-primary btn-sm px-3 fw-bold shadow-sm" onClick={handlePrint}>
            <i className="bi bi-printer-fill me-1"></i> Print / Save as PDF
          </button>
        </div>
      </div>

      {/* SAVE PDF SUCCESS NOTIFICATION */}
      {saveSuccessMsg && (
        <div className="no-print alert alert-success d-flex align-items-center justify-content-between py-2 px-3 mb-3 shadow-sm border-0">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-check-circle-fill fs-5 text-success"></i>
            <span className="fw-bold extra-small text-uppercase">{saveSuccessMsg}</span>
          </div>
          <button type="button" className="btn-close btn-sm" onClick={() => setSaveSuccessMsg('')}></button>
        </div>
      )}

      {/* SIGNATURE EDITOR */}
      {showSigEditor && (
        <div className="no-print mb-3 bg-white border rounded p-3 shadow-sm">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-bold mb-0 text-uppercase">
              <i className="bi bi-pen-fill me-2 text-primary"></i>Customize Signature Block (Last Page Only)
            </h6>
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-sm btn-outline-primary"
                onClick={() => setSignatories(prev => [...prev, { label: 'New Signatory', sub: 'Signature' }])}>
                <i className="bi bi-plus me-1"></i> Add
              </button>
              <button type="button" className="btn btn-sm btn-dark" onClick={() => setShowSigEditor(false)}>Done</button>
            </div>
          </div>
          <div className="row g-2">
            {signatories.map((sig, i) => (
              <div key={i} className="col-12 col-sm-6 col-md-4">
                <div className="border rounded p-2 d-flex flex-column gap-1 position-relative">
                  <input className="form-control form-control-sm fw-bold text-uppercase" value={sig.label} placeholder="Name / Role"
                    onChange={e => setSignatories(prev => prev.map((s, idx) => idx === i ? { ...s, label: e.target.value } : s))} />
                  <input className="form-control form-control-sm text-muted" value={sig.sub} placeholder="Sub-label"
                    onChange={e => setSignatories(prev => prev.map((s, idx) => idx === i ? { ...s, sub: e.target.value } : s))} />
                  {signatories.length > 1 && (
                    <button type="button" className="btn btn-sm btn-outline-danger py-0 px-1 position-absolute top-0 end-0 m-1"
                      onClick={() => setSignatories(prev => prev.filter((_, idx) => idx !== i))}>
                      <i className="bi bi-x"></i>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="text-muted extra-small mt-2 mb-0">
            <i className="bi bi-info-circle me-1"></i>
            Signature block prints only once — on the final page.
          </p>
        </div>
      )}

      {/* SUMMARY SHEET RENDERER */}
      {viewMode === 'summary' && renderSummarySheet()}

      {/* DETAILED MEASUREMENT SHEET PAGES */}
      {viewMode !== 'summary' && displayedPages.map((page, pageIdx) => {
        const pageTotals = calculateSheetPageTotals(page);
        const isSinglePage = displayedPages.length === 1;

        return (
          <div key={page.pageNumber} className="contractor-sheet-page bg-white p-2 p-sm-3 p-md-4 mx-auto shadow-sm mb-4 mb-md-5">
            {/* Screen badge */}
            <div className="d-print-none d-flex flex-wrap justify-content-between align-items-center mb-2 pb-2 border-bottom gap-2">
              <span className="badge bg-dark px-3 py-1 text-uppercase fw-bold">
                <i className="bi bi-file-earmark-text me-1"></i> SHEET PAGE {page.pageNumber} OF {displayedPages.length}
              </span>
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 text-uppercase fw-bold">
                WORK: {page.category}
              </span>
            </div>
            <div className="d-print-none d-md-none text-muted extra-small py-1 px-2 mb-2 text-center bg-light border rounded">
              <i className="bi bi-arrow-left-right me-1 text-primary"></i> SWIPE TABLE TO VIEW ALL COLUMNS
            </div>

            {/* Company Header with Site Verification QR Code */}
            <div className="d-flex justify-content-between align-items-center mb-2 company-header-block">
              <div style={{ width: '56px' }}></div>
              <div className="text-center flex-grow-1">
                <h3 className="fw-bold text-uppercase mb-0" style={{ letterSpacing: '2px', fontSize: '1.05rem' }}>
                  {header.contractorName || 'MTS DECOR'}
                </h3>
                {header.clientName && <div className="text-muted client-subtitle" style={{ fontSize: '11px' }}>Client: {header.clientName}</div>}
              </div>
              <div className="text-center" style={{ width: '56px' }}>
                {qrCodeUrl ? (
                  <div>
                    <img
                      src={qrCodeUrl}
                      alt="Verified Copy QR"
                      style={{ width: '46px', height: '46px', border: '1px solid #d1d5db', borderRadius: '3px', padding: '2px', background: '#fff' }}
                    />
                    <div className="text-muted extra-small text-uppercase fw-semibold" style={{ fontSize: '6.5px', lineHeight: 1.1, marginTop: '1px' }}>
                      SCAN VERIFY
                    </div>
                  </div>
                ) : (
                  <div style={{ width: '46px', height: '46px' }}></div>
                )}
              </div>
            </div>

            {/* Measurement Table */}
            <div className="table-responsive">
              <table className="table table-bordered border-dark sheet-grid-table align-middle mb-0" style={{ fontSize: '11px' }}>
                <thead className="text-center text-uppercase fw-bold">
                  <tr className="bg-light-subtle align-middle project-header-row" style={{ borderBottom: '2px solid #000' }}>
                    <th colSpan={4} className="text-start py-1 px-2 align-middle" style={{ width: '54%' }}>
                      <div className="mb-0.5 project-name">
                        <span className="fw-bolder" style={{ fontSize: '12px', letterSpacing: '0.5px' }}>
                          {header.projectName || 'MTS DECOR PROJECT'}
                        </span>
                      </div>
                      <div className="d-flex align-items-center gap-2 text-uppercase fw-bold meta-item" style={{ fontSize: '9.5px', color: '#111827' }}>
                        <span>
                          <strong>FLOOR:</strong> {(page.floor || header.floorNo || header.floor) ? String(page.floor || header.floorNo || header.floor).toUpperCase() : '—'}
                        </span>
                        <span className="text-muted">|</span>
                        <span>
                          <strong>FLAT:</strong> {(page.flat || header.flatNo || header.flat) ? String(page.flat || header.flatNo || header.flat).toUpperCase() : '—'}
                        </span>
                        {header.sheetNo && (
                          <>
                            <span className="text-muted">|</span>
                            <span><strong>SHEET:</strong> {header.sheetNo}</span>
                          </>
                        )}
                      </div>
                    </th>
                    <th colSpan={3} className="text-center py-1 px-2 align-middle" style={{ width: '24%' }}>
                      <div className="fw-bolder text-uppercase" style={{ fontSize: '11.5px' }}>{page.category.toUpperCase()}</div>
                      {page.isContinuationPage && (
                        <div className="text-danger extra-small fw-bold mt-0.5">(CONTINUED — PART {page.partIndex} OF {page.totalParts})</div>
                      )}
                    </th>
                    <th colSpan={billingMode ? 4 : 2} className="text-center fw-bold py-1 align-middle" style={{ width: '22%' }}>
                      <div style={{ fontSize: '10.5px' }}>DATE: {formatDateDisplay(header.date) || '—'}</div>
                    </th>
                  </tr>
                  <tr className="bg-light-subtle text-center">
                    <th style={{ width: '5%' }}>SR.</th>
                    <th style={{ width: '25%' }}>DESCRIPTION</th>
                    <th style={{ width: '24%' }}>REMARK</th>
                    <th style={{ width: '6%' }}>UNIT</th>
                    <th style={{ width: '6%' }}>QTY</th>
                    <th style={{ width: '8%' }}>LENGTH</th>
                    <th style={{ width: '8%' }}>HEIGHT</th>
                    <th style={{ width: '9%' }}>TOTAL</th>
                    {billingMode && <><th style={{ width: '8%' }}>RATE</th><th style={{ width: '9%' }}>AMOUNT</th></>}
                    <th style={{ width: '9%' }}>GRAND TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {page.areas.map((area, areaIdx) => {
                    const areaTotals = calculateAreaTotals(area);
                    const pageFloor = page.floor || header.floorNo || header.floor || '';
                    const pageFlat = page.flat || header.flatNo || header.flat || '';
                    const areaFloor = area.floor || pageFloor;
                    const areaFlat = area.flat || pageFlat;
                    const rawCat = (area.parentCategory === 'Other' && area.customParentCategory)
                      ? area.customParentCategory
                      : (area.parentCategory || page.category || '');
                    const roomVal = (area.room === 'Other' && area.customRoom)
                      ? area.customRoom
                      : (area.room || area.descriptionHeader || area.location || rawCat);
                    const mainLocation = (roomVal ? String(roomVal).trim() : (rawCat || 'GENERAL WORK')).toUpperCase();
                    const startIndex = area.startIndex || 0;

                    // Build consecutive segments if in sequential mode
                    const segments = [];
                    (area.items || []).forEach((item, itemIdx) => {
                      const isLess = item.isLess === true;
                      const type = isLess ? 'LESS' : 'ADD';
                      if (!segments.length || segments[segments.length - 1].type !== type) {
                        segments.push({ type, items: [item], startIdx: itemIdx });
                      } else {
                        segments[segments.length - 1].items.push(item);
                      }
                    });

                    let runningNetQty = 0;
                    let runningNetAmount = 0;

                    // Render for Sequential Mode (1-14 Add -> 15-20 Less -> 21-26 Add)
                    if (orderMode === 'sequential') {
                      return (
                        <React.Fragment key={area.id}>
                          {/* Top Continuation Banner if area started on earlier page */}
                          {area.isContinued && (
                            <tr className="table-primary fw-bold extra-small">
                              <td colSpan={billingMode ? 11 : 9} className="py-1 px-2 text-primary">
                                <i className="bi bi-arrow-return-right me-1"></i>
                                CONTINUED FROM PREVIOUS PAGE (PART {area.partIndex} OF {area.totalParts}) — {mainLocation}
                              </td>
                            </tr>
                          )}

                          {(!area.items || area.items.length === 0) && (
                            <tr>
                              <td className="text-center fw-bold">{areaIdx + 1}</td>
                              <td className="fw-bold text-uppercase px-1">{mainLocation}</td>
                              <td colSpan={billingMode ? 9 : 7} className="text-center text-muted py-1">—</td>
                            </tr>
                          )}

                          {segments.map((segment, segIdx) => {
                            let segQty = 0;
                            let segAmt = 0;
                            segment.items.forEach(it => {
                              const lt = calculateLineItemTotal(it);
                              const la = calculateLineItemAmount(it, lt);
                              segQty += lt;
                              segAmt += la;
                            });
                            segQty = roundNumber(segQty, 2);
                            segAmt = roundNumber(segAmt, 2);

                            if (segment.type === 'ADD') {
                              runningNetQty = roundNumber(runningNetQty + segQty, 2);
                              runningNetAmount = roundNumber(runningNetAmount + segAmt, 2);
                            } else {
                              runningNetQty = roundNumber(runningNetQty - segQty, 2);
                              runningNetAmount = roundNumber(runningNetAmount - segAmt, 2);
                            }

                            const isLess = segment.type === 'LESS';

                            return (
                              <React.Fragment key={`seg-${segIdx}`}>
                                {segment.items.map((item, itemIdx) => {
                                  const lineTotal = calculateLineItemTotal(item);
                                  const isFirst = itemIdx === 0;
                                  const isLast = itemIdx === segment.items.length - 1;
                                  const itemNumber = startIndex + segment.startIdx + itemIdx + 1;

                                  return (
                                    <tr key={item.id}>
                                      {/* SR Index */}
                                      <td className="text-center fw-bold align-middle">{itemNumber}</td>

                                      {/* LOCATION Column — Seamless without rowSpan so print engine breaks pages naturally */}
                                      <td
                                        className={`fw-bold text-uppercase px-2 text-dark ${isFirst ? 'align-top' : 'align-middle'}`}
                                        style={{
                                          fontSize: '10.5px',
                                          verticalAlign: isFirst ? 'top' : 'middle',
                                          borderTop: isFirst ? undefined : 'hidden',
                                          borderBottom: isLast ? undefined : 'hidden',
                                        }}
                                      >
                                        {isFirst ? (
                                          isLess ? (
                                            <div className="fw-bold text-dark">LESS</div>
                                          ) : (
                                            <div className="fw-bold text-dark">{mainLocation}</div>
                                          )
                                        ) : null}
                                      </td>

                                      {/* REMARK */}
                                      <td className={`px-1 text-uppercase ${isLess ? 'text-muted' : ''}`} style={{ fontSize: '10px' }}>
                                        {item.remark || (isLess ? 'Deduction' : '-')}
                                      </td>
                                      {/* UNIT */}
                                      <td className="text-center" style={{ fontSize: '10px' }}>{item.unit || 'SFT'}</td>
                                      {/* QTY */}
                                      <td className="text-center">{item.quantity || 1}</td>
                                      {/* LENGTH */}
                                      <td className="text-end">{item.length ? formatNumber(item.length) : '-'}</td>
                                      {/* HEIGHT */}
                                      <td className="text-end">{['RFT', 'RMT'].includes(item.unit) ? '-' : (item.height ? formatNumber(item.height) : '-')}</td>
                                      {/* TOTAL */}
                                      <td className="text-end fw-semibold">
                                        {isLess ? `-${formatNumber(lineTotal)}` : formatNumber(lineTotal)}
                                      </td>
                                      {/* BILLING RATE & AMOUNT */}
                                      {billingMode && (
                                        <>
                                          <td className="text-end" style={{ fontSize: '10px' }}>{item.rate ? formatNumber(item.rate) : '-'}</td>
                                          <td className="text-end" style={{ fontSize: '10px' }}>
                                            {isLess ? `-${formatNumber(lineTotal * (parseFloat(item.rate) || 0))}` : formatNumber(lineTotal * (parseFloat(item.rate) || 0))}
                                          </td>
                                        </>
                                      )}
                                      <td className="text-end"></td>
                                    </tr>
                                  );
                                })}

                                {/* Subtotal for this segment */}
                                {isLess ? (
                                  <>
                                    <tr className="fw-bold">
                                      <td></td>
                                      <td colSpan={6} className="text-end pe-2 text-uppercase text-dark" style={{ fontSize: '10px' }}>
                                        TOTAL LESS (DEDUCTIONS):
                                      </td>
                                      <td className="text-end border-top border-bottom border-dark text-dark">-{formatNumber(segQty)}</td>
                                      {billingMode && <><td></td><td className="text-end text-dark">-{formatNumber(segAmt)}</td></>}
                                      <td></td>
                                    </tr>
                                    <tr className="fw-bold bg-light-subtle">
                                      <td></td>
                                      <td colSpan={6} className="text-end pe-2 text-uppercase" style={{ fontSize: '10px' }}>
                                        SUBTOTAL AFTER LESS:
                                      </td>
                                      <td className="text-end border-top border-bottom border-dark">{formatNumber(runningNetQty)}</td>
                                      {billingMode && <><td></td><td className="text-end fw-bold">{formatNumber(runningNetAmount)}</td></>}
                                      <td className="text-end fw-bold">{formatNumber(runningNetQty)}</td>
                                    </tr>
                                  </>
                                ) : (
                                  <tr className="fw-bold">
                                    <td></td>
                                    <td colSpan={6} className="text-end pe-2 text-uppercase" style={{ fontSize: '10px' }}>
                                      {segIdx === 0 ? 'SUBTOTAL (ADDITIONS)' : 'SUBTOTAL (ADDITIONAL WORK)'}:
                                    </td>
                                    <td className="text-end border-top border-bottom border-dark">{formatNumber(segQty)}</td>
                                    {billingMode && <><td></td><td className="text-end border-top border-bottom border-dark">{formatNumber(segAmt)}</td></>}
                                    <td></td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}

                          {/* Continuation indicator at bottom of page if area flows to next page */}
                          {(!area.isContinuationEnd && area.partIndex < area.totalParts) && (
                            <tr className="table-light extra-small fw-bold">
                              <td colSpan={billingMode ? 11 : 9} className="py-1 px-2 text-end text-secondary">
                                <i className="bi bi-arrow-right-circle me-1"></i>
                                CARRIED OVER TO PAGE #{page.pageNumber + 1} (CONTINUED)...
                              </td>
                            </tr>
                          )}

                          {/* Final Net Summary for Area (shown when area completes) */}
                          {(!area.totalParts || area.isContinuationEnd) && segments.length > 1 && (
                            <tr className="fw-bold bg-light-subtle border-top border-2 border-dark">
                              <td></td>
                              <td colSpan={6} className="text-end pe-2 text-uppercase fw-bolder" style={{ fontSize: '11px' }}>
                                NET AREA TOTAL — {mainLocation}{areaTotals.multiplier > 1 ? ` (1-FLR: ${formatNumber(areaTotals.baseNetQty)} × ${areaTotals.multiplier} FLRS)` : ''}:
                              </td>
                              <td className="text-end fw-bolder fs-6 text-dark">{formatNumber(areaTotals.netQty)}</td>
                              {billingMode && <><td></td><td className="text-end fw-bolder fs-6 text-dark">{formatCurrency(areaTotals.netAmount, currencySymbol)}</td></>}
                              <td className="text-end fw-bolder fs-6 text-dark">{formatNumber(areaTotals.netQty)}</td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    }

                    // Render for Grouped Mode (Consolidated additions first, deductions second)
                    const additions = (area.items || []).filter(i => !i.isLess);
                    const deductions = (area.items || []).filter(i => i.isLess);

                    return (
                      <React.Fragment key={area.id}>
                        {area.isContinued && (
                          <tr className="table-primary fw-bold extra-small">
                            <td colSpan={billingMode ? 10 : 8} className="py-1 px-2 text-primary">
                              <i className="bi bi-arrow-return-right me-1"></i>
                              CONTINUED FROM PREVIOUS PAGE — {mainLocation}
                            </td>
                          </tr>
                        )}
                        {additions.map((item, itemIdx) => {
                          const lineTotal = calculateLineItemTotal(item);
                          const isFirst = itemIdx === 0;
                          const isLast = itemIdx === additions.length - 1;
                          return (
                            <tr key={item.id}>
                              <td className="text-center fw-bold align-middle">{itemIdx + 1}</td>
                              <td
                                className={`fw-bold text-uppercase px-2 text-dark ${isFirst ? 'align-top' : 'align-middle'}`}
                                style={{
                                  fontSize: '10.5px',
                                  verticalAlign: isFirst ? 'top' : 'middle',
                                  borderTop: isFirst ? undefined : 'hidden',
                                  borderBottom: isLast ? undefined : 'hidden',
                                }}
                              >
                                {isFirst ? (
                                  <div className="fw-bold text-dark">{mainLocation}</div>
                                ) : null}
                              </td>
                              <td className="px-1 text-uppercase" style={{ fontSize: '10px' }}>{item.remark || '-'}</td>
                              <td className="text-center" style={{ fontSize: '10px' }}>{item.unit || 'SFT'}</td>
                              <td className="text-center">{item.quantity || 1}</td>
                              <td className="text-end">{item.length ? formatNumber(item.length) : '-'}</td>
                              <td className="text-end">{['RFT', 'RMT'].includes(item.unit) ? '-' : (item.height ? formatNumber(item.height) : '-')}</td>
                              <td className="text-end fw-semibold">{formatNumber(lineTotal)}</td>
                              {billingMode && <>
                                <td className="text-end" style={{ fontSize: '10px' }}>{item.rate ? formatNumber(item.rate) : '-'}</td>
                                <td className="text-end" style={{ fontSize: '10px' }}>{formatNumber(lineTotal * (parseFloat(item.rate) || 0))}</td>
                              </>}
                              <td className="text-end"></td>
                            </tr>
                          );
                        })}
                        {additions.length > 0 && (
                          <tr className="fw-bold">
                            <td colSpan={6} className="text-end pe-2 text-uppercase" style={{ fontSize: '10px' }}>TOTAL ADDITIONS</td>
                            <td className="text-end border-top border-bottom border-dark">{formatNumber(areaTotals.grossQty)}</td>
                            {billingMode && <><td></td><td className="text-end border-top border-bottom border-dark">{formatNumber(areaTotals.grossAmount)}</td></>}
                            <td></td>
                          </tr>
                        )}
                        {deductions.length > 0 && (
                          <>
                            {deductions.map((dItem, dIdx) => {
                              const lineTotal = calculateLineItemTotal(dItem);
                              const isFirstD = dIdx === 0;
                              const isLastD = dIdx === deductions.length - 1;
                              return (
                                <tr key={dItem.id}>
                                  <td className="text-center fw-bold align-middle">{additions.length + dIdx + 1}</td>
                                  <td
                                    className={`fw-bold text-uppercase px-2 text-dark ${isFirstD ? 'align-top' : 'align-middle'}`}
                                    style={{
                                      fontSize: '11px',
                                      verticalAlign: isFirstD ? 'top' : 'middle',
                                      borderTop: isFirstD ? undefined : 'hidden',
                                      borderBottom: isLastD ? undefined : 'hidden',
                                    }}
                                  >
                                    {isFirstD ? 'LESS' : null}
                                  </td>
                                  <td className="px-1 text-uppercase text-muted" style={{ fontSize: '10px' }}>{dItem.remark || 'Deduction'}</td>
                                  <td className="text-center" style={{ fontSize: '10px' }}>{dItem.unit || 'SFT'}</td>
                                  <td className="text-center">{dItem.quantity || 1}</td>
                                  <td className="text-end">{dItem.length ? formatNumber(dItem.length) : '-'}</td>
                                  <td className="text-end">{['RFT', 'RMT'].includes(dItem.unit) ? '-' : (dItem.height ? formatNumber(dItem.height) : '-')}</td>
                                  <td className="text-end">-{formatNumber(lineTotal)}</td>
                                  {billingMode && <>
                                    <td className="text-end" style={{ fontSize: '10px' }}>{dItem.rate ? formatNumber(dItem.rate) : '-'}</td>
                                    <td className="text-end" style={{ fontSize: '10px' }}>-{formatNumber(lineTotal * (parseFloat(dItem.rate) || 0))}</td>
                                  </>}
                                  <td></td>
                                </tr>
                              );
                            })}
                            <tr className="fw-bold">
                              <td></td>
                              <td colSpan={6} className="text-end pe-2 text-uppercase text-dark" style={{ fontSize: '10px' }}>TOTAL LESS</td>
                              <td className="text-end border-top border-bottom border-dark text-dark">-{formatNumber(areaTotals.lessQty)}</td>
                              {billingMode && <><td></td><td className="text-end text-dark">-{formatNumber(areaTotals.lessAmount)}</td></>}
                              <td></td>
                            </tr>
                            <tr className="fw-bold bg-light-subtle">
                              <td></td>
                              <td colSpan={6} className="text-end pe-2 text-uppercase" style={{ fontSize: '10px' }}>TOTAL AFTER LESS</td>
                              <td className="text-end border-top border-bottom border-dark">{formatNumber(areaTotals.netQty)}</td>
                              {billingMode && <><td></td><td className="text-end fw-bold">{formatNumber(areaTotals.netAmount)}</td></>}
                              <td className="text-end fw-bold">{formatNumber(areaTotals.netQty)}</td>
                            </tr>
                          </>
                        )}
                        {deductions.length === 0 && additions.length > 0 && (
                          <tr className="fw-bold bg-light-subtle">
                            <td></td>
                            <td colSpan={6} className="text-end pe-2 text-uppercase" style={{ fontSize: '10px' }}>NET TOTAL</td>
                            <td className="text-end">{formatNumber(areaTotals.netQty)}</td>
                            {billingMode && <><td></td><td className="text-end">{formatNumber(areaTotals.netAmount)}</td></>}
                            <td className="text-end fw-bold">{formatNumber(areaTotals.netQty)}</td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}

                  {/* Page Total */}
                  <tr className="fw-bolder bg-light" style={{ fontSize: '12px' }}>
                    <td colSpan={7} className="text-end pe-2 text-uppercase">
                      PAGE #{page.pageNumber} TOTAL — {page.category.toUpperCase()}:
                    </td>
                    <td className="text-end">{formatNumber(pageTotals.netQty)}</td>
                    {billingMode && <><td></td><td className="text-end">{formatCurrency(pageTotals.netAmount, currencySymbol)}</td></>}
                    <td className="text-end fw-bold text-dark">{formatNumber(pageTotals.netQty)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Simple page footer */}
            <div className="mt-1 pt-1 border-top d-flex justify-content-between align-items-center page-footer-block" style={{ fontSize: '9px', color: '#888' }}>
              <span className="text-uppercase">{header.contractorName || 'MTS DECOR'}</span>
              <span className="text-uppercase">
                Page {page.pageNumber} of {pages.length} — {page.category}
                {(page.floor || header.floorNo || header.floor) ? ` — Floor: ${page.floor || header.floorNo || header.floor}` : ''}
                {(page.flat || header.flatNo || header.flat) ? ` — Flat: ${page.flat || header.flatNo || header.flat}` : ''}
              </span>
              <span>{formatDateDisplay(header.date) || ''}</span>
            </div>

            {/* Signature on the final sheet page */}
            {(isSinglePage || (!showAbstract && pageIdx === displayedPages.length - 1)) && (
              <SignatureBlock signatories={signatories} clientApproval={projectData?.clientApproval} />
            )}
          </div>
        );
      })}

      {/* ABSTRACT / SUMMARY PAGE (Rendered at end of full book if toggled ON) */}
      {viewMode === 'full' && showAbstract && renderSummarySheet()}
    </div>
  );
}
