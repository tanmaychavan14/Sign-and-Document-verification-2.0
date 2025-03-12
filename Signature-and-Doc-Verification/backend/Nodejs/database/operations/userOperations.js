// backend/database/operations/userOperations.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Create a new user
const createUser = async (userData) => {
  try {
    const user = new User(userData);
    await user.save();
    return user;
  } catch (error) {
    throw new Error(`Error creating user: ${error.message}`);
  }
};

// Find user by ID
const findUserById = async (userId) => {
  try {
    return await User.findById(userId).select('-password');
  } catch (error) {
    throw new Error(`Error finding user: ${error.message}`);
  }
};

// Find user by email
const findUserByEmail = async (email) => {
  try {
    return await User.findOne({ email }).select('+password');
  } catch (error) {
    throw new Error(`Error finding user: ${error.message}`);
  }
};

// Update user
const updateUser = async (userId, updates) => {
  try {
    // Don't allow password updates through this function
    if (updates.password) delete updates.password;
    
    return await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    );
  } catch (error) {
    throw new Error(`Error updating user: ${error.message}`);
  }
};

// Update password
const updatePassword = async (userId, newPassword) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    return await User.findByIdAndUpdate(
      userId,
      { $set: { password: hashedPassword } },
      { new: true }
    );
  } catch (error) {
    throw new Error(`Error updating password: ${error.message}`);
  }
};

// Add verification to history
const addVerificationToHistory = async (userId, verificationData) => {
  try {
    return await User.findByIdAndUpdate(
      userId,
      { $push: { verificationHistory: verificationData } },
      { new: true }
    );
  } catch (error) {
    throw new Error(`Error adding verification: ${error.message}`);
  }
};

// Compare password
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

module.exports = {
  createUser,
  findUserById,
  findUserByEmail,
  updateUser,
  updatePassword,
  addVerificationToHistory,
  comparePassword
};