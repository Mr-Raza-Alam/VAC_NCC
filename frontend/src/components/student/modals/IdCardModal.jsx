import React from 'react';

const IdCardModal = ({ studentData, onClose }) => {
  if (!studentData) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        width: '90%',
        maxWidth: '400px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button onClick={onClose} style={{
          position: 'absolute', top: '15px', right: '15px',
          background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none',
          borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer',
          fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>X</button>

        {/* Card Header (Blue) */}
        <div style={{ backgroundColor: '#1e3a8a', padding: '20px', textAlign: 'center', color: 'white' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', letterSpacing: '1px' }}>ASSAM UNIVERSITY, SILCHAR</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#93c5fd' }}>NCC Value Added Course (VAC)</p>
        </div>

        {/* Card Body */}
        <div style={{ padding: '30px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          {/* Avatar Placeholder */}
          <div style={{
            width: '100px', height: '100px', backgroundColor: '#e2e8f0',
            borderRadius: '12px', border: '4px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            marginTop: '-60px', marginBottom: '20px', display: 'flex', justifyContent: 'center',
            alignItems: 'center', fontSize: '3rem'
          }}>
            🎓
          </div>

          <h3 style={{ margin: '0 0 4px 0', fontSize: '1.4rem', color: '#0f172a', fontWeight: '800' }}>
            {studentData.name}
          </h3>
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '6px 16px', borderRadius: '20px', marginBottom: '24px' }}>
            <span style={{ color: '#991b1b', fontWeight: '800', letterSpacing: '2px', fontSize: '1.1rem' }}>
              {studentData.vac_rollNo}
            </span>
          </div>

          <div style={{ width: '100%', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
            <div style={detailRowStyle}>
              <span style={labelStyle}>Department:</span>
              <span style={valueStyle}>{studentData.department || 'N/A'}</span>
            </div>
            <div style={detailRowStyle}>
              <span style={labelStyle}>Semester:</span>
              <span style={valueStyle}>{studentData.semester || 'N/A'}</span>
            </div>
            <div style={detailRowStyle}>
              <span style={labelStyle}>Gender:</span>
              <span style={valueStyle}>{studentData.gender || 'N/A'}</span>
            </div>
            <div style={detailRowStyle}>
              <span style={labelStyle}>Blood Group:</span>
              <span style={valueStyle}>{studentData.bloodGroup || 'N/A'}</span>
            </div>
            <div style={{ ...detailRowStyle, borderBottom: 'none', paddingBottom: 0 }}>
              <span style={labelStyle}>Emergency Contact:</span>
              <span style={valueStyle}>{studentData.guardianContact || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Card Footer */}
        <div style={{ backgroundColor: '#f8fafc', padding: '16px', textAlign: 'center', borderTop: '1px solid #e2e8f0' }}>
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>
            Valid only for NCC VAC internal evaluation.
          </p>
        </div>
      </div>
    </div>
  );
};

const detailRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  paddingBottom: '12px',
  marginBottom: '12px',
  borderBottom: '1px dashed #e2e8f0'
};

const labelStyle = { color: '#64748b', fontSize: '0.9rem', fontWeight: '600' };
const valueStyle = { color: '#1e293b', fontSize: '0.9rem', fontWeight: '700' };

export default IdCardModal;
