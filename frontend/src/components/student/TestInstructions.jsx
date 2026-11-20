import React, { useState } from 'react';

const TestInstructions = ({ testType, onAgree }) => {
  const [isChecked, setIsChecked] = useState(false);

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', maxWidth: '800px', margin: '30px auto' }}>
      <h2 style={{ color: '#1e3a8a', fontSize: '1.8rem', marginBottom: '20px', textAlign: 'center' }}>
        Test Instructions: {testType.replace('_', ' ').toUpperCase()}
      </h2>
      
      {/* General Rules */}
      <div style={{ backgroundColor: '#f1f5f9', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1.05rem', color: '#1e293b', marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>📋</span> General Guidelines
        </h3>
        <ul style={{ color: '#334155', fontSize: '0.98rem', lineHeight: '1.7', margin: 0, paddingLeft: '20px' }}>
          <li>The test will begin immediately upon clicking <strong>"Start Test-Entry"</strong>.</li>
          <li>A global timer will start automatically. Do not refresh or close the page.</li>
          <li>If the timer reaches zero, your test will auto-submit with all your currently marked answers.</li>
          <li>Ensure you have a stable internet connection before beginning.</li>
          <li>Once submitted, you cannot re-attempt this test phase.</li>
        </ul>
      </div>

      {/* Anti-Cheating & Mobile Phone Advisories */}
      <div style={{ backgroundColor: '#eff6ff', padding: '20px', borderRadius: '12px', marginBottom: '24px', border: '1px solid #bfdbfe' }}>
        <h3 style={{ fontSize: '1.05rem', color: '#1e3a8a', marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🛡️</span> Anti-Cheating & Mobile Advisory
        </h3>
        <ul style={{ color: '#1e293b', fontSize: '0.98rem', lineHeight: '1.7', margin: 0, paddingLeft: '20px' }}>
          <li>
            <strong>Warning Allowed: (0/1)</strong> — You are allowed at most <strong>1 warning</strong>. A 2nd violation will permanently auto-submit your test.
          </li>
          <li>
            <strong>Turn ON "Do Not Disturb" (DND):</strong> Put your phone on DND / Silent to prevent incoming calls or message notifications from causing loss of focus.
          </li>
          <li>
            <strong>Stay in Fullscreen:</strong> Do not switch tabs, minimize the browser, or use swipe-navigation gestures.
          </li>
          <li>
            <strong>Battery Check:</strong> Ensure your phone has sufficient battery (above 30%) to prevent system low-battery alerts during the test.
          </li>
        </ul>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', padding: '16px', backgroundColor: '#fef3c7', borderRadius: '8px', border: '1px solid #fde68a' }}>
        <input 
          type="checkbox" 
          id="agreeCheck" 
          checked={isChecked} 
          onChange={(e) => setIsChecked(e.target.checked)} 
          style={{ width: '20px', height: '20px', cursor: 'pointer' }}
        />
        <label htmlFor="agreeCheck" style={{ color: '#92400e', fontWeight: '600', cursor: 'pointer', fontSize: '1rem' }}>
          I have read and understood all the instructions and anti-cheating guidelines.
        </label>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button 
          onClick={() => {
            try {
              if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(() => {});
              }
            } catch (e) {}
            onAgree();
          }} 
          disabled={!isChecked}
          style={{
            backgroundColor: isChecked ? '#2563eb' : '#94a3b8',
            color: 'white',
            padding: '16px 40px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '1.15rem',
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
