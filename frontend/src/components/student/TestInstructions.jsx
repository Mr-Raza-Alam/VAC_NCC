import React, { useState } from 'react';

const TestInstructions = ({ testType, onAgree }) => {
  const [isChecked, setIsChecked] = useState(false);

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '40px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', maxWidth: '800px', margin: '40px auto' }}>
      <h2 style={{ color: '#1e3a8a', fontSize: '2rem', marginBottom: '24px', textAlign: 'center' }}>Test Instructions: {testType.replace('_', ' ').toUpperCase()}</h2>
      
      <div style={{ backgroundColor: '#f1f5f9', padding: '24px', borderRadius: '12px', marginBottom: '32px' }}>
        <ul style={{ color: '#334155', fontSize: '1.1rem', lineHeight: '1.8', margin: 0, paddingLeft: '20px' }}>
          <li>The test will begin immediately upon clicking "Start Test-Entry".</li>
          <li>A global timer will start automatically. Do not refresh or close the page.</li>
          <li>If the timer reaches zero, your test will be auto-submitted with your currently marked answers.</li>
          <li>Ensure you have a stable internet connection.</li>
          <li>Once submitted, you cannot re-attempt this phase.</li>
        </ul>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', padding: '16px', backgroundColor: '#fef3c7', borderRadius: '8px', border: '1px solid #fde68a' }}>
        <input 
          type="checkbox" 
          id="agreeCheck" 
          checked={isChecked} 
          onChange={(e) => setIsChecked(e.target.checked)} 
          style={{ width: '20px', height: '20px', cursor: 'pointer' }}
        />
        <label htmlFor="agreeCheck" style={{ color: '#92400e', fontWeight: '600', cursor: 'pointer', fontSize: '1.05rem' }}>
          I have read and understood all the instructions.
        </label>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button 
          onClick={onAgree} 
          disabled={!isChecked}
          style={{
            backgroundColor: isChecked ? '#2563eb' : '#94a3b8',
            color: 'white',
            padding: '16px 40px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            cursor: isChecked ? 'pointer' : 'not-allowed',
            transition: 'background-color 0.2s',
            boxShadow: isChecked ? '0 4px 15px rgba(37, 99, 235, 0.4)' : 'none'
          }}
        >
          Start Test-Entry 🚀
        </button>
      </div>
    </div>
  );
};

export default TestInstructions;
