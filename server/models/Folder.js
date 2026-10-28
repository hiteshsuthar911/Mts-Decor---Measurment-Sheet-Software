const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true },
  clientName:    { type: String, default: '', trim: true },
  location:      { type: String, default: '', trim: true },
  description:   { type: String, default: '', trim: true },
  color:         { type: String, default: '#2563eb' },
  ownerUsername: { type: String, required: true },
  ownerName:     { type: String, required: true },
  companyId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null },
  companySlug:   { type: String, default: 'mts-decor' },
  isDeleted:     { type: Boolean, default: false, index: true },
  deletedAt:     { type: Date, default: null },
  deletedBy:     { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Folder', folderSchema);

