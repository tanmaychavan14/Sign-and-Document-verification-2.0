// backend/database/operations/signatureOperations.js
const Signature = require('../models/Signature');
const User = require('../models/User');

// Create a new signature
const createSignature = async (signatureData) => {
  try {
    const signature = new Signature(signatureData);
    await signature.save();
    
    // If this is a reference signature, add it to the user's references
    if (signatureData.isReference) {
      await User.findByIdAndUpdate(
        signatureData.owner,
        { $push: { signatureReferences: signature._id } }
      );
    }
    
    return signature;
  } catch (error) {
    throw new Error(`Error creating signature: ${error.message}`);
  }
};

// Get user's signatures
const getUserSignatures = async (userId, isReference = true) => {
  try {
    return await Signature.find({ 
      owner: userId,
      isReference
    });
  } catch (error) {
    throw new Error(`Error finding signatures: ${error.message}`);
  }
};

// Get a signature by ID
const getSignatureById = async (signatureId) => {
  try {
    return await Signature.findById(signatureId);
  } catch (error) {
    throw new Error(`Error finding signature: ${error.message}`);
  }
};

// Delete a signature
const deleteSignature = async (signatureId, userId) => {
  try {
    const signature = await Signature.findOne({
      _id: signatureId,
      owner: userId
    });
    
    if (!signature) {
      throw new Error('Signature not found or not authorized');
    }
    
    // If it's a reference signature, remove from user's references too
    if (signature.isReference) {
      await User.findByIdAndUpdate(
        userId,
        { $pull: { signatureReferences: signatureId } }
      );
    }
    
    await Signature.findByIdAndDelete(signatureId);
    return { success: true };
  } catch (error) {
    throw new Error(`Error deleting signature: ${error.message}`);
  }
};

module.exports = {
  createSignature,
  getUserSignatures,
  getSignatureById,
  deleteSignature
};