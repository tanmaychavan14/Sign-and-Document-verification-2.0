// backend/routes/documentRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const { 
  uploadReferenceDocument, 
  verifyDocument,
  getUserReferenceDocuments,
} = require('../controllers/documentController');
const { protect } = require('../auth/authMiddleware');

const router = express.Router();

// Configure file storage for documents
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/documents/');
  },
  filename: function (req, file, cb) {
    // Create a unique filename using user ID and timestamp
    cb(null, `doc-${req.user._id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });

// Configure uploads for document verification
const verificationStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/documents/');
  },
  filename: function (req, file, cb) {
    if (file.fieldname === 'verification_document') {
      cb(null, `verify-doc-${req.user._id}-${Date.now()}${path.extname(file.originalname)}`);
    } else {
      cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
  }
});

const verificationUpload = multer({ storage: verificationStorage });

// Routes
router.post('/reference', protect, upload.single('document'), uploadReferenceDocument);
router.post('/verify', protect, verificationUpload.fields([
  { name: 'verification_document', maxCount: 1 }
]), verifyDocument);
router.get('/references', protect, getUserReferenceDocuments);


module.exports = router;