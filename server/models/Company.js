const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name:                  { type: String, required: true, trim: true },
  slug:                  { type: String, required: true, unique: true, lowercase: true, trim: true },
  logo:                  { type: String, default: '' },
  tagline:               { type: String, default: 'Civil & Interior Contractor' },
  address:               { type: String, default: '' },
  phone:                 { type: String, default: '' },
  email:                 { type: String, default: '' },
  gstin:                 { type: String, default: '' },
  subscriptionStatus:    { type: String, enum: ['ACTIVE', 'TRIAL', 'EXPIRED'], default: 'ACTIVE' },
  subscriptionExpiresAt: { type: Date },
  plan:                  { type: String, enum: ['STARTER', 'PRO', 'ENTERPRISE'], default: 'PRO' },
  annualFee:             { type: Number, default: 12000 },
  ownerName:             { type: String, default: '' },
  ownerEmail:            { type: String, default: '' },
  ownerPhone:            { type: String, default: '' },
  active:                { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);
