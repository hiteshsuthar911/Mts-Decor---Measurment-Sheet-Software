import React from 'react';
import {
  calculateLineItemTotal,
  calculateAreaTotals,
  calculateProjectGrandTotals,
  calculateSheetPageTotals,
  groupAreasIntoPages,
  formatNumber,
  formatCurrency
} from '../utils/calculations';

export default function PrintSheetView({
  projectData,
  billingMode,
  currencySymbol = '₹',
  onClose
}) {
  const header = projectData?.header || {};
  const areas = Array.isArray(projectData?.areas) ? projectData.areas : [];
  const grandTotals = calculateProjectGrandTotals(areas, billingMode, projectData?.settings?.taxPercent || 0);

  // Group areas into distinct sequential pages based on work category & manual page breaks (1-1-2-3-1)
  const pages = groupAreasIntoPages(areas);

  const handlePrint = () => {
    window.print();
  };

  // Format date for contractor sheet (DD/MM/YY or DD/MM/YYYY)
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}`;
      }
    } catch {
      // ignore
    }
    return dateStr;
  };

  return (
    <div className="print-view-wrapper py-2 py-sm-3 py-md-4 px-1 px-sm-2 px-md-4">
      {/* Action Bar (Hidden in physical print) */}
      <div className="no-print mb-3 mb-md-4 d-flex flex-wrap justify-content-between align-items-center gap-2 bg-white p-2 p-sm-3 rounded shadow-sm border">
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={onClose}
          >
            <i className="bi bi-arrow-left me-1"></i> Back to Editor
          </button>
          <span className="badge bg-dark d-none d-sm-inline-block">Contractor Measurement Book Format</span>
          <span className="badge bg-primary text-white text-uppercase">
            <i className="bi bi-files me-1"></i>
            {pages.length} Sheet Page{pages.length !== 1 ? 's' : ''} Generated
          </span>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-primary btn-sm px-3 fw-bold shadow-sm"
            onClick={handlePrint}
          >
            <i className="bi bi-printer-fill me-1"></i> Print / Save as PDF
          </button>
        </div>
      </div>

      {/* ── RENDER EACH SHEET PAGE SEQUENTIALLY ── */}
      {pages.map((page) => {
        const pageTotals = calculateSheetPageTotals(page);

        return (
          <div
            key={page.pageNumber}
            className="contractor-sheet-page bg-white p-2 p-sm-3 p-md-4 p-lg-5 mx-auto shadow-sm mb-4 mb-md-5"
          >
            {/* Screen View Header & Swipe Cue */}
            <div className="d-print-none d-flex flex-wrap justify-content-between align-items-center mb-2 pb-2 border-bottom gap-2">
              <span className="badge bg-dark px-3 py-1 text-uppercase fw-bold">
                <i className="bi bi-file-earmark-text me-1"></i> SHEET PAGE {page.pageNumber} OF {pages.length}
              </span>
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 text-uppercase fw-bold">
                WORK CATEGORY: {page.category}
              </span>
            </div>

            <div className="d-print-none d-md-none text-muted extra-small py-1 px-2 mb-2 text-center bg-light border rounded">
              <i className="bi bi-arrow-left-right me-1 text-primary"></i> SWIPE TABLE TO VIEW ALL COLUMNS
            </div>

            {/* Company Title */}
            <div className="text-center mb-3">
              <h3 className="fw-bold text-uppercase tracking-wide mb-1 fs-5 fs-sm-4 fs-md-3" style={{ letterSpacing: '2px' }}>
                {header.contractorName || 'CONTRACTOR NAME'}
              </h3>
              {header.clientName && (
                <div className="text-muted small">Client: {header.clientName}</div>
              )}
            </div>

            {/* Unified Measurement Table with Top Header Row */}
            <div className="table-responsive">
              <table className="table table-bordered border-dark sheet-grid-table align-middle mb-0">
                <thead className="text-center text-uppercase fw-bold">
                  {/* Top Header Box (Matches PARK CREST - 8TH FLOOR | WORK DETAIL | DATE) */}
                  <tr className="bg-light-subtle align-middle">
                    <th colSpan={billingMode ? 5 : 4} className="fw-bold text-uppercase py-2 px-3 text-start fs-6 align-middle">
                      {header.projectName || 'PROJECT NAME'}{page.floor ? ` - ${page.floor.toUpperCase()}` : ''}
                      {header.sheetNo ? ` (${header.sheetNo} • PAGE ${page.pageNumber})` : ` (PAGE ${page.pageNumber})`}
                    </th>
                    <th colSpan={billingMode ? 3 : 3} className="fw-bold text-uppercase py-2 px-3 text-center fs-6 align-middle">
                      {page.category.toUpperCase()}
                    </th>
                    <th colSpan={billingMode ? 3 : 2} className="text-center fw-bold py-2 fs-6 align-middle">
                      {formatDateDisplay(header.date) || 'DATE'}
                    </th>
                  </tr>

                  {/* Column Headings */}
                  <tr className="bg-light-subtle">
                    <th style={{ width: '45px' }}>SR.</th>
                    <th style={{ minWidth: '180px', width: '25%' }}>LOCATION</th>
                    <th style={{ minWidth: '150px' }}>REMARK</th>
                    <th style={{ width: '60px' }}>UNIT</th>
                    <th style={{ width: '55px' }}>QTY.</th>
                    <th style={{ width: '75px' }}>LENGTH</th>
                    <th style={{ width: '75px' }}>HIGHT</th>
                    <th style={{ width: '85px' }}>TOTAL</th>
                    {billingMode && (
                      <>
                        <th style={{ width: '75px' }}>RATE</th>
                        <th style={{ width: '95px' }}>AMOUNT</th>
                      </>
                    )}
                    <th style={{ width: '100px' }}>GRAND TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {page.areas.map((area, areaIdx) => {
                    const areaTotals = calculateAreaTotals(area);
                    const additions = (area.items || []).filter(i => !i.isLess);
                    const deductions = (area.items || []).filter(i => i.isLess);

                    const roomVal = (area.room === 'Other' && area.customRoom) ? area.customRoom : area.room;
                    const mainLocation = roomVal?.toUpperCase() || area.location?.toUpperCase() || area.descriptionHeader?.toUpperCase() || 'LIVING ROOM';

                    return (
                      <React.Fragment key={area.id}>
                        {/* Additions Rows */}
                        {additions.map((item, itemIdx) => {
                          const lineTotal = calculateLineItemTotal(item);
                          const isFirst = itemIdx === 0;

                          return (
                            <tr key={item.id}>
                              {/* SR number: sequential within this sheet page */}
                              {isFirst ? (
                                <td className="text-center fw-bold align-top" rowSpan={additions.length + 1}>
                                  {areaIdx + 1}
                                </td>
                              ) : null}

                              {/* LOCATION: spans the additions */}
                              {isFirst ? (
                                <td className="fw-bold align-middle text-uppercase px-2" rowSpan={additions.length}>
                                  {mainLocation}
                                </td>
                              ) : null}

                              <td className="px-2 text-uppercase small">{item.remark || '-'}</td>
                              <td className="text-center small">{item.unit || 'SFT'}</td>
                              <td className="text-center">{item.quantity || 1}</td>
                              <td className="text-end">{item.length ? formatNumber(item.length) : '-'}</td>
                              <td className="text-end">
                                {['RFT', 'RMT'].includes(item.unit) ? '-' : (item.height ? formatNumber(item.height) : '-')}
                              </td>
                              <td className="text-end fw-semibold">{formatNumber(lineTotal)}</td>

                              {billingMode && (
                                <>
                                  <td className="text-end small">{item.rate ? formatNumber(item.rate) : '-'}</td>
                                  <td className="text-end small">{formatNumber(calculateLineItemTotal(item) * (parseFloat(item.rate) || 0))}</td>
                                </>
                              )}

                              {/* Empty Grand total cell on regular rows */}
                              <td className="text-end"></td>
                            </tr>
                          );
                        })}

                        {/* Subtotal of Additions */}
                        {additions.length > 0 && (
                          <tr className="fw-bold">
                            <td colSpan={6} className="text-end pe-3 text-uppercase">
                              TOTAL
                            </td>
                            <td className="text-end border-top border-bottom border-dark">
                              {formatNumber(areaTotals.grossQty)}
                            </td>
                            {billingMode && (
                              <>
                                <td></td>
                                <td className="text-end border-top border-bottom border-dark">
                                  {formatNumber(areaTotals.grossAmount)}
                                </td>
                              </>
                            )}
                            <td className="text-end"></td>
                          </tr>
                        )}

                        {/* Fallback for empty area */}
                        {additions.length === 0 && deductions.length === 0 && (
                          <tr>
                            <td className="text-center fw-bold">{areaIdx + 1}</td>
                            <td className="fw-bold text-uppercase px-2">{mainLocation}</td>
                            <td colSpan={billingMode ? 9 : 7} className="text-center text-muted py-2">
                              -
                            </td>
                          </tr>
                        )}

                        {/* LESS (Deductions) Section */}
                        {deductions.length > 0 && (
                          <>
                            {deductions.map((dItem, dIdx) => {
                              const lineTotal = calculateLineItemTotal(dItem);
                              const isFirstDeduction = dIdx === 0;

                              return (
                                <tr key={dItem.id}>
                                  <td className="text-center"></td>

                                  {isFirstDeduction ? (
                                    <td className="fw-bold align-middle text-center text-uppercase" rowSpan={deductions.length}>
                                      LESS
                                    </td>
                                  ) : null}

                                  <td className="px-2 text-uppercase small text-muted">{dItem.remark || 'Deduction'}</td>
                                  <td className="text-center small">{dItem.unit || 'SFT'}</td>
                                  <td className="text-center">{dItem.quantity || 1}</td>
                                  <td className="text-end">{dItem.length ? formatNumber(dItem.length) : '-'}</td>
                                  <td className="text-end">
                                    {['RFT', 'RMT'].includes(dItem.unit) ? '-' : (dItem.height ? formatNumber(dItem.height) : '-')}
                                  </td>
                                  <td className="text-end">{formatNumber(lineTotal)}</td>

                                  {billingMode && (
                                    <>
                                      <td className="text-end small">{dItem.rate ? formatNumber(dItem.rate) : '-'}</td>
                                      <td className="text-end small">-{formatNumber(lineTotal * (parseFloat(dItem.rate) || 0))}</td>
                                    </>
                                  )}

                                  <td className="text-end"></td>
                                </tr>
                              );
                            })}

                            {/* TOTAL LESS Row */}
                            <tr className="fw-bold">
                              <td></td>
                              <td colSpan={6} className="text-end pe-3 text-uppercase">
                                TOTAL LESS
                              </td>
                              <td className="text-end border-top border-bottom border-dark">
                                {formatNumber(areaTotals.lessQty)}
                              </td>
                              {billingMode && (
                                <>
                                  <td></td>
                                  <td className="text-end">-{formatNumber(areaTotals.lessAmount)}</td>
                                </>
                              )}
                              <td className="text-end"></td>
                            </tr>

                            {/* TOTAL AFTER LESS Row */}
                            <tr className="fw-bold bg-light-subtle">
                              <td></td>
                              <td colSpan={6} className="text-end pe-3 text-uppercase">
                                TOTAL AFTER LESS
                              </td>
                              <td className="text-end border-top border-bottom border-dark">
                                {formatNumber(areaTotals.netQty)}
                              </td>
                              {billingMode && (
                                <>
                                  <td></td>
                                  <td className="text-end fw-bold">{formatNumber(areaTotals.netAmount)}</td>
                                </>
                              )}
                              <td className="text-end fw-bold fs-6">
                                {formatNumber(areaTotals.netQty)}
                              </td>
                            </tr>
                          </>
                        )}

                        {/* When no deductions, show total in Grand Total column */}
                        {deductions.length === 0 && additions.length > 0 && (
                          <tr className="fw-bold bg-light-subtle">
                            <td></td>
                            <td colSpan={6} className="text-end pe-3 text-uppercase">
                              NET TOTAL
                            </td>
                            <td className="text-end">
                              {formatNumber(areaTotals.netQty)}
                            </td>
                            {billingMode && (
                              <>
                                <td></td>
                                <td className="text-end">{formatNumber(areaTotals.netAmount)}</td>
                              </>
                            )}
                            <td className="text-end fw-bold fs-6">
                              {formatNumber(areaTotals.netQty)}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}

                  {/* Sheet Page Grand Total (Specific to this Sheet Page & Category!) */}
                  <tr className="fw-bolder bg-light fs-6 project-grand-total-row">
                    <td colSpan={7} className="text-end pe-3 text-uppercase">
                      PAGE #{page.pageNumber} TOTAL ({page.category.toUpperCase()}):
                    </td>
                    <td className="text-end">
                      {formatNumber(pageTotals.netQty)}
                    </td>
                    {billingMode && (
                      <>
                        <td></td>
                        <td className="text-end">{formatCurrency(pageTotals.netAmount, currencySymbol)}</td>
                      </>
                    )}
                    <td className="text-end fw-bold text-dark fs-6">
                      {formatNumber(pageTotals.netQty)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Signatures and Endorsement Block */}
            <div className="mt-4 pt-4 border-top">
              <div className="d-flex justify-content-between align-items-end">
                <div className="text-muted extra-small text-uppercase">
                  Sheet Page {page.pageNumber} of {pages.length} &bull; Work: {page.category}
                </div>
                <div className="text-center" style={{ minWidth: '220px', maxWidth: '300px' }}>
                  <div className="border-top border-dark pt-2 fw-semibold small">
                    {header.checkedBy ? (
                      <>
                        <div className="text-uppercase">{header.checkedBy}</div>
                        <div className="text-muted extra-small">Checked and Approved By</div>
                      </>
                    ) : (
                      <>
                        <div className="text-uppercase">Checked and Approved By</div>
                        <div className="text-muted extra-small">Signature</div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {header.notes && (
              <div className="mt-3 text-muted extra-small border-top pt-2">
                <strong>Notes / Joint Remarks:</strong> {header.notes}
              </div>
            )}
          </div>
        );
      })}

      {/* ── FINAL ABSTRACT OF MEASUREMENT & BILL SUMMARY (WHEN MULTIPLE PAGES OR BILLING MODE) ── */}
      {pages.length > 1 && (
        <div className="contractor-sheet-page bg-white p-2 p-sm-3 p-md-4 p-lg-5 mx-auto shadow-sm mb-4">
          <div className="d-print-none d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
            <span className="badge bg-dark px-3 py-1 text-uppercase fw-bold">
              <i className="bi bi-file-earmark-check me-1"></i> FINAL PROJECT ABSTRACT
            </span>
            <span className="badge bg-success text-white text-uppercase fw-bold">
              {pages.length} WORK CATEGORIES / SHEETS
            </span>
          </div>

          <div className="text-center mb-3">
            <h3 className="fw-bold text-uppercase tracking-wide mb-1 fs-5 fs-sm-4 fs-md-3" style={{ letterSpacing: '2px' }}>
              {header.contractorName || 'CONTRACTOR NAME'}
            </h3>
            <h5 className="fw-bold text-uppercase text-secondary mb-1">
              ABSTRACT OF MEASUREMENT &amp; SUMMARY OF SHEETS
            </h5>
            {header.clientName && (
              <div className="text-muted small">Client: {header.clientName}</div>
            )}
          </div>

          <div className="table-responsive">
            <table className="table table-bordered border-dark sheet-grid-table align-middle mb-0">
              <thead className="text-center text-uppercase fw-bold bg-light-subtle">
                <tr>
                  <th style={{ width: '60px' }}>PAGE</th>
                  <th>WORK CATEGORY (DESCRIPTION)</th>
                  <th style={{ width: '80px' }}>UNIT</th>
                  <th style={{ width: '130px' }}>MEASURED QTY</th>
                  {billingMode && (
                    <th style={{ width: '140px' }}>AMOUNT ({currencySymbol})</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {pages.map((p) => {
                  const pTotals = calculateSheetPageTotals(p);
                  return (
                    <tr key={p.pageNumber}>
                      <td className="text-center fw-bold">Sheet {p.pageNumber}</td>
                      <td className="px-3 fw-bold text-uppercase">{p.category}</td>
                      <td className="text-center fw-semibold">{pTotals.dominantUnit}</td>
                      <td className="text-end fw-bold font-monospace">{formatNumber(pTotals.netQty)}</td>
                      {billingMode && (
                        <td className="text-end fw-bold font-monospace">{formatCurrency(pTotals.netAmount, currencySymbol)}</td>
                      )}
                    </tr>
                  );
                })}

                {billingMode && (
                  <tr className="fw-bolder bg-light fs-6 project-grand-total-row">
                    <td colSpan={4} className="text-end pe-3 text-uppercase">
                      TOTAL PROJECT AMOUNT:
                    </td>
                    <td className="text-end fw-bold text-dark fs-6">
                      {formatCurrency(grandTotals.totalNetAmount, currencySymbol)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Signatures for abstract */}
          <div className="mt-5 pt-4 border-top">
            <div className="d-flex justify-content-end">
              <div className="text-center" style={{ minWidth: '220px', maxWidth: '300px' }}>
                <div className="border-top border-dark pt-2 fw-semibold small">
                  <div className="text-uppercase">{header.checkedBy || 'Checked and Approved By'}</div>
                  <div className="text-muted extra-small">Final Endorsement &amp; Stamp</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
