import React, { useState, useEffect, useMemo } from 'react';
import { getPdfFile, downloadPdfFromBase64 } from '../utils/storage';
import AppLoader from './AppLoader';

export default function PdfViewerModal({ fileId, initialFile, onClose }) {
  const [loading, setLoading] = useState(!initialFile);
  const [error, setError] = useState('');
  const [fileData, setFileData] = useState(initialFile || null);

  // Load PDF file details if fileId provided
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
        const data = await getPdfFile(fileId);
        if (isMounted) {
          setFileData(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'FAILED TO LOAD PDF DOCUMENT');
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

  // Generate blob URL from base64 string
  const pdfBlobUrl = useMemo(() => {
    if (!fileData?.fileBase64) return null;
    try {
      const cleanBase64 = fileData.fileBase64.replace(/^data:application\/pdf;base64,/, '');
      const byteCharacters = atob(cleanBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      return URL.createObjectURL(blob);
    } catch (err) {
      console.error('Failed to create PDF blob URL:', err);
      return null;
    }
  }, [fileData?.fileBase64]);

  // Revoke object URL on unmount
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  const handleDownload = () => {
    if (!fileData) return;
    downloadPdfFromBase64(fileData.fileName || 'measurement-sheet.pdf', fileData.fileBase64);
  };

  const handlePrint = () => {
    if (!pdfBlobUrl) return;
    const printWindow = window.open(pdfBlobUrl);
    if (printWindow) {
      printWindow.focus();
    }
  };

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column"
      style={{
        zIndex: 1060,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(4px)',
      }}
    >
      {/* ── MODAL HEADER ── */}
      <div
        className="d-flex justify-content-between align-items-center px-3 py-2 bg-dark text-white border-bottom border-secondary"
        style={{ flexShrink: 0 }}
      >
        <div className="d-flex align-items-center gap-2 overflow-hidden">
          <div className="bg-danger text-white rounded p-1 d-flex align-items-center justify-content-center shadow-xs" style={{ width: '32px', height: '32px' }}>
            <i className="bi bi-file-earmark-pdf-fill fs-5"></i>
          </div>
          <div className="text-truncate">
            <h6 className="mb-0 fw-bold text-uppercase text-white text-truncate" style={{ fontSize: '0.95rem' }}>
              {fileData?.fileName || 'PDF DOCUMENT PREVIEW'}
            </h6>
            <div className="d-flex align-items-center gap-2 extra-small text-white-50 text-uppercase">
              <span>{fileData?.projectName || 'MEASUREMENT SHEET'}</span>
              {fileData?.pageCount && (
                <>
                  <span>•</span>
                  <span>{fileData.pageCount} PAGE{fileData.pageCount > 1 ? 'S' : ''}</span>
                </>
              )}
              {fileData?.fileSize && (
                <>
                  <span>•</span>
                  <span>{(fileData.fileSize / 1024).toFixed(1)} KB</span>
                </>
              )}
              {fileData?.createdAt && (
                <>
                  <span>•</span>
                  <span>{new Date(fileData.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          {pdfBlobUrl && (
            <>
              <button
                type="button"
                className="btn btn-outline-light btn-sm fw-bold text-uppercase d-flex align-items-center gap-1 shadow-xs"
                onClick={handlePrint}
                title="Print Document"
              >
                <i className="bi bi-printer-fill"></i>
                <span className="d-none d-sm-inline">PRINT</span>
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm fw-bold text-uppercase d-flex align-items-center gap-1 shadow-xs"
                onClick={handleDownload}
                title="Download PDF"
              >
                <i className="bi bi-download"></i>
                <span className="d-none d-sm-inline">DOWNLOAD PDF</span>
              </button>
            </>
          )}

          <button
            type="button"
            className="btn btn-secondary btn-sm fw-bold text-uppercase shadow-xs"
            onClick={onClose}
            aria-label="Close"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
      </div>

      {/* ── MODAL BODY ── */}
      <div className="flex-grow-1 position-relative bg-secondary-subtle d-flex flex-column">
        {loading && (
          <div className="d-flex flex-column align-items-center justify-content-center h-100 p-4">
            <AppLoader text="LOADING PDF DOCUMENT..." subtext="PREPARING HIGH RESOLUTION PREVIEW" />
          </div>
        )}

        {error && (
          <div className="d-flex flex-column align-items-center justify-content-center h-100 p-4 text-center">
            <div className="display-1 text-danger mb-3">⚠️</div>
            <h5 className="fw-bold text-uppercase text-dark mb-2">COULD NOT LOAD PDF</h5>
            <p className="text-muted small mb-4">{error}</p>
            <button className="btn btn-dark btn-sm fw-bold text-uppercase px-4" onClick={onClose}>
              CLOSE
            </button>
          </div>
        )}

        {!loading && !error && pdfBlobUrl && (
          <iframe
            src={`${pdfBlobUrl}#toolbar=1&navpanes=0`}
            title={fileData?.fileName || 'PDF Preview'}
            className="w-100 h-100 border-0"
            style={{ minHeight: '100%' }}
          />
        )}

        {!loading && !error && !pdfBlobUrl && (
          <div className="d-flex flex-column align-items-center justify-content-center h-100 p-4 text-center">
            <div className="display-1 text-warning mb-3">📄</div>
            <h5 className="fw-bold text-uppercase text-dark mb-2">PREVIEW UNAVAILABLE</h5>
            <p className="text-muted small mb-3">The PDF binary content could not be displayed in-browser.</p>
            {fileData?.fileBase64 && (
              <button className="btn btn-danger btn-sm fw-bold text-uppercase px-4" onClick={handleDownload}>
                <i className="bi bi-download me-2"></i> DOWNLOAD FILE DIRECTLY
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
