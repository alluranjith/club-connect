const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
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
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const limiter = (max, minutes) =>
  rateLimit({ windowMs: minutes * 60 * 1000, limit: max, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many attempts - please try again later' } });

router.get('/config', getAuthConfig);
router.post('/check-email', limiter(40, 10), checkEmail);
router.post('/send-otp', limiter(10, 60), sendOtp);
router.post('/google', limiter(30, 15), googleLogin);
router.post('/register', limiter(20, 60), registerUser);
router.post('/login', limiter(40, 15), loginUser);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.put('/change-password', protect, changePassword);

module.exports = router;
