const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const testConnection = async () => {
    const uri = process.env.MONGO_URI;
    console.log('Testing connection...');

    try {
        await mongoose.connect(uri);
        console.log('✔  Successfully connected to MongoDB');

        console.log('Testing query on "users" collection...');
        // We don't strictly need a schema for a raw check, but Mongoose likes it
        const userCount = await mongoose.connection.db.collection('users').countDocuments();
        console.log('✔  Query successful. Document count in "users":', userCount);

        const firstUser = await mongoose.connection.db.collection('users').findOne({});
        console.log('✔  First user found:', firstUser ? firstUser.email : 'None');

        await mongoose.disconnect();
        console.log('✔  Disconnected');
    } catch (err) {
        console.error('✖  Diagnostic failed:', err.message);
        process.exit(1);
    }
};

testConnection();
