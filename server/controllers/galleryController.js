const asyncHandler = require('express-async-handler');
const Gallery = require('../models/Gallery');

// @desc  Get gallery images (public) - optional ?club= filter
// @route GET /api/gallery
// @access Public
const getGallery = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.club) filter.club = req.query.club;

  const images = await Gallery.find(filter)
    .populate('uploadedBy', 'name role')
    .populate('club', 'name')
    .sort({ createdAt: -1 });

  res.json({ success: true, count: images.length, images });
});

// @desc  Upload/post an image to the gallery
// @route POST /api/gallery
// @access Private/Admin,President,Coordinator
const addImage = asyncHandler(async (req, res) => {
  const { imageUrl, caption, event } = req.body;

  if (!imageUrl) {
    res.status(400);
    throw new Error('imageUrl is required');
  }

  const image = await Gallery.create({
    imageUrl,
    caption,
    event: event || null,
    club: req.user.role === 'admin' ? req.body.club || null : req.user.club,
    uploadedBy: req.user._id,
  });

  res.status(201).json({ success: true, image });
});

// @desc  Remove an image from the gallery
// @route DELETE /api/gallery/:id
// @access Private/Admin,President,Coordinator
const removeImage = asyncHandler(async (req, res) => {
  const image = await Gallery.findById(req.params.id);
  if (!image) {
    res.status(404);
    throw new Error('Image not found');
  }
  if (req.user.role !== 'admin' && String(image.club) !== String(req.user.club)) {
    res.status(403);
    throw new Error('You can only remove images from your own club gallery');
  }
  await image.deleteOne();
  res.json({ success: true, message: 'Image removed' });
});

module.exports = { getGallery, addImage, removeImage };
