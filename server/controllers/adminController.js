const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Club = require('../models/Club');
const Event = require('../models/Event');
const Gallery = require('../models/Gallery');
const AllowedEmail = require('../models/AllowedEmail');
const JoinRequest = require('../models/JoinRequest');
const XLSX = require('xlsx');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Reads the first sheet of a CSV / XLS / XLSX buffer and returns [{ email, name }].
// Finds the email column by its header ("Email", "College Email", ...) or, when there is no header,
// by picking the column that contains the most email-looking values.
const parseEmailSheet = (buffer) => {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return [];
  const grid = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
  if (!grid.length) return [];

  const header = grid[0].map((c) => String(c).toLowerCase());
  let emailCol = header.findIndex((h) => /e-?mail/.test(h));
  let start = 1;
  let nameCol = -1;
  if (emailCol === -1) {
    const scores = {};
    grid.slice(0, 200).forEach((r) => r.forEach((c, i) => { if (EMAIL_RE.test(String(c).trim())) scores[i] = (scores[i] || 0) + 1; }));
    const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
    if (!best) return [];
    emailCol = Number(best[0]);
    start = 0;
  } else {
    nameCol = header.findIndex((h, i) => i !== emailCol && /name/.test(h));
  }
  return grid.slice(start).map((r) => ({
    email: String(r[emailCol] || '').trim().toLowerCase(),
    name: nameCol > -1 ? String(r[nameCol] || '').trim().slice(0, 80) : '',
  }));
};

// @desc  Import college emails from an uploaded CSV/Excel file (append or replace)
// @route POST /api/admin/allowed-emails/import   (multipart: file, mode=append|replace)
// @access Private/Admin
const importAllowedEmails = asyncHandler(async (req, res) => {
  if (!req.file) { res.status(400); throw new Error('Please choose a CSV or Excel file'); }
  let rows;
  try { rows = parseEmailSheet(req.file.buffer); } catch (e) { res.status(400); throw new Error('Could not read that file. Upload a valid .csv, .xlsx or .xls'); }

  const unique = new Map();
  let invalid = 0;
  rows.forEach((r) => {
    if (!r.email) return; // blank line
    if (!EMAIL_RE.test(r.email)) { invalid += 1; return; }
    if (!unique.has(r.email)) unique.set(r.email, r.name);
  });
  if (unique.size === 0) { res.status(400); throw new Error('No valid email addresses were found in the file'); }
  if (unique.size > 50000) { res.status(400); throw new Error('Too many rows (limit 50,000 per upload)'); }

  const mode = req.body.mode === 'replace' ? 'replace' : 'append';
  if (mode === 'replace') await AllowedEmail.deleteMany({});

  const ops = [...unique.entries()].map(([email, name]) => ({
    updateOne: {
      filter: { email },
      update: { $set: name ? { name } : {}, $setOnInsert: { addedBy: req.user._id } },
      upsert: true,
    },
  }));
  const result = await AllowedEmail.bulkWrite(ops, { ordered: false });

  res.json({
    success: true,
    mode,
    found: unique.size,
    added: result.upsertedCount,
    alreadyPresent: unique.size - result.upsertedCount,
    invalid,
    total: await AllowedEmail.countDocuments({}),
  });
});

// @desc  List / search allowed emails (paginated)
// @route GET /api/admin/allowed-emails?q=&page=&limit=
// @access Private/Admin
const listAllowedEmails = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 25);
  const q = String(req.query.q || '').trim();
  const rx = q ? new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : null;
  const filter = rx ? { $or: [{ email: rx }, { name: rx }] } : {};

  const [items, total, all] = await Promise.all([
    AllowedEmail.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    AllowedEmail.countDocuments(filter),
    AllowedEmail.countDocuments({}),
  ]);
  const registered = await User.find({ email: { $in: items.map((i) => i.email) } }).select('email').lean();
  const regSet = new Set(registered.map((u) => u.email));
  res.json({
    success: true,
    total,
    allTotal: all,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
    items: items.map((i) => ({ ...i, registered: regSet.has(i.email) })),
  });
});

// @desc  Add a single allowed email
// @route POST /api/admin/allowed-emails
const addAllowedEmail = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) { res.status(400); throw new Error('Enter a valid email address'); }
  if (await AllowedEmail.exists({ email })) { res.status(400); throw new Error('This email is already in the list'); }
  const item = await AllowedEmail.create({ email, name: String(req.body.name || '').trim().slice(0, 80), addedBy: req.user._id });
  res.status(201).json({ success: true, item });
});

// @desc  Remove an allowed email (existing accounts are NOT deleted)
// @route DELETE /api/admin/allowed-emails/:id
const deleteAllowedEmail = asyncHandler(async (req, res) => {
  const item = await AllowedEmail.findById(req.params.id);
  if (!item) { res.status(404); throw new Error('Email not found in the list'); }
  await item.deleteOne();
  res.json({ success: true, message: 'Email removed' });
});

// @desc  One user's full details + clubs they belong to (and why they joined)
// @route GET /api/admin/users/:id
const getUserDetails = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate('club', 'name');
  if (!user) { res.status(404); throw new Error('User not found'); }
  const clubs = await Club.find({ members: user._id }).select('name category').lean();
  const joins = await JoinRequest.find({ user: user._id, status: 'accepted' }).select('club message decidedAt').lean();
  const memberships = clubs.map((c) => {
    const j = joins.find((x) => String(x.club) === String(c._id));
    return { club: c, joinedAt: j?.decidedAt || null, intent: j?.message || '' };
  });
  res.json({ success: true, user, memberships });
});


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

module.exports = {
  importAllowedEmails,
  listAllowedEmails,
  addAllowedEmail,
  deleteAllowedEmail,
  getUserDetails, getStats, getAllUsers, setUserActiveStatus };
