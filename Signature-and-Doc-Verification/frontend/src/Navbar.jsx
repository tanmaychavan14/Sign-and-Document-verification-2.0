import React, { useState } from "react";
import "./Navbar.css";
import profilePic from "./assets/demo.jpg";

const Navbar = ({ isLoggedIn, setIsLoggedIn, setShowLogin }) => {
  const [isOpen, setIsOpen] = useState(false); // State to toggle dropdown
  
  const user = {
    name: "Tanmay Chavan",
    profilePic: profilePic || "https://via.placeholder.com/40"
  };
  
  const handleLoginClick = () => {
    setShowLogin(true);
  };
  
  return (
    <nav className="Nav-Bar">
      <h1 className="trip-logo">Do check ✓</h1>
      <ul className="Nav-Menu">
        <li><i className="fa-solid fa-house"></i> Home</li>
        <li><i className="fa-solid fa-address-card"></i> About Us</li>
        <li><i className="fa-solid fa-address-book"></i> Contact Us</li>
        
        {/* Profile Section - Shows conditionally based on login status */}
        {!isLoggedIn ? (
          <li className="login-container">
            <button className="login-button" onClick={handleLoginClick}>Login</button>
          </li>
        ) : (
          <li className="profile-container">
            <div className="profile" onClick={() => setIsOpen(!isOpen)}>
              <img
                src={user.profilePic}
                className="logoo"
                alt="Profile"
              />
            </div>
            
            {/* Dropdown Menu */}
            {isOpen && (
              <div className="dropdown-menu">
                <p className="profile-name">{user.name}</p>
                <button className="dropdown-item">Update Profile</button>
                <hr />
                <button className="dropdown-item">Upload Original Signature</button>
                <hr />
                <button className="dropdown-item">Upload Document</button>
                <hr />
                <button className="dropdown-item">History</button>
                <hr />
                <button className="logout" onClick={() => setIsLoggedIn(false)}>Logout</button>
              </div>
            )}
          </li>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;