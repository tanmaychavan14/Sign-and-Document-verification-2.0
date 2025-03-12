import React, { useState } from "react";
import "./Login.css";

const Login = ({ onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Reset error messagea
    setError("");
    
    if (isSignUp) {
      // Sign Up validation
      if (!name || !email || !password || !confirmPassword) {
        setError("Please fill in all fields");
        return;
      }
      
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      
      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
      
      // In a real app, you would register the user with your backend
      // For demo purposes, we'll just switch to login mode with a success message
      setError("Account created successfully! Please log in.");
      setIsSignUp(false);
      setPassword("");
      // Keep the email for convenience
    } else {
      // Login validation
      if (!email || !password) {
        setError("Please fill in all fields");
        return;
      }
      
      // In a real app, you would verify credentials with your backend
      // For demo purposes, we'll just accept any valid-looking email
      if (email.includes('@') && password.length >= 6) {
        onLoginSuccess();
      } else {
        setError("Invalid credentials. Please try again.");
      }
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError("");
  };

  return (
    <div className="login-modal">
      <div className="login-header">
        <h2>{isSignUp ? "Create an Account" : "Login to Your Account"}</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <form onSubmit={handleSubmit} className="login-form">
        {error && <div className="error-message">{error}</div>}
        
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
          <button type="submit" className="login-submit">
            {isSignUp ? "Sign Up" : "Login"}
          </button>
        </div>
        
        <div className="form-footer">
          {isSignUp ? (
            <p>Already have an account? <a href="#" onClick={toggleMode}>Login</a></p>
          ) : (
            <p>Don't have an account? <a href="#" onClick={toggleMode}>Sign up</a></p>
          )}
          {!isSignUp && <p><a href="#">Forgot password?</a></p>}
        </div>
      </form>
    </div>
  );
};

export default Login;