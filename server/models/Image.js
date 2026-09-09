const mongoose = require('mongoose');

// Images are stored directly in MongoDB (binary + content type) instead of
// relying on external URLs. Small/medium campus-club photo volumes make this
// simple and keeps everything in one database with no extra file storage setup.
const imageSchema = new mongoose.Schema(
  {
    data: { type: Buffer, required: true },
    contentType: { type: String, required: true },
    originalName: { type: String, default: '' },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Image', imageSchema);
