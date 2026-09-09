import React, { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';

export default function ClientApprovalModal({
  show,
  onClose,
  approvalData,
  projectId = 'default',
  projectData,
  onSaveApproval,
  onRevokeApproval,
  onUpdatePin
}) {
  const [activeTab, setActiveTab] = useState('link'); // 'link' | 'sign'
  const [signerName, setSignerName] = useState('');
  const [company, setCompany] = useState('');
  const [designation, setDesignation] = useState('Client Representative');
  const [approvalDate, setApprovalDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Link & Passcode states
  const [enablePin, setEnablePin] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');

  const canvasRef = useRef(null);

  const defaultPin = String(projectId).slice(-4).toUpperCase();

  useEffect(() => {
    if (show) {
      const existingPin = projectData?.signPortalPin || '';
      setPinCode(existingPin || defaultPin);
      setEnablePin(true);

      if (approvalData?.approved) {
        setSignerName(approvalData.signerName || '');
        setCompany(approvalData.company || '');
        setDesignation(approvalData.designation || 'Client Representative');
        setApprovalDate(approvalData.signedAt ? approvalData.signedAt.split('T')[0] : new Date().toISOString().split('T')[0]);
        setNotes(approvalData.notes || '');
        setHasSignature(!!approvalData.signatureDataUrl);
      } else {
        setSignerName('');
        setCompany('');
        setDesignation('Client Representative');
        setApprovalDate(new Date().toISOString().split('T')[0]);
        setNotes('');
        setHasSignature(false);
      }
    }
  }, [show, approvalData, projectData, projectId, defaultPin]);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const portalUrl = `${origin}/sign/${projectId}`;
  const effectivePin = (enablePin && pinCode.trim()) || defaultPin;
  const protectedUrl = `${portalUrl}?pin=${encodeURIComponent(effectivePin)}`;

  // Generate QR code for mobile scanning
  useEffect(() => {
    if (show && portalUrl) {
      QRCode.toDataURL(protectedUrl, {
        width: 150,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' }
      }).then(url => setQrDataUrl(url)).catch(() => {});
    }
  }, [show, protectedUrl]);

  // Set up canvas when modal opens
  useEffect(() => {
    if (show && activeTab === 'sign' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#1e3a8a'; // Navy blue ink
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (approvalData?.signatureDataUrl) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        };
        img.src = approvalData.signatureDataUrl;
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [show, activeTab, approvalData]);

  if (!show) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(portalUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleSavePinSettings = () => {
    const finalPin = (enablePin && pinCode.trim()) || defaultPin;
    if (onUpdatePin) {
      onUpdatePin(finalPin);
    }
    alert(`Passcode PIN set to "${finalPin}". Link is protected against unauthorized access.`);
  };

  const projectName = projectData?.header?.projectName || 'Measurement Sheet';
  const whatsappText = encodeURIComponent(
    `Hello, please find the measurement sheet for "${projectName}" ready for your digital review and sign-off:\n${portalUrl}\n\nSecurity Access PIN: ${effectivePin}\n(Passcode required to open)`
  );

  // Drawing handlers
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const startDrawing = (e) => {
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHasSignature(false);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!signerName.trim()) {
      alert('Please enter the client / authority name.');
      return;
    }

    let signatureDataUrl = null;
    if (canvasRef.current && hasSignature) {
      signatureDataUrl = canvasRef.current.toDataURL('image/png');
    }

    onSaveApproval({
      approved: true,
      signerName: signerName.trim(),
      company: company.trim(),
      designation: designation.trim(),
      signedAt: new Date().toISOString(),
      approvalDate,
      notes: notes.trim(),
      signatureDataUrl
    });
    onClose();
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content shadow-lg border-0 rounded-3 overflow-hidden">
          {/* Header */}
          <div className="modal-header bg-dark text-white py-3 px-4">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-shield-check fs-4 text-success"></i>
              <div>
                <h5 className="modal-title fw-bold mb-0">Client Approval &amp; Digital Sign-Off</h5>
                <small className="text-secondary">Instant mobile sign-off link &amp; digital engineering stamp</small>
              </div>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-light border-bottom px-4 pt-2">
            <ul className="nav nav-tabs border-0">
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link fw-bold ${activeTab === 'link' ? 'active text-primary border-bottom-0' : 'text-secondary'}`}
                  onClick={() => setActiveTab('link')}
                >
                  <i className="bi bi-link-45deg me-1"></i> 1. Digital Sign-Off Link (Mobile / Tablet)
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link fw-bold ${activeTab === 'sign' ? 'active text-primary border-bottom-0' : 'text-secondary'}`}
                  onClick={() => setActiveTab('sign')}
                >
                  <i className="bi bi-pen me-1"></i> 2. Direct On-Screen Sign-Off
                </button>
              </li>
            </ul>
          </div>

          <div className="modal-body p-4">
            {/* If sheet is already approved */}
            {approvalData?.approved && (
              <div className="alert alert-success d-flex align-items-center justify-content-between p-3 mb-4 rounded-3 shadow-sm">
                <div>
                  <div className="fw-bold d-flex align-items-center gap-2">
                    <i className="bi bi-patch-check-fill text-success fs-5"></i>
                    <span>Officially Approved &amp; Sealed</span>
                  </div>
                  <small className="text-muted">
                    Signed by <strong>{approvalData.signerName}</strong> ({approvalData.designation}) on{' '}
                    {new Date(approvalData.signedAt || approvalData.approvalDate).toLocaleString()}
                  </small>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => {
                    if (confirm('Revoke this digital approval stamp?')) {
                      onRevokeApproval();
                    }
                  }}
                >
                  Revoke Stamp
                </button>
              </div>
            )}

            {/* ══════════════════════════════════════════════════
                TAB 1: DIGITAL CLIENT SIGN-OFF LINK
            ══════════════════════════════════════════════════ */}
            {activeTab === 'link' && (
              <div>
                <div className="row g-4 align-items-center mb-4">
                  <div className="col-12 col-md-7">
                    <h6 className="fw-bold text-dark mb-1">
                      <i className="bi bi-phone me-1 text-primary"></i> Share with Client / Architect
                    </h6>
                    <p className="text-muted small mb-3">
                      Send this link to the client or architect to review measured items and sign directly on their smartphone or tablet. No paper exchange or app install needed.
                    </p>

                    {/* URL Box */}
                    <div className="input-group mb-3">
                      <input
                        type="text"
                        readOnly
                        className="form-control font-monospace small bg-light"
                        value={portalUrl}
                      />
                      <button
                        type="button"
                        className={`btn ${copied ? 'btn-success' : 'btn-primary'} fw-bold px-3`}
                        onClick={handleCopyLink}
                      >
                        <i className={`bi ${copied ? 'bi-check-lg' : 'bi-clipboard'} me-1`}></i>
                        {copied ? 'Copied!' : 'Copy Link'}
                      </button>
                    </div>

                    {/* Sharing Shortcuts */}
                    <div className="d-flex flex-wrap gap-2 mb-3">
                      <a
                        href={`https://wa.me/?text=${whatsappText}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-sm btn-success fw-bold d-inline-flex align-items-center gap-1 shadow-sm"
                      >
                        <i className="bi bi-whatsapp"></i> Share on WhatsApp
                      </a>
                      <a
                        href={`mailto:?subject=${encodeURIComponent(`Measurement Sheet for ${projectName}`)}&body=${whatsappText}`}
                        className="btn btn-sm btn-outline-secondary fw-bold d-inline-flex align-items-center gap-1"
                      >
                        <i className="bi bi-envelope"></i> Email Link
                      </a>
                      <a
                        href={portalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-sm btn-outline-primary fw-bold d-inline-flex align-items-center gap-1"
                      >
                        <i className="bi bi-box-arrow-up-right"></i> Open Portal Preview
                      </a>
                    </div>
                  </div>

                  {/* QR Code for scanning on site */}
                  <div className="col-12 col-md-5 text-center">
                    <div className="p-3 bg-light rounded-3 border d-inline-block shadow-sm">
                      {qrDataUrl ? (
                        <img
                          src={qrDataUrl}
                          alt="Scan to Sign QR"
                          style={{ width: '130px', height: '130px', borderRadius: '4px' }}
                        />
                      ) : (
                        <div style={{ width: '130px', height: '130px' }} className="d-flex align-items-center justify-content-center">
                          <span className="spinner-border spinner-border-sm text-primary"></span>
                        </div>
                      )}
                      <div className="fw-bold text-dark extra-small mt-2 text-uppercase">
                        Scan with Mobile to Sign
                      </div>
                      <small className="text-muted extra-small d-block">Instant sign-off on site</small>
                    </div>
                  </div>
                </div>

                {/* Password / PIN Protection Card */}
                <div className="card bg-light border p-3 rounded-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="form-check form-switch mb-0">
                      <input
                        className="form-check-input cursor-pointer"
                        type="checkbox"
                        role="switch"
                        id="enablePinSwitch"
                        checked={enablePin}
                        onChange={(e) => setEnablePin(e.target.checked)}
                      />
                      <label className="form-check-label fw-bold text-dark small cursor-pointer ms-1" htmlFor="enablePinSwitch">
                        <i className="bi bi-key-fill text-warning me-1"></i> Require Access PIN / Password to Open Link
                      </label>
                    </div>
                  </div>
                  <p className="text-muted extra-small mb-2">
                    When enabled, the client must enter this secret PIN before reviewing or signing the sheet.
                  </p>

                  {enablePin && (
                    <div className="row g-2 align-items-center mt-1">
                      <div className="col-6 col-sm-4">
                        <input
                          type="text"
                          className="form-control form-control-sm fw-bold font-monospace text-center"
                          placeholder="e.g. 1234"
                          value={pinCode}
                          onChange={(e) => setPinCode(e.target.value)}
                          maxLength={10}
                        />
                      </div>
                      <div className="col-6 col-sm-4">
                        <button
                          type="button"
                          className="btn btn-sm btn-dark w-100 fw-semibold"
                          onClick={handleSavePinSettings}
                        >
                          Save PIN
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════
                TAB 2: DIRECT ON-SCREEN SIGN-OFF
            ══════════════════════════════════════════════════ */}
            {activeTab === 'sign' && (
              <form onSubmit={handleSave}>
                <div className="row g-3">
                  {/* Signer Name */}
                  <div className="col-12 col-md-7">
                    <label className="form-label small fw-bold text-secondary mb-1">
                      Approver / Signer Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Mr. Rajesh Sharma / Ar. Sneha Patel"
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                      required
                    />
                  </div>

                  {/* Date */}
                  <div className="col-12 col-md-5">
                    <label className="form-label small fw-bold text-secondary mb-1">Approval Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={approvalDate}
                      onChange={(e) => setApprovalDate(e.target.value)}
                    />
                  </div>

                  {/* Designation */}
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-bold text-secondary mb-1">Designation</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. Client / Project Manager / PMC / Architect"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                    />
                  </div>

                  {/* Company / Firm */}
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-bold text-secondary mb-1">Company / Firm Name</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. Skyline Developers Ltd."
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                    />
                  </div>

                  {/* Digital Signature Pad */}
                  <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label small fw-bold text-secondary mb-0">
                        Digital Signature Pad
                      </label>
                      <button
                        type="button"
                        className="btn btn-link btn-sm text-danger p-0 extra-small text-decoration-none"
                        onClick={clearCanvas}
                      >
                        <i className="bi bi-eraser me-1"></i>Clear Pad
                      </button>
                    </div>
                    <div className="border rounded bg-white p-1 text-center" style={{ touchAction: 'none' }}>
                      <canvas
                        ref={canvasRef}
                        width={440}
                        height={120}
                        className="w-100"
                        style={{ cursor: 'crosshair', display: 'block', backgroundColor: '#fcfcfd' }}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                      />
                    </div>
                    <small className="text-muted extra-small d-block mt-1">
                      Sign using touch screen, stylus, or mouse pointer.
                    </small>
                  </div>

                  {/* Remarks */}
                  <div className="col-12">
                    <label className="form-label small fw-bold text-secondary mb-1">Remarks / Conditions</label>
                    <textarea
                      rows={2}
                      className="form-control form-control-sm"
                      placeholder="e.g. Verified on site. Deductions checked against architectural drawings."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mt-4 pt-2 text-end border-top">
                  <button type="submit" className="btn btn-success fw-bold px-4 shadow-sm">
                    <i className="bi bi-shield-fill-check me-1"></i>
                    <span>{approvalData?.approved ? 'Update Sign-Off' : 'Approve & Seal Sheet'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Modal Footer */}
          <div className="modal-footer bg-light py-2 px-4">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
