const mongoose = require('mongoose');

const StatItemSchema = new mongoose.Schema({
  label: { type: String, required: true },
  value: { type: Number, required: true },
  suffix: { type: String, default: '' },
  iconKey: { type: String, default: 'FiTrendingUp' },
  color: { type: String, default: 'bg-blue-500' }
});

const SiteStatsSchema = new mongoose.Schema({
  stats: { type: [StatItemSchema], default: [] },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SiteStats', SiteStatsSchema);
