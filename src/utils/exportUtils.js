import * as XLSX from 'xlsx';
import { calculateLineItemTotal, calculateLineItemAmount, calculateAreaTotals, calculateProjectGrandTotals } from './calculations';

export function exportToExcel(projectData, billingMode = false, options = {}) {
  const { header, areas } = projectData;
  const grandTotals = calculateProjectGrandTotals(areas, billingMode, projectData.settings?.taxPercent || 0);

  // 1. Detailed Measurement Sheet Data
  const sheetRows = [];

  // Metadata block
  sheetRows.push([header.contractorName || 'CONTRACTOR MEASUREMENT SHEET']);
  sheetRows.push([
    `Project: ${header.projectName || ''}`,
    `Description: ${header.workDescription || header.description || areas[0]?.parentCategory || 'Floor Tiles'}`,
    `Date: ${header.date || ''}`,
    `Sheet No: ${header.sheetNo || ''}`
  ]);
  sheetRows.push([`Client: ${header.clientName || ''}`, `Checked & Approved By: ${header.checkedBy || ''}`]);
  sheetRows.push([]); // blank row

  // Table header
  const tableHeaders = ['SR.', 'LOCATION', 'REMARK', 'UNIT', 'QTY.', 'LENGTH', 'HIGHT', 'TOTAL'];
  if (billingMode) {
    tableHeaders.push('RATE', 'AMOUNT');
  }
  sheetRows.push(tableHeaders);

  let globalSr = 1;

  areas.forEach((area, areaIdx) => {
    const areaTotals = calculateAreaTotals(area);
    const categoryTitle = area.parentCategory === 'Other'
      ? (area.customParentCategory ? String(area.customParentCategory) : 'Other Work')
      : (area.parentCategory != null && area.parentCategory !== '' ? String(area.parentCategory) : 'General Work');
    const headerTitle = area.descriptionHeader || categoryTitle;
    const roomTitle = area.room ? area.room.toUpperCase() : 'LIVING ROOM';

    // Section header row
    const locationBanner = `[${area.floor || ''} - ${area.flat || ''}] ${roomTitle} : ${headerTitle}`;
    sheetRows.push([`${areaIdx + 1}`, locationBanner, '', '', '', '', '', '']);

    const additionItems = (area.items || []).filter(i => !i.isLess);
    const lessItems = (area.items || []).filter(i => i.isLess);

    // 1. Regular items
    additionItems.forEach((item) => {
      const lineTotal = calculateLineItemTotal(item);
      const lineAmount = calculateLineItemAmount(item, lineTotal);
      const row = [
        globalSr++,
        roomTitle,
        item.remark || '',
        item.unit || 'SFT',
        item.quantity || 0,
        item.length || 0,
        ['RFT', 'RMT'].includes(item.unit) ? '-' : (item.height || 0),
        lineTotal
      ];
      if (billingMode) {
        row.push(item.rate || 0, lineAmount);
      }
      sheetRows.push(row);
    });

    // Subtotal additions
    const subtotalRow = ['', 'TOTAL', '', '', '', '', '', areaTotals.grossQty];
    if (billingMode) {
      subtotalRow.push('', areaTotals.grossAmount);
    }
    sheetRows.push(subtotalRow);

    // 2. LESS items if any
    if (lessItems.length > 0) {
      sheetRows.push(['', 'LESS (DEDUCTIONS)', '', '', '', '', '', '']);
      lessItems.forEach((item) => {
        const lineTotal = calculateLineItemTotal(item);
        const lineAmount = calculateLineItemAmount(item, lineTotal);
        const row = [
          globalSr++,
          'LESS',
          item.remark || '',
          item.unit || 'SFT',
          item.quantity || 0,
          item.length || 0,
          ['RFT', 'RMT'].includes(item.unit) ? '-' : (item.height || 0),
          lineTotal
        ];
        if (billingMode) {
          row.push(item.rate || 0, lineAmount);
        }
        sheetRows.push(row);
      });

      // Total Less row
      const lessTotalRow = ['', 'TOTAL LESS', '', '', '', '', '', areaTotals.lessQty];
      if (billingMode) {
        lessTotalRow.push('', areaTotals.lessAmount);
      }
      sheetRows.push(lessTotalRow);

      // Total after less row
      const afterLessRow = ['', 'TOTAL AFTER LESS', '', '', '', '', '', areaTotals.netQty];
      if (billingMode) {
        afterLessRow.push('', areaTotals.netAmount);
      }
      sheetRows.push(afterLessRow);
    }

    sheetRows.push([]); // blank divider
  });

  // Project Grand Total row
  const grandTotalRow = ['', 'GRAND TOTAL', '', '', '', '', '', grandTotals.totalNetQty];
  if (billingMode) {
    grandTotalRow.push('', grandTotals.totalNetAmount);
  }
  sheetRows.push(grandTotalRow);

  if (billingMode && projectData.settings?.taxPercent > 0) {
    sheetRows.push(['', `GST / Tax (${projectData.settings.taxPercent}%)`, '', '', '', '', '', '']);
    sheetRows[sheetRows.length - 1].push('', grandTotals.taxAmount);
    sheetRows.push(['', 'FINAL PAYABLE AMOUNT', '', '', '', '', '', '']);
    sheetRows[sheetRows.length - 1].push('', grandTotals.grandTotalPayable);
  }

  // Create workbook and append main sheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(sheetRows);

  // Set column widths for clean readability
  ws['!cols'] = [
    { wch: 6 },  // SR.
    { wch: 38 }, // DESCRIPTION
    { wch: 28 }, // REMARK
    { wch: 8 },  // UNIT
    { wch: 8 },  // QTY
    { wch: 10 }, // LENGTH
    { wch: 10 }, // HIGHT
    { wch: 14 }, // TOTAL
    { wch: 12 }, // RATE
    { wch: 16 }, // AMOUNT
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Measurement Sheet');

  // 2. Summary Dashboard Rollup Sheet
  const summaryRows = [];
  summaryRows.push([`${header.projectName || 'Project'} - Work Category Summary Roll-Up`]);
  summaryRows.push(['Category / Work Detail', 'Unit', 'Flats / Units Covered', 'Total Net Quantity', 'Line Items']);
  if (billingMode) {
    summaryRows[1].push('Total Net Amount');
  }

  grandTotals.categoryRollup.forEach(item => {
    const sRow = [
      item.parentCategory,
      item.unit,
      item.flatsList || '-',
      item.totalQty,
      item.itemsCount
    ];
    if (billingMode) {
      sRow.push(item.totalAmount);
    }
    summaryRows.push(sRow);
  });

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [
    { wch: 28 },
    { wch: 10 },
    { wch: 24 },
    { wch: 18 },
    { wch: 12 },
    { wch: 18 }
  ];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary Roll-Up');

  // Download file if not explicitly skipped
  const fileName = `${(header.projectName || 'Measurement_Sheet').replace(/[^a-z0-9]/gi, '_')}_${header.sheetNo || 'MTS'}.xlsx`;
  if (options?.download !== false) {
    XLSX.writeFile(wb, fileName);
  }

  // Generate Base64 string for cloud saving and instant viewer preview
  const base64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });

  // Extract tabular rows for fast browser rendering
  const sheetsData = wb.SheetNames.map(name => {
    const sheet = wb.Sheets[name];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    return {
      sheetName: name,
      rows,
    };
  });

  return {
    wb,
    fileName,
    base64,
    sheetsData,
    fileSize: Math.round((base64.length * 3) / 4),
    metadata: {
      projectName: header.projectName || 'UNTITLED PROJECT',
      sheetNo: header.sheetNo || 'MTS',
      date: header.date || new Date().toISOString().split('T')[0],
      clientName: header.clientName || '',
      totalNetQty: grandTotals.totalNetQty,
      totalNetAmount: grandTotals.totalNetAmount || 0,
      grandTotalPayable: grandTotals.grandTotalPayable || 0,
    }
  };
}

