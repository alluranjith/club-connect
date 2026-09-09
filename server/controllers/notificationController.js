const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');

// @desc  Get notifications relevant to logged-in user (platform-wide + own club)
// @route GET /api/notifications
// @access Private
const getNotifications = asyncHandler(async (req, res) => {
  const filter = req.user.club
    ? { $or: [{ club: null }, { club: req.user.club }] }
    : { club: null };

  const notifications = await Notification.find(filter)
    .populate('createdBy', 'name role')
    .populate('club', 'name')
    .sort({ createdAt: -1 });

  res.json({ success: true, count: notifications.length, notifications });
});

// @desc  Create a notification (admin = platform-wide, president/coordinator = own club)
// @route POST /api/notifications
// @access Private/Admin,President,Coordinator
const createNotification = asyncHandler(async (req, res) => {
  const { title, message, type, event } = req.body;

  const notification = await Notification.create({
    title,
    message,
    type: type || 'general',
    event: event || null,
    club: req.user.role === 'admin' ? null : req.user.club,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, notification });
});

// @desc  Delete a notification
// @route DELETE /api/notifications/:id
// @access Private/Admin,President,Coordinator (own)
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }
  if (req.user.role !== 'admin' && String(notification.createdBy) !== String(req.user._id)) {
    res.status(403);
    throw new Error('You can only delete your own notifications');
  }
  await notification.deleteOne();
  res.json({ success: true, message: 'Notification deleted' });
});

// @desc  Mark a notification as read by current user
// @route PUT /api/notifications/:id/read
// @access Private
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }
  if (!notification.readBy.includes(req.user._id)) {
    notification.readBy.push(req.user._id);
    await notification.save();
  }
  res.json({ success: true });
});

module.exports = { getNotifications, createNotification, deleteNotification, markAsRead };
