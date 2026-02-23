const express = require('express');
const router = express.Router();
const { getStats, getUsers, deleteUser, createUser, getUserDetails, updateUser, changeUserPassword } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All admin routes require authentication + admin role
router.use(protect, authorize('admin'));

router.get('/stats', getStats);
router.get('/users', getUsers);
router.get('/users/:id', getUserDetails);
router.put('/users/:id', updateUser);
router.put('/users/:id/password', changeUserPassword);
router.delete('/users/:id', deleteUser);
router.post('/create-user', createUser);

module.exports = router;
