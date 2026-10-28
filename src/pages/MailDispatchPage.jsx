import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Send, 
  FileText, 
  Clock, 
  Settings, 
  Paperclip, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  RefreshCw, 
  FolderCheck, 
  Search, 
  Save, 
  ArrowLeft, 
  X, 
  FileCheck2, 
  ShieldCheck, 
  HelpCircle, 
  Building2, 
  Inbox, 
  Check, 
  ExternalLink, 
  Bold, 
  Italic, 
  List, 
  Quote, 
  Heading2, 
  Download, 
  User, 
  ChevronDown,
  Columns,
  Maximize2,
  Copy,
  RotateCcw,
  CheckCheck,
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { EMAIL_TEMPLATES, replacePlaceholders } from '../utils/mailTemplates';
import { mailApi } from '../utils/mailApi';
import { getAllProjects, getAllPdfFiles, downloadPdfFromBase64, getPdfFile } from '../utils/storage';
import { getSession } from '../utils/auth';

const PROVIDER_PRESETS = [
  {
    id: 'gmail',
    name: 'Gmail / Google Workspace (SMTP)',
    subtitle: 'Direct high-speed delivery from your email',
    type: 'SMTP',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    help: 'Requires a 16-character Google App Password from myaccount.google.com.'
  },
  {
    id: 'resend',
    name: 'Resend Cloud API',
    subtitle: 'High-deliverability developer API',
    type: 'RESEND',
    help: 'Zero port blocks. Free 3,000 emails/month. Requires custom domain for external clients.'
  },
  {
    id: 'hostinger',
    name: 'Hostinger Business Mail',
    subtitle: 'Custom business domain SMTP',
    type: 'SMTP',
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true,
    help: 'Hostinger business email with your custom domain (e.g. billing@mtsdecor.com).'
  },
  {
    id: 'zoho',
    name: 'Zoho Mail Workspace',
    subtitle: 'Enterprise Zoho SMTP Relay',
    type: 'SMTP',
    host: 'smtp.zoho.com',
    port: 465,
    secure: true,
    help: 'Zoho Mail SMTP with SSL on port 465.'
  },
  {
    id: 'outlook',
    name: 'Microsoft 365 / Outlook',
    subtitle: 'Office 365 Exchange Relay',
    type: 'SMTP',
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    help: 'Office 365 standard SMTP relay port 587.'
  },
  {
    id: 'custom',
    name: 'Custom SMTP Server',
    subtitle: 'Private VPS / cPanel Relay',
    type: 'SMTP',
    host: '',
    port: 465,
    secure: true,
    help: 'Configure any VPS, cPanel, or private SMTP server.'
  }
];

