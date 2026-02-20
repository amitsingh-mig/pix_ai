const express = require('express');
const router = express.Router();
const { getAlbums, createAlbum } = require('../controllers/albumController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(getAlbums)
    .post(createAlbum);

module.exports = router;
