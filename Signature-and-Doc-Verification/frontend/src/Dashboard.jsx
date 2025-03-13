import { useState } from 'react';
import Navbar from './Navbar';
import Login from './Login';
import './Dashboard.css';

function Dashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [verificationSignature, setVerificationSignature] = useState(null);
  const [verificationPreview, setVerificationPreview] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const verifySignatures = () => {
    // Check if user is logged in
    if (!isLoggedIn) {
      // If not logged in, show login modal
      setShowLogin(true);
      return;
    }
    
    // Continue with verification if logged in
    setIsLoading(true);
    
    // Simulating API call with setTimeout
    setTimeout(() => {
      // For demo purposes, we'll generate a random result
      // In a real app, this would come from your backend
      const randomMatch = Math.random() > 0.5;
      const confidence = (Math.random() * 50 + 50).toFixed(2); // 50-100%
      
      setVerificationResult({
        match: randomMatch,
        confidence: confidence
      });
      
      setIsLoading(false);
    }, 2000);
  };

  const resetForm = () => {
    setVerificationSignature(null);
    setVerificationPreview(null);
    setVerificationResult(null);
  };

  const handleLoginSuccess = (userData) => {
    setIsLoggedIn(true);
    setShowLogin(false);
  };

  return (
    <div className="dashboard-container">
      <div className={showLogin ? 'blur-background' : ''}>
        <Navbar 
          isLoggedIn={isLoggedIn} 
          setIsLoggedIn={setIsLoggedIn} 
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
                  Confidence: {verificationResult.confidence}%
                </p>
                {verificationResult.match ? (
                  <p className="result-description">
                    The provided signatures appear to be from the same person.
                  </p>
                ) : (
                  <p className="result-description">
                    The provided signatures do not appear to match.
                  </p>
                )}
              </div>
            ) : (
              <div className="no-result">
                <p>Upload a signature and click "Verify Signatures" to see results.</p>
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