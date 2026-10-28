const mongoose = require('mongoose');

const mailConfigSchema = new mongoose.Schema({
  provider:     { type: String, enum: ['RESEND', 'SMTP'], default: 'RESEND' },
  resendApiKey: { type: String, default: '' },
  senderEmail:  { type: String, default: '' },
  senderName:   { type: String, default: 'MTS Decor Billing' },
  smtpHost:     { type: String, default: 'smtp.gmail.com' },
  smtpPort:     { type: Number, default: 465 },
  secure:       { type: Boolean, default: true },
  smtpUser:     { type: String, default: '' },
  smtpPass:     { type: String, default: '' },
  replyTo:      { type: String, default: '' },
  companySlug:  { type: String, default: 'mts-decor', unique: true },
  lastTestedAt: { type: Date },
  lastTestStatus: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('MailConfig', mailConfigSchema);
