const mongoose = require('mongoose');
const User = require('../server/models/User');
const dotenv = require('dotenv');

dotenv.config({ path: '../server/.env' });

async function checkUser() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const email = 'a.singh@mediaindia.eu';
        const user = await User.findOne({ email: email.toLowerCase() });

        if (user) {
            console.log('User found:', {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            });
        } else {
            console.log('User not found');
            const allUsers = await User.find({}, 'email username');
            console.log('All Users in DB:', allUsers);
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

checkUser();
