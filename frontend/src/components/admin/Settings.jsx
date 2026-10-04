import React, { useState, useEffect } from 'react';
import { useUI } from '../../context/UIContext';

const Settings = () => {
  const { showFlash, showLoader, hideLoader } = useUI();
  const adminUsername = localStorage.getItem('adminUsername') || 'Admin';

  const [broadcast, setBroadcast] = useState({
    message: '',
    targetPage: 'None (Disabled)',
    isActive: false
  });

  const [resetConfirm, setResetConfirm] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetTarget, setResetTarget] = useState('Nuclear Reset (Everything - New Batch)');
  
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    fetchSettings();
    fetchAuditLogs();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/settings`);
      if (response.ok) {
        const data = await response.json();
        setBroadcast({
          message: data.broadcastMessage || '',
          targetPage: data.targetPage || 'None (Disabled)',
          isActive: data.broadcastActive || false
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/settings/audit-logs`);
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateBroadcast = async () => {
    showLoader();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/settings/broadcast`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          broadcastMessage: broadcast.message,
          targetPage: broadcast.targetPage,
          broadcastActive: true
        })
      });
      if (response.ok) {
        setBroadcast({ ...broadcast, isActive: true });
        showFlash("Broadcast Updated and Active", "success");
      } else {
        showFlash("Failed to update broadcast", "error");
      }
    } catch (err) {
      showFlash("Network error", "error");
    } finally {
      hideLoader();
    }
  };

  const handleStopBroadcast = async () => {
    showLoader();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/settings/broadcast`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ broadcastActive: false })
      });
      if (response.ok) {
        setBroadcast({ ...broadcast, isActive: false });
        showFlash("Broadcast Stopped", "success");
      } else {
        showFlash("Failed to stop broadcast", "error");
      }
    } catch (err) {
      showFlash("Network error", "error");
    } finally {
      hideLoader();
    }
  };

  const handleReset = async () => {
    if (resetConfirm !== 'RESET') {
      showFlash("You must type RESET in all caps to confirm.", "error");
      return;
    }
    if (!resetPassword) {
      showFlash("Admin password is required.", "error");
      return;
    }

    showLoader();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/settings/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resetTarget,
          adminUsername,
          password: resetPassword
        })
      });
      const data = await response.json();
      if (response.ok) {
        showFlash(data.message, "success");
        setResetConfirm('');
        setResetPassword('');
        fetchAuditLogs();
      } else {
        showFlash(data.message, "error");
      }
    } catch (err) {
      showFlash("Network error during reset.", "error");
    } finally {
      hideLoader();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* BROADCAST SECTION */}
      <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '24px' }}>
        <h2 style={{ color: '#0369a1', margin: '0 0 8px 0', fontSize: '1.3rem' }}>Broadcast Notification</h2>
        <p style={{ color: '#0ea5e9', fontSize: '0.9rem', marginBottom: '20px' }}>Pin a global message to the top of specific pages. Select "None" to remove the active broadcast.</p>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', color: '#0f172a', fontWeight: '500', fontSize: '0.9rem' }}>Broadcast Message</label>
          <textarea 
            value={broadcast.message}
            onChange={e => setBroadcast({...broadcast, message: e.target.value})}
            placeholder="e.g. Test window is extended by 10 minutes..."
            style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', minHeight: '80px', fontFamily: 'inherit', resize: 'vertical' }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'inline-block', marginRight: '10px', color: '#0f172a', fontWeight: '500', fontSize: '0.9rem' }}>Target Page</label>
          <select 
            value={broadcast.targetPage}
            onChange={e => setBroadcast({...broadcast, targetPage: e.target.value})}
            style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: 'white', color: '#334155' }}
          >
            <option value="None (Disabled)">None (Disabled)</option>
            <option value="Dashboard">Dashboard</option>
            <option value="Test Page">Test Page</option>
            <option value="Home Page">Home Page</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <button 
            onClick={handleUpdateBroadcast}
            style={{ padding: '10px 20px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            UPDATE BROADCAST
          </button>
          <button 
            onClick={handleStopBroadcast}
            disabled={!broadcast.isActive}
            style={{ padding: '10px 20px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: broadcast.isActive ? 'pointer' : 'not-allowed', opacity: broadcast.isActive ? 1 : 0.6 }}
          >
            STOP ACTIVE BROADCAST
          </button>
        </div>
      </div>

      {/* DATABASE RESET OPTIONS */}
      <div style={{ backgroundColor: '#fff5f5', border: '1px solid #fca5a5', borderRadius: '8px', padding: '24px' }}>
        <h2 style={{ color: '#b91c1c', margin: '0 0 8px 0', fontSize: '1.3rem' }}>Database Reset Options</h2>
        <p style={{ color: '#dc2626', fontSize: '0.9rem', marginBottom: '20px' }}>Select which part of the database you want to reset. This action requires your admin password.</p>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '6px', color: '#0f172a', fontWeight: '500', fontSize: '0.9rem' }}>Reset Target</label>
          <select 
            value={resetTarget}
            onChange={e => setResetTarget(e.target.value)}
            style={{ width: '100%', padding: '10px', border: '1px solid #fca5a5', borderRadius: '4px', backgroundColor: 'white', color: '#334155' }}
          >
            <option value="Nuclear Reset (Everything - New Batch)">Nuclear Reset (Everything - New Batch)</option>
            <option value="Clear Test Records Only">Clear Test Records Only</option>
          </select>
        </div>

        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ color: '#b91c1c', fontWeight: 'bold', fontSize: '0.95rem' }}>Step 1: Type <span style={{ color: '#7f1d1d' }}>RESET</span> in all caps to confirm</label>
          <input 
            type="text" 
            value={resetConfirm}
            onChange={e => setResetConfirm(e.target.value)}
            placeholder="RESET"
            style={{ padding: '6px 12px', border: '1px solid #fca5a5', borderRadius: '4px', backgroundColor: '#fef2f2', color: '#991b1b', fontWeight: 'bold', outline: 'none' }}
          />
        </div>

        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ color: '#b91c1c', fontWeight: 'bold', fontSize: '0.95rem' }}>Step 2: Enter your admin password to authorize</label>
          <input 
            type="password" 
            value={resetPassword}
            onChange={e => setResetPassword(e.target.value)}
            placeholder="••••••••"
            style={{ padding: '6px 12px', border: '1px solid #fca5a5', borderRadius: '4px', backgroundColor: '#fef2f2', color: '#991b1b', fontWeight: 'bold', outline: 'none' }}
          />
        </div>

        <button 
          onClick={handleReset}
          disabled={resetConfirm !== 'RESET' || !resetPassword}
          style={{ padding: '12px 24px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: (resetConfirm === 'RESET' && resetPassword) ? 'pointer' : 'not-allowed', opacity: (resetConfirm === 'RESET' && resetPassword) ? 1 : 0.5 }}
        >
          EXECUTE RESET
        </button>
      </div>

      {/* AUDIT LOG */}
      <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '24px' }}>
        <h2 style={{ color: '#334155', margin: '0 0 16px 0', fontSize: '1.3rem' }}>Audit Log (Read Only)</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#e2e8f0' }}>
                <th style={{ padding: '12px', color: '#475569', fontWeight: 'bold' }}>TIMESTAMP</th>
                <th style={{ padding: '12px', color: '#475569', fontWeight: 'bold' }}>ACTION</th>
                <th style={{ padding: '12px', color: '#475569', fontWeight: 'bold' }}>PERFORMED BY</th>
                <th style={{ padding: '12px', color: '#475569', fontWeight: 'bold' }}>DETAILS</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>No logs available.</td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px', color: '#475569' }}>{new Date(log.timestamp).toLocaleString()}</td>
                    <td style={{ padding: '12px', color: '#0f172a', fontWeight: '600' }}>{log.action}</td>
                    <td style={{ padding: '12px', color: '#0f172a' }}>{log.performedBy}</td>
                    <td style={{ padding: '12px', color: '#64748b' }}>{log.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Settings;
