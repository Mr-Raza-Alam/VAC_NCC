import React, { useState, useEffect } from 'react';
import { useUI } from '../../context/UIContext';

const ClassManagement = ({ activeSubTab = 'class_schedule' }) => {
  const { showFlash, showLoader, hideLoader } = useUI();
  const [classes, setClasses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '', date: '', time: '', type: 'Physical', zoomLink: ''
  });

  // Routine & Batch Configuration State
  const [currentBatch, setCurrentBatch] = useState('2026-2027');
  const [timetableDays, setTimetableDays] = useState(['Monday', 'Wednesday', 'Friday']);
  const [timetableTime, setTimetableTime] = useState('10:00 AM - 11:00 AM');
  const [timetableInstructor, setTimetableInstructor] = useState("CTO sir / ma'am");
  const [timetableVenue, setTimetableVenue] = useState('NCC Department');
  const [isSavingRoutine, setIsSavingRoutine] = useState(false);

  const allWeekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const fetchRoutineAndSettings = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/settings`);
      const data = await response.json();
      if (response.ok && data) {
        if (data.currentBatch !== undefined) setCurrentBatch(data.currentBatch || '');
        if (data.timetableDays && Array.isArray(data.timetableDays)) setTimetableDays(data.timetableDays);
        if (data.timetableTime) setTimetableTime(data.timetableTime);
        if (data.timetableInstructor) setTimetableInstructor(data.timetableInstructor);
        if (data.timetableVenue) setTimetableVenue(data.timetableVenue);
      }
    } catch (err) {
      console.error('Error fetching routine settings:', err);
    }
  };

  const handleSaveRoutine = async (e) => {
    e.preventDefault();
    setIsSavingRoutine(true);
    showLoader();
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/settings/routine`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentBatch,
          timetableDays,
          timetableTime,
          timetableInstructor,
          timetableVenue
        })
      });
      if (response.ok) {
        showFlash("Batch & Timetable Routine updated successfully!", "success");
      } else {
        showFlash("Failed to update routine.", "error");
      }
    } catch (err) {
      showFlash("Server error updating routine.", "error");
    } finally {
      setIsSavingRoutine(false);
      hideLoader();
    }
  };

  const toggleDay = (day) => {
    setTimetableDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

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
    fetchRoutineAndSettings();
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
    <div style={{ padding: '0', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Class-Schedule Section */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.2rem', fontWeight: '700' }}>
              Class-Schedule & Routine
            </h3>
            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
              Configures the active course batch and weekly routine displayed on the Landing Page and Student Dashboard.
            </p>
          </div>
          <button
            onClick={handleSaveRoutine}
            disabled={isSavingRoutine}
            style={{
              backgroundColor: '#0f766e',
              color: 'white',
              padding: '8px 18px',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: isSavingRoutine ? 'not-allowed' : 'pointer',
              fontSize: '0.88rem'
            }}
          >
            {isSavingRoutine ? 'Saving...' : 'SAVE ROUTINE & BATCH'}
          </button>
        </div>

        <form onSubmit={handleSaveRoutine} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '0.85rem', color: '#334155' }}>
              Current Academic Batch:
            </label>
            <input
              type="text"
              placeholder="e.g. 2026-2027"
              value={currentBatch}
              onChange={e => setCurrentBatch(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.95rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '0.85rem', color: '#334155' }}>
              Class Time Window:
            </label>
            <input
              type="text"
              placeholder="e.g. 10:00 AM - 11:00 AM"
              value={timetableTime}
              onChange={e => setTimetableTime(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.95rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '0.85rem', color: '#334155' }}>
              Instructor(s):
            </label>
            <input
              type="text"
              value={timetableInstructor}
              onChange={e => setTimetableInstructor(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.95rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '0.85rem', color: '#334155' }}>
              Venue:
            </label>
            <input
              type="text"
              value={timetableVenue}
              onChange={e => setTimetableVenue(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.95rem' }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.85rem', color: '#334155' }}>
              Class Days of the Week:
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {allWeekDays.map(day => {
                const isSelected = timetableDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '16px',
                      border: isSelected ? '1px solid #0284c7' : '1px solid #cbd5e1',
                      backgroundColor: isSelected ? '#e0f2fe' : '#f8fafc',
                      color: isSelected ? '#0369a1' : '#64748b',
                      fontWeight: isSelected ? 'bold' : 'normal',
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </form>
      </div>
      
      {/* Live Attendance Section */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.2rem', fontWeight: '700' }}>
              Live Attendance
            </h3>
            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
              Open and close real-time GPS Geofenced attendance windows for scheduled class sessions.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{
              backgroundColor: '#0284c7',
              color: 'white',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '0.88rem'
            }}
          >
            + SCHEDULE CLASS
          </button>
        </div>

        <div style={{ borderRadius: '6px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase' }}>Title</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase' }}>Date & Time</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase' }}>Type</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase' }}>Attendance Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {classes.map(cls => (
                <tr key={cls._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '600', color: '#1e293b' }}>{cls.title}</td>
                  <td style={{ padding: '12px 16px', color: '#475569' }}>{cls.date} at {cls.time}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.82rem', fontWeight: 'bold', backgroundColor: cls.type === 'Physical' ? '#e0f2fe' : '#f3e8ff', color: cls.type === 'Physical' ? '#0369a1' : '#7e22ce' }}>
                      {cls.type}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {cls.attendanceActive ? (
                      <span style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '0.85rem' }}>LIVE (Open)</span>
                    ) : (
                      <span style={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '0.85rem' }}>CLOSED</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button 
                      onClick={() => toggleAttendance(cls._id, cls.attendanceActive)}
                      style={{ 
                        padding: '6px 14px', 
                        backgroundColor: cls.attendanceActive ? '#ef4444' : '#10b981', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px', 
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '0.82rem'
                      }}
                    >
                      {cls.attendanceActive ? 'STOP ATTENDANCE' : 'START ATTENDANCE'}
                    </button>
                  </td>
                </tr>
              ))}
              {classes.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>No classes scheduled yet. Use "+ SCHEDULE CLASS" above to add a session.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
