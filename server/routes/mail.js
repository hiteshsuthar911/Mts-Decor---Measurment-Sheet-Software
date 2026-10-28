const router = require('express').Router();
const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const MailConfig = require('../models/MailConfig');
const MailLog = require('../models/MailLog');
const MailDraft = require('../models/MailDraft');
const PdfFile = require('../models/PdfFile');

// Helper to get active mail configuration
async function getActiveMailConfig(customConfig = null) {
  let config = customConfig;
  if (!config) {
    config = await MailConfig.findOne({ companySlug: 'mts-decor' });
  }

  const provider = config?.provider || (config?.resendApiKey || process.env.RESEND_API_KEY ? 'RESEND' : 'SMTP');
  const resendApiKey = config?.resendApiKey || process.env.RESEND_API_KEY || '';

  const senderEmail = config?.senderEmail || process.env.SENDER_EMAIL || process.env.SMTP_USER || (provider === 'RESEND' ? 'onboarding@resend.dev' : '');
  const senderName = config?.senderName || process.env.SENDER_NAME || 'MTS Decor Billing';
  const replyTo = config?.replyTo || senderEmail;

  return {
    config,
    provider,
    resendApiKey,
    senderEmail,
    senderName,
    replyTo,
    fromAddress: `"${senderName}" <${senderEmail}>`
  };
}

// Helper to get Nodemailer transporter (for SMTP mode)
function getSmtpTransporter(config) {
  const host = config?.smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(config?.smtpPort || process.env.SMTP_PORT || 465);
  const secure = config?.secure !== undefined ? config.secure : (port === 465);
  const user = config?.smtpUser || config?.senderEmail || process.env.SMTP_USER || process.env.SENDER_EMAIL || '';
  const pass = config?.smtpPass || process.env.SMTP_PASS || '';

  if (!user || !pass) {
    throw new Error('SMTP credentials not configured. Please enter your email and password / App Password.');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: { rejectUnauthorized: false }
  });
}

// ── 1. GET /api/mail/config ──
router.get('/config', async (req, res) => {
  try {
    let config = await MailConfig.findOne({ companySlug: 'mts-decor' });
    if (!config) {
      config = {
        provider: process.env.RESEND_API_KEY ? 'RESEND' : 'SMTP',
        resendApiKey: process.env.RESEND_API_KEY || '',
        senderEmail: process.env.SENDER_EMAIL || process.env.SMTP_USER || '',
        senderName: process.env.SENDER_NAME || 'MTS Decor Billing',
        smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
        smtpPort: Number(process.env.SMTP_PORT || 465),
        secure: true,
        smtpUser: process.env.SMTP_USER || process.env.SENDER_EMAIL || '',
        replyTo: process.env.SENDER_EMAIL || '',
      };
    }

    const hasResend = !!(config.resendApiKey || process.env.RESEND_API_KEY);
    const hasSmtpPass = !!(config.smtpPass || process.env.SMTP_PASS);

    res.json({
      provider: config.provider || (hasResend ? 'RESEND' : 'SMTP'),
      hasResendApiKey: hasResend,
      resendKeyPrefix: config.resendApiKey ? `${config.resendApiKey.slice(0, 6)}••••••••` : '',
      senderEmail: config.senderEmail || '',
      senderName: config.senderName || 'MTS Decor Billing',
      smtpHost: config.smtpHost || 'smtp.gmail.com',
      smtpPort: config.smtpPort || 465,
      secure: config.secure !== false,
      smtpUser: config.smtpUser || config.senderEmail || '',
      hasPassword: hasSmtpPass,
      replyTo: config.replyTo || '',
      lastTestedAt: config.lastTestedAt || null,
      lastTestStatus: config.lastTestStatus || '',
    });
  } catch (err) {
    console.error('GET MAIL CONFIG ERROR:', err);
    res.status(500).json({ message: 'Failed to fetch mail configuration', error: err.message });
  }
});

