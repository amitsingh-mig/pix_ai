const mongoose = require('mongoose');

const PLACEHOLDER = 'cluster0.a1b2c3d.mongodb.net';

const connectDB = async () => {
    const uri = process.env.MONGO_URI || '';

    // ── Guard: detect un-replaced placeholder ──────────────────
    if (!uri || uri.includes('<YOUR_CLUSTER') || uri.includes(PLACEHOLDER)) {
        console.error('');
        console.error('╔══════════════════════════════════════════════════════════╗');
        console.error('║  ❌  MONGO_URI is not configured                        ║');
        console.error('╠══════════════════════════════════════════════════════════╣');
        console.error('║  1. Log in to https://cloud.mongodb.com                 ║');
        console.error('║  2. Click your cluster → Connect → Drivers              ║');
        console.error('║  3. Copy the hostname (cluster0.xxxxx.mongodb.net)      ║');
        console.error('║  4. Paste it into server/.env  MONGO_URI line           ║');
        console.error('║  5. Atlas → Network Access → Allow 0.0.0.0/0           ║');
        console.error('║  6. Restart: npm run dev                                ║');
        console.error('╚══════════════════════════════════════════════════════════╝');
        console.error('');
        process.exit(1);   // fail hard so the issue is impossible to miss
    }

    // ── Connect ────────────────────────────────────────────────
    try {
        const conn = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 8000,   // surface error in 8 s, not 30 s
            connectTimeoutMS: 8000,
        });
        console.log(`✔  MongoDB Connected: ${conn.connection.host}`);
    } catch (err) {
        console.error('');
        console.error('✖  MongoDB connection failed:', err.message);
        console.error('   Check: Is your cluster hostname correct in server/.env?');
        console.error('   Check: Is your IP whitelisted in Atlas → Network Access?');
        console.error('   Check: Is your Atlas cluster active (not paused)?');
        console.error('');
        process.exit(1);
    }
};

module.exports = connectDB;
