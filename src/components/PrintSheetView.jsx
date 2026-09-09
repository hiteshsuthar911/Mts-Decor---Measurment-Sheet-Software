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
  roundNumber
} from '../utils/calculations';
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
  onClose
}) {
  const header = projectData?.header || {};
  const areas = Array.isArray(projectData?.areas) ? projectData.areas : [];
  const grandTotals = calculateProjectGrandTotals(areas, billingMode, projectData?.settings?.taxPercent || 0);

  // Print item ordering mode: 'sequential' (as entered 1-14 Add -> 15-20 Less -> 21-26 Add) vs 'grouped'
  const [orderMode, setOrderMode] = useState('sequential');

  const pages = groupAreasIntoPages(areas);

  const [signatories, setSignatories] = useState([
    { label: header.checkedBy || 'Checked & Approved By', sub: 'Signature / Stamp' },
    { label: 'Contractor / Supervisor', sub: 'Signature' },
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
      const fileName = `${cleanProjectName}_${dateStr}.pdf`;

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
          {isClientPortal ? (
            <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 fw-bold text-uppercase d-flex align-items-center gap-1">
              <i className="bi bi-patch-check-fill"></i> Official Verified Client Portal
            </span>
          ) : (
            <span className="badge bg-dark d-none d-sm-inline-block">Contractor Measurement Book</span>
          )}
          <span className="badge bg-primary text-white text-uppercase">
            <i className="bi bi-files me-1"></i>
            {pages.length} A4 Sheet Page{pages.length !== 1 ? 's' : ''}
          </span>
          {isApproved && (
            <span className="badge bg-success py-1 px-2 fw-bold d-inline-flex align-items-center gap-1">
              <i className="bi bi-check-all"></i> Digitally Approved
            </span>
          )}
        </div>

        {/* ORDERING & PAGINATION OPTIONS */}
        <div className="d-flex align-items-center gap-2 flex-wrap">
          {/* Order Mode Toggle */}
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

          {/* Abstract Summary Toggle */}
          <button
            type="button"
            className={`btn btn-xs fw-bold ${showAbstract ? 'btn-primary shadow-xs' : 'btn-outline-secondary border'}`}
            onClick={() => setShowAbstract(v => !v)}
            title="Toggle separate Abstract & Summary page"
          >
            <i className="bi bi-file-earmark-text me-1"></i> Abstract {showAbstract ? 'ON' : 'OFF'}
          </button>

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

      {/* SHEET PAGES */}
      {pages.map((page, pageIdx) => {
        const pageTotals = calculateSheetPageTotals(page);
        const isSinglePage = pages.length === 1;

        return (
          <div key={page.pageNumber} className="contractor-sheet-page bg-white p-2 p-sm-3 p-md-4 mx-auto shadow-sm mb-4 mb-md-5">
            {/* Screen badge */}
            <div className="d-print-none d-flex flex-wrap justify-content-between align-items-center mb-2 pb-2 border-bottom gap-2">
              <span className="badge bg-dark px-3 py-1 text-uppercase fw-bold">
                <i className="bi bi-file-earmark-text me-1"></i> SHEET PAGE {page.pageNumber} OF {pages.length}
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
                    <th style={{ width: '25%' }}>LOCATION</th>
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
                                            <div>
                                              <div className="fw-bold text-dark">{mainLocation}</div>
                                              {segIdx === 0 && (areaFloor || areaFlat) && (
                                                <div className="text-secondary fw-semibold extra-small mt-0.5" style={{ fontSize: '9px' }}>
                                                  {areaFloor && `Floor: ${areaFloor}`}
                                                  {areaFloor && areaFlat && ' | '}
                                                  {areaFlat && `Flat: ${areaFlat}`}
                                                </div>
                                              )}
                                            </div>
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
                                  <div>
                                    <div>{mainLocation}</div>
                                    {(areaFloor || areaFlat) && (
                                      <div className="text-muted fw-normal extra-small mt-1" style={{ fontSize: '9px' }}>
                                        {areaFloor && `Flr: ${areaFloor}`}
                                        {areaFloor && areaFlat && ' • '}
                                        {areaFlat && `Flt: ${areaFlat}`}
                                      </div>
                                    )}
                                  </div>
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
            {(isSinglePage || (!showAbstract && pageIdx === pages.length - 1)) && (
              <SignatureBlock signatories={signatories} clientApproval={projectData?.clientApproval} />
            )}
          </div>
        );
      })}

      {/* ABSTRACT / SUMMARY PAGE (Only if user toggles Abstract ON) */}
      {showAbstract && (
        <div className="contractor-sheet-page bg-white p-2 p-sm-3 p-md-4 mx-auto shadow-sm mb-4">
          <div className="d-print-none d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
            <span className="badge bg-dark px-3 py-1 text-uppercase fw-bold">
              <i className="bi bi-file-earmark-check me-1"></i> FINAL PROJECT ABSTRACT
            </span>
            <span className="badge bg-success text-white text-uppercase fw-bold">
              {pages.length} WORK CATEGORIES
            </span>
          </div>
          <div className="text-center mb-3">
            <h3 className="fw-bold text-uppercase mb-0" style={{ letterSpacing: '2px', fontSize: '1rem' }}>
              {header.contractorName || 'CONTRACTOR NAME'}
            </h3>
            <h6 className="fw-bold text-uppercase text-secondary mb-1" style={{ fontSize: '11px' }}>
              ABSTRACT OF MEASUREMENT &amp; SUMMARY OF SHEETS
            </h6>
            {header.clientName && <div className="text-muted" style={{ fontSize: '11px' }}>Client: {header.clientName}</div>}
          </div>
          <div className="table-responsive">
            <table className="table table-bordered border-dark sheet-grid-table align-middle mb-0" style={{ fontSize: '11px' }}>
              <thead className="text-center text-uppercase fw-bold bg-light-subtle">
                <tr>
                  <th style={{ width: '60px' }}>PAGE</th>
                  <th>WORK CATEGORY</th>
                  <th style={{ width: '70px' }}>UNIT</th>
                  <th style={{ width: '120px' }}>MEASURED QTY</th>
                  {billingMode && <th style={{ width: '130px' }}>AMOUNT ({currencySymbol})</th>}
                </tr>
              </thead>
              <tbody>
                {pages.map((p) => {
                  const pTotals = calculateSheetPageTotals(p);
                  return (
                    <tr key={p.pageNumber}>
                      <td className="text-center fw-bold">Sheet {p.pageNumber}</td>
                      <td className="px-2 fw-bold text-uppercase">{p.category}</td>
                      <td className="text-center fw-semibold">{pTotals.dominantUnit}</td>
                      <td className="text-end fw-bold font-monospace">{formatNumber(pTotals.netQty)}</td>
                      {billingMode && <td className="text-end fw-bold font-monospace">{formatCurrency(pTotals.netAmount, currencySymbol)}</td>}
                    </tr>
                  );
                })}
                {billingMode && (
                  <tr className="fw-bolder bg-light" style={{ fontSize: '12px' }}>
                    <td colSpan={4} className="text-end pe-2 text-uppercase">TOTAL PROJECT AMOUNT:</td>
                    <td className="text-end fw-bold text-dark">{formatCurrency(grandTotals.totalNetAmount, currencySymbol)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Simple abstract footer */}
          <div className="mt-2 pt-1 border-top d-flex justify-content-between align-items-center" style={{ fontSize: '9px', color: '#888' }}>
            <span className="text-uppercase">{header.contractorName || ''}</span>
            <span className="text-uppercase">Abstract — All {pages.length} Pages</span>
            <span>{formatDateDisplay(header.date) || ''}</span>
          </div>

          {/* SIGNATURE BLOCK — Only on this final/abstract page */}
          <SignatureBlock signatories={signatories} clientApproval={projectData?.clientApproval} />
        </div>
      )}
    </div>
  );
}
