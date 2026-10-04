import React, { useEffect, useState } from 'react';
import { useUI } from '../../../context/UIContext';

const ResultModal = ({ isOpen, onClose, testType }) => {
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showFlash } = useUI();

  useEffect(() => {
    if (isOpen && testType) {
      fetchResultDetails();
    }
  }, [isOpen, testType]);

  const fetchResultDetails = async () => {
    setLoading(true);
    const token = localStorage.getItem('studentToken');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/student/result-details/${testType}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setResultData(data);
      } else {
        showFlash(data.message || "Failed to fetch results", "error");
        onClose();
      }
    } catch (error) {
      showFlash("Server error fetching results", "error");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px', backdropFilter: 'blur(4px)' }}>
      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', animation: 'slideInUp 0.3s ease-out' }}>
        
        {loading || !resultData ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div className="loader" style={{ margin: '0 auto', border: '4px solid #f3f3f3', borderTop: '4px solid #2563eb', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: '20px', color: '#64748b' }}>Loading Official Result Sheet...</p>
          </div>
        ) : (
          <div id="print-result-section" style={{ padding: '30px' }}>
            {/* Header Section for Print */}
            <div style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '20px', marginBottom: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '1.8rem' }}>Official Result Sheet</h2>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '1.1rem' }}>{resultData.testDetails.testType} Examination</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <button className="no-print" onClick={() => window.print()} style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginRight: '10px' }}>🖨️ Print / Save PDF</button>
                  <button className="no-print" onClick={onClose} style={{ backgroundColor: '#e2e8f0', color: '#475569', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Close</button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '20px', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div><strong>Student Name:</strong> {resultData.studentDetails.name}</div>
                <div><strong>Roll Number:</strong> {resultData.studentDetails.rollNo}</div>
                <div><strong>Department:</strong> {resultData.studentDetails.department}</div>
                <div><strong>Test Date:</strong> {new Date(resultData.testDetails.submittedAt).toLocaleString()}</div>
                <div style={{ gridColumn: '1 / -1', fontSize: '1.2rem', marginTop: '10px', color: '#1e3a8a' }}>
                  <strong>Final Score: </strong> <span style={{ color: resultData.testDetails.score > (resultData.testDetails.total/2) ? '#16a34a' : '#dc2626' }}>{resultData.testDetails.score} / {resultData.testDetails.total}</span>
                </div>
              </div>
            </div>

            {/* Questions Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                  <th style={{ padding: '12px', color: '#334155' }}>Q.No</th>
                  <th style={{ padding: '12px', color: '#334155', width: '40%' }}>Question</th>
                  <th style={{ padding: '12px', color: '#334155' }}>Your Answer</th>
                  <th style={{ padding: '12px', color: '#334155' }}>Correct Answer</th>
                  <th style={{ padding: '12px', color: '#334155', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {resultData.resultDetails.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#64748b' }}>{item.questionNo}</td>
                    <td style={{ padding: '12px', color: '#1e293b' }}>{item.questionText}</td>
                    <td style={{ padding: '12px', color: item.isCorrect ? '#16a34a' : '#dc2626', fontWeight: '500' }}>{item.studentAnswer}</td>
                    <td style={{ padding: '12px', color: '#16a34a', fontWeight: '500' }}>{item.correctAnswer}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {item.isCorrect ? (
                        <span style={{ display: 'inline-block', backgroundColor: '#dcfce7', color: '#16a34a', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>✔ Correct</span>
                      ) : (
                        <span style={{ display: 'inline-block', backgroundColor: '#fee2e2', color: '#dc2626', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>✘ Wrong</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* CSS for printing */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body * { visibility: hidden; }
            #print-result-section, #print-result-section * { visibility: visible; }
            #print-result-section { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; }
            .no-print { display: none !important; }
            table { border: 1px solid #cbd5e1; }
            th, td { border: 1px solid #cbd5e1; }
          }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}} />
      </div>
    </div>
  );
};

export default ResultModal;
