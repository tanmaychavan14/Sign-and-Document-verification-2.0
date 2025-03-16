// backend/server.js
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const signatureRoutes = require('./routes/signatureRoutes');
const documentRoutes = require('./routes/documentRoutes');
const fs = require('fs');
const path = require('path');

// Initialize Express
const app = express();
const port = process.env.PORT || 4000;

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Create uploads directories if they don't exist
const uploadsDir = path.join(__dirname, 'uploads');
const documentsDir = path.join(__dirname, 'uploads/documents');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

if (!fs.existsSync(documentsDir)) {
  fs.mkdirSync(documentsDir);
}

// Routes
app.get('/', (req, res) => {
  res.send('Signature and Document Verification API is running');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/signatures', signatureRoutes);
app.use('/api/documents', documentRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Legacy endpoint for signature verification
app.post('/verify-signature', async (req, res) => {
  try {
    // Define paths for legacy code support
    const originalSignaturePath = path.join('uploads', 's1.jpg');
    const verificationSignaturePath = path.join('uploads', 's2.jpg');
    
    // Check if files exist
    if (!fs.existsSync(originalSignaturePath) || !fs.existsSync(verificationSignaturePath)) {
      return res.status(400).json({
        success: false,
        error: 'Signature files not found'
      });
    }
    
    // Create FormData object
    const FormData = require('form-data');
    const form = new FormData();
    form.append('original_signature', fs.createReadStream(originalSignaturePath));
    form.append('verification_signature', fs.createReadStream(verificationSignaturePath));
    
    // Send to FastAPI
    const axios = require('axios');
    const response = await axios.post(
      'http://127.0.0.1:8000/verify-signature/',
      form,
      { headers: form.getHeaders() }
    );
    
    // Return the result
    res.json(response.data);
  } catch (error) {
    console.error('Error verifying signature:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error'
    });
  }
});

// Add legacy endpoint for document verification
app.post('/verify-document', async (req, res) => {
  try {
    // Define paths for legacy code support
    const originalDocumentPath = path.join('uploads', 'documents', 'doc1.jpg');
    const verificationDocumentPath = path.join('uploads', 'documents', 'doc2.jpg');
    
    // Check if files exist
    if (!fs.existsSync(originalDocumentPath) || !fs.existsSync(verificationDocumentPath)) {
      return res.status(400).json({
        success: false,
        error: 'Document files not found'
      });
    }
    
    // Create FormData object
    const FormData = require('form-data');
    const form = new FormData();
    form.append('original_document', fs.createReadStream(originalDocumentPath));
    form.append('verification_document', fs.createReadStream(verificationDocumentPath));
    
    // Send to FastAPI
    const axios = require('axios');
    const response = await axios.post(
      'http://127.0.0.1:8000/verify-document/',
      form,
      { headers: form.getHeaders() }
    );
    
    // Return the result
    res.json(response.data);
  } catch (error) {
    console.error('Error verifying document:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error'
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});