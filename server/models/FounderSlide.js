const mongoose = require('mongoose');

const founderSlideSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  role:      { type: String, required: true },
  company:   { type: String, default: 'MTS DECOR' },
  quote:     { type: String, required: true },
  imageUrl:  { type: String, required: true }, // Base64 or image URL
  order:     { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('FounderSlide', founderSlideSchema);
