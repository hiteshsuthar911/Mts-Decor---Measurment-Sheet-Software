const mongoose = require('mongoose');

const excelFileSchema = new mongoose.Schema({
  projectId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  projectName:   { type: String, default: 'MEASUREMENT SHEET' },
  fileName:      { type: String, required: true },
  fileBase64:    { type: String, required: true },
  sheetsData:    { type: mongoose.Schema.Types.Mixed, default: [] },
  fileSize:      { type: Number, default: 0 },
  ownerUsername: { type: String, required: true },
  ownerName:     { type: String, required: true },
  companyId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null },
  companySlug:   { type: String, default: 'mts-decor' },
  billingMode:   { type: Boolean, default: false },
  metadata:      { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('ExcelFile', excelFileSchema);
