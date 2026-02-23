const User = require('../models/User');
const Media = require('../models/Media');
const bcrypt = require('bcryptjs');

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const { fullName, email, username } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        user.fullName = fullName || user.fullName;
        user.email = email || user.email;
        user.username = username || user.username;

        await user.save();

        res.status(200).json({
            success: true,
            data: {
                id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                profilePhoto: user.profilePhoto
            }
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Update password
// @route   PUT /api/users/password
// @access  Private
exports.updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user.id).select('+password');

        // Check current password
        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Current password is incorrect' });
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Get user media stats
// @route   GET /api/users/stats
// @access  Private
exports.getProfileStats = async (req, res) => {
    try {
        const imageCount = await Media.countDocuments({ uploadedBy: req.user.id, type: 'image' });
        const videoCount = await Media.countDocuments({ uploadedBy: req.user.id, type: 'video' });

        // Calculate storage used (rough estimate from metadata.size)
        const media = await Media.find({ uploadedBy: req.user.id }).select('metadata.size');
        const totalSize = media.reduce((acc, curr) => acc + (curr.metadata?.size || 0), 0);

        res.status(200).json({
            success: true,
            data: {
                totalMedia: imageCount + videoCount,
                imageCount,
                videoCount,
                storageUsed: totalSize // in bytes
            }
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Update profile photo
// @route   PUT /api/users/photo
// @access  Private
exports.updateProfilePhoto = async (req, res) => {
    try {
        if (!req.file && !req.files) {
            return res.status(400).json({ success: false, error: 'Please upload a photo' });
        }

        const user = await User.findById(req.user.id);

        // If file uploaded via S3, use location, else use relative path from the data/media folder
        let fileUrl;
        if (req.file?.location) {
            fileUrl = req.file.location;
        } else {
            // Construct the path relative to the root served by /data
            const destination = req.file.destination.replace(/\\/g, '/'); // Normalize windows paths
            fileUrl = `/${destination}/${req.file.filename}`;
        }

        user.profilePhoto = fileUrl;
        await user.save();

        res.status(200).json({
            success: true,
            data: {
                profilePhoto: user.profilePhoto
            }
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};
