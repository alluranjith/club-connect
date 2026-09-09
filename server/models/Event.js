const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', default: null }, // null = platform-wide event (admin)
    venue: { type: String, default: '' },
    date: { type: Date, required: true },
    endDate: { type: Date },
    bannerImage: { type: String, default: '' },
    status: { type: String, enum: ['upcoming', 'ongoing', 'completed', 'cancelled'], default: 'upcoming' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // registered participants (club members + non-club members can join events)
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);
