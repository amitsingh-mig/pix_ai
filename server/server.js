if (typeof window !== 'undefined') {
    throw new Error('Backend security configuration must run in Node.js server environment only.');
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
dotenv.config();

const connectDB = require('./config/db');

const app = express();

const path = require('path');

// Security Headers
app.use(helmet());

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiter to all API routes
app.use('/api/', limiter);

// Data Sanitization against NoSQL Injection (Custom lightweight implementation)
app.use((req, res, next) => {
    const sanitize = (obj) => {
        if (obj && typeof obj === 'object') {
            Object.keys(obj).forEach(key => {
                if (key.startsWith('$')) {
                    delete obj[key];
                } else if (typeof obj[key] === 'object') {
                    sanitize(obj[key]);
                }
            });
        }
    };
    sanitize(req.body);
    sanitize(req.query);
    sanitize(req.params);
    next();
});

// Middleware
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:5173'],
    credentials: true
}));

// Standard JSON limit for most routes (increased from default but restricted from global 100mb)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));


app.use('/data/media', express.static(path.join(__dirname, 'data', 'media')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Fallback for old files

// Video Streaming with Range Support
app.get(/^\/api\/stream\/(.+)$/, (req, res) => {
    const filename = req.params[0];
    const filePath = path.join(__dirname, 'data', 'media', filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).send('File not found');
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(filePath, { start, end });
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4', // Default to mp4, ideally detect from extension
        };
        res.writeHead(206, head);
        file.pipe(res);
    } else {
        const head = {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
        };
        res.writeHead(200, head);
        fs.createReadStream(filePath).pipe(res);
    }
});




const startServer = async () => {
    try {
        // Connect to Database
        await connectDB();

        // Routes
        app.use('/api/auth', require('./routes/authRoutes'));
        app.use('/api/media', require('./routes/mediaRoutes'));
        app.use('/api/admin', require('./routes/adminRoutes'));
        app.use('/api/albums', require('./routes/albumRoutes'));
        app.use('/api/users', require('./routes/userRoutes'));


        app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

        // Global Error Handler
        app.use((err, req, res, next) => {
            console.error('[ERROR]', err);
            res.status(err.status || 500).json({
                success: false,
                error: err.message || 'Server Error'
            });
        });

        const PORT = process.env.PORT || 5000;
        const server = app.listen(PORT, () => console.log(`✔ Server started on port ${PORT}`));

        // Increase server timeout for large bulk uploads (10 minutes)
        server.timeout = 600000;
        server.keepAliveTimeout = 610000;
        server.headersTimeout = 620000;
    } catch (err) {
        console.error('Failed to start server:', err.message);
        process.exit(1);
    }
};

startServer();

