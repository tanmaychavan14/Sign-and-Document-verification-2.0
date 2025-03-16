import React, { useState, useEffect } from 'react';
import authService from './services/authService';
import './History.css'; // Reuse the same styles as the signature history

function DocumentHistory() {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDocumentHistory = async () => {
      try {
        setIsLoading(true);
        const response = await authService.getDocumentVerificationHistory();
        setHistory(response.history || []);
        setIsLoading(false);
      } catch (err) {
        setError('Failed to load document verification history');
        setIsLoading(false);
        console.error(err);
      }
    };

    fetchDocumentHistory();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (isLoading) {
    return (
      <div className="history-container">
        <h2>Document Verification History</h2>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="history-container">
        <h2>Document Verification History</h2>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="history-container">
      <h2>Document Verification History</h2>
      
      {history.length === 0 ? (
        <div className="no-history">
          <p>No document verification history available.</p>
        </div>
      ) : (
        <div className="history-table-container">
          <table className="history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Document Type</th>
                <th>Result</th>
                <th>Confidence</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item, index) => (
                <tr key={index} className={item.result === "Genuine" ? "success-row" : "failure-row"}>
                  <td>{formatDate(item.timestamp)}</td>
                  <td>{item.documentType || "Unknown"}</td>
                  <td>{item.result === "Genuine" ? "Verified" : "Failed"}</td>
                  <td>{item.confidenceScore ? `${(item.confidenceScore * 100).toFixed(2)}%` : "N/A"}</td>
                  <td>
                    <button className="view-details-btn">View Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default DocumentHistory;