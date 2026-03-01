const express = require('express');
const router = express.Router();
const {
  getProperties,
  getProperty,
  getDashboardStats,
  getPublicStats,
  createProperty,
  updateProperty,
  deleteProperty
} = require('../controllers/propertyController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/stats', getPublicStats);
router.get('/dashboard-stats', protect, getDashboardStats);

router.route('/')
  .get(getProperties)
  .post(protect, authorize('admin', 'agent'), upload.array('images', 10), createProperty);

router.route('/:id')
  .get(getProperty)
  .put(protect, authorize('admin', 'agent'), upload.array('images', 10), updateProperty)
  .delete(protect, authorize('admin', 'agent'), deleteProperty);

module.exports = router;
