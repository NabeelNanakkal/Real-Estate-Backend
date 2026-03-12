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

  const token = generateToken(user._id);

  // Single-session: store active token in DB
  user.activeToken = token;
  await user.save({ validateBeforeSave: false });

  // Set httpOnly cookie (7 days)
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    success: true,
    data: { _id: user._id, name: user.name, email: user.email, role: user.role, token }
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { activeToken: null });
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully' });
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

// @desc    Update user profile (with avatar/logo)
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, email, phone, bio, company, currency } = req.body;

  const userFields = { name, email, phone, bio, company, currency };

  const file = req.files?.[0];
  if (file) {
    userFields.companyLogo = file.path || `/uploads/${file.filename}`;
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $set: userFields },
    { new: true, runValidators: true }
  ).select('-password');

  res.json({ success: true, data: user });
});

// @desc    Update password
// @route   PUT /api/auth/password
// @access  Private
exports.updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id);

  if (!(await user.comparePassword(currentPassword))) {
    return res.status(401).json({ success: false, message: 'Incorrect current password' });
  }

  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password updated successfully',
    data: { _id: user._id, name: user.name, email: user.email, role: user.role, token: generateToken(user._id) }
  });
});

// @desc    Get public company profile (logo, name)
// @route   GET /api/auth/public-profile
// @access  Public
exports.getPublicProfile = asyncHandler(async (req, res) => {
  // Assuming the first created Admin is the main site owner.
  const adminUser = await User.findOne({ role: 'admin' }).select('company companyLogo currency');
  
  if (!adminUser) {
    return res.status(404).json({ success: false, message: 'No admin profile found' });
  }

  res.json({ success: true, data: adminUser });
});
