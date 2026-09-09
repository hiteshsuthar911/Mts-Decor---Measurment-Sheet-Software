import { calculateProjectTotals, calculateLineItemTotal, calculateLineItemAmount } from './calculations';

const REVISION_PREFIX = 'mts_sheet_revisions_';

export function getRevisions(projectId = 'default') {
  try {
    const key = `${REVISION_PREFIX}${projectId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Error fetching revisions:', err);
    return [];
  }
}

export function saveRevision(projectId = 'default', projectData, note = 'Snapshot', author = 'User') {
  try {
    const key = `${REVISION_PREFIX}${projectId}`;
    const revisions = getRevisions(projectId);
    const totals = calculateProjectTotals(projectData?.areas || []);

    const newRevision = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      note: note || `Revision #${revisions.length + 1}`,
      author: author || 'Contractor / Engineer',
      totals: {
        grossQty: totals.totalGrossQty ?? totals.grossQty ?? 0,
        lessQty: totals.totalLessQty ?? totals.lessQty ?? 0,
        netQty: totals.totalNetQty ?? totals.netQty ?? 0,
        netAmount: totals.totalNetAmount ?? totals.netAmount ?? 0
      },
      data: JSON.parse(JSON.stringify(projectData))
    };

    const updated = [newRevision, ...revisions].slice(0, 40); // Keep last 40 revisions
    localStorage.setItem(key, JSON.stringify(updated));
    return newRevision;
  } catch (err) {
    console.error('Error saving revision:', err);
    return null;
  }
}

export function deleteRevision(projectId = 'default', revisionId) {
  try {
    const key = `${REVISION_PREFIX}${projectId}`;
    const revisions = getRevisions(projectId);
    const updated = revisions.filter(r => r.id !== revisionId);
    localStorage.setItem(key, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Error deleting revision:', err);
    return [];
  }
}

/**
 * Compare two project versions (Rev-1 vs Rev-2 or Rev vs Current)
 * and return rich item-level, field-level, and total variance diffs.
 */
export function compareRevisions(oldProject, newProject) {
  const oldAreas = oldProject?.areas || [];
  const newAreas = newProject?.areas || [];

  const oldTotals = calculateProjectTotals(oldAreas);
  const newTotals = calculateProjectTotals(newAreas);

  // Map old items by location + remark or ID
  const oldItemMap = new Map();
  oldAreas.forEach(a => {
    (a.items || []).forEach((item, idx) => {
      const locationKey = `${a.floor || ''}|${a.flat || ''}|${a.room || ''}|${item.remark || idx}`;
      const lineTotal = calculateLineItemTotal(item);
      const lineAmt = calculateLineItemAmount(item, lineTotal);
      oldItemMap.set(locationKey, {
        area: a,
        item,
        lineTotal: item.isLess ? -lineTotal : lineTotal,
        lineAmount: item.isLess ? -lineAmt : lineAmt
      });
    });
  });

  const addedItems = [];
  const modifiedItems = [];
  const unchangedItems = [];
  const matchedOldKeys = new Set();

  let totalAddedQty = 0;
  let totalAddedAmount = 0;
  let totalModifiedQtyDiff = 0;
  let totalModifiedAmtDiff = 0;

  newAreas.forEach(a => {
    (a.items || []).forEach((item, idx) => {
      const locationKey = `${a.floor || ''}|${a.flat || ''}|${a.room || ''}|${item.remark || idx}`;
      const newLineTotal = calculateLineItemTotal(item);
      const newLineAmt = calculateLineItemAmount(item, newLineTotal);
      const signedNewTotal = item.isLess ? -newLineTotal : newLineTotal;
      const signedNewAmt = item.isLess ? -newLineAmt : newLineAmt;

      const oldMatch = oldItemMap.get(locationKey);

      if (!oldMatch) {
        addedItems.push({
          areaName: `${a.floor || ''} ${a.flat || ''} ${a.room || a.parentCategory || ''}`.trim(),
          item,
          lineTotal: signedNewTotal,
          lineAmount: signedNewAmt,
          status: 'added'
        });
        totalAddedQty += signedNewTotal;
        totalAddedAmount += signedNewAmt;
      } else {
        matchedOldKeys.add(locationKey);
        const hasChanged =
          oldMatch.item.quantity !== item.quantity ||
          oldMatch.item.length !== item.length ||
          oldMatch.item.height !== item.height ||
          oldMatch.item.unit !== item.unit ||
          oldMatch.item.rate !== item.rate ||
          oldMatch.item.isLess !== item.isLess;

        const qtyDiff = signedNewTotal - oldMatch.lineTotal;
        const amtDiff = signedNewAmt - oldMatch.lineAmount;

        if (hasChanged) {
          modifiedItems.push({
            areaName: `${a.floor || ''} ${a.flat || ''} ${a.room || a.parentCategory || ''}`.trim(),
            oldItem: oldMatch.item,
            newItem: item,
            oldTotal: oldMatch.lineTotal,
            newTotal: signedNewTotal,
            oldAmount: oldMatch.lineAmount,
            newAmount: signedNewAmt,
            qtyDiff,
            amtDiff,
            status: 'modified'
          });
          totalModifiedQtyDiff += qtyDiff;
          totalModifiedAmtDiff += amtDiff;
        } else {
          unchangedItems.push({
            areaName: `${a.floor || ''} ${a.flat || ''} ${a.room || a.parentCategory || ''}`.trim(),
            item,
            lineTotal: signedNewTotal,
            lineAmount: signedNewAmt,
            status: 'unchanged'
          });
        }
      }
    });
  });

  const deletedItems = [];
  let totalDeductedQty = 0;
  let totalDeductedAmount = 0;

  oldItemMap.forEach((val, key) => {
    if (!matchedOldKeys.has(key)) {
      deletedItems.push({
        areaName: `${val.area.floor || ''} ${val.area.flat || ''} ${val.area.room || val.area.parentCategory || ''}`.trim(),
        item: val.item,
        lineTotal: val.lineTotal,
        lineAmount: val.lineAmount,
        status: 'deleted'
      });
      totalDeductedQty += val.lineTotal;
      totalDeductedAmount += val.lineAmount;
    }
  });

  const oldNetQty = oldTotals.totalNetQty ?? oldTotals.netQty ?? 0;
  const newNetQty = newTotals.totalNetQty ?? newTotals.netQty ?? 0;
  const oldNetAmt = oldTotals.totalNetAmount ?? oldTotals.netAmount ?? 0;
  const newNetAmt = newTotals.totalNetAmount ?? newTotals.netAmount ?? 0;

  return {
    oldTotals,
    newTotals,
    qtyVariance: newNetQty - oldNetQty,
    amountVariance: newNetAmt - oldNetAmt,
    totalAddedQty,
    totalAddedAmount,
    totalDeductedQty,
    totalDeductedAmount,
    totalModifiedQtyDiff,
    totalModifiedAmtDiff,
    addedItems,
    modifiedItems,
    deletedItems,
    unchangedItems,
    unchangedCount: unchangedItems.length
  };
}
