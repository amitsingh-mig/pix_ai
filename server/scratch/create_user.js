const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const createUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✔ Connected to MongoDB');

        const email = 'test@example.com';
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            console.log('ℹ User already exists');
        } else {
            const user = await User.create({
                username: 'testuser',
                email: email,
                password: 'password123',
                role: 'admin'
            });
            console.log('✔ User created:', user.email);
        }

        await mongoose.connection.close();
    } catch (err) {
        console.error('✖ Error:', err.message);
        process.exit(1);
    }
};

createUser();
