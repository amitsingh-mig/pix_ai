const express = require('express');
const router = express.Router();
const {
    updateProfile,
    updatePassword,
    getProfileStats,
    updateProfilePhoto
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../utils/s3');

router.use(protect); // All routes below are protected

router.put('/profile', updateProfile);
router.put('/password', updatePassword);
router.get('/stats', getProfileStats);
router.put('/photo', upload.single('photo'), updateProfilePhoto);

module.exports = router;
