// backend/controllers/documentController.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const {
  getUserById,
  addDocumentReference,
  addDocumentVerificationToHistory,
  getUserDocumentHistory,
} = require('../database/operations/userOperations');
const Document = require('../database/models/document');

// Upload reference document
const uploadReferenceDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Document file is required'
      });
    }

    // Create a new document record
    const document = new Document({
      userId: req.user._id,
      filePath: req.file.path,
      fileName: req.file.filename,
      fileType: req.file.mimetype,
      fileSize: req.file.size
    });

    // Save the document
    await document.save();

    // Add document reference to user
    await addDocumentReference(req.user._id, document._id);

    res.status(201).json({
      success: true,
      document: {
        _id: document._id,
        fileName: document.fileName,
        fileType: document.fileType,
        fileSize: document.fileSize,
        createdAt: document.createdAt
      }
    });
  } catch (error) {
    console.error('Error uploading reference document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload reference document'
    });
  }
};

// Verify document against reference
const verifyDocument = async (req, res) => {
  try {
    // Check if both files are provided
    if (!req.files || !req.files.verification_document) {
      return res.status(400).json({
        success: false,
        message: 'Verification document is required'
      });
    }

    // Get user with document references
    const user = await getUserById(req.user._id);
    if (!user || !user.documentReferences || user.documentReferences.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No reference documents found. Please upload a reference document first.'
      });
    }

    // Get the most recent reference document
    const recentDocument = user.documentReferences[user.documentReferences.length - 1];
    const originalDocumentPath = recentDocument.filePath;
    const verificationDocumentPath = req.files.verification_document[0].path;

    // Check if the original document exists
    if (!fs.existsSync(originalDocumentPath)) {
      return res.status(400).json({
        success: false,
        message: 'Original document file not found'
      });
    }

    // Create FormData for FastAPI
    const form = new FormData();
    form.append('original_document', fs.createReadStream(originalDocumentPath));
    form.append('verification_document', fs.createReadStream(verificationDocumentPath));

    // Send to FastAPI for document verification
    const response = await axios.post(
      'http://127.0.0.1:8000/verify-document/',
      form,
      { headers: form.getHeaders() }
    );

    // Process the response
    const result = response.data;

    // Add verification to user's history
    await addDocumentVerificationToHistory(req.user._id, {
      originalDocument: originalDocumentPath,
      verificationDocument: verificationDocumentPath,
      extractedText: result.extracted_text,
      documentType: result.document_type,
      structuredData: result.structured_data,
      matchScore: result.similarity_score,
      isMatch: result.result === 'Genuine'
    });

    res.status(200).json({
      success: true,
      result: {
        isMatch: result.result === 'Genuine',
        matchScore: result.similarity_score,
        documentType: result.document_type,
        extractedText: result.extracted_text,
        structuredData: result.structured_data
      }
    });
  } catch (error) {
    console.error('Error verifying document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify document'
    });
  }
};

// Get user's reference documents
const getUserReferenceDocuments = async (req, res) => {
  try {
    const user = await getUserById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const documents = user.documentReferences;
    res.status(200).json({
      success: true,
      documents: documents.map(doc => ({
        _id: doc._id,
        fileName: doc.fileName,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        createdAt: doc.createdAt
      }))
    });
  } catch (error) {
    console.error('Error getting reference documents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reference documents'
    });
  }
};




module.exports = {
  uploadReferenceDocument,
  verifyDocument,
  getUserReferenceDocuments,
  
};