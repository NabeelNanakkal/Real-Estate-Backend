const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ success: false, message: 'User already exists' });
  }

  const user = await User.create({ name, email, password, phone });

  res.status(201).json({
    success: true,
    data: { _id: user._id, name: user.name, email: user.email, role: user.role, token: generateToken(user._id) }
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  res.json({
    success: true,
    data: { _id: user._id, name: user.name, email: user.email, role: user.role, token: generateToken(user._id) }
  });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  res.json({ success: true, data: user });
});

// @desc    Update user preferences
// @route   PUT /api/auth/preferences
// @access  Private
exports.updatePreferences = asyncHandler(async (req, res) => {
  const { name, emailNotifications, pushNotifications, analyticsTracking, twoFactorAuth } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { name, emailNotifications, pushNotifications, analyticsTracking, twoFactorAuth },
    { new: true, runValidators: true }
  ).select('-password');

  res.json({ success: true, data: user });
});
