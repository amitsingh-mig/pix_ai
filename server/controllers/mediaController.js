const Media = require('../models/Media');
const Album = require('../models/Album');
const { isAWSConfigured, deleteFromS3 } = require('../utils/s3');
const { generateTags } = require('../utils/ai');
const { extractExif, detectPeople, reverseGeocode, extractVideoMetadata } = require('../utils/metadataExtractor');
const path = require('path');
const fs = require('fs');

const escapeRegex = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

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
        const manualLocation = req.body.location;

        const uploadPromises = files.map(async (file) => {
            const mediaKey = isAWSConfigured ? file.key : file.filename;
            const mediaUrl = isAWSConfigured ? file.location : `/uploads/${file.filename}`;
            const isImage = file.mimetype.startsWith('image');

            let exifData = null;
            let locationData = null;
            let peopleData = [];
            let tags = [];

            if (isImage) {
                // 1. Extract EXIF
                let exifInput = file.path; // Local path
                if (isAWSConfigured) {
                    // For S3, we'd ideally stream just the header, but for simplicity here
                    // we might skip or use a buffer if available. 
                    // However, Rekognition needs the S3 ref.
                    // Let's assume for EXIF we need the buffer if on S3.
                    // As a workaround, we'll try to get the buffer from the file object if present
                    // or just skip EXIF for S3 for now to avoid complexity, OR fetch it.
                    // For this task, let's try to handle local first as it's the current fallback.
                }

                if (exifInput && fs.existsSync(exifInput)) {
                    exifData = await extractExif(exifInput);
                    if (exifData && exifData.location) {
                        locationData = await reverseGeocode(exifData.location.lat, exifData.location.lng);
                    }
                }

                // 2. Detect People (Rekognition)
                const rekSource = isAWSConfigured
                    ? { S3Object: { Bucket: process.env.AWS_BUCKET_NAME, Name: mediaKey } }
                    : { Bytes: fs.readFileSync(file.path) };

                peopleData = await detectPeople(rekSource);

                // 3. AI Tags (OpenAI)
                tags = await generateTags(mediaKey);
            } else if (file.mimetype.startsWith('video')) {
                // 1. Extract Video Metadata (ffprobe)
                const videoMetadata = await extractVideoMetadata(file.path);
                if (videoMetadata) {
                    exifData = {
                        camera: videoMetadata.camera,
                        lens: videoMetadata.lens,
                        captureDate: videoMetadata.captureDate,
                        iso: null, // ffprobe doesn't usually provide ISO in basic tags
                        shutterSpeed: null,
                        aperture: null,
                        device: videoMetadata.device
                    };
                    // Store extra video info in metadata
                    file.videoInfo = {
                        duration: videoMetadata.duration,
                        resolution: videoMetadata.resolution
                    };
                }
                tags = ['video', 'multimedia'];
            }

            // Prepare location object
            let finalLocation = locationData ? {
                ...locationData,
                lat: exifData?.location?.lat,
                lng: exifData?.location?.lng
            } : null;

            // 5. Manual location override/addition
            if (manualLocation) {
                const manualGeo = await require('../utils/metadataExtractor').geocode(manualLocation);
                if (manualGeo) {
                    finalLocation = {
                        ...manualGeo,
                        placeName: manualLocation // Keep user's original input as placeName
                    };
                } else {
                    if (!finalLocation) finalLocation = {};
                    finalLocation.placeName = manualLocation;
                }
            }

            return Media.create({
                title: title || file.originalname,
                url: mediaUrl,
                type: isImage ? 'image' : 'video',
                tags,
                uploadedBy: req.user.id,
                album: albumId,
                metadata: {
                    size: file.size,
                    mimetype: file.mimetype,
                    bucket: file.bucket || 'local',
                    key: mediaKey,
                    exif: exifData,
                    location: finalLocation,
                    people: peopleData,
                    device: exifData?.device || 'Unknown',
                    duration: file.videoInfo?.duration,
                    resolution: file.videoInfo?.resolution
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
        console.error('Upload Error:', err);
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

        // Album filter
        if (req.query.albumId) {
            filter.album = req.query.albumId;
        }

        // Advanced Search
        if (req.query.search) {
            const escapedSearch = escapeRegex(req.query.search);
            const searchRegex = new RegExp(escapedSearch, 'i');
            filter.$or = [
                { title: searchRegex },
                { tags: searchRegex },
                { 'metadata.exif.camera': searchRegex },
                { 'metadata.exif.lens': searchRegex },
                { 'metadata.location.city': searchRegex },
                { 'metadata.location.country': searchRegex },
                { 'metadata.location.address': searchRegex },
                { 'metadata.location.placeName': searchRegex },
                { 'metadata.people.name': searchRegex },
                { 'metadata.device': searchRegex }
            ];

            // Date search (if query looks like a date YYYY-MM-DD)
            if (/^\d{4}-\d{2}-\d{2}$/.test(req.query.search)) {
                const searchDate = new Date(req.query.search);
                const nextDay = new Date(searchDate);
                nextDay.setDate(nextDay.getDate() + 1);

                filter.$or.push({
                    'metadata.exif.captureDate': {
                        $gte: searchDate,
                        $lt: nextDay
                    }
                });
            }
        }

        const [media, total] = await Promise.all([
            Media.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('uploadedBy', 'username')
                .populate('album', 'name'),
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

// @desc    Update media album association
// @route   PUT /api/media/:id/album
// @access  Private
exports.updateMediaAlbum = async (req, res) => {
    try {
        const media = await Media.findById(req.params.id);

        if (!media) {
            return res.status(404).json({ success: false, error: 'Media not found' });
        }

        // Authorization check
        if (media.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, error: 'Not authorized' });
        }

        media.album = req.body.albumId || null;
        await media.save();

        res.status(200).json({ success: true, data: media });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};
