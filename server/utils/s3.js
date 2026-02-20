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
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
    }

    storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, uploadDir);
        },
        filename: function (req, file, cb) {
            cb(null, `${Date.now()}${path.extname(file.originalname)}`);
        }
    });

    console.log('ℹ AWS not configured. Using local storage fallback.');
}

const upload = multer({ storage });

const deleteFromS3 = async (key) => {
    if (!isAWSConfigured) {
        // Handle local file deletion if needed, but for now we skip or just log
        console.log(`ℹ Local storage active. Skipping S3 deletion for: ${key}`);
        return;
    }

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
    } catch (err) {
        console.error("Error deleting from S3", err);
    }
};

module.exports = { upload, deleteFromS3, isAWSConfigured };

