const express = require('express');
const router = express.Router();
const { getGallery, addImage, removeImage } = require('../controllers/galleryController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.get('/', getGallery); // public
router.post('/', protect, authorize('admin', 'president', 'coordinator'), addImage);
router.delete('/:id', protect, authorize('admin', 'president', 'coordinator'), removeImage);

module.exports = router;
