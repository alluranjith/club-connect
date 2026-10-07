const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/clubController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

// Public
router.get('/', getClubs);
// NOTE: must come before '/:id' so it isn't swallowed by the club-by-id route
router.get('/my/status', protect, getMyClubStatus);
router.get('/:id', getClub);

// Admin only
router.post('/', protect, authorize('admin'), createClub);
router.delete('/:id', protect, authorize('admin'), disbandClub);
router.put('/:id/president', protect, authorize('admin'), assignPresident);

// Admin (any club) / President (own club only - enforced in controller)
router.post('/:id/coordinators', protect, authorize('admin', 'president'), addCoordinator);
router.delete('/:id/coordinators/:userId', protect, authorize('admin', 'president'), removeCoordinator);

// Team / role holders (no login) - admin or the club's president
router.get('/:id/team/lookup', protect, authorize('admin', 'president'), lookupTeamUser);
router.get('/:id/team', protect, authorize('admin', 'president'), getTeam);
router.post('/:id/team', protect, authorize('admin', 'president'), addTeamMember);
router.put('/:id/team/:memberId', protect, authorize('admin', 'president'), updateTeamMember);
router.delete('/:id/team/:memberId', protect, authorize('admin', 'president'), removeTeamMember);

// Admin / President / Coordinator (post club info)
router.put('/:id', protect, authorize('admin', 'president', 'coordinator'), updateClub);

// Admin / President (kick member)
router.get('/:id/members', protect, authorize('admin', 'president'), getClubMembers);
router.delete('/:id/members/:userId', protect, authorize('admin', 'president'), removeMember);

// Member - request to join
router.post('/:id/join', protect, authorize('member'), requestToJoin);

// Admin / President / Coordinator - manage join requests
router.get('/:id/join-requests', protect, authorize('admin', 'president', 'coordinator'), getJoinRequests);
router.put('/join-requests/:requestId', protect, authorize('admin', 'president', 'coordinator'), decideJoinRequest);

module.exports = router;
