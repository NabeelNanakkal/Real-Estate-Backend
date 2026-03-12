const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password -activeToken').sort({ createdAt: -1 });
  res.json({ success: true, data: users });
});

// @desc    Create a user (admin only)
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
  }

  const exists = await User.findOne({ email });
  if (exists) {
    return res.status(400).json({ success: false, message: 'A user with this email already exists.' });
  }

  const user = await User.create({ name, email, password, role: role || 'agent', phone });

  res.status(201).json({
    success: true,
    data: { _id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone, createdAt: user.createdAt }
  });
});

// @desc    Update a user (admin only)
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = asyncHandler(async (req, res) => {
  const { name, email, role, phone, password } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  if (name)  user.name  = name;
  if (email) user.email = email;
  if (role)  user.role  = role;
  if (phone !== undefined) user.phone = phone;
  if (password) user.password = password; // pre-save hook hashes it

  await user.save();

  res.json({
    success: true,
    data: { _id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone, createdAt: user.createdAt }
  });
});

// @desc    Delete a user (admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id.toString()) {
    return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
  }

  const targetUser = await User.findById(req.params.id);
  if (targetUser?.role === 'admin') {
    return res.status(403).json({ success: false, message: 'Admin accounts cannot be deleted.' });
  }

  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  res.json({ success: true, message: 'User deleted successfully.' });
});

// @desc    Force logout a user (clear activeToken)
// @route   POST /api/users/:id/force-logout
// @access  Private/Admin
exports.forceLogout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { activeToken: null });
  res.json({ success: true, message: 'User session terminated.' });
});
