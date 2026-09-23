const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Club = require('../models/Club');
const Event = require('../models/Event');
const Attendance = require('../models/Attendance');
const Participation = require('../models/Participation');
const JoinRequest = require('../models/JoinRequest');

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Builds the last `count` months as { key: 'YYYY-M', label: 'Mon' }, oldest first,
// so trend charts always show a consistent, contiguous timeline even for months with no data.
const lastMonths = (count = 6) => {
  const out = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTH_LABELS[d.getMonth()], year: d.getFullYear(), month: d.getMonth() });
  }
  return out;
};

// Core aggregation shared by both the single-club view and the admin's all-clubs comparison.
const buildClubAnalytics = async (club) => {
  const clubId = club._id;

  const [events, attendanceAgg, participationCount, joinRequests] = await Promise.all([
    Event.find({ club: clubId }).select('title status date participants').lean(),
    Attendance.aggregate([
      { $match: { club: new mongoose.Types.ObjectId(clubId) } },
      { $group: { _id: '$event', present: { $sum: { $cond: ['$present', 1, 0] } }, total: { $sum: 1 } } },
    ]),
    Participation.countDocuments({ club: clubId }),
    JoinRequest.find({ club: clubId, status: 'accepted' }).select('decidedAt createdAt').lean(),
  ]);

  const eventsByStatus = { upcoming: 0, ongoing: 0, completed: 0, cancelled: 0 };
  events.forEach((e) => { eventsByStatus[e.status] = (eventsByStatus[e.status] || 0) + 1; });

  const months = lastMonths(6);
  const eventsByMonth = months.map((m) => ({ label: m.label, count: 0 }));
  events.forEach((e) => {
    const d = new Date(e.date);
    const idx = months.findIndex((m) => m.year === d.getFullYear() && m.month === d.getMonth());
    if (idx !== -1) eventsByMonth[idx].count += 1;
  });

  const memberGrowth = months.map((m) => ({ label: m.label, count: 0 }));
  joinRequests.forEach((jr) => {
    const d = new Date(jr.decidedAt || jr.createdAt);
    const idx = months.findIndex((m) => m.year === d.getFullYear() && m.month === d.getMonth());
    if (idx !== -1) memberGrowth[idx].count += 1;
  });
  // running total so the chart reads as cumulative club size, not just monthly deltas
  let running = 0;
  memberGrowth.forEach((m) => { running += m.count; m.cumulative = running; });

  const totalPresent = attendanceAgg.reduce((s, a) => s + a.present, 0);
  const totalMarked = attendanceAgg.reduce((s, a) => s + a.total, 0);
  const attendanceRate = totalMarked ? Math.round((totalPresent / totalMarked) * 100) : 0;

  const eventTitleById = Object.fromEntries(events.map((e) => [String(e._id), e.title]));
  const topEventsByAttendance = attendanceAgg
    .map((a) => ({
      title: eventTitleById[String(a._id)] || 'Untitled event',
      present: a.present,
      total: a.total,
      rate: a.total ? Math.round((a.present / a.total) * 100) : 0,
    }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 5);

  return {
    clubId,
    clubName: club.name,
    summary: {
      members: club.members?.length || 0,
      coordinators: club.coordinators?.length || 0,
      totalEvents: events.length,
      upcomingEvents: eventsByStatus.upcoming,
      completedEvents: eventsByStatus.completed,
      totalParticipants: participationCount,
      attendanceRate,
    },
    eventsByStatus,
    eventsByMonth,
    memberGrowth,
    topEventsByAttendance,
  };
};

// @desc  Analytics for a single club - the club's own president, or admin for any club
// @route GET /api/analytics/club/:id
// @access Private/Admin,President
const getClubAnalytics = asyncHandler(async (req, res) => {
  const club = await Club.findById(req.params.id).select('name members coordinators');
  if (!club) {
    res.status(404);
    throw new Error('Club not found');
  }
  if (req.user.role === 'president' && String(req.user.club) !== String(club._id)) {
    res.status(403);
    throw new Error('You can only view analytics for your own club');
  }

  const analytics = await buildClubAnalytics(club);
  res.json({ success: true, analytics });
});

// @desc  Platform-wide analytics - every club compared side by side
// @route GET /api/analytics/overview
// @access Private/Admin
const getPlatformAnalytics = asyncHandler(async (req, res) => {
  const clubs = await Club.find({ isActive: true }).select('name members coordinators');

  const perClub = await Promise.all(clubs.map(buildClubAnalytics));

  const totals = perClub.reduce(
    (acc, c) => {
      acc.totalMembers += c.summary.members;
      acc.totalEvents += c.summary.totalEvents;
      acc.totalParticipants += c.summary.totalParticipants;
      return acc;
    },
    { totalMembers: 0, totalEvents: 0, totalParticipants: 0 }
  );
  const ratedClubs = perClub.filter((c) => c.summary.attendanceRate > 0);
  totals.avgAttendanceRate = ratedClubs.length
    ? Math.round(ratedClubs.reduce((s, c) => s + c.summary.attendanceRate, 0) / ratedClubs.length)
    : 0;
  totals.totalClubs = perClub.length;

  const clubComparison = perClub
    .map((c) => ({
      clubId: c.clubId,
      clubName: c.clubName,
      members: c.summary.members,
      totalEvents: c.summary.totalEvents,
      attendanceRate: c.summary.attendanceRate,
      totalParticipants: c.summary.totalParticipants,
    }))
    .sort((a, b) => b.members - a.members);

  // merge each club's month-by-month event trend into one platform-wide trend
  const months = lastMonths(6);
  const platformEventTrend = months.map((m, i) => ({
    label: m.label,
    count: perClub.reduce((s, c) => s + (c.eventsByMonth[i]?.count || 0), 0),
  }));
  const platformMemberGrowth = months.map((m, i) => ({
    label: m.label,
    count: perClub.reduce((s, c) => s + (c.memberGrowth[i]?.count || 0), 0),
  }));
  let running = 0;
  platformMemberGrowth.forEach((m) => { running += m.count; m.cumulative = running; });

  res.json({
    success: true,
    analytics: { totals, clubComparison, platformEventTrend, platformMemberGrowth },
  });
});

module.exports = { getClubAnalytics, getPlatformAnalytics };
