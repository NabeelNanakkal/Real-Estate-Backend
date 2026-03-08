const SiteStats = require('../models/SiteStats');
const asyncHandler = require('../utils/asyncHandler');

const getOrCreate = async () => {
  let doc = await SiteStats.findOne();
  if (!doc) {
    doc = await SiteStats.create({
      stats: [
        { label: 'Global Clients', value: 500, suffix: '+', iconKey: 'FiUsers', color: 'bg-purple-500' },
        { label: 'Prime Cities',   value: 5,   suffix: '+', iconKey: 'FiMapPin', color: 'bg-emerald-500' },
        { label: 'Capital Growth', value: 98,  suffix: '%', iconKey: 'FiTrendingUp', color: 'bg-orange-500' },
      ]
    });
  }
  return doc;
};

// GET /api/stats
exports.getStats = asyncHandler(async (req, res) => {
  const doc = await getOrCreate();
  res.json({ success: true, data: doc.stats });
});

// POST /api/stats  — add a stat
exports.addStat = asyncHandler(async (req, res) => {
  const doc = await getOrCreate();
  doc.stats.push(req.body);
  doc.updatedAt = Date.now();
  await doc.save();
  res.json({ success: true, data: doc.stats });
});

// PUT /api/stats/:id  — update a stat
exports.updateStat = asyncHandler(async (req, res) => {
  const doc = await getOrCreate();
  const item = doc.stats.id(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'Stat not found' });
  Object.assign(item, req.body);
  doc.updatedAt = Date.now();
  await doc.save();
  res.json({ success: true, data: doc.stats });
});

// DELETE /api/stats/:id  — remove a stat
exports.deleteStat = asyncHandler(async (req, res) => {
  const doc = await getOrCreate();
  doc.stats = doc.stats.filter(s => s._id.toString() !== req.params.id);
  doc.updatedAt = Date.now();
  await doc.save();
  res.json({ success: true, data: doc.stats });
});
