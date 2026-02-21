const Media = require('../models/Media');
const { deleteFromS3, isAWSConfigured } = require('../utils/s3');
const { generateTags } = require('../utils/ai');

// @desc    Upload media (single or multiple)
// @route   POST /api/media
// @access  Private
exports.uploadMedia = async (req, res) => {
    try {
        const files = req.files || (req.file ? [req.file] : []);

        if (files.length === 0) {
            return res.status(400).json({ success: false, message: 'Please upload at least one file' });
        }

        const albumId = req.body.albumId || null;
        const title = req.body.title;

        const uploadPromises = files.map(async (file) => {
            const mediaKey = isAWSConfigured ? file.key : file.filename;
            const mediaUrl = isAWSConfigured ? file.location : `/uploads/${file.filename}`;

            let tags = [];
            if (file.mimetype.startsWith('image')) {
                // OpenAI calls are bypassed if isAWSConfigured is false in generateTags
                tags = await generateTags(mediaKey);
            } else {
                tags = ['video', 'multimedia'];
            }

            return Media.create({
                title: title || file.originalname,
                url: mediaUrl,
                type: file.mimetype.startsWith('image') ? 'image' : 'video',
                tags,
                uploadedBy: req.user.id,
                album: albumId,
                metadata: {
                    size: file.size,
                    mimetype: file.mimetype,
                    bucket: file.bucket || 'local',
                    key: mediaKey
                }
            });
        });

        const uploadedMedia = await Promise.all(uploadPromises);

        res.status(201).json({
            success: true,
            count: uploadedMedia.length,
            data: uploadedMedia
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};



// @desc    Get all media (with search, type filter, pagination)
// @route   GET /api/media
// @access  Public
exports.getMedia = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;

        const filter = {};

        // Type filter
        if (req.query.type && ['image', 'video'].includes(req.query.type)) {
            filter.type = req.query.type;
        }

        // Text search across title and tags
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, 'i');
            filter.$or = [
                { title: searchRegex },
                { tags: { $in: [searchRegex] } }
            ];
        }

        const [media, total] = await Promise.all([
            Media.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('uploadedBy', 'username'),
            Media.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            count: media.length,
            total,
            pages: Math.ceil(total / limit),
            currentPage: page,
            data: media
        });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Get single media item
// @route   GET /api/media/:id
// @access  Public
exports.getMediaById = async (req, res) => {
    try {
        const media = await Media.findById(req.params.id).populate('uploadedBy', 'username');
        if (!media) {
            return res.status(404).json({ success: false, error: 'Media not found' });
        }
        res.status(200).json({ success: true, data: media });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Delete media
// @route   DELETE /api/media/:id
// @access  Private (owner or admin)
exports.deleteMedia = async (req, res) => {
    try {
        const media = await Media.findById(req.params.id);

        if (!media) {
            return res.status(404).json({ success: false, error: 'Media not found' });
        }

        if (media.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, error: 'Not authorized' });
        }

        if (media.metadata && media.metadata.key) {
            await deleteFromS3(media.metadata.key);
        }

        await media.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};
