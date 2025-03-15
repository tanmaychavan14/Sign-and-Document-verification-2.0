// backend/routes/signatureRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const { 
  uploadReferenceSignature, 
  verifySignature,
  getUserReferenceSignatures,
} = require('../controllers/signatureController');
const { protect } = require('../auth/authMiddleware');

const router = express.Router();

// Configure file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Create a unique filename using user ID and timestamp
    cb(null, `${req.user._id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });

// Configure uploads for verification
const verificationStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    if (file.fieldname === 'verification_signature') {
      cb(null, `verify-${req.user._id}-${Date.now()}${path.extname(file.originalname)}`);
    } else {
      cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
  }
});

const verificationUpload = multer({ storage: verificationStorage });

// Routes
router.post('/reference', protect, upload.single('signature'), uploadReferenceSignature);
router.post('/verify', protect, verificationUpload.fields([
  { name: 'verification_signature', maxCount: 1 }
]), verifySignature);
router.get('/references', protect, getUserReferenceSignatures);

module.exports = router;