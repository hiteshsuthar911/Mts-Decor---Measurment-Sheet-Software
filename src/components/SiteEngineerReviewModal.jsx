import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { formatNumber } from '../utils/calculations';

export default function SiteEngineerReviewModal({
  show,
  onClose,
  projectId = 'default',
  projectData,
  onCommitQuery,
  onRejectQuery,
  onRefresh
}) {
  const [activeTab, setActiveTab] = useState('queries'); // 'queries' | 'share'
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'COMMITTED'
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const queries = Array.isArray(projectData?.engineerQueries) ? projectData.engineerQueries : [];
  const pendingCount = queries.filter(q => q.status === 'PENDING').length;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const portalUrl = `${origin}/engineer/${projectId}`;

  useEffect(() => {
    if (show && onRefresh) {
      onRefresh();
    }
  }, [show]);

  useEffect(() => {
    if (show && portalUrl) {
      QRCode.toDataURL(portalUrl, {
        width: 150,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' }
      }).then(url => setQrDataUrl(url)).catch(() => {});
    }
  }, [show, portalUrl]);

  if (!show) return null;

  const handleManualRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(portalUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleWhatsAppShare = () => {
    const text = `Hello Engineer, please review the measurement sheet for "${projectData?.header?.projectName || 'Project'}" on site and submit any queries/corrections here:\n${portalUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const filteredQueries = queries.filter(q => {
    if (statusFilter === 'ALL') return true;
    return q.status === statusFilter;
  });

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)', zIndex: 1060 }}
    >
      <div className="modal-dialog modal-dialog-centered modal-xl">
        <div className="modal-content shadow-lg border-0 rounded-4 overflow-hidden">
          {/* Header */}
          <div className="modal-header bg-dark text-white py-3 px-4">
            <div className="d-flex align-items-center gap-2">
              <div
                className="d-flex align-items-center justify-content-center rounded-3 bg-warning text-dark"
                style={{ width: '38px', height: '38px' }}
              >
                <i className="bi bi-person-badge-fill fs-5"></i>
              </div>
              <div>
                <h5 className="modal-title fw-bold mb-0">Site Engineer Review &amp; Queries</h5>
                <p className="extra-small text-white-50 mb-0">
                  Review on-site measurement corrections and commit approved updates directly into the sheet
                </p>
              </div>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-light border-bottom px-4 pt-2 d-flex justify-content-between align-items-center flex-wrap gap-2">
            <ul className="nav nav-tabs border-bottom-0">
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link fw-bold px-3 py-2 ${activeTab === 'queries' ? 'active text-primary bg-white' : 'text-secondary'}`}
                  onClick={() => setActiveTab('queries')}
                >
                  <i className="bi bi-inbox-fill me-1"></i>
                  Site Queries Inbox
                  {pendingCount > 0 && (
                    <span className="badge bg-danger ms-2 rounded-pill">{pendingCount} PENDING</span>
                  )}
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link fw-bold px-3 py-2 ${activeTab === 'share' ? 'active text-primary bg-white' : 'text-secondary'}`}
                  onClick={() => setActiveTab('share')}
                >
                  <i className="bi bi-share-fill me-1"></i>
                  Share Portal Link with Engineer
                </button>
              </li>
            </ul>

            {activeTab === 'queries' && (
              <div className="d-flex align-items-center gap-1 pb-1">
                {onRefresh && (
                  <button
                    type="button"
                    className="btn btn-xs extra-small fw-bold px-2 py-1 rounded btn-outline-primary d-flex align-items-center gap-1 me-1 shadow-sm"
                    onClick={handleManualRefresh}
                    disabled={isRefreshing}
                    title="Check for newly submitted site queries"
                  >
                    <i className={`bi bi-arrow-clockwise ${isRefreshing ? 'spin' : ''}`}></i>
                    {isRefreshing ? 'Checking...' : 'Refresh Queries'}
                  </button>
                )}
                {queries.length > 0 && (
                  <>
                    <button
                      type="button"
                      className={`btn btn-xs extra-small fw-bold px-2 py-1 rounded ${statusFilter === 'ALL' ? 'btn-dark' : 'btn-outline-secondary'}`}
                      onClick={() => setStatusFilter('ALL')}
                    >
                      All ({queries.length})
                    </button>
                    <button
                      type="button"
                      className={`btn btn-xs extra-small fw-bold px-2 py-1 rounded ${statusFilter === 'PENDING' ? 'btn-warning text-dark' : 'btn-outline-secondary'}`}
                      onClick={() => setStatusFilter('PENDING')}
                    >
                      Pending ({pendingCount})
                    </button>
                    <button
                      type="button"
                      className={`btn btn-xs extra-small fw-bold px-2 py-1 rounded ${statusFilter === 'COMMITTED' ? 'btn-success text-white' : 'btn-outline-secondary'}`}
                      onClick={() => setStatusFilter('COMMITTED')}
                    >
                      Committed ({queries.filter(q => q.status === 'COMMITTED').length})
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Modal Body */}
          <div className="modal-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            {/* ═════════════════════════════════════════════════════════
                TAB 1: INBOX OF SITE QUERIES
               ═════════════════════════════════════════════════════════ */}
            {activeTab === 'queries' && (
              <div>
                {queries.length === 0 ? (
                  <div className="text-center py-5">
                    <div className="d-inline-flex align-items-center justify-content-center bg-light text-muted rounded-circle mb-3" style={{ width: '70px', height: '70px' }}>
                      <i className="bi bi-inbox fs-2"></i>
                    </div>
                    <h6 className="fw-bold text-dark mb-1">No Site Queries Received Yet</h6>
                    <p className="text-muted extra-small mb-3" style={{ maxWidth: '400px', margin: '0 auto' }}>
                      Share the Engineer Portal link with your site engineer or supervisor. They can inspect measurements on site and send corrections here for your approval.
                    </p>
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm fw-bold px-3"
                      onClick={() => setActiveTab('share')}
                    >
                      <i className="bi bi-share me-1"></i> Get Engineer Portal Link
                    </button>
                  </div>
                ) : filteredQueries.length === 0 ? (
                  <div className="text-center py-4 text-muted small">
                    No queries found matching the selected filter.
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {filteredQueries.map((query, qIdx) => {
                      const isPending = query.status === 'PENDING';
                      const isCommitted = query.status === 'COMMITTED';
                      const isRejected = query.status === 'REJECTED';

                      return (
                        <div
                          key={query.id || qIdx}
                          className={`card border shadow-sm rounded-3 overflow-hidden ${
                            isPending ? 'border-warning' : isCommitted ? 'border-success' : 'border-secondary'
                          }`}
                        >
                          {/* Query Header */}
                          <div className={`card-header py-2 px-3 d-flex flex-wrap justify-content-between align-items-center gap-2 ${
                            isPending ? 'bg-warning-subtle' : isCommitted ? 'bg-success-subtle' : 'bg-light'
                          }`}>
                            <div className="d-flex align-items-center gap-2">
                              <span className="badge bg-dark text-white fw-bold">#{qIdx + 1}</span>
                              <span className="fw-bold text-dark">
                                {query.engineerName}
                              </span>
                              <span className="text-muted extra-small">
                                ({query.engineerRole || 'Site Engineer'}{query.phone ? ` • ${query.phone}` : ''})
                              </span>
                              <span className="text-muted extra-small">
                                &bull; {new Date(query.submittedAt).toLocaleString()}
                              </span>
                            </div>

                            <div className="d-flex align-items-center gap-2">
                              {isPending && (
                                <span className="badge bg-warning text-dark fw-bold">
                                  <i className="bi bi-clock-history me-1"></i> PENDING REVIEW
                                </span>
                              )}
                              {isCommitted && (
                                <span className="badge bg-success fw-bold">
                                  <i className="bi bi-check-circle-fill me-1"></i> COMMITTED TO SHEET
                                </span>
                              )}
                              {isRejected && (
                                <span className="badge bg-danger fw-bold">
                                  <i className="bi bi-x-circle-fill me-1"></i> REJECTED
                                </span>
                              )}

                              {isPending && onCommitQuery && (
                                <button
                                  type="button"
                                  className="btn btn-success btn-xs extra-small fw-bold px-3 py-1 shadow-sm d-flex align-items-center gap-1"
                                  onClick={() => onCommitQuery(query.id)}
                                >
                                  <i className="bi bi-check2-circle"></i>
                                  <span>Accept &amp; Commit All</span>
                                </button>
                              )}
                              {isPending && onRejectQuery && (
                                <button
                                  type="button"
                                  className="btn btn-outline-danger btn-xs extra-small px-2 py-1"
                                  onClick={() => onRejectQuery(query.id)}
                                >
                                  Reject
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Overall Note */}
                          {query.overallNote && (
                            <div className="px-3 py-2 bg-white border-bottom extra-small text-secondary">
                              <i className="bi bi-chat-left-text-fill me-1 text-primary"></i>
                              <strong>Engineer's Site Remark:</strong> {query.overallNote}
                            </div>
                          )}

                          {/* Changes Table */}
                          <div className="table-responsive">
                            <table className="table table-bordered align-middle mb-0 extra-small">
                              <thead className="table-light text-secondary text-uppercase" style={{ fontSize: '10.5px' }}>
                                <tr>
                                  <th style={{ width: '22%' }}>Area / Location</th>
                                  <th style={{ width: '20%' }}>Item Description</th>
                                  <th style={{ width: '20%' }}>Original Value</th>
                                  <th style={{ width: '20%' }}>Proposed Site Value</th>
                                  <th style={{ width: '18%' }}>Reason / Site Note</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(query.changes || []).map((change, cIdx) => (
                                  <tr key={cIdx} className={change.status === 'COMMITTED' ? 'table-success' : ''}>
                                    <td className="fw-bold text-dark">{change.areaLabel || 'Area'}</td>
                                    <td>
                                      <div className="fw-semibold">{change.itemRemark || 'Line Item'}</div>
                                    </td>
                                    <td>
                                      <div className="text-muted">
                                        Qty: <strong>{change.original?.quantity || '—'}</strong> &bull; L: <strong>{change.original?.length || '—'}</strong> &bull; H: <strong>{change.original?.height || '—'}</strong>
                                        {change.original?.isLess && <span className="badge bg-danger ms-1">LESS</span>}
                                      </div>
                                    </td>
                                    <td className="table-warning">
                                      <div className="text-primary fw-bold">
                                        Qty: {change.proposed?.quantity || '—'} &bull; L: {change.proposed?.length || '—'} &bull; H: {change.proposed?.height || '—'}
                                        {change.proposed?.isLess && <span className="badge bg-danger ms-1">LESS</span>}
                                        {change.proposed?.remark && change.proposed.remark !== change.itemRemark && (
                                          <div className="extra-small text-dark font-monospace mt-0.5">
                                            &ldquo;{change.proposed.remark}&rdquo;
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                    <td className="fst-italic text-secondary">
                                      {change.reason || '—'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════
                TAB 2: SHARE PORTAL LINK WITH ENGINEER
               ═════════════════════════════════════════════════════════ */}
            {activeTab === 'share' && (
              <div className="p-3">
                <div className="row g-4 align-items-center">
                  <div className="col-12 col-md-7">
                    <h6 className="fw-bold text-dark mb-2">
                      <i className="bi bi-qr-code me-2 text-primary"></i>
                      Instant On-Site Review Link
                    </h6>
                    <p className="text-muted small mb-3">
                      Share this link with your site engineer or supervisor. They can open it on their mobile phone or tablet on site, verify room measurements, and submit queries directly to this dashboard.
                    </p>

                    <label className="form-label extra-small text-muted fw-bold text-uppercase mb-1">
                      Site Engineer Portal URL:
                    </label>
                    <div className="input-group mb-3">
                      <input
                        type="text"
                        readOnly
                        className="form-control form-control-sm bg-white font-monospace"
                        value={portalUrl}
                      />
                      <button
                        type="button"
                        className={`btn btn-sm ${copied ? 'btn-success' : 'btn-outline-primary'} fw-bold px-3`}
                        onClick={handleCopyLink}
                      >
                        {copied ? <><i className="bi bi-check2"></i> Copied!</> : <><i className="bi bi-clipboard"></i> Copy Link</>}
                      </button>
                    </div>

                    <div className="d-flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn btn-success btn-sm fw-bold px-3 d-flex align-items-center gap-1 shadow-sm"
                        onClick={handleWhatsAppShare}
                      >
                        <i className="bi bi-whatsapp"></i> Share on WhatsApp
                      </button>

                      <a
                        href={portalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-outline-dark btn-sm fw-semibold d-flex align-items-center gap-1"
                      >
                        <i className="bi bi-box-arrow-up-right"></i> Open Portal Preview
                      </a>
                    </div>
                  </div>

                  <div className="col-12 col-md-5 text-center">
                    <div className="p-3 bg-light rounded-4 border d-inline-block shadow-sm">
                      {qrDataUrl ? (
                        <img
                          src={qrDataUrl}
                          alt="QR Code"
                          className="img-fluid rounded border mb-2"
                          style={{ maxWidth: '160px', width: '100%' }}
                        />
                      ) : (
                        <div style={{ width: '160px', height: '160px' }} className="d-flex align-items-center justify-content-center text-muted">
                          Generating QR...
                        </div>
                      )}
                      <div className="extra-small fw-bold text-uppercase text-secondary">
                        Scan with Mobile Camera on Site
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer bg-light py-3 px-4 border-top">
            <button type="button" className="btn btn-sm btn-secondary fw-bold px-3" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
