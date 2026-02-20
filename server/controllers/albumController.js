const Album = require('../models/Album');

// @desc    Get all albums
// @route   GET /api/albums
// @access  Private
exports.getAlbums = async (req, res) => {
    try {
        console.log(`[ALBUM DEBUG] Fetching albums for user: ${req.user?.id}`);
        const albums = await Album.find({ createdBy: req.user.id }).sort('-createdAt');
        res.status(200).json({ success: true, count: albums.length, data: albums });
    } catch (err) {
        console.error(`[ALBUM DEBUG] GET albums error:`, err);
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Create new album
// @route   POST /api/albums
// @access  Private
exports.createAlbum = async (req, res) => {
    try {
        console.log(`[ALBUM DEBUG] Create request body:`, req.body);
        console.log(`[ALBUM DEBUG] User creating album:`, req.user?.id);

        req.body.createdBy = req.user.id;
        const album = await Album.create(req.body);

        console.log(`[ALBUM DEBUG] Album created successfully:`, album._id);
        res.status(201).json({ success: true, data: album });
    } catch (err) {
        console.error(`[ALBUM DEBUG] POST albums error:`, err);
        res.status(400).json({ success: false, error: err.message });
    }
};

