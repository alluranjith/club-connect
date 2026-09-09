const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Club = require('../models/Club');
const Event = require('../models/Event');
const Gallery = require('../models/Gallery');

// @desc  Admin dashboard summary stats
// @route GET /api/admin/stats
// @access Private/Admin
const getStats = asyncHandler(async (req, res) => {
  const [totalClubs, activeClubs, totalUsers, totalMembers, totalPresidents, totalCoordinators, totalEvents, upcomingEvents, galleryCount] =
    await Promise.all([
      Club.countDocuments({}),
      Club.countDocuments({ isActive: true }),
      User.countDocuments({}),
      User.countDocuments({ role: 'member' }),
      User.countDocuments({ role: 'president' }),
      User.countDocuments({ role: 'coordinator' }),
      Event.countDocuments({}),
      Event.countDocuments({ status: 'upcoming' }),
      Gallery.countDocuments({}),
    ]);

  res.json({
    success: true,
    stats: {
      totalClubs,
      activeClubs,
      disbandedClubs: totalClubs - activeClubs,
      totalUsers,
      totalMembers,
      totalPresidents,
      totalCoordinators,
      totalEvents,
      upcomingEvents,
      galleryCount,
    },
  });
});

// @desc  List all users (admin) with optional role filter
// @route GET /api/admin/users
// @access Private/Admin
const getAllUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  const users = await User.find(filter).populate('club', 'name').sort({ createdAt: -1 });
  res.json({ success: true, count: users.length, users });
});

// @desc  Activate / deactivate any user account
// @route PUT /api/admin/users/:id/status
// @access Private/Admin
const setUserActiveStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  user.isActive = req.body.isActive;
  await user.save();
  res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}` });
});

module.exports = { getStats, getAllUsers, setUserActiveStatus };
