import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import PrintSheetView from '../components/PrintSheetView';

export default function ClientSignPortal() {
  const { projectId } = useParams();
  const [searchParams] = useSearchParams();
  const initialPin = searchParams.get('pin') || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requiresPin, setRequiresPin] = useState(false);
  const [pinInput, setPinInput] = useState(initialPin);
  const [pinError, setPinError] = useState('');
  const [currentPin, setCurrentPin] = useState(initialPin);
  const [project, setProject] = useState(null);

  // Digital Sign Modal
  const [showSignModal, setShowSignModal] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [designation, setDesignation] = useState('Client Representative');
  const [company, setCompany] = useState('');
  const [notes, setNotes] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Signature canvas
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);

  const fetchPortalData = async (pinToUse = '') => {
    try {
      setLoading(true);
      setError('');
      setPinError('');

      const cleanPin = pinToUse.trim();
      const url = `/api/projects/sign-portal/${projectId}${cleanPin ? `?pin=${encodeURIComponent(cleanPin)}` : ''}`;
      const res = await fetch(url, {
        headers: cleanPin ? { 'x-portal-pin': cleanPin } : {}
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Unable to load measurement sheet');
      }

      if (data.requiresPin) {
        setRequiresPin(true);
        if (cleanPin) {
          setPinError('Invalid Passcode / PIN. Please re-enter.');
        }
      } else {
        setRequiresPin(false);
        setCurrentPin(cleanPin);
        setProject(data);
      }
    } catch (err) {
      console.error('Portal fetch error:', err);
      setError(err.message || 'Failed to load measurement sheet.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData(initialPin);
  }, [projectId]);

  // Set up canvas when sign modal opens
  useEffect(() => {
    if (showSignModal && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#1e3a8a'; // Navy Blue Ink
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, [showSignModal]);

  const handleUnlockPin = (e) => {
    e.preventDefault();
    if (!pinInput.trim()) return;
    fetchPortalData(pinInput.trim());
  };

  // Canvas drawing handlers
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
    setHasDrawnSignature(true);
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

  const clearSignature = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnSignature(false);
  };

  const handleSubmitSignature = async (e) => {
    e.preventDefault();
    if (!signerName.trim()) {
      alert('Please enter your full name as the authorized signer.');
      return;
    }
    if (!hasDrawnSignature) {
      alert('Please draw your signature in the signature box before confirming.');
      return;
    }
    if (!agreeTerms) {
      alert('Please check the confirmation box to authorize digital approval.');
      return;
    }

    try {
      setIsSubmitting(true);
      const signatureDataUrl = canvasRef.current ? canvasRef.current.toDataURL('image/png') : null;

      const pinToSend = (currentPin || pinInput).trim();
      const payload = {
        pin: pinToSend,
        signerName: signerName.trim(),
        company: company.trim(),
        designation: designation.trim(),
        notes: notes.trim(),
        signatureDataUrl
      };

      const res = await fetch(`/api/projects/sign-portal/${projectId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-portal-pin': pinToSend
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Submission failed');
      }

      setProject(prev => ({
        ...prev,
        clientApproval: data.clientApproval || {
          approved: true,
          signerName: signerName.trim(),
          company: company.trim(),
          designation: designation.trim(),
          signedAt: new Date().toISOString(),
          signatureDataUrl
        }
      }));

      setShowSignModal(false);
    } catch (err) {
      console.warn('API submit failed, fallback to local state:', err);
      // Offline fallback
      const signatureDataUrl = canvasRef.current ? canvasRef.current.toDataURL('image/png') : null;
      const clientApproval = {
        approved: true,
        signerName: signerName.trim(),
        company: company.trim(),
        designation: designation.trim(),
        signedAt: new Date().toISOString(),
        notes: notes.trim(),
        signatureDataUrl
      };
      setProject(prev => ({ ...prev, clientApproval }));
      setShowSignModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center bg-light">
        <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}></div>
        <h5 className="fw-bold text-dark">Loading Official Measurement Sheet...</h5>
        <p className="text-muted small">Preparing verified bill &amp; drawings</p>
      </div>
    );
  }

  // PIN / Passcode Lock Screen
  if (requiresPin) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-3">
        <div className="card border-0 shadow-lg" style={{ maxWidth: '420px', width: '100%', borderRadius: '16px' }}>
          <div className="card-body p-4 p-sm-5 text-center">
            <div className="d-inline-flex align-items-center justify-content-center bg-primary-subtle text-primary rounded-circle mb-3" style={{ width: '68px', height: '68px' }}>
              <i className="bi bi-shield-lock-fill fs-2"></i>
            </div>
            <h4 className="fw-bold text-dark mb-1">Protected Measurement Sheet</h4>
            <p className="text-muted small mb-4">
              Enter the access PIN provided by your contractor / engineer to review and sign this document.
            </p>

            {pinError && (
              <div className="alert alert-danger py-2 small mb-3">
                <i className="bi bi-exclamation-triangle-fill me-1"></i> {pinError}
              </div>
            )}

            <form onSubmit={handleUnlockPin}>
              <div className="mb-4">
                <input
                  type="password"
                  inputMode="numeric"
                  autoFocus
                  className="form-control form-control-lg text-center fw-bold letter-spacing-2"
                  style={{ letterSpacing: '6px', fontSize: '1.4rem' }}
                  placeholder="••••"
                  maxLength={10}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  required
                />
                <div className="form-text extra-small mt-1 text-muted">Passcode / PIN is case-sensitive</div>
              </div>

              <button type="submit" className="btn btn-primary w-100 py-2 fw-bold shadow-sm">
                <i className="bi bi-unlock-fill me-1"></i> Unlock Sheet for Review
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-3">
        <div className="card border-0 shadow p-4 text-center" style={{ maxWidth: '460px' }}>
          <i className="bi bi-exclamation-circle text-danger display-4 mb-2"></i>
          <h4 className="fw-bold">Unable to Open Portal</h4>
          <p className="text-muted small mb-3">{error || 'Project not found.'}</p>
          <button className="btn btn-outline-primary btn-sm" onClick={() => fetchPortalData(pinInput)}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const approval = project.clientApproval;

  return (
    <div className="bg-light min-vh-100">
      {/* Top Navbar */}
      <nav className="navbar navbar-dark bg-dark sticky-top shadow-sm py-2 no-print">
        <div className="container-fluid px-3 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-primary fw-bold px-2 py-1">MTS VERIFIED</span>
            <span className="navbar-brand mb-0 h6 fw-bold text-white fs-6">
              {project?.header?.contractorName || 'MTS DECOR'}
            </span>
          </div>
          <div className="d-flex align-items-center gap-2">
            {approval?.approved ? (
              <span className="badge bg-success py-2 px-3 fw-bold d-inline-flex align-items-center gap-1 shadow-sm">
                <i className="bi bi-patch-check-fill"></i> DIGITALLY SIGNED &amp; SEALED
              </span>
            ) : (
              <button
                type="button"
                className="btn btn-success btn-sm fw-bold px-3 shadow-sm d-flex align-items-center gap-1"
                onClick={() => setShowSignModal(true)}
              >
                <i className="bi bi-pen-fill"></i> Sign &amp; Approve Sheet
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Official Measurement Sheet & Bill PDF View */}
      <PrintSheetView
        projectData={project}
        projectId={projectId}
        billingMode={project?.settings?.billingMode !== false}
        currencySymbol={project?.settings?.currencySymbol || '₹'}
        isClientPortal={true}
        onOpenSignModal={() => setShowSignModal(true)}
      />

      {/* Digital Client Sign-Off Modal */}
      {showSignModal && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)', zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow-lg border-0 rounded-4 overflow-hidden">
              <div className="modal-header bg-dark text-white py-3 px-4">
                <div className="d-flex align-items-center gap-2">
                  <div className="d-flex align-items-center justify-content-center rounded-3 bg-success text-white" style={{ width: '38px', height: '38px' }}>
                    <i className="bi bi-patch-check-fill fs-5"></i>
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold mb-0">Digital Client Sign-Off</h5>
                    <p className="extra-small text-white-50 mb-0">Legally tamper-evident measurement approval</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowSignModal(false)}
                  disabled={isSubmitting}
                ></button>
              </div>

              <form onSubmit={handleSubmitSignature}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label extra-small text-muted fw-bold text-uppercase mb-1">
                        Signer Full Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Hitesh Suthar"
                        value={signerName}
                        onChange={(e) => setSignerName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label extra-small text-muted fw-bold text-uppercase mb-1">
                        Designation / Role
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Client / Project Architect / PMC"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label extra-small text-muted fw-bold text-uppercase mb-1">
                        Company / Firm Name (Optional)
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Suthar Residences / Design Studio"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label extra-small text-muted fw-bold text-uppercase mb-1">
                        Approval Notes / Remarks (Optional)
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Measurements verified on site as per drawing"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>

                    {/* Touch / Stylus Canvas */}
                    <div className="col-12">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className="form-label extra-small text-muted fw-bold text-uppercase mb-0">
                          Draw Your Signature Below <span className="text-danger">*</span>
                        </label>
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-xs extra-small px-2 py-0"
                          onClick={clearSignature}
                        >
                          <i className="bi bi-arrow-counterclockwise me-1"></i> Clear
                        </button>
                      </div>

                      <div
                        className="border rounded-3 p-1 bg-white position-relative shadow-sm"
                        style={{ height: '160px', touchAction: 'none' }}
                      >
                        <canvas
                          ref={canvasRef}
                          width={600}
                          height={200}
                          className="w-100 h-100"
                          style={{ cursor: 'crosshair' }}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                        />
                        {!hasDrawnSignature && (
                          <div className="position-absolute top-50 start-50 translate-middle text-muted extra-small pointer-events-none opacity-50">
                            <i className="bi bi-pencil me-1"></i> Sign here with finger or stylus
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-12">
                      <div
                        className={`p-2.5 rounded-3 border d-flex align-items-center gap-2.5 transition-all ${agreeTerms ? 'bg-success-subtle border-success' : 'bg-light border-secondary-subtle'}`}
                        onClick={() => setAgreeTerms(!agreeTerms)}
                        style={{ cursor: 'pointer' }}
                      >
                        <input
                          className="form-check-input mt-0 flex-shrink-0"
                          type="checkbox"
                          id="agreeTermsCheck"
                          checked={agreeTerms}
                          onChange={(e) => setAgreeTerms(e.target.checked)}
                          style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                        />
                        <label className="form-check-label extra-small fw-semibold mb-0 text-dark" htmlFor="agreeTermsCheck" style={{ cursor: 'pointer' }}>
                          <i className="bi bi-shield-check me-1 text-success fs-6"></i>
                          I confirm that I have reviewed the measurements in this sheet and authorize digital approval with legal validity.
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light py-3 px-4 border-top d-flex flex-wrap justify-content-between align-items-center gap-2">
                  <div className="extra-small">
                    {!signerName.trim() ? (
                      <span className="text-muted"><i className="bi bi-pencil me-1 text-primary"></i>Enter your full name above</span>
                    ) : !hasDrawnSignature ? (
                      <span className="text-muted"><i className="bi bi-pen me-1 text-primary"></i>Draw your signature in the box</span>
                    ) : !agreeTerms ? (
                      <span className="text-warning-emphasis fw-bold"><i className="bi bi-exclamation-circle me-1"></i>Check the confirmation box</span>
                    ) : (
                      <span className="text-success fw-bold"><i className="bi bi-check-circle-fill me-1"></i>Ready to confirm &amp; seal document</span>
                    )}
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary fw-bold px-3"
                      onClick={() => setShowSignModal(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className={`btn btn-sm fw-bold px-4 shadow d-flex align-items-center gap-2 ${hasDrawnSignature && signerName.trim() && agreeTerms ? 'btn-success' : 'btn-primary'}`}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status"></span>
                          <span>Sealing Approval...</span>
                        </>
                      ) : (
                        <>
                          <i className="bi bi-patch-check-fill"></i>
                          <span>Confirm &amp; Stamp Signature</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
