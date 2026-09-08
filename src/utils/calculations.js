/**
 * Accurate civil/contractor calculation utilities
 */

export const isAreaUnit = (unit) => ['SFT', 'SQM'].includes(unit);
export const isLengthUnit = (unit) => ['RFT', 'RMT'].includes(unit);
export const isCountUnit = (unit) => ['NOS', 'PCS', 'NO'].includes(unit);

/**
 * Calculates a single line item total based on unit rules:
 * - SFT / SQM: Quantity * Length * Height
 * - RFT / RMT: Quantity * Length
 * - NOS: Quantity
 */
export function calculateLineItemTotal(item) {
  const qty = parseFloat(item.quantity) || 0;
  const length = parseFloat(item.length) || 0;
  const height = parseFloat(item.height) || 0;
  const unit = item.unit || 'SFT';

  if (qty === 0) return 0;

  if (isAreaUnit(unit)) {
    // If length or height is 0, total is 0 unless user hasn't entered height yet
    return roundNumber(qty * length * height, 2);
  } else if (isLengthUnit(unit)) {
    return roundNumber(qty * length, 2);
  } else if (isCountUnit(unit)) {
    return roundNumber(qty, 2);
  }

  // Fallback default: Qty * Length * (Height || 1)
  const product = qty * length * (height > 0 ? height : 1);
  return roundNumber(product, 2);
}

/**
 * Calculate billing amount for a line item
 */
export function calculateLineItemAmount(item, lineTotal) {
  const rate = parseFloat(item.rate) || 0;
  const total = lineTotal !== undefined ? lineTotal : calculateLineItemTotal(item);
  return roundNumber(total * rate, 2);
}

/**
 * Calculates totals for a specific Room / Area block:
 * - Gross Additions
 * - Deductions (LESS)
 * - Net Total (Total After Less)
 * - Gross Amount, Deduction Amount, Net Amount (for RA bill mode)
 */
export function calculateAreaTotals(area = {}) {
  let grossQty = 0;
  let lessQty = 0;
  let grossAmount = 0;
  let lessAmount = 0;

  // Breakdown by units (e.g. SFT vs RFT vs NOS)
  const unitBreakdown = {};
  const items = Array.isArray(area?.items) ? area.items : [];

  items.forEach(item => {
    const lineTotal = calculateLineItemTotal(item);
    const lineAmount = calculateLineItemAmount(item, lineTotal);
    const unit = item.unit || 'SFT';
    const isLess = item.isLess === true;

    if (!unitBreakdown[unit]) {
      unitBreakdown[unit] = { gross: 0, less: 0, net: 0 };
    }

    if (isLess) {
      lessQty += lineTotal;
      lessAmount += lineAmount;
      unitBreakdown[unit].less += lineTotal;
    } else {
      grossQty += lineTotal;
      grossAmount += lineAmount;
      unitBreakdown[unit].gross += lineTotal;
    }

    unitBreakdown[unit].net = roundNumber(unitBreakdown[unit].gross - unitBreakdown[unit].less, 2);
  });

  const netQty = roundNumber(grossQty - lessQty, 2);
  const netAmount = roundNumber(grossAmount - lessAmount, 2);

  return {
    grossQty: roundNumber(grossQty, 2),
    lessQty: roundNumber(lessQty, 2),
    netQty,
    grossAmount: roundNumber(grossAmount, 2),
    lessAmount: roundNumber(lessAmount, 2),
    netAmount,
    unitBreakdown
  };
}

/**
 * Calculate grand project-wide rollup metrics
 */
