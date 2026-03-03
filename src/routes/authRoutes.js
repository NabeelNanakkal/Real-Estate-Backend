const express = require('express');
const router = express.Router();
const { register, login, getMe, updatePreferences, updateProfile, updatePassword, getPublicProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/preferences', protect, updatePreferences);
router.put('/profile', protect, upload.any(), updateProfile);
router.put('/password', protect, updatePassword);
router.get('/public-profile', getPublicProfile);

module.exports = router;
