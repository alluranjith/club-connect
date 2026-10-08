const mongoose = require('mongoose');

// College-issued email addresses imported by the admin from a CSV / Excel sheet.
// Only these addresses may register (OTP) or sign in with Google.
const allowedEmailSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, default: '', trim: true, maxlength: 80 },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AllowedEmail', allowedEmailSchema);
