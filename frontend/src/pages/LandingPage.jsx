import React, { useState, useEffect } from 'react';
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

  // Settings State for dynamic Batch & Timetable
  const [settings, setSettings] = useState({
    currentBatch: '',
    timetableDays: ['Monday', 'Wednesday', 'Friday'],
    timetableTime: '10:00 AM - 11:00 AM',
    timetableInstructor: "CTO sir / ma'am",
    timetableVenue: 'NCC Department'
  });

  useEffect(() => {
    const fetchPublicSettings = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/settings`);
        const data = await response.json();
        if (response.ok && data) {
          setSettings(prev => ({
            ...prev,
            currentBatch: data.currentBatch !== undefined ? data.currentBatch : prev.currentBatch,
            timetableDays: data.timetableDays && data.timetableDays.length > 0 ? data.timetableDays : prev.timetableDays,
            timetableTime: data.timetableTime || prev.timetableTime,
            timetableInstructor: data.timetableInstructor || prev.timetableInstructor,
            timetableVenue: data.timetableVenue || prev.timetableVenue
          }));
        }
      } catch (err) {
        console.error('Failed to load landing page settings:', err);
      }
    };

    fetchPublicSettings();
  }, []);

  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-page">
      {/* Sub-Navbar Matching Student-Gate Blue */}
      <div 
        style={{
          marginTop: '90px',
          backgroundColor: 'var(--accent-blue, #007bff)', // Matches Student-Gate button
          color: '#ffffff',
          boxShadow: '0 2px 8px rgba(0, 123, 255, 0.25)',
          position: 'sticky',
          top: '90px',
          zIndex: 40
        }}
      >
        <div 
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '8px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          {/* Left Navigation Jump Links - Clean, No Emojis */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            <button
              onClick={() => scrollToSection('about-vac-section')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.92rem',
                fontWeight: '600',
                cursor: 'pointer',
                padding: '4px 6px',
                borderRadius: '4px',
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              About VAC
            </button>

            <button
              onClick={() => scrollToSection('timetable-section')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.92rem',
                fontWeight: '600',
                cursor: 'pointer',
                padding: '4px 6px',
                borderRadius: '4px',
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Timetable
            </button>

            <button
              onClick={() => scrollToSection('glimpses-section')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.92rem',
                fontWeight: '600',
                cursor: 'pointer',
                padding: '4px 6px',
                borderRadius: '4px',
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Glimpse
            </button>
          </div>

          {/* Right Side: Admin-Gate */}
          <div>
            <button
              onClick={() => navigate('/admin/login')}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                color: '#ffffff',
                padding: '5px 16px',
                borderRadius: '16px',
                fontSize: '0.86rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.color = '#007bff';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.color = '#ffffff';
              }}
            >
              Admin-Gate
            </button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="hero-wrapper" style={{ marginTop: '20px' }}>
        <section className="hero-section">
          <div className="hero-bg">
            <img src={nccHero} alt="NCC Cadets" />
            <div className="hero-overlay"></div>
          </div>
          
          <div className="hero-content">
            <h2 className="hero-title">
              Value Added Course (VAC){settings.currentBatch ? ` ${settings.currentBatch}` : ''}
            </h2>
            <h3 className="hero-subtitle">Assam University Silchar</h3>
            <p className="hero-description">
              Welcome to the official testing and evaluation portal for the National Cadet Corps (NCC) Value Added Course. 
              Access your student dashboard for internal CBT tests, practical assessments, and continuous attendance tracking.
            </p>
            
            <div className="hero-buttons">
              <button 
                onClick={() => navigate('/student/register')} 
                className="btn-primary"
                style={{ 
                  padding: '14px 40px', 
                  fontSize: '1.05rem', 
                  fontWeight: '700',
                  borderRadius: '28px',
                  boxShadow: '0 4px 15px rgba(0, 123, 255, 0.35)'
                }}
              >
                Student-Gate
              </button>
            </div>
          </div>
        </section>
      </div>

      <div className="hero-divider"></div>

      {/* Section 1: About VAC Card */}
      <section 
        id="about-vac-section" 
        style={{ 
          maxWidth: '1200px', 
          margin: '0 auto 40px auto', 
          padding: '0 24px', 
          scrollMarginTop: '150px' 
        }}
      >
        <div 
          style={{ 
            backgroundColor: '#ffffff', 
            borderRadius: '12px', 
            border: '1px solid #e2e8f0', 
            padding: '36px 32px', 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' 
          }}
        >
          <div style={{ marginBottom: '24px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Course Information
            </span>
            <h2 style={{ fontSize: '1.6rem', color: '#0f172a', margin: '6px 0 0 0', fontWeight: '700' }}>
              About Value Added Course (VAC)
            </h2>
            <p style={{ color: '#475569', fontSize: '0.98rem', margin: '8px 0 0 0', maxWidth: '900px', lineHeight: '1.6' }}>
              The <strong>National Cadet Corps (NCC) Value Added Course</strong> is a 6-month (1 semester) institutional course designed for students of Assam University, Silchar to develop leadership, discipline, national character, and fitness.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            {/* Internal 50 Marks Card */}
            <div style={{ backgroundColor: '#f8fafc', padding: '22px', borderRadius: '8px', border: '1px solid #e2e8f0', borderLeft: '4px solid #0284c7' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#0284c7', textTransform: 'uppercase' }}>Weightage: 50 Marks</span>
              <h3 style={{ margin: '6px 0 8px 0', fontSize: '1.15rem', color: '#0f172a', fontWeight: '700' }}>
                Internal Assessment
              </h3>
              <p style={{ margin: 0, color: '#475569', fontSize: '0.92rem', lineHeight: '1.5' }}>
                Digitally conducted via this portal. Covers Computer-Based Tests (CBT), Practical assessments, and Geofenced GPS-verified Class Attendance (Continuous Assessment).
              </p>
            </div>

            {/* External 50 Marks Card */}
            <div style={{ backgroundColor: '#f8fafc', padding: '22px', borderRadius: '8px', border: '1px solid #e2e8f0', borderLeft: '4px solid #0f766e' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#0f766e', textTransform: 'uppercase' }}>Weightage: 50 Marks</span>
              <h3 style={{ margin: '6px 0 8px 0', fontSize: '1.15rem', color: '#0f172a', fontWeight: '700' }}>
                External Assessment
              </h3>
              <p style={{ margin: 0, color: '#475569', fontSize: '0.92rem', lineHeight: '1.5' }}>
                Evaluated through Assam University's standard semester examination framework and faculty evaluation system.
              </p>
            </div>
          </div>

          <div style={{ padding: '12px 16px', backgroundColor: '#f0f9ff', borderRadius: '6px', border: '1px solid #bae6fd', color: '#0369a1', fontSize: '0.88rem' }}>
            Department: <strong>NCC Department, Assam University Silchar</strong> • Total Marks: <strong>100 Marks (50 Internal + 50 External)</strong>
          </div>
        </div>
      </section>

      {/* Section 2: Timetable Card */}
      <section 
        id="timetable-section" 
        style={{ 
          maxWidth: '1200px', 
          margin: '0 auto 40px auto', 
          padding: '0 24px', 
          scrollMarginTop: '150px' 
        }}
      >
        <div 
          style={{ 
            backgroundColor: '#ffffff', 
            borderRadius: '12px', 
            border: '1px solid #e2e8f0', 
            padding: '36px 32px', 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' 
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '24px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
            <div>
              <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Weekly Routine
              </span>
              <h2 style={{ fontSize: '1.6rem', color: '#0f172a', margin: '6px 0 0 0', fontWeight: '700' }}>
                Class Timetable & Routine
              </h2>
            </div>
            {settings.currentBatch && (
              <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '6px 14px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.88rem' }}>
                Batch: {settings.currentBatch}
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
            <div>
              <span style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Scheduled Days</span>
              <span style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a', display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                {settings.timetableDays.map(d => (
                  <span key={d} style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', padding: '3px 10px', borderRadius: '4px', fontSize: '0.86rem' }}>
                    {d}
                  </span>
                ))}
              </span>
            </div>

            <div>
              <span style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Class Timing</span>
              <span style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a', display: 'block', marginTop: '6px' }}>
                {settings.timetableTime}
              </span>
            </div>

            <div>
              <span style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Instructors</span>
              <span style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a', display: 'block', marginTop: '6px' }}>
                {settings.timetableInstructor}
              </span>
            </div>

            <div>
              <span style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Venue</span>
              <span style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a', display: 'block', marginTop: '6px' }}>
                {settings.timetableVenue}
              </span>
            </div>
          </div>

          <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem' }}>
            Enrolled cadets can track live attendance sessions and mark GPS-verified attendance inside the Student Dashboard under the <strong>Classes & Attendance</strong> tab.
          </p>
        </div>
      </section>

      {/* Section 3: Glimpses Section */}
      <section 
        id="glimpses-section" 
        className="glimpses-section" 
        style={{ scrollMarginTop: '150px' }}
      >
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
