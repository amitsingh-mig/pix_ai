const User = require('../models/User');
const Media = require('../models/Media');
const { deleteFromS3 } = require('../utils/s3');

// @desc    Get platform stats
// @route   GET /api/admin/stats
// @access  Admin
exports.getStats = async (req, res) => {
    try {
        const [totalUsers, totalMedia, totalImages, totalVideos] = await Promise.all([
            User.countDocuments(),
            Media.countDocuments(),
            Media.countDocuments({ type: 'image' }),
            Media.countDocuments({ type: 'video' }),
        ]);

        res.status(200).json({
            success: true,
            data: { totalUsers, totalMedia, totalImages, totalVideos }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Admin
exports.getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            User.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
            User.countDocuments()
        ]);

        res.status(200).json({
            success: true,
            count: users.length,
            total,
            pages: Math.ceil(total / limit),
            currentPage: page,
            data: users
        });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Delete a user and all their media
// @route   DELETE /api/admin/users/:id
// @access  Admin
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        // Prevent deleting self
        if (user._id.toString() === req.user.id) {
            return res.status(400).json({ success: false, error: 'Cannot delete your own account' });
        }

        // Delete all S3 objects for this user's media
        const mediaItems = await Media.find({ uploadedBy: req.params.id });
        await Promise.all(
            mediaItems
                .filter(m => m.metadata && m.metadata.key)
                .map(m => deleteFromS3(m.metadata.key))
        );

        await Media.deleteMany({ uploadedBy: req.params.id });
        await user.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Admin creates a new user (registration disabled publicly)
// @route   POST /api/admin/create-user
// @access  Admin
exports.createUser = async (req, res) => {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ success: false, error: 'Please provide username, email, and password' });
    }

    try {
        const existing = await User.findOne({ $or: [{ email }, { username }] });
        if (existing) {
            return res.status(400).json({ success: false, error: 'A user with that email or username already exists' });
        }

        const user = await User.create({
            username,
            email,
            password,
            role: role === 'admin' ? 'admin' : 'user',  // whitelist roles
        });

        res.status(201).json({
            success: true,
            data: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
            }
        });
    } catch (err) {
        console.error(err);
        res.status(400).json({ success: false, error: err.message });
    }
};
