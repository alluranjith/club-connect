const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['event', 'general', 'club', 'alert'], default: 'general' },
    club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', default: null }, // null = platform-wide (admin)
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
