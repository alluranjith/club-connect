const express = require('express');
const router = express.Router();
const { getStats, getAllUsers, setUserActiveStatus } = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.use(protect, authorize('admin'));

router.get('/stats', getStats);
router.get('/users', getAllUsers);
router.put('/users/:id/status', setUserActiveStatus);

module.exports = router;