// ── 2. POST /api/mail/config ──
router.post('/config', async (req, res) => {
  try {
    const { 
      provider, 
      resendApiKey, 
      senderEmail, 
      senderName, 
      smtpHost, 
      smtpPort, 
      secure, 
      smtpUser, 
      smtpPass, 
      replyTo 
    } = req.body;

    let config = await MailConfig.findOne({ companySlug: 'mts-decor' });
    if (!config) {
      config = new MailConfig({ companySlug: 'mts-decor' });
    }

    if (provider) config.provider = provider;
    if (resendApiKey && String(resendApiKey).trim()) config.resendApiKey = String(resendApiKey).trim();
    if (senderEmail !== undefined) config.senderEmail = String(senderEmail).trim();
    if (senderName !== undefined) config.senderName = String(senderName).trim();
    if (smtpHost !== undefined) config.smtpHost = String(smtpHost).trim();
    if (smtpPort !== undefined) config.smtpPort = Number(smtpPort) || 465;
    if (secure !== undefined) config.secure = Boolean(secure);
    if (smtpUser !== undefined) config.smtpUser = String(smtpUser).trim();
    if (smtpPass && String(smtpPass).trim()) config.smtpPass = String(smtpPass).trim();
    if (replyTo !== undefined) config.replyTo = String(replyTo).trim();

    await config.save();

    res.json({
      message: 'Mail settings saved successfully',
      provider: config.provider,
      hasResendApiKey: !!config.resendApiKey,
      senderEmail: config.senderEmail,
      senderName: config.senderName,
      smtpHost: config.smtpHost,
      smtpPort: config.smtpPort,
      secure: config.secure,
      hasPassword: !!config.smtpPass,
    });
  } catch (err) {
    console.error('SAVE MAIL CONFIG ERROR:', err);
    res.status(500).json({ message: 'Failed to save email configuration', error: err.message });
  }
});

