import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUI } from '../context/UIContext';

const StudentLogin = () => {
  const navigate = useNavigate();
  const { showFlash, showLoader, hideLoader } = useUI();
  
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  
  const [credentials, setCredentials] = useState({ vac_rollNo: '', password: '' });
  const [verifyData, setVerifyData] = useState({ vac_rollNo: '', category: '', dob: '' });
  const [newPassword, setNewPassword] = useState('');

  const handleChange = (e) => {
    let value = e.target.value;
    if (e.target.name === 'vac_rollNo') {
      value = value.toUpperCase();
    }
    setCredentials({...credentials, [e.target.name]: value});
  };
  
  const handleVerifyChange = (e) => {
    let value = e.target.value;
    if (e.target.name === 'vac_rollNo') {
      value = value.toUpperCase();
    }
    setVerifyData({...verifyData, [e.target.name]: value});
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    showLoader();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/student/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      const data = await response.json();
      hideLoader();
      
      if (response.ok) {
        localStorage.setItem('studentToken', data.token);
        localStorage.setItem('studentData', JSON.stringify(data.student));
        showFlash("Logged in successfully!", "success");
        navigate('/student/dashboard');
      } else {
        showFlash(data.message || "Login failed", "error");
      }
    } catch (error) {
      hideLoader();
      showFlash("Server error during login.", "error");
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    showLoader();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/student/verify-forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(verifyData)
      });
      const data = await response.json();
      hideLoader();
      
      if (response.ok) {
        showFlash("Verification successful! You can now reset your password.", "success");
        setIsResetMode(true);
      } else {
        showFlash(data.message || "Verification failed.", "error");
      }
    } catch (error) {
      hideLoader();
      showFlash("Server error during verification.", "error");
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      return showFlash("Password must be at least 6 characters long.", "warning");
    }
    showLoader();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/student/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vac_rollNo: verifyData.vac_rollNo, newPassword })
      });
      const data = await response.json();
      hideLoader();
      
      if (response.ok) {
        showFlash("Password reset successfully! Please login.", "success");
        setIsForgotMode(false);
        setIsResetMode(false);
        setNewPassword('');
      } else {
        showFlash(data.message || "Failed to reset password.", "error");
      }
    } catch (error) {
      hideLoader();
      showFlash("Server error during reset.", "error");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg"></div>
      <div className="auth-card student-card">
        <div className="auth-header">
          <div className="auth-icon">🎓</div>
          <h2 className="auth-title">
            {!isForgotMode ? "Student Login" : (isResetMode ? "Set New Password" : "Verify Identity")}
          </h2>
          <p className="auth-subtitle">Assam University VAC Portal</p>
        </div>
        
        {!isForgotMode ? (
          // NORMAL LOGIN FORM
          <>
            <form onSubmit={handleLoginSubmit} className="auth-form">
              <div className="form-group">
                <label>VAC Roll Number</label>
                <input type="text" name="vac_rollNo" placeholder="VAC/26/001" required onChange={handleChange} value={credentials.vac_rollNo}/>
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" name="password" placeholder="Enter your password" required onChange={handleChange} value={credentials.password}/>
                <div style={{ textAlign: 'right', marginTop: '5px' }}>
                  <button type="button" className="btn-link" onClick={() => setIsForgotMode(true)} style={{ fontSize: '0.85rem' }}>
                    Forgot Password?
                  </button>
                </div>
              </div>
              <button type="submit" className="btn-primary auth-submit">Login</button>
            </form>
            
            <div className="auth-footer">
              <span className="auth-subtitle">Not verified yet? </span>
              <button className="btn-link" onClick={() => navigate('/student/register')}>Register Here</button>
            </div>
          </>
        ) : (!isResetMode ? (
          // VERIFICATION FORM
          <>
            <form onSubmit={handleVerifySubmit} className="auth-form">
              <div className="form-group">
                <label>VAC Roll Number</label>
                <input type="text" name="vac_rollNo" placeholder="VAC/26/001" required onChange={handleVerifyChange} value={verifyData.vac_rollNo}/>
              </div>
              <div className="form-group">
                <label>Category (as per Registration)</label>
                <select name="category" required onChange={handleVerifyChange} value={verifyData.category} style={{ width: '100%', padding: '12px 15px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '1rem', backgroundColor: '#f8fafc' }}>
                  <option value="">Select Category</option>
                  <option value="General">General</option>
                  <option value="OBC">OBC</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                </select>
              </div>
              <div className="form-group">
                <label>Date of Birth</label>
                <input type="date" name="dob" required onChange={handleVerifyChange} value={verifyData.dob}/>
              </div>
              <button type="submit" className="btn-primary auth-submit">Verify Details</button>
            </form>
            <div className="auth-footer">
              <button className="btn-link" onClick={() => setIsForgotMode(false)}>Back to Login</button>
            </div>
          </>
        ) : (
          // RESET PASSWORD FORM
          <>
            <form onSubmit={handleResetSubmit} className="auth-form">
              <div className="form-group">
                <label>New Password</label>
                <input type="password" placeholder="Set a new easy memorable password" required onChange={(e) => setNewPassword(e.target.value)} value={newPassword}/>
              </div>
              <button type="submit" className="btn-primary auth-submit">Reset Password</button>
            </form>
            <div className="auth-footer">
              <button className="btn-link" onClick={() => { setIsResetMode(false); setIsForgotMode(false); }}>Cancel & Back to Login</button>
            </div>
          </>
        ))}
      </div>
    </div>
  );
};

export default StudentLogin;
