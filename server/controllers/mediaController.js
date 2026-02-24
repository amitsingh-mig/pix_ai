const mongoose = require('mongoose');
const Media = require('../models/Media');
const Album = require('../models/Album');
const { isAWSConfigured, deleteFile } = require('../utils/s3');
const { generateTags } = require('../utils/ai');
const { generateThumbnail } = require('../utils/thumbnailService');
const { extractExif, detectPeople, reverseGeocode, extractVideoMetadata } = require('../utils/metadataExtractor');
const path = require('path');
const fs = require('fs');

const escapeRegex = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// @desc    Upload media (single or multiple)
// @route   POST /api/media
// @access  Private
exports.uploadMedia = async (req, res, next) => {
    try {
        const files = req.files || (req.file ? [req.file] : []);

        if (files.length === 0) {
            return res.status(400).json({ success: false, message: 'Please upload at least one file' });
        }

        const albumId = req.body.albumId || null;
        let albumName = null;
        if (albumId) {
            const album = await Album.findById(albumId);
            if (album) {
                albumName = album.name;
            }
        }

        const title = req.body.title;
        const manualLocation = req.body.location;
        const locationDataBody = req.body.locationData ? JSON.parse(req.body.locationData) : null;

        // Parse shared tags from req.body
        const sharedTags = req.body.tags
            ? req.body.tags.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0)
            : [];

        const uploadedMedia = [];
        const processFile = async (file) => {
            const subFolder = file.destination.split(path.join('data', 'media'))[1].replace(/^[\\\/]/, '');
            const mediaKey = isAWSConfigured ? file.key : path.join(subFolder, file.filename).replace(/\\/g, '/');
            const mediaUrl = isAWSConfigured ? file.location : `/data/media/${mediaKey}`;
            const isImage = file.mimetype.startsWith('image');

            let exifData = null;
            let locationData = null;
            let peopleData = [];
            let aiTags = [];
            let thumbnailUrl = null;

            if (isImage) {
                // 0. Generate Thumbnail (Phase 2)
                if (!isAWSConfigured) {
                    thumbnailUrl = await generateThumbnail(file.path, file.filename);
                }

                // 1. Extract EXIF
                const exifInput = file.path;
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
                aiTags = await generateTags(mediaKey);
            } else if (file.mimetype.startsWith('video')) {
                // 1. Extract Video Metadata (ffprobe)
                const videoMetadata = await extractVideoMetadata(file.path);
                if (videoMetadata) {
                    exifData = {
                        camera: videoMetadata.camera,
                        lens: videoMetadata.lens,
                        captureDate: videoMetadata.captureDate,
                        iso: null,
                        shutterSpeed: null,
                        aperture: null,
                        device: videoMetadata.device
                    };
                    file.videoInfo = {
                        duration: videoMetadata.duration,
                        resolution: videoMetadata.resolution
                    };
                }
                aiTags = ['video', 'multimedia'];
            }

            // Merge shared tags with AI tags
            const finalTags = Array.from(new Set([...sharedTags, ...(aiTags || []).map(t => t.toLowerCase())]));

            // Prepare location object
            let finalLocation = locationData ? {
                ...locationData,
                lat: exifData?.location?.lat,
                lng: exifData?.location?.lng
            } : null;

            // 5. Manual location override - REPLACE instead of merge
            if (locationDataBody) {
                finalLocation = {
                    lat: locationDataBody.lat,
                    lng: locationDataBody.lng,
                    city: locationDataBody.city,
                    country: locationDataBody.country,
                    address: locationDataBody.address,
                    placeName: locationDataBody.placeName
                };
            } else if (manualLocation) {
                const manualGeo = await require('../utils/metadataExtractor').geocode(manualLocation);
                if (manualGeo) {
                    finalLocation = {
                        ...manualGeo,
                        placeName: manualLocation
                    };
                } else {
                    // Clear any EXIF location if manual text is provided but geocoding fails
                    finalLocation = { placeName: manualLocation };
                }
            }

            const mediaItem = await Media.create({
                title: title || file.originalname,
                description: req.body.description || '',
                url: mediaUrl,
                thumbnailUrl: thumbnailUrl || mediaUrl,
                type: isImage ? 'image' : 'video',
                tags: finalTags,
                uploadedBy: req.user.id,
                album: albumName,
                albumId: albumId,
                location: finalLocation ? {
                    name: finalLocation.placeName || finalLocation.city,
                    address: finalLocation.address,
                    latitude: finalLocation.lat,
                    longitude: finalLocation.lng
                } : null,
                camera: exifData ? {
                    make: exifData.make,
                    model: exifData.model
                } : null,
                device: exifData?.device || 'Unknown',
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
            return mediaItem;
        };

        // Concurrency limited pool (Max 5)
        const pool = new Set();
        for (const file of files) {
            if (pool.size >= 5) {
                await Promise.race(pool);
            }
            const promise = processFile(file).then(res => {
                pool.delete(promise);
                uploadedMedia.push(res);
            });
            pool.add(promise);
        }
        await Promise.all(pool);

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
exports.getMedia = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;
        console.log(`[MEDIA DEBUG] GET media: page=${page}, limit=${limit}, search="${req.query.search}", type="${req.query.type}", album="${req.query.albumId}"`);

        const filter = {};

        // Type filter
        if (req.query.type && ['image', 'video'].includes(req.query.type)) {
            filter.type = req.query.type;
        }

        // Album filter
        if (req.query.albumId) {
            filter.albumId = req.query.albumId;
        }

        // Camera filter (Explicit)
        if (req.query.camera) {
            const cameraFilter = {
                $or: [
                    { 'camera.model': req.query.camera },
                    { 'metadata.exif.camera': req.query.camera }
                ]
            };
            if (!filter.$and) filter.$and = [];
            filter.$and.push(cameraFilter);
        }

        // Location filter (Explicit)
        if (req.query.location) {
            const locationFilter = {
                $or: [
                    { 'location.name': req.query.location },
                    { 'metadata.location.city': req.query.location },
                    { 'metadata.location.placeName': req.query.location }
                ]
            };
            if (!filter.$and) filter.$and = [];
            filter.$and.push(locationFilter);
        }

        // Date Range filter
        if (req.query.startDate || req.query.endDate) {
            const dateRange = {};
            if (req.query.startDate) dateRange.$gte = new Date(req.query.startDate);
            if (req.query.endDate) {
                const endDate = new Date(req.query.endDate);
                endDate.setHours(23, 59, 59, 999);
                dateRange.$lte = endDate;
            }

            const dateFilter = {
                $or: [
                    { 'metadata.exif.captureDate': dateRange },
                    { 'createdAt': dateRange }
                ]
            };
            if (!filter.$and) filter.$and = [];
            filter.$and.push(dateFilter);
        }

        // Advanced Search - Unified for consistency
        if (req.query.search) {
            const escapedSearch = escapeRegex(req.query.search);
            const searchRegex = new RegExp(escapedSearch, 'i');
            filter.$or = [
                { title: searchRegex },
                { tags: searchRegex },
                { album: searchRegex }, // Added root album
                { description: searchRegex }, // Added description
                { 'location.name': searchRegex }, // Added root location
                { 'location.address': searchRegex },
                { 'camera.make': searchRegex }, // Added root camera
                { 'camera.model': searchRegex },
                { device: searchRegex }, // Added root device
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
        console.log(`[MEDIA DEBUG] Final Filter: ${JSON.stringify(filter)}`);

        const [media, total] = await Promise.all([
            Media.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('uploadedBy', 'username')
                .populate('album', 'name'),
            Media.countDocuments(filter)
        ]);

        console.log(`[MEDIA DEBUG] Found ${media.length} items out of ${total}`);
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

// @desc    Search media (Smart Search)
// @route   GET /api/media/search
// @access  Public
exports.searchMedia = async (req, res, next) => {
    try {
        const query = req.query.q || '';
        const keywords = query.split(/\s+/).filter(k => k.length > 0);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const andFilters = [];

        // 1. Keyword Search (if any)
        if (keywords.length > 0) {
            const keywordRegexes = keywords.map(k => new RegExp(escapeRegex(k), 'i'));
            const textFilters = keywordRegexes.map(regex => ({
                $or: [
                    { tags: { $in: [regex] } },
                    { album: regex },
                    { title: regex },
                    { description: regex },
                    { 'location.name': regex },
                    { 'location.address': regex },
                    { 'camera.make': regex },
                    { 'camera.model': regex },
                    { device: regex },
                    { 'metadata.location.city': regex },
                    { 'metadata.location.country': regex },
                    { 'metadata.location.placeName': regex },
                    { 'metadata.location.address': regex },
                    { 'metadata.exif.camera': regex },
                    { 'metadata.exif.make': regex },
                    { 'metadata.exif.model': regex },
                    { 'metadata.device': regex }
                ]
            }));
            andFilters.push(...textFilters);
        }

        // 2. Album Scoping
        if (req.query.albumId) {
            andFilters.push({ albumId: req.query.albumId });
        }

        // 3. Discrete Filters (Camera, Location, Date)
        if (req.query.camera) {
            andFilters.push({
                $or: [
                    { 'camera.model': req.query.camera },
                    { 'metadata.exif.camera': req.query.camera }
                ]
            });
        }

        if (req.query.location) {
            andFilters.push({
                $or: [
                    { 'location.name': req.query.location },
                    { 'metadata.location.city': req.query.location },
                    { 'metadata.location.placeName': req.query.location }
                ]
            });
        }

        if (req.query.startDate || req.query.endDate) {
            const dateRange = {};
            if (req.query.startDate) {
                const start = new Date(req.query.startDate);
                start.setHours(0, 0, 0, 0);
                dateRange.$gte = start;
            }
            if (req.query.endDate) {
                const end = new Date(req.query.endDate);
                end.setHours(23, 59, 59, 999);
                dateRange.$lte = end;
            }
            andFilters.push({
                $or: [
                    { 'metadata.exif.captureDate': dateRange },
                    { 'createdAt': dateRange }
                ]
            });
        }

        // If no filters at all, find all (or we could return empty, but for "Refining" find all makes sense)
        const filter = andFilters.length > 0 ? { $and: andFilters } : {};

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
        console.error('Search Error:', err);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Get distinct values for filters (camera, location, albums)
// @route   GET /api/media/filter-options
// @access  Private
exports.getFilterOptions = async (req, res) => {
    try {
        const userId = req.user.id;

        const [cameras, locations, albums] = await Promise.all([
            // Get distinct camera models
            Media.aggregate([
                { $match: { uploadedBy: new mongoose.Types.ObjectId(userId) } },
                {
                    $group: {
                        _id: null,
                        rootCameras: { $addToSet: '$camera.model' },
                        metaCameras: { $addToSet: '$metadata.exif.camera' }
                    }
                },
                {
                    $project: {
                        all: { $setUnion: ['$rootCameras', '$metaCameras'] }
                    }
                }
            ]),
            // Get distinct location names
            Media.aggregate([
                { $match: { uploadedBy: new mongoose.Types.ObjectId(userId) } },
                {
                    $group: {
                        _id: null,
                        rootLocations: { $addToSet: '$location.name' },
                        metaCities: { $addToSet: '$metadata.location.city' },
                        metaPlaces: { $addToSet: '$metadata.location.placeName' }
                    }
                },
                {
                    $project: {
                        all: { $setUnion: ['$rootLocations', '$metaCities', '$metaPlaces'] }
                    }
                }
            ]),
            // Get distinct albums
            Album.find({ uploadedBy: userId }).distinct('name')
        ]);

        const formatFilter = (arr) => (arr && arr[0]?.all ? arr[0].all.filter(Boolean).sort() : []);

        res.status(200).json({
            success: true,
            data: {
                cameras: formatFilter(cameras),
                locations: formatFilter(locations),
                albums: albums.filter(Boolean).sort()
            }
        });
    } catch (err) {
        console.error('Filter Options Error:', err);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Get single media item
// @route   GET /api/media/:id
// @access  Public
exports.getMediaById = async (req, res, next) => {
    try {
        const media = await Media.findById(req.params.id).populate('uploadedBy', 'username');
        if (!media) {
            return res.status(404).json({ success: false, error: 'Media not found' });
        }
        res.status(200).json({ success: true, data: media });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete media
// @route   DELETE /api/media/:id
// @access  Private (owner or admin)
exports.deleteMedia = async (req, res, next) => {
    try {
        const media = await Media.findById(req.params.id);

        if (!media) {
            return res.status(404).json({ success: false, error: 'Media not found' });
        }

        if (media.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, error: 'Not authorized' });
        }

        // Delete main file
        if (media.metadata && media.metadata.key) {
            await deleteFile(media.metadata.key);
        } else if (media.url) {
            // Fallback for cases where key isn't explicitly set in metadata
            await deleteFile(media.url);
        }

        // Delete thumbnail if it exists
        if (media.thumbnailUrl) {
            await deleteFile(media.thumbnailUrl);
        }

        await media.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        next(err);
    }
};

// @desc    Auto-delete old media (Admin only)
// @route   DELETE /api/media/cleanup
// @access  Admin
exports.cleanupOldMedia = async (req, res, next) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        console.log(`[CLEANUP] Starting cleanup for media older than ${days} days (Cutoff: ${cutoffDate.toISOString()})`);

        // Find all media older than cutoff
        const oldMedia = await Media.find({ createdAt: { $lt: cutoffDate } });

        if (oldMedia.length === 0) {
            return res.status(200).json({ success: true, message: 'No old media found for cleanup' });
        }

        let deletedCount = 0;
        for (const item of oldMedia) {
            try {
                // Delete files
                if (item.metadata && item.metadata.key) {
                    await deleteFile(item.metadata.key);
                } else if (item.url) {
                    await deleteFile(item.url);
                }

                if (item.thumbnailUrl) {
                    await deleteFile(item.thumbnailUrl);
                }

                // Delete record
                await item.deleteOne();
                deletedCount++;
            } catch (err) {
                console.error(`[CLEANUP ERROR] Failed to delete media ${item._id}:`, err.message);
            }
        }

        res.status(200).json({
            success: true,
            message: `Successfully cleaned up ${deletedCount} old media items older than ${days} days.`
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update media album association
// @route   PUT /api/media/:id/album
// @access  Private
exports.updateMediaAlbum = async (req, res, next) => {
    try {
        const media = await Media.findById(req.params.id);

        if (!media) {
            return res.status(404).json({ success: false, error: 'Media not found' });
        }

        // Authorization check
        if (media.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, error: 'Not authorized' });
        }

        const albumId = req.body.albumId || null;
        let albumName = null;
        if (albumId) {
            const album = await Album.findById(albumId);
            if (album) albumName = album.name;
        }

        media.albumId = albumId;
        media.album = albumName;
        await media.save();

        res.status(200).json({ success: true, data: media });
    } catch (err) {
        next(err);
    }
};

// @desc    Update media details (generic)
// @route   PUT /api/media/:id
// @access  Private
exports.updateMedia = async (req, res, next) => {
    try {
        let media = await Media.findById(req.params.id);
        if (!media) {
            return res.status(404).json({ success: false, error: 'Media not found' });
        }

        // Authorization check
        if (media.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, error: 'Not authorized' });
        }

        const { title, description, tags, camera, location } = req.body;

        if (title) media.title = title;
        if (description !== undefined) media.description = description;
        if (Array.isArray(tags)) {
            media.tags = tags.map(t => t.trim().toLowerCase()).filter(t => t.length > 0);
        }

        if (camera) {
            if (!media.camera) media.camera = {};
            if (camera.model) media.camera.model = camera.model;
            if (camera.make) media.camera.make = camera.make;
        }

        if (location) {
            if (!media.location) media.location = {};
            if (location.name) media.location.name = location.name;
            if (location.latitude !== undefined) media.location.latitude = location.latitude;
            if (location.longitude !== undefined) media.location.longitude = location.longitude;
        }

        await media.save();
        res.status(200).json({ success: true, data: media });
    } catch (err) {
        next(err);
    }
};

// @desc    Update media tags
// @route   PUT /api/media/:id/tags
// @access  Private
exports.updateMediaTags = async (req, res, next) => {
    try {
        const media = await Media.findById(req.params.id);

        if (!media) {
            return res.status(404).json({ success: false, error: 'Media not found' });
        }

        // Authorization check
        if (media.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, error: 'Not authorized' });
        }

        const { tags } = req.body;
        if (!Array.isArray(tags)) {
            return res.status(400).json({ success: false, error: 'Tags must be an array' });
        }

        // Ensure tags are cleaned (lowercase, trimmed)
        media.tags = tags.map(t => t.trim().toLowerCase()).filter(t => t.length > 0);
        await media.save();

        res.status(200).json({ success: true, data: media });
    } catch (err) {
        next(err);
    }
};

