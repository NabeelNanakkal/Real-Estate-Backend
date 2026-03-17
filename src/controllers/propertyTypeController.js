const PropertyType = require('../models/PropertyType');
const asyncHandler = require('../utils/asyncHandler');

// Seed defaults if collection is empty
const DEFAULT_TYPES = ['Apartment', 'Villa', 'House', 'Office', 'Land', 'Other'];

// @desc    Get all property types
// @route   GET /api/property-types
// @access  Public
exports.getPropertyTypes = asyncHandler(async (req, res) => {
  // Auto-seed on first call if empty, or add missing defaults
  const count = await PropertyType.countDocuments();
  if (count === 0) {
    await PropertyType.insertMany(DEFAULT_TYPES.map(name => ({ name })));
  } else {
    for (const name of DEFAULT_TYPES) {
      await PropertyType.updateOne({ name }, { $setOnInsert: { name } }, { upsert: true });
    }
  }

  const filter = req.query.all === 'true' ? {} : { isActive: true };
  const types = await PropertyType.find(filter).sort({ createdAt: 1 });
  res.json({ success: true, count: types.length, data: types });
});

// @desc    Add a property type
// @route   POST /api/property-types
// @access  Private (Admin)
exports.addPropertyType = asyncHandler(async (req, res) => {
  try {
    const type = await PropertyType.create({ name: req.body.name });
    res.status(201).json({ success: true, data: type });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Property type already exists' });
    }
    res.status(400).json({ success: false, message: err.message });
  }
});

// @desc    Update a property type
// @route   PUT /api/property-types/:id
// @access  Private (Admin)
exports.updatePropertyType = asyncHandler(async (req, res) => {
  const type = await PropertyType.findByIdAndUpdate(req.params.id, { name: req.body.name }, { new: true, runValidators: true });
  if (!type) return res.status(404).json({ success: false, message: 'Property type not found' });
  res.json({ success: true, data: type });
});

// @desc    Toggle active status
// @route   PUT /api/property-types/:id/toggle
// @access  Private (Admin)
exports.togglePropertyType = asyncHandler(async (req, res) => {
  const type = await PropertyType.findById(req.params.id);
  if (!type) return res.status(404).json({ success: false, message: 'Property type not found' });
  type.isActive = !type.isActive;
  await type.save();
  res.json({ success: true, data: type });
});

// @desc    Delete a property type
// @route   DELETE /api/property-types/:id
// @access  Private (Admin)
exports.deletePropertyType = asyncHandler(async (req, res) => {
  const type = await PropertyType.findByIdAndDelete(req.params.id);
  if (!type) return res.status(404).json({ success: false, message: 'Property type not found' });
  res.json({ success: true, data: {} });
});
