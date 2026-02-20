const User = require('../models/User');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    // NOTE: role is intentionally NOT taken from req.body — prevents privilege escalation
    const { username, email, password } = req.body;

    try {
        const user = await User.create({ username, email, password });
        sendTokenResponse(user, 201, res);
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Please provide an email and password' });
    }

    try {
        console.log(`[AUTH DEBUG] Login attempt for email: "${email}" (length: ${email?.length})`);
        console.log(`[AUTH DEBUG] Provided password length: ${password?.length}`);

        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            console.log(`[AUTH DEBUG] User not found in DB: "${email}"`);
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        console.log(`[AUTH DEBUG] User found: ${user.email}. Role: ${user.role}`);
        const isMatch = await user.matchPassword(password);
        console.log(`[AUTH DEBUG] Password match result: ${isMatch}`);

        if (!isMatch) {
            console.log(`[AUTH DEBUG] Password mismatch for: ${email}`);
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }



        sendTokenResponse(user, 200, res);
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({ success: true, data: user });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

const sendTokenResponse = (user, statusCode, res) => {
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });

    const options = {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        httpOnly: true
    };

    res.status(statusCode).json({
        success: true,
        token,
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        }
    });
};
