import React, { useState, useEffect } from 'react';
import { useUI } from '../../context/UIContext';

const StudentClasses = () => {
  const { showFlash, showLoader, hideLoader } = useUI();
  const [classes, setClasses] = useState([]);
  const [locationStatus, setLocationStatus] = useState('');

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem('studentToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/classes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setClasses(data);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleMarkAttendance = async (classId, classType, zoomLink) => {
    if (classType === 'Virtual') {
      await sendAttendanceRequest(classId, null, null, zoomLink);
      return;
    }

    // Physical class requires GPS
    if (!navigator.geolocation) {
      showFlash("Geolocation is not supported by your browser.", "error");
      return;
    }

    setLocationStatus("Getting your location... Please wait and click 'Allow' if prompted.");
    showLoader();

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await sendAttendanceRequest(classId, latitude, longitude, null);
      },
      (error) => {
        hideLoader();
        setLocationStatus("");
        if (error.code === error.PERMISSION_DENIED) {
          showFlash("Location access denied. You must allow location access to mark attendance for physical classes.", "error");
        } else {
          showFlash("Failed to get your location. Please check your GPS and try again.", "error");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const sendAttendanceRequest = async (classId, lat, lon, zoomLink) => {
    try {
      const token = localStorage.getItem('studentToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/classes/${classId}/mark-attendance`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ lat, lon })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showFlash("Attendance marked successfully!", "success");
        if (zoomLink) {
          window.open(zoomLink, '_blank');
        }
        fetchClasses(); // Refresh to hide the button or show status
      } else {
        showFlash(data.message || "Failed to mark attendance", "error");
      }
    } catch (err) {
      showFlash("Server error marking attendance", "error");
    } finally {
      hideLoader();
      setLocationStatus("");
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
      {locationStatus && (
        <div style={{ gridColumn: '1 / -1', padding: '16px', backgroundColor: '#fffbeb', color: '#b45309', borderRadius: '8px', border: '1px solid #fde68a', fontWeight: 'bold', textAlign: 'center' }}>
          {locationStatus}
        </div>
      )}

      {classes.map(cls => (
        <div key={cls._id} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.2rem' }}>{cls.title}</h3>
            <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', backgroundColor: cls.type === 'Physical' ? '#e0f2fe' : '#f3e8ff', color: cls.type === 'Physical' ? '#0369a1' : '#7e22ce' }}>
              {cls.type}
            </span>
          </div>

          <div style={{ color: '#475569', fontSize: '0.95rem', marginBottom: '8px' }}>
            <strong>Date:</strong> {cls.date}
          </div>
          <div style={{ color: '#475569', fontSize: '0.95rem', marginBottom: '24px' }}>
            <strong>Time:</strong> {cls.time}
          </div>

          <div style={{ marginTop: 'auto' }}>
            {cls.attendanceActive ? (
              <button 
                onClick={() => handleMarkAttendance(cls._id, cls.type, cls.zoomLink)}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  backgroundColor: '#16a34a', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px', 
                  fontWeight: 'bold', 
                  fontSize: '1rem',
                  cursor: 'pointer',
                  animation: 'pulse 2s infinite'
                }}
              >
                📍 MARK ATTENDANCE
              </button>
            ) : (
              <button 
                disabled
                style={{ width: '100%', padding: '12px', backgroundColor: '#f1f5f9', color: '#94a3b8', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'not-allowed' }}
              >
                Attendance Closed
              </button>
            )}
          </div>
        </div>
      ))}
      
      {classes.length === 0 && (
        <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#64748b', backgroundColor: 'white', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
          No classes are currently scheduled. Check back later!
        </div>
      )}

      <style>
        {`
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.4); }
            70% { box-shadow: 0 0 0 10px rgba(22, 163, 74, 0); }
            100% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0); }
          }
        `}
      </style>
    </div>
  );
};

export default StudentClasses;
