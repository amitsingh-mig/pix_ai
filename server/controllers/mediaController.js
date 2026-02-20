const Media = require('../models/Media');
const { deleteFromS3 } = require('../utils/s3');
const { generateTags } = require('../utils/ai');

exports.uploadMedia = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload a file' });
        }

        const mediaKey = req.file.key; // S3 Key
        let tags = [];

        // Only generate tags for images
        if (req.file.mimetype.startsWith('image')) {
            tags = await generateTags(mediaKey);
        } else {
            // For videos, we could use Rekognition Video, but for now we'll use generic tags or skip
            tags = ['video', 'multimedia'];
        }

        const media = await Media.create({
            title: req.body.title || req.file.originalname,
            url: req.file.location, // S3 URL
            type: req.file.mimetype.startsWith('image') ? 'image' : 'video',
            tags: tags,
            uploadedBy: req.user.id,
            metadata: {
                size: req.file.size,
                mimetype: req.file.mimetype,
                bucket: req.file.bucket,
                key: req.file.key
            }
        });

        res.status(201).json({ success: true, data: media });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

exports.getMedia = async (req, res) => {
    try {
        let query;

        // Search by title or tags
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, 'i');
            query = Media.find({
                $or: [
                    { title: searchRegex },
                    { tags: { $in: [searchRegex] } }
                ]
            });
        } else {
            query = Media.find();
        }

        const media = await query.populate('uploadedBy', 'username');

        res.status(200).json({ success: true, count: media.length, data: media });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

exports.deleteMedia = async (req, res) => {
    try {
        const media = await Media.findById(req.params.id);

        if (!media) {
            return res.status(404).json({ success: false, error: 'Media not found' });
        }

        // Check ownership or admin role
        if (media.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, error: 'Not authorized' });
        }

        // Delete from S3
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
