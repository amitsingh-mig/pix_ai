const { S3Client, DeleteObjectCommand, HeadObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const fs = require('fs');

// Check if AWS credentials are valid or placeholders
const isAWSConfigured =
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_ACCESS_KEY_ID !== 'your_aws_access_key' &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_SECRET_ACCESS_KEY !== 'your_aws_secret_key';

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

let storage;

if (isAWSConfigured) {
    storage = multerS3({
        s3: s3,
        bucket: process.env.AWS_BUCKET_NAME,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: function (req, file, cb) {
            // New structure: original/timestamp.ext
            cb(null, `original/${Date.now().toString()}${path.extname(file.originalname)}`);
        }
    });

    console.log('✔ AWS S3 storage initialized');
} else {
    // Local storage fallback
    storage = multer.diskStorage({
        destination: function (req, file, cb) {
            const now = new Date();
            const yearMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
            const uploadDir = path.join('data', 'media', yearMonth);

            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            cb(null, uploadDir);
        },
        filename: function (req, file, cb) {
            cb(null, `${Date.now()}${path.extname(file.originalname)}`);
        }
    });

    console.log('ℹ AWS not configured. Using monthly-partitioned local storage.');
}

const upload = multer({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB per file
        files: 100 // Maximum 100 files at once
    },
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|webp|mp4|mov|avi|quicktime/;
        const mimetypes = /image\/(jpeg|jpg|png|webp)|video\/(mp4|quicktime|x-msvideo)/;

        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = mimetypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only images (jpg, png, webp) and videos (mp4, mov, avi) are allowed!'));
        }
    }
});

const deleteFile = async (key) => {
    if (!key) return;

    // Detect storage type
    if (!isAWSConfigured) {
        // Handle local file deletion
        let localPath = key;
        if (localPath.startsWith('/')) {
            localPath = localPath.substring(1);
        }
        const basePath = localPath.startsWith('data/media') ? '' : path.join('data', 'media');
        const filePath = path.join(__dirname, '..', basePath, localPath);

        try {
            if (fs.existsSync(filePath)) {
                await fs.promises.unlink(filePath);
                console.log(`✔ Local file deleted: ${filePath}`);
            } else {
                console.log(`ℹ Local file not found: ${filePath}`);
            }
        } catch (err) {
            console.error(`✖ Error deleting local file (${key}):`, err.message);
        }
        return;
    }

    const command = new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
    });
    try {
        await s3.send(command).then(() => {
            console.log(`✔ S3 object deleted: ${key}`);
        });
    } catch (err) {
        console.error("✖ Error deleting from S3", err);
    }
};

const getS3FileSize = async (key) => {
    if (!key || !isAWSConfigured) return 0;
    
    try {
        const command = new HeadObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
        });
        const response = await s3.send(command);
        return response.ContentLength || 0;
    } catch (err) {
        console.error(`✖ Error fetching size for S3 object (${key}):`, err.message);
        return 0;
    }
};

/**
 * Uploads a buffer to S3
 * @param {Buffer} buffer The buffer to upload
 * @param {string} key The key (path) in S3
 * @param {string} mimetype The mimetype
 * @returns {Promise<string>} The URL of the uploaded object
 */
const uploadBuffer = async (buffer, key, mimetype) => {
    if (!isAWSConfigured) {
        throw new Error('S3 not configured for uploadBuffer');
    }

    const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: mimetype
    });

    await s3.send(command);
    return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};

module.exports = { 
    upload, 
    deleteFile, 
    isAWSConfigured, 
    s3, 
    getS3FileSize,
    uploadBuffer
};


