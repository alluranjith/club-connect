const asyncHandler = require('express-async-handler');
const { Parser } = require('json2csv');
const Attendance = require('../models/Attendance');
const Participation = require('../models/Participation');
const Club = require('../models/Club');

const sendCsv = (res, filename, rows) => {
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
  const club = await Club.findById(req.params.clubId).populate('members', 'name email phone membershipStatus');
  if (!club) {
    res.status(404);
    throw new Error('Club not found');
  }
  const rows = club.members.map((m) => ({
    Name: m.name,
    Email: m.email,
    Phone: m.phone,
    Status: m.membershipStatus,
  }));
  sendCsv(res, `members_${club.name}.csv`, rows.length ? rows : [{ Name: '', Email: '', Phone: '', Status: '' }]);
});

module.exports = { exportAttendance, exportParticipation, exportMembers };
