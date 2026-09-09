const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');

// @desc Register a new user (member, president, coordinator apply as 'member' role by default;
//       admin account is seeded separately and cannot self-register)
// @route POST /api/auth/register
// @access Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, requestedRole } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please provide name, email and password');
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(400);
    throw new Error('An account with this email already exists');
  }

  // Everyone registers as a plain 'member' ("Student"). Admin promotes users to
  // 'president' / 'coordinator' from the admin dashboard, and the single 'admin'
  // account is seeded from environment variables. This avoids people self-granting
  // elevated roles at signup - so any explicit non-member role request is rejected
  // with a clear reason rather than being silently downgraded.
  if (requestedRole && requestedRole !== 'member') {
    res.status(400);
    throw new Error(
      requestedRole === 'admin'
        ? 'The admin account cannot be self-registered.'
        : `${requestedRole.charAt(0).toUpperCase() + requestedRole.slice(1)} accounts are assigned by the admin and cannot be self-registered.`
    );
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role: 'member',
    membershipStatus: 'none',
  });

  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    token,
    user: sanitizeUser(user),
  });
});

// @desc Login user (any of the 4 roles)
// @route POST /api/auth/login
// @access Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error('Your account has been deactivated. Contact the admin.');
  }

  // The login screen has a role selector (Admin / President / Coordinator / Student).
  // We trust the account's real role from the database, but if the person picked the
  // wrong tab we reject the attempt instead of silently logging them into a role they
  // didn't select - this keeps the four-role login UX honest without letting the
  // selector itself be a way to escalate privileges.
  if (role && role !== user.role) {
    res.status(401);
    throw new Error(`No ${role} account found with this email. Try the "${user.role}" tab instead.`);
  }

  const token = generateToken(user._id);

  res.json({
    success: true,
    token,
    user: sanitizeUser(user),
  });
});

// @desc Get logged-in user's profile
// @route GET /api/auth/me
// @access Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('club', 'name category coverImage');
  res.json({ success: true, user: sanitizeUser(user) });
});

// @desc Update own profile (self profile)
// @route PUT /api/auth/me
// @access Private
const updateMe = asyncHandler(async (req, res) => {
  const { name, phone, bio, avatar } = req.body;
  const user = await User.findById(req.user._id);
  if (name) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (bio !== undefined) user.bio = bio;
  if (avatar !== undefined) user.avatar = avatar;
  await user.save();
  res.json({ success: true, user: sanitizeUser(user) });
});

// @desc Change own password while logged in
// @route PUT /api/auth/change-password
// @access Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.matchPassword(currentPassword))) {
    res.status(400);
    throw new Error('Current password is incorrect');
  }
  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password updated successfully' });
});

// @desc Forgot password - sends reset link/token via email
// @route POST /api/auth/forgot-password
// @access Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase() });

  // Always respond success (don't leak which emails exist)
  if (!user) {
    return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  }

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  const html = `
    <p>Hello ${user.name},</p>
    <p>You requested a password reset for your ClubConnect account.</p>
    <p><a href="${resetUrl}">Click here to reset your password</a> (valid for 30 minutes).</p>
    <p>If you didn't request this, ignore this email.</p>
  `;

  try {
    await sendEmail({ to: user.email, subject: 'ClubConnect - Password Reset', html });
    res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    res.status(500);
    throw new Error('Email could not be sent, please try again later');
  }
});

// @desc Reset password using token from email
// @route PUT /api/auth/reset-password/:token
// @access Public
const resetPassword = asyncHandler(async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error('Reset link is invalid or has expired');
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  const token = generateToken(user._id);
  res.json({ success: true, token, message: 'Password reset successful' });
});

// Strip sensitive fields before sending user object to client
const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  club: user.club,
  membershipStatus: user.membershipStatus,
  phone: user.phone,
  bio: user.bio,
  avatar: user.avatar,
  createdAt: user.createdAt,
});

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateMe,
  changePassword,
  forgotPassword,
  resetPassword,
  sanitizeUser,
};
