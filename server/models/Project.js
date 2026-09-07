const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name:            { type: String, default: 'NEW PROJECT' },
  ownerUsername:   { type: String, required: true },
  ownerName:       { type: String, required: true },
  lastEditedBy:    { type: String },
  lastEditedAt:    { type: Date },
  data:            { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
