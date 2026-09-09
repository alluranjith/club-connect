const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/clubController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

// Public
router.get('/', getClubs);
router.get('/:id', getClub);

// Admin only
router.post('/', protect, authorize('admin'), createClub);
router.delete('/:id', protect, authorize('admin'), disbandClub);
router.put('/:id/president', protect, authorize('admin'), assignPresident);
router.post('/:id/coordinators', protect, authorize('admin'), addCoordinator);
router.delete('/:id/coordinators/:userId', protect, authorize('admin'), removeCoordinator);

// Admin / President / Coordinator (post club info)
router.put('/:id', protect, authorize('admin', 'president', 'coordinator'), updateClub);

// Admin / President (kick member)
router.delete('/:id/members/:userId', protect, authorize('admin', 'president'), removeMember);

// Member - request to join
router.post('/:id/join', protect, authorize('member'), requestToJoin);

// Admin / President / Coordinator - manage join requests
router.get('/:id/join-requests', protect, authorize('admin', 'president', 'coordinator'), getJoinRequests);
router.put('/join-requests/:requestId', protect, authorize('admin', 'president', 'coordinator'), decideJoinRequest);

module.exports = router;
