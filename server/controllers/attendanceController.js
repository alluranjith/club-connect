const asyncHandler = require('express-async-handler');
const Attendance = require('../models/Attendance');
const Participation = require('../models/Participation');
const Event = require('../models/Event');

// @desc  Mark attendance for a member at an event (coordinator only, own club)
// @route POST /api/attendance
// @access Private/Coordinator
const markAttendance = asyncHandler(async (req, res) => {
  const { eventId, userId, present } = req.body;

  const event = await Event.findById(eventId);
  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }
  if (req.user.role === 'coordinator' && String(req.user.club) !== String(event.club)) {
    res.status(403);
    throw new Error('You can only mark attendance for your own club events');
  }

  const attendance = await Attendance.findOneAndUpdate(
    { event: eventId, user: userId },
    { event: eventId, user: userId, club: event.club, present, markedBy: req.user._id, markedAt: new Date() },
    { upsert: true, new: true }
  );

  // keep Participation.attended in sync for tracking/exports
  await Participation.findOneAndUpdate(
    { event: eventId, user: userId },
    { $set: { attended: !!present } },
    { upsert: true }
  );

  res.json({ success: true, attendance });
});

// @desc  Get attendance list for an event
// @route GET /api/attendance/event/:eventId
// @access Private/Admin,President,Coordinator
const getEventAttendance = asyncHandler(async (req, res) => {
  const records = await Attendance.find({ event: req.params.eventId }).populate('user', 'name email');
  res.json({ success: true, count: records.length, records });
});

module.exports = { markAttendance, getEventAttendance };
