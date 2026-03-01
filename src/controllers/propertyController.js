const Property = require('../models/Property');
const Inquiry = require('../models/Inquiry');
const asyncHandler = require('../utils/asyncHandler');
const { DEFAULT_PAGE_LIMIT, LISTING_ID_PREFIX } = require('../constants');

// ─── Helpers ────────────────────────────────────────────────────────────────

const parseArrayField = (val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return []; }
  }
  return [];
};

const checkOwnership = (resource, userId, userRole) =>
  resource.agent.toString() === userId || userRole === 'admin';

const mergeImages = (existingImagesJson, newFiles) => {
  let existing = [];
  if (existingImagesJson) {
    try {
      const parsed = JSON.parse(existingImagesJson);
      existing = Array.isArray(parsed) ? parsed.filter(img => typeof img === 'string') : [];
    } catch { /* ignore */ }
  }
  const uploaded = (newFiles || []).map(f => f.path || `/uploads/${f.filename}`);
  return [...existing, ...uploaded];
};

// ─── Controllers ─────────────────────────────────────────────────────────────

// @desc    Get dashboard stats
// @route   GET /api/properties/dashboard-stats
// @access  Private
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const [totalProperties, totalInquiries, viewsAgg, recentPropertiesRaw] = await Promise.all([
    Property.countDocuments(),
    Inquiry.countDocuments(),
    Property.aggregate([{ $group: { _id: null, total: { $sum: '$views' } } }]),
    Property.find().sort({ createdAt: -1 }).limit(3)
  ]);

  const totalViews = viewsAgg[0]?.total || 0;

  const recentProperties = await Promise.all(
    recentPropertiesRaw.map(async (p) => ({
      _id: p._id,
      title: p.title,
      status: p.status,
      views: p.views,
      inquiries: await Inquiry.countDocuments({ property: p._id })
    }))
  );

  res.json({
    success: true,
    data: { totalProperties, totalInquiries, totalViews, recentProperties }
  });
});

// @desc    Get public stats for Home page
// @route   GET /api/properties/stats
// @access  Public
exports.getPublicStats = asyncHandler(async (req, res) => {
  const [totalProperties, cities] = await Promise.all([
    Property.countDocuments(),
    Property.distinct('city')
  ]);

  res.json({ success: true, data: { totalProperties, citiesCovered: cities.length } });
});

// @desc    Get all properties
// @route   GET /api/properties
// @access  Public
exports.getProperties = asyncHandler(async (req, res) => {
  const { type, propertyType, minPrice, maxPrice, bedrooms, city, featured } = req.query;
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.limit) || DEFAULT_PAGE_LIMIT;
  const skip  = (page - 1) * limit;

  const query = {};
  if (type)         query.listingType   = type;
  if (propertyType) query.propertyType  = propertyType;
  if (city)         query.city          = new RegExp(city, 'i');
  if (featured)     query.featured      = featured === 'true';
  if (bedrooms)     query.bedrooms      = { $gte: parseInt(bedrooms) };
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = parseInt(minPrice);
    if (maxPrice) query.price.$lte = parseInt(maxPrice);
  }

  const [total, properties] = await Promise.all([
    Property.countDocuments(query),
    Property.find(query)
      .populate('agent', 'name email phone avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
  ]);

  res.json({
    success: true,
    count: properties.length,
    pagination: { total, pages: Math.ceil(total / limit), currentPage: page, limit },
    data: properties
  });
});

// @desc    Get single property
// @route   GET /api/properties/:id
// @access  Public
exports.getProperty = asyncHandler(async (req, res) => {
  const property = await Property.findByIdAndUpdate(
    req.params.id,
    { $inc: { views: 1 } },
    { new: true }
  ).populate('agent', 'name email phone company');

  res.json({ success: true, data: property });
});

// @desc    Create property
// @route   POST /api/properties
// @access  Private
exports.createProperty = asyncHandler(async (req, res) => {
  const propertyData = { ...req.body, agent: req.user.id };

  if (req.files?.length > 0) {
    propertyData.images = req.files.map(f => f.path || `/uploads/${f.filename}`);
  } else if (propertyData.images) {
    propertyData.images = Array.isArray(propertyData.images)
      ? propertyData.images.filter(img => typeof img === 'string')
      : [];
  }

  propertyData.amenities = parseArrayField(propertyData.amenities);
  propertyData.nearby    = parseArrayField(propertyData.nearby);

  if (!propertyData.listingId) {
    propertyData.listingId = `${LISTING_ID_PREFIX}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  if (propertyData.type && !propertyData.propertyType) {
    propertyData.propertyType = propertyData.type;
  }

  const property = await Property.create(propertyData);
  res.status(201).json({ success: true, data: property });
});

// @desc    Update property
// @route   PUT /api/properties/:id
// @access  Private
exports.updateProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);

  if (!property) {
    return res.status(404).json({ success: false, message: 'Property not found' });
  }

  if (!checkOwnership(property, req.user.id, req.user.role)) {
    return res.status(403).json({ success: false, message: 'Not authorized to update this property' });
  }

  const updateData = { ...req.body };

  updateData.amenities = parseArrayField(updateData.amenities);
  updateData.nearby    = parseArrayField(updateData.nearby);

  if (updateData.type && !updateData.propertyType) {
    updateData.propertyType = updateData.type;
  }

  updateData.images = mergeImages(updateData.existingImages, req.files);
  delete updateData.existingImages;
  delete updateData.keepExistingImages;

  const updated = await Property.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
  res.json({ success: true, data: updated });
});

// @desc    Delete property
// @route   DELETE /api/properties/:id
// @access  Private
exports.deleteProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);

  if (!property) {
    return res.status(404).json({ success: false, message: 'Property not found' });
  }

  if (!checkOwnership(property, req.user.id, req.user.role)) {
    return res.status(403).json({ success: false, message: 'Not authorized to delete this property' });
  }

  await property.deleteOne();
  res.json({ success: true, data: {} });
});
