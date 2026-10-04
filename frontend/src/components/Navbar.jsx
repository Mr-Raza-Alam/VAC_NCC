import React from 'react';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="nav-logo-group">
        <img src="/AUS_Logo - Copy (2).jpg" alt="AUS Logo" className="nav-logo" />
      </div>
      <div className="nav-title-group">
        <h1 className="nav-title">VAC NCC Portal</h1>
        <p className="nav-subtitle">Assam University Silchar</p>
      </div>
      <div className="nav-actions">
        <img src="/Ncc_Logo.jpg" alt="NCC Logo" className="nav-logo" />
      </div>
    </nav>
  );
};

export default Navbar;
