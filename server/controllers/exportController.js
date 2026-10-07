const asyncHandler = require('express-async-handler');
const { Parser } = require('json2csv');
const Attendance = require('../models/Attendance');
const Participation = require('../models/Participation');
const Club = require('../models/Club');
const Event = require('../models/Event');
const JoinRequest = require('../models/JoinRequest');

// Cells starting with = + - @ are executed as formulas by Excel - neutralise them (CSV injection).
const safeCell = (v) => (typeof v === 'string' && /^[=+\-@\t\r]/.test(v) ? `'${v}` : v);
const safeRows = (rows) => rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, safeCell(v)])));

// admin: anything; president/coordinator: only their own club
const canAccessClub = (user, clubId) => user.role === 'admin' || String(user.club) === String(clubId);

const sendCsv = (res, filename, rows) => {
  rows = safeRows(rows);
  const parser = new Parser({ withBOM: true });
  const csv = parser.parse(rows);
  res.header('Content-Type', 'text/csv');
  res.attachment(filename);
  return res.send(csv);
};

// @desc  Export attendance for an event as CSV
// @route GET /api/export/attendance/:eventId
// @access Private/Admin,President,Coordinator
const exportAttendance = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.eventId).select('club');
  if (!event) { res.status(404); throw new Error('Event not found'); }
  if (req.user.role !== 'admin' && String(req.user.club) !== String(event.club)) {
    res.status(403);
    throw new Error('You can only export data for your own club\'s events');
  }
  const records = await Attendance.find({ event: req.params.eventId }).populate('user', 'name email');
  const rows = records.map((r) => ({
    Name: r.user?.name,
    Email: r.user?.email,
    Present: r.present ? 'Yes' : 'No',
    MarkedAt: r.markedAt?.toISOString(),
  }));
  sendCsv(res, `attendance_${req.params.eventId}.csv`, rows.length ? rows : [{ Name: '', Email: '', Present: '', MarkedAt: '' }]);
});

// @desc  Export participation history for an event as CSV
// @route GET /api/export/participation/:eventId
// @access Private/Admin,President,Coordinator
const exportParticipation = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.eventId).select('club');
  if (!event) { res.status(404); throw new Error('Event not found'); }
  if (req.user.role !== 'admin' && String(req.user.club) !== String(event.club)) {
    res.status(403);
    throw new Error('You can only export data for your own club\'s events');
  }
  const records = await Participation.find({ event: req.params.eventId }).populate('user', 'name email');
  const rows = records.map((r) => ({
    Name: r.user?.name,
    Email: r.user?.email,
    RegisteredAt: r.registeredAt?.toISOString(),
    Attended: r.attended ? 'Yes' : 'No',
  }));
  sendCsv(res, `participation_${req.params.eventId}.csv`, rows.length ? rows : [{ Name: '', Email: '', RegisteredAt: '', Attended: '' }]);
});

// @desc  Export a club's member list as CSV
// @route GET /api/export/members/:clubId
// @access Private/Admin,President,Coordinator
const exportMembers = asyncHandler(async (req, res) => {
  if (!canAccessClub(req.user, req.params.clubId)) {
    res.status(403);
    throw new Error('You can only export members of your own club');
  }
  const club = await Club.findById(req.params.clubId).populate('members', 'name email phone');
  if (!club) {
    res.status(404);
    throw new Error('Club not found');
  }
  const joins = await JoinRequest.find({ club: club._id, status: 'accepted' }).select('user message decidedAt').lean();
  const byUser = new Map(joins.map((j) => [String(j.user), j]));
  const rows = club.members.map((m) => {
    const j = byUser.get(String(m._id));
    return {
      Name: m.name,
      Email: m.email,
      Phone: m.phone,
      'Joined On': j?.decidedAt ? new Date(j.decidedAt).toISOString().slice(0, 10) : '',
      'Reason For Joining': j?.message || '',
    };
  });
  const safeName = club.name.replace(/[^a-z0-9]+/gi, '_');
  sendCsv(res, `members_${safeName}.csv`, rows.length ? rows : [{ Name: '', Email: '', Phone: '', 'Joined On': '', 'Reason For Joining': '' }]);
});

module.exports = { exportAttendance, exportParticipation, exportMembers };
