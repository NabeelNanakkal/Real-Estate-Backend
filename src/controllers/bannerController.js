const Banner = require('../models/Banner');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all banners (dashboard)
// @route   GET /api/banners
// @access  Private (Admin)
exports.getBanners = asyncHandler(async (req, res) => {
  const banners = await Banner.find().sort({ order: 1, createdAt: -1 });
  res.json({ success: true, count: banners.length, data: banners });
});

// @desc    Get only active banners (public)
// @route   GET /api/banners/active
// @access  Public
exports.getActiveBanners = asyncHandler(async (req, res) => {
  const banners = await Banner.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
  res.json({ success: true, count: banners.length, data: banners });
});

// @desc    Create a banner
// @route   POST /api/banners
// @access  Private (Admin)
exports.createBanner = asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ success: false, message: 'Banner image is required' });
  }

  const imageUrl = file.path || `uploads/${file.filename}`;
  const { title, subtitle, isActive, order } = req.body;

  const banner = await Banner.create({
    title,
    subtitle: subtitle || '',
    image: imageUrl,
    isActive: isActive !== undefined ? isActive === 'true' || isActive === true : true,
    order: order ? Number(order) : 0,
  });

  res.status(201).json({ success: true, data: banner });
});

// @desc    Update a banner
// @route   PUT /api/banners/:id
// @access  Private (Admin)
exports.updateBanner = asyncHandler(async (req, res) => {
  let banner = await Banner.findById(req.params.id);
  if (!banner) {
    return res.status(404).json({ success: false, message: 'Banner not found' });
  }

  const { title, subtitle, isActive, order } = req.body;
  const updateData = {};

  if (title !== undefined) updateData.title = title;
  if (subtitle !== undefined) updateData.subtitle = subtitle;
  if (isActive !== undefined) updateData.isActive = isActive === 'true' || isActive === true;
  if (order !== undefined) updateData.order = Number(order);

  // If new image uploaded, update image URL
  if (req.file) {
    updateData.image = req.file.path || `uploads/${req.file.filename}`;
  }

  banner = await Banner.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  });

  res.json({ success: true, data: banner });
});

// @desc    Delete a banner
// @route   DELETE /api/banners/:id
// @access  Private (Admin)
exports.deleteBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findByIdAndDelete(req.params.id);
  if (!banner) {
    return res.status(404).json({ success: false, message: 'Banner not found' });
  }
  res.json({ success: true, data: {} });
});
