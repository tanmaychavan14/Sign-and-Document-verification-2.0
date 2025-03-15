import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Login from './Login';
import authService from './services/authService';
import './Dashboard.css';

function Dashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [verificationSignature, setVerificationSignature] = useState(null);
  const [verificationPreview, setVerificationPreview] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [hasReferenceSignature, setHasReferenceSignature] = useState(false);

  // Check if user is already logged in on component mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      const isAuth = authService.isAuthenticated();
      if (isAuth) {
        setIsLoggedIn(true);
        const user = await authService.getCurrentUser();
        setUserData(user);
        
        // Instead of checking user.signatureReferences, explicitly fetch signatures
        try {
          const signaturesData = await authService.getUserSignatures();
          setHasReferenceSignature(
            signaturesData?.signatures && signaturesData.signatures.length > 0
          );
        } catch (error) {
          console.error("Error fetching signatures:", error);
          setHasReferenceSignature(false);
        }
      }
    };
    
    checkAuthStatus();
  }, []);

  const handleVerificationSignatureChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVerificationSignature(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setVerificationPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const verifySignatures = async () => {
    // Check if user is logged in
    if (!isLoggedIn) {
      // If not logged in, show login modal
      setShowLogin(true);
      return;
    }
    
    if (!hasReferenceSignature) {
      alert("Please upload a reference signature first from your profile menu!");
      return;
    }
    
    // Continue with verification if logged in
    setIsLoading(true);
    
    try {
      const result = await authService.verifySignature(verificationSignature);
      console.log(result)
      // Updated to match the response structure from the backend
      setVerificationResult({
        match: result.result.match === "Genuine",
        confidence: result.result.similarity_score ? 
          result.result.similarity_score * 100 : // Convert to percentage if available
          result.result.match === "Genuine" ? 85 : 15 // Default confidence if not provided
      });
    } catch (error) {
      console.error("Verification error:", error);
      alert(`Verification failed: ${error.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setVerificationSignature(null);
    setVerificationPreview(null);
    setVerificationResult(null);
  };

  const handleLoginSuccess = async (userData) => {
    setIsLoggedIn(true);
    setShowLogin(false);
    setUserData(userData);
  
    try {
      // Fetch reference signature(s) after login
      const signaturesData = await authService.getUserSignatures(); // Adjust this function as per your API
      setHasReferenceSignature(
        signaturesData?.signatures && signaturesData.signatures.length > 0
      );
    } catch (error) {
      console.error("Error fetching signatures:", error);
      setHasReferenceSignature(false);
    }
  };
  

  const handleLogout = async () => {
    await authService.logout();
    setIsLoggedIn(false);
    setUserData(null);
    setHasReferenceSignature(false);
  };

  return (
    <div className="dashboard-container">
      <div className={showLogin ? 'blur-background' : ''}>
        <Navbar 
          isLoggedIn={isLoggedIn} 
          setIsLoggedIn={handleLogout} 
          setShowLogin={setShowLogin}
        />
        
        <div className="dashboard-content">
          {/* Left section for signature upload */}
          <div className="upload-panel">
            <h2>Signature Verification</h2>
            
            <div className="signature-upload-container">
              <div className="verification-upload">
                <h3>Verification Signature</h3>
                <div 
                  className="dropzone"
                  style={{
                    backgroundImage: verificationPreview ? `url(${verificationPreview})` : 'none',
                    backgroundSize: 'contain',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                  }}
                >
                  {!verificationPreview && <p>Upload signature to verify</p>}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleVerificationSignatureChange} 
                    className="file-input"
                  />
                </div>
              </div>
            </div>
            
            <div className="verification-controls">
              <button  
                onClick={verifySignatures} 
                disabled={!verificationSignature}
                className="verify-button"
              >
                {isLoading ? 'Analyzing...' : 'Verify Signatures'}
              </button>
              
              <button onClick={resetForm} className="reset-button">
                Reset
              </button>
            </div>
          </div>
          
          {/* Right section for results */}
          <div className="results-panel">
            <h2>Verification Results</h2>
            
            {isLoading ? (
              <div className="loading-state">
                <p>Analyzing signatures...</p>
                <div className="loading-spinner"></div>
              </div>
            ) : verificationResult ? (
              <div className={`result-content ${verificationResult.match ? 'match' : 'no-match'}`}>
                <div className="result-icon">
                  {verificationResult.match ? '✓' : '✗'}
                </div>
                <h3 className="result-heading">
                  {verificationResult.match 
                    ? 'Signatures Match!' 
                    : 'Signatures Do Not Match!'}
                </h3>
                <p className="confidence">
                  Confidence: {verificationResult.confidence.toFixed(2)}%
                </p>
                {verificationResult.match ? (
                  <p className="result-description">
                    The provided signature appears to match your reference signature.
                  </p>
                ) : (
                  <p className="result-description">
                    The provided signature does not appear to match your reference signature.
                  </p>
                )}
              </div>
            ) : (
              <div className="no-result">
                <p>Upload a signature and click "Verify Signatures" to see results.</p>
                {!hasReferenceSignature && isLoggedIn && (
                  <p className="warning">
                    You need to upload a reference signature in your profile before verification.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Login Modal */}
      {showLogin && (
        <div className="login-overlay">
          <Login 
            onClose={() => setShowLogin(false)} 
            onLoginSuccess={handleLoginSuccess} 
          />
        </div>
      )}
    </div>
  );
}

export default Dashboard;