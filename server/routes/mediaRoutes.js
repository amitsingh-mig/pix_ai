const express = require('express');
const router = express.Router();
const {
    uploadMedia,
    getMedia,
    getMediaById,
    deleteMedia,
    updateMediaAlbum,
    searchMedia,
    updateMediaTags,
    updateMedia,
    getFilterOptions,
    cleanupOldMedia,
    generateMediaCaptions,
    updateMediaCaptions,
    getSearchSuggestions
} = require('../controllers/mediaController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { upload } = require('../utils/s3');

router.get('/search', searchMedia);
router.get('/suggestions', protect, getSearchSuggestions);
router.get('/filters', protect, getFilterOptions);
router.get('/filter-options', protect, getFilterOptions);
router.delete('/cleanup', protect, authorize('admin'), cleanupOldMedia);

router.route('/')
    .get(getMedia)
    .post(protect, express.json({ limit: '100mb' }), upload.array('files', 120), uploadMedia);


router.route('/:id')
    .get(getMediaById)
    .put(protect, updateMedia)
    .delete(protect, deleteMedia);

router.route('/:id/album')
    .put(protect, updateMediaAlbum);

router.route('/:id/tags')
    .put(protect, updateMediaTags);

// AI Caption generation routes
router.route('/:id/captions')
    .post(protect, generateMediaCaptions)
    .put(protect, updateMediaCaptions);

module.exports = router;
