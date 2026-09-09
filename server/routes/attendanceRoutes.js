const express = require('express');
const router = express.Router();
const { markAttendance, getEventAttendance } = require('../controllers/attendanceController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.post('/', protect, authorize('coordinator'), markAttendance);
router.get('/event/:eventId', protect, authorize('admin', 'president', 'coordinator'), getEventAttendance);

module.exports = router;
