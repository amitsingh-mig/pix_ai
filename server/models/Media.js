const mongoose = require('mongoose');

const MediaSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    thumbnailUrl: {
        type: String
    },
    lowResUrl: {
        type: String
    },
    highResUrl: {
        type: String
    },
    type: {
        type: String,
        required: true
    },
    tags: {
        type: [String],
        default: []
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    album: {
        type: String,
        trim: true
    },
    albumId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Album'
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    location: {
        name: String,
        address: String,
        latitude: Number,
        longitude: Number
    },
    camera: {
        make: String,
        model: String
    },
    device: String,
    metadata: {
        size: Number,
        mimetype: String,
        bucket: String,
        key: String,
        exif: {
            camera: String,
            lens: String,
            captureDate: Date,
            iso: Number,
            shutterSpeed: String,
            aperture: String,
            focalLength: String,
            make: String,
            model: String
        },
        location: {
            lat: Number,
            lng: Number,
            city: String,
            country: String,
            address: String,
            placeName: String
        },
        people: [{
            name: String,
            boundingBox: Object,
            confidence: Number
        }],
        device: String,
        duration: Number,
        resolution: String,
        photographyInsight: String
    },
    aiCaptions: {
        short: String,
        creative: String,
        professional: String,
        dramatic: String,
        recommended: String,
        keywords: [{
            term: String,
            score: Number,
            reason: String
        }],
        hashtags: [{
            term: String,
            engagement: String,
            rank: Number
        }],
        sceneType: String,
        mood: String,
        personalizationNotes: String,
        language: { type: String, default: 'en' },
        generatedAt: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes for performance (Phase 2)
MediaSchema.index({ tags: 1 });
MediaSchema.index({ album: 1 });
MediaSchema.index({
    tags: "text",
    album: "text",
    title: "text",
    description: "text",
    "location.name": "text",
    "location.address": "text",
    "camera.make": "text",
    "camera.model": "text",
    device: "text"
});
MediaSchema.index({ uploadedBy: 1 });
MediaSchema.index({ createdAt: -1 });
MediaSchema.index({ type: 1 });

module.exports = mongoose.model('Media', MediaSchema);
