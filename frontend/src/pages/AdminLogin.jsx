import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUI } from '../context/UIContext';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const { showFlash, showLoader, hideLoader } = useUI();

  const handleChange = (e) => {
    setCredentials({...credentials, [e.target.name]: e.target.value});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    showLoader();
    try {
      const response = await fetch('http://localhost:5000/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('adminToken', 'mock-token'); // Normally a real JWT
        localStorage.setItem('adminRole', data.role);
        localStorage.setItem('adminPermissions', JSON.stringify(data.permissions || []));
        localStorage.setItem('adminUsername', credentials.username);
        
        showFlash("Login successful!", "success");
        navigate('/admin/dashboard');
      } else {
        showFlash(data.message, "error");
      }
    } catch (err) {
      showFlash("Failed to connect to server", "error");
    } finally {
      hideLoader();
    }
  };

  return (
    <div className="auth-page">
      <div className="admin-bg"></div>
      <div className="auth-card admin-card">
        <div className="auth-header">
          <img src="/Ncc_Logo.jpg" alt="NCC Logo" className="auth-logo" />
          <h2 className="auth-title" style={{color: 'var(--accent-red)'}}>Admin Portal</h2>
          <p className="auth-subtitle">Authorized Personnel Only</p>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Username</label>
            <input type="text" name="username" placeholder="Enter assigned username" required onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" placeholder="Enter secure password" required onChange={handleChange} />
          </div>
          <button type="submit" className="btn-primary auth-submit" style={{backgroundColor: 'var(--accent-red)', borderColor: 'var(--accent-red)'}}>Secure Login</button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
