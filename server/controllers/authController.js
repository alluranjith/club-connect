const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');
const AllowedEmail = require('../models/AllowedEmail');
const EmailOtp = require('../models/EmailOtp');
const { validatePassword } = require('../utils/passwordPolicy');
const { PHONE_RE, fieldsValid, isProfileComplete } = require('../utils/profile');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normEmail = (e) => String(e || '').trim().toLowerCase();
const hashOtp = (email, otp) =>
  crypto.createHmac('sha256', process.env.JWT_SECRET || 'dev').update(`${email}:${otp}`).digest('hex');

// OTP_MODE=email (default) -> real 6-digit code emailed to the student.
// OTP_MODE=fixed           -> no email; everyone uses FIXED_OTP (default 123456). Temporary / demo use only.
const otpMode = () => (String(process.env.OTP_MODE || 'email').toLowerCase() === 'fixed' ? 'fixed' : 'email');
const fixedOtp = () => (/^\d{6}$/.test(process.env.FIXED_OTP || '') ? process.env.FIXED_OTP : '123456');

// 'registered' (has an account) | 'eligible' (in the college list, no account yet) | 'not_allowed'
const emailStatus = async (email) => {
  if (await User.exists({ email })) return 'registered';
  if (await AllowedEmail.exists({ email })) return 'eligible';
  return 'not_allowed';
};

const otpEmailHtml = (otp) => `
  <div style="font-family:Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;border:1px solid #0a0a0a;">
    <div style="background:#0a0a0a;color:#fff;padding:20px 24px;letter-spacing:.2em;text-transform:uppercase;font-weight:800;font-size:13px;">ClubConnect</div>
    <div style="padding:28px 24px;color:#0a0a0a;">
      <p style="margin:0 0 12px;">Use this one-time code to verify your college email:</p>
      <p style="font-size:34px;letter-spacing:.35em;font-weight:800;margin:18px 0;">${otp}</p>
      <p style="color:#6b6b6b;font-size:13px;margin:0;">It expires in 10 minutes. If you didn't request it, ignore this email.</p>
    </div>
  </div>`;

// @desc Tell the UI what to do with an email BEFORE login/registration
// @route POST /api/auth/check-email
const checkEmail = asyncHandler(async (req, res) => {
  const email = normEmail(req.body.email);
  if (!EMAIL_RE.test(email)) { res.status(400); throw new Error('Enter a valid email address'); }
  res.json({ success: true, status: await emailStatus(email) });
});

// @desc Send a 6-digit OTP to a college email that has no account yet
// @route POST /api/auth/send-otp
const sendOtp = asyncHandler(async (req, res) => {
  const email = normEmail(req.body.email);
  if (!EMAIL_RE.test(email)) { res.status(400); throw new Error('Enter a valid email address'); }

  const status = await emailStatus(email);
  if (status === 'registered') { res.status(400); throw new Error('An account with this email already exists - please log in'); }
  if (status === 'not_allowed') { res.status(403); throw new Error('This email is not in the college list. Contact your admin.'); }

  const recent = await EmailOtp.findOne({ email });
  if (otpMode() === 'email' && recent && Date.now() - recent.lastSentAt.getTime() < 60 * 1000) {
    res.status(429);
    throw new Error('Please wait a minute before requesting another code');
  }

  const fixed = otpMode() === 'fixed';
  const otp = fixed ? fixedOtp() : String(crypto.randomInt(100000, 1000000));
  await EmailOtp.findOneAndUpdate(
    { email },
    { otpHash: hashOtp(email, otp), attempts: 0, lastSentAt: new Date(), expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
    { upsert: true, new: true }
  );

  if (fixed) {
    return res.json({ success: true, mode: 'fixed', message: 'Enter the verification code to continue' });
  }

  try {
    await sendEmail({ to: email, subject: 'Your ClubConnect verification code', html: otpEmailHtml(otp) });
  } catch (err) {
    await EmailOtp.deleteOne({ email });
    res.status(500);
    throw new Error('Could not send the code. Please try again later');
  }
  res.json({ success: true, message: 'Verification code sent to your email' });
});

// @desc Public client config (Google client id) so the UI can show the Google button
// @route GET /api/auth/config
const getAuthConfig = asyncHandler(async (req, res) => {
  res.json({ success: true, googleClientId: process.env.GOOGLE_CLIENT_ID || null, otpMode: otpMode() });
});

// @desc Sign in / sign up with Google - college emails only
// @route POST /api/auth/google
const googleLogin = asyncHandler(async (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID) { res.status(503); throw new Error('Google sign-in is not configured on the server'); }
  const { credential } = req.body;
  if (!credential) { res.status(400); throw new Error('Missing Google credential'); }

  let payload;
  try {
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
    payload = ticket.getPayload();
  } catch (e) {
    res.status(401);
    throw new Error('Google sign-in failed. Please try again');
  }

  const email = normEmail(payload.email);
  if (!payload.email_verified) { res.status(401); throw new Error('Your Google email is not verified'); }

  // Optional hard domain lock, e.g. GOOGLE_ALLOWED_DOMAIN=college.edu
  const domain = (process.env.GOOGLE_ALLOWED_DOMAIN || '').toLowerCase();
  if (domain && email.split('@')[1] !== domain) {
    res.status(403);
    throw new Error(`Please use your @${domain} college email`);
  }

  let user = await User.findOne({ email });
  if (!user) {
    const allowed = await AllowedEmail.findOne({ email });
    if (!allowed) { res.status(403); throw new Error('This Google account is not in the college list. Use your college email.'); }
    user = await User.create({
      name: allowed.name || payload.name || email.split('@')[0],
      email,
      password: crypto.randomBytes(32).toString('hex'), // unusable random password; they can set one via "Forgot password"
      role: 'member',
      googleId: payload.sub,
      avatar: payload.picture || '',
    });
  } else {
    if (!user.isActive) { res.status(403); throw new Error('Your account has been deactivated. Contact the admin.'); }
    if (!user.googleId) { user.googleId = payload.sub; await user.save({ validateBeforeSave: false }); }
  }

  res.json({ success: true, token: generateToken(user._id), user: sanitizeUser(user) });
});


