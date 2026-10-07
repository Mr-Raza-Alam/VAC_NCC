import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const BroadcastBanner = () => {
  const [broadcast, setBroadcast] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const fetchBroadcast = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/system/settings`);
        if (response.ok) {
          const data = await response.json();
          if (data.broadcastActive) {
            setBroadcast({
              message: data.broadcastMessage,
              targetPage: data.targetPage
            });
          } else {
            setBroadcast(null);
          }
        }
      } catch (error) {
        console.error("Failed to fetch broadcast settings", error);
      }
    };

    fetchBroadcast();
  }, [location.pathname]); // Re-fetch when the route changes instead of polling

  if (!broadcast) return null;

  // Determine if banner should show on current page
  let shouldShow = false;
  if (broadcast.targetPage === 'Home Page' && location.pathname === '/') {
    shouldShow = true;
  } else if ((broadcast.targetPage === 'Dashboard' || broadcast.targetPage === 'Test Page') && location.pathname === '/student/dashboard') {
    shouldShow = true;
  }

  if (!shouldShow) return null;

  return (
    <div style={{
      backgroundColor: '#fef3c7', // amber-50
      color: '#92400e', // amber-900
      padding: '12px 24px',
      textAlign: 'center',
      borderBottom: '2px solid #fcd34d', // amber-300
      fontWeight: '600',
      fontSize: '1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      zIndex: 49,
      position: 'fixed',
      top: '90px',
      left: 0,
      width: '100%',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    }}>
      <span style={{ fontSize: '1.2rem' }}>📢</span>
      <span>{broadcast.message}</span>
    </div>
  );
};

export default BroadcastBanner;
