import React, { useState } from 'react';
import {
  calculateLineItemTotal,
  calculateAreaTotals,
  calculateProjectGrandTotals,
  calculateSheetPageTotals,
  groupAreasIntoPages,
  formatNumber,
  formatCurrency
} from '../utils/calculations';

// ── Signature Block Component ─────────────────────────────────────────────────
function SignatureBlock({ signatories }) {
  if (!signatories || signatories.length === 0) return null;
  return (
    <div className="mt-5 pt-3 border-top">
      <div className="d-flex flex-wrap justify-content-around align-items-end" style={{ gap: '2rem' }}>
        {signatories.map((sig, i) => (
          <div key={i} className="text-center" style={{ minWidth: '180px', flex: '1 1 160px', maxWidth: '260px' }}>
            <div style={{ height: '48px', borderBottom: '1.5px solid #222', marginBottom: '6px' }}></div>
            <div className="fw-bold text-uppercase" style={{ fontSize: '11px' }}>{sig.label}</div>
            {sig.sub && <div className="text-muted" style={{ fontSize: '9px' }}>{sig.sub}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PrintSheetView({
  projectData,
  billingMode,
  currencySymbol = '₹',
  onClose
}) {
  const header = projectData?.header || {};
  const areas = Array.isArray(projectData?.areas) ? projectData.areas : [];
  const grandTotals = calculateProjectGrandTotals(areas, billingMode, projectData?.settings?.taxPercent || 0);
  const pages = groupAreasIntoPages(areas);

  const [signatories, setSignatories] = useState([
    { label: header.checkedBy || 'Checked & Approved By', sub: 'Signature / Stamp' },
    { label: 'Contractor / Supervisor', sub: 'Signature' },
  ]);
  const [showSigEditor, setShowSigEditor] = useState(false);

  const handlePrint = () => window.print();

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}`;
    } catch { /* ignore */ }
    return dateStr;
  };

  return (
    <div className="print-view-wrapper py-2 py-sm-3 py-md-4 px-1 px-sm-2 px-md-4">

      {/* ACTION BAR */}
      <div className="no-print mb-3 d-flex flex-wrap justify-content-between align-items-center gap-2 bg-white p-2 p-sm-3 rounded shadow-sm border">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose}>
            <i className="bi bi-arrow-left me-1"></i> Back to Editor
          </button>
          <span className="badge bg-dark d-none d-sm-inline-block">Contractor Measurement Book</span>
          <span className="badge bg-primary text-white text-uppercase">
            <i className="bi bi-files me-1"></i>
            {pages.length} Sheet Page{pages.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setShowSigEditor(v => !v)}>
            <i className="bi bi-pen me-1"></i> Customize Signatures
          </button>
          <button type="button" className="btn btn-primary btn-sm px-3 fw-bold shadow-sm" onClick={handlePrint}>
            <i className="bi bi-printer-fill me-1"></i> Print / Save as PDF
          </button>
        </div>
      </div>

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

            {/* Company Header */}
            <div className="text-center mb-2">
              <h3 className="fw-bold text-uppercase mb-0" style={{ letterSpacing: '2px', fontSize: '1rem' }}>
                {header.contractorName || 'CONTRACTOR NAME'}
              </h3>
              {header.clientName && <div className="text-muted" style={{ fontSize: '11px' }}>Client: {header.clientName}</div>}
            </div>

            {/* Measurement Table */}
            <div className="table-responsive">
              <table className="table table-bordered border-dark sheet-grid-table align-middle mb-0" style={{ fontSize: '11px' }}>
                <thead className="text-center text-uppercase fw-bold">
                  <tr className="bg-light-subtle align-middle">
                    <th colSpan={billingMode ? 5 : 4} className="fw-bold text-uppercase py-1 px-2 text-start align-middle" style={{ fontSize: '11px' }}>
                      {header.projectName || 'PROJECT'}
                      {page.floor ? ` — ${page.floor.toUpperCase()}` : ''}
                      {header.sheetNo ? ` (${header.sheetNo} · Pg ${page.pageNumber})` : ` (Pg ${page.pageNumber})`}
                    </th>
                    <th colSpan={3} className="fw-bold text-uppercase py-1 px-2 text-center align-middle" style={{ fontSize: '11px' }}>
                      {page.category.toUpperCase()}
                    </th>
                    <th colSpan={billingMode ? 3 : 2} className="text-center fw-bold py-1 align-middle" style={{ fontSize: '11px' }}>
                      {formatDateDisplay(header.date) || '—'}
                    </th>
                  </tr>
                  <tr className="bg-light-subtle">
                    <th style={{ width: '35px' }}>SR.</th>
                    <th style={{ minWidth: '150px', width: '22%' }}>LOCATION</th>
                    <th style={{ minWidth: '130px' }}>REMARK</th>
                    <th style={{ width: '50px' }}>UNIT</th>
                    <th style={{ width: '45px' }}>QTY</th>
                    <th style={{ width: '65px' }}>LENGTH</th>
                    <th style={{ width: '65px' }}>HEIGHT</th>
                    <th style={{ width: '75px' }}>TOTAL</th>
                    {billingMode && <><th style={{ width: '65px' }}>RATE</th><th style={{ width: '85px' }}>AMOUNT</th></>}
                    <th style={{ width: '90px' }}>GRAND TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {page.areas.map((area, areaIdx) => {
                    const areaTotals = calculateAreaTotals(area);
                    const additions = (area.items || []).filter(i => !i.isLess);
                    const deductions = (area.items || []).filter(i => i.isLess);
                    const roomVal = (area.room === 'Other' && area.customRoom) ? area.customRoom : area.room;
                    const mainLocation = roomVal?.toUpperCase() || area.location?.toUpperCase() || 'LOCATION';

                    return (
                      <React.Fragment key={area.id}>
                        {additions.map((item, itemIdx) => {
                          const lineTotal = calculateLineItemTotal(item);
                          const isFirst = itemIdx === 0;
                          return (
                            <tr key={item.id}>
                              {isFirst && <td className="text-center fw-bold align-top" rowSpan={additions.length + 1}>{areaIdx + 1}</td>}
                              {isFirst && <td className="fw-bold align-middle text-uppercase px-1" rowSpan={additions.length} style={{ fontSize: '11px' }}>{mainLocation}</td>}
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
                            <td colSpan={6} className="text-end pe-2 text-uppercase" style={{ fontSize: '10px' }}>TOTAL</td>
                            <td className="text-end border-top border-bottom border-dark">{formatNumber(areaTotals.grossQty)}</td>
                            {billingMode && <><td></td><td className="text-end border-top border-bottom border-dark">{formatNumber(areaTotals.grossAmount)}</td></>}
                            <td></td>
                          </tr>
                        )}
                        {additions.length === 0 && deductions.length === 0 && (
                          <tr>
                            <td className="text-center fw-bold">{areaIdx + 1}</td>
                            <td className="fw-bold text-uppercase px-1">{mainLocation}</td>
                            <td colSpan={billingMode ? 9 : 7} className="text-center text-muted py-1">—</td>
                          </tr>
                        )}
                        {deductions.length > 0 && (
                          <>
                            {deductions.map((dItem, dIdx) => {
                              const lineTotal = calculateLineItemTotal(dItem);
                              return (
                                <tr key={dItem.id}>
                                  <td className="text-center"></td>
                                  {dIdx === 0 && <td className="fw-bold align-middle text-center text-uppercase" rowSpan={deductions.length} style={{ fontSize: '10px' }}>LESS</td>}
                                  <td className="px-1 text-uppercase text-muted" style={{ fontSize: '10px' }}>{dItem.remark || 'Deduction'}</td>
                                  <td className="text-center" style={{ fontSize: '10px' }}>{dItem.unit || 'SFT'}</td>
                                  <td className="text-center">{dItem.quantity || 1}</td>
                                  <td className="text-end">{dItem.length ? formatNumber(dItem.length) : '-'}</td>
                                  <td className="text-end">{['RFT', 'RMT'].includes(dItem.unit) ? '-' : (dItem.height ? formatNumber(dItem.height) : '-')}</td>
                                  <td className="text-end">{formatNumber(lineTotal)}</td>
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
                              <td colSpan={6} className="text-end pe-2 text-uppercase" style={{ fontSize: '10px' }}>TOTAL LESS</td>
                              <td className="text-end border-top border-bottom border-dark">{formatNumber(areaTotals.lessQty)}</td>
                              {billingMode && <><td></td><td className="text-end">-{formatNumber(areaTotals.lessAmount)}</td></>}
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

            {/* Simple page footer — NO signature here */}
            <div className="mt-2 pt-1 border-top d-flex justify-content-between align-items-center" style={{ fontSize: '9px', color: '#888' }}>
              <span className="text-uppercase">{header.contractorName || ''}</span>
              <span className="text-uppercase">Page {page.pageNumber} of {pages.length} — {page.category}</span>
              <span>{formatDateDisplay(header.date) || ''}</span>
            </div>

            {/* Signature ONLY for single-page documents */}
            {isSinglePage && <SignatureBlock signatories={signatories} />}
          </div>
        );
      })}

      {/* ABSTRACT / SUMMARY PAGE (Multi-page docs) */}
      {pages.length > 1 && (
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
          <SignatureBlock signatories={signatories} />
        </div>
      )}
    </div>
  );
}
