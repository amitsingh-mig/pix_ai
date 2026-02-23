const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

/**
 * Generates a thumbnail for an image file
 * @param {string} inputPath Path to the original file
 * @param {string} filename Original filename
 * @returns {string|null} Relative path to the generated thumbnail or null
 */
exports.generateThumbnail = async (inputPath, filename) => {
    try {
        const now = new Date();
        const yearMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

        // As per instruction: /data/media/thumbnails/YYYY-MM/
        // Note: Using a path relative to the server root for local storage
        const thumbnailDir = path.join(__dirname, '..', 'data', 'media', 'thumbnails', yearMonth);

        if (!fs.existsSync(thumbnailDir)) {
            fs.mkdirSync(thumbnailDir, { recursive: true });
        }

        const thumbnailFilename = `thumb_${filename}`;
        const outputPath = path.join(thumbnailDir, thumbnailFilename);

        await sharp(inputPath)
            .resize({
                width: 400,
                withoutEnlargement: true
            })
            .toFormat('jpeg')
            .jpeg({ quality: 80 })
            .toFile(outputPath);

        // Return the path for access
        return `/data/media/thumbnails/${yearMonth}/${thumbnailFilename}`;
    } catch (err) {
        console.error('Thumbnail Generation Error:', err.message);
        return null;
    }
};