// ── 3. POST /api/mail/test-connection ──
router.post('/test-connection', async (req, res) => {
  try {
    const testConfig = req.body.config || null;
    const testRecipient = req.body.testRecipient;

    const active = await getActiveMailConfig(testConfig);
    const targetRecipient = testRecipient || active.senderEmail;

    if (!targetRecipient) {
      return res.status(400).json({ message: 'Please provide a test recipient email address.' });
    }

    let resultMsg = '';

    // A. RESEND PROVIDER
    if (active.provider === 'RESEND') {
      if (!active.resendApiKey) {
        throw new Error('Resend API Key is missing. Please provide your Resend API Key (starts with re_).');
      }

      const resend = new Resend(active.resendApiKey);

      // In Resend free trial without a custom domain verified, sending from arbitrary domain fails.
      // So default to onboarding@resend.dev if custom domain is not yet verified.
      let fromResend = active.fromAddress;
      if (!active.senderEmail || active.senderEmail.includes('@gmail.com') || active.senderEmail.includes('@yahoo.com')) {
        fromResend = `MTS Decor Billing <onboarding@resend.dev>`;
      }

      const { data, error } = await resend.emails.send({
        from: fromResend,
        to: [targetRecipient],
        subject: '[MTS Decor] Resend API Test - Verified',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 24px; background: #0f172a; color: #f8fafc; border-radius: 8px; border: 1px solid #1e293b; max-width: 600px;">
            <h2 style="color: #38bdf8; margin: 0 0 12px 0;">MTS Decor & Resend Connection</h2>
            <p style="color: #4ade80; font-weight: bold; font-size: 16px;">✓ Resend API Verified Successfully</p>
            <p style="color: #cbd5e1; line-height: 1.5;">
              Your MTS Decor software is now integrated with <strong>Resend</strong> for high-deliverability bill and measurement sheet dispatches.
            </p>
            <div style="background: #1e293b; padding: 12px; border-radius: 6px; font-size: 13px; color: #94a3b8; margin-top: 16px;">
              <div><strong>Provider:</strong> Resend API</div>
              <div><strong>Sender Identity:</strong> ${fromResend}</div>
              <div><strong>Delivered To:</strong> ${targetRecipient}</div>
              <div><strong>Verified At:</strong> ${new Date().toLocaleString()}</div>
            </div>
          </div>
        `
      });

      if (error) {
        throw new Error(error.message || 'Resend API rejected the test email.');
      }

      resultMsg = `Resend verified! Test email delivered to ${targetRecipient} (ID: ${data?.id})`;
    } 
    // B. SMTP PROVIDER
    else {
      const transporter = getSmtpTransporter(active.config || testConfig);
      await transporter.verify();

      await transporter.sendMail({
        from: active.fromAddress,
        to: targetRecipient,
        subject: '[MTS Decor] SMTP Dispatch Test - Verified',
        text: `Success! SMTP connected to ${active.senderEmail}.\nTimestamp: ${new Date().toLocaleString()}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 24px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; max-width: 600px;">
            <h2 style="color: #0f172a; margin: 0 0 12px 0;">MTS Decor Mail System</h2>
            <p style="color: #16a34a; font-weight: bold; font-size: 16px;">✓ SMTP Connection Verified</p>
            <p style="color: #334155; line-height: 1.5;">Your email is successfully connected to the MTS Decor Bill Dispatching engine.</p>
          </div>
        `
      });

      resultMsg = `SMTP verified & test email delivered to ${targetRecipient}!`;
    }

    await MailConfig.updateOne(
      { companySlug: 'mts-decor' },
      { lastTestedAt: new Date(), lastTestStatus: `VERIFIED_SUCCESS: ${resultMsg}` }
    ).catch(() => {});

    res.json({ success: true, message: resultMsg });
  } catch (err) {
    console.error('MAIL TEST ERROR:', err);
    await MailConfig.updateOne(
      { companySlug: 'mts-decor' },
      { lastTestedAt: new Date(), lastTestStatus: `FAILED: ${err.message}` }
    ).catch(() => {});

    res.status(400).json({
      success: false,
      message: 'Connection failed: ' + (err.message || 'Unknown error'),
      details: err.code || err.message,
    });
  }
});

// ── 4. POST /api/mail/send ──
router.post('/send', async (req, res) => {
  try {
    const {
      to,
      cc = [],
      bcc = [],
      subject,
      bodyHtml,
      bodyText,
      projectId,
      projectName,
      clientName,
      attachedPdfIds = [],
      customAttachments = [],
      sentBy = 'MTS Decor Admin'
    } = req.body;

    const toList = Array.isArray(to) ? to.map(e => String(e).trim()).filter(Boolean) : [String(to).trim()].filter(Boolean);
    const ccList = Array.isArray(cc) ? cc.map(e => String(e).trim()).filter(Boolean) : (cc ? [String(cc).trim()] : []);
    const bccList = Array.isArray(bcc) ? bcc.map(e => String(e).trim()).filter(Boolean) : (bcc ? [String(bcc).trim()] : []);

    if (!toList.length) {
      return res.status(400).json({ message: 'Recipient email address ("to") is required.' });
    }
    if (!subject || !subject.trim()) {
      return res.status(400).json({ message: 'Email subject is required.' });
    }

    const active = await getActiveMailConfig();

    // Prepare attachments
    const mailAttachments = [];
    const logAttachments = [];

    // 1. Resolve stored bill PDFs by ID from PdfFile collection
    if (attachedPdfIds.length > 0) {
      const pdfFiles = await PdfFile.find({ _id: { $in: attachedPdfIds } });
      for (const pdf of pdfFiles) {
        if (pdf.fileBase64) {
          const cleanBase64 = pdf.fileBase64.replace(/^data:application\/pdf;base64,/, '');
          const buffer = Buffer.from(cleanBase64, 'base64');
          const fileName = pdf.fileName.endsWith('.pdf') ? pdf.fileName : `${pdf.fileName}.pdf`;

          mailAttachments.push({
            filename: fileName,
            content: buffer,
            contentType: 'application/pdf',
          });

          logAttachments.push({
            fileName: fileName,
            fileSize: buffer.length,
            fileType: 'application/pdf',
          });
        }
      }
    }

    // 2. Resolve custom attachments uploaded in studio
    if (Array.isArray(customAttachments)) {
      for (const att of customAttachments) {
        if (att.fileBase64 && att.fileName) {
          const cleanBase64 = att.fileBase64.replace(/^data:[^;]+;base64,/, '');
          const buffer = Buffer.from(cleanBase64, 'base64');

          mailAttachments.push({
            filename: att.fileName,
            content: buffer,
            contentType: att.fileType || 'application/pdf',
          });

          logAttachments.push({
            fileName: att.fileName,
            fileSize: buffer.length,
            fileType: att.fileType || 'application/pdf',
          });
        }
      }
    }

    // Formatted HTML body
    const formattedHtml = bodyHtml || `
      <div style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; color: #1e293b; line-height: 1.6; max-width: 650px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="color: #0f172a; margin: 0; font-size: 20px;">MTS DECOR</h2>
          <span style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Official Bill & Project Dispatch</span>
        </div>
        <div style="white-space: pre-wrap; margin-bottom: 24px;">${bodyText || ''}</div>
        <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 12px; color: #64748b;">
          <div>This is an official dispatch from <strong>MTS Decor</strong>.</div>
          <div>Please refer to the attached document(s) for itemized measurements and billing details.</div>
        </div>
      </div>
    `;

    let dispatchMessageId = '';

    // ── SEND VIA RESEND ──
    if (active.provider === 'RESEND') {
      if (!active.resendApiKey) {
        throw new Error('Resend API key is not configured. Please add your Resend API Key in Settings.');
      }

      const resend = new Resend(active.resendApiKey);

      // Sender address
      let fromAddress = active.fromAddress;
      if (!active.senderEmail || active.senderEmail.includes('@gmail.com') || active.senderEmail.includes('@yahoo.com')) {
        fromAddress = `MTS Decor Billing <onboarding@resend.dev>`;
      }

      const { data, error } = await resend.emails.send({
        from: fromAddress,
        to: toList,
        cc: ccList.length ? ccList : undefined,
        bcc: bccList.length ? bccList : undefined,
        reply_to: active.replyTo || active.senderEmail,
        subject: subject.trim(),
        text: bodyText || subject,
        html: formattedHtml,
        attachments: mailAttachments.map(att => ({
          filename: att.filename,
          content: att.content,
        })),
      });

      if (error) {
        throw new Error(error.message || 'Resend failed to send email.');
      }
      dispatchMessageId = data?.id || '';
    }
    // ── SEND VIA NODEMAILER (SMTP) ──
    else {
      const transporter = getSmtpTransporter(active.config);
      const info = await transporter.sendMail({
        from: active.fromAddress,
        to: toList.join(', '),
        cc: ccList.length ? ccList.join(', ') : undefined,
        bcc: bccList.length ? bccList.join(', ') : undefined,
        replyTo: active.replyTo,
        subject: subject.trim(),
        text: bodyText || subject,
        html: formattedHtml,
        attachments: mailAttachments,
      });
      dispatchMessageId = info.messageId || '';
    }

    // Save to MailLog for audit trail
    const mailLog = new MailLog({
      to: toList,
      cc: ccList,
      bcc: bccList,
      subject: subject.trim(),
      bodyHtml: formattedHtml,
      bodyText: bodyText || '',
      projectId: projectId || null,
      projectName: projectName || '',
      clientName: clientName || '',
      attachments: logAttachments,
      status: 'SENT',
      sentBy: `${sentBy} (${active.provider})`,
      companySlug: 'mts-decor',
    });
    await mailLog.save();

    res.json({
      success: true,
      message: `Email successfully dispatched to ${toList.join(', ')} via ${active.provider}`,
      messageId: dispatchMessageId,
      logId: mailLog._id,
      attachmentsCount: mailAttachments.length,
      provider: active.provider,
    });
  } catch (err) {
    console.error('MAIL SEND ERROR:', err);

    try {
      await MailLog.create({
        to: Array.isArray(req.body.to) ? req.body.to : [req.body.to || ''],
        subject: req.body.subject || '(No Subject)',
        status: 'FAILED',
        error: err.message || 'Send error',
        sentBy: req.body.sentBy || 'MTS Decor Admin',
        companySlug: 'mts-decor',
      });
    } catch {}

    res.status(500).json({
      success: false,
      message: 'Failed to send email: ' + (err.message || 'Unknown error'),
      details: err.message,
    });
  }
});

// ── 5. GET /api/mail/logs ──
router.get('/logs', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const logs = await MailLog.find({ companySlug: 'mts-decor' })
      .select('-bodyHtml')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch mail logs', error: err.message });
  }
});

// ── 6. GET /api/mail/logs/:id ──
router.get('/logs/:id', async (req, res) => {
  try {
    const log = await MailLog.findById(req.params.id);
    if (!log) return res.status(404).json({ message: 'Mail log not found' });
    res.json(log);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch mail log', error: err.message });
  }
});

// ── 7. Drafts CRUD ──
router.get('/drafts', async (req, res) => {
  try {
    const drafts = await MailDraft.find({ companySlug: 'mts-decor' })
      .populate('attachedPdfIds', 'fileName fileSize projectName')
      .sort({ updatedAt: -1 });
    res.json(drafts);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch drafts', error: err.message });
  }
});

router.post('/drafts', async (req, res) => {
  try {
    const {
      id,
      title,
      to,
      cc,
      bcc,
      subject,
      body,
      templateId,
      projectId,
      projectName,
      clientName,
      attachedPdfIds,
      customAttachments,
    } = req.body;

    let draft;
    if (id) draft = await MailDraft.findById(id);
    if (!draft) draft = new MailDraft({ companySlug: 'mts-decor' });

    if (title !== undefined) draft.title = title || 'Untitled Draft';
    if (to !== undefined) draft.to = Array.isArray(to) ? to : [to];
    if (cc !== undefined) draft.cc = Array.isArray(cc) ? cc : (cc ? [cc] : []);
    if (bcc !== undefined) draft.bcc = Array.isArray(bcc) ? bcc : (bcc ? [bcc] : []);
    if (subject !== undefined) draft.subject = subject || '';
    if (body !== undefined) draft.body = body || '';
    if (templateId !== undefined) draft.templateId = templateId || 'custom';
    if (projectId !== undefined) draft.projectId = projectId || null;
    if (projectName !== undefined) draft.projectName = projectName || '';
    if (clientName !== undefined) draft.clientName = clientName || '';
    if (attachedPdfIds !== undefined) draft.attachedPdfIds = attachedPdfIds || [];
    if (customAttachments !== undefined) draft.customAttachments = customAttachments || [];

    await draft.save();

    res.json({
      success: true,
      message: 'Draft saved successfully',
      draft,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to save draft', error: err.message });
  }
});

router.delete('/drafts/:id', async (req, res) => {
  try {
    await MailDraft.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Draft deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete draft', error: err.message });
  }
});

module.exports = router;
