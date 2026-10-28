const mongoose = require('mongoose');

const mailLogSchema = new mongoose.Schema({
  to:            { type: [String], required: true },
  cc:            { type: [String], default: [] },
  bcc:           { type: [String], default: [] },
  subject:       { type: String, required: true },
  bodyHtml:      { type: String, default: '' },
  bodyText:      { type: String, default: '' },
  projectId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  projectName:   { type: String, default: '' },
  clientName:    { type: String, default: '' },
  attachments:   [{
    fileName: String,
    fileSize: Number,
    fileType: { type: String, default: 'application/pdf' },
  }],
  status:        { type: String, enum: ['SENT', 'FAILED'], default: 'SENT' },
  error:         { type: String, default: '' },
  sentBy:        { type: String, default: 'MTS System' },
  companySlug:   { type: String, default: 'mts-decor' },
}, { timestamps: true });

module.exports = mongoose.model('MailLog', mailLogSchema);
