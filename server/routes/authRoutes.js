const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', (req, res) => {
    res.status(403).json({ success: false, error: 'Public registration is disabled. Contact an admin.' });
});
router.post('/login', login);
router.get('/me', protect, getMe);

module.exports = router;
