const express = require('express');
const router = express.Router();
const {
    uploadMedia,
    getMedia,
    getMediaById,
    deleteMedia,
    updateMediaAlbum
} = require('../controllers/mediaController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../utils/s3');

router.route('/')
    .get(getMedia)
    .post(protect, upload.array('files', 120), uploadMedia);  // multiple files


router.route('/:id')
    .get(getMediaById)
    .delete(protect, deleteMedia);

router.route('/:id/album')
    .put(protect, updateMediaAlbum);

module.exports = router;
