const mongoose = require('mongoose');

// Tracks that a user (club member or non-club member) participated/registered in an event.
// Used for "previous participations" views and CSV export.
const participationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', default: null },
    registeredAt: { type: Date, default: Date.now },
    attended: { type: Boolean, default: false },
  },
  { timestamps: true }
);

participationSchema.index({ user: 1, event: 1 }, { unique: true });

module.exports = mongoose.model('Participation', participationSchema);
