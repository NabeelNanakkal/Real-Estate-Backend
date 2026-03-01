const Category = require('../models/Category');
const asyncHandler = require('../utils/asyncHandler');
const { MONGO_DUPLICATE_KEY } = require('../constants');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ createdAt: 1 });
  res.json({ success: true, count: categories.length, data: categories });
});

// @desc    Add a category
// @route   POST /api/categories
// @access  Private (Admin)
exports.addCategory = asyncHandler(async (req, res) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    if (err.code === MONGO_DUPLICATE_KEY) {
      return res.status(400).json({ success: false, message: 'Category title already exists' });
    }
    res.status(400).json({ success: false, message: err.message || 'Validation failed' });
  }
});

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private (Admin)
exports.updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }

  res.json({ success: true, data: category });
});

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private (Admin)
exports.deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);

  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }

  res.json({ success: true, data: {} });
});
