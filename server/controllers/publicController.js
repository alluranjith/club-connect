const asyncHandler = require('express-async-handler');
const Club = require('../models/Club');
const User = require('../models/User');
const Event = require('../models/Event');

// @desc  Platform-wide public stats for the homepage hero (clubs, members, events)
// @route GET /api/public/stats
// @access Public
const getPublicStats = asyncHandler(async (req, res) => {
  const [clubs, members, eventsConducted] = await Promise.all([
    Club.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'member', membershipStatus: 'accepted' }),
    Event.countDocuments({ status: { $in: ['completed', 'ongoing'] } }),
  ]);

  res.json({ success: true, stats: { clubs, members, eventsConducted } });
});

module.exports = { getPublicStats };
