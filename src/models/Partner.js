const mongoose = require('mongoose');

const PartnerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a partner name'],
    trim: true,
    unique: true
  },
  icon: {
    type: String,
    required: [true, 'Please add an icon (emoji or SVG/URL)']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Partner', PartnerSchema);
