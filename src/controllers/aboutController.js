const AboutContent = require('../models/AboutContent');
const asyncHandler = require('../utils/asyncHandler');

const getImagePath = (file) => file.path || `/uploads/${file.filename}`;

// @desc    Get about page content
// @route   GET /api/about
// @access  Public
exports.getAboutContent = asyncHandler(async (req, res) => {
  const content = await AboutContent.findOne();
  res.json({ success: true, data: content || {} });
});

// @desc    Update about page content
// @route   POST /api/about
// @access  Private/Admin
exports.updateAboutContent = asyncHandler(async (req, res) => {
  // Support multipart/form-data (with file uploads) and plain JSON
  let body = req.body.content ? JSON.parse(req.body.content) : req.body;

  // Prevent immutable field modifications (causes MongoServerError during update)
  delete body._id;
  delete body.__v;

  // Inject uploaded file paths into the correct content fields
  if (req.files && req.files.length > 0) {
    req.files.forEach((file) => {
      if (file.fieldname === 'heroImage') {
        if (!body.hero) body.hero = {};
        body.hero.image = getImagePath(file);
      } else if (file.fieldname === 'missionImage') {
        if (!body.mission) body.mission = {};
        body.mission.image = getImagePath(file);
      } else {
        const match = file.fieldname.match(/^teamImage_(\d+)$/);
        if (match) {
          const idx = parseInt(match[1], 10);
          if (body.team && body.team[idx]) {
            body.team[idx].image = getImagePath(file);
          }
        }
      }
    });
  }

  let content = await AboutContent.findOne();

  if (content) {
    content = await AboutContent.findByIdAndUpdate(content._id, body, { new: true, runValidators: true });
  } else {
    content = await AboutContent.create(body);
  }

  res.json({ success: true, data: content });
});
