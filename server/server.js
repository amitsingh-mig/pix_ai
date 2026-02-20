const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = require('./config/db');

const app = express();

const path = require('path');

// Middleware
app.use(express.json());
app.use(cors());
app.use((req, res, next) => {
    console.log(`[REQ] ${new Date().toISOString()} - ${req.method} ${req.url}`);
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

        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => console.log(`✔ Server started on port ${PORT}`));
    } catch (err) {
        console.error('Failed to start server:', err.message);
        process.exit(1);
    }
};

startServer();

