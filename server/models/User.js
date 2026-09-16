const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: {
      type: String,
      enum: ['admin', 'president', 'coordinator', 'member'],
      default: 'member',
      required: true,
    },
    // For president/coordinator - the single club they lead/support.
    // NOTE: members do NOT use this field. A student can belong to multiple
    // clubs at once, so membership is tracked per-club via Club.members[]
    // and per-request via the JoinRequest collection, not as a single value here.
    club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', default: null },

    phone: { type: String, default: '' },
    avatar: { type: String, default: '' },
    bio: { type: String, default: '' },

    isActive: { type: Boolean, default: true },

    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
  return resetToken;
};

module.exports = mongoose.model('User', userSchema);
