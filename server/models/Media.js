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
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Album'
    },
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
        resolution: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Media', MediaSchema);
