const Album = require('../models/Album');

// @desc    Get all albums
// @route   GET /api/albums
// @access  Private
exports.getAlbums = async (req, res, next) => {
    try {
        console.log(`[ALBUM DEBUG] Fetching albums for user: ${req.user?.id}`);
        const albums = await Album.find({ createdBy: req.user.id }).sort('-createdAt').lean();

        // Populate media count for each album
        const Media = require('../models/Media');
        const albumsWithCount = await Promise.all(albums.map(async (album) => {
            const mediaCount = await Media.countDocuments({ album: album._id });
            return { ...album, mediaCount };
        }));

        res.status(200).json({ success: true, count: albumsWithCount.length, data: albumsWithCount });
    } catch (err) {
        console.error(`[ALBUM DEBUG] GET albums error:`, err);
        next(err);
    }
};

// @desc    Create new album
// @route   POST /api/albums
// @access  Private
exports.createAlbum = async (req, res, next) => {
    try {
        console.log(`[ALBUM DEBUG] Create request body:`, req.body);
        console.log(`[ALBUM DEBUG] User creating album:`, req.user?.id);

        req.body.createdBy = req.user.id;
        const album = await Album.create(req.body);

        console.log(`[ALBUM DEBUG] Album created successfully:`, album._id);
        res.status(201).json({ success: true, data: album });
    } catch (err) {
        console.error(`[ALBUM DEBUG] POST albums error:`, err);
        next(err);
    }
};

// @desc    Update album
// @route   PUT /api/albums/:id
// @access  Private
exports.updateAlbum = async (req, res, next) => {
    try {
        let album = await Album.findById(req.params.id);

        if (!album) {
            return res.status(404).json({ success: false, error: 'Album not found' });
        }

        // Make sure user is album owner
        if (album.createdBy.toString() !== req.user.id) {
            return res.status(401).json({ success: false, error: 'Not authorized' });
        }

        album = await Album.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: album });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete album
// @route   DELETE /api/albums/:id
// @access  Private
exports.deleteAlbum = async (req, res, next) => {
    try {
        const album = await Album.findById(req.params.id);

        if (!album) {
            return res.status(404).json({ success: false, error: 'Album not found' });
        }

        // Make sure user is album owner
        if (album.createdBy.toString() !== req.user.id) {
            return res.status(401).json({ success: false, error: 'Not authorized' });
        }

        // Before deleting, find all media associated with this album and clear the association
        const Media = require('../models/Media');
        await Media.updateMany({ album: req.params.id }, { $set: { album: null } });

        await album.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        next(err);
    }
};

