import React, { useState, useEffect } from "react";
import authService from "./services/authService";
import "./History.css";

const History = ({ setActivePage }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await authService.getVerificationHistory();
        console.log("Verification History Data:", response);
        setHistory(response.history);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return <div className="history-container loading">Loading history...</div>;
  }

  if (error) {
    return (
      <div className="history-container error">
        <p>Error: {error}</p>
        <button 
          className="retry-button" 
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="history-container">
      <h2 className="history-title">Signature Verification History</h2>
      
      {history.length === 0 ? (
        <div className="no-history">
          <p>No verification history found. Verify a signature to see history.</p>
          <button 
            className="verify-button" 
            onClick={() => setActivePage("home")}
          >
            Go to Verification
          </button>
        </div>
      ) : (
        <div className="history-list">
          {history.map((item) => (
            <div key={item.id} className="history-item">
              <div className="history-item-header">
                <div className="history-item-info">
                  <h3>Signature Verification</h3>
                  <p className="history-date">
                    {new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString()}
                  </p>
                </div>
                <div className={`verification-status ${item.isAuthentic ? 'authentic' : 'not-authentic'}`}>
                  {item.isAuthentic ? 'Authentic' : 'Not Authentic'}
                </div>
              </div>
              
              <div className="history-content">
                <div className="signature-image">
                  <h4>Verified Signature</h4>
                  {item.signatureImage ? (
     <img 
     src={`http://localhost:4000/uploads/${item.signatureImage.replace(/^data:image\/\w+;base64,/, '')}`} 
     alt="Verified signature"
     onError={(e) => e.target.style.display = 'none'} // Hide broken images
   />
   
    

  
) : (
  <p>No signature image available</p>
)}

                </div>
                
                <div className="verification-details">
                  <div className="similarity-score">
                    <h4>Similarity Score</h4>
                    <div className="score-display">
                      <div 
                        className="score-bar"
                        style={{ width: `${item.similarityScore * 100}%` }}
                      ></div>
                      <span className="score-value">{(item.similarityScore * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  
                  <div className="verification-time">
                    <h4>Result Details</h4>
                    <p>Verification ID: #{item.id.substring(0, 8)}</p>
                    <p>Status: {item.isAuthentic ? 'Signature Matches' : 'Signature Does Not Match'}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;