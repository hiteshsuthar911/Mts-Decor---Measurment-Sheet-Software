const mongoose = require('mongoose');

const CivilLabourRateSchema = new mongoose.Schema({
  companySlug: {
    type: String,
    required: true,
    default: 'mts-decor',
    index: true,
  },
  title: {
    type: String,
    default: 'CIVIL WORK ONLY LABOUR RATES',
  },
  date: {
    type: String,
    default: '23/03/2026',
  },
  rates: {
    type: Array,
    default: [],
  },
  referenceImages: {
    type: [String],
    default: [
      '/civil-rates/civil_labour_rates_page_1.png',
      '/civil-rates/civil_labour_rates_page_2.png'
    ]
  },
  updatedBy: {
    type: String,
    default: 'Admin',
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

module.exports = mongoose.model('CivilLabourRate', CivilLabourRateSchema);
