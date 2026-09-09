const asyncHandler = require('express-async-handler');
const Image = require('../models/Image');

// @desc  Upload an image (drag-and-drop or file picker) - stored as binary in MongoDB
// @route POST /api/images
// @access Private (any authenticated role - admin/president/coordinator/member)
const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No image file was provided');
  }

  const image = await Image.create({
    data: req.file.buffer,
    contentType: req.file.mimetype,
    originalName: req.file.originalname,
    uploadedBy: req.user._id,
  });

  // Frontend stores this URL and uses it directly in <img src>, gallery entries,
  // club cover images, event banners, etc. - same shape as before, but now backed
  // by our own DB-served endpoint instead of an arbitrary external link.
  res.status(201).json({ success: true, url: `/api/images/${image._id}`, id: image._id });
});

// @desc  Serve an uploaded image's raw bytes
// @route GET /api/images/:id
// @access Public (images need to render in <img> tags without auth headers)
const getImage = asyncHandler(async (req, res) => {
  const image = await Image.findById(req.params.id);
  if (!image) {
    res.status(404);
    throw new Error('Image not found');
  }
  res.set('Content-Type', image.contentType);
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  res.send(image.data);
});

// @desc  Delete an uploaded image
// @route DELETE /api/images/:id
// @access Private (uploader or admin)
const deleteImage = asyncHandler(async (req, res) => {
  const image = await Image.findById(req.params.id);
  if (!image) {
    res.status(404);
    throw new Error('Image not found');
  }
  if (req.user.role !== 'admin' && String(image.uploadedBy) !== String(req.user._id)) {
    res.status(403);
    throw new Error('You can only delete images you uploaded');
  }
  await image.deleteOne();
  res.json({ success: true, message: 'Image deleted' });
});

module.exports = { uploadImage, getImage, deleteImage };
