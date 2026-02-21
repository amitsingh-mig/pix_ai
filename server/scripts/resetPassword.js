/**
 * One-off password reset script.
 * Usage:  node server/scripts/resetPassword.js <email> <newPassword>
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const [, , email, newPassword] = process.argv;

if (!email || !newPassword) {
    console.error('Usage: node resetPassword.js <email> <newPassword>');
    process.exit(1);
}

(async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const hash = await bcrypt.hash(newPassword, 10);

    // Bypass the pre-save hook by using updateOne with the already-hashed value
    const result = await User.updateOne({ email }, { $set: { password: hash } });

    if (result.matchedCount === 0) {
        console.error(`❌  No user found with email: ${email}`);
    } else {
        console.log(`✅  Password updated successfully for ${email}`);
    }

    await mongoose.disconnect();
})();
