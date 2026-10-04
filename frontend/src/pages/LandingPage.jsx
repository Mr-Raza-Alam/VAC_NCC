import React from 'react';
import { useNavigate } from 'react-router-dom';

import nccHero from '../assets/ncc_hero.jpeg';
import nccPic1 from '../assets/ncc_pic1.jpeg';
import nccPic2 from '../assets/ncc_pic2.jpeg';
import nccPic3 from '../assets/ncc_pic3.jpeg';
import nccPic4 from '../assets/ncc_pic4.jpeg';
import nccPic7 from '../assets/ncc_pic7.jpeg';
import nccPic9 from '../assets/ncc_pic9.jpeg';
import nccPic10 from '../assets/ncc_pic10.jpeg';
import nccPic11 from '../assets/ncc_pic11.jpeg';
import nccPic12 from '../assets/ncc_pic12.jpeg';

const glimpseImages = [
  nccPic1, nccPic2, nccPic3, nccPic4, nccPic7,
  nccPic9, nccPic10, nccPic11, nccPic12
];

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <div className="hero-wrapper">
        <section className="hero-section">
          <div className="hero-bg">
            <img src={nccHero} alt="NCC Cadets" />
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
          {glimpseImages.map((imgSrc, idx) => (
            <div key={idx} className="gallery-item">
              <img src={imgSrc} alt={`NCC Glimpse ${idx + 1}`} />
            </div>
          ))}
        </div>
      </section>

      {/* Footer rendered via App.jsx */}
    </div>
  );
};

export default LandingPage;
