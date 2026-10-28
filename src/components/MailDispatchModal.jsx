import React, { useState, useEffect, useRef } from 'react';
import { 
  Mail, 
  Send, 
  Paperclip, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Sparkles, 
  Plus, 
  Trash2,
  FileCheck2,
  Bold,
  Italic,
  List,
  Eye,
  Download,
  FileText,
  Building,
  User,
  Check,
  ExternalLink,
  Share2
} from 'lucide-react';
import { EMAIL_TEMPLATES, replacePlaceholders } from '../utils/mailTemplates';
import { mailApi } from '../utils/mailApi';
import { getAllPdfFiles, downloadPdfFromBase64, getPdfFile } from '../utils/storage';
import { shareViaWhatsApp } from '../utils/whatsappShare';

export default function MailDispatchModal({
  show,
  onClose,
  projectId,
  projectName = '',
  clientName = '',
  clientEmail = '',
  billAmount = '',
  onSuccess
}) {
  const [senderEmail, setSenderEmail] = useState('');
  const [senderName, setSenderName] = useState('MTS Decor Billing Team');
  const [toInput, setToInput] = useState('');
  const [toList, setToList] = useState([]);
  const [ccInput, setCcInput] = useState('');
  const [ccList, setCcList] = useState([]);
  const [showCc, setShowCc] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [activeTemplate, setActiveTemplate] = useState('ra_bill');
  const [editorMode, setEditorMode] = useState('compose'); // 'compose' | 'preview'
  const [availablePdfs, setAvailablePdfs] = useState([]);
  const [selectedPdfIds, setSelectedPdfIds] = useState([]);
  const [includeLiveSheet, setIncludeLiveSheet] = useState(true);
  const [customAttachments, setCustomAttachments] = useState([]);
  const [sending, setSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [focusedField, setFocusedField] = useState(null);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize data when modal opens
  useEffect(() => {
    if (show) {
      setStatusMessage(null);
      setEditorMode('compose');

      // 1. Fetch Mail Config
      mailApi.getConfig().then(cfg => {
        if (cfg) {
          setSenderEmail(cfg.senderEmail || '');
          setSenderName(cfg.senderName || 'MTS Decor Billing Team');
        }
      }).catch(() => {});

      // 2. Setup Client Email
      if (clientEmail && clientEmail.trim()) {
        const clean = clientEmail.trim();
        setToList([clean]);
      } else {
        setToList([]);
      }
      setCcList([]);
      setShowCc(false);

      // 3. Fetch Stored Project PDFs
      getAllPdfFiles().then(pdfs => {
        if (pdfs && pdfs.length) {
          setAvailablePdfs(pdfs);
          const matching = pdfs.filter(p => p.projectId === projectId || (projectName && p.projectName === projectName));
          if (matching.length) {
            setSelectedPdfIds(matching.map(m => m._id));
          } else {
            setSelectedPdfIds([]);
          }
        }
      }).catch(() => {});

      // 4. Apply default template
      const defaultTpl = EMAIL_TEMPLATES.find(t => t.id === 'ra_bill');
      if (defaultTpl) {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const portalLink = projectId ? `${origin}/sign/${projectId}` : `${origin}/sign`;
        
        setSubject(replacePlaceholders(defaultTpl.subject, {
          projectName: projectName || 'Project',
          clientName: clientName || 'Client',
          billAmount: billAmount ? Number(billAmount).toLocaleString('en-IN') : '0.00',
        }));

        setBody(replacePlaceholders(defaultTpl.body, {
          projectName: projectName || 'Project',
          clientName: clientName || 'Valued Client',
          billAmount: billAmount ? Number(billAmount).toLocaleString('en-IN') : '0.00',
          portalLink: portalLink,
        }));
      }
    }
  }, [show, projectId, projectName, clientName, clientEmail, billAmount]);

  if (!show) return null;

  const handleAddEmail = (type, val) => {
    const trimmed = val.trim().replace(/^[,\s]+|[,\s]+$/g, '');
    if (!trimmed) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setStatusMessage({ type: 'error', text: `"${trimmed}" is not a valid email address.` });
      return;
    }

    if (type === 'to') {
      if (!toList.includes(trimmed)) setToList([...toList, trimmed]);
      setToInput('');
    } else {
      if (!ccList.includes(trimmed)) setCcList([...ccList, trimmed]);
      setCcInput('');
    }
    setStatusMessage(null);
  };

  const removeEmail = (type, idx) => {
    if (type === 'to') setToList(toList.filter((_, i) => i !== idx));
    else setCcList(ccList.filter((_, i) => i !== idx));
  };

  const handleApplyTemplate = (tplId) => {
    setActiveTemplate(tplId);
    const tpl = EMAIL_TEMPLATES.find(t => t.id === tplId);
    if (!tpl) return;

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const portalLink = projectId ? `${origin}/sign/${projectId}` : `${origin}/sign`;

    setSubject(replacePlaceholders(tpl.subject, {
      projectName: projectName || 'Project',
      clientName: clientName || 'Client',
      billAmount: billAmount ? Number(billAmount).toLocaleString('en-IN') : '0.00',
    }));

    setBody(replacePlaceholders(tpl.body, {
      projectName: projectName || 'Project',
      clientName: clientName || 'Valued Client',
      billAmount: billAmount ? Number(billAmount).toLocaleString('en-IN') : '0.00',
      portalLink: portalLink,
    }));
  };

  const handleInsertTag = (tagKey) => {
    const token = `{{${tagKey}}}`;
    const textarea = textareaRef.current;
    if (!textarea) {
      setBody(prev => prev + ' ' + token);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const next = body.substring(0, start) + token + body.substring(end);
    setBody(next);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + token.length, start + token.length);
    }, 50);
  };

  const applyFormat = (prefix, suffix = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = body.substring(start, end) || 'text';
    const formatted = `${prefix}${selectedText}${suffix}`;
    const newBody = body.substring(0, start) + formatted + body.substring(end);
    setBody(newBody);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 50);
  };

  const togglePdf = (pdfId) => {
    setSelectedPdfIds(prev => 
      prev.includes(pdfId) ? prev.filter(id => id !== pdfId) : [...prev, pdfId]
    );
  };

  const handleDownloadPdf = async (pdf) => {
    try {
      if (pdf.base64Data) {
        downloadPdfFromBase64(pdf.fileName, pdf.base64Data);
      } else if (pdf._id) {
        const fullPdf = await getPdfFile(pdf._id);
        if (fullPdf && fullPdf.base64Data) {
          downloadPdfFromBase64(fullPdf.fileName || pdf.fileName, fullPdf.base64Data);
        }
      }
    } catch {
      // silent
    }
  };

  const handleUploadCustom = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach(f => {
      if (f.size > 15 * 1024 * 1024) {
        setStatusMessage({ type: 'error', text: `"${f.name}" exceeds 15MB size limit.` });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setCustomAttachments(prev => [
          ...prev,
          {
            fileName: f.name,
            fileSize: f.size,
            fileType: f.type || 'application/pdf',
            fileBase64: reader.result,
          }
        ]);
      };
      reader.readAsDataURL(f);
    });
    e.target.value = '';
  };

  const handleSend = async (isTest = false) => {
    setStatusMessage(null);
    if (!isTest && toList.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please specify at least one recipient email address.' });
      return;
    }
    if (!subject.trim()) {
      setStatusMessage({ type: 'error', text: 'Email subject cannot be empty.' });
      return;
    }

    const recipients = isTest ? [senderEmail || 'billing@mtsdecor.com'] : toList;
    if (isTest && !senderEmail) {
      setStatusMessage({ type: 'error', text: 'Sender email not configured. Please verify your email settings.' });
      return;
    }

    setSending(true);
    try {
      const payload = {
        to: recipients,
        cc: isTest ? [] : ccList,
        subject: isTest ? `[TEST COPY] ${subject}` : subject,
        bodyText: body,
        projectId: projectId || null,
        projectName: projectName || '',
        clientName: clientName || '',
        attachedPdfIds: selectedPdfIds,
        customAttachments: customAttachments,
        sentBy: 'MTS Decor Billing',
      };

      const res = await mailApi.sendEmail(payload);
      setStatusMessage({
        type: 'success',
        text: isTest 
          ? `Test email sent to ${senderEmail}!` 
          : `Email successfully dispatched to ${toList.join(', ')}!`
      });

      if (!isTest) {
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 1600);
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to dispatch email. Please verify SMTP/Resend settings.'
      });
    } finally {
      setSending(false);
    }
  };

  const relevantPdfs = availablePdfs.filter(p => {
    if (!projectId) return true;
    return p.projectId === projectId || (projectName && p.projectName === projectName);
  });

  const totalAttachmentsCount = (includeLiveSheet ? 1 : 0) + selectedPdfIds.length + customAttachments.length;

  return (
    <div 
      className="modal-backdrop d-flex align-items-center justify-content-center p-3" 
      style={{ zIndex: 1060, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div 
        className="modal-content shadow-2xl border-0 rounded-4 overflow-hidden bg-white text-slate-900" 
        style={{ 
          maxWidth: '960px', 
          width: '100%', 
          maxHeight: '92vh',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Sleek Executive Header ── */}
        <div 
          className="d-flex align-items-center justify-content-between px-4 py-3 bg-white border-bottom"
          style={{ borderColor: '#f1f5f9' }}
        >
          <div className="d-flex align-items-center gap-3">
            <div 
              className="d-flex align-items-center justify-content-center rounded-3 text-white shadow-sm" 
              style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)' }}
            >
              <Mail size={20} />
            </div>
            <div>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <h5 className="m-0 fw-bold fs-6 text-dark" style={{ letterSpacing: '-0.2px' }}>
                  Email Bill &amp; Measurement Sheet
                </h5>
                <span 
                  className="badge rounded-pill fw-semibold px-2 py-0.5" 
                  style={{ fontSize: '10.5px', backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}
                >
                  MTS Official Dispatch
                </span>
              </div>
              <div className="d-flex align-items-center gap-2 mt-0.5 text-muted small" style={{ fontSize: '11.5px' }}>
                {projectName && (
                  <span className="fw-medium text-slate-700">
                    Project: <strong className="text-dark">{projectName}</strong>
                  </span>
                )}
                {clientName && (
                  <span>• Client: <strong className="text-slate-800">{clientName}</strong></span>
                )}
                {billAmount && (
                  <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200 fw-bold px-2">
                    ₹{Number(billAmount).toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button 
            type="button" 
            className="btn btn-sm btn-light border text-slate-500 rounded-circle p-1.5 shadow-2xs hover-bg-slate" 
            style={{ width: '32px', height: '32px', borderColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Status Notification Alert ── */}
        {statusMessage && (
          <div 
            className="mx-4 mt-3 p-3 rounded-3 d-flex align-items-center gap-2.5 small border shadow-xs"
            style={{
              backgroundColor: statusMessage.type === 'success' ? '#f0fdf4' : '#fef2f2',
              borderColor: statusMessage.type === 'success' ? '#bbf7d0' : '#fecaca',
              color: statusMessage.type === 'success' ? '#166534' : '#991b1b',
              fontSize: '12.5px'
            }}
          >
            {statusMessage.type === 'success' ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}
            <span className="fw-semibold">{statusMessage.text}</span>
          </div>
        )}

        {/* ── Modal Form Body ── */}
        <div className="modal-body p-4 overflow-auto" style={{ maxHeight: 'calc(92vh - 142px)' }}>
          <div className="row g-4">
            
            {/* ══════════════════════════════════════════════════════
                LEFT COLUMN: Modern Email Composer
            ══════════════════════════════════════════════════════ */}
            <div className="col-12 col-lg-7">
              
              {/* Recipient Composer Box (Gmail / Linear Style) */}
              <div 
                className="mb-3 rounded-3 border bg-white overflow-hidden shadow-2xs transition-all"
                style={{ 
                  borderColor: focusedField === 'to' || focusedField === 'cc' ? '#3b82f6' : '#e2e8f0',
                  boxShadow: focusedField === 'to' || focusedField === 'cc' ? '0 0 0 3px rgba(59, 130, 246, 0.12)' : 'none'
                }}
              >
                {/* 'To' Row */}
                <div className="d-flex align-items-start px-3 py-2 border-bottom" style={{ borderColor: '#f1f5f9' }}>
                  <span 
                    className="fw-bold text-slate-500 pt-1" 
                    style={{ width: '42px', fontSize: '12px', letterSpacing: '0.02em', flexShrink: 0 }}
                  >
                    To
                  </span>
                  
                  <div className="d-flex flex-wrap align-items-center gap-1.5 flex-grow-1" style={{ minHeight: '32px' }}>
                    {toList.map((email, i) => (
                      <span 
                        key={i} 
                        className="badge d-inline-flex align-items-center gap-1.5 fw-medium px-2.5 py-1 rounded-pill"
                        style={{ 
                          backgroundColor: '#eff6ff', 
                          color: '#1d4ed8', 
                          border: '1px solid #bfdbfe', 
                          fontSize: '12px' 
                        }}
                      >
                        <User size={11} className="text-blue-500" />
                        <span>{email}</span>
                        <button 
                          type="button" 
                          className="btn btn-link p-0 text-blue-600 hover:text-blue-900" 
                          style={{ lineHeight: 1 }}
                          onClick={() => removeEmail('to', i)}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                    
                    <input
                      type="email"
                      className="border-0 bg-transparent text-slate-900 flex-grow-1"
                      style={{ 
                        outline: 'none', 
                        minWidth: '200px', 
                        padding: '4px 6px',
                        fontSize: '13px'
                      }}
                      placeholder={toList.length === 0 ? "Enter client email (e.g. client@company.com)..." : "Add another recipient..."}
                      value={toInput}
                      onFocus={() => setFocusedField('to')}
                      onBlur={() => {
                        setFocusedField(null);
                        handleAddEmail('to', toInput);
                      }}
                      onChange={e => setToInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          handleAddEmail('to', toInput);
                        }
                      }}
                    />
                  </div>

                  {!showCc && (
                    <button 
                      type="button" 
                      className="btn btn-link p-0 text-slate-500 text-decoration-none fw-semibold pt-1 ms-2" 
                      style={{ fontSize: '11.5px', flexShrink: 0 }}
                      onClick={() => setShowCc(true)}
                    >
                      + Cc
                    </button>
                  )}
                </div>

                {/* 'Cc' Row (Slide down) */}
                {showCc && (
                  <div className="d-flex align-items-start px-3 py-2 bg-slate-50 border-bottom" style={{ borderColor: '#f1f5f9' }}>
                    <span 
                      className="fw-bold text-slate-500 pt-1" 
                      style={{ width: '42px', fontSize: '12px', flexShrink: 0 }}
                    >
                      Cc
                    </span>
                    <div className="d-flex flex-wrap align-items-center gap-1.5 flex-grow-1" style={{ minHeight: '30px' }}>
                      {ccList.map((email, i) => (
                        <span 
                          key={i} 
                          className="badge d-inline-flex align-items-center gap-1.5 fw-medium px-2 py-0.5 rounded-pill"
                          style={{ backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', fontSize: '11.5px' }}
                        >
                          <span>{email}</span>
                          <button 
                            type="button" 
                            className="btn btn-link p-0 text-slate-500 hover:text-slate-800" 
                            style={{ lineHeight: 1 }}
                            onClick={() => removeEmail('cc', i)}
                          >
                            <X size={11} />
                          </button>
                        </span>
                      ))}
                      <input
                        type="email"
                        className="border-0 bg-transparent text-slate-900 flex-grow-1"
                        style={{ outline: 'none', minWidth: '180px', padding: '3px 6px', fontSize: '12.5px' }}
                        placeholder="Add CC email (accountant, director)..."
                        value={ccInput}
                        onFocus={() => setFocusedField('cc')}
                        onBlur={() => {
                          setFocusedField(null);
                          handleAddEmail('cc', ccInput);
                        }}
                        onChange={e => setCcInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault();
                            handleAddEmail('cc', ccInput);
                          }
                        }}
                      />
                    </div>
                    <button 
                      type="button" 
                      className="btn btn-link p-0 text-slate-400 text-decoration-none pt-1 ms-2" 
                      style={{ fontSize: '11px', flexShrink: 0 }}
                      onClick={() => setShowCc(false)}
                    >
                      Hide
                    </button>
                  </div>
                )}

                {/* Subject Row */}
                <div className="d-flex align-items-center px-3 py-2">
                  <span 
                    className="fw-bold text-slate-500" 
                    style={{ width: '42px', fontSize: '12px', flexShrink: 0 }}
                  >
                    Sub
                  </span>
                  <input
                    type="text"
                    className="border-0 bg-transparent text-slate-900 fw-semibold flex-grow-1"
                    style={{ outline: 'none', fontSize: '13px', padding: '3px 6px' }}
                    placeholder="Enter dispatch subject..."
                    value={subject}
                    onFocus={() => setFocusedField('subject')}
                    onBlur={() => setFocusedField(null)}
                    onChange={e => setSubject(e.target.value)}
                  />
                </div>
              </div>

              {/* Quick Suggestion Pill for Client Email (if known) */}
              {clientEmail && !toList.includes(clientEmail.trim()) && (
                <div className="mb-3 d-flex align-items-center gap-2">
                  <span className="text-muted" style={{ fontSize: '11px' }}>Quick Add:</span>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary py-0.5 px-2 rounded-pill d-inline-flex align-items-center gap-1"
                    style={{ fontSize: '11px' }}
                    onClick={() => setToList([...toList, clientEmail.trim()])}
                  >
                    <Plus size={11} />
                    <span>{clientEmail}</span>
                  </button>
                </div>
              )}

              {/* ── Template & Compose Control Bar ── */}
              <div 
                className="p-2 px-2.5 rounded-3 mb-2.5 border d-flex flex-wrap align-items-center justify-content-between gap-2" 
                style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
              >
                {/* Template Chips */}
                <div className="d-flex flex-wrap align-items-center gap-1">
                  <span className="small text-slate-500 fw-bold d-flex align-items-center gap-1 me-1" style={{ fontSize: '11px' }}>
                    <Sparkles size={13} className="text-amber-500" />
                    Template:
                  </span>
                  {EMAIL_TEMPLATES.map(tpl => {
                    const isActive = activeTemplate === tpl.id;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        className="btn btn-sm rounded-pill px-2.5 py-0.5 fw-semibold transition-all"
                        style={{ 
                          fontSize: '11px',
                          backgroundColor: isActive ? '#ffffff' : 'transparent',
                          color: isActive ? '#1d4ed8' : '#475569',
                          border: isActive ? '1px solid #bfdbfe' : '1px solid transparent',
                          boxShadow: isActive ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
                        }}
                        onClick={() => handleApplyTemplate(tpl.id)}
                      >
                        {tpl.name}
                      </button>
                    );
                  })}
                </div>

                {/* View Switcher: Edit / Preview */}
                <div className="btn-group p-0.5 rounded-pill bg-white border" style={{ borderColor: '#e2e8f0' }}>
                  <button
                    type="button"
                    className={`btn btn-xs rounded-pill px-2.5 py-0.5 fw-semibold ${editorMode === 'compose' ? 'bg-primary text-white shadow-xs' : 'text-slate-600'}`}
                    style={{ fontSize: '11px' }}
                    onClick={() => setEditorMode('compose')}
                  >
                    Compose
                  </button>
                  <button
                    type="button"
                    className={`btn btn-xs rounded-pill px-2.5 py-0.5 fw-semibold ${editorMode === 'preview' ? 'bg-primary text-white shadow-xs' : 'text-slate-600'}`}
                    style={{ fontSize: '11px' }}
                    onClick={() => setEditorMode('preview')}
                  >
                    <Eye size={11} className="me-1" />
                    Preview
                  </button>
                </div>
              </div>

              {/* ── Message Body Editor or Live Letterhead Preview ── */}
              {editorMode === 'compose' ? (
                <div className="rounded-3 border overflow-hidden bg-white shadow-2xs" style={{ borderColor: '#e2e8f0' }}>
                  {/* Executive Formatting Toolbar */}
                  <div 
                    className="d-flex align-items-center justify-content-between p-1.5 px-2.5 border-bottom bg-slate-50" 
                    style={{ borderColor: '#f1f5f9' }}
                  >
                    <div className="d-flex align-items-center gap-1">
                      <button 
                        type="button" 
                        className="btn btn-sm btn-light border text-slate-700 p-0.5 px-2 rounded-2" 
                        style={{ borderColor: '#e2e8f0' }} 
                        onClick={() => applyFormat('**', '**')}
                        title="Bold"
                      >
                        <Bold size={13} />
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-sm btn-light border text-slate-700 p-0.5 px-2 rounded-2" 
                        style={{ borderColor: '#e2e8f0' }} 
                        onClick={() => applyFormat('*', '*')}
                        title="Italic"
                      >
                        <Italic size={13} />
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-sm btn-light border text-slate-700 p-0.5 px-2 rounded-2" 
                        style={{ borderColor: '#e2e8f0' }} 
                        onClick={() => applyFormat('\n• ')}
                        title="Bullet List"
                      >
                        <List size={13} />
                      </button>
                    </div>

                    {/* Quick Smart Variable Tags */}
                    <div className="d-flex align-items-center gap-1">
                      <span className="text-slate-400 extra-small me-1">Insert:</span>
                      <button 
                        type="button" 
                        className="btn btn-sm btn-light border text-slate-600 py-0.5 px-2 rounded-pill" 
                        style={{ fontSize: '10.5px', borderColor: '#e2e8f0' }} 
                        onClick={() => handleInsertTag('clientName')}
                      >
                        + Client
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-sm btn-light border text-slate-600 py-0.5 px-2 rounded-pill" 
                        style={{ fontSize: '10.5px', borderColor: '#e2e8f0' }} 
                        onClick={() => handleInsertTag('billAmount')}
                      >
                        + Amount
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-sm btn-light border text-slate-600 py-0.5 px-2 rounded-pill" 
                        style={{ fontSize: '10.5px', borderColor: '#e2e8f0' }} 
                        onClick={() => handleInsertTag('portalLink')}
                      >
                        + Portal Link
                      </button>
                    </div>
                  </div>

                  {/* Clean Sans-serif Textarea (Executive Email Font) */}
                  <textarea
                    ref={textareaRef}
                    rows={8}
                    className="form-control border-0 text-slate-800 bg-white p-3"
                    style={{ 
                      fontSize: '13.5px', 
                      lineHeight: '1.6', 
                      outline: 'none',
                      resize: 'vertical',
                      minHeight: '210px',
                      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
                    }}
                    value={body}
                    onChange={e => setBody(e.target.value)}
                  />
                </div>
              ) : (
                /* Authentic Executive Email Preview */
                <div 
                  className="rounded-3 border overflow-hidden bg-white shadow-2xs" 
                  style={{ borderColor: '#e2e8f0', minHeight: '260px' }}
                >
                  <div className="p-3 bg-slate-50 border-bottom small text-slate-600" style={{ borderColor: '#f1f5f9', fontSize: '12px' }}>
                    <div><strong>From:</strong> {senderName} &lt;{senderEmail || 'billing@mtsdecor.com'}&gt;</div>
                    <div><strong>To:</strong> {toList.join(', ') || 'client@example.com'}</div>
                    {ccList.length > 0 && <div><strong>Cc:</strong> {ccList.join(', ')}</div>}
                    <div><strong>Subject:</strong> {subject}</div>
                  </div>
                  
                  <div 
                    className="p-4" 
                    style={{ 
                      fontSize: '13.5px', 
                      lineHeight: '1.65', 
                      color: '#1e293b', 
                      whiteSpace: 'pre-wrap',
                      maxHeight: '260px',
                      overflowY: 'auto'
                    }}
                  >
                    {replacePlaceholders(body, {
                      projectName: projectName || 'Project',
                      clientName: clientName || 'Valued Client',
                      billAmount: billAmount ? Number(billAmount).toLocaleString('en-IN') : '0.00',
                      portalLink: projectId ? `${window.location.origin}/sign/${projectId}` : `${window.location.origin}/sign`,
                      date: new Date().toLocaleDateString('en-IN')
                    })}
                  </div>
                </div>
              )}

            </div>

            {/* ══════════════════════════════════════════════════════
                RIGHT COLUMN: Professional PDF & Document Attachments
            ══════════════════════════════════════════════════════ */}
            <div className="col-12 col-lg-5">
              <div 
                className="p-3.5 rounded-3 border h-100 d-flex flex-column bg-white shadow-2xs" 
                style={{ borderColor: '#e2e8f0' }}
              >
                {/* Header */}
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="fw-bold small d-flex align-items-center gap-1.5 text-slate-900" style={{ fontSize: '13px' }}>
                    <Paperclip size={15} className="text-primary" />
                    Attached Documents
                  </span>
                  <span 
                    className="badge rounded-pill fw-semibold px-2 py-0.5" 
                    style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontSize: '11px' }}
                  >
                    {totalAttachmentsCount} File{totalAttachmentsCount === 1 ? '' : 's'}
                  </span>
                </div>

                <p className="text-muted small mb-3" style={{ fontSize: '11.5px', lineHeight: 1.4 }}>
                  Documents attached below will be delivered directly to the client's inbox:
                </p>

                {/* Live Sheet PDF Auto-Attachment (Always available!) */}
                <div 
                  className={`d-flex align-items-center justify-content-between p-2.5 rounded-3 mb-2.5 border transition-all ${
                    includeLiveSheet ? 'bg-primary-subtle border-primary' : 'bg-light border-light'
                  }`}
                  style={{ 
                    backgroundColor: includeLiveSheet ? '#eff6ff' : '#f8fafc',
                    borderColor: includeLiveSheet ? '#93c5fd' : '#e2e8f0',
                    cursor: 'pointer'
                  }}
                  onClick={() => setIncludeLiveSheet(!includeLiveSheet)}
                >
                  <label className="d-flex align-items-center gap-2.5 m-0 overflow-hidden flex-grow-1" style={{ cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      className="form-check-input mt-0" 
                      checked={includeLiveSheet} 
                      onChange={() => {}} // handled by parent div
                    />
                    <div 
                      className="d-flex align-items-center justify-content-center rounded-2 text-danger"
                      style={{ width: '28px', height: '28px', backgroundColor: '#fee2e2' }}
                    >
                      <FileText size={15} />
                    </div>
                    <div className="overflow-hidden flex-grow-1">
                      <div className="text-dark small fw-bold text-truncate" style={{ fontSize: '12px' }}>
                        {projectName || 'Current Sheet'} — BOQ &amp; Abstract
                      </div>
                      <div className="text-muted extra-small" style={{ fontSize: '10.5px' }}>
                        Live Measurement Abstract • Generated on dispatch
                      </div>
                    </div>
                  </label>
                  <span className="badge bg-success-subtle text-success rounded-pill px-2 py-0.5" style={{ fontSize: '10px' }}>
                    Auto-Ready
                  </span>
                </div>

                {/* Stored Project PDFs List */}
                <div className="flex-grow-1 overflow-auto pe-1 mb-3" style={{ maxHeight: '180px' }}>
                  {relevantPdfs.length > 0 && (
                    <div className="mb-2">
                      <div className="text-slate-500 extra-small fw-bold text-uppercase mb-1" style={{ fontSize: '10px', letterSpacing: '0.04em' }}>
                        Saved Bill Snapshots ({relevantPdfs.length})
                      </div>
                      {relevantPdfs.map(pdf => {
                        const isChecked = selectedPdfIds.includes(pdf._id);
                        return (
                          <div 
                            key={pdf._id} 
                            className="d-flex align-items-center justify-content-between p-2 rounded-2 mb-1.5 border transition-all"
                            style={{ 
                              backgroundColor: isChecked ? '#eff6ff' : '#ffffff',
                              borderColor: isChecked ? '#93c5fd' : '#e2e8f0'
                            }}
                          >
                            <label className="d-flex align-items-center gap-2 m-0 overflow-hidden flex-grow-1" style={{ cursor: 'pointer' }}>
                              <input 
                                type="checkbox" 
                                className="form-check-input mt-0" 
                                checked={isChecked} 
                                onChange={() => togglePdf(pdf._id)} 
                              />
                              <div className="p-1 rounded bg-rose-50 text-rose-600 border border-rose-200">
                                <FileText size={12} />
                              </div>
                              <div className="overflow-hidden flex-grow-1">
                                <div className="text-slate-900 small fw-bold text-truncate" style={{ fontSize: '11.5px' }}>
                                  {pdf.fileName}
                                </div>
                                <div className="text-slate-500" style={{ fontSize: '10px' }}>
                                  {(pdf.fileSize ? (pdf.fileSize / 1024).toFixed(0) + ' KB' : 'PDF Document')}
                                </div>
                              </div>
                            </label>

                            <button
                              type="button"
                              className="btn btn-sm btn-light border text-slate-600 p-1 px-1.5 ms-1 shadow-2xs"
                              style={{ borderColor: '#e2e8f0' }}
                              title="Download PDF"
                              onClick={() => handleDownloadPdf(pdf)}
                            >
                              <Download size={11} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Custom Uploads List */}
                  {customAttachments.length > 0 && (
                    <div className="mb-2">
                      <div className="text-slate-500 extra-small fw-bold text-uppercase mb-1" style={{ fontSize: '10px' }}>
                        Custom Uploads ({customAttachments.length})
                      </div>
                      {customAttachments.map((att, i) => (
                        <div 
                          key={i} 
                          className="d-flex align-items-center justify-content-between p-2 rounded-2 mb-1 bg-white border small shadow-2xs"
                          style={{ borderColor: '#e2e8f0' }}
                        >
                          <span className="text-truncate text-slate-800 fw-medium" style={{ maxWidth: '170px', fontSize: '11px' }}>
                            {att.fileName}
                          </span>
                          <button 
                            type="button" 
                            className="btn btn-link p-0 text-danger" 
                            onClick={() => setCustomAttachments(prev => prev.filter((_, idx) => idx !== i))}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {relevantPdfs.length === 0 && customAttachments.length === 0 && (
                    <div className="text-center p-3 text-slate-500 small bg-slate-50 border border-dashed rounded-3">
                      <FileCheck2 size={20} className="text-slate-400 mb-1 d-block mx-auto" />
                      <span style={{ fontSize: '11px' }}>
                        No prior PDF archives for this project. Attach any extra drawings or quotation PDFs below.
                      </span>
                    </div>
                  )}
                </div>

                {/* Upload Additional Files Button / Dropzone */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,.xlsx"
                  style={{ display: 'none' }}
                  onChange={handleUploadCustom}
                />
                <button
                  type="button"
                  className="btn btn-sm btn-light w-100 py-2 border-dashed rounded-3 text-primary fw-semibold d-flex align-items-center justify-content-center gap-1.5 shadow-2xs"
                  style={{ borderColor: '#93c5fd', backgroundColor: '#f0f7ff', fontSize: '12px' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Plus size={14} />
                  <span>Attach Extra File (PDF, Images, etc.)</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* ── Modal Footer ── */}
        <div 
          className="modal-footer px-4 py-3 border-top bg-white d-flex flex-wrap align-items-center justify-content-between gap-2" 
          style={{ borderColor: '#f1f5f9' }}
        >
          {/* Left: Test Verification Dispatch */}
          <div>
            <button
              type="button"
              className="btn btn-sm btn-light border text-slate-700 fw-semibold d-flex align-items-center gap-1.5 px-3 py-1.5 shadow-2xs"
              style={{ borderColor: '#e2e8f0', fontSize: '12.5px' }}
              onClick={() => handleSend(true)}
              disabled={sending}
              title="Send a verification test copy to your own email"
            >
              <RefreshCw size={13} className={`text-slate-500 ${sending ? 'spin' : ''}`} />
              <span>Send Test Copy to Self</span>
            </button>
          </div>

          {/* Right: Actions */}
          <div className="d-flex align-items-center gap-2">
            {/* Quick WhatsApp Dispatch */}
            <button
              type="button"
              className="btn btn-sm text-white px-3 py-1.5 fw-bold d-flex align-items-center gap-1.5 shadow-sm"
              style={{ backgroundColor: '#25d366', borderColor: '#25d366', fontSize: '12.5px' }}
              title="Send clean formatted bill summary directly on WhatsApp"
              onClick={() => {
                shareViaWhatsApp({
                  projectName,
                  clientName,
                  billNumber: activeTemplate === 'ra_bill' ? 'RA Bill' : 'Measurement Abstract',
                  formattedAmount: billAmount ? `₹${Number(billAmount).toLocaleString('en-IN')}` : '',
                  projectId
                });
              }}
            >
              <i className="bi bi-whatsapp"></i>
              <span>Share on WhatsApp</span>
            </button>

            {/* Cancel Button */}
            <button 
              type="button" 
              className="btn btn-sm btn-light border text-slate-700 px-3 py-1.5 fw-semibold shadow-2xs" 
              style={{ borderColor: '#e2e8f0', fontSize: '12.5px' }}
              onClick={onClose} 
              disabled={sending}
            >
              Cancel
            </button>

            {/* Primary Dispatch Email Button */}
            <button
              type="button"
              className="btn btn-sm btn-primary px-3.5 py-1.5 fw-bold d-flex align-items-center gap-2 shadow-sm"
              style={{ 
                background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)', 
                border: 'none',
                fontSize: '12.5px' 
              }}
              onClick={() => handleSend(false)}
              disabled={sending || toList.length === 0}
            >
              <Send size={14} className={sending ? 'spin' : ''} />
              <span>
                {sending 
                  ? 'Dispatching Email...' 
                  : `Dispatch Email (${toList.length})`}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
