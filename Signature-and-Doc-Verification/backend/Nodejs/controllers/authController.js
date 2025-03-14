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
        password
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
      console.log(error)
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
      res.status(200).json({
        success: true,
        user: req.user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };
  
  module.exports = {
    register,
    login,
    getUserProfile
  };