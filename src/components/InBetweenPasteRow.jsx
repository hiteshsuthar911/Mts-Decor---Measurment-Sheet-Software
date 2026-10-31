import React from 'react';

/**
 * InBetweenPasteRow: An interactive, zero-height hover guideline (Excel / Notion style)
 * that appears between any two rows.
 *
 * When clipboard has items:
 *   ─── [ 📋 Paste X items here ] ───
 *
 * When clipboard is empty:
 *   ─── [ + Insert row here ] ───
 */
export default function InBetweenPasteRow({
  insertIndex = 0,
  colSpan = 9,
  clipboardCount = 0,
  onPaste,
  onInsertBlank,
  disabled = false,
}) {
  if (disabled) return null;

  return (
    <tr className={`xls-inbetween-row ${clipboardCount > 0 ? 'has-clipboard' : ''}`}>
      <td colSpan={colSpan}>
        <div className="xls-inbetween-wrap">
          <div
            className="xls-inbetween-hitbox"
            onClick={(e) => {
              e.stopPropagation();
              if (clipboardCount > 0 && onPaste) {
                onPaste(insertIndex);
              } else if (onInsertBlank) {
                onInsertBlank(insertIndex);
              }
            }}
          >
            <div className="xls-inbetween-line" />
            {clipboardCount > 0 ? (
              <button
                type="button"
                className="xls-inbetween-pill xls-inbetween-pill--paste"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onPaste) onPaste(insertIndex);
                }}
                title={`Click to paste ${clipboardCount} item${clipboardCount > 1 ? 's' : ''} here (in-between row ${insertIndex} and ${insertIndex + 1})`}
              >
                <i className="bi bi-clipboard-check me-1" />
                <span>Paste {clipboardCount} item{clipboardCount > 1 ? 's' : ''} here</span>
              </button>
            ) : (
              <button
                type="button"
                className="xls-inbetween-pill xls-inbetween-pill--add"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onInsertBlank) onInsertBlank(insertIndex);
                }}
                title="Click to insert a new blank measurement row here"
              >
                <i className="bi bi-plus-lg me-1" />
                <span>Insert row here</span>
              </button>
            )}
            <div className="xls-inbetween-line" />
          </div>
        </div>
      </td>
    </tr>
  );
}