export function calculateProjectGrandTotals(rawAreas = [], billingMode = false, taxPercent = 0) {
  const areas = Array.isArray(rawAreas) ? rawAreas : [];
  let totalGrossQty = 0;
  let totalLessQty = 0;
  let totalNetQty = 0;
  let totalGrossAmount = 0;
  let totalNetAmount = 0;
  let totalLineItems = 0;

  const unitRollup = {};
  const categoryRollup = {};
  const floorRollup = {};

  areas.forEach(area => {
    const areaTotals = calculateAreaTotals(area);
    totalGrossQty += areaTotals.grossQty;
    totalLessQty += areaTotals.lessQty;
    totalNetQty += areaTotals.netQty;
    totalGrossAmount += areaTotals.grossAmount;
    totalNetAmount += areaTotals.netAmount;
    totalLineItems += (area.items || []).length;

    // Unit roll-up
    Object.entries(areaTotals.unitBreakdown).forEach(([unit, data]) => {
      if (!unitRollup[unit]) unitRollup[unit] = { gross: 0, less: 0, net: 0 };
      unitRollup[unit].gross = roundNumber(unitRollup[unit].gross + data.gross, 2);
      unitRollup[unit].less = roundNumber(unitRollup[unit].less + data.less, 2);
      unitRollup[unit].net = roundNumber(unitRollup[unit].net + data.net, 2);
    });

    // Floor roll-up
    const floorKey = area.floor || 'Ground';
    if (!floorRollup[floorKey]) floorRollup[floorKey] = { itemsCount: 0, netQty: 0, netAmount: 0 };
    floorRollup[floorKey].itemsCount += (area.items || []).length;
    floorRollup[floorKey].netQty = roundNumber(floorRollup[floorKey].netQty + areaTotals.netQty, 2);
    floorRollup[floorKey].netAmount = roundNumber(floorRollup[floorKey].netAmount + areaTotals.netAmount, 2);

    // Category roll-up
    (area.items || []).forEach(item => {
      const lineTotal = calculateLineItemTotal(item);
      const lineAmount = calculateLineItemAmount(item, lineTotal);
      const effectiveCategory = area.parentCategory === 'Other'
        ? (area.customParentCategory ? String(area.customParentCategory) : 'Other Work')
        : (area.parentCategory != null && area.parentCategory !== '' ? String(area.parentCategory) : 'General Work');

      const unit = item.unit || 'SFT';
      const rollupKey = `${effectiveCategory} - ${unit}`;
      const isLess = item.isLess === true;
      const signedTotal = isLess ? -lineTotal : lineTotal;
      const signedAmount = isLess ? -lineAmount : lineAmount;

      if (!categoryRollup[rollupKey]) {
        categoryRollup[rollupKey] = {
          parentCategory: effectiveCategory,
          unit,
          totalQty: 0,
          totalAmount: 0,
          itemsCount: 0,
          flatUnits: new Set()
        };
      }

      categoryRollup[rollupKey].totalQty = roundNumber(categoryRollup[rollupKey].totalQty + signedTotal, 2);
      categoryRollup[rollupKey].totalAmount = roundNumber(categoryRollup[rollupKey].totalAmount + signedAmount, 2);
      categoryRollup[rollupKey].itemsCount += 1;
      if (area.flat) categoryRollup[rollupKey].flatUnits.add(area.flat);
    });
  });

  const taxAmount = billingMode ? roundNumber((totalNetAmount * (parseFloat(taxPercent) || 0)) / 100, 2) : 0;
  const grandTotalPayable = billingMode ? roundNumber(totalNetAmount + taxAmount, 2) : totalNetQty;

  return {
    totalGrossQty: roundNumber(totalGrossQty, 2),
    totalLessQty: roundNumber(totalLessQty, 2),
    totalNetQty: roundNumber(totalNetQty, 2),
    totalGrossAmount: roundNumber(totalGrossAmount, 2),
    totalNetAmount: roundNumber(totalNetAmount, 2),
    taxAmount,
    grandTotalPayable,
    totalLineItems,
    unitRollup,
    categoryRollup: Object.values(categoryRollup).map(c => ({
      parentCategory: c.parentCategory,
      unit: c.unit,
      totalQty: c.totalQty,
      totalAmount: c.totalAmount,
      itemsCount: c.itemsCount,
      flatCount: c.flatUnits.size,
      flatsList: Array.from(c.flatUnits).join(', ')
    })),
    floorRollup
  };
}

