const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const connectDB = require('./config/db');

dotenv.config();

const seedAdmin = async () => {
    await connectDB();

    const email = 'a.singh@mediaindia.eu';

    // ── Delete if exists to ensure clean state ──────────
    await User.deleteOne({ email });
    console.log(`Cleared existing user: ${email}`);

    try {
        await User.create({
            username: 'a.singh',
            email: email,
            password: 'password123',
            role: 'admin'
        });
        console.log('Admin user recreated successfully');
        console.log(`Email: ${email}`);
        console.log('Password: password123');
        process.exit();


    } catch (error) {
        console.error('Error creating admin user:', error);
        process.exit(1);
    }
};

seedAdmin();
