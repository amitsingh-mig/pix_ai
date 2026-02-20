/**
 * Seed script — creates an admin user directly in MongoDB.
 * Run once: node server/scripts/seedAdmin.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const ADMIN = {
    username: 'asingh',
    email: 'a.singh@mediaindia.eu',
    password: 'Admin@1234',   // <-- change after first login
    role: 'admin',
};

(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✔  Connected to MongoDB');

        const existing = await User.findOne({ email: ADMIN.email });
        if (existing) {
            // Promote to admin if already exists
            existing.role = 'admin';
            await existing.save();
            console.log(`✔  Existing user promoted to admin: ${ADMIN.email}`);
        } else {
            await User.create(ADMIN);
            console.log(`✔  Admin user created: ${ADMIN.email}`);
        }

        console.log('');
        console.log('  Email   :', ADMIN.email);
        console.log('  Password: Admin@1234  ← change this after first login');
        console.log('  Role    : admin');
    } catch (err) {
        console.error('✖ Error:', err.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
})();
