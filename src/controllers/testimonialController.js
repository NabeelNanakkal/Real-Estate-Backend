const Testimonial = require('../models/Testimonial');
const asyncHandler = require('../utils/asyncHandler');

const getImagePath = (file) => file.path || `/uploads/${file.filename}`;

// @desc    Get testimonials (public → active only; admin → all)
// @route   GET /api/testimonials
// @access  Public
exports.getTestimonials = asyncHandler(async (req, res) => {
  const filter = req.query.all === 'true' ? {} : { isActive: true };
  const testimonials = await Testimonial.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, count: testimonials.length, data: testimonials });
});

// @desc    Add a testimonial
// @route   POST /api/testimonials
// @access  Private (Admin / Agent)
exports.addTestimonial = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (req.file) body.image = getImagePath(req.file);

  // coerce rating to number
  if (body.rating) body.rating = Number(body.rating);
  if (typeof body.isActive === 'string') body.isActive = body.isActive === 'true';

  const testimonial = await Testimonial.create(body);
  res.status(201).json({ success: true, data: testimonial });
});

// @desc    Update a testimonial
// @route   PUT /api/testimonials/:id
// @access  Private (Admin / Agent)
exports.updateTestimonial = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (req.file) body.image = getImagePath(req.file);

  if (body.rating) body.rating = Number(body.rating);
  if (typeof body.isActive === 'string') body.isActive = body.isActive === 'true';

  const testimonial = await Testimonial.findByIdAndUpdate(
    req.params.id,
    body,
    { new: true, runValidators: true }
  );

  if (!testimonial) {
    return res.status(404).json({ success: false, message: 'Testimonial not found' });
  }

  res.json({ success: true, data: testimonial });
});

// @desc    Delete a testimonial
// @route   DELETE /api/testimonials/:id
// @access  Private (Admin / Agent)
exports.deleteTestimonial = asyncHandler(async (req, res) => {
  const testimonial = await Testimonial.findByIdAndDelete(req.params.id);

  if (!testimonial) {
    return res.status(404).json({ success: false, message: 'Testimonial not found' });
  }

  res.json({ success: true, data: {} });
});
