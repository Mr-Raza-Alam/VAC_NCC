import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <div className="hero-wrapper">
        <section className="hero-section">
          <div className="hero-bg">
            <img src="/src/assets/ncc_hero.jpeg" alt="NCC Cadets" />
            <div className="hero-overlay"></div>
          </div>
          
          <div className="hero-content">
            <h2 className="hero-title">Value Added Course (VAC) 2026-2027</h2>
            <h3 className="hero-subtitle">Assam University Silchar</h3>
            <p className="hero-description">
              Welcome to the official testing and evaluation portal for the National Cadet Corps (NCC) Value Added Course. 
              Please register to access your dashboard for internal tests, practical scores, and continuous assessment.
            </p>
            
            <div className="hero-buttons">
              <button onClick={() => navigate('/student/register')} className="btn-primary">
                VAC-STUDENT
              </button>
              <button onClick={() => navigate('/admin/login')} className="btn-outline">
                ADMIN
              </button>
            </div>
          </div>
        </section>
      </div>

      <div className="hero-divider"></div>

      {/* Glimpses Section */}
      <section className="glimpses-section">
        <h2 className="section-title">Glimpses of NCC Assam University</h2>
        
        <div className="gallery-grid">
          {[1, 2, 3, 4, 7, 9, 10, 11, 12].map((num) => (
            <div key={num} className="gallery-item">
              <img src={`/src/assets/ncc_pic${num}.jpeg`} alt={`NCC Glimpse ${num}`} />
            </div>
          ))}
        </div>
      </section>

      {/* Footer rendered via App.jsx */}
    </div>
  );
};

export default LandingPage;
