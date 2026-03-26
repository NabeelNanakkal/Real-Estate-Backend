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

  // Sort order: primary admin=0, other admins=1, agents/others=2
  const roleSort = {
    $cond: [
      { $eq: ['$isPrimary', true] }, 0,
      { $cond: [{ $eq: ['$role', 'admin'] }, 1, 2] }
    ]
  };

  const secondarySortMap = {
    newest:    { createdAt: -1 },
    oldest:    { createdAt:  1 },
    name_asc:  { name:       1 },
    name_desc: { name:      -1 },
  };
  const secondarySort = secondarySortMap[sort] || secondarySortMap.newest;

  const skip  = (parseInt(page) - 1) * parseInt(limit);
  const total = await User.countDocuments(query);

  const pipeline = [
    { $match: query },
    { $addFields: { _roleOrder: roleSort } },
    { $sort: { _roleOrder: 1, ...secondarySort } },
    { $skip: skip },
    { $limit: parseInt(limit) },
    { $project: { password: 0, activeToken: 0, _roleOrder: 0 } },
  ];

  const users = await User.aggregate(pipeline);

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

  const assignedRole = role || 'agent';

  // Only primary admin can create other admin accounts
  if (assignedRole === 'admin' && !req.user.isPrimary) {
    return res.status(403).json({ success: false, message: 'Only the primary admin can create admin accounts.' });
  }

  const exists = await User.findOne({ email });
  if (exists) {
    return res.status(400).json({ success: false, message: 'A user with this email already exists.' });
  }

  const avatar = req.file ? (req.file.path || `/uploads/${req.file.filename}`) : undefined;
  const user = await User.create({ name, email, password, role: assignedRole, phone, whatsapp, ...(avatar && { avatar }) });

  res.status(201).json({
    success: true,
    data: { _id: user._id, name: user.name, email: user.email, role: user.role, isPrimary: user.isPrimary, phone: user.phone, whatsapp: user.whatsapp, avatar: user.avatar, createdAt: user.createdAt }
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

  // Only primary admin can edit admin accounts or promote someone to admin
  if ((user.role === 'admin' || role === 'admin') && !req.user.isPrimary) {
    return res.status(403).json({ success: false, message: 'Only the primary admin can edit admin accounts.' });
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
    data: { _id: user._id, name: user.name, email: user.email, role: user.role, isPrimary: user.isPrimary, phone: user.phone, whatsapp: user.whatsapp, avatar: user.avatar, createdAt: user.createdAt }
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
  if (!targetUser) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  // Only primary admin can delete admin accounts
  if (targetUser.role === 'admin' && !req.user.isPrimary) {
    return res.status(403).json({ success: false, message: 'Only the primary admin can delete admin accounts.' });
  }

  // Nobody can delete the primary admin
  if (targetUser.isPrimary) {
    return res.status(403).json({ success: false, message: 'The primary admin account cannot be deleted.' });
  }

  await User.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'User deleted successfully.' });
});

// @desc    Force logout a user (clear activeToken)
// @route   POST /api/users/:id/force-logout
// @access  Private/Admin
exports.forceLogout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { activeToken: null });
  res.json({ success: true, message: 'User session terminated.' });
});
