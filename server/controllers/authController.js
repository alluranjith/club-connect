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

  if (!user) {
    res.status(404);
    throw new Error('No account exists with this email');
  }

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
 const html = `
  <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e4e7eb; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
    
    <!-- Header Banner -->
    <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 35px 20px; text-align: center;">
      <div style="font-size: 28px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; margin-bottom: 8px;">
        ⚡ ClubConnect
      </div>
      <div style="color: #e0e7ff; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">
        Securing Your Account
      </div>
    </div>

    <!-- Body Content -->
    <div style="padding: 40px 30px; background-color: #ffffff;">
      <h2 style="color: #1f2937; font-size: 22px; font-weight: 700; margin-top: 0; margin-bottom: 16px;">
        Password Reset Request
      </h2>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 12px;">
        Hello <strong style="color: #111827;">${user.name}</strong>,
      </p>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
        We received a request to reset the password associated with your ClubConnect account. No changes have been made yet. You can securely reset your password by clicking the button below:
      </p>

      <!-- Central Action Button -->
      <div style="text-align: center; margin: 35px 0;">
        <a href="${resetUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 14px 32px; text-decoration: none; font-weight: 700; font-size: 16px; border-radius: 8px; display: inline-block; transition: background-color 0.2s ease; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2), 0 2px 4px -1px rgba(79, 70, 229, 0.1);">
          Reset My Password
        </a>
      </div>

      <!-- Time Expiry & Info Alert Box -->
      <div style="background-color: #f3f4f6; border-left: 4px solid #6366f1; padding: 16px; border-radius: 4px 8px 8px 4px; margin-bottom: 30px;">
        <p style="color: #374151; font-size: 14px; line-height: 1.5; margin: 0;">
          ⏱️ <strong>Important Notice:</strong> For security purposes, this link will automatically expire in <strong>30 minutes</strong> and can only be used once.
        </p>
      </div>

      <!-- Security Fallback Link -->
      <p style="color: #9ca3af; font-size: 13px; line-height: 1.5; margin-bottom: 0;">
        If the button above isn't working, copy and paste this absolute URL into your web browser:<br>
        <a href="${resetUrl}" style="color: #4f46e5; text-decoration: underline; word-break: break-all;">${resetUrl}</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 24px 30px; text-align: center; border-top: 1px solid #f3f4f6;">
      <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin: 0 0 8px 0;">
        <strong>Didn't request this?</strong> If you didn't ask to reset your password, you can safely ignore or delete this email. Your account remains fully secure.
      </p>
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        &copy; ${new Date().getFullYear()} ClubConnect. All rights reserved.
      </p>
    </div>

  </div>
`;


  try {
    await sendEmail({ to: user.email, subject: 'ClubConnect - Password Reset', html });
    res.json({ success: true, message: 'Reset link sent to your email.' });
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