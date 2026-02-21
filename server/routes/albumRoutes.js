const express = require('express');
const router = express.Router();
const { getAlbums, createAlbum, updateAlbum, deleteAlbum } = require('../controllers/albumController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(getAlbums)
    .post(createAlbum);

router.route('/:id')
    .put(updateAlbum)
    .delete(deleteAlbum);

module.exports = router;
