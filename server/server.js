const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = require('./config/db');

const app = express();

const path = require('path');

// Middleware
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(cors());
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[REQ] ${new Date().toISOString()} - ${req.method} ${req.url} ${res.statusCode} (${duration}ms)`);
        if (['POST', 'PUT'].includes(req.method) && req.body) {
            console.log(`[REQ BODY] ${JSON.stringify(req.body)}`);
        }
    });
    next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));




const startServer = async () => {
    try {
        // Connect to Database
        await connectDB();

        // Routes
        app.use('/api/auth', require('./routes/authRoutes'));
        app.use('/api/media', require('./routes/mediaRoutes'));
        app.use('/api/admin', require('./routes/adminRoutes'));
        app.use('/api/albums', require('./routes/albumRoutes'));


        app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

        // Error Handler for Malformed JSON
        app.use((err, req, res, next) => {
            if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
                console.error(`[JSON ERROR] ${new Date().toISOString()} - Malformed JSON from ${req.ip}: ${err.message}`);
                return res.status(400).json({ success: false, error: 'Invalid JSON format' });
            }
            next(err);
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

