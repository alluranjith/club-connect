const express = require('express');
const router = express.Router();
const { exportAttendance, exportParticipation, exportMembers } = require('../controllers/exportController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.get('/attendance/:eventId', protect, authorize('admin', 'president', 'coordinator'), exportAttendance);
router.get('/participation/:eventId', protect, authorize('admin', 'president', 'coordinator'), exportParticipation);
router.get('/members/:clubId', protect, authorize('admin', 'president', 'coordinator'), exportMembers);

module.exports = router;
