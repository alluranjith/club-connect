const asyncHandler = require('express-async-handler');
const Club = require('../models/Club');
const User = require('../models/User');
const JoinRequest = require('../models/JoinRequest');
const { isProfileComplete } = require('../utils/profile');

// Only http(s) links are stored (blocks javascript: URLs); bare domains get https:// added.
const cleanSocialLinks = (links) => {
  if (!Array.isArray(links)) return [];
  return links
    .slice(0, 10)
    .map((l) => {
      const name = String(l?.name || '').trim().slice(0, 30);
      let url = String(l?.url || '').trim().slice(0, 300);
      if (url && !/^[a-z][a-z0-9+.-]*:/i.test(url)) url = `https://${url}`;
      return { name, url };
    })
    .filter((l) => l.name && /^https?:\/\/\S+$/i.test(l.url));
};

// Shared guard: admin, or the president of THIS club
const assertCanManageTeam = (req, res, club) => {
  if (req.user.role === 'president' && String(req.user.club) !== String(club._id)) {
    res.status(403);
    throw new Error('You can only manage the team of your own club');
  }
};

// Is this user part of the club (member, president or coordinator)?
const belongsToClub = (club, userId) =>
  [club.president, ...(club.coordinators || []), ...(club.members || [])].filter(Boolean).some((id) => String(id) === String(userId));

// Public roster entry: live data from the linked account; contact only if the president allowed it.
const publicTeam = (team = []) =>
  team
    .map((t) => {
      const u = t.user && t.user._id ? t.user : null;
      if (t.user && !u) return null; // linked account was deleted
      if (u && u.isActive === false) return null;
      const name = u ? u.name : t.name;
      if (!name) return null;
      return {
        _id: t._id,
        role: t.role,
        order: t.order,
        name,
        image: u ? u.avatar || '' : t.image || '',
        email: u ? (t.showEmail !== false ? u.email : '') : t.email || '',
        phone: u ? (t.showPhone ? u.phone || '' : '') : t.phone || '',
      };
    })
    .filter(Boolean);

const cleanRole = (v) => String(v || '').trim().slice(0, 60);
const cleanOrder = (v) => (Number.isFinite(Number(v)) && v !== '' && v !== null ? Number(v) : 100);

// @desc  Get all active clubs (public)
// @route GET /api/clubs
// @access Public
const getClubs = asyncHandler(async (req, res) => {
  const clubs = await Club.find({ isActive: true })
    .populate('president', 'name email avatar')
    .populate('coordinators', 'name email avatar')
    .select('-members -team');
  res.json({ success: true, count: clubs.length, clubs });
});

// @desc  Get single club details (public)
// @route GET /api/clubs/:id
// @access Public
const getClub = asyncHandler(async (req, res) => {
  const club = await Club.findById(req.params.id)
    .populate('president', 'name email avatar')
    .populate('coordinators', 'name email avatar')
    .populate('team.user', 'name email phone avatar isActive')
    .lean();
  if (!club) {
    res.status(404);
    throw new Error('Club not found');
  }
  club.team = publicTeam(club.team);
  // Public endpoint: expose only the NUMBER of members, never their names/emails.
  club.memberCount = (club.members || []).length;
  delete club.members;
  res.json({ success: true, club });
});

// @desc  Create a club (admin only) - optionally assign a president immediately
// @route POST /api/clubs
// @access Private/Admin
const createClub = asyncHandler(async (req, res) => {
  const { name, description, category, coverImage, presidentEmail } = req.body;

  const club = await Club.create({
    name,
    description,
    category,
    coverImage,
    createdBy: req.user._id,
  });

  if (presidentEmail) {
    const presidentUser = await User.findOne({ email: presidentEmail.toLowerCase() });
    if (presidentUser) {
      presidentUser.role = 'president';
      presidentUser.club = club._id;
      await presidentUser.save();
      club.president = presidentUser._id;
      await club.save();
    }
  }

  res.status(201).json({ success: true, club });
});

// @desc  Update club details (admin, or the club's president/coordinator can post info)
// @route PUT /api/clubs/:id
// @access Private/Admin,President,Coordinator (own club)
const updateClub = asyncHandler(async (req, res) => {
  const club = await Club.findById(req.params.id);
  if (!club) {
    res.status(404);
    throw new Error('Club not found');
  }

  if (req.user.role !== 'admin' && String(req.user.club) !== String(club._id)) {
    res.status(403);
    throw new Error('You can only edit your own club');
  }

  const { name, description, category, coverImage } = req.body;
  if (name && req.user.role === 'admin') club.name = name;
  if (description !== undefined) club.description = description;
  if (category) club.category = category;
  if (coverImage !== undefined) club.coverImage = coverImage;

  // Only the president (or admin) publishes social links
  if (req.body.socialLinks !== undefined) {
    if (!['admin', 'president'].includes(req.user.role)) {
      res.status(403);
      throw new Error('Only the president can edit social media links');
    }
    club.socialLinks = cleanSocialLinks(req.body.socialLinks);
  }

  await club.save();
  res.json({ success: true, club });
});

