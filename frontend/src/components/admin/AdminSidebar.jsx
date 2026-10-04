import React, { useState } from 'react';

// Helper style for main sidebar buttons
const btnStyle = (isActive, isDropdown = false) => ({
  display: isDropdown ? 'flex' : 'block',
  alignItems: isDropdown ? 'center' : 'initial',
  width: '100%',
  textAlign: 'left',
  padding: '14px 20px',
  backgroundColor: isActive ? '#f1f5f9' : 'transparent',
  color: isActive ? '#2563eb' : '#475569',
  border: 'none',
  cursor: 'pointer',
  fontSize: '0.95rem',
  transition: 'all 0.2s',
  fontWeight: isActive ? '600' : '500',
  borderLeft: isActive ? '4px solid #2563eb' : '4px solid transparent'
});

// Helper style for nested items
const nestedBtnStyle = (isActive) => ({
  ...btnStyle(isActive),
  paddingLeft: '40px',
  fontSize: '0.85rem',
  backgroundColor: isActive ? '#e0e7ff' : 'transparent',
  borderLeft: isActive ? '4px solid #4f46e5' : '4px solid transparent'
});

const AdminSidebar = ({ 
  isMobileMenuOpen, 
  setIsMobileMenuOpen, 
  hasPermission, 
  activeSection, 
  activeSubTab, 
  handleTabClick 
}) => {
  const [isWrittenTestOpen, setIsWrittenTestOpen] = useState(false);
  const [isPracticalTestOpen, setIsPracticalTestOpen] = useState(false);
  const [isCAOpen, setIsCAOpen] = useState(false);

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`admin-overlay ${isMobileMenuOpen ? 'mobile-open' : ''}`} 
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>

      {/* Sidebar */}
      <aside className={`admin-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div 
          style={{ height: '70px', padding: '0 20px', borderBottom: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', backgroundColor: '#f8fafc' }}
          onClick={() => handleTabClick('system', 'home')}
        >
          <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: '800', letterSpacing: '0.05em', color: '#1e293b' }}>Admin Panel</h2>
        </div>

        <nav style={{ flex: 1, padding: '16px 0' }}>
          
          {/* TEST SECTION */}
          {hasPermission('ACCESS_TEST') ? (
          <div className="sidebar-section" style={{ flexShrink: 0 }}>
            <div className="sidebar-heading" style={{ padding: '10px 20px', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Test</div>
            
            {/* Written Test Dropdown */}
            <button 
              className="sidebar-btn"
              onClick={() => setIsWrittenTestOpen(!isWrittenTestOpen)}
              style={btnStyle(false, true)}
            >
              <span style={{flex: 1, textAlign: 'left'}}>Written-Test</span>
              <span style={{ fontSize: '0.8rem' }}>{isWrittenTestOpen ? '▼' : '▶'}</span>
            </button>
            
            {isWrittenTestOpen && (
              <div style={{ backgroundColor: '#f8fafc' }}>
                <div className="sidebar-subheading" style={{ padding: '8px 20px 4px 40px', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Internal 1</div>
                <button onClick={() => handleTabClick('test', 'internal_1_entry')} style={nestedBtnStyle(activeSection === 'test' && activeSubTab === 'internal_1_entry')}>Entry-Table</button>
                <button onClick={() => handleTabClick('test', 'internal_1_result')} style={nestedBtnStyle(activeSection === 'test' && activeSubTab === 'internal_1_result')}>Result-Table</button>

                <div className="sidebar-subheading" style={{ padding: '8px 20px 4px 40px', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Internal 2</div>
                <button onClick={() => handleTabClick('test', 'internal_2_entry')} style={nestedBtnStyle(activeSection === 'test' && activeSubTab === 'internal_2_entry')}>Entry-Table</button>
                <button onClick={() => handleTabClick('test', 'internal_2_result')} style={nestedBtnStyle(activeSection === 'test' && activeSubTab === 'internal_2_result')}>Result-Table</button>

                <div className="sidebar-subheading" style={{ padding: '8px 20px 4px 40px', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Internal 3</div>
                <button onClick={() => handleTabClick('test', 'internal_3_entry')} style={nestedBtnStyle(activeSection === 'test' && activeSubTab === 'internal_3_entry')}>Entry-Table</button>
                <button onClick={() => handleTabClick('test', 'internal_3_result')} style={nestedBtnStyle(activeSection === 'test' && activeSubTab === 'internal_3_result')}>Result-Table</button>
              </div>
            )}

            {/* Practical Test Dropdown */}
            <button 
              className="sidebar-btn"
              onClick={() => setIsPracticalTestOpen(!isPracticalTestOpen)}
              style={btnStyle(false, true)}
            >
              <span style={{flex: 1, textAlign: 'left'}}>Practical-Test</span>
              <span style={{ fontSize: '0.8rem' }}>{isPracticalTestOpen ? '▼' : '▶'}</span>
            </button>

            {isPracticalTestOpen && (
              <div style={{ backgroundColor: '#f8fafc' }}>
                <button onClick={() => handleTabClick('test', 'practical_entry')} style={nestedBtnStyle(activeSection === 'test' && activeSubTab === 'practical_entry')}>Entry-Table</button>
                <button onClick={() => handleTabClick('test', 'practical_result')} style={nestedBtnStyle(activeSection === 'test' && activeSubTab === 'practical_result')}>Result-Table</button>
              </div>
            )}

            {/* CA Dropdown */}
            <button 
              className="sidebar-btn"
              onClick={() => setIsCAOpen(!isCAOpen)}
              style={btnStyle(false, true)}
            >
              <span style={{flex: 1, textAlign: 'left'}}>Continuous Assessment</span>
              <span style={{ fontSize: '0.8rem' }}>{isCAOpen ? '▼' : '▶'}</span>
            </button>

            {isCAOpen && (
              <div style={{ backgroundColor: '#f8fafc' }}>
                <button onClick={() => handleTabClick('test', 'ca_entry')} style={nestedBtnStyle(activeSection === 'test' && activeSubTab === 'ca_entry')}>Entry-Table</button>
                <button onClick={() => handleTabClick('test', 'ca_result')} style={nestedBtnStyle(activeSection === 'test' && activeSubTab === 'ca_result')}>Result-Table</button>
              </div>
            )}
          </div>
          ) : null}

          {/* RECORD SECTION */}
          {hasPermission('ACCESS_RECORD') ? (
          <div className="sidebar-section" style={{ marginTop: '20px', flexShrink: 0 }}>
            <div className="sidebar-heading" style={{ padding: '10px 20px', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Record</div>
            <button 
              onClick={() => handleTabClick('record', 'vac_student')}
              style={btnStyle(activeSection === 'record' && activeSubTab === 'vac_student')}
            >
              VAC_Student
            </button>
            <button 
              onClick={() => handleTabClick('record', 'master_table')}
              style={btnStyle(activeSection === 'record' && activeSubTab === 'master_table')}
            >
              Master-Table
            </button>
          </div>
          ) : null}

          {/* SYSTEM SECTION */}
          {(hasPermission('ACCESS_SYSTEM_TEST_MGMT') || hasPermission('ACCESS_SYSTEM_ROLE_MGMT') || hasPermission('ACCESS_SYSTEM_SETTINGS')) && (
          <div className="sidebar-section" style={{ marginTop: '20px', flexShrink: 0 }}>
            <div className="sidebar-heading" style={{ padding: '10px 20px', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 'bold' }}>System</div>
            
            {hasPermission('ACCESS_SYSTEM_TEST_MGMT') && (
            <button 
              onClick={() => handleTabClick('system', 'test_management')}
              style={btnStyle(activeSection === 'system' && activeSubTab === 'test_management')}
            >
              Test-Management
            </button>
            )}

            {hasPermission('ACCESS_SYSTEM_ROLE_MGMT') && (
            <button 
              onClick={() => handleTabClick('system', 'role_management')}
              style={btnStyle(activeSection === 'system' && activeSubTab === 'role_management')}
            >
              Role Management
            </button>
            )}

            {hasPermission('ACCESS_SYSTEM_SETTINGS') && (
            <button 
              onClick={() => handleTabClick('system', 'setting')}
              style={btnStyle(activeSection === 'system' && activeSubTab === 'setting')}
            >
              Setting
            </button>
            )}
          </div>
          )}
        </nav>
      </aside>
    </>
  );
};

export default AdminSidebar;
