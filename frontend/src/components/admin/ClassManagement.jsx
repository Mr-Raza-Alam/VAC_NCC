import React, { useState, useEffect } from 'react';
import { useUI } from '../../context/UIContext';

const ClassManagement = () => {
  const { showFlash, showLoader, hideLoader } = useUI();
  const [classes, setClasses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '', date: '', time: '', type: 'Physical', zoomLink: ''
  });

  const fetchClasses = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/classes`);
      const data = await response.json();
      if (response.ok) setClasses(data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleScheduleClass = async (e) => {
    e.preventDefault();
    showLoader();
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/classes`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        showFlash("Class Scheduled Successfully!", "success");
        setShowModal(false);
        fetchClasses();
      } else {
        showFlash("Failed to schedule class.", "error");
      }
    } catch (err) {
      showFlash("Server error.", "error");
    } finally {
      hideLoader();
    }
  };

  const toggleAttendance = async (id, currentStatus) => {
    showLoader();
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/classes/${id}/toggle-attendance`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ active: !currentStatus })
      });
      if (response.ok) {
        showFlash(`Attendance window ${!currentStatus ? 'OPENED' : 'CLOSED'}.`, "success");
        fetchClasses();
      } else {
        showFlash("Failed to toggle attendance.", "error");
      }
    } catch (err) {
      showFlash("Server error.", "error");
    } finally {
      hideLoader();
    }
  };

  return (
    <div style={{ padding: '0' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', color: '#1e293b', margin: 0 }}>Class Schedule & Attendance</h2>
        <button onClick={() => setShowModal(true)} style={{ backgroundColor: '#2563eb', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
          + SCHEDULE CLASS
        </button>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
            <tr>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569' }}>Title</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569' }}>Date & Time</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569' }}>Type</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569' }}>Attendance Status</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {classes.map(cls => (
              <tr key={cls._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#1e293b' }}>{cls.title}</td>
                <td style={{ padding: '12px 16px', color: '#475569' }}>{cls.date} at {cls.time}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold', backgroundColor: cls.type === 'Physical' ? '#e0f2fe' : '#f3e8ff', color: cls.type === 'Physical' ? '#0369a1' : '#7e22ce' }}>
                    {cls.type}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {cls.attendanceActive ? (
                    <span style={{ color: '#16a34a', fontWeight: 'bold' }}>🟢 LIVE (Open)</span>
                  ) : (
                    <span style={{ color: '#94a3b8', fontWeight: 'bold' }}>⚫ CLOSED</span>
                  )}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <button 
                    onClick={() => toggleAttendance(cls._id, cls.attendanceActive)}
                    style={{ 
                      padding: '6px 12px', 
                      backgroundColor: cls.attendanceActive ? '#ef4444' : '#10b981', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px', 
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    {cls.attendanceActive ? 'STOP ATTENDANCE' : 'START ATTENDANCE'}
                  </button>
                </td>
              </tr>
            ))}
            {classes.length === 0 && (
              <tr>
                <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>No classes scheduled yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', width: '90%', maxWidth: '500px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.2rem' }}>Schedule New Class</h3>
            <form onSubmit={handleScheduleClass}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>Class Title (e.g. Unit 1: History)</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
              </div>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>Date</label>
                  <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>Time</label>
                  <input required type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>Class Type</label>
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                  <option value="Physical">Physical (GPS Enforced)</option>
                  <option value="Virtual">Virtual (Zoom/Meet)</option>
                </select>
              </div>
              {formData.type === 'Virtual' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>Zoom/Meet Link</label>
                  <input type="url" value={formData.zoomLink} onChange={e => setFormData({...formData, zoomLink: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 20px', border: 'none', backgroundColor: '#e2e8f0', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 20px', border: 'none', backgroundColor: '#2563eb', color: 'white', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Schedule Class</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassManagement;
