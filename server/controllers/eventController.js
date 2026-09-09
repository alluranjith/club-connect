const asyncHandler = require('express-async-handler');
const Event = require('../models/Event');
const Participation = require('../models/Participation');

// @desc  Get all events (public can view too - upcoming/ongoing/completed)
// @route GET /api/events
// @access Public
const getEvents = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.club) filter.club = req.query.club;
  if (req.query.status) filter.status = req.query.status;

  const events = await Event.find(filter)
    .populate('club', 'name')
    .populate('createdBy', 'name role')
    .sort({ date: -1 });
  res.json({ success: true, count: events.length, events });
});

// @desc  Get single event with participant count
// @route GET /api/events/:id
// @access Public
const getEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id)
    .populate('club', 'name')
    .populate('createdBy', 'name role')
    .populate('participants', 'name email');
  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }
  res.json({ success: true, event });
});

// @desc  Create event (admin = platform-wide, president/coordinator = own club)
// @route POST /api/events
// @access Private/Admin,President,Coordinator
const createEvent = asyncHandler(async (req, res) => {
  const { title, description, venue, date, endDate, bannerImage } = req.body;

  const event = await Event.create({
    title,
    description,
    venue,
    date,
    endDate,
    bannerImage,
    club: req.user.role === 'admin' ? req.body.club || null : req.user.club,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, event });
});

// @desc  Update event (creator's club or admin)
// @route PUT /api/events/:id
// @access Private/Admin,President,Coordinator
const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }
  if (req.user.role !== 'admin' && String(req.user.club) !== String(event.club)) {
    res.status(403);
    throw new Error('You can only edit events for your own club');
  }

  Object.assign(event, req.body);
  await event.save();
  res.json({ success: true, event });
});

// @desc  Delete/cancel an event
// @route DELETE /api/events/:id
// @access Private/Admin,President,Coordinator
const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }
  if (req.user.role !== 'admin' && String(req.user.club) !== String(event.club)) {
    res.status(403);
    throw new Error('You can only delete events for your own club');
  }
  await event.deleteOne();
  res.json({ success: true, message: 'Event removed' });
});

// @desc  Register/participate in an event - any logged-in member (club or non-club)
// @route POST /api/events/:id/participate
// @access Private/Member
const participateInEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }

  if (!event.participants.includes(req.user._id)) {
    event.participants.push(req.user._id);
    await event.save();
  }

  await Participation.findOneAndUpdate(
    { user: req.user._id, event: event._id },
    { user: req.user._id, event: event._id, club: event.club },
    { upsert: true, new: true }
  );

  res.json({ success: true, message: 'Registered for event', event });
});

// @desc  Get logged-in user's previous participations
// @route GET /api/events/my/participations
// @access Private
const getMyParticipations = asyncHandler(async (req, res) => {
  const records = await Participation.find({ user: req.user._id })
    .populate({ path: 'event', select: 'title date venue status' })
    .sort({ createdAt: -1 });
  res.json({ success: true, count: records.length, records });
});

// @desc  Event tracking overview - counts, attendance %, per-club breakdown (admin/president/coordinator)
// @route GET /api/events/:id/tracking
// @access Private/Admin,President,Coordinator
const trackEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id).populate('participants', 'name email');
  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }
  const totalRegistered = event.participants.length;
  const attendedCount = await Participation.countDocuments({ event: event._id, attended: true });

  res.json({
    success: true,
    tracking: {
      eventId: event._id,
      title: event.title,
      totalRegistered,
      attendedCount,
      attendanceRate: totalRegistered ? ((attendedCount / totalRegistered) * 100).toFixed(1) : '0.0',
      participants: event.participants,
    },
  });
});

module.exports = {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  participateInEvent,
  getMyParticipations,
  trackEvent,
};
