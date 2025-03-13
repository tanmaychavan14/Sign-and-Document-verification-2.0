import React, { useState } from "react";
import "./Login.css";
import authService from "./services/authService";

const Login = ({ onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset error and success messages
    setError("");
    setSuccessMessage("");
    setIsLoading(true);
    
    try {
      if (isSignUp) {
        // Sign Up validation
        if (!name || !email || !password || !confirmPassword) {
          setError("Please fill in all fields");
          setIsLoading(false);
          return;
        }
        
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          setIsLoading(false);
          return;
        }
        
        if (password.length < 6) {
          setError("Password must be at least 6 characters");
          setIsLoading(false);
          return;
        }
        
        // Call register API
        await authService.register(name, email, password);
        setSuccessMessage("Account created successfully! Please log in.");
        setIsSignUp(false);
        setPassword("");
        setConfirmPassword("");
        // Keep the email for convenience
      } else {
        // Login validation
        if (!email || !password) {
          setError("Please fill in all fields");
          setIsLoading(false);
          return;
        }
        
        // Call login API
        const userData = await authService.login(email, password);
        
        // If successful, call the onLoginSuccess callback with the user data
        if (userData) {
          onLoginSuccess(userData);
        }
      }
    } catch (err) {
      setError(err.message || "Authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError("");
    setSuccessMessage("");
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setError("");
    
    if (!email) {
      setError("Please enter your email address to reset password");
      return;
    }
    
    // In a real app, this would call an API to send a password reset email
    setSuccessMessage(`Password reset link has been sent to ${email}`);
  };

  return (
    <div className="login-modal">
      <div className="login-header">
        <h2>{isSignUp ? "Create an Account" : "Login to Your Account"}</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <form onSubmit={handleSubmit} className="login-form">
        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}
        
        {isSignUp && (
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
            />
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
          />
        </div>
        
        {isSignUp && (
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
            />
          </div>
        )}
        
        <div className="form-actions">
          <button type="submit" className="login-submit" disabled={isLoading}>
            {isLoading ? "Processing..." : isSignUp ? "Sign Up" : "Login"}
          </button>
        </div>
        
        <div className="form-footer">
          {isSignUp ? (
            <p>Already have an account? <a href="#" onClick={toggleMode}>Login</a></p>
          ) : (
            <p>Don't have an account? <a href="#" onClick={toggleMode}>Sign up</a></p>
          )}
          {!isSignUp && <p><a href="#" onClick={handleForgotPassword}>Forgot password?</a></p>}
        </div>
      </form>
    </div>
  );
};

export default Login;