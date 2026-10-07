const asyncHandler = require('express-async-handler');
const Club = require('../models/Club');
const Event = require('../models/Event');
const { syncEventStatuses } = require('../utils/eventStatus');

// @desc  Platform-wide public stats for the homepage hero (clubs, members, events)
// @route GET /api/public/stats
// @access Public
const getPublicStats = asyncHandler(async (req, res) => {
  await syncEventStatuses();
  // distinct() naturally de-duplicates, so a student in several clubs is only
  // counted once here even though they appear in multiple Club.members arrays.
  const [clubs, memberIds, eventsConducted] = await Promise.all([
    Club.countDocuments({ isActive: true }),
    Club.distinct('members', { isActive: true }),
    Event.countDocuments({ status: { $in: ['completed', 'ongoing'] } }),
  ]);

  res.json({ success: true, stats: { clubs, members: memberIds.length, eventsConducted } });
});

module.exports = { getPublicStats };
