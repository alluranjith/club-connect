const mongoose = require('mongoose');

const clubSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, default: 'General' },
    coverImage: { type: String, default: '' },
    president: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    coordinators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // Public social media links the president can publish (e.g. { name: 'Instagram', url: 'https://...' })
    socialLinks: [
      {
        name: { type: String, required: true, trim: true, maxlength: 30 },
        url: { type: String, required: true, trim: true, maxlength: 300 },
      },
    ],
    // Office bearers / role holders. Each entry points at a REAL user account (found by email), so the
    // name, photo, email and mobile always come from that user's own profile - nothing is typed in twice.
    // The president only chooses the role, the display order and which contact details are public.
    team: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, required: true, trim: true, maxlength: 60 },
        order: { type: Number, default: 100 },
        showEmail: { type: Boolean, default: true },
        showPhone: { type: Boolean, default: false },
        // legacy snapshot (entries typed in manually before roles were linked to accounts)
        name: { type: String, trim: true, maxlength: 80 },
        email: { type: String, default: '', trim: true, lowercase: true },
        phone: { type: String, default: '', trim: true },
        image: { type: String, default: '' },
      },
    ],
    isActive: { type: Boolean, default: true }, // false = disintegrated/disbanded by admin
    disbandedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Club', clubSchema);
