const mongoose = require('mongoose');

// One live OTP per email. Stored hashed; MongoDB deletes it automatically after expiresAt (TTL).
const emailOtpSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  otpHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  lastSentAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
});

module.exports = mongoose.model('EmailOtp', emailOtpSchema);
