const express = require('express');
const router = express.Router();
const {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  participateInEvent,
  getMyParticipations,
  trackEvent,
} = require('../controllers/eventController');
const { protect, optionalAuth } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

// Public
router.get('/', getEvents);
router.get('/my/participations', protect, getMyParticipations); // before /:id to avoid route clash
router.get('/:id', optionalAuth, getEvent);

// Admin / President / Coordinator
router.post('/', protect, authorize('admin', 'president', 'coordinator'), createEvent);
router.put('/:id', protect, authorize('admin', 'president', 'coordinator'), updateEvent);
router.delete('/:id', protect, authorize('admin', 'president', 'coordinator'), deleteEvent);
router.get('/:id/tracking', protect, authorize('admin', 'president', 'coordinator'), trackEvent);

// Members - participate
router.post('/:id/participate', protect, participateInEvent);

module.exports = router;
