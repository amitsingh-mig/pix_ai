const exifParser = require('exif-parser');
const fs = require('fs');
const { RekognitionClient, DetectFacesCommand } = require('@aws-sdk/client-rekognition');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('ffmpeg-static');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Set ffmpeg path
if (ffmpegInstaller) {
    ffmpeg.setFfmpegPath(ffmpegInstaller);
}

const rekognitionClient = new RekognitionClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

/**
 * Extracts metadata from a video file using ffprobe
 * @param {string} filePath Path to the video file
 * @returns {Object} Extracted video metadata
 */
exports.extractVideoMetadata = async (filePath) => {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) {
                console.error('ffprobe error:', err);
                return resolve(null); // Resolve with null instead of rejecting to avoid breaking the flow
            }

            const { format, streams } = metadata;
            const videoStream = streams.find(s => s.codec_type === 'video');
            const tags = format.tags || {};

            resolve({
                camera: tags.make || tags.model || 'Unknown',
                lens: tags.lens_model || tags.lens || 'Unknown',
                captureDate: tags.creation_time ? new Date(tags.creation_time) : null,
                duration: format.duration,
                resolution: videoStream ? `${videoStream.width}x${videoStream.height}` : null,
                make: tags.make,
                model: tags.model,
                software: tags.software,
                device: tags.make || 'Unknown'
            });
        });
    });
};

/**
 * Extracts EXIF metadata from an image buffer or file path
 * @param {Buffer|string} input Buffer or Path to the image file
 * @returns {Object} Extracted EXIF data
 */
exports.extractExif = async (input) => {
    try {
        // Size check before reading buffer (Requirement: If file > 25MB -> skip)
        if (typeof input === 'string') {
            const stats = fs.statSync(input);
            const fileSizeInBytes = stats.size;
            const fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024);
            if (fileSizeInMegabytes > 25) {
                console.log(`ℹ File size (${fileSizeInMegabytes.toFixed(2)}MB) exceeds 25MB limit. Skipping EXIF extraction.`);
                return null;
            }
        }

        // Use async file reading to avoid blocking the event loop
        const buffer = Buffer.isBuffer(input) ? input : await fs.promises.readFile(input);
        const parser = exifParser.create(buffer);
        const result = parser.parse();

        const { tags } = result;

        return {
            camera: tags.Model || tags.Make || 'Unknown',
            lens: tags.LensModel || tags.LensInfo || 'Unknown',
            captureDate: tags.DateTimeOriginal ? new Date(tags.DateTimeOriginal * 1000) : null,
            iso: tags.ISO,
            shutterSpeed: tags.ExposureTime ? `1/${Math.round(1 / tags.ExposureTime)}` : null,
            aperture: tags.FNumber ? `f/${tags.FNumber}` : null,
            location: tags.GPSLatitude && tags.GPSLongitude ? {
                lat: tags.GPSLatitude,
                lng: tags.GPSLongitude
            } : null,
            device: tags.Make || 'Unknown'
        };
    } catch (err) {
        console.error('EXIF Extraction Error:', err.message);
        return null;
    }
};

/**
 * Detects faces using AWS Rekognition
 * @param {Object} imageSource Either { S3Object: { Bucket, Name } } or { Bytes: Buffer }
 * @returns {Array} List of detected people
 */
exports.detectPeople = async (imageSource) => {
    try {
        if (!process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID === 'your_aws_access_key') {
            return [];
        }

        const command = new DetectFacesCommand({
            Image: imageSource,
            Attributes: ['ALL']
        });

        const response = await rekognitionClient.send(command);

        return response.FaceDetails.map((face, index) => ({
            name: `Person ${index + 1}`, // Fallback name
            boundingBox: face.BoundingBox,
            confidence: face.Confidence
        }));
    } catch (err) {
        console.error('Rekognition Face Detection Error:', err.message);
        return [];
    }
};

/**
 * Gets address from coordinates using Nominatim
 */
exports.reverseGeocode = async (lat, lng) => {
    try {
        // Throttling for Nominatim (Requirement: ~1 request per second)
        await delay(1000);

        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
            headers: { 'User-Agent': 'AI-Media-Management-System' }
        });
        const data = await response.json();

        if (data && data.address) {
            return {
                city: data.address.city || data.address.town || data.address.village || data.address.suburb,
                country: data.address.country,
                address: data.display_name,
                placeName: data.name || data.address.amenity || data.address.road
            };
        }
        return null;
    } catch (err) {
        console.error('Reverse Geocoding Error:', err.message);
        return null;
    }
};
/**
 * Gets coordinates from a place name using Nominatim
 * @param {string} query The place name to geocode
 * @returns {Object} Coordinates { lat, lng } and details
 */
exports.geocode = async (query) => {
    try {
        if (!query) return null;

        // Throttling for Nominatim
        await delay(1000);

        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, {
            headers: { 'User-Agent': 'AI-Media-Management-System' }
        });
        const data = await response.json();

        if (data && data.length > 0) {
            const first = data[0];
            return {
                lat: parseFloat(first.lat),
                lng: parseFloat(first.lon),
                placeName: first.display_name,
                // Attempt to parse out city/country if needed, or just use display_name
                city: first.display_name.split(',')[0],
                country: first.display_name.split(',').pop().trim()
            };
        }
        return null;
    } catch (err) {
        console.error('Geocoding Error:', err.message);
        return null;
    }
};
