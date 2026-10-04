import React from 'react';

const NotesModal = ({ settings, onClose }) => {
  const units = [
    { id: 'Unit 1', key: 'notesUnit1' },
    { id: 'Unit 2', key: 'notesUnit2' },
    { id: 'Unit 3', key: 'notesUnit3' },
    { id: 'Unit 4', key: 'notesUnit4' },
    { id: 'Unit 5', key: 'notesUnit5' }
  ];

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '16px', width: '450px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)', padding: '30px', position: 'relative'
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: '15px', right: '15px',
          background: '#f1f5f9', color: '#475569', border: 'none',
          borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer',
          fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>X</button>

        <h2 style={{ margin: '0 0 20px 0', color: '#1e293b', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          📚 Study Material (Notes)
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '24px' }}>
          Select a unit to view or download its notes.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {units.map((unit) => {
            const fileUrl = settings ? settings[unit.key] : null;
            const isAvailable = !!fileUrl;

            return (
              <div key={unit.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px 20px', borderRadius: '12px',
                backgroundColor: isAvailable ? '#f8fafc' : '#fef2f2',
                border: `1px solid ${isAvailable ? '#e2e8f0' : '#fecaca'}`
              }}>
                <span style={{ fontWeight: '700', color: isAvailable ? '#334155' : '#991b1b', fontSize: '1.1rem' }}>
                  {unit.id}
                </span>
                
                {isAvailable ? (
                  <button 
                    onClick={() => window.open(fileUrl, '_blank')}
                    style={{ backgroundColor: '#2563eb', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    View Notes
                  </button>
                ) : (
                  <span style={{ color: '#dc2626', fontSize: '0.85rem', fontWeight: '600' }}>
                    Not uploaded yet
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default NotesModal;
