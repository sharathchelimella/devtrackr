/**
 * controllers/authController.js – Authentication Controller
 * Handles user registration, login, profile fetch, and logout.
 */

const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const asyncHandler = require('../utils/asyncHandler');

// ── @desc    Register new user
// ── @route   POST /api/auth/register
// ── @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Validate input
  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please provide name, email, and password');
  }

  // Check for existing user
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(409);
    throw new Error('Email is already registered');
  }

  // Create user with initial last login (password hashed in pre-save hook)
  const user = await User.create({
    name,
    email,
    password,
    lastLoginAt: new Date()
  });

  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    token,
    user: user.toJSON(),
  });
});

// ── @desc    Login user
// ── @route   POST /api/auth/login
// ── @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  // Find user and include password for comparison
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error('Your account has been deactivated. Contact support.');
  }

  // Update last login timestamp in database (avoids triggering save hooks)
  await User.updateOne({ _id: user._id }, { lastLoginAt: new Date() });

  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    user: user.toJSON(),
  });
});

// ── @desc    Get current logged-in user profile
// ── @route   GET /api/auth/me
// ── @access  Private
const getMe = asyncHandler(async (req, res) => {
  // req.user is attached by the protect middleware
  const user = await User.findById(req.user._id);

  res.status(200).json({
    success: true,
    user: user.toJSON(),
  });
});

// ── @desc    Update user profile
// ── @route   PUT /api/auth/profile
// ── @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { name, preferences } = req.body;

  const user = await User.findById(req.user._id);

  if (name) user.name = name;
  if (preferences) {
    user.preferences = { ...user.preferences.toObject(), ...preferences };
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    user: user.toJSON(),
  });
});

// ── @desc    Change password
// ── @route   PUT /api/auth/change-password
// ── @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error('Please provide current and new password');
  }

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword))) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password changed successfully',
  });
});

// ── @desc    Search users by name or email
// ── @route   GET /api/auth/search
// ── @access  Private
const searchUsers = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim() === '') {
    return res.status(200).json({ success: true, users: [] });
  }

  const escapedQuery = q.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(escapedQuery, 'i');

  const users = await User.find({
    _id: { $ne: req.user._id },
    isActive: true,
    $or: [{ name: regex }, { email: regex }],
  })
    .select('name email github.username github.avatarUrl')
    .limit(10);

  res.status(200).json({
    success: true,
    users,
  });
});

module.exports = { register, login, getMe, updateProfile, changePassword, searchUsers };
