import React, { useState, useEffect } from 'react';
import { 
  buildWhatsAppBillMessage, 
  shareViaWhatsApp, 
  formatCurrencyINR 
} from '../utils/whatsappShare';

export default function WhatsAppShareModal({
  show,
  onClose,
  projectName = '',
  folderName = '',
  clientName = '',
  location = '',
  billNumber = '',
  totalAmount = 0,
  formattedAmount = '',
  projectId = '',
  clientPhone: initialPhone = '',
  verificationPin = ''
}) {
  const [phone, setPhone] = useState(initialPhone || '');
  const [customNote, setCustomNote] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialPhone) setPhone(initialPhone);
  }, [initialPhone]);

  if (!show) return null;

  const publicPdfUrl = projectId 
    ? `${window.location.origin}/public-pdf/${projectId}`
    : '';

  const messageText = buildWhatsAppBillMessage({
    projectName,
    folderName,
    clientName,
    location,
    billNumber,
    totalAmount,
    formattedAmount,
    publicPdfUrl,
    verificationPin,
    customNote
  });

  const handleShare = () => {
    shareViaWhatsApp({
      phone,
      message: messageText
    });
    if (onClose) onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div 
      className="modal show d-block" 
      tabIndex="-1" 
      style={{ backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1080 }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '540px' }}>
        <div className="modal-content shadow-lg border-0 rounded-4 overflow-hidden">
          {/* Header */}
          <div 
            className="modal-header text-white px-4 py-3 border-0 d-flex align-items-center justify-content-between"
            style={{ background: 'linear-gradient(135deg, #128c7e 0%, #25d366 100%)' }}
          >
            <div className="d-flex align-items-center gap-2">
              <div 
                className="d-flex align-items-center justify-content-center rounded-circle bg-white text-success"
                style={{ width: '38px', height: '38px', fontSize: '20px' }}
              >
                <i className="bi bi-whatsapp"></i>
              </div>
              <div>
                <h6 className="modal-title fw-bold mb-0 text-white" style={{ letterSpacing: '0.5px' }}>
                  Quick WhatsApp Dispatch
                </h6>
                <small className="opacity-90" style={{ fontSize: '11px' }}>
                  Instant bill & measurement dispatch to client
                </small>
              </div>
            </div>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={onClose}
              aria-label="Close"
            />
          </div>

          {/* Body */}
          <div className="modal-body p-4 bg-light">
            {/* Phone Input */}
            <div className="mb-3">
              <label className="form-label fw-bold text-dark extra-small mb-1 d-flex justify-content-between">
                <span>CLIENT WHATSAPP NUMBER</span>
                <span className="text-muted fw-normal">(Optional — defaults to web contact picker)</span>
              </label>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0 text-muted fw-bold" style={{ fontSize: '13px' }}>
                  🇮🇳 +91
                </span>
                <input
                  type="tel"
                  className="form-control border-start-0"
                  placeholder="e.g. 9820012345"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ fontSize: '14px', letterSpacing: '0.5px' }}
                />
              </div>
            </div>

            {/* Custom Note */}
            <div className="mb-3">
              <label className="form-label fw-bold text-dark extra-small mb-1">
                ADD CUSTOM NOTE / MESSAGE
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Please verify and approve so we can proceed with material order."
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                style={{ fontSize: '13px' }}
              />
            </div>

            {/* Live Message Preview */}
            <div className="mb-2">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <label className="form-label fw-bold text-secondary extra-small mb-0">
                  <i className="bi bi-chat-left-text me-1 text-success"></i> LIVE WHATSAPP MESSAGE PREVIEW
                </label>
                <button
                  type="button"
                  className="btn btn-link btn-sm text-decoration-none p-0 extra-small fw-bold text-success"
                  onClick={handleCopy}
                >
                  <i className={`bi ${copied ? 'bi-check2-all text-primary' : 'bi-clipboard'}`}></i> {copied ? 'Copied!' : 'Copy Text'}
                </button>
              </div>
              <div 
                className="p-3 rounded-3 bg-white border shadow-sm font-monospace"
                style={{
                  fontSize: '12px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                  color: '#1f2937',
                  borderLeft: '4px solid #25d366'
                }}
              >
                {messageText}
              </div>
            </div>

            <div className="text-muted extra-small mt-2 d-flex align-items-center gap-1">
              <i className="bi bi-shield-check text-success"></i>
              <span>Clicking below opens official WhatsApp Web on desktop or the WhatsApp App on mobile.</span>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer bg-white px-4 py-3 border-top d-flex justify-content-between">
            <button
              type="button"
              className="btn btn-outline-secondary px-3 btn-sm"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="button"
              className="btn text-white px-4 py-2 fw-bold d-flex align-items-center gap-2 shadow-sm"
              style={{
                backgroundColor: '#25d366',
                borderColor: '#25d366',
                borderRadius: '8px'
              }}
              onClick={handleShare}
            >
              <i className="bi bi-whatsapp fs-6"></i>
              <span>Send via WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

