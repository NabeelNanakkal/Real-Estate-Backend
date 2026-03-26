const express = require('express');
const router = express.Router();
const { register, login, logout, getMe, updatePreferences, updateProfile, updatePassword, getPublicProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/preferences', protect, updatePreferences);
router.put('/profile', protect, upload.any(), upload.normalize, updateProfile);
router.put('/password', protect, updatePassword);
router.get('/public-profile', getPublicProfile);

module.exports = router;