export function roundNumber(num, decimals = 2) {
  if (isNaN(num) || num === null || num === undefined) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round((num + Number.EPSILON) * factor) / factor;
}

export function formatNumber(num, decimals = 2) {
  if (num === null || num === undefined || isNaN(num)) return '0.00';
  return Number(num).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

export function formatCurrency(num, symbol = '₹') {
  if (num === null || num === undefined || isNaN(num)) return `${symbol} 0.00`;
  return `${symbol} ${Number(num).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

/**
 * Groups areas sequentially into distinct Sheet Pages based on Work Category and manual page break overrides.
 * - Consecutive areas with the same Work Category stay on the same sheet page.
 * - When the Work Category changes from the previous area, a new sheet page is automatically started.
 * - If an area has `startNewPage: true`, a manual page break starts a new sheet page.
 */
export function groupAreasIntoPages(rawAreas = []) {
  const areas = Array.isArray(rawAreas) ? rawAreas : [];
  if (!areas.length) return [];

  const pages = [];
  let currentPage = null;

  areas.forEach((area, index) => {
    const rawCat = area.parentCategory;
    const category = (rawCat === 'Other' && area.customParentCategory)
      ? String(area.customParentCategory).trim()
      : (rawCat != null && rawCat !== '' ? String(rawCat) : 'Floor Tiles').trim();

    const isFirstArea = index === 0;
    const isManualPageBreak = area.startNewPage === true;
    const categoryChanged = currentPage && (category.toLowerCase() !== currentPage.category.toLowerCase());

    if (isFirstArea || isManualPageBreak || categoryChanged) {
      currentPage = {
        pageNumber: pages.length + 1,
        category: category,
        floor: area.floor || '',
        flat: area.flat || '',
        areas: [area]
      };
      pages.push(currentPage);
    } else {
      currentPage.areas.push(area);
    }
  });

  return pages;
}


/**
 * Calculates page-level rollup metrics for a specific sheet page
 */
export function calculateSheetPageTotals(page = {}) {
  const pageAreas = Array.isArray(page?.areas) ? page.areas : [];
  let grossQty = 0;
  let lessQty = 0;
  let netQty = 0;
  let grossAmount = 0;
  let lessAmount = 0;
  let netAmount = 0;
  const unitBreakdown = {};

  pageAreas.forEach(area => {
    const aTotals = calculateAreaTotals(area);
    grossQty += aTotals.grossQty;
    lessQty += aTotals.lessQty;
    netQty += aTotals.netQty;
    grossAmount += aTotals.grossAmount;
    lessAmount += aTotals.lessAmount;
    netAmount += aTotals.netAmount;

    Object.entries(aTotals.unitBreakdown || {}).forEach(([u, vals]) => {
      if (!unitBreakdown[u]) unitBreakdown[u] = { gross: 0, less: 0, net: 0 };
      unitBreakdown[u].gross = roundNumber(unitBreakdown[u].gross + vals.gross, 2);
      unitBreakdown[u].less = roundNumber(unitBreakdown[u].less + vals.less, 2);
      unitBreakdown[u].net = roundNumber(unitBreakdown[u].net + vals.net, 2);
    });
  });

  const dominantUnit = Object.keys(unitBreakdown)[0] || 'SFT';

  return {
    grossQty: roundNumber(grossQty, 2),
    lessQty: roundNumber(lessQty, 2),
    netQty: roundNumber(netQty, 2),
    grossAmount: roundNumber(grossAmount, 2),
    lessAmount: roundNumber(lessAmount, 2),
    netAmount: roundNumber(netAmount, 2),
    dominantUnit,
    unitBreakdown
  };
}