// Helper to generate luxury HTML email for clients
function generateLetterheadHtml({ projectName, clientName, billAmount, portalLink, bodyText, selectedPdfs, dateStr }) {
  const formattedAmount = billAmount ? Number(billAmount).toLocaleString('en-IN') : '0.00';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 24px; background-color: #f8fafc; color: #0f172a; }
    .card { max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); padding: 32px 28px; color: #ffffff; }
    .brand-title { font-size: 22px; font-weight: 800; letter-spacing: 0.5px; margin: 0; color: #ffffff; }
    .brand-sub { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #93c5fd; margin-top: 4px; font-weight: 600; }
    .content { padding: 32px 28px; }
    .bill-summary { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px 20px; margin: 24px 0; }
    .bill-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; border-bottom: 1px dashed #e2e8f0; }
    .bill-row:last-child { border-bottom: none; padding-top: 10px; }
    .btn-action { display: inline-block; background: #2563eb; color: #ffffff !important; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 6px; text-align: center; margin: 16px 0 24px 0; }
    .footer { background: #f1f5f9; padding: 20px 28px; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1 class="brand-title">MTS DECOR</h1>
      <div class="brand-sub">Architectural Measurements & Billing System</div>
    </div>
    <div class="content">
      <div style="font-size: 15px; line-height: 1.6; white-space: pre-wrap; color: #1e293b;">${bodyText}</div>

      <div class="bill-summary">
        <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 8px;">Executive Summary</div>
        <div class="bill-row">
          <span style="color: #64748b;">Project Name:</span>
          <strong style="color: #0f172a;">${projectName || 'Project Execution'}</strong>
        </div>
        <div class="bill-row">
          <span style="color: #64748b;">Client / Recipient:</span>
          <strong style="color: #0f172a;">${clientName || 'Valued Client'}</strong>
        </div>
        <div class="bill-row">
          <span style="color: #64748b;">Dispatch Date:</span>
          <span style="color: #0f172a;">${dateStr}</span>
        </div>
        <div class="bill-row" style="font-size: 16px;">
          <span style="color: #0f172a; font-weight: 600;">Total Bill Amount:</span>
          <strong style="color: #059669;">₹${formattedAmount}</strong>
        </div>
      </div>

      ${portalLink ? `
      <div style="text-align: center; margin: 28px 0 16px 0;">
        <a href="${portalLink}" target="_blank" class="btn-action">
          Review & Digitally Sign Bill &rarr;
        </a>
        <div style="font-size: 11px; color: #94a3b8;">Click to open secure digital approval portal on mobile or desktop</div>
      </div>
      ` : ''}

      ${selectedPdfs && selectedPdfs.length > 0 ? `
      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
        <div style="font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 8px;">Attached PDF Documents:</div>
        <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #2563eb;">
          ${selectedPdfs.map(p => `<li style="margin-bottom: 4px;"><strong>${p.fileName}</strong> (${p.fileSize ? (p.fileSize/1024).toFixed(0) + ' KB' : 'PDF Document'})</li>`).join('')}
        </ul>
      </div>
      ` : ''}
    </div>
    <div class="footer">
      <div>Official dispatch from <strong>MTS Decor Billing Team</strong></div>
      <div style="margin-top: 4px;">For accounting queries, reply to this email or visit our administrative office.</div>
    </div>
  </div>
</body>
</html>
  `;
}

export default function MailDispatchPage() {
  const navigate = useNavigate();
  const session = getSession();

  const [activeTab, setActiveTab] = useState('compose'); // 'compose' | 'drafts' | 'history' | 'settings'
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'editor-only' | 'preview-only'
  const [senderEmail, setSenderEmail] = useState('');
  const [senderName, setSenderName] = useState('MTS Decor Billing Team');
  const [activeProvider, setActiveProvider] = useState('SMTP');
  const [projects, setProjects] = useState([]);
  const [pdfFiles, setPdfFiles] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [toast, setToast] = useState(null);

  // Compose State
  const [toInput, setToInput] = useState('');
  const [toList, setToList] = useState([]);
  const [ccInput, setCcInput] = useState('');
  const [ccList, setCcList] = useState([]);
  const [showCc, setShowCc] = useState(false);
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [activeTemplate, setActiveTemplate] = useState('ra_bill');
  const [selectedPdfIds, setSelectedPdfIds] = useState([]);
  const [customAttachments, setCustomAttachments] = useState([]);
  const [draftId, setDraftId] = useState(null);
  const [sending, setSending] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Settings State
  const [providerType, setProviderType] = useState('SMTP');
  const [selectedProvider, setSelectedProvider] = useState('gmail');
  const [resendApiKey, setResendApiKey] = useState('');
  const [hasResendKey, setHasResendKey] = useState(false);
  const [smtpSenderEmail, setSmtpSenderEmail] = useState('');
  const [smtpSenderName, setSmtpSenderName] = useState('MTS Decor Billing Team');
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState(465);
  const [smtpSecure, setSmtpSecure] = useState(true);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [hasPassword, setHasPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showGmailHelp, setShowGmailHelp] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState(null);

  // Drafts & Logs Filtering
  const [draftsSearch, setDraftsSearch] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('ALL');
  const [previewLog, setPreviewLog] = useState(null);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const showToastMsg = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  };

  const loadSettings = useCallback(async () => {
    try {
      const cfg = await mailApi.getConfig();
      if (cfg) {
        setProviderType(cfg.provider || 'SMTP');
        setActiveProvider(cfg.provider || 'SMTP');
        setSenderEmail(cfg.senderEmail || '');
        setSenderName(cfg.senderName || 'MTS Decor Billing Team');
        setSmtpSenderEmail(cfg.senderEmail || '');
        setSmtpSenderName(cfg.senderName || 'MTS Decor Billing Team');
        setSmtpHost(cfg.smtpHost || 'smtp.gmail.com');
        setSmtpPort(cfg.smtpPort || 465);
        setSmtpSecure(cfg.secure !== false);
        setSmtpUser(cfg.smtpUser || cfg.senderEmail || '');
        setHasPassword(!!cfg.hasPassword);
        setHasResendKey(!!cfg.hasResendApiKey);

        if (cfg.provider === 'RESEND') {
          setSelectedProvider('resend');
        } else if (cfg.smtpHost?.includes('gmail')) {
          setSelectedProvider('gmail');
        } else if (cfg.smtpHost?.includes('hostinger')) {
          setSelectedProvider('hostinger');
        } else if (cfg.smtpHost?.includes('zoho')) {
          setSelectedProvider('zoho');
        } else if (cfg.smtpHost?.includes('office365')) {
          setSelectedProvider('outlook');
        } else {
          setSelectedProvider('custom');
        }
      }
    } catch {
      // fallback
    }
  }, []);

  const applyTemplate = useCallback((tplId, pName, cName, bAmt, pId) => {
    setActiveTemplate(tplId);
    const tpl = EMAIL_TEMPLATES.find(t => t.id === tplId);
    if (!tpl) return;

    const prName = pName !== undefined ? pName : projectName;
    const clName = cName !== undefined ? cName : clientName;
    const blAmt = bAmt !== undefined ? bAmt : billAmount;
    const prId = pId !== undefined ? pId : selectedProjectId;

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const portalLink = prId ? `${origin}/sign/${prId}` : `${origin}/sign`;

    setSubject(replacePlaceholders(tpl.subject, {
      projectName: prName || 'Project',
      clientName: clName || 'Client',
      billAmount: blAmt ? Number(blAmt).toLocaleString('en-IN') : '0.00',
    }));

    setBody(replacePlaceholders(tpl.body, {
      projectName: prName || 'Project',
      clientName: clName || 'Valued Client',
      billAmount: blAmt ? Number(blAmt).toLocaleString('en-IN') : '0.00',
      portalLink: portalLink,
    }));
  }, [projectName, clientName, billAmount, selectedProjectId]);

  const loadData = useCallback(async () => {
    try {
      const pList = await getAllProjects();
      const loadedProjects = pList || [];
      setProjects(loadedProjects);

      const pdfs = await getAllPdfFiles();
      const loadedPdfs = pdfs || [];
      setPdfFiles(loadedPdfs);

      const dList = await mailApi.getDrafts();
      setDrafts(dList || []);
      const lList = await mailApi.getLogs();
      setLogs(lList || []);

      // Auto-hydrate first project if none selected
      if (loadedProjects.length > 0 && !selectedProjectId) {
        const first = loadedProjects[0];
        setSelectedProjectId(first._id);
        setProjectName(first.name || '');
        setClientName(first.clientName || '');
        setBillAmount(first.totalAmount ? String(first.totalAmount) : '');

        if (first.clientEmail) {
          setToList([first.clientEmail]);
        }

        const matchingPdfs = loadedPdfs.filter(p => p.projectId === first._id || p.projectName === first.name);
        if (matchingPdfs.length > 0) {
          setSelectedPdfIds(matchingPdfs.map(p => p._id));
        }

        applyTemplate('ra_bill', first.name, first.clientName, first.totalAmount, first._id);
      } else if (!body) {
        applyTemplate('ra_bill', '', '', '', '');
      }
    } catch {
      // silent fallback
    }
  }, [selectedProjectId, body, applyTemplate]);

  useEffect(() => {
    loadSettings();
    loadData();
  }, [loadSettings, loadData]);

  // Handle Project Selection in Compose
  const handleSelectProject = (projId) => {
    setSelectedProjectId(projId);
    if (!projId) {
      setProjectName('');
      setClientName('');
      setBillAmount('');
      setSelectedPdfIds([]);
      applyTemplate(activeTemplate, '', '', '', '');
      return;
    }
    const found = projects.find(p => p._id === projId);
    if (found) {
      setProjectName(found.name || '');
      setClientName(found.clientName || '');
      setBillAmount(found.totalAmount ? String(found.totalAmount) : '');

      if (found.clientEmail && !toList.includes(found.clientEmail)) {
        setToList([found.clientEmail]);
      }

      const matchingPdfs = pdfFiles.filter(p => p.projectId === projId || p.projectName === found.name);
      setSelectedPdfIds(matchingPdfs.map(p => p._id));

      applyTemplate(activeTemplate, found.name, found.clientName, found.totalAmount, projId);
    }
  };

  const handleApplyTemplate = (tplId) => {
    applyTemplate(tplId, projectName, clientName, billAmount, selectedProjectId);
  };

  const handleAddEmail = (type, val) => {
    const trimmed = val.trim().replace(/^[,\s]+|[,\s]+$/g, '');
    if (!trimmed) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      showToastMsg('error', `"${trimmed}" is not a valid email address.`);
      return;
    }

    if (type === 'to') {
      if (!toList.includes(trimmed)) setToList([...toList, trimmed]);
      setToInput('');
      setShowRecipientDropdown(false);
    } else {
      if (!ccList.includes(trimmed)) setCcList([...ccList, trimmed]);
      setCcInput('');
    }
  };

  const removeEmail = (type, idx) => {
    if (type === 'to') setToList(toList.filter((_, i) => i !== idx));
    else setCcList(ccList.filter((_, i) => i !== idx));
  };

  const togglePdf = (pdfId) => {
    if (selectedPdfIds.includes(pdfId)) {
      setSelectedPdfIds(selectedPdfIds.filter(id => id !== pdfId));
    } else {
      setSelectedPdfIds([...selectedPdfIds, pdfId]);
    }
  };

  const toggleAllPdfs = () => {
    const relevantIds = relevantPdfs.map(p => p._id);
    if (relevantIds.every(id => selectedPdfIds.includes(id))) {
      setSelectedPdfIds(selectedPdfIds.filter(id => !relevantIds.includes(id)));
    } else {
      setSelectedPdfIds(Array.from(new Set([...selectedPdfIds, ...relevantIds])));
    }
  };

  const handleDownloadPdf = async (pdf) => {
    try {
      if (pdf.base64Data) {
        downloadPdfFromBase64(pdf.fileName, pdf.base64Data);
      } else if (pdf._id) {
        const fullPdf = await getPdfFile(pdf._id);
        if (fullPdf && fullPdf.base64Data) {
          downloadPdfFromBase64(fullPdf.fileName || pdf.fileName, fullPdf.base64Data);
        } else {
          showToastMsg('error', 'PDF data is unavailable.');
        }
      }
    } catch (err) {
      showToastMsg('error', 'Could not open PDF: ' + err.message);
    }
  };

  const handleUploadCustom = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach(file => {
      if (file.size > 15 * 1024 * 1024) {
        showToastMsg('error', `File ${file.name} exceeds 15MB limit.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setCustomAttachments(prev => [
          ...prev,
          {
            fileName: file.name,
            contentType: file.type || 'application/octet-stream',
            base64Data: reader.result,
            size: file.size,
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleInsertTag = (tag) => {
    const tagMap = {
      clientName: '{{clientName}}',
      projectName: '{{projectName}}',
      billAmount: '{{billAmount}}',
      portalLink: '{{portalLink}}',
      date: '{{date}}'
    };
    const toInsert = tagMap[tag] || '';
    if (!toInsert) return;

    const textarea = textareaRef.current;
    if (!textarea) {
      setBody(prev => prev + ' ' + toInsert);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newBody = body.substring(0, start) + toInsert + body.substring(end);
    setBody(newBody);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + toInsert.length, start + toInsert.length);
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

  // Save Draft
  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      const payload = {
        title: subject || `Draft - ${projectName || 'Untitled'}`,
        to: toList,
        cc: ccList,
        subject: subject,
        body: body,
        templateId: activeTemplate,
        projectId: selectedProjectId || null,
        attachedPdfIds: selectedPdfIds,
        customAttachments: customAttachments,
      };

      let res;
      if (draftId) {
        res = await mailApi.updateDraft(draftId, payload);
        showToastMsg('success', 'Draft updated successfully.');
      } else {
        res = await mailApi.saveDraft(payload);
        setDraftId(res._id);
        showToastMsg('success', 'Draft saved to your workspace.');
      }
      const updated = await mailApi.getDrafts();
      setDrafts(updated || []);
    } catch (err) {
      showToastMsg('error', 'Failed to save draft: ' + err.message);
    } finally {
      setSavingDraft(false);
    }
  };

  const handleResumeDraft = (draft) => {
    setDraftId(draft._id);
    setToList(draft.to || []);
    setCcList(draft.cc || []);
    setShowCc(Boolean(draft.cc?.length));
    setSubject(draft.subject || '');
    setBody(draft.body || '');
    setActiveTemplate(draft.templateId || 'ra_bill');
    setSelectedProjectId(draft.projectId || '');
    setSelectedPdfIds(draft.attachedPdfIds || []);
    setCustomAttachments(draft.customAttachments || []);

    if (draft.projectId) {
      const p = projects.find(pr => pr._id === draft.projectId);
      if (p) {
        setProjectName(p.name || '');
        setClientName(p.clientName || '');
        setBillAmount(p.totalAmount ? String(p.totalAmount) : '');
      }
    }

    setActiveTab('compose');
    showToastMsg('success', `Resumed draft "${draft.title || draft.subject}"`);
  };

  const handleDeleteDraft = async (dId) => {
    if (!window.confirm('Delete this saved draft?')) return;
    try {
      await mailApi.deleteDraft(dId);
      setDrafts(drafts.filter(d => d._id !== dId));
      if (draftId === dId) setDraftId(null);
      showToastMsg('success', 'Draft deleted.');
    } catch (err) {
      showToastMsg('error', 'Failed to delete draft: ' + err.message);
    }
  };

  // Send Email
  const handleSend = async (isTest = false) => {
    const recipients = isTest ? [senderEmail || 'hiteshjagdishsuthar@gmail.com'] : toList;
    if (!recipients || recipients.length === 0) {
      showToastMsg('error', 'Please enter at least one recipient email address.');
      return;
    }
    if (!subject.trim()) {
      showToastMsg('error', 'Email subject cannot be empty.');
      return;
    }

    setSending(true);
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const portalLink = selectedProjectId ? `${origin}/sign/${selectedProjectId}` : `${origin}/sign`;
      const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

      const attachedPdfsForEmail = relevantPdfs.filter(p => selectedPdfIds.includes(p._id));
      
      const richHtml = generateLetterheadHtml({
        projectName,
        clientName,
        billAmount,
        portalLink,
        bodyText: body,
        selectedPdfs: attachedPdfsForEmail,
        dateStr
      });

      const payload = {
        to: recipients,
        cc: isTest ? [] : ccList,
        subject: isTest ? `[TEST] ${subject}` : subject,
        bodyText: body,
        bodyHtml: richHtml,
        projectId: selectedProjectId || null,
        projectName: projectName || '',
        clientName: clientName || '',
        attachedPdfIds: selectedPdfIds,
        customAttachments: customAttachments,
        sentBy: session?.user?.name || 'MTS Decor Admin',
      };

      const res = await mailApi.sendEmail(payload);
      showToastMsg(
        'success',
        isTest 
          ? `Test email delivered to your address (${senderEmail})!`
          : `Email successfully dispatched to ${recipients.join(', ')} with ${res.attachmentsCount} PDF attachment(s)!`
      );

      const updatedLogs = await mailApi.getLogs();
      setLogs(updatedLogs || []);

      if (!isTest && draftId) {
        await mailApi.deleteDraft(draftId);
        setDraftId(null);
        const updatedDrafts = await mailApi.getDrafts();
        setDrafts(updatedDrafts || []);
      }
    } catch (err) {
      showToastMsg('error', 'Dispatch failed: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  // Provider Presets Handler
  const handleProviderSelect = (presetId) => {
    setSelectedProvider(presetId);
    const preset = PROVIDER_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    setProviderType(preset.type);
    if (preset.type === 'SMTP') {
      if (preset.host) setSmtpHost(preset.host);
      if (preset.port) setSmtpPort(preset.port);
      if (preset.secure !== undefined) setSmtpSecure(preset.secure);
    }
  };

  // Save Settings
  const handleSaveSmtpSettings = async (e) => {
    e.preventDefault();
    try {
      const configObj = {
        provider: providerType,
        resendApiKey: resendApiKey.trim(),
        senderEmail: smtpSenderEmail.trim(),
        senderName: smtpSenderName.trim(),
        smtpHost: smtpHost.trim(),
        smtpPort: Number(smtpPort),
        secure: Boolean(smtpSecure),
        smtpUser: (smtpUser || smtpSenderEmail).trim(),
        smtpPass: smtpPass.trim(),
        replyTo: smtpSenderEmail.trim(),
      };

      await mailApi.saveConfig(configObj);
      setSenderEmail(smtpSenderEmail.trim());
      setSenderName(smtpSenderName.trim());
      setActiveProvider(providerType);
      if (smtpPass) setHasPassword(true);
      if (resendApiKey) setHasResendKey(true);
      showToastMsg('success', 'Email configuration saved successfully.');
    } catch (err) {
      showToastMsg('error', 'Failed to save settings: ' + err.message);
    }
  };

  // Test Connection
  const handleTestSmtpConnection = async () => {
    if (providerType === 'RESEND') {
      if (!hasResendKey && !resendApiKey.trim()) {
        showToastMsg('error', 'Please enter your Resend API Key.');
        return;
      }
    } else {
      if (!smtpSenderEmail) {
        showToastMsg('error', 'Enter your sender email.');
        return;
      }
      if (!hasPassword && !smtpPass) {
        showToastMsg('error', 'Enter your App Password / SMTP password.');
        return;
      }
    }

    setTestingSmtp(true);
    setSmtpTestResult(null);
    try {
      const configObj = {
        provider: providerType,
        resendApiKey: resendApiKey.trim(),
        senderEmail: smtpSenderEmail.trim() || (providerType === 'RESEND' ? 'onboarding@resend.dev' : ''),
        senderName: smtpSenderName.trim(),
        smtpHost: smtpHost.trim(),
        smtpPort: Number(smtpPort),
        secure: Boolean(smtpSecure),
        smtpUser: (smtpUser || smtpSenderEmail).trim(),
        smtpPass: smtpPass.trim(),
      };
      const target = smtpSenderEmail.trim() || session?.email || 'hiteshjagdishsuthar@gmail.com';
      const res = await mailApi.testConnection(target, configObj);
      setSmtpTestResult({ success: true, message: res.message });
      if (providerType === 'RESEND') {
        setHasResendKey(true);
      } else {
        setHasPassword(true);
      }
      showToastMsg('success', 'Email connection verified successfully!');
    } catch (err) {
      setSmtpTestResult({ success: false, message: err.message });
      showToastMsg('error', 'Connection test failed: ' + err.message);
    } finally {
      setTestingSmtp(false);
    }
  };

  const copySigningLink = () => {
    const link = selectedProjectId ? `${window.location.origin}/sign/${selectedProjectId}` : `${window.location.origin}/sign`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    showToastMsg('success', 'Client approval link copied to clipboard!');
  };

  const relevantPdfs = pdfFiles.filter(p => {
    if (!selectedProjectId) return true;
    return p.projectId === selectedProjectId || (projectName && p.projectName === projectName);
  });

  const allRelevantSelected = relevantPdfs.length > 0 && relevantPdfs.every(p => selectedPdfIds.includes(p._id));

  const totalAttachmentBytes = relevantPdfs
    .filter(p => selectedPdfIds.includes(p._id))
    .reduce((sum, p) => sum + (p.fileSize || 120000), 0) + 
    customAttachments.reduce((sum, c) => sum + (c.size || 0), 0);

  const totalAttachmentMb = (totalAttachmentBytes / (1024 * 1024)).toFixed(2);

  const filteredLogs = logs.filter(l => {
    const q = historySearch.toLowerCase();
    const matchQ = (l.subject || '').toLowerCase().includes(q) || (l.to || []).some(e => e.toLowerCase().includes(q));
    const matchStatus = historyStatusFilter === 'ALL' || l.status === historyStatusFilter;
    return matchQ && matchStatus;
  });

  const filteredDrafts = drafts.filter(d => {
    const q = draftsSearch.toLowerCase();
    return (d.subject || '').toLowerCase().includes(q) || (d.title || '').toLowerCase().includes(q);
  });

  const clientSuggestions = projects
    .filter(p => p.clientEmail && !toList.includes(p.clientEmail))
    .map(p => ({ email: p.clientEmail, name: p.clientName || p.name }));

  const currentPortalLink = selectedProjectId ? `${window.location.origin}/sign/${selectedProjectId}` : `${window.location.origin}/sign`;

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ backgroundColor: '#f8fafc', color: '#0f172a', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      
      {/* ── TOP EXECUTIVE ENTERPRISE HEADER ── */}
      <header className="sticky-top bg-white border-bottom shadow-xs" style={{ borderColor: '#e2e8f0', zIndex: 100 }}>
        <div className="container-fluid px-4 py-2.5 d-flex align-items-center justify-content-between">
          
          {/* Brand & Back Button */}
          <div className="d-flex align-items-center gap-3">
            <Link 
              to="/projects" 
              className="btn btn-sm btn-white border text-slate-700 d-flex align-items-center gap-1.5 fw-semibold px-2.5 py-1.5 shadow-xs transition-all hover:bg-slate-50"
              style={{ borderColor: '#e2e8f0', fontSize: '12px' }}
            >
              <ArrowLeft size={15} className="text-slate-500" />
              <span>Projects</span>
            </Link>

            <div className="vr" style={{ height: '24px', backgroundColor: '#e2e8f0' }} />

            <div className="d-flex align-items-center gap-2.5">
              <div 
                className="d-flex align-items-center justify-content-center rounded-3 text-white shadow-xs" 
                style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)' }}
              >
                <Mail size={18} />
              </div>
              <div>
                <div className="d-flex align-items-center gap-2">
                  <span className="fw-bold fs-6 text-slate-900" style={{ letterSpacing: '-0.3px' }}>MTS DECOR</span>
                  <span 
                    className="badge rounded-pill fw-semibold px-2 py-0.5" 
                    style={{ fontSize: '10px', backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}
                  >
                    ENTERPRISE STUDIO
                  </span>
                </div>
                <div className="text-slate-500 d-none d-md-block" style={{ fontSize: '11px', marginTop: '-1px' }}>
                  Client billing delivery, measurement sign-off & dispatch audit trail
                </div>
              </div>
            </div>
          </div>

          {/* Center Tabs: Segmented Modern Pill */}
          <div 
            className="d-flex align-items-center p-1 rounded-pill bg-slate-100 shadow-inner" 
            style={{ backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0' }}
          >
            <button
              type="button"
              className={`btn btn-sm rounded-pill px-3.5 py-1.5 fw-semibold d-flex align-items-center gap-1.5 transition-all ${
                activeTab === 'compose' 
                  ? 'bg-white text-slate-900 shadow-xs border' 
                  : 'text-slate-600 border-0 hover:text-slate-900'
              }`}
              style={{ fontSize: '12px', borderColor: activeTab === 'compose' ? '#cbd5e1' : 'transparent' }}
              onClick={() => setActiveTab('compose')}
            >
              <Send size={13} className={activeTab === 'compose' ? 'text-blue-600' : 'text-slate-400'} />
              <span>Compose</span>
            </button>

            <button
              type="button"
              className={`btn btn-sm rounded-pill px-3.5 py-1.5 fw-semibold d-flex align-items-center gap-1.5 transition-all position-relative ${
                activeTab === 'drafts' 
                  ? 'bg-white text-slate-900 shadow-xs border' 
                  : 'text-slate-600 border-0 hover:text-slate-900'
              }`}
              style={{ fontSize: '12px', borderColor: activeTab === 'drafts' ? '#cbd5e1' : 'transparent' }}
              onClick={() => setActiveTab('drafts')}
            >
              <FileText size={13} className={activeTab === 'drafts' ? 'text-blue-600' : 'text-slate-400'} />
              <span>Drafts</span>
              {drafts.length > 0 && (
                <span 
                  className="badge rounded-pill ms-1 fw-bold" 
                  style={{ fontSize: '9px', backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5' }}
                >
                  {drafts.length}
                </span>
              )}
            </button>

            <button
              type="button"
              className={`btn btn-sm rounded-pill px-3.5 py-1.5 fw-semibold d-flex align-items-center gap-1.5 transition-all ${
                activeTab === 'history' 
                  ? 'bg-white text-slate-900 shadow-xs border' 
                  : 'text-slate-600 border-0 hover:text-slate-900'
              }`}
              style={{ fontSize: '12px', borderColor: activeTab === 'history' ? '#cbd5e1' : 'transparent' }}
              onClick={() => setActiveTab('history')}
            >
              <Clock size={13} className={activeTab === 'history' ? 'text-blue-600' : 'text-slate-400'} />
              <span>Audit Logs</span>
            </button>

            <button
              type="button"
              className={`btn btn-sm rounded-pill px-3.5 py-1.5 fw-semibold d-flex align-items-center gap-1.5 transition-all ${
                activeTab === 'settings' 
                  ? 'bg-white text-slate-900 shadow-xs border' 
                  : 'text-slate-600 border-0 hover:text-slate-900'
              }`}
              style={{ fontSize: '12px', borderColor: activeTab === 'settings' ? '#cbd5e1' : 'transparent' }}
              onClick={() => setActiveTab('settings')}
            >
              <Settings size={13} className={activeTab === 'settings' ? 'text-blue-600' : 'text-slate-400'} />
              <span>Settings</span>
            </button>
          </div>

          {/* Right Status Pill */}
          <div className="d-none d-lg-flex align-items-center gap-2.5 px-3 py-1.5 rounded-pill bg-white border shadow-xs" style={{ borderColor: '#e2e8f0' }}>
            <span className="d-inline-block rounded-circle" style={{ width: '8px', height: '8px', backgroundColor: '#10b981', boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)' }} />
            <span className="small text-slate-500 fw-bold" style={{ fontSize: '11px' }}>SENDER:</span>
            <span className="small font-monospace fw-semibold text-slate-900" style={{ fontSize: '12px' }}>
              {senderEmail || 'hiteshjagdishsuthar@gmail.com'}
            </span>
          </div>
        </div>
      </header>

      {/* ── MAIN WORKSPACE CONTAINER ── */}
      <main className="container-fluid px-4 py-4 flex-grow-1" style={{ maxWidth: '1480px' }}>
        
        {/* ══════════════════════════════════════════════════════
            TAB 1: COMPOSE DISPATCH STUDIO (SPLIT / DUAL VIEW)
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'compose' && (
          <div className="row g-4">
            
            {/* LEFT / MAIN COLUMN: Message Composer */}
            <div className={`col-12 ${viewMode === 'editor-only' ? 'col-xl-8' : viewMode === 'split' ? 'col-xl-7' : 'col-xl-6'}`}>
              <div className="bg-white rounded-3 border shadow-xs overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
                
                {/* 1. PROJECT METADATA & LINKER BAR */}
                <div className="p-3.5 border-bottom" style={{ backgroundColor: '#fbfcfd', borderColor: '#f1f5f9' }}>
                  <div className="row g-2 align-items-center">
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-bold text-slate-600 text-uppercase d-flex align-items-center gap-1.5 m-0 mb-1" style={{ fontSize: '11px', letterSpacing: '0.4px' }}>
                        <FolderCheck size={14} className="text-blue-600" />
                        Target MTS Project:
                      </label>
                      <select
                        className="form-select form-select-sm bg-white border text-slate-900 fw-semibold shadow-xs"
                        style={{ borderColor: '#cbd5e1', fontSize: '13px' }}
                        value={selectedProjectId}
                        onChange={e => handleSelectProject(e.target.value)}
                      >
                        <option value="">-- Choose MTS Decor Project --</option>
                        {projects.map(p => (
                          <option key={p._id} value={p._id}>
                            {p.name} {p.clientName ? `• ${p.clientName}` : ''} {p.totalAmount ? `(₹${Number(p.totalAmount).toLocaleString('en-IN')})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quick Project Summary Badges */}
                    <div className="col-12 col-md-6">
                      <div className="d-flex flex-wrap align-items-center justify-content-md-end gap-1.5 mt-2 mt-md-0">
                        {projectName && (
                          <div className="px-2.5 py-1 rounded-2 bg-white border shadow-xs d-flex align-items-center gap-1.5" style={{ borderColor: '#e2e8f0', fontSize: '11.5px' }}>
                            <span className="text-slate-500">Client:</span>
                            <strong className="text-slate-900">{clientName || 'Valued Client'}</strong>
                          </div>
                        )}
                        {billAmount && (
                          <div className="px-2.5 py-1 rounded-2 bg-white border shadow-xs d-flex align-items-center gap-1.5" style={{ borderColor: '#e2e8f0', fontSize: '11.5px' }}>
                            <span className="text-slate-500">Bill:</span>
                            <strong className="text-emerald-700">₹{Number(billAmount).toLocaleString('en-IN')}</strong>
                          </div>
                        )}
                        {selectedProjectId && (
                          <button
                            type="button"
                            className="btn btn-sm btn-light border text-slate-600 py-1 px-2 d-flex align-items-center gap-1 shadow-xs"
                            style={{ borderColor: '#e2e8f0', fontSize: '11px' }}
                            onClick={copySigningLink}
                            title="Copy client digital sign portal link"
                          >
                            {copiedLink ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                            <span className="d-none d-sm-inline">{copiedLink ? 'Copied' : 'Sign Link'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. RECIPIENT & TEMPLATE BAR */}
                <div className="p-4 pb-2">
                  
                  {/* Sender Notification Bar */}
                  <div className="d-flex align-items-center justify-content-between px-3 py-2 rounded-2 mb-3 bg-slate-50 border" style={{ borderColor: '#e2e8f0' }}>
                    <div className="d-flex align-items-center gap-2">
                      <span className="text-slate-500 small fw-bold" style={{ fontSize: '11px' }}>SENDING FROM:</span>
                      <span className="font-monospace fw-semibold small text-slate-800">{senderEmail || 'hiteshjagdishsuthar@gmail.com'}</span>
                      <span className="badge bg-white text-slate-600 border shadow-xs" style={{ fontSize: '10px' }}>{senderName}</span>
                    </div>
                    <button 
                      type="button" 
                      className="btn btn-link p-0 text-blue-600 small text-decoration-none fw-semibold" 
                      style={{ fontSize: '11px' }}
                      onClick={() => setActiveTab('settings')}
                    >
                      Configure SMTP
                    </button>
                  </div>

                  {/* To (Client Recipient Email) with Auto-Suggest */}
                  <div className="mb-3 position-relative">
                    <div className="d-flex justify-content-between align-items-center mb-1.5">
                      <label className="form-label small fw-semibold text-slate-700 m-0">To (Client Recipient Email):</label>
                      <div className="d-flex align-items-center gap-2">
                        {clientSuggestions.length > 0 && (
                          <div className="dropdown">
                            <button 
                              type="button" 
                              className="btn btn-link p-0 text-blue-600 text-decoration-none small fw-semibold d-flex align-items-center gap-1"
                              style={{ fontSize: '11px' }}
                              onClick={() => setShowRecipientDropdown(!showRecipientDropdown)}
                            >
                              <User size={12} />
                              <span>Select Recent Client ({clientSuggestions.length})</span>
                              <ChevronDown size={11} />
                            </button>
                            {showRecipientDropdown && (
                              <div className="dropdown-menu show shadow-lg border p-1 rounded-2 end-0 mt-1" style={{ minWidth: '260px', zIndex: 1050, borderColor: '#cbd5e1' }}>
                                <div className="px-2 py-1 small text-slate-500 fw-bold border-bottom" style={{ fontSize: '11px' }}>
                                  Available Project Clients:
                                </div>
                                {clientSuggestions.map((c, i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    className="dropdown-item px-2 py-1.5 rounded-1 small d-flex flex-column"
                                    onClick={() => handleAddEmail('to', c.email)}
                                  >
                                    <span className="fw-semibold text-slate-900">{c.name}</span>
                                    <span className="text-slate-500 font-monospace" style={{ fontSize: '11px' }}>{c.email}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        {!showCc && (
                          <button 
                            type="button" 
                            className="btn btn-link p-0 text-slate-500 text-decoration-none small fw-medium ms-2" 
                            style={{ fontSize: '11px' }}
                            onClick={() => setShowCc(true)}
                          >
                            + Add CC
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div 
                      className="d-flex flex-wrap align-items-center gap-1.5 p-2 rounded-2 border bg-white" 
                      style={{ borderColor: '#cbd5e1', minHeight: '44px', transition: 'border-color 0.15s ease' }}
                    >
                      {toList.map((email, i) => (
                        <span 
                          key={i} 
                          className="badge d-inline-flex align-items-center gap-1.5 fw-medium px-2.5 py-1 rounded-2 shadow-xs"
                          style={{ backgroundColor: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', fontSize: '12px' }}
                        >
                          <Mail size={12} className="text-blue-500" />
                          <span>{email}</span>
                          <button 
                            type="button" 
                            className="btn btn-link p-0 text-blue-700 hover:text-blue-900" 
                            style={{ lineHeight: 1 }}
                            onClick={() => removeEmail('to', i)}
                          >
                            <X size={13} />
                          </button>
                        </span>
                      ))}
                      <input
                        type="email"
                        className="border-0 bg-transparent text-slate-900 small flex-grow-1"
                        style={{ outline: 'none', minWidth: '240px', padding: '3px 6px', fontSize: '13px' }}
                        placeholder={toList.length === 0 ? "Enter client email (e.g. client@acme.com) & press Enter..." : "Add another client..."}
                        value={toInput}
                        onChange={e => setToInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault();
                            handleAddEmail('to', toInput);
                          }
                        }}
                        onBlur={() => handleAddEmail('to', toInput)}
                      />
                    </div>
                  </div>

                  {/* CC Field */}
                  {showCc && (
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-1.5">
                        <label className="form-label small fw-semibold text-slate-700 m-0">CC Email (Audit Copy / Supervisors):</label>
                        <button 
                          type="button" 
                          className="btn btn-link p-0 text-slate-500 text-decoration-none small" 
                          style={{ fontSize: '11px' }}
                          onClick={() => setShowCc(false)}
                        >
                          Hide CC
                        </button>
                      </div>
                      <div 
                        className="d-flex flex-wrap align-items-center gap-1.5 p-2 rounded-2 border bg-white" 
                        style={{ borderColor: '#cbd5e1', minHeight: '40px' }}
                      >
                        {ccList.map((email, i) => (
                          <span 
                            key={i} 
                            className="badge d-inline-flex align-items-center gap-1.5 fw-medium px-2 py-1 rounded-2 shadow-xs"
                            style={{ backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', fontSize: '12px' }}
                          >
                            {email}
                            <button 
                              type="button" 
                              className="btn btn-link p-0 text-slate-500" 
                              style={{ lineHeight: 1 }}
                              onClick={() => removeEmail('cc', i)}
                            >
                              <X size={13} />
                            </button>
                          </span>
                        ))}
                        <input
                          type="email"
                          className="border-0 bg-transparent text-slate-900 small flex-grow-1"
                          style={{ outline: 'none', minWidth: '180px', padding: '2px 4px', fontSize: '13px' }}
                          placeholder="Add CC email..."
                          value={ccInput}
                          onChange={e => setCcInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ',') {
                              e.preventDefault();
                              handleAddEmail('cc', ccInput);
                            }
                          }}
                          onBlur={() => handleAddEmail('cc', ccInput)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Subject Line */}
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-slate-700 mb-1">Subject Line:</label>
                    <input
                      type="text"
                      className="form-control text-slate-900 fw-semibold bg-white border shadow-xs"
                      style={{ borderColor: '#cbd5e1', fontSize: '13.5px' }}
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      placeholder="e.g. RA Bill Submission: Project Name — MTS Decor"
                    />
                  </div>

                  {/* Template Selector Bar */}
                  <div 
                    className="p-2.5 px-3 rounded-2 mb-3 border d-flex flex-wrap align-items-center justify-content-between gap-2" 
                    style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
                  >
                    <div className="d-flex flex-wrap align-items-center gap-1.5">
                      <span className="small text-slate-600 fw-bold d-flex align-items-center gap-1.5 me-1" style={{ fontSize: '11.5px' }}>
                        <Sparkles size={14} className="text-amber-500" />
                        Templates:
                      </span>
                      {EMAIL_TEMPLATES.map(tpl => {
                        const isSelected = activeTemplate === tpl.id;
                        return (
                          <button
                            key={tpl.id}
                            type="button"
                            className={`btn btn-sm rounded-pill px-3 py-1 fw-semibold transition-all shadow-xs ${
                              isSelected 
                                ? 'btn-primary text-white' 
                                : 'btn-white border text-slate-700 hover:bg-slate-50'
                            }`}
                            style={{ 
                              fontSize: '11px', 
                              backgroundColor: isSelected ? '#2563eb' : '#ffffff',
                              borderColor: isSelected ? '#1d4ed8' : '#cbd5e1' 
                            }}
                            onClick={() => handleApplyTemplate(tpl.id)}
                          >
                            {tpl.name}
                          </button>
                        );
                      })}
                    </div>

                    {/* View Switcher: Split vs Editor Only */}
                    <div className="d-none d-xl-flex align-items-center p-0.5 rounded-pill border bg-white" style={{ borderColor: '#cbd5e1' }}>
                      <button
                        type="button"
                        className={`btn btn-sm rounded-pill py-0.5 px-2.5 fw-semibold ${viewMode === 'split' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600'}`}
                        style={{ fontSize: '11px' }}
                        onClick={() => setViewMode('split')}
                        title="Side-by-side Composer & Live Letterhead"
                      >
                        <Columns size={12} className="me-1" />
                        Split View
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm rounded-pill py-0.5 px-2.5 fw-semibold ${viewMode === 'editor-only' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600'}`}
                        style={{ fontSize: '11px' }}
                        onClick={() => setViewMode('editor-only')}
                        title="Focused Full Editor"
                      >
                        Editor
                      </button>
                    </div>
                  </div>

                </div>

                {/* 3. EDITOR BODY */}
                <div className="px-4 pb-4">
                  <div>
                    {/* Rich Formatting Toolbar */}
                    <div 
                      className="d-flex flex-wrap align-items-center justify-content-between p-2 rounded-top border border-bottom-0 bg-slate-50" 
                      style={{ borderColor: '#cbd5e1' }}
                    >
                      {/* Formatting Buttons */}
                      <div className="d-flex align-items-center gap-1">
                        <button 
                          type="button" 
                          className="btn btn-sm btn-white border text-slate-700 p-1 px-2 shadow-xs" 
                          style={{ borderColor: '#e2e8f0' }}
                          title="Bold"
                          onClick={() => applyFormat('**', '**')}
                        >
                          <Bold size={13} />
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-sm btn-white border text-slate-700 p-1 px-2 shadow-xs" 
                          style={{ borderColor: '#e2e8f0' }}
                          title="Italic"
                          onClick={() => applyFormat('*', '*')}
                        >
                          <Italic size={13} />
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-sm btn-white border text-slate-700 p-1 px-2 shadow-xs" 
                          style={{ borderColor: '#e2e8f0' }}
                          title="Heading"
                          onClick={() => applyFormat('\n## ')}
                        >
                          <Heading2 size={13} />
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-sm btn-white border text-slate-700 p-1 px-2 shadow-xs" 
                          style={{ borderColor: '#e2e8f0' }}
                          title="Bullet List"
                          onClick={() => applyFormat('\n• ')}
                        >
                          <List size={13} />
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-sm btn-white border text-slate-700 p-1 px-2 shadow-xs" 
                          style={{ borderColor: '#e2e8f0' }}
                          title="Quote"
                          onClick={() => applyFormat('\n> ')}
                        >
                          <Quote size={13} />
                        </button>
                      </div>

                      {/* Dynamic Tag Chips */}
                      <div className="d-flex flex-wrap align-items-center gap-1 mt-1 mt-md-0">
                        <span className="small text-slate-500 me-1" style={{ fontSize: '11px' }}>Insert Tags:</span>
                        {[
                          { k: 'clientName', l: 'Client' },
                          { k: 'projectName', l: 'Project' },
                          { k: 'billAmount', l: 'Amount (₹)' },
                          { k: 'portalLink', l: 'Sign Portal Link' },
                          { k: 'date', l: 'Date' }
                        ].map(item => (
                          <button
                            key={item.k}
                            type="button"
                            className="btn btn-sm btn-white border text-slate-700 py-0.5 px-2 rounded-pill fw-medium shadow-xs"
                            style={{ fontSize: '10.5px', borderColor: '#cbd5e1' }}
                            onClick={() => handleInsertTag(item.k)}
                          >
                            + &#123;&#123;{item.l}&#125;&#125;
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Textarea Input */}
                    <textarea
                      ref={textareaRef}
                      rows={12}
                      className="form-control text-slate-900 bg-white border font-monospace small rounded-bottom rounded-top-0 shadow-xs"
                      style={{ borderColor: '#cbd5e1', lineHeight: 1.6, fontSize: '12.5px' }}
                      value={body}
                      onChange={e => setBody(e.target.value)}
                      placeholder="Write your email message here..."
                    />
                  </div>
                </div>

                {/* 4. BOTTOM ACTION STRIP */}
                <div className="d-flex align-items-center justify-content-between p-3.5 px-4 border-top bg-slate-50" style={{ borderColor: '#e2e8f0' }}>
                  <div className="d-flex gap-2">
                    <button 
                      type="button" 
                      className="btn btn-sm btn-white border text-slate-700 fw-medium d-flex align-items-center gap-1.5 px-3 py-1.5 shadow-xs" 
                      style={{ borderColor: '#cbd5e1' }}
                      onClick={handleSaveDraft} 
                      disabled={savingDraft}
                    >
                      <Save size={14} className="text-slate-500" />
                      <span>{savingDraft ? 'Saving...' : 'Save Draft'}</span>
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-sm btn-white border text-slate-700 fw-medium d-flex align-items-center gap-1.5 px-3 py-1.5 shadow-xs" 
                      style={{ borderColor: '#cbd5e1' }}
                      onClick={() => handleSend(true)} 
                      disabled={sending}
                      title="Send a verification test copy directly to your email"
                    >
                      <RefreshCw size={13} className={`text-slate-500 ${sending ? 'spin' : ''}`} />
                      Send Test to Self
                    </button>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary px-4 py-2 fw-bold shadow-xs d-flex align-items-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)', border: 'none' }}
                    onClick={() => handleSend(false)}
                    disabled={sending}
                  >
                    <Send size={15} className={sending ? 'spin' : ''} />
                    <span>{sending ? 'Dispatching...' : `Dispatch to Client (${toList.length})`}</span>
                  </button>
                </div>

              </div>
            </div>

            {/* RIGHT COLUMN: Split Live Letterhead Preview & PDF Drawer */}
            <div className={`col-12 ${viewMode === 'editor-only' ? 'col-xl-4' : viewMode === 'split' ? 'col-xl-5' : 'col-xl-6'}`}>
              
              {/* LIVE CLIENT LETTERHEAD PREVIEW CARD */}
              <div className="bg-white rounded-3 border shadow-xs p-4 mb-4" style={{ borderColor: '#e2e8f0' }}>
                <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom" style={{ borderColor: '#f1f5f9' }}>
                  <div className="d-flex align-items-center gap-2">
                    <Eye size={16} className="text-blue-600" />
                    <h6 className="m-0 fw-bold text-slate-900 small">Live Client Letterhead Preview</h6>
                  </div>
                  <span className="badge rounded-pill fw-semibold px-2 py-0.5" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontSize: '10.5px' }}>
                    HTML Ready
                  </span>
                </div>

                {/* Rendered Letterhead Shell */}
                <div className="border rounded-3 overflow-hidden shadow-xs" style={{ borderColor: '#cbd5e1' }}>
                  {/* Top Luxury Banner */}
                  <div className="p-3 text-white d-flex align-items-center justify-content-between" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)' }}>
                    <div>
                      <div className="fw-bold fs-6" style={{ letterSpacing: '0.5px' }}>MTS DECOR</div>
                      <div style={{ fontSize: '9.5px', color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Architectural & Interior Measurements
                      </div>
                    </div>
                    <div className="text-end font-monospace" style={{ fontSize: '10.5px', color: '#cbd5e1' }}>
                      {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>

                  {/* Letterhead Body Content */}
                  <div className="p-3.5 bg-white">
                    {/* Executive Summary Card */}
                    <div className="p-2.5 rounded-2 mb-3 border bg-slate-50 small" style={{ borderColor: '#e2e8f0', fontSize: '12px' }}>
                      <div className="d-flex justify-content-between pb-1 mb-1 border-bottom border-dashed" style={{ borderColor: '#e2e8f0' }}>
                        <span className="text-slate-500">Project:</span>
                        <strong className="text-slate-900">{projectName || 'Project Execution'}</strong>
                      </div>
                      <div className="d-flex justify-content-between pb-1 mb-1 border-bottom border-dashed" style={{ borderColor: '#e2e8f0' }}>
                        <span className="text-slate-500">Client:</span>
                        <strong className="text-slate-900">{clientName || 'Valued Client'}</strong>
                      </div>
                      <div className="d-flex justify-content-between pt-1">
                        <span className="text-slate-900 fw-semibold">Bill Amount:</span>
                        <strong className="text-emerald-700 fs-6">₹{billAmount ? Number(billAmount).toLocaleString('en-IN') : '0.00'}</strong>
                      </div>
                    </div>

                    {/* Email Message Content */}
                    <div className="text-slate-800 small font-monospace mb-3" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.65, fontSize: '11.5px', maxHeight: '180px', overflow: 'auto' }}>
                      {replacePlaceholders(body, {
                        projectName: projectName || 'Project',
                        clientName: clientName || 'Valued Client',
                        billAmount: billAmount ? Number(billAmount).toLocaleString('en-IN') : '0.00',
                        portalLink: currentPortalLink,
                        date: new Date().toLocaleDateString('en-IN')
                      })}
                    </div>

                    {/* Action Button Preview */}
                    <div className="text-center my-3">
                      <a 
                        href={currentPortalLink} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="btn btn-sm btn-primary px-3 py-1.5 fw-bold shadow-xs text-decoration-none d-inline-flex align-items-center gap-1.5"
                        style={{ fontSize: '11.5px', background: '#2563eb' }}
                      >
                        <span>Review & Digitally Sign Bill</span>
                        <ArrowUpRight size={13} />
                      </a>
                    </div>

                    {/* Attached Bills List Preview */}
                    {selectedPdfIds.length > 0 && (
                      <div className="p-2 rounded bg-slate-50 border small" style={{ borderColor: '#e2e8f0' }}>
                        <span className="fw-bold text-slate-600 d-block mb-1" style={{ fontSize: '10.5px' }}>
                          Attached PDFs ({selectedPdfIds.length}):
                        </span>
                        {relevantPdfs.filter(p => selectedPdfIds.includes(p._id)).map(p => (
                          <div key={p._id} className="text-truncate text-blue-700 fw-semibold" style={{ fontSize: '11px' }}>
                            • {p.fileName}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Letterhead Footer */}
                  <div className="p-2.5 px-3 bg-slate-100 border-top text-center text-slate-500" style={{ fontSize: '10px', borderColor: '#e2e8f0' }}>
                    Official dispatch from <strong>MTS Decor Billing Team</strong> • TLS 1.3 Verified
                  </div>
                </div>
              </div>

              {/* PDF ATTACHMENTS CARD */}
              <div className="bg-white rounded-3 border p-4 shadow-xs mb-4" style={{ borderColor: '#e2e8f0' }}>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h6 className="m-0 fw-bold text-slate-900 d-flex align-items-center gap-2">
                    <Paperclip size={16} className="text-blue-600" />
                    PDF Bills & Documents
                  </h6>
                  <span 
                    className="badge rounded-pill fw-semibold px-2 py-0.5" 
                    style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontSize: '11px' }}
                  >
                    {selectedPdfIds.length + customAttachments.length} Selected
                  </span>
                </div>
                
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <p className="text-slate-500 small m-0" style={{ fontSize: '12px' }}>
                    Saved bills generated for this project:
                  </p>
                  {relevantPdfs.length > 0 && (
                    <button 
                      type="button" 
                      className="btn btn-link p-0 text-blue-600 small text-decoration-none fw-semibold"
                      style={{ fontSize: '11.5px' }}
                      onClick={toggleAllPdfs}
                    >
                      {allRelevantSelected ? 'Deselect All' : 'Select All'}
                    </button>
                  )}
                </div>

                {/* Stored Project Bills List */}
                <div className="overflow-auto pe-1 mb-3" style={{ maxHeight: '240px' }}>
                  {relevantPdfs.length === 0 ? (
                    <div className="text-center p-3.5 rounded-3 border border-dashed text-slate-500 small bg-slate-50" style={{ borderColor: '#cbd5e1' }}>
                      <FileCheck2 size={22} className="text-slate-400 mb-1 d-block mx-auto" />
                      <span className="fw-medium text-slate-700">No saved bill PDFs found</span>
                      <div className="mt-0.5" style={{ fontSize: '10.5px' }}>
                        Generate a PDF from your project sheet to attach it here.
                      </div>
                    </div>
                  ) : (
                    relevantPdfs.map(pdf => {
                      const isChecked = selectedPdfIds.includes(pdf._id);
                      return (
                        <div
                          key={pdf._id}
                          className={`d-flex align-items-center justify-content-between p-2.5 rounded-2 mb-2 border transition-all ${
                            isChecked 
                              ? 'bg-blue-50 border-blue-300' 
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                          style={{ 
                            backgroundColor: isChecked ? '#eff6ff' : '#ffffff',
                            borderColor: isChecked ? '#93c5fd' : '#e2e8f0'
                          }}
                        >
                          <label className="d-flex align-items-center gap-2.5 flex-grow-1 m-0 overflow-hidden" style={{ cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              className="form-check-input mt-0"
                              checked={isChecked}
                              onChange={() => togglePdf(pdf._id)}
                            />
                            <div className="p-1 rounded bg-rose-50 text-rose-600 border border-rose-200">
                              <FileText size={15} />
                            </div>
                            <div className="overflow-hidden flex-grow-1">
                              <div className="text-slate-900 small fw-bold text-truncate" style={{ fontSize: '12px' }}>
                                {pdf.fileName}
                              </div>
                              <div className="text-slate-500 d-flex align-items-center gap-1.5" style={{ fontSize: '11px' }}>
                                <span>{pdf.fileSize ? (pdf.fileSize / 1024).toFixed(0) + ' KB' : 'PDF Document'}</span>
                                <span>• {pdf.projectName || 'MTS'}</span>
                              </div>
                            </div>
                          </label>

                          <button
                            type="button"
                            className="btn btn-sm btn-white border text-slate-600 p-1 px-2 ms-2 shadow-xs"
                            style={{ borderColor: '#cbd5e1' }}
                            title="Download/Preview PDF"
                            onClick={() => handleDownloadPdf(pdf)}
                          >
                            <Download size={12} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Custom Uploaded Attachments */}
                {customAttachments.length > 0 && (
                  <div className="mb-3 pt-2 border-top" style={{ borderColor: '#f1f5f9' }}>
                    <span className="small text-slate-700 fw-bold d-block mb-1.5" style={{ fontSize: '11px' }}>
                      Additional Uploaded Files ({customAttachments.length}):
                    </span>
                    {customAttachments.map((att, i) => (
                      <div 
                        key={i} 
                        className="d-flex align-items-center justify-content-between p-2 rounded-2 mb-1.5 bg-slate-50 border small"
                        style={{ borderColor: '#e2e8f0' }}
                      >
                        <div className="d-flex align-items-center gap-1.5 overflow-hidden">
                          <Paperclip size={13} className="text-slate-400" />
                          <span className="text-truncate text-slate-800 fw-semibold" style={{ maxWidth: '180px', fontSize: '11px' }}>
                            {att.fileName}
                          </span>
                        </div>
                        <button 
                          type="button" 
                          className="btn btn-link p-0 text-danger" 
                          onClick={() => setCustomAttachments(prev => prev.filter((_, idx) => idx !== i))}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg"
                  style={{ display: 'none' }}
                  onChange={handleUploadCustom}
                />
                <button
                  type="button"
                  className="btn btn-sm btn-white w-100 py-2 border-dashed rounded-2 text-blue-600 fw-semibold d-flex align-items-center justify-content-center gap-1.5 shadow-xs transition-all hover:bg-blue-50"
                  style={{ borderColor: '#93c5fd', backgroundColor: '#f8fafc' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Plus size={14} />
                  Attach Additional Local File
                </button>
              </div>

              {/* DELIVERY AUDIT & HEALTH STATUS */}
              <div className="bg-white rounded-3 border p-3.5 shadow-xs" style={{ borderColor: '#e2e8f0' }}>
                <div className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom" style={{ borderColor: '#f1f5f9' }}>
                  <div className="d-flex align-items-center gap-1.5 text-slate-900 fw-bold small">
                    <ShieldCheck size={16} className="text-emerald-600" />
                    <span>Security & Transport Health</span>
                  </div>
                  <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200 fw-semibold" style={{ fontSize: '10px' }}>
                    READY
                  </span>
                </div>

                <div className="d-flex flex-column gap-2 small" style={{ fontSize: '11.5px' }}>
                  <div className="d-flex align-items-center justify-content-between">
                    <span className="text-slate-500">Provider:</span>
                    <strong className="text-slate-800">{activeProvider} ({smtpHost})</strong>
                  </div>
                  <div className="d-flex align-items-center justify-content-between">
                    <span className="text-slate-500">Total Payload:</span>
                    <strong className={totalAttachmentBytes > 20 * 1024 * 1024 ? 'text-danger' : 'text-slate-800'}>
                      {totalAttachmentMb} MB / 25 MB Limit
                    </strong>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB 2: SAVED DRAFTS
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'drafts' && (
          <div>
            <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
              <div>
                <h5 className="m-0 fw-bold text-slate-900 fs-5">Saved Email Drafts</h5>
                <span className="text-slate-500 small">Manage prepared bill emails and resume them when ready</span>
              </div>
              <div className="d-flex gap-2">
                <div className="position-relative">
                  <Search size={14} className="position-absolute text-slate-400" style={{ top: '10px', left: '10px' }} />
                  <input
                    type="text"
                    placeholder="Search drafts..."
                    className="form-control form-control-sm bg-white border text-slate-900 ps-4 shadow-xs"
                    style={{ borderColor: '#cbd5e1', width: '220px' }}
                    value={draftsSearch}
                    onChange={e => setDraftsSearch(e.target.value)}
                  />
                </div>
                <button 
                  type="button" 
                  className="btn btn-sm btn-primary fw-semibold d-flex align-items-center gap-1.5 shadow-xs"
                  onClick={() => { setDraftId(null); setActiveTab('compose'); }}
                >
                  <Plus size={14} />
                  New Draft
                </button>
              </div>
            </div>

            {filteredDrafts.length === 0 ? (
              <div className="text-center p-5 rounded-3 bg-white border shadow-xs" style={{ borderColor: '#e2e8f0' }}>
                <FileText size={40} className="text-slate-300 mb-2 d-block mx-auto" />
                <h6 className="text-slate-800 fw-bold mb-1">No Drafts Found</h6>
                <p className="text-slate-500 small mb-3">You do not have any saved bill dispatches right now.</p>
                <button 
                  type="button" 
                  className="btn btn-sm btn-outline-primary fw-medium"
                  onClick={() => { setDraftId(null); setActiveTab('compose'); }}
                >
                  Create a New Draft
                </button>
              </div>
            ) : (
              <div className="row g-3">
                {filteredDrafts.map(d => (
                  <div key={d._id} className="col-12 col-md-6 col-lg-4">
                    <div className="p-3.5 rounded-3 bg-white border h-100 d-flex flex-column justify-content-between shadow-xs transition-all hover:shadow-sm" style={{ borderColor: '#e2e8f0' }}>
                      <div>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span 
                            className="badge fw-semibold px-2 py-0.5 rounded-pill" 
                            style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontSize: '10px' }}
                          >
                            {d.templateId ? d.templateId.toUpperCase() : 'DRAFT'}
                          </span>
                          <span className="text-slate-400 small" style={{ fontSize: '11px' }}>
                            {new Date(d.updatedAt || d.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </span>
                        </div>
                        <h6 className="text-slate-900 fw-bold mb-1 text-truncate" style={{ fontSize: '13.5px' }}>
                          {d.title || d.subject || 'Untitled Draft'}
                        </h6>
                        <div className="text-slate-500 small text-truncate mb-2" style={{ fontSize: '12px' }}>
                          <strong className="text-slate-700">To:</strong> {(d.to || []).join(', ') || 'No recipient specified'}
                        </div>
                        <div 
                          className="p-2.5 rounded-2 bg-slate-50 text-slate-600 small font-monospace mb-3" 
                          style={{ fontSize: '11.5px', maxHeight: '65px', overflow: 'hidden', border: '1px solid #f1f5f9', whiteSpace: 'pre-wrap' }}
                        >
                          {d.body || 'No message content yet.'}
                        </div>
                      </div>

                      <div className="d-flex justify-content-between align-items-center pt-2.5 border-top" style={{ borderColor: '#f1f5f9' }}>
                        <span className="badge bg-slate-100 text-slate-600 border" style={{ fontSize: '10.5px' }}>
                          {(d.attachedPdfIds?.length || 0) + (d.customAttachments?.length || 0)} attached
                        </span>
                        <div className="d-flex gap-1.5">
                          <button 
                            type="button" 
                            className="btn btn-sm btn-white border text-danger p-1 px-2 shadow-xs" 
                            style={{ borderColor: '#e2e8f0' }}
                            onClick={() => handleDeleteDraft(d._id)}
                            title="Delete Draft"
                          >
                            <Trash2 size={13} />
                          </button>
                          <button 
                            type="button" 
                            className="btn btn-sm btn-primary px-3 fw-semibold d-flex align-items-center gap-1 shadow-xs" 
                            onClick={() => handleResumeDraft(d)}
                          >
                            <Send size={12} />
                            Resume
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB 3: DISPATCH HISTORY AUDIT
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'history' && (
          <div>
            <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
              <div>
                <h5 className="m-0 fw-bold text-slate-900 fs-5">Email Dispatch History & Audit Trail</h5>
                <span className="text-slate-500 small">Complete record of bills and measurement sheets dispatched to clients</span>
              </div>
              <div className="d-flex gap-2">
                <select
                  className="form-select form-select-sm bg-white border text-slate-900 shadow-xs"
                  style={{ borderColor: '#cbd5e1', width: '130px' }}
                  value={historyStatusFilter}
                  onChange={e => setHistoryStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Status</option>
                  <option value="SENT">Sent Only</option>
                  <option value="FAILED">Failed Only</option>
                </select>
                <div className="position-relative">
                  <Search size={14} className="position-absolute text-slate-400" style={{ top: '10px', left: '10px' }} />
                  <input
                    type="text"
                    placeholder="Search logs..."
                    className="form-control form-control-sm bg-white border text-slate-900 ps-4 shadow-xs"
                    style={{ borderColor: '#cbd5e1', width: '220px' }}
                    value={historySearch}
                    onChange={e => setHistorySearch(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {filteredLogs.length === 0 ? (
              <div className="text-center p-5 rounded-3 bg-white border shadow-xs" style={{ borderColor: '#e2e8f0' }}>
                <Inbox size={40} className="text-slate-300 mb-2 d-block mx-auto" />
                <h6 className="text-slate-800 fw-bold mb-1">No Dispatch Logs Found</h6>
                <p className="text-slate-500 small mb-0">Emails sent through the MTS software will automatically appear here with a full audit log.</p>
              </div>
            ) : (
              <div className="bg-white rounded-3 border shadow-xs overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
                <div className="table-responsive">
                  <table className="table table-hover m-0 align-middle small">
                    <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <tr>
                        <th className="py-3 px-3 text-uppercase text-slate-600 fw-bold" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>Status</th>
                        <th className="py-3 px-3 text-uppercase text-slate-600 fw-bold" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>Dispatched At</th>
                        <th className="py-3 px-3 text-uppercase text-slate-600 fw-bold" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>Recipient(s)</th>
                        <th className="py-3 px-3 text-uppercase text-slate-600 fw-bold" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>Subject & Project</th>
                        <th className="py-3 px-3 text-uppercase text-slate-600 fw-bold" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>PDFs</th>
                        <th className="py-3 px-3 text-uppercase text-slate-600 fw-bold text-end" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: '#f1f5f9' }}>
                      {filteredLogs.map(l => (
                        <tr key={l._id}>
                          <td className="px-3 py-3">
                            <span 
                              className="badge rounded-pill fw-semibold px-2 py-0.5 d-inline-flex align-items-center gap-1"
                              style={{ 
                                backgroundColor: l.status === 'SENT' ? '#ecfdf5' : '#fef2f2', 
                                color: l.status === 'SENT' ? '#047857' : '#b91c1c',
                                border: l.status === 'SENT' ? '1px solid #a7f3d0' : '1px solid #fecaca',
                                fontSize: '11px'
                              }}
                            >
                              {l.status === 'SENT' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                              {l.status}
                            </span>
                          </td>
                          <td className="px-3 py-3 font-monospace text-slate-500" style={{ fontSize: '11px' }}>
                            {new Date(l.createdAt || l.sentAt).toLocaleString('en-IN')}
                          </td>
                          <td className="px-3 py-3 fw-medium text-slate-900" style={{ fontSize: '12.5px' }}>
                            {(l.to || []).join(', ')}
                          </td>
                          <td className="px-3 py-3">
                            <div className="fw-semibold text-slate-900" style={{ fontSize: '12.5px' }}>{l.subject}</div>
                            {l.projectName && (
                              <span className="badge bg-slate-100 text-slate-700 border mt-0.5" style={{ fontSize: '10px' }}>
                                {l.projectName}
                              </span>
                            )}
                            {l.error && <div className="text-danger small mt-1" style={{ fontSize: '11px' }}>{l.error}</div>}
                          </td>
                          <td className="px-3 py-3">
                            {l.attachments?.length > 0 ? (
                              <span 
                                className="badge rounded-pill fw-semibold px-2 py-0.5"
                                style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontSize: '10.5px' }}
                              >
                                {l.attachments.length} PDF(s)
                              </span>
                            ) : (
                              <span className="text-slate-400" style={{ fontSize: '11px' }}>None</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-end">
                            <button
                              type="button"
                              className="btn btn-sm btn-white border text-slate-700 p-1 px-2.5 shadow-xs"
                              style={{ borderColor: '#cbd5e1' }}
                              onClick={() => setPreviewLog(l)}
                              title="View dispatched email details"
                            >
                              <Eye size={13} className="text-slate-500" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB 4: EMAIL SETTINGS & PROVIDER SETUP
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'settings' && (
          <div className="row g-4 justify-content-center">
            <div className="col-12 col-lg-8">
              <div className="bg-white rounded-3 border p-4 shadow-xs" style={{ borderColor: '#e2e8f0' }}>
                
                <div className="d-flex align-items-center justify-content-between pb-3 border-bottom mb-4" style={{ borderColor: '#f1f5f9' }}>
                  <div>
                    <h5 className="fw-bold text-slate-900 m-0 d-flex align-items-center gap-2 fs-5">
                      <Settings size={18} className="text-blue-600" />
                      Email Sender & Provider Configuration
                    </h5>
                    <p className="text-slate-500 small m-0 mt-0.5">
                      Configure your company sender address to dispatch bills directly to clients
                    </p>
                  </div>
                  <span 
                    className="badge rounded-pill px-2.5 py-1 fw-bold"
                    style={{ backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}
                  >
                    Active: {activeProvider}
                  </span>
                </div>

                {/* Preset Cards Grid */}
                <div className="mb-4">
                  <label className="form-label small fw-bold text-slate-700 mb-2 text-uppercase" style={{ fontSize: '11px', letterSpacing: '0.4px' }}>
                    Select Service Provider:
                  </label>
                  <div className="row g-2">
                    {PROVIDER_PRESETS.map(p => {
                      const isSelected = selectedProvider === p.id;
                      return (
                        <div key={p.id} className="col-12 col-md-6">
                          <button
                            type="button"
                            className={`w-100 text-start p-3 rounded-2 border transition-all ${
                              isSelected 
                                ? 'bg-blue-50 border-blue-500 shadow-xs' 
                                : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                            style={{ 
                              backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                              borderColor: isSelected ? '#2563eb' : '#e2e8f0'
                            }}
                            onClick={() => handleProviderSelect(p.id)}
                          >
                            <div className="d-flex align-items-center justify-content-between mb-1">
                              <span className="fw-bold small text-slate-900">{p.name}</span>
                              {isSelected && <Check size={16} className="text-blue-600" />}
                            </div>
                            <div className="text-slate-500 small" style={{ fontSize: '11px' }}>
                              {p.subtitle}
                            </div>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <form onSubmit={handleSaveSmtpSettings}>
                  
                  {/* RESEND FORM */}
                  {providerType === 'RESEND' ? (
                    <div>
                      <div 
                        className="p-3 rounded-2 mb-3 border small" 
                        style={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }}
                      >
                        <div className="d-flex align-items-center justify-content-between mb-1">
                          <strong className="text-blue-700 d-flex align-items-center gap-1.5">
                            <Sparkles size={14} className="text-amber-500" />
                            Resend Developer API
                          </strong>
                          <a 
                            href="https://resend.com/api-keys" 
                            target="_blank" 
                            rel="noreferrer" 
                            className="badge bg-primary text-white text-decoration-none px-2 py-1 shadow-xs"
                          >
                            Resend Console &rarr;
                          </a>
                        </div>
                        <p className="text-slate-600 m-0" style={{ fontSize: '11.5px', lineHeight: 1.5 }}>
                          High deliverability cloud email API. Eliminates server port blocks. Note: Test mode only sends to your registered email until a domain is verified at <code>resend.com/domains</code>.
                        </p>
                      </div>

                      <div className="mb-3">
                        <label className="form-label small fw-semibold text-slate-700 mb-1">Resend API Key *</label>
                        <div className="input-group">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required={!hasResendKey}
                            placeholder={hasResendKey ? '•••••••••••••••• (API Key Active)' : 're_xxxxxxxxxxxxxxxxxxxxxxxx'}
                            className="form-control text-slate-900 font-monospace bg-white border shadow-xs"
                            style={{ borderColor: '#cbd5e1', fontSize: '13px' }}
                            value={resendApiKey}
                            onChange={e => setResendApiKey(e.target.value)}
                          />
                          <button
                            type="button"
                            className="btn btn-white border text-slate-600"
                            style={{ borderColor: '#cbd5e1' }}
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                        <div className="text-slate-500 small mt-1" style={{ fontSize: '11px' }}>
                          Starts with <code>re_</code>. Stored securely in your environment.
                        </div>
                      </div>

                      <div className="row g-3 mb-3">
                        <div className="col-12 col-md-6">
                          <label className="form-label small fw-semibold text-slate-700 mb-1">Sender Email Address</label>
                          <input
                            type="email"
                            placeholder="e.g. billing@yourdomain.com (or onboarding@resend.dev)"
                            className="form-control text-slate-900 bg-white border shadow-xs"
                            style={{ borderColor: '#cbd5e1', fontSize: '13px' }}
                            value={smtpSenderEmail}
                            onChange={e => setSmtpSenderEmail(e.target.value)}
                          />
                        </div>

                        <div className="col-12 col-md-6">
                          <label className="form-label small fw-semibold text-slate-700 mb-1">Sender Display Name</label>
                          <input
                            type="text"
                            placeholder="MTS Decor Billing Team"
                            className="form-control text-slate-900 bg-white border shadow-xs"
                            style={{ borderColor: '#cbd5e1', fontSize: '13px' }}
                            value={smtpSenderName}
                            onChange={e => setSmtpSenderName(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* SMTP FORM */
                    <div>
                      <div className="row g-3 mb-3">
                        <div className="col-12 col-md-6">
                          <label className="form-label small fw-semibold text-slate-700 mb-1">Your Sender Email ID *</label>
                          <input
                            type="email"
                            required
                            placeholder="e.g. hiteshjagdishsuthar@gmail.com"
                            className="form-control text-slate-900 bg-white border fw-semibold shadow-xs"
                            style={{ borderColor: '#cbd5e1', fontSize: '13px' }}
                            value={smtpSenderEmail}
                            onChange={e => {
                              setSmtpSenderEmail(e.target.value);
                              if (!smtpUser) setSmtpUser(e.target.value);
                            }}
                          />
                        </div>

                        <div className="col-12 col-md-6">
                          <label className="form-label small fw-semibold text-slate-700 mb-1">Display Name (Client Inbox)</label>
                          <input
                            type="text"
                            placeholder="MTS Decor Billing Team"
                            className="form-control text-slate-900 bg-white border shadow-xs"
                            style={{ borderColor: '#cbd5e1', fontSize: '13px' }}
                            value={smtpSenderName}
                            onChange={e => setSmtpSenderName(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="row g-3 mb-3">
                        <div className="col-12 col-md-6">
                          <label className="form-label small fw-semibold text-slate-700 mb-1">SMTP Host</label>
                          <input
                            type="text"
                            required
                            className="form-control text-slate-900 font-monospace bg-white border shadow-xs"
                            style={{ borderColor: '#cbd5e1', fontSize: '13px' }}
                            value={smtpHost}
                            onChange={e => setSmtpHost(e.target.value)}
                          />
                        </div>

                        <div className="col-6 col-md-3">
                          <label className="form-label small fw-semibold text-slate-700 mb-1">Port</label>
                          <input
                            type="number"
                            required
                            className="form-control text-slate-900 font-monospace bg-white border shadow-xs"
                            style={{ borderColor: '#cbd5e1', fontSize: '13px' }}
                            value={smtpPort}
                            onChange={e => setSmtpPort(e.target.value)}
                          />
                        </div>

                        <div className="col-6 col-md-3 d-flex align-items-end">
                          <div className="form-check mb-2">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              id="smtpSecureCheck"
                              checked={smtpSecure}
                              onChange={e => setSmtpSecure(e.target.checked)}
                            />
                            <label className="form-check-label small text-slate-700 fw-semibold" htmlFor="smtpSecureCheck">
                              SSL / TLS (465)
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="row g-3 mb-3">
                        <div className="col-12 col-md-6">
                          <label className="form-label small fw-semibold text-slate-700 mb-1">SMTP Username</label>
                          <input
                            type="text"
                            className="form-control text-slate-900 bg-white border shadow-xs"
                            style={{ borderColor: '#cbd5e1', fontSize: '13px' }}
                            value={smtpUser}
                            onChange={e => setSmtpUser(e.target.value)}
                          />
                        </div>

                        <div className="col-12 col-md-6">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <label className="form-label small fw-semibold text-slate-700 m-0">16-Character App Password *</label>
                            {selectedProvider === 'gmail' && (
                              <button 
                                type="button" 
                                className="btn btn-link p-0 text-blue-600 text-decoration-none small fw-semibold" 
                                style={{ fontSize: '11px' }} 
                                onClick={() => setShowGmailHelp(!showGmailHelp)}
                              >
                                <HelpCircle size={12} className="me-1" />
                                Google App Password
                              </button>
                            )}
                          </div>
                          <div className="input-group">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              placeholder={hasPassword ? '•••••••••••••••• (App Password Configured)' : 'Enter 16-character password'}
                              className="form-control text-slate-900 font-monospace bg-white border shadow-xs"
                              style={{ borderColor: '#cbd5e1', fontSize: '13px' }}
                              value={smtpPass}
                              onChange={e => setSmtpPass(e.target.value)}
                            />
                            <button
                              type="button"
                              className="btn btn-white border text-slate-600"
                              style={{ borderColor: '#cbd5e1' }}
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Gmail Help Accordion */}
                      {showGmailHelp && (
                        <div className="p-3 rounded-2 mb-3 border small" style={{ backgroundColor: '#f0f9ff', borderColor: '#bae6fd' }}>
                          <strong className="text-blue-700 d-block mb-1">Google App Password Instructions:</strong>
                          <ol className="m-0 ps-3 text-slate-600" style={{ lineHeight: 1.6, fontSize: '12px' }}>
                            <li>Go to <a href="https://myaccount.google.com/security" target="_blank" rel="noreferrer" className="text-blue-600 fw-semibold">Google Account Security</a>.</li>
                            <li>Ensure <strong>2-Step Verification</strong> is enabled.</li>
                            <li>Search for <strong>"App passwords"</strong> in the top search bar.</li>
                            <li>Create a new password named <strong>"MTS Decor Mail"</strong>.</li>
                            <li>Copy the 16 characters and paste them into the password field above.</li>
                          </ol>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Test Result Alert */}
                  {smtpTestResult && (
                    <div 
                      className="p-3 rounded-2 mb-3 d-flex align-items-center gap-2 small border shadow-xs"
                      style={{ 
                        backgroundColor: smtpTestResult.success ? '#ecfdf5' : '#fef2f2',
                        borderColor: smtpTestResult.success ? '#a7f3d0' : '#fecaca',
                        color: smtpTestResult.success ? '#047857' : '#b91c1c'
                      }}
                    >
                      {smtpTestResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                      <span className="fw-semibold">{smtpTestResult.message}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="d-flex justify-content-between align-items-center pt-3 border-top" style={{ borderColor: '#f1f5f9' }}>
                    <button
                      type="button"
                      className="btn btn-white border text-slate-700 btn-sm fw-semibold d-flex align-items-center gap-1.5 px-3 py-1.5 shadow-xs"
                      style={{ borderColor: '#cbd5e1' }}
                      onClick={handleTestSmtpConnection}
                      disabled={testingSmtp}
                    >
                      <RefreshCw size={13} className={`text-slate-500 ${testingSmtp ? 'spin' : ''}`} />
                      {testingSmtp ? 'Verifying...' : 'Test Connection & Send Verification'}
                    </button>

                    <button 
                      type="submit" 
                      className="btn btn-primary btn-sm px-4 py-1.5 fw-bold shadow-xs d-flex align-items-center gap-1.5"
                    >
                      <Save size={14} />
                      Save Configuration
                    </button>
                  </div>
                </form>

              </div>
            </div>
          </div>
        )}

      </main>

      {/* ── LOG DETAIL MODAL ── */}
      {previewLog && (
        <div className="modal-backdrop d-flex align-items-center justify-content-center" style={{ zIndex: 1070, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-content rounded-3 p-4 bg-white text-slate-900 border shadow-xl" style={{ maxWidth: '680px', width: '92%', maxHeight: '88vh', overflow: 'auto', borderColor: '#cbd5e1' }}>
            <div className="d-flex justify-content-between align-items-center pb-2 border-bottom mb-3" style={{ borderColor: '#f1f5f9' }}>
              <div className="d-flex align-items-center gap-2">
                <Mail size={16} className="text-blue-600" />
                <h6 className="m-0 fw-bold fs-6 text-slate-900">Dispatched Mail Audit Record</h6>
              </div>
              <button type="button" className="btn btn-sm btn-close" onClick={() => setPreviewLog(null)} />
            </div>
            <div className="small mb-1.5 text-slate-600"><strong className="text-slate-900">Status:</strong> {previewLog.status}</div>
            <div className="small mb-1.5 text-slate-600"><strong className="text-slate-900">To:</strong> {(previewLog.to || []).join(', ')}</div>
            <div className="small mb-1.5 text-slate-600"><strong className="text-slate-900">Dispatched:</strong> {new Date(previewLog.createdAt || previewLog.sentAt).toLocaleString('en-IN')}</div>
            <div className="small mb-3 text-slate-600"><strong className="text-slate-900">Subject:</strong> {previewLog.subject}</div>
            <div className="p-3.5 rounded-2 border bg-slate-50 text-slate-800 small font-monospace mb-3" style={{ whiteSpace: 'pre-wrap', borderColor: '#e2e8f0', lineHeight: 1.6 }}>
              {previewLog.bodyText || previewLog.bodyHtml}
            </div>
            <div className="d-flex justify-content-end">
              <button type="button" className="btn btn-sm btn-white border text-slate-700 px-3 fw-semibold shadow-xs" style={{ borderColor: '#cbd5e1' }} onClick={() => setPreviewLog(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST NOTIFICATIONS ── */}
      {toast && (
        <div 
          className="position-fixed bottom-0 end-0 m-4 p-3 rounded-3 shadow-lg border d-flex align-items-center gap-2 small" 
          style={{ 
            zIndex: 2000, 
            backgroundColor: '#ffffff', 
            borderColor: toast.type === 'success' ? '#86efac' : '#fca5a5', 
            color: toast.type === 'success' ? '#14532d' : '#7f1d1d' 
          }}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 size={18} className="text-emerald-600" />
          ) : (
            <AlertCircle size={18} className="text-rose-600" />
          )}
          <span className="fw-semibold">{toast.message}</span>
        </div>
      )}

    </div>
  );
}
