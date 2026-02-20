const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

dotenv.config();

const verifyAuth = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✔ MongoDB Connected');

        const email = 'a.singh@mediaindia.eu';
        const passwordToTest = 'password123';

        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            console.error('✖ User not found');
            process.exit(1);
        }

        console.log('Testing password matching...');
        console.log('Hashed password in DB:', user.password);

        const isMatch = await user.matchPassword(passwordToTest);
        console.log('Result using user.matchPassword():', isMatch);

        const manualMatch = await bcrypt.compare(passwordToTest, user.password);
        console.log('Result using manual bcrypt.compare():', manualMatch);

        await mongoose.disconnect();
    } catch (err) {
        console.error('✖ Error:', err.message);
        process.exit(1);
    }
};

verifyAuth();
