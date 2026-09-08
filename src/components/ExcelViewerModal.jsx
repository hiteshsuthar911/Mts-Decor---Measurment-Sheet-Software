import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { getExcelFile, downloadExcelFromBase64 } from '../utils/storage';

export default function ExcelViewerModal({ fileId, initialFile, onClose }) {
  const [loading, setLoading] = useState(!initialFile);
  const [error, setError] = useState('');
  const [fileData, setFileData] = useState(initialFile || null);
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCell, setSelectedCell] = useState({ r: 0, c: 0, val: '' });

  // Load file details if fileId provided
  useEffect(() => {
    if (initialFile) {
      setFileData(initialFile);
      setLoading(false);
      return;
    }
    if (!fileId) return;

    let isMounted = true;
    const fetchFile = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getExcelFile(fileId);
        if (isMounted) {
          // If sheetsData isn't present or empty, parse from fileBase64
          if ((!data.sheetsData || data.sheetsData.length === 0) && data.fileBase64) {
            const wb = XLSX.read(data.fileBase64, { type: 'base64' });
            data.sheetsData = wb.SheetNames.map(name => ({
              sheetName: name,
              rows: XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: '' })
            }));
          }
          setFileData(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'FAILED TO LOAD EXCEL FILE');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchFile();
    return () => { isMounted = false; };
  }, [fileId, initialFile]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Sheets data array
  const sheets = useMemo(() => {
    if (!fileData?.sheetsData || !Array.isArray(fileData.sheetsData)) return [];
    return fileData.sheetsData;
  }, [fileData]);

  const currentSheet = sheets[activeSheetIndex] || { sheetName: 'Sheet1', rows: [] };
  const rows = currentSheet.rows || [];

  // Calculate max columns
  const maxCols = useMemo(() => {
    let max = 0;
    rows.forEach(r => {
      if (Array.isArray(r) && r.length > max) max = r.length;
    });
    return Math.max(max, 8);
  }, [rows]);

  // Excel column letters helper (0 -> A, 25 -> Z, 26 -> AA)
  const getColLetter = (colIdx) => {
    let letter = '';
    let temp = colIdx;
    while (temp >= 0) {
      letter = String.fromCharCode((temp % 26) + 65) + letter;
      temp = Math.floor(temp / 26) - 1;
    }
    return letter;
  };

  const handleDownload = () => {
    if (!fileData) return;
    if (fileData.fileBase64) {
      downloadExcelFromBase64(fileData.fileName, fileData.fileBase64);
    } else if (sheets.length > 0) {
      // Re-synthesize workbook
      const wb = XLSX.utils.book_new();
      sheets.forEach(s => {
        const ws = XLSX.utils.aoa_to_sheet(s.rows);
        XLSX.utils.book_append_sheet(wb, ws, s.sheetName);
      });
      XLSX.writeFile(wb, fileData.fileName || 'Spreadsheet.xlsx');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isNumeric = (val) => {
    if (val === null || val === undefined || val === '') return false;
    return !isNaN(Number(val));
  };

  return (
    <div
      className="excel-viewer-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(10, 16, 32, 0.85)',
        backdropFilter: 'blur(6px)',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── TOP HEADER / TOOLBAR ── */}
      <div
        style={{
          backgroundColor: '#0d1526',
          borderBottom: '1px solid #1e293b',
          color: '#f8fafc',
          padding: '10px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              backgroundColor: '#107c41',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(16, 124, 65, 0.4)',
            }}
          >
            <i className="bi bi-file-earmark-excel-fill text-white fs-5"></i>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 800, fontSize: '15px', letterSpacing: '0.5px' }}>
                {fileData?.fileName || 'EXCEL SPREADSHEET'}
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  backgroundColor: '#1e293b',
                  color: '#38bdf8',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  textTransform: 'uppercase',
                }}
              >
                {fileData?.projectName || 'ONLINE VIEWER'}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              {sheets.length} SHEET{sheets.length !== 1 ? 'S' : ''} &bull; {rows.length} ROWS &bull; {maxCols} COLUMNS
              {fileData?.ownerName ? ` • CREATED BY ${fileData.ownerName.toUpperCase()}` : ''}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Search bar inside sheet */}
          <div style={{ position: 'relative', width: '220px' }}>
            <i
              className="bi bi-search"
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748b',
                fontSize: '12px',
              }}
            ></i>
            <input
              type="text"
              placeholder="SEARCH IN SHEET..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '6px',
                padding: '5px 10px 5px 30px',
                fontSize: '11px',
                color: '#f8fafc',
                outline: 'none',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={handleDownload}
            className="btn btn-sm"
            style={{
              backgroundColor: '#107c41',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '11px',
              padding: '6px 14px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: 'none',
              boxShadow: '0 2px 6px rgba(16, 124, 65, 0.3)',
            }}
          >
            <i className="bi bi-download"></i>
            <span>DOWNLOAD .XLSX</span>
          </button>

          <button
            onClick={handlePrint}
            className="btn btn-sm btn-outline-secondary d-none d-sm-flex align-items-center gap-1"
            style={{
              color: '#cbd5e1',
              borderColor: '#334155',
              fontSize: '11px',
              fontWeight: 600,
              padding: '6px 12px',
            }}
            title="Print Current Sheet"
          >
            <i className="bi bi-printer"></i>
            <span>PRINT</span>
          </button>

          <button
            onClick={onClose}
            className="btn btn-sm"
            style={{
              backgroundColor: '#334155',
              color: '#f8fafc',
              fontWeight: 700,
              borderRadius: '6px',
              padding: '6px 12px',
              border: 'none',
            }}
            title="Close Excel Viewer (Esc)"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
      </div>

      {/* ── FORMULA / CELL SELECTION BAR ── */}
      <div
        style={{
          backgroundColor: '#0a1020',
          borderBottom: '1px solid #1e293b',
          color: '#cbd5e1',
          padding: '6px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '12px',
          fontFamily: 'monospace',
        }}
      >
        <div
          style={{
            backgroundColor: '#1e293b',
            padding: '3px 10px',
            borderRadius: '4px',
            fontWeight: 700,
            color: '#38bdf8',
            minWidth: '55px',
            textAlign: 'center',
          }}
        >
          {getColLetter(selectedCell.c)}{selectedCell.r + 1}
        </div>
        <div
          style={{
            color: '#64748b',
            borderRight: '1px solid #334155',
            paddingRight: '10px',
            fontWeight: 'bold',
          }}
        >
          fx
        </div>
        <div
          style={{
            flexGrow: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: '#f1f5f9',
          }}
        >
          {String(selectedCell.val ?? '')}
        </div>
      </div>

      {/* ── MAIN CONTENT SPREADSHEET GRID ── */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          backgroundColor: '#ffffff',
          position: 'relative',
        }}
      >
        {loading && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: '12px',
            }}
          >
            <div className="spinner-border text-success" role="status"></div>
            <div style={{ color: '#475569', fontWeight: 600, fontSize: '13px' }}>
              PARSING EXCEL WORKBOOK...
            </div>
          </div>
        )}

        {error && (
          <div style={{ padding: '30px', textAlign: 'center' }}>
            <div className="alert alert-danger d-inline-block text-uppercase fw-bold">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {error}
            </div>
          </div>
        )}

        {!loading && !error && rows.length === 0 && (
          <div style={{ padding: '50px', textAlign: 'center', color: '#64748b' }}>
            <i className="bi bi-file-earmark-x fs-1 mb-2 d-block"></i>
            <div style={{ fontWeight: 700 }}>THIS SHEET IS EMPTY</div>
          </div>
        )}

        {!loading && !error && rows.length > 0 && (
          <table
            className="table table-bordered m-0"
            style={{
              borderCollapse: 'collapse',
              fontSize: '12px',
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
              width: 'max-content',
              minWidth: '100%',
            }}
          >
            {/* Header Column Letters (A, B, C...) */}
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                <th
                  style={{
                    width: '46px',
                    minWidth: '46px',
                    textAlign: 'center',
                    backgroundColor: '#e2e8f0',
                    border: '1px solid #cbd5e1',
                    padding: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  #
                </th>
                {Array.from({ length: maxCols }).map((_, cIdx) => (
                  <th
                    key={cIdx}
                    style={{
                      minWidth: cIdx === 1 ? '240px' : cIdx === 2 ? '180px' : '90px',
                      textAlign: 'center',
                      backgroundColor: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      padding: '5px 8px',
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.5px',
                    }}
                  >
                    {getColLetter(cIdx)}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((row, rIdx) => {
                const rowStr = Array.isArray(row) ? row.join(' ').toUpperCase() : '';
                const isMatch = searchQuery && rowStr.includes(searchQuery.toUpperCase());
                const isGrandTotal = rowStr.includes('GRAND TOTAL') || rowStr.includes('FINAL PAYABLE');
                const isSubTotal = rowStr.includes('TOTAL') && !isGrandTotal;
                const isSectionHeader = Array.isArray(row) && row[1] && String(row[1]).startsWith('[');

                return (
                  <tr
                    key={rIdx}
                    style={{
                      backgroundColor: isMatch
                        ? '#fef08a'
                        : isGrandTotal
                        ? '#dcfce7'
                        : isSubTotal
                        ? '#f8fafc'
                        : isSectionHeader
                        ? '#eff6ff'
                        : rIdx % 2 === 1
                        ? '#fcfcfd'
                        : '#ffffff',
                      fontWeight: isGrandTotal || isSubTotal || isSectionHeader ? 700 : 400,
                    }}
                  >
                    {/* Row Number */}
                    <td
                      style={{
                        textAlign: 'center',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        color: '#64748b',
                        padding: '4px 6px',
                        fontSize: '10px',
                        fontWeight: 600,
                        userSelect: 'none',
                      }}
                    >
                      {rIdx + 1}
                    </td>

                    {/* Columns */}
                    {Array.from({ length: maxCols }).map((_, cIdx) => {
                      const cellVal = Array.isArray(row) ? row[cIdx] : '';
                      const isSelected = selectedCell.r === rIdx && selectedCell.c === cIdx;
                      const numVal = isNumeric(cellVal);

                      return (
                        <td
                          key={cIdx}
                          onClick={() => setSelectedCell({ r: rIdx, c: cIdx, val: cellVal })}
                          style={{
                            border: isSelected ? '2px solid #107c41' : '1px solid #e2e8f0',
                            padding: '6px 10px',
                            textAlign: numVal ? 'right' : 'left',
                            whiteSpace: 'nowrap',
                            color: isGrandTotal ? '#14532d' : isSectionHeader ? '#1e3a8a' : '#0f172a',
                            fontFamily: numVal ? 'monospace' : 'inherit',
                            cursor: 'cell',
                            backgroundColor: isSelected ? '#ecfdf5' : 'transparent',
                          }}
                        >
                          {cellVal !== undefined && cellVal !== null ? String(cellVal) : ''}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── BOTTOM SHEET TABS (Excel style tabs) ── */}
      <div
        style={{
          backgroundColor: '#0d1526',
          borderTop: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          padding: '4px 16px',
          overflowX: 'auto',
          gap: '6px',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            color: '#64748b',
            fontWeight: 700,
            marginRight: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <i className="bi bi-layers"></i> SHEETS:
        </span>

        {sheets.map((sheet, idx) => {
          const isActive = idx === activeSheetIndex;
          return (
            <button
              key={idx}
              onClick={() => {
                setActiveSheetIndex(idx);
                setSelectedCell({ r: 0, c: 0, val: sheet.rows?.[0]?.[0] || '' });
              }}
              style={{
                backgroundColor: isActive ? '#107c41' : '#1e293b',
                color: isActive ? '#ffffff' : '#94a3b8',
                border: 'none',
                borderRadius: '6px 6px 0 0',
                padding: '6px 16px',
                fontSize: '12px',
                fontWeight: isActive ? 700 : 500,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: isActive ? '0 -2px 6px rgba(16, 124, 65, 0.4)' : 'none',
              }}
            >
              <i className={`bi ${isActive ? 'bi-file-spreadsheet-fill' : 'bi-file-spreadsheet'}`}></i>
              <span>{sheet.sheetName || `Sheet ${idx + 1}`}</span>
              <span
                style={{
                  fontSize: '9px',
                  backgroundColor: isActive ? 'rgba(0,0,0,0.25)' : '#334155',
                  padding: '1px 5px',
                  borderRadius: '10px',
                  marginLeft: '4px',
                }}
              >
                {sheet.rows?.length || 0}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
