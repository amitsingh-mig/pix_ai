const express = require('express');
const router = express.Router();
const { uploadMedia, getMedia, deleteMedia } = require('../controllers/mediaController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { upload } = require('../utils/s3');

router.route('/')
    .get(getMedia)
    .post(protect, authorize('admin'), upload.single('file'), uploadMedia);

router.route('/:id')
    .delete(protect, deleteMedia);

module.exports = router;
