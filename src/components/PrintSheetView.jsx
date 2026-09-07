import React from 'react';
import { calculateLineItemTotal, calculateAreaTotals, calculateProjectGrandTotals, formatNumber, formatCurrency } from '../utils/calculations';

export default function PrintSheetView({
  projectData,
  billingMode,
  currencySymbol = '₹',
  onClose
}) {
  const header = projectData?.header || {};
  const areas = Array.isArray(projectData?.areas) ? projectData.areas : [];
  const grandTotals = calculateProjectGrandTotals(areas, billingMode, projectData?.settings?.taxPercent || 0);

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
    <div className="print-view-wrapper py-4 px-2 px-md-4">
      {/* Action Bar (Hidden in physical print) */}
      <div className="no-print mb-4 d-flex justify-content-between align-items-center bg-white p-3 rounded shadow-sm border">
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={onClose}
          >
            <i className="bi bi-arrow-left me-1"></i> Back to Editor
          </button>
          <span className="badge bg-dark">Contractor Measurement Book Format</span>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-primary btn-sm px-3 fw-bold"
            onClick={handlePrint}
          >
            <i className="bi bi-printer-fill me-1"></i> Print / Save as PDF
          </button>
        </div>
      </div>

      {/* The Printable Sheet (Styled exactly like the contractor PDF) */}
      <div className="contractor-sheet-page bg-white p-4 p-md-5 mx-auto shadow-sm">
        {/* Company Title */}
        <div className="text-center mb-3">
          <h3 className="fw-bold text-uppercase tracking-wide mb-1" style={{ letterSpacing: '2px' }}>
            {header.contractorName || 'CONTRACTOR NAME'}
          </h3>
          {header.clientName && (
            <div className="text-muted small">Client: {header.clientName}</div>
          )}
        </div>

        {/* Top Header Box (Matches PARK CREST - 8TH FLOOR | 25/07/25) */}
        <div className="table-responsive mb-0">
          <table className="table table-bordered border-dark sheet-grid-table mb-0">
            <tbody>
              <tr>
                <td colSpan={billingMode ? 5 : 4} className="fw-bold text-uppercase py-2 px-3 bg-light-subtle">
                  {header.projectName || 'PROJECT NAME'}{areas[0]?.floor ? ` - ${areas[0].floor.toUpperCase()}` : ''}
                  {header.sheetNo ? ` (${header.sheetNo})` : ''}
                </td>
                <td colSpan={billingMode ? 3 : 2} className="fw-bold text-uppercase py-2 px-3 bg-light-subtle text-center">
                  {header.workDescription?.toUpperCase() || header.description?.toUpperCase() || (areas[0]?.parentCategory === 'Other' ? areas[0]?.customParentCategory?.toUpperCase() : areas[0]?.parentCategory?.toUpperCase()) || areas[0]?.descriptionHeader?.toUpperCase() || 'FLOOR TILES'}
                </td>
                <td colSpan={billingMode ? 2 : 2} className="text-center fw-bold py-2 bg-light-subtle" style={{ width: '150px' }}>
                  {formatDateDisplay(header.date) || 'DATE'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Main Measurement Table */}
        <div className="table-responsive">
          <table className="table table-bordered border-dark sheet-grid-table align-middle mb-0">
            <thead className="text-center text-uppercase fw-bold">
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
              {areas.map((area, areaIdx) => {
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
                          {/* SR number: only on the very first row of area */}
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
                    <tr className="fw-bold">
                      <td colSpan={billingMode ? 7 : 5} className="text-end pe-3 text-uppercase">
                        TOTAL
                      </td>
                      <td className="text-end border-top border-bottom border-dark">
                        {formatNumber(areaTotals.grossQty)}
                      </td>
                      <td className="text-end"></td>
                    </tr>

                    {/* LESS (Deductions) Section */}
                    {deductions.length > 0 && (
                      <>
                        {deductions.map((dItem, dIdx) => {
                          const lineTotal = calculateLineItemTotal(dItem);
                          const isFirstDeduction = dIdx === 0;

                          return (
                            <tr key={dItem.id}>
                              {/* Empty SR cell */}
                              <td className="text-center"></td>

                              {/* LESS header in description column */}
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
                          <td colSpan={billingMode ? 6 : 6} className="text-end pe-3 text-uppercase">
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
                          <td colSpan={billingMode ? 6 : 6} className="text-end pe-3 text-uppercase">
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
                          {/* Print Grand Total in rightmost column */}
                          <td className="text-end fw-bold fs-6">
                            {formatNumber(areaTotals.netQty)}
                          </td>
                        </tr>
                      </>
                    )}

                    {/* When no deductions, show total in Grand Total column */}
                    {deductions.length === 0 && (
                      <tr className="fw-bold bg-light-subtle">
                        <td></td>
                        <td colSpan={billingMode ? 6 : 6} className="text-end pe-3 text-uppercase">
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

              {/* Final Sheet Grand Total */}
              <tr className="fw-bolder bg-light border-top border-dark border-3 fs-6">
                <td colSpan={billingMode ? 7 : 7} className="text-end pe-3 text-uppercase">
                  PROJECT GRAND TOTAL:
                </td>
                <td className="text-end">
                  {formatNumber(grandTotals.totalNetQty)}
                </td>
                {billingMode && (
                  <>
                    <td></td>
                    <td className="text-end">{formatCurrency(grandTotals.totalNetAmount, currencySymbol)}</td>
                  </>
                )}
                <td className="text-end fw-bold text-dark fs-6">
                  {formatNumber(grandTotals.totalNetQty)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Signatures and Endorsement Block */}
        <div className="mt-5 pt-4 border-top">
          <div className="d-flex justify-content-end">
            <div className="text-center" style={{ minWidth: '240px', maxWidth: '320px' }}>
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
          <div className="mt-4 text-muted extra-small border-top pt-2">
            <strong>Notes / Joint Remarks:</strong> {header.notes}
          </div>
        )}
      </div>
    </div>
  );
}
