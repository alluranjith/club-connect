const express = require('express');
const router = express.Router();
const {
  getNotifications,
  createNotification,
  deleteNotification,
  markAsRead,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.get('/', protect, getNotifications);
router.post('/', protect, authorize('admin', 'president', 'coordinator'), createNotification);
router.delete('/:id', protect, authorize('admin', 'president', 'coordinator'), deleteNotification);
router.put('/:id/read', protect, markAsRead);

module.exports = router;