// @desc Register a new user (member, president, coordinator apply as 'member' role by default;
//       admin account is seeded separately and cannot self-register)
// @route POST /api/auth/register
// @access Public
const registerUser = asyncHandler(async (req, res) => {
  const { password, otp, requestedRole } = req.body;
  const email = normEmail(req.body.email);

  if (!EMAIL_RE.test(email) || !password || !otp) {
    res.status(400);
    throw new Error('Please provide your college email, the OTP sent to it, and a password');
  }

  // Everyone self-registers as a plain student ('member'); admin promotes later.
  if (requestedRole && requestedRole !== 'member') {
    res.status(400);
    throw new Error(
      requestedRole === 'admin'
        ? 'The admin account cannot be self-registered.'
        : `${requestedRole.charAt(0).toUpperCase() + requestedRole.slice(1)} accounts are assigned by the admin and cannot be self-registered.`
    );
  }

  const status = await emailStatus(email);
  if (status === 'registered') { res.status(400); throw new Error('An account with this email already exists'); }
  if (status === 'not_allowed') { res.status(403); throw new Error('This email is not in the college list. Contact your admin.'); }

  const pwError = validatePassword(password);
  if (pwError) { res.status(400); throw new Error(pwError); }

  // Verify OTP (max 5 wrong attempts, single use)
  const record = await EmailOtp.findOne({ email });
  if (!record || record.expiresAt < new Date()) { res.status(400); throw new Error('Code expired - request a new one'); }
  if (record.attempts >= 5) { res.status(429); throw new Error('Too many wrong attempts - request a new code'); }
  const given = Buffer.from(hashOtp(email, String(otp).trim()));
  const real = Buffer.from(record.otpHash);
  if (given.length !== real.length || !crypto.timingSafeEqual(given, real)) {
    record.attempts += 1;
    await record.save();
    res.status(400);
    throw new Error('Incorrect code');
  }
  await EmailOtp.deleteOne({ email });

  const allowed = await AllowedEmail.findOne({ email });
  const user = await User.create({
    name: allowed?.name || email.split('@')[0], // real name is collected on the "complete profile" step
    email,
    password,
    role: 'member',
  });

  res.status(201).json({ success: true, token: generateToken(user._id), user: sanitizeUser(user) });
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

  if (!user) {
    // Students: tell them whether their email is on the college list so they know what to do next
    if (!role || role === 'member') {
      const status = await emailStatus(email.toLowerCase());
      if (status === 'eligible') { res.status(404); throw new Error('No account yet - register with your college email to get started'); }
      if (status === 'not_allowed') { res.status(403); throw new Error('This email is not in the college list. Contact your admin.'); }
    }
    res.status(401);
    throw new Error('Invalid email or password');
  }
  if (!(await user.matchPassword(password))) {
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

  if (name !== undefined) {
    const n = String(name).trim();
    if (n.length < 2 || n.length > 80) { res.status(400); throw new Error('Enter your full name (2-80 characters)'); }
    user.name = n;
  }
  if (phone !== undefined) {
    const p = String(phone).trim();
    if (!PHONE_RE.test(p)) { res.status(400); throw new Error('Mobile number must be exactly 10 digits'); }
    user.phone = p;
  }
  if (bio !== undefined) {
    if (String(bio).length > 300) { res.status(400); throw new Error('Description can be at most 300 characters'); }
    user.bio = String(bio).trim();
  }
  if (avatar !== undefined) user.avatar = avatar;

  user.profileCompleted = fieldsValid(user);
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
  const pwError = validatePassword(newPassword);
  if (pwError) { res.status(400); throw new Error(pwError); }
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

  const pwError = validatePassword(req.body.password);
  if (pwError) { res.status(400); throw new Error(pwError); }
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
  profileComplete: isProfileComplete(user),
  authProvider: user.googleId ? 'google' : 'local',
  createdAt: user.createdAt,
});

module.exports = {
  checkEmail,
  sendOtp,
  getAuthConfig,
  googleLogin,
  registerUser,
  loginUser,
  getMe,
  updateMe,
  changePassword,
  forgotPassword,
  resetPassword,
  sanitizeUser,
};
