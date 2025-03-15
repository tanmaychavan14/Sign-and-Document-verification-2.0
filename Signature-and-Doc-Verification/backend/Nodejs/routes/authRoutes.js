// backend/routes/authRoutes.js
const express = require('express');
const multer = require('multer');
const { register, login, getUserProfile, logout } = require('../controllers/authController');
const { protect } = require('../auth/authMiddleware');

const router = express.Router();

// Multer storage setup
const storage = multer.memoryStorage(); // Store files in memory

const upload = multer({ storage });

// Routes
router.post('/register', upload.fields([
  { name: 'profilePicture', maxCount: 1 },
  { name: 'originalSignature', maxCount: 1 }
]), register);

router.post('/login', login);
router.get('/profile', protect, getUserProfile);
router.post('/logout', protect, logout);

module.exports = router;
