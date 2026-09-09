const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true },
    caption: { type: String, default: '' },
    club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', default: null }, // null = general/platform gallery
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', default: null },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Gallery', gallerySchema);
