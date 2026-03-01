const express = require('express');
const router  = express.Router();
const { getAboutContent, updateAboutContent } = require('../controllers/aboutController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.route('/')
  .get(getAboutContent)
  .post(protect, authorize('admin', 'agent'), upload.any(), updateAboutContent);

module.exports = router;
