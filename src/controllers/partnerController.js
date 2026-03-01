const Partner = require('../models/Partner');
const asyncHandler = require('../utils/asyncHandler');
const { MONGO_DUPLICATE_KEY } = require('../constants');

// @desc    Get all partners
// @route   GET /api/partners
// @access  Public
exports.getPartners = asyncHandler(async (req, res) => {
  const partners = await Partner.find().sort({ createdAt: -1 });
  res.json({ success: true, count: partners.length, data: partners });
});

// @desc    Add a partner
// @route   POST /api/partners
// @access  Private (Admin)
exports.addPartner = asyncHandler(async (req, res) => {
  try {
    const partner = await Partner.create(req.body);
    res.status(201).json({ success: true, data: partner });
  } catch (err) {
    if (err.code === MONGO_DUPLICATE_KEY) {
      return res.status(400).json({ success: false, message: 'Partner name already exists' });
    }
    res.status(400).json({ success: false, message: err.message || 'Validation failed' });
  }
});

// @desc    Delete a partner
// @route   DELETE /api/partners/:id
// @access  Private (Admin)
exports.deletePartner = asyncHandler(async (req, res) => {
  const partner = await Partner.findByIdAndDelete(req.params.id);

  if (!partner) {
    return res.status(404).json({ success: false, message: 'Partner not found' });
  }

  res.json({ success: true, data: {} });
});
