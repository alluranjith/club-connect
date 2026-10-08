const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getStats, getAllUsers, setUserActiveStatus,
  importAllowedEmails, listAllowedEmails, addAllowedEmail, deleteAllowedEmail, getUserDetails,
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

// Spreadsheet uploads are held in memory (max 5 MB, csv/xls/xlsx only) and parsed server-side
const sheetUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/\.(csv|xlsx|xls)$/i.test(file.originalname)) return cb(null, true);
    cb(new Error('Only .csv, .xlsx or .xls files are allowed'));
  },
});

router.use(protect, authorize('admin'));

router.get('/stats', getStats);
router.get('/users', getAllUsers);
router.get('/users/:id', getUserDetails);
router.put('/users/:id/status', setUserActiveStatus);

// College email whitelist (controls who may register / use Google sign-in)
router.get('/allowed-emails', listAllowedEmails);
router.post('/allowed-emails', addAllowedEmail);
router.post('/allowed-emails/import', sheetUpload.single('file'), importAllowedEmails);
router.delete('/allowed-emails/:id', deleteAllowedEmail);

module.exports = router;
