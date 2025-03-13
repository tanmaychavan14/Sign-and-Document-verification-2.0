import React, { useState, useEffect } from "react";
import "./Navbar.css";
import profilePic from "./assets/demo.jpg";
import Login from "./Login"; // Import the Login component
import authService from "./services/authService"; // Import the auth service

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false); // State to toggle dropdown
  const [showLogin, setShowLogin] = useState(false); // State to show/hide login modal
  const [user, setUser] = useState(null); // State to store user data

  // Check if user is already logged in on component mount
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  // Handle login success
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setShowLogin(false);
  };

  // Handle logout
  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setIsOpen(false);
  };

  return (
    <>
      <nav className="Nav-Bar">
        <h1 className="trip-logo">Do check ✓</h1>
        <ul className="Nav-Menu">
          <li><i className="fa-solid fa-house"></i> Home</li>
          <li><i className="fa-solid fa-address-card"></i> About Us</li>
          <li><i className="fa-solid fa-address-book"></i> Contact Us</li>
          
          {/* Profile Section - Show only if logged in */}
          {user ? (
            <li className="profile-container">
              <div className="profile" onClick={() => setIsOpen(!isOpen)}>
                <img
                  src={profilePic || "https://via.placeholder.com/40"}
                  className="logoo"
                  alt="Profile"
                />
              </div>
              
              {/* Dropdown Menu */}
              {isOpen && (
                <div className="dropdown-menu">
                  <p className="profile-name">{user.user.name}</p>
                  <button className="dropdown-item">Update Profile </button>
                  <hr />
                  <button className="dropdown-item">Upload Original Signature</button>
                  <hr />
                  <button className="dropdown-item">Upload Document</button>
                  <hr />
                  <button className="dropdown-item">History</button>
                  <hr />
                  <button className="logout" onClick={handleLogout}>Logout</button>
                </div>
              )}
            </li>
          ) : (
            // Show login button if not logged in
            <li>
              <button 
                className="login-button" 
                onClick={() => setShowLogin(true)}
              >
                <i className="fa-solid fa-sign-in"></i> Login
              </button>
            </li>
          )}
        </ul>
      </nav>

      {/* Login Modal */}
      {showLogin && (
        <Login
          onClose={() => setShowLogin(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </>
  );
};

export default Navbar;