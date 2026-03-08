const express = require('express');
const router = express.Router();
const { getBanners, getActiveBanners, createBanner, updateBanner, deleteBanner } = require('../controllers/bannerController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public route
router.get('/active', getActiveBanners);

// Protected admin routes
router.get('/', protect, authorize('admin'), getBanners);
router.post('/', protect, authorize('admin'), upload.single('image'), createBanner);
router.put('/:id', protect, authorize('admin'), upload.single('image'), updateBanner);
router.delete('/:id', protect, authorize('admin'), deleteBanner);

module.exports = router;
