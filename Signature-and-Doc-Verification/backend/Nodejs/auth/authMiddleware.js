// backend/auth/authMiddleware.js
const { verifyToken } = require('./authUtils');
const { findUserById } = require('../database/operations/userOperations');

// Middleware to protect routes
const protect = async (req, res, next) => {
  try {
    let token;
    
    // Get token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token'
      });
    }
    
    // Verify token
    const decoded = verifyToken(token);
    
    // Find user by decoded token ID
    const user = await findUserById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Set user in request object
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Not authorized, token failed'
    });
  }
};

// Middleware to restrict to admin role
const restrictToAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Not authorized as admin'
    });
  }
};

module.exports = {
  protect,
  restrictToAdmin
};