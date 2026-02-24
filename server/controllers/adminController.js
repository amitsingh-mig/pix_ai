const User = require('../models/User');
const Media = require('../models/Media');
const { deleteFile } = require('../utils/s3');

// @desc    Get platform stats
// @route   GET /api/admin/stats
// @access  Admin
exports.getStats = async (req, res, next) => {
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
        next(err);
    }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Admin
exports.getUsers = async (req, res, next) => {
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
        next(err);
    }
};

// @desc    Delete a user and all their media
// @route   DELETE /api/admin/users/:id
// @access  Admin
exports.deleteUser = async (req, res, next) => {
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
                .map(m => deleteFile(m.metadata.key))
        );

        await Media.deleteMany({ uploadedBy: req.params.id });
        await user.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        console.error('[ADMIN DELETE ERROR]', err);
        next(err);
    }
};

// @desc    Admin creates a new user (registration disabled publicly)
// @route   POST /api/admin/create-user
// @access  Admin
exports.createUser = async (req, res, next) => {
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
// @desc    Get single user details
// @route   GET /api/admin/users/:id
// @access  Admin
exports.getUserDetails = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const mediaCount = await Media.countDocuments({ uploadedBy: req.params.id });

        res.status(200).json({
            success: true,
            data: {
                ...user._doc,
                mediaCount
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update user details
// @route   PUT /api/admin/users/:id
// @access  Admin
exports.updateUser = async (req, res, next) => {
    try {
        let user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const { username, email, role, fullName } = req.body;

        // Check if updating to an existing username or email
        if (username || email) {
            const existing = await User.findOne({
                $and: [
                    { _id: { $ne: req.params.id } },
                    { $or: [{ email: email || user.email }, { username: username || user.username }] }
                ]
            });
            if (existing) {
                return res.status(400).json({ success: false, error: 'Username or email already taken' });
            }
        }

        user = await User.findByIdAndUpdate(req.params.id, {
            username: username || user.username,
            email: email || user.email,
            role: role || user.role,
            fullName: fullName !== undefined ? fullName : user.fullName
        }, { new: true, runValidators: true });

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (err) {
        console.error(err);
        res.status(400).json({ success: false, error: err.message });
    }
};
// @desc    Change user password (Admin)
// @route   PUT /api/admin/users/:id/password
// @access  Admin
exports.changeUserPassword = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const { password } = req.body;
        if (!password || password.length < 6) {
            return res.status(400).json({ success: false, error: 'Please provide a password with at least 6 characters' });
        }

        user.password = password;
        await user.save(); // Triggers the hashing middleware in User model

        res.status(200).json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (err) {
        console.error(err);
        next(err);
    }
};
