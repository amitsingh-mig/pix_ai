const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { s3, isAWSConfigured, uploadBuffer } = require('./s3');
const { GetObjectCommand } = require('@aws-sdk/client-s3');

/**
 * Generates a low-resolution (compressed) version of an image file on S3
 * @param {string} bucket S3 bucket name
 * @param {string} key S3 key for original file
 * @param {string} mimetype Original mimetype
 * @returns {Promise<{ url: string, key: string }|null>} URL and Key for low-res file or null
 */
exports.generateLowResS3 = async (bucket, key, mimetype) => {
    if (!isAWSConfigured) return null;

    try {
        console.log(`[LOW-RES] Generating preview for: ${key}`);
        
        // 1. Fetch the original from S3 (full file for resizing)
        const getCommand = new GetObjectCommand({
            Bucket: bucket,
            Key: key
        });
        const response = await s3.send(getCommand);
        
        // 2. Transform stream to buffer
        const byteArray = await response.Body.transformToByteArray();
        const originalBuffer = Buffer.from(byteArray);
        
        // 3. Resize with Sharp
        // Compression: jpeg/webp with quality 75-80, width 800 (good for UI)
        const resizer = sharp(originalBuffer)
            .resize({
                width: 800,
                withoutEnlargement: true
            });

        let lowResBuffer;
        let extension = path.extname(key).toLowerCase() || '.jpg';
        
        // Convert to webp if possible for better compression, else keep original format or jpeg
        if (mimetype === 'image/png' || mimetype === 'image/webp') {
            lowResBuffer = await resizer.webp({ quality: 80 }).toBuffer();
            extension = '.webp';
        } else {
            lowResBuffer = await resizer.jpeg({ quality: 80 }).toBuffer();
            extension = '.jpg';
        }

        // 4. Determine key for low-res file
        const filename = path.basename(key, path.extname(key));
        const lowResKey = `low/${filename}${extension}`;
        
        // 5. Upload back to S3
        const lowResUrl = await uploadBuffer(lowResBuffer, lowResKey, mimetype);
        
        console.log(`[LOW-RES] Success: ${lowResKey} (${lowResBuffer.length} bytes)`);
        
        return {
            url: lowResUrl,
            key: lowResKey
        };
    } catch (err) {
        console.error('✖ Error generating low-res image for S3:', err.message);
        return null;
    }
};

/**
 * Generates a local thumbnail (Legacy for local storage)
 * @param {string} inputPath Path to original
 * @param {string} filename Filename
 * @returns {string|null} Relative path or null
 */
exports.generateThumbnail = async (inputPath, filename) => {
    try {
        const now = new Date();
        const yearMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
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

        return `/data/media/thumbnails/${yearMonth}/${thumbnailFilename}`;
    } catch (err) {
        console.error('Thumbnail Generation Error:', err.message);
        return null;
    }
};

