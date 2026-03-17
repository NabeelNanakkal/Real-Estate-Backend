const mongoose = require('mongoose');

const PropertyTypeSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true, unique: true },
  isActive:  { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('PropertyType', PropertyTypeSchema);
