// backend/controllers/signatureController.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const { 
  createSignature,
  getUserSignatures 
} = require('../database/operations/signatureOperations');
const { addVerificationToHistory } = require('../database/operations/userOperations');

// Upload reference signature
const uploadReferenceSignature = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    // Create signature record in database
    const signature = await createSignature({
      owner: req.user._id,
      filename: req.file.filename,
      path: req.file.path,
      isReference: true,
      description: req.body.description || 'Reference signature'
    });
    
    res.status(201).json({
      success: true,
      signature
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Verify signature with FastAPI service
const verifySignature = async (req, res) => {
  try {
    if (!req.files || !req.files.verification_signature) {
      return res.status(400).json({
        success: false,
        message: 'Verification signature is required'
      });
    }
    
    // Get reference signature
    const referenceSignatures = await getUserSignatures(req.user._id);
    if (referenceSignatures.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No reference signature found'
      });
    }
    
    // Use the most recent reference signature
    const referenceSignature = referenceSignatures[0];
    
    // Create FormData for FastAPI
    const form = new FormData();
    form.append('original_signature', fs.createReadStream(referenceSignature.path));
    form.append('verification_signature', fs.createReadStream(req.files.verification_signature[0].path));
    
    // Send to FastAPI service
    const response = await axios.post(
      'http://127.0.0.1:8000/verify-signature/',
      form,
      { headers: form.getHeaders() }
    );
    
    // Add to verification history
    await addVerificationToHistory(req.user._id, {
      originalSignature: referenceSignature.filename,
      verificationSignature: req.files.verification_signature[0].filename,
      similarityScore: response.data.similarity_score,
      isMatch: response.data.match
    });
    
    res.status(200).json({
      success: true,
      result: response.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all reference signatures
const getUserReferenceSignatures = async (req, res) => {
  try {
    const signatures = await getUserSignatures(req.user._id);
    
    res.status(200).json({
      success: true,
      signatures
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  uploadReferenceSignature,
  verifySignature,
  getUserReferenceSignatures
};