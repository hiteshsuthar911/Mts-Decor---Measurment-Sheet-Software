const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name:            { type: String, default: 'NEW PROJECT' },
  ownerUsername:   { type: String, required: true },
  ownerName:       { type: String, required: true },
  companyId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null },
  companySlug:     { type: String, default: 'mts-decor' },
  lastEditedBy:    { type: String },
  lastEditedAt:    { type: Date },
  data:            { type: mongoose.Schema.Types.Mixed, default: {} },
  isDeleted:       { type: Boolean, default: false, index: true },
  deletedAt:       { type: Date, default: null },
  deletedBy:       { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
