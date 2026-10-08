const express = require('express');
const router = express.Router();
const { markAttendance, markAttendanceBulk, getEventAttendance } = require('../controllers/attendanceController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.post('/', protect, authorize('president', 'coordinator'), markAttendance);
router.post('/bulk', protect, authorize('president', 'coordinator'), markAttendanceBulk);
router.get('/event/:eventId', protect, authorize('admin', 'president', 'coordinator'), getEventAttendance);

module.exports = router;
