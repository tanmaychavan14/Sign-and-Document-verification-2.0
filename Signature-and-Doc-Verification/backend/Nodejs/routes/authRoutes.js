// backend/routes/authRoutes.js
const express = require('express');
const { register, login, getUserProfile,logout } = require('../controllers/authController');
const { protect } = require('../auth/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, getUserProfile);
router.post('/logout', protect, logout); 

module.exports = router;