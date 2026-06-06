const express = require('express');
const router = express.Router();
const { register, login, getMe, forgotPassword, resetPassword, getAllUsers } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.get('/users', protect, authorize('admin'), getAllUsers);

module.exports = router;
