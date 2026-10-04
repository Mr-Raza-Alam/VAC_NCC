import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUI } from '../context/UIContext';

const StudentLogin = () => {
  const navigate = useNavigate();
  const { showFlash, showLoader, hideLoader } = useUI();
  const [credentials, setCredentials] = useState({ vac_rollNo: '', password: '' });

  const handleChange = (e) => {
    let value = e.target.value;
    if (e.target.name === 'vac_rollNo') {
      value = value.toUpperCase();
    }
    setCredentials({...credentials, [e.target.name]: value});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    showLoader();
    try {
      const response = await fetch('http://localhost:5000/api/auth/student/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      const data = await response.json();
      hideLoader();
      
      if (response.ok) {
        // Save the token and student data
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

  return (
    <div className="auth-page">
      <div className="auth-bg"></div>
      <div className="auth-card student-card">
        <div className="auth-header">
          <div className="auth-icon">🎓</div>
          <h2 className="auth-title">Student Login</h2>
          <p className="auth-subtitle">Assam University VAC Portal</p>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>VAC Roll Number</label>
            <input type="text" name="vac_rollNo" placeholder="VAC/26/001" required onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" placeholder="Enter your password" required onChange={handleChange} />
          </div>
          <button type="submit" className="btn-primary auth-submit">Login</button>
        </form>
        
        <div className="auth-footer">
          <span className="auth-subtitle">Not verified yet? </span>
          <button className="btn-link" onClick={() => navigate('/student/register')}>Register Here</button>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;
