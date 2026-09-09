const asyncHandler = require('express-async-handler');
const Club = require('../models/Club');
const User = require('../models/User');
const JoinRequest = require('../models/JoinRequest');

// @desc  Get all active clubs (public)
// @route GET /api/clubs
// @access Public
const getClubs = asyncHandler(async (req, res) => {
  const clubs = await Club.find({ isActive: true })
    .populate('president', 'name email')
    .populate('coordinators', 'name email')
    .select('-members');
  res.json({ success: true, count: clubs.length, clubs });
});

// @desc  Get single club details (public)
// @route GET /api/clubs/:id
// @access Public
const getClub = asyncHandler(async (req, res) => {
  const club = await Club.findById(req.params.id)
    .populate('president', 'name email')
    .populate('coordinators', 'name email')
    .populate('members', 'name email');
  if (!club) {
    res.status(404);
    throw new Error('Club not found');
  }
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

  // Free up president/coordinators/members from this club
  await User.updateMany(
    { club: club._id },
    { $set: { club: null, membershipStatus: 'none' } }
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

// @desc  Assign a coordinator to a club (admin only)
// @route POST /api/clubs/:id/coordinators
// @access Private/Admin
const addCoordinator = asyncHandler(async (req, res) => {
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
  user.role = 'coordinator';
  user.club = club._id;
  await user.save();

  if (!club.coordinators.includes(user._id)) {
    club.coordinators.push(user._id);
    await club.save();
  }
  res.json({ success: true, club });
});

// @desc  Kick (remove) a coordinator - admin only
// @route DELETE /api/clubs/:id/coordinators/:userId
// @access Private/Admin
const removeCoordinator = asyncHandler(async (req, res) => {
  const club = await Club.findById(req.params.id);
  if (!club) {
    res.status(404);
    throw new Error('Club not found');
  }
  club.coordinators = club.coordinators.filter((c) => String(c) !== req.params.userId);
  await club.save();

  await User.findByIdAndUpdate(req.params.userId, { role: 'member', club: null, membershipStatus: 'none' });

  res.json({ success: true, message: 'Coordinator removed', club });
});

// @desc  Kick a club member - president (own club) or admin
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

  await User.findByIdAndUpdate(req.params.userId, { club: null, membershipStatus: 'rejected' });

  res.json({ success: true, message: 'Member removed from club', club });
});

// ---------- Join Requests ----------

// @desc  Member requests to join a club (first-time login flow)
// @route POST /api/clubs/:id/join
// @access Private/Member
const requestToJoin = asyncHandler(async (req, res) => {
  const club = await Club.findById(req.params.id);
  if (!club || !club.isActive) {
    res.status(404);
    throw new Error('Club not found');
  }

  const already = await JoinRequest.findOne({ user: req.user._id, club: club._id, status: 'pending' });
  if (already) {
    res.status(400);
    throw new Error('You already have a pending request for this club');
  }

  const joinRequest = await JoinRequest.create({
    user: req.user._id,
    club: club._id,
    message: req.body.message || '',
  });

  await User.findByIdAndUpdate(req.user._id, { membershipStatus: 'pending' });

  res.status(201).json({ success: true, joinRequest });
});

// @desc  List join requests for a club (admin sees all, coordinator/president see own club)
// @route GET /api/clubs/:id/join-requests
// @access Private/Admin,President,Coordinator
const getJoinRequests = asyncHandler(async (req, res) => {
  const requests = await JoinRequest.find({ club: req.params.id, status: 'pending' }).populate(
    'user',
    'name email phone'
  );
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

  const user = await User.findById(request.user);
  user.membershipStatus = request.status;
  if (request.status === 'accepted') {
    user.club = request.club._id;
    const club = await Club.findById(request.club._id);
    if (!club.members.includes(user._id)) {
      club.members.push(user._id);
      await club.save();
    }
  }
  await user.save();

  res.json({ success: true, request });
});

module.exports = {
  getClubs,
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
};
