const express = require('express');
const router = express.Router();
const { getClubAnalytics, getPlatformAnalytics } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

// Admin only - all clubs compared side by side
router.get('/overview', protect, authorize('admin'), getPlatformAnalytics);

// Admin (any club) / President (own club only - enforced in controller)
router.get('/club/:id', protect, authorize('admin', 'president'), getClubAnalytics);

module.exports = router;
