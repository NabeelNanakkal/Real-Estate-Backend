const express = require('express');
const router  = express.Router();
const {
  getTestimonials,
  addTestimonial,
  updateTestimonial,
  deleteTestimonial,
} = require('../controllers/testimonialController');

const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.route('/')
  .get(getTestimonials)
  .post(protect, authorize('admin', 'agent'), upload.single('image'), addTestimonial);

router.route('/:id')
  .put(protect, authorize('admin', 'agent'), upload.single('image'), updateTestimonial)
  .delete(protect, authorize('admin', 'agent'), deleteTestimonial);

module.exports = router;
