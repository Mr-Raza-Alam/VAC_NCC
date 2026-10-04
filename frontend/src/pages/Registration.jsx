import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUI } from '../context/UIContext';

const Registration = () => {
  const navigate = useNavigate();
  const { showFlash } = useUI();
  const [formData, setFormData] = useState({
    name: '', vac_rollNo: '', department: '', semester: '',
    email: '', mobile: '', password: '', confirmPassword: ''
  });

  const handleChange = (e) => {
    let value = e.target.value;
    if (e.target.name === 'vac_rollNo') {
      value = value.toUpperCase();
    }
    setFormData({...formData, [e.target.name]: value});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(formData.password !== formData.confirmPassword) {
        showFlash("Passwords do not match!", "error");
        return;
    }
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/student/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('studentToken', data.token);
        localStorage.setItem('studentData', JSON.stringify(data.student));
        showFlash(data.message, "success");
        navigate('/student/dashboard');
      } else {
        showFlash(data.message, "error");
      }
    } catch (error) {
      showFlash("Server error during registration.", "error");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg"></div>
      <div className="auth-card student-card">
        <div className="auth-header">
          <div className="auth-icon">🎓</div>
          <h2 className="auth-title">Assam University VAC Registration</h2>
          <p className="auth-subtitle">Verify your details to access the NCC Portal</p>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Full Name (As per official records)</label>
            <input type="text" name="name" placeholder="Enter full name" required onChange={handleChange} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>VAC Roll Number</label>
              <input type="text" name="vac_rollNo" placeholder="VAC/26/001" required onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Department</label>
              <input type="text" name="department" placeholder="e.g. CSE" required onChange={handleChange} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Semester</label>
              <input type="text" name="semester" placeholder="e.g. 3rd Sem" required onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Mobile Number</label>
              <input type="tel" name="mobile" placeholder="10-digit number" required onChange={handleChange} />
            </div>
          </div>
          <div className="form-group">
            <label>Email ID</label>
            <input type="email" name="email" placeholder="Institutional Email" required onChange={handleChange} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Set Password</label>
              <input type="password" name="password" placeholder="Min. 6 characters" minLength="6" maxLength="12" required onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input type="password" name="confirmPassword" placeholder="Retype password" minLength="6" maxLength="12" required onChange={handleChange} />
            </div>
          </div>
          
          <button type="submit" className="btn-primary auth-submit">Verify & Register</button>
        </form>
        <div className="auth-footer">
          <span className="auth-subtitle">Already verified? </span>
          <button className="btn-link" onClick={() => navigate('/student/login')}>Login Here</button>
        </div>
      </div>
    </div>
  );
};

export default Registration;
