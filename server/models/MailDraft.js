const mongoose = require('mongoose');

const mailDraftSchema = new mongoose.Schema({
  title:          { type: String, default: 'Untitled Draft' },
  to:             { type: [String], default: [] },
  cc:             { type: [String], default: [] },
  bcc:            { type: [String], default: [] },
  subject:        { type: String, default: '' },
  body:           { type: String, default: '' },
  templateId:     { type: String, default: 'custom' },
  projectId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  projectName:    { type: String, default: '' },
  clientName:     { type: String, default: '' },
  attachedPdfIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PdfFile' }],
  customAttachments: [{
    fileName: String,
    fileBase64: String,
    fileSize: Number,
  }],
  ownerUsername:  { type: String, default: 'admin' },
  companySlug:    { type: String, default: 'mts-decor' },
}, { timestamps: true });

module.exports = mongoose.model('MailDraft', mailDraftSchema);
