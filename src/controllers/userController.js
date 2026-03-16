const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = asyncHandler(async (req, res) => {
  const { search, role, sort = 'newest', page = 1, limit = 8 } = req.query;

  const query = {};
  if (role && role !== 'all') query.role = role;
  if (search) {
    query.$or = [
      { name:  new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
      { phone: new RegExp(search, 'i') },
    ];
  }

  const sortMap = {
    newest:    { createdAt: -1 },
    oldest:    { createdAt:  1 },
    name_asc:  { name:       1 },
    name_desc: { name:      -1 },
  };

  const skip  = (parseInt(page) - 1) * parseInt(limit);
  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .select('-password -activeToken')
    .sort(sortMap[sort] || sortMap.newest)
    .skip(skip)
    .limit(parseInt(limit));

  res.json({
    success: true,
    data: users,
    pagination: { total, pages: Math.ceil(total / parseInt(limit)), currentPage: parseInt(page), limit: parseInt(limit) }
  });
});

// @desc    Create a user (admin only)
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, whatsapp } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
  }

  const exists = await User.findOne({ email });
  if (exists) {
    return res.status(400).json({ success: false, message: 'A user with this email already exists.' });
  }

  const avatar = req.file ? (req.file.path || `/uploads/${req.file.filename}`) : undefined;
  const user = await User.create({ name, email, password, role: role || 'agent', phone, whatsapp, ...(avatar && { avatar }) });

  res.status(201).json({
    success: true,
    data: { _id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone, whatsapp: user.whatsapp, avatar: user.avatar, createdAt: user.createdAt }
  });
});

// @desc    Update a user (admin only)
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = asyncHandler(async (req, res) => {
  const { name, email, role, phone, whatsapp, password } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  if (name)  user.name  = name;
  if (email) user.email = email;
  if (role)  user.role  = role;
  if (phone    !== undefined) user.phone    = phone;
  if (whatsapp !== undefined) user.whatsapp = whatsapp;
  if (password) user.password = password;
  if (req.file) user.avatar = req.file.path || `/uploads/${req.file.filename}`;

  await user.save();

  res.json({
    success: true,
    data: { _id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone, whatsapp: user.whatsapp, avatar: user.avatar, createdAt: user.createdAt }
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
