import React, { createContext, useContext, useState, useCallback } from 'react';

const UIContext = createContext();

export const useUI = () => useContext(UIContext);

export const UIProvider = ({ children }) => {
  const [flash, setFlash] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const showFlash = useCallback((message, type = 'success') => {
    setFlash({ message, type });
    setTimeout(() => {
      setFlash(null);
    }, 4000); // hide after 4s
  }, []);

  const showLoader = useCallback(() => setIsLoading(true), []);
  const hideLoader = useCallback(() => setIsLoading(false), []);

  return (
    <UIContext.Provider value={{ showFlash, showLoader, hideLoader }}>
      {children}
      
      {/* Flash Message Overlay */}
      {flash && (
        <div style={{
          position: 'fixed',
          top: '100px',
          right: '24px',
          zIndex: 9999,
          backgroundColor: 'white',
          padding: '16px 24px',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          borderLeft: `6px solid ${flash.type === 'success' ? '#10b981' : '#ef4444'}`,
          animation: 'slideInRight 0.3s ease-out forwards',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          maxWidth: '400px'
        }}>
          <span style={{ fontSize: '1.2rem' }}>
            {flash.type === 'success' ? '✅' : '⚠️'}
          </span>
          <span style={{ fontWeight: '600', color: '#334155' }}>
            {flash.message}
          </span>
        </div>
      )}

      {/* Global Fixed Loader */}
      {isLoading && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className="custom-loader"></div>
          <p style={{ marginTop: '24px', fontWeight: '800', color: '#1e3a8a', fontSize: '1.2rem', letterSpacing: '0.15em' }}>
            PROCESSING...
          </p>
        </div>
      )}
    </UIContext.Provider>
  );
};
