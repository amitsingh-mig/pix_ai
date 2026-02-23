const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
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

let storage;

if (isAWSConfigured) {
    const s3 = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
    });

    storage = multerS3({
        s3: s3,
        bucket: process.env.AWS_BUCKET_NAME,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: function (req, file, cb) {
            cb(null, `media/${Date.now().toString()}${path.extname(file.originalname)}`);
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

const upload = multer({ storage });

const deleteFile = async (key) => {
    // Detect storage type (assuming local for now as per instructions)
    if (!isAWSConfigured) {
        // Handle local file deletion
        const filePath = path.join(__dirname, '..', key.startsWith('data/media') ? key : path.join('data', 'media', key));
        try {
            if (fs.existsSync(filePath)) {
                await fs.promises.unlink(filePath);
                console.log(`✔ Local file deleted: ${key}`);
            } else {
                console.log(`ℹ Local file not found: ${key} (Expected at: ${filePath})`);
            }
        } catch (err) {
            console.error(`✖ Error deleting local file (${key}):`, err.message);
        }
        return;
    }

    // fallback for S3 if configured
    const s3 = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
    });

    const command = new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
    });
    try {
        await s3.send(command);
        console.log(`✔ S3 object deleted: ${key}`);
    } catch (err) {
        console.error("✖ Error deleting from S3", err);
    }
};

module.exports = { upload, deleteFile, isAWSConfigured };

