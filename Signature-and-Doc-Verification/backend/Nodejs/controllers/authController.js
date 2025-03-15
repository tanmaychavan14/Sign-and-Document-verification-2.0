// backend/controllers/authController.js
const { 
    createUser, 
    findUserByEmail, 
    comparePassword, 
    updateUser 
  } = require('../database/operations/userOperations');
  const { generateToken } = require('../auth/authUtils');

  
  // Register user
  const register = async (req, res) => {
    try {
      const { username, email, password } = req.body;
      const { profilePicture, originalSignature } = req.files; // Assuming you upload them as files
      
      // Check if user exists
      const existingUser = await findUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists'
        });
      }
  
      // Create new user
      const user = await createUser({
        username,
        email,
        password,
        profilePicture: profilePicture ? profilePicture.data : null, // Store profile picture as binary data
        originalSignature: originalSignature ? originalSignature.data : null // Store original signature as binary data
      });
  
      // Generate token
      const token = generateToken(user._id);
  
      // Update last login
      await updateUser(user._id, { lastLogin: new Date() });
  
      res.status(201).json({
        success: true,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        token
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };
  // Login user
  const login = async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Check if user exists
      const user = await findUserByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
      
      // Check if password matches
      const isMatch = await comparePassword(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
      
      // Generate token
      const token = generateToken(user._id);
      
      // Update last login
      await updateUser(user._id, { lastLogin: new Date() });
      
      res.status(200).json({
        success: true,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        token
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };
  
  // Get user profile
  const getUserProfile = async (req, res) => {
    try {
      const user = await findUserByEmail(req.user.email);
      
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
  
      // Return user profile with image data
      res.status(200).json({
        success: true,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          profilePicture: user.profilePicture.toString('base64'), // Convert binary data to base64
          originalSignature: user.originalSignature.toString('base64') // Convert binary data to base64
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };
  const logout = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            message: "User logged out successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const getVerificationHistory = async (req, res) => {
  try {
    const email = req.user.email;
    
    // Get user with verification history
    const user = await findUserByEmail(email);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // If no history, return empty array
    if (!user.verificationHistory || user.verificationHistory.length === 0) {
      return res.status(200).json({
        success: true,
        history: [],
        message: 'No verification history found'
      });
    }
    
    // Format the history data
    const formattedHistory = user.verificationHistory.map(entry => ({
      id: entry._id,
      date: entry.verifiedAt,
      signatureImage: entry.verificationSignature 
          ? `data:image/png;base64,${entry.verificationSignature}`  // Ensure it's Base64
          : null,
      similarityScore: entry.similarityScore,
      isAuthentic: entry.isMatch,
      status: entry.isMatch ? 'Authentic' : 'Not Authentic'
    }));
    
    
    res.status(200).json({
      success: true,
      history: formattedHistory
    });
  } catch (error) {
    console.error('Error getting verification history:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve verification history'
    });
  }
};


// Ensure logout is exported
module.exports = {
    register,
    login,
    getUserProfile,
    logout,
    getVerificationHistory,
     // ✅ Make sure this is included
};