// @desc  Disintegrate (disband) a club - admin only
// @route DELETE /api/clubs/:id
// @access Private/Admin
const disbandClub = asyncHandler(async (req, res) => {
  const club = await Club.findById(req.params.id);
  if (!club) {
    res.status(404);
    throw new Error('Club not found');
  }
  club.isActive = false;
  club.disbandedAt = new Date();
  await club.save();

  // Free up the president/coordinators who led this club so they can be reassigned.
  // Plain members don't hold a `club` field on their user doc anymore (a student can
  // belong to several clubs via Club.members[]), so there's nothing to reset for them.
  await User.updateMany(
    { club: club._id, role: { $in: ['president', 'coordinator'] } },
    { $set: { club: null } }
  );

  res.json({ success: true, message: 'Club disbanded successfully' });
});

// @desc  Assign / change a club's president (admin only)
// @route PUT /api/clubs/:id/president
// @access Private/Admin
const assignPresident = asyncHandler(async (req, res) => {
  const { userEmail } = req.body;
  const club = await Club.findById(req.params.id);
  if (!club) {
    res.status(404);
    throw new Error('Club not found');
  }
  const user = await User.findOne({ email: userEmail.toLowerCase() });
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  user.role = 'president';
  user.club = club._id;
  await user.save();
  club.president = user._id;
  await club.save();
  res.json({ success: true, club });
});

// @desc  Assign a coordinator to a club - admin (any club) or president (own club only)
// @route POST /api/clubs/:id/coordinators
// @access Private/Admin,President
const addCoordinator = asyncHandler(async (req, res) => {
  const { userEmail } = req.body;
  const club = await Club.findById(req.params.id);
  if (!club) {
    res.status(404);
    throw new Error('Club not found');
  }
  if (req.user.role === 'president' && String(req.user.club) !== String(club._id)) {
    res.status(403);
    throw new Error('You can only assign coordinators for your own club');
  }
  const user = await User.findOne({ email: userEmail.toLowerCase() });
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  if (user.role === 'admin' || user.role === 'president') {
    res.status(400);
    throw new Error('This user already holds a higher-level role and cannot be made a coordinator');
  }
  user.role = 'coordinator';
  user.club = club._id;
  await user.save();

  if (!club.coordinators.includes(user._id)) {
    club.coordinators.push(user._id);
    await club.save();
  }
  res.json({ success: true, club });
});

// @desc  Kick (remove) a coordinator - admin (any club) or president (own club only)
// @route DELETE /api/clubs/:id/coordinators/:userId
// @access Private/Admin,President
const removeCoordinator = asyncHandler(async (req, res) => {
  const club = await Club.findById(req.params.id);
  if (!club) {
    res.status(404);
    throw new Error('Club not found');
  }
  if (req.user.role === 'president' && String(req.user.club) !== String(club._id)) {
    res.status(403);
    throw new Error('You can only manage coordinators for your own club');
  }
  club.coordinators = club.coordinators.filter((c) => String(c) !== req.params.userId);
  await club.save();

  await User.findByIdAndUpdate(req.params.userId, { role: 'member', club: null });

  res.json({ success: true, message: 'Coordinator removed', club });
});

// @desc  Kick a club member - president (own club) or admin. The student keeps
//        any other club memberships they hold; only this one is removed.
// @route DELETE /api/clubs/:id/members/:userId
// @access Private/Admin,President
const removeMember = asyncHandler(async (req, res) => {
  const club = await Club.findById(req.params.id);
  if (!club) {
    res.status(404);
    throw new Error('Club not found');
  }
  if (req.user.role !== 'admin' && String(req.user.club) !== String(club._id)) {
    res.status(403);
    throw new Error('You can only manage your own club');
  }
  club.members = club.members.filter((m) => String(m) !== req.params.userId);
  await club.save();

  res.json({ success: true, message: 'Member removed from club', club });
});

// ---------- Team / role holders (no login needed) ----------

// @desc  Look a person up by email before assigning a role (name/photo/phone are only returned for club members)
// @route GET /api/clubs/:id/team/lookup?email=
// @access Private/Admin,President
const lookupTeamUser = asyncHandler(async (req, res) => {
  const club = await Club.findById(req.params.id);
  if (!club) { res.status(404); throw new Error('Club not found'); }
  assertCanManageTeam(req, res, club);
  const email = String(req.query.email || '').trim().toLowerCase();
  if (!email) { res.status(400); throw new Error('Enter an email address'); }

  const u = await User.findOne({ email, isActive: true }).select('name email phone avatar');
  if (!u) { res.status(404); throw new Error('No registered user found with this email'); }

  const isMember = belongsToClub(club, u._id);
  res.json({
    success: true,
    isMember,
    // Privacy: non-members only reveal that the account exists (+ first name), never phone/photo
    user: isMember
      ? { _id: u._id, name: u.name, email: u.email, phone: u.phone || '', avatar: u.avatar || '' }
      : { name: u.name.split(' ')[0] },
    roles: club.team.filter((t) => String(t.user) === String(u._id)).map((t) => t.role),
  });
});

// @desc  Team with full details, for the president's management screen
// @route GET /api/clubs/:id/team
// @access Private/Admin,President
const getTeam = asyncHandler(async (req, res) => {
  const club = await Club.findById(req.params.id).populate('team.user', 'name email phone avatar isActive').lean();
  if (!club) { res.status(404); throw new Error('Club not found'); }
  assertCanManageTeam(req, res, club);
  const team = (club.team || []).map((t) => {
    const u = t.user && t.user._id ? t.user : null;
    return {
      _id: t._id, role: t.role, order: t.order, showEmail: t.showEmail !== false, showPhone: !!t.showPhone,
      linked: !!u,
      name: u ? u.name : t.name || '(deleted account)',
      email: u ? u.email : t.email || '',
      phone: u ? u.phone || '' : t.phone || '',
      avatar: u ? u.avatar || '' : t.image || '',
    };
  });
  res.json({ success: true, team });
});

// @desc  Assign a role to a registered user, found by email
// @route POST /api/clubs/:id/team   body: { email, role, order, showEmail, showPhone }
// @access Private/Admin,President
const addTeamMember = asyncHandler(async (req, res) => {
  const club = await Club.findById(req.params.id);
  if (!club) { res.status(404); throw new Error('Club not found'); }
  assertCanManageTeam(req, res, club);

  const role = cleanRole(req.body.role);
  if (!role) { res.status(400); throw new Error('Please enter a role'); }
  const email = String(req.body.email || '').trim().toLowerCase();
  const u = email ? await User.findOne({ email, isActive: true }) : null;
  if (!u) { res.status(404); throw new Error('No registered user found with this email'); }
  if (!belongsToClub(club, u._id)) {
    res.status(400);
    throw new Error(`${u.name} is not a member of ${club.name} yet. They need to join the club first.`);
  }
  if (club.team.some((t) => String(t.user) === String(u._id) && t.role.toLowerCase() === role.toLowerCase())) {
    res.status(400);
    throw new Error(`${u.name} already has the role "${role}"`);
  }
  if (club.team.length >= 100) { res.status(400); throw new Error('Team size limit reached (100)'); }

  club.team.push({
    user: u._id, role, order: cleanOrder(req.body.order),
    showEmail: req.body.showEmail !== false, showPhone: req.body.showPhone === true,
  });
  await club.save();
  res.status(201).json({ success: true });
});

// @desc  Change a role holder's role / order / which contact details are public (the person stays the same)
// @route PUT /api/clubs/:id/team/:memberId
// @access Private/Admin,President
const updateTeamMember = asyncHandler(async (req, res) => {
  const club = await Club.findById(req.params.id);
  if (!club) { res.status(404); throw new Error('Club not found'); }
  assertCanManageTeam(req, res, club);
  const member = club.team.id(req.params.memberId);
  if (!member) { res.status(404); throw new Error('Team member not found'); }

  const role = cleanRole(req.body.role);
  if (!role) { res.status(400); throw new Error('Please enter a role'); }
  member.role = role;
  member.order = cleanOrder(req.body.order);
  member.showEmail = req.body.showEmail !== false;
  member.showPhone = req.body.showPhone === true;
  await club.save();
  res.json({ success: true });
});

// @route DELETE /api/clubs/:id/team/:memberId   @access Private/Admin,President
const removeTeamMember = asyncHandler(async (req, res) => {
  const club = await Club.findById(req.params.id);
  if (!club) { res.status(404); throw new Error('Club not found'); }
  assertCanManageTeam(req, res, club);
  club.team = club.team.filter((m) => String(m._id) !== req.params.memberId);
  await club.save();
  res.json({ success: true, club });
});

// @desc  Members of a club with full details (profile + when/why they joined)
// @route GET /api/clubs/:id/members
// @access Private/Admin, President (own club)
const getClubMembers = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin' && String(req.user.club) !== String(req.params.id)) {
    res.status(403);
    throw new Error('You can only view members of your own club');
  }
  const club = await Club.findById(req.params.id).populate('members', 'name email phone avatar bio createdAt isActive').lean();
  if (!club) { res.status(404); throw new Error('Club not found'); }

  const joins = await JoinRequest.find({ club: club._id, status: 'accepted' }).select('user message decidedAt').lean();
  const byUser = new Map(joins.map((j) => [String(j.user), j]));
  const members = (club.members || []).map((m) => ({
    ...m,
    joinedAt: byUser.get(String(m._id))?.decidedAt || null,
    intent: byUser.get(String(m._id))?.message || '',
  }));
  res.json({ success: true, club: { _id: club._id, name: club.name }, members });
});

// ---------- Join Requests ----------

// @desc  Member requests to join a club. A student can be an accepted member of
//        several clubs at once - this only blocks a duplicate request for the
//        SAME club (already a member, or already has a pending request for it).
// @route POST /api/clubs/:id/join
// @access Private/Member
const requestToJoin = asyncHandler(async (req, res) => {
  const club = await Club.findById(req.params.id);
  if (!club || !club.isActive) {
    res.status(404);
    throw new Error('Club not found');
  }

  if (club.members.some((m) => String(m) === String(req.user._id))) {
    res.status(400);
    throw new Error('You are already a member of this club');
  }

  const already = await JoinRequest.findOne({ user: req.user._id, club: club._id, status: 'pending' });
  if (already) {
    res.status(400);
    throw new Error('You already have a pending request for this club');
  }

  if (!isProfileComplete(req.user)) {
    res.status(400);
    throw new Error('Please complete your profile (name, photo, mobile number) before joining a club');
  }

  const message = String(req.body.message || '').trim();
  if (message.length < 10) {
    res.status(400);
    throw new Error('Please tell the club briefly why you want to join (at least 10 characters)');
  }
  if (message.length > 300) {
    res.status(400);
    throw new Error('Your message can be at most 300 characters');
  }

  const joinRequest = await JoinRequest.create({
    user: req.user._id,
    club: club._id,
    message,
  });

  res.status(201).json({ success: true, joinRequest });
});

// @desc  List join requests for a club (admin sees all, coordinator/president see own club)
// @route GET /api/clubs/:id/join-requests
// @access Private/Admin,President,Coordinator
const getJoinRequests = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin' && String(req.user.club) !== String(req.params.id)) {
    res.status(403);
    throw new Error('You can only view requests for your own club');
  }
  const requests = await JoinRequest.find({ club: req.params.id, status: 'pending' })
    .populate('user', 'name email phone avatar bio createdAt')
    .sort({ createdAt: -1 });
  res.json({ success: true, requests });
});

// @desc  Accept or reject a join request - admin or coordinator (per spec) / president also allowed for own club
// @route PUT /api/clubs/join-requests/:requestId
// @access Private/Admin,President,Coordinator
const decideJoinRequest = asyncHandler(async (req, res) => {
  const { decision } = req.body; // 'accepted' | 'rejected'
  const request = await JoinRequest.findById(req.params.requestId).populate('club');
  if (!request) {
    res.status(404);
    throw new Error('Join request not found');
  }

  if (req.user.role !== 'admin' && String(req.user.club) !== String(request.club._id)) {
    res.status(403);
    throw new Error('You can only decide requests for your own club');
  }

  request.status = decision === 'accepted' ? 'accepted' : 'rejected';
  request.decidedBy = req.user._id;
  request.decidedAt = new Date();
  await request.save();

  // Accepting only adds the student to THIS club's member list - it never touches
  // any other club they're already part of, so multi-club membership is preserved.
  if (request.status === 'accepted') {
    const club = await Club.findById(request.club._id);
    if (!club.members.some((m) => String(m) === String(request.user))) {
      club.members.push(request.user);
      await club.save();
    }
  }

  res.json({ success: true, request });
});

// @desc  Get the logged-in student's club memberships (can be several) and any
//        pending join requests, so the UI can show "Joined" / "Pending" / "Join"
//        per club instead of assuming a single club.
// @route GET /api/clubs/my/status
// @access Private
const getMyClubStatus = asyncHandler(async (req, res) => {
  const [myClubs, pendingRequests] = await Promise.all([
    Club.find({ members: req.user._id, isActive: true }).select('name category coverImage description'),
    JoinRequest.find({ user: req.user._id, status: 'pending' }).populate('club', 'name'),
  ]);

  res.json({
    success: true,
    myClubs,
    pendingClubIds: pendingRequests.map((r) => String(r.club._id)),
    pendingRequests,
  });
});

module.exports = {
  getClubs,
  lookupTeamUser,
  getTeam,
  getClubMembers,
  addTeamMember,
  updateTeamMember,
  removeTeamMember,
  getClub,
  createClub,
  updateClub,
  disbandClub,
  assignPresident,
  addCoordinator,
  removeCoordinator,
  removeMember,
  requestToJoin,
  getJoinRequests,
  decideJoinRequest,
  getMyClubStatus,
};
