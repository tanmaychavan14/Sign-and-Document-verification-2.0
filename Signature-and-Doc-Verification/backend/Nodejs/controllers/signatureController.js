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
    
    // Update user model to link this signature reference
    await require('../database/operations/userOperations').addSignatureReference(
      req.user._id,
      signature._id
    );
    
    res.status(201).json({
      success: true,
      signature
    });
  } catch (error) {
    console.error('Error uploading reference signature:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
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
    
    // Ensure reference signature file exists
    if (!fs.existsSync(referenceSignature.path)) {
      return res.status(400).json({
        success: false,
        message: 'Reference signature file not found'
      });
    }
    
    // Create FormData for FastAPI
    const form = new FormData();
    form.append('original_signature', fs.createReadStream(referenceSignature.path));
    form.append('verification_signature', fs.createReadStream(req.files.verification_signature[0].path));
    
    console.log('Sending signature verification request to FastAPI service...');
    console.log('Reference signature path:', referenceSignature.path);
    console.log('Verification signature path:', req.files.verification_signature[0].path);
    
    // Send request to FastAPI
    const response = await axios.post(
      'http://127.0.0.1:8000/verify-signature/',
      form,
      { headers: form.getHeaders() }
    );
    
    console.log('Response from FastAPI:', response.data);

    // Extract similarity score (log it to check if it's coming from FastAPI)
    const similarityScore = response.data.similarity_score || 
      (response.data.result === "Genuine" ? 0.85 : 0.15);

    console.log(`Calculated Similarity Score: ${similarityScore}`);

    // Add to verification history
    await addVerificationToHistory(req.user._id, {
      originalSignature: referenceSignature.filename,
      verificationSignature: req.files.verification_signature[0].filename,
      similarityScore: similarityScore,
      isMatch: response.data.result === "Genuine"
    });

    console.log('Added verification result to history.');

    res.status(200).json({
      success: true,
      result: {
        match: response.data.result,
        similarity_score: similarityScore
      }
    });
  } catch (error) {
    console.error('Error verifying signature:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
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
      message: error.message || 'Server error'
    });
  }
};

module.exports = {
  uploadReferenceSignature,
  verifySignature,
  getUserReferenceSignatures
};