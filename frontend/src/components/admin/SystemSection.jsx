import React from 'react';
import TestManagement from './TestManagement';
import RoleManagement from './RoleManagement';

import Settings from './Settings';

const SystemSection = ({ activeSubTab }) => {
  if (activeSubTab === 'test_management') {
    return <TestManagement />;
  }
  if (activeSubTab === 'role_management') {
    return <RoleManagement />;
  }
  if (activeSubTab === 'setting') {
    return <Settings />;
  }

  // Fallback
  return (
    <div style={{ padding: '60px 40px', textAlign: 'center', backgroundColor: '#f1f5f9', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
      <p style={{ color: '#475569', fontSize: '1.1rem' }}>The <strong>{activeSubTab.replace(/_/g, ' ')}</strong> interface will render here...</p>
    </div>
  );
};

export default SystemSection;
