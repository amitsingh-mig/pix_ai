const mongoose = require('mongoose');
const Media = require('../models/Media');
const Album = require('../models/Album');
const { isAWSConfigured, deleteFile, getS3FileSize } = require('../utils/s3');
const { generateTags } = require('../utils/ai');
const { generateThumbnail, generateLowResS3 } = require('../utils/thumbnailService');
const { extractExif, detectPeople, reverseGeocode, extractVideoMetadata } = require('../utils/metadataExtractor');
const path = require('path');
const fs = require('fs');

const escapeRegex = (text) => {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
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
            // Enforce AWS S3 only — reject local storage
            if (!isAWSConfigured) {
                throw new Error('AWS S3 is not configured. Local uploads are not permitted. Please configure AWS credentials.');
            }

            // Determine media key and URL from S3 (multer-s3 provides 'key' and 'location')
            let mediaKey, mediaUrl;
            mediaKey = file.key;
            mediaUrl = file.location || `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${file.key}`;

            // Validate the URL is a proper S3 URL before saving
            if (!mediaUrl || !mediaUrl.includes('amazonaws.com')) {
                throw new Error(`Invalid S3 URL returned for file "${file.originalname}". Upload aborted.`);
            }

            const isImage = file.mimetype.startsWith('image');

            let exifData = null;
            let locationData = null;
            let peopleData = [];
            let aiTags = [];
            let thumbnailUrl = null;

            if (isImage) {
                // Generate low-res preview version for the UI (Dual-image system)
                try {
                    const lowResData = await generateLowResS3(process.env.AWS_BUCKET_NAME, mediaKey, file.mimetype);
                    if (lowResData) {
                        thumbnailUrl = lowResData.url;
                        console.log(`[UPLOAD] Generated low-res preview: ${thumbnailUrl}`);
                    }
                } catch (err) {
                    console.error('[UPLOAD] Low-res generation failed:', err.message);
                }

                // Run AI tag generation + face detection + EXIF extraction in parallel for speed
                const [tagsResult, peopleResult, exifResult] = await Promise.allSettled([
                    generateTags(mediaKey, { enrichWithOpenAI: true }),
                    detectPeople({ S3Object: { Bucket: process.env.AWS_BUCKET_NAME, Name: mediaKey } }),
                    extractExif({ bucket: process.env.AWS_BUCKET_NAME, key: mediaKey })
                ]);

                // Collect AI tags from Rekognition + OpenAI
                if (tagsResult.status === 'fulfilled') {
                    aiTags = tagsResult.value || [];
                } else {
                    console.error('[UPLOAD] AI tagging failed:', tagsResult.reason?.message);
                }

                // Collect people data and inject people tags
                if (peopleResult.status === 'fulfilled') {
                    peopleData = peopleResult.value || [];
                    if (peopleData.length > 0) {
                        // Add 'person' and 'people' to tags if faces were detected
                        aiTags = Array.from(new Set([...aiTags, 'person', 'people']));
                        console.log(`[UPLOAD] Detected ${peopleData.length} face(s) — injected people tags`);
                    }
                } else {
                    console.error('[UPLOAD] Face detection failed:', peopleResult.reason?.message);
                }

                // Collect EXIF data
                if (exifResult.status === 'fulfilled') {
                    exifData = exifResult.value;
                    if (exifData && (exifData.make || exifData.model || exifData.iso)) {
                        console.log(`[UPLOAD] ✅ EXIF extracted for "${file.originalname}": ${exifData.make} ${exifData.model}`);
                        console.log(`[UPLOAD]    Details: ISO ${exifData.iso}, ${exifData.aperture}, ${exifData.shutterSpeed}, ${exifData.focalLength}`);
                    } else {
                        console.log(`[UPLOAD] ℹ EXIF missing or empty for "${file.originalname}". Attempting AI estimation...`);
                        
                        // AI settings estimation fallback
                        const { estimateCameraSettings } = require('../utils/ai');
                        const estimated = await estimateCameraSettings(mediaKey);
                        if (estimated) {
                            exifData = {
                                ...exifData,
                                camera: estimated.camera,
                                make: estimated.camera.split(' ')[0],
                                model: estimated.camera,
                                iso: estimated.iso,
                                shutterSpeed: estimated.shutterSpeed,
                                aperture: estimated.aperture,
                                focalLength: estimated.focalLength,
                                photographyInsight: estimated.insight,
                                isAIEstimated: true
                            };
                            console.log(`[UPLOAD] 🪄 AI estimated settings: ${estimated.camera}, ISO ${estimated.iso}, etc.`);
                        }
                    }
                } else {
                    console.error('[UPLOAD] ❌ EXIF extraction failed:', exifResult.reason?.message);
                }

                // Generate Photography Insight if EXIF is available (and not already set by estimation)
                if (exifData && !exifData.photographyInsight) {
                    const { generatePhotographyInsight } = require('../utils/ai');
                    const insight = await generatePhotographyInsight(exifData);
                    if (insight) {
                        console.log(`[UPLOAD] 📝 AI Insight: ${insight}`);
                        exifData.photographyInsight = insight;
                    }
                }

            } else if (file.mimetype.startsWith('video')) {
                // Video metadata extraction from local path is skipped for S3 uploads.
                aiTags = ['video', 'multimedia'];
            }

            // Merge user tags + AI tags, deduplicate
            const finalTags = Array.from(new Set([
                ...sharedTags,
                ...(aiTags || []).map(t => t.toLowerCase()).filter(t => t.length > 0)
            ]));

            console.log(`[UPLOAD] Tag summary for "${file.originalname}":`);
            console.log(`  → Shared/user tags : ${sharedTags.join(', ') || '(none)'}`);
            console.log(`  → AI-generated tags: ${aiTags.join(', ') || '(none)'}`);
            console.log(`  → Final merged tags: ${finalTags.join(', ')}`);
            console.log(`  → Faces detected   : ${peopleData.length}`);

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
                try {
                    const manualGeo = await require('../utils/metadataExtractor').geocode(manualLocation);
                    if (manualGeo) {
                        finalLocation = {
                            ...manualGeo,
                            placeName: manualLocation
                        };
                    } else {
                        finalLocation = { placeName: manualLocation };
                    }
                } catch (err) {
                    finalLocation = { placeName: manualLocation };
                }
            }

            // Ensure correct file size is captured (fallback to S3 if file.size is missing/zero)
            let fileSize = file.size || 0;
            if (fileSize === 0 && mediaKey && isAWSConfigured) {
                console.log(`[UPLOAD] File size missing for "${file.originalname}" — fetching from S3...`);
                fileSize = await getS3FileSize(mediaKey);
                console.log(`[UPLOAD] Fetched size from S3: ${fileSize} bytes`);
            }

            const mediaItem = await Media.create({
                title: title || file.originalname,
                description: req.body.description || '',
                url: mediaUrl, // highRes for legacy
                thumbnailUrl: thumbnailUrl || mediaUrl, // lowRes for legacy
                lowResUrl: thumbnailUrl || mediaUrl,
                highResUrl: mediaUrl,
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
                device: exifData?.camera || exifData?.model || exifData?.device || 'Unknown',
                metadata: {
                    size: fileSize || file.size || 0,
                    mimetype: file.mimetype,
                    bucket: process.env.AWS_BUCKET_NAME,
                    key: mediaKey,
                    exif: exifData,
                    location: finalLocation,
                    people: peopleData,
                    device: exifData?.device || 'Unknown',
                    duration: file.videoInfo?.duration,
                    resolution: file.videoInfo?.resolution || exifData?.resolution,
                    photographyInsight: exifData?.photographyInsight,
                    // AI Tagging audit trail
                    aiTagSource: isImage ? 'rekognition+openai' : 'manual',
                    aiTagCount: aiTags.length,
                }
            });
            console.log(`[UPLOAD] 📦 Created media record for "${file.originalname}" — Metadata persistence: ${mediaItem.metadata?.exif ? '✅ YES' : '❌ NO'}`);
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
                if (res) uploadedMedia.push(res);
            }).catch(err => {
                console.error('File Processing Error:', err);
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
        res.status(500).json({ 
            success: false, 
            error: err.message || 'Server Error',
            details: err.code || null // Capture AWS error codes like 'AccessDenied'
        });
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

        const filter = {
            // STEP 1: Always restrict to AWS S3 URLs only — never return local paths
            url: { $regex: '^https://.*\.amazonaws\.com', $options: 'i' }
        };

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
        // MimeType filter
        if (req.query.mimetype) {
            filter['metadata.mimetype'] = req.query.mimetype;
        }

        // Resolution filter
        if (req.query.resolution) {
            filter['metadata.resolution'] = req.query.resolution;
        }

        // People filter
        if (req.query.personName) {
            filter['metadata.people.name'] = req.query.personName;
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

        const andFilters = [
            // Always restrict to AWS S3 URLs only — never return local paths
            { url: { $regex: '^https://.*\.amazonaws\.com', $options: 'i' } }
        ];

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
                    { 'metadata.device': regex },
                    { 'aiCaptions.short': regex },
                    { 'aiCaptions.creative': regex },
                    { 'aiCaptions.professional': regex },
                    { 'aiCaptions.dramatic': regex },
                    { 'aiCaptions.sceneType': regex },
                    { 'aiCaptions.mood': regex },
                    { 'aiCaptions.keywords.term': regex },
                    { 'aiCaptions.hashtags.term': regex }
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

        // 4. AI-specific filters (Scene & Mood)
        if (req.query.sceneType) {
            andFilters.push({ 'aiCaptions.sceneType': req.query.sceneType });
        }
        if (req.query.mood) {
            andFilters.push({ 'aiCaptions.mood': req.query.mood });
        }

        // 5. Advanced AI-based Filters
        if (req.query.mimetype) {
            andFilters.push({ 'metadata.mimetype': req.query.mimetype });
        }
        if (req.query.resolution) {
            andFilters.push({ 'metadata.resolution': req.query.resolution });
        }
        if (req.query.personName) {
            andFilters.push({ 'metadata.people.name': req.query.personName });
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

        const [cameras, locations, albums, sceneTypes, moods, people, resolutions, mimetypes] = await Promise.all([
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
            Album.find({ uploadedBy: userId }).distinct('name'),
            Media.distinct('aiCaptions.sceneType', { uploadedBy: userId }),
            Media.distinct('aiCaptions.mood', { uploadedBy: userId }),
            Media.distinct('metadata.people.name', { uploadedBy: userId }),
            Media.distinct('metadata.resolution', { uploadedBy: userId }),
            Media.distinct('metadata.mimetype', { uploadedBy: userId })
        ]);

        const formatFilter = (arr) => (arr && arr[0]?.all ? arr[0].all.filter(Boolean).sort() : []);

        res.status(200).json({
            success: true,
            data: {
                cameras: formatFilter(cameras),
                locations: formatFilter(locations),
                albums: albums.filter(Boolean).sort(),
                sceneTypes: sceneTypes.filter(Boolean).sort(),
                moods: moods.filter(Boolean).sort(),
                people: people.filter(Boolean).sort(),
                resolutions: resolutions.filter(Boolean).sort(),
                mimetypes: mimetypes.filter(Boolean).sort()
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
        let media = await Media.findById(req.params.id).populate('uploadedBy', 'username');
        if (!media) {
            return res.status(404).json({ success: false, error: 'Media not found' });
        }

        // Fix: If size is missing or 0, attempt to fetch it from S3 and update DB
        if ((!media.metadata?.size || media.metadata.size === 0) && media.metadata?.key && isAWSConfigured) {
            console.log(`[MEDIA] Size missing for "${media.title}" — fetching from S3...`);
            const actualSize = await getS3FileSize(media.metadata.key);
            if (actualSize > 0) {
                media.metadata.size = actualSize;
                await Media.updateOne({ _id: media._id }, { $set: { 'metadata.size': actualSize } });
                console.log(`[MEDIA] Updated size for "${media.title}": ${actualSize} bytes`);
            }
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

// @desc    Generate AI captions & keywords for a media item
// @route   POST /api/media/:id/captions
// @access  Private
exports.generateMediaCaptions = async (req, res, next) => {
    try {
        const media = await Media.findById(req.params.id);
        if (!media) {
            return res.status(404).json({ success: false, error: 'Media not found' });
        }

        // Only images supported
        if (media.type !== 'image') {
            return res.status(400).json({ success: false, error: 'Caption generation is only available for images.' });
        }

        // Authorization
        if (media.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, error: 'Not authorized' });
        }

        const s3Key = media.metadata?.key;
        if (!s3Key) {
            return res.status(400).json({ success: false, error: 'Image S3 key not found. Cannot generate captions.' });
        }

        const { generateCaptionsAndKeywords } = require('../utils/ai');
        const User = require('../models/User');

        const language = req.body.language || 'en';
        const existingTags = media.tags || [];

        // Fetch user preferences for personalization
        const user = await User.findById(req.user.id);
        const userPreferences = user?.aiPreferences || {};

        console.log(`[CAPTIONS] Generating personalized captions for "${media.title}" (tone=${userPreferences.preferredTone || 'casual'})...`);
        const captions = await generateCaptionsAndKeywords(s3Key, {
            language,
            existingTags,
            userPreferences
        });

        // Persist to database
        await Media.updateOne(
            { _id: media._id },
            { $set: { aiCaptions: captions } }
        );

        console.log(`[CAPTIONS] ✅ Saved personalized captions for "${media.title}"`);
        res.status(200).json({ success: true, data: captions });

    } catch (err) {
        console.error('[CAPTIONS] Error:', err.message);
        next(err);
    }
};

// @desc    Update AI captions & keywords (user edits)
// @route   PUT /api/media/:id/captions
// @access  Private
exports.updateMediaCaptions = async (req, res, next) => {
    try {
        const media = await Media.findById(req.params.id);
        if (!media) {
            return res.status(404).json({ success: false, error: 'Media not found' });
        }

        if (media.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, error: 'Not authorized' });
        }

        const { short, creative, professional, dramatic, keywords, hashtags } = req.body;

        const updatedCaptions = {
            ...media.aiCaptions?.toObject?.() || media.aiCaptions || {},
            ...(short !== undefined && { short }),
            ...(creative !== undefined && { creative }),
            ...(professional !== undefined && { professional }),
            ...(dramatic !== undefined && { dramatic }),
            ...(Array.isArray(keywords) && { keywords: keywords.filter(Boolean) }),
            ...(Array.isArray(hashtags) && { hashtags: hashtags.filter(Boolean) }),
            generatedAt: media.aiCaptions?.generatedAt || new Date()
        };

        await Media.updateOne({ _id: media._id }, { $set: { aiCaptions: updatedCaptions } });

        res.status(200).json({ success: true, data: updatedCaptions });
    } catch (err) {
        next(err);
    }
};

// @desc    Get real-time search suggestions
// @route   GET /api/media/suggestions
// @access  Public (or Private with userId from dashboard)
exports.getSearchSuggestions = async (req, res, next) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) {
            return res.status(200).json({ success: true, data: { keywords: [], locations: [], cameras: [], media: [] } });
        }

        const userId = req.user?.id || req.body.userId || null;
        const filter = userId ? { uploadedBy: userId } : {};
        const queryRegex = new RegExp(`^${escapeRegex(q)}|\\s${escapeRegex(q)}`, 'i');

        const [tags, locations, cameras, sampleMedia] = await Promise.all([
            // Match Tags (Keywords/Moods/Scenes)
            Media.aggregate([
                { $match: { ...filter } },
                { $unwind: "$tags" },
                { $match: { tags: { $regex: queryRegex } } },
                { $group: { _id: "$tags", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 5 }
            ]),
            // Match Locations
            Media.aggregate([
                { $match: { ...filter } },
                {
                    $project: {
                        allLocs: [
                            "$location.name",
                            "$location.address",
                            "$metadata.location.city",
                            "$metadata.location.placeName"
                        ]
                    }
                },
                { $unwind: "$allLocs" },
                { $match: { allLocs: { $regex: queryRegex } } },
                { $group: { _id: "$allLocs", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 5 }
            ]),
            // Match Cameras
            Media.aggregate([
                { $match: { ...filter } },
                {
                    $project: {
                        allCams: [
                            "$device",
                            "$metadata.camera.model",
                            "$metadata.camera.make"
                        ]
                    }
                },
                { $unwind: "$allCams" },
                { $match: { allCams: { $regex: queryRegex } } },
                { $group: { _id: "$allCams", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 5 }
            ]),
            // Match actual Media Samples
            Media.find({
                ...filter,
                $or: [
                    { title: { $regex: queryRegex } },
                    { tags: { $in: [queryRegex] } }
                ]
            })
            .select('title url type metadata.mimetype')
            .limit(4)
        ]);

        res.status(200).json({
            success: true,
            data: {
                keywords: tags.map(t => ({ text: t._id, count: t.count })),
                locations: locations.map(l => ({ text: l._id, count: l.count })),
                cameras: cameras.map(c => ({ text: c._id, count: c.count })),
                media: sampleMedia.map(m => ({
                    id: m._id,
                    title: m.title,
                    url: m.url,
                    type: m.type
                }))
            }
        });
    } catch (err) {
        console.error('Suggestions Error:', err);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};
