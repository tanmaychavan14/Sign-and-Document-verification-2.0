import React, { useState, useEffect } from "react";
import "./Navbar.css";
import authService from "./services/authService";
import defaultProfileImage from "./assets/demo.jpg"; // Import a default profile image

const Navbar = ({ isLoggedIn, setIsLoggedIn, setShowLogin }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [profileImage, setProfileImage] = useState(null);

  // Fetch user data when logged in
  useEffect(() => {
    const fetchUserData = async () => {
      if (isLoggedIn) {
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
          
          // Check if user has profile picture
          if (userData && userData.profilePicture) {
            // If it's already a base64 string
            if (typeof userData.profilePicture === 'string') {
              setProfileImage(`data:image/jpeg;base64,${userData.profilePicture}`);
            } else {
              setProfileImage(defaultProfileImage);
            }
          } else {
            setProfileImage(defaultProfileImage);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setProfileImage(defaultProfileImage);
        }
      }
    };
    
    fetchUserData();
  }, [isLoggedIn]);

  const handleLoginClick = () => {
    setShowLogin(true);
  };

  const handleLogout = async () => {
    const response = await authService.logout();
    if (response.success) {
      setIsLoggedIn(false);
      setIsOpen(false);
      setUser(null);
    } else {
      console.error("Logout failed:", response.message);
    }
  };

  const handleUploadOriginalSignature = () => {
    // Create a hidden file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    
    // Handle file selection
    fileInput.onchange = async (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        try {
          await authService.uploadReferenceSignature(file);
          alert("Reference signature uploaded successfully!");
        } catch (error) {
          alert(`Failed to upload signature: ${error.message}`);
        }
      }
      document.body.removeChild(fileInput);
    };
    
    // Trigger file selection dialog
    fileInput.click();
  };

  return (
    <nav className="Nav-Bar">
      <h1 className="trip-logo">Do check ✓</h1>
      <ul className="Nav-Menu">
        <li><i className="fa-solid fa-house"></i> Home</li>
        <li><i className="fa-solid fa-address-card"></i> About Us</li>
        <li><i className="fa-solid fa-address-book"></i> Contact Us</li>
        
        {!isLoggedIn ? (
          <li className="login-container">
            <button className="login-button" onClick={handleLoginClick}>Login</button>
          </li>
        ) : (
          <li className="profile-container">
            <div className="profile" onClick={() => setIsOpen(!isOpen)}>
              <img
                src={profileImage}
                className="logoo"
                alt="Profile"
              />
            </div>
            {isOpen && (
              <div className="dropdown-menu">
                <p className="profile-name">{user?.username || "User"}</p>
                <button className="dropdown-item">Update Profile</button>
                <hr />
                <button className="dropdown-item" onClick={handleUploadOriginalSignature}>
                  Upload Original Signature
                </button>
                <hr />
                <button className="dropdown-item">Upload Document</button>
                <hr />
                <button className="dropdown-item">History</button>
                <hr />
                <button className="logout" onClick={handleLogout}>Logout</button>
              </div>
            )}
          </li>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;