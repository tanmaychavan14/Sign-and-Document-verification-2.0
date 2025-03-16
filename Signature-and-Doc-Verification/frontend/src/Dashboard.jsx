import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Login from './Login';
import History from './History';
import DocumentHistory from './DocumentHistory';
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
  const [activePage, setActivePage] = useState("home");
  
  // Document verification states
  const [verificationDocument, setVerificationDocument] = useState(null);
  const [documentPreview, setDocumentPreview] = useState(null);
  const [documentResult, setDocumentResult] = useState(null);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [hasReferenceDocument, setHasReferenceDocument] = useState(false);
  const [activeTab, setActiveTab] = useState("signature"); // "signature" or "document"

  // Check if user is already logged in on component mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      const isAuth = authService.isAuthenticated();
      if (isAuth) {
        setIsLoggedIn(true);
        const user = await authService.getCurrentUser();
        setUserData(user);
        
        // Check signatures
        try {
          const signaturesData = await authService.getUserSignatures();
          setHasReferenceSignature(
            signaturesData?.signatures && signaturesData.signatures.length > 0
          );
        } catch (error) {
          console.error("Error fetching signatures:", error);
          setHasReferenceSignature(false);
        }
        
        // Check documents
        try {
          const documentsData = await authService.getUserDocuments();
          setHasReferenceDocument(
            documentsData?.documents && documentsData.documents.length > 0
          );
        } catch (error) {
          console.error("Error fetching documents:", error);
          setHasReferenceDocument(false);
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
  
  const handleVerificationDocumentChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVerificationDocument(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setDocumentPreview(event.target.result);
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
  
  const verifyDocuments = async () => {
    // Check if user is logged in
    if (!isLoggedIn) {
      // If not logged in, show login modal
      setShowLogin(true);
      return;
    }
    
    if (!hasReferenceDocument) {
      alert("Please upload a reference document first from your profile menu!");
      return;
    }
    
    // Continue with verification if logged in
    setDocumentLoading(true);
    
    try {
      const result = await authService.verifyDocument(verificationDocument);
      console.log(result);
      
      setDocumentResult({
        match: result.result.isMatch,
        confidence: result.result.matchScore * 100,
        extractedText: result.result.extractedText || "No text extracted",
        documentType: result.result.documentType || "Unknown"
      });
    } catch (error) {
      console.error("Document verification error:", error);
      alert(`Document verification failed: ${error.message || "Unknown error"}`);
    } finally {
      setDocumentLoading(false);
    }
  };

  const resetSignatureForm = () => {
    setVerificationSignature(null);
    setVerificationPreview(null);
    setVerificationResult(null);
  };
  
  const resetDocumentForm = () => {
    setVerificationDocument(null);
    setDocumentPreview(null);
    setDocumentResult(null);
  };

  const handleLoginSuccess = async (userData) => {
    setIsLoggedIn(true);
    setShowLogin(false);
    setUserData(userData);
  
    try {
      // Fetch reference signature(s) after login
      const signaturesData = await authService.getUserSignatures();
      setHasReferenceSignature(
        signaturesData?.signatures && signaturesData.signatures.length > 0
      );
      
      // Fetch reference document(s) after login
      const documentsData = await authService.getUserDocuments();
      setHasReferenceDocument(
        documentsData?.documents && documentsData.documents.length > 0
      );
    } catch (error) {
      console.error("Error fetching user data:", error);
      setHasReferenceSignature(false);
      setHasReferenceDocument(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    setIsLoggedIn(false);
    setUserData(null);
    setHasReferenceSignature(false);
    setHasReferenceDocument(false);
  };

  const renderVerificationTabs = () => {
    return (
      <div className="verification-tabs">
        <button 
          className={`tab-button ${activeTab === 'signature' ? 'active' : ''}`}
          onClick={() => setActiveTab('signature')}
        >
          Signature Verification
        </button>
        <button 
          className={`tab-button ${activeTab === 'document' ? 'active' : ''}`}
          onClick={() => setActiveTab('document')}
        >
          Document Verification
        </button>
      </div>
    );
  };

  const renderSignatureVerification = () => {
    return (
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
            
            <button onClick={resetSignatureForm} className="reset-button">
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
    );
  };
  
  const renderDocumentVerification = () => {
    return (
      <div className="dashboard-content">
        {/* Left section for document upload */}
        <div className="upload-panel">
          <h2>Document Verification</h2>
          
          <div className="document-upload-container">
            <div className="verification-upload">
              <h3>Verification Document</h3>
              <div 
                className="dropzone"
                style={{
                  backgroundImage: documentPreview ? `url(${documentPreview})` : 'none',
                  backgroundSize: 'contain',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              >
                {!documentPreview && <p>Upload document to verify</p>}
                <input 
                  type="file" 
                  accept="image/*,.pdf" 
                  onChange={handleVerificationDocumentChange} 
                  className="file-input"
                />
              </div>
            </div>
          </div>
          
          <div className="verification-controls">
            <button  
              onClick={verifyDocuments} 
              disabled={!verificationDocument}
              className="verify-button"
            >
              {documentLoading ? 'Analyzing...' : 'Verify Document'}
            </button>
            
            <button onClick={resetDocumentForm} className="reset-button">
              Reset
            </button>
          </div>
        </div>
        
        {/* Right section for results */}
        <div className="results-panel">
          <h2>Verification Results</h2>
          
          {documentLoading ? (
            <div className="loading-state">
              <p>Analyzing document...</p>
              <div className="loading-spinner"></div>
            </div>
          ) : documentResult ? (
            <div className={`result-content ${documentResult.match ? 'match' : 'no-match'}`}>
              <div className="result-icon">
                {documentResult.match ? '✓' : '✗'}
              </div>
              <h3 className="result-heading">
                {documentResult.match 
                  ? 'Document Verified!' 
                  : 'Document Verification Failed!'}
              </h3>
              <p className="confidence">
                Confidence: {documentResult.confidence.toFixed(2)}%
              </p>
              <div className="document-details">
                <h4>Document Details:</h4>
                <p><strong>Type:</strong> {documentResult.documentType}</p>
                <div className="extracted-text">
                  <h4>Extracted Text:</h4>
                  <div className="text-content">
                    {documentResult.extractedText || "No text could be extracted"}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-result">
              <p>Upload a document and click "Verify Document" to see results.</p>
              {!hasReferenceDocument && isLoggedIn && (
                <p className="warning">
                  You need to upload a reference document in your profile before verification.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (activePage === "history") {
      return <History />;
    }
    
    if (activePage === "documentHistory") {
      return <DocumentHistory />;
    }

    return (
      <>
        {renderVerificationTabs()}
        {activeTab === 'signature' ? renderSignatureVerification() : renderDocumentVerification()}
      </>
    );
  };

  return (
    <div className="dashboard-container">
      <div className={showLogin ? 'blur-background' : ''}>
        <Navbar 
          isLoggedIn={isLoggedIn} 
          setIsLoggedIn={setIsLoggedIn} 
          setShowLogin={setShowLogin}
          setActivePage={setActivePage}
        />
        
        {renderContent()}
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