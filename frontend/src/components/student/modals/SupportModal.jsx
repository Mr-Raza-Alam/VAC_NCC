import React from 'react';

const SupportModal = ({ onClose }) => {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '16px', width: '90%', maxWidth: '450px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)', padding: '30px', position: 'relative',
        textAlign: 'center'
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: '15px', right: '15px',
          background: '#f1f5f9', color: '#475569', border: 'none',
          borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer',
          fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>X</button>

        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎧</div>
        <h2 style={{ margin: '0 0 12px 0', color: '#1e293b', fontSize: '1.6rem' }}>Technical Support</h2>
        <p style={{ color: '#475569', fontSize: '1rem', lineHeight: '1.6', marginBottom: '24px' }}>
          If you are facing any technical glitches, login issues, or problems during a live test, please reach out to the lead developer immediately.
        </p>

        <div style={{ backgroundColor: '#eff6ff', padding: '20px', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
          <p style={{ margin: '0 0 8px 0', color: '#1e40af', fontWeight: '600' }}>Contact Email:</p>
          <a href="mailto:raza.alam@aus.ac.in" style={{ fontSize: '1.2rem', color: '#2563eb', fontWeight: '800', textDecoration: 'none', wordBreak: 'break-all' }}>
            raza.alam@aus.ac.in
          </a>
        </div>

        <button 
          onClick={onClose}
          style={{ marginTop: '24px', backgroundColor: '#0f172a', color: 'white', padding: '12px 30px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}
        >
          Got it
        </button>
      </div>
    </div>
  );
};

export default SupportModal;
