const asyncHandler = require('express-async-handler');
const Attendance = require('../models/Attendance');
const Participation = require('../models/Participation');
const Event = require('../models/Event');

// @desc  Mark attendance for a participant of an event (president or coordinator, own club only)
// @route POST /api/attendance
// @access Private/President,Coordinator
const markAttendance = asyncHandler(async (req, res) => {
  const { eventId, userId, present } = req.body;

  const event = await Event.findById(eventId);
  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }
  if (String(req.user.club) !== String(event.club)) {
    res.status(403);
    throw new Error('You can only manage attendance for your own club events');
  }
  if (!event.participants.some((id) => String(id) === String(userId))) {
    res.status(400);
    throw new Error("This person hasn't registered for the event");
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
  const event = await Event.findById(req.params.eventId).select('club');
  if (!event) { res.status(404); throw new Error('Event not found'); }
  if (req.user.role !== 'admin' && String(req.user.club) !== String(event.club)) {
    res.status(403);
    throw new Error('You can only view attendance for your own club events');
  }
  const records = await Attendance.find({ event: req.params.eventId }).populate('user', 'name email');
  res.json({ success: true, count: records.length, records });
});

// @desc  Mark everyone (or a list of participants) present/absent in one go
// @route POST /api/attendance/bulk   body: { eventId, present, userIds? (default: all participants) }
// @access Private/President,Coordinator
const markAttendanceBulk = asyncHandler(async (req, res) => {
  const { eventId, present, userIds } = req.body;
  const event = await Event.findById(eventId);
  if (!event) { res.status(404); throw new Error('Event not found'); }
  if (String(req.user.club) !== String(event.club)) {
    res.status(403);
    throw new Error('You can only manage attendance for your own club events');
  }
  const registered = event.participants.map(String);
  const targets = (Array.isArray(userIds) && userIds.length ? userIds.map(String) : registered).filter((id) => registered.includes(id));
  const now = new Date();
  if (targets.length) {
    await Attendance.bulkWrite(targets.map((u) => ({
      updateOne: {
        filter: { event: event._id, user: u },
        update: { $set: { club: event.club, present: !!present, markedBy: req.user._id, markedAt: now } },
        upsert: true,
      },
    })));
    await Participation.updateMany({ event: event._id, user: { $in: targets } }, { $set: { attended: !!present } });
  }
  res.json({ success: true, updated: targets.length });
});

module.exports = { markAttendance, markAttendanceBulk, getEventAttendance };
