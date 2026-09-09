const express = require('express');
const router = express.Router();
const { uploadImage, getImage, deleteImage } = require('../controllers/imageController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public - images must load in <img> tags without auth headers
router.get('/:id', getImage);

// Private - any authenticated role can upload (gallery, club cover, event banner, avatar)
router.post('/', protect, upload.single('image'), uploadImage);
router.delete('/:id', protect, deleteImage);

module.exports = router;
