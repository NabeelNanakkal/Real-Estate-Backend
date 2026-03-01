const ContactContent = require('../models/ContactContent');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get contact content
// @route   GET /api/contact
// @access  Public
exports.getContactContent = asyncHandler(async (req, res) => {
  const content = await ContactContent.findOne();
  res.json({ success: true, data: content || {} });
});

// @desc    Update contact content
// @route   PUT /api/contact
// @access  Private (Admin)
exports.updateContactContent = asyncHandler(async (req, res) => {
  let content = await ContactContent.findOne();

  if (content) {
    content = await ContactContent.findOneAndUpdate({}, req.body, { new: true, runValidators: true });
  } else {
    content = await ContactContent.create(req.body);
  }

  res.json({ success: true, data: content });
});
