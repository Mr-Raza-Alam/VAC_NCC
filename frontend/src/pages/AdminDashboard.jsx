import React, { useState, useEffect } from 'react';
import { useUI } from '../context/UIContext';
import RecordSection from '../components/admin/RecordSection';
import TestSection from '../components/admin/TestSection';
import SystemSection from '../components/admin/SystemSection';

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('system'); // default
  const [activeSubTab, setActiveSubTab] = useState('home');
  const [isWrittenTestOpen, setIsWrittenTestOpen] = useState(false);
  const [isPracticalTestOpen, setIsPracticalTestOpen] = useState(false);
  const [isCAOpen, setIsCAOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const adminRole = localStorage.getItem('adminRole') || 'guest';
  const adminPermissions = JSON.parse(localStorage.getItem('adminPermissions') || '[]');
  const adminUsername = localStorage.getItem('adminUsername') || 'Admin';

  const hasPermission = (perm) => {
    if (adminRole === 'lead_admin') return true;
    return adminPermissions.includes(perm);
  };
  
  // Shared State
  const [students, setStudents] = useState([]);
  const [testSettings, setTestSettings] = useState([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [tableData, setTableData] = useState({});
  const [testStates, setTestStates] = useState({
    internal_1: 'pending', // pending -> active -> ready_to_finalize -> done
    internal_2: 'pending',
    internal_3: 'pending',
    practical: 'pending',
    ca: 'pending'
  });

  const [confirmDialog, setConfirmDialog] = useState({ 
    isOpen: false, 
    type: '', 
    phase: '', 
    newState: '', 
    title: '', 
    message: '' 
  });
  
  const { showFlash, showLoader, hideLoader } = useUI();

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/test-management/settings`);
      if (response.ok) {
        const data = await response.json();
        setTestSettings(data);
      }
    } catch (err) {
      console.error("Failed to fetch settings", err);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/record/vac-students`);
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      }
    } catch (err) {
      console.error("Failed to fetch students", err);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchSettings();
  }, []);

  const getSetting = (type) => testSettings.find(s => s.testType === type) || {};

  // Helper function to handle tab clicking
  const handleTabClick = (section, subTab) => {
    // Check if the target is a result table
    if (subTab.endsWith('_result')) {
      const phase = subTab.replace('_result', '');
      // If it's not finalized in state or DB, block it!
      if (testStates[phase] !== 'done' && !getSetting(phase).isFinalized) {
        showFlash(`Cannot access Result Table. Please complete and finalize ${phase.replace('_', ' ').toUpperCase()} Entry Table first.`, "error");
        return;
      }
    }

    // Check prerequisites for Internal 2 and 3
    if (subTab.startsWith('internal_2') && testStates['internal_1'] !== 'done' && !getSetting('internal_1').isFinalized) {
      showFlash("Access Denied: You must complete and finalize Internal 1 first.", "error");
      return;
    } 
    if (subTab.startsWith('internal_3') && testStates['internal_2'] !== 'done' && !getSetting('internal_2').isFinalized) {
      showFlash("Access Denied: You must complete and finalize Internal 2 first.", "error");
      return;
    }

    setActiveSection(section);
    setActiveSubTab(subTab);
    setIsMobileMenuOpen(false); // Close mobile menu on navigate
  };

  const handleTestStateChange = async (phase, newState) => {
    if (newState === 'active') {
      // Validate attendance is marked for all students before starting test
      const isAnyAttendanceEmpty = students.some(st => {
          const att = tableData[st.vac_rollNo]?.[phase]?.att;
          return !att || att === '';
      });

      if (isAnyAttendanceEmpty) {
          showFlash("You must mark attendance (P or A) for all students before activating the test!", "error");
          return;
      }
      
      setConfirmDialog({
         isOpen: true,
         type: 'activate',
         phase,
         newState,
         title: 'Activate Test',
         message: `Are you sure you want to activate the ${phase.replace('_', ' ').toUpperCase()} test? Only Present students will be allowed to take the exam.`
      });
      return;
    }
    
    if (newState === 'ready_to_finalize') {
      setTestStates(prev => ({ ...prev, [phase]: newState }));
      return;
    }

    if (newState === 'done') {
      setConfirmDialog({
         isOpen: true,
         type: 'finalize',
         phase,
         newState,
         title: 'Finalize Round',
         message: `Are you sure you want to finalize the ${phase.replace('_', ' ').toUpperCase()} round? This action cannot be undone and will permanently lock the phase.`
      });
      return;
    }
  };

  const executeConfirmDialog = async () => {
    const { type, phase, newState } = confirmDialog;
    setConfirmDialog({ ...confirmDialog, isOpen: false }); // close it immediately

    if (type === 'activate') {
      setTestStates(prev => ({ ...prev, [phase]: newState }));
      showFlash(`${phase.replace('_', ' ').toUpperCase()} Activated! Live Entry Mode.`, "success");
    } else if (type === 'finalize') {
      showLoader();
      try {
        const phaseDataToVerify = {};
        students.forEach(st => {
           const stData = tableData[st.vac_rollNo]?.[phase] || { att: '' }; 
           phaseDataToVerify[st.vac_rollNo] = stData;
        });

        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/test-management/verify-phase`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ testType: phase, tableData: phaseDataToVerify })
        });
        
        const result = await response.json();
        
        if (response.ok) {
           setTestStates(prev => ({ ...prev, [phase]: newState }));
           await fetchSettings(); // refresh global settings
           showFlash(`${phase.replace('_', ' ').toUpperCase()} Completed! Redirecting to Result...`, "success");
           setActiveSubTab(`${phase}_result`);
        } else {
           showFlash(result.message || "Cannot finalize: Verification failed.", "error");
        }
      } catch (error) {
        showFlash("Server error during finalization.", "error");
      } finally {
        hideLoader();
      }
    }
  };

  const handleTableDataChange = (rollNo, phaseKey, field, value) => {
    setTableData(prev => ({
      ...prev,
      [rollNo]: {
        ...(prev[rollNo] || {}),
        [phaseKey]: {
          ...((prev[rollNo] || {})[phaseKey] || {}),
          [field]: value
        }
      }
    }));
  };

  const renderContent = () => {
    if (activeSubTab === 'home') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '60vh', textAlign: 'center' }}>
           <h1 style={{ color: '#16a34a', fontSize: '2.5rem', marginBottom: '10px' }}>Welcome back, Lead Admin</h1>
           <h2 style={{ color: '#475569', fontSize: '1.5rem', margin: 0, marginBottom: '20px' }}>Raza Alam</h2>
           <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Please select an option from the sidebar to begin managing the selection process.</p>
        </div>
      );
    }

    if (activeSection === 'record') {
      return <RecordSection 
                students={students} 
                fetchStudents={fetchStudents} 
                activeSubTab={activeSubTab} 
              />;
    }

    if (activeSection === 'test') {
      return <TestSection 
                students={students} 
                activeSubTab={activeSubTab} 
                testStates={testStates} 
                handleTestStateChange={handleTestStateChange}
                tableData={tableData}
                handleTableDataChange={handleTableDataChange}
              />;
    }
    
    if (activeSection === 'system') {
      return <SystemSection activeSubTab={activeSubTab} />;
    }

    return null;
  };

  return (
    <div className="dashboard-page" style={{ display: 'flex', minHeight: '100vh', paddingTop: '80px' }}>
      
      {/* Custom Confirm Modal */}
      {confirmDialog.isOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', animation: 'slideInRight 0.3s ease-out' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#1e293b', fontSize: '1.4rem' }}>{confirmDialog.title}</h3>
            <p style={{ color: '#475569', marginBottom: '24px', lineHeight: '1.5' }}>{confirmDialog.message}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                style={{ padding: '10px 16px', backgroundColor: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Cancel
              </button>
              <button 
                onClick={executeConfirmDialog}
                style={{ padding: '10px 16px', backgroundColor: confirmDialog.type === 'finalize' ? '#dc2626' : '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                {confirmDialog.type === 'finalize' ? 'Yes, Finalize' : 'Yes, Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Overlay */}
      <div 
        className={`admin-overlay ${isMobileMenuOpen ? 'mobile-open' : ''}`} 
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>

      {/* Sidebar */}
      <aside className={`admin-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`} style={{ width: '270px', backgroundColor: '#ffffff', borderRight: '1px solid #e2e8f0', color: '#334155', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
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
                <button onClick={() => handleTabClick('test', 'internal_1_entry')} style={nestedBtnStyle(activeSection === 'test' && activeSubTab === 'internal_1_entry')}>
                  Entry-Table
                </button>
                <button onClick={() => handleTabClick('test', 'internal_1_result')} style={nestedBtnStyle(activeSection === 'test' && activeSubTab === 'internal_1_result')}>
                  Result-Table
                </button>

                <div className="sidebar-subheading" style={{ padding: '8px 20px 4px 40px', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Internal 2</div>
                <button onClick={() => handleTabClick('test', 'internal_2_entry')} style={nestedBtnStyle(activeSection === 'test' && activeSubTab === 'internal_2_entry')}>
                  Entry-Table
                </button>
                <button onClick={() => handleTabClick('test', 'internal_2_result')} style={nestedBtnStyle(activeSection === 'test' && activeSubTab === 'internal_2_result')}>
                  Result-Table
                </button>

                <div className="sidebar-subheading" style={{ padding: '8px 20px 4px 40px', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Internal 3</div>
                <button onClick={() => handleTabClick('test', 'internal_3_entry')} style={nestedBtnStyle(activeSection === 'test' && activeSubTab === 'internal_3_entry')}>
                  Entry-Table
                </button>
                <button onClick={() => handleTabClick('test', 'internal_3_result')} style={nestedBtnStyle(activeSection === 'test' && activeSubTab === 'internal_3_result')}>
                  Result-Table
                </button>
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
                <button 
                  onClick={() => handleTabClick('test', 'practical_entry')}
                  style={nestedBtnStyle(activeSection === 'test' && activeSubTab === 'practical_entry')}
                >
                  Entry-Table
                </button>
                <button 
                  onClick={() => handleTabClick('test', 'practical_result')}
                  style={nestedBtnStyle(activeSection === 'test' && activeSubTab === 'practical_result')}
                >
                  Result-Table
                </button>
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
                <button 
                  onClick={() => handleTabClick('test', 'ca_entry')}
                  style={nestedBtnStyle(activeSection === 'test' && activeSubTab === 'ca_entry')}
                >
                  Entry-Table
                </button>
                <button 
                  onClick={() => handleTabClick('test', 'ca_result')}
                  style={nestedBtnStyle(activeSection === 'test' && activeSubTab === 'ca_result')}
                >
                  Result-Table
                </button>
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

      {/* Main Content Area */}
      <main style={{ flex: 1, backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
        
        {/* Main Content Header matching sidebar header height */}
        <div style={{ height: '70px', padding: '0 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
          
          <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)}>
            ☰
          </button>

          <div style={{ position: 'relative', marginLeft: 'auto' }}>
            <div 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f1f5f9', padding: '8px 16px', borderRadius: '6px', border: '1px solid #e2e8f0', cursor: 'pointer' }}
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <span style={{ fontSize: '1.1rem' }}>👤</span>
              <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '0.9rem' }}>{adminUsername} ▼</span>
            </div>
            {showProfileMenu && (
              <div style={{ position: 'absolute', top: '110%', right: 0, backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', minWidth: '160px', zIndex: 100 }}>
                 <div style={{ padding: '12px 15px', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.85rem' }}>Role: <strong style={{ color: '#1e293b', textTransform: 'capitalize' }}>{adminRole.replace('_', ' ')}</strong></div>
                 <div style={{ padding: '12px 15px', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.85rem' }}>Responsibility: <strong style={{ color: '#1e293b' }}>{adminRole === 'lead_admin' ? 'Full Access' : 'Custom'}</strong></div>
                 <button onClick={() => { localStorage.clear(); window.location.href = '/admin/login'; }} style={{ width: '100%', padding: '12px 15px', border: 'none', backgroundColor: '#fef2f2', color: '#dc2626', textAlign: 'left', cursor: 'pointer', borderBottomLeftRadius: '6px', borderBottomRightRadius: '6px', fontWeight: 'bold' }}>Logout</button>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Content */}
        <div style={{ padding: '40px', flex: 1, position: 'relative', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '2rem', color: '#1e3a8a', textTransform: 'capitalize', margin: 0 }}>
              {activeSubTab.replace(/_/g, ' ')}
            </h1>
            <span style={{ padding: '6px 16px', backgroundColor: '#e2e8f0', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase' }}>
              {activeSection} Section
            </span>
          </div>
          
          {renderContent()}

          {/* Guard Modal Removed - Hard blocks used instead */}
        </div>
      </main>
    </div>
  );
};

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

// Helper style for nested buttons
const nestedBtnStyle = (isActive) => ({
  display: 'block',
  width: '100%',
  textAlign: 'left',
  padding: '12px 20px 12px 48px', // Extra left padding for indent
  backgroundColor: isActive ? '#e0e7ff' : 'transparent', 
  color: isActive ? '#4338ca' : '#64748b',
  border: 'none',
  cursor: 'pointer',
  fontSize: '0.9rem',
  transition: 'all 0.2s',
  fontWeight: isActive ? '600' : 'normal',
  borderLeft: isActive ? '4px solid #4338ca' : '4px solid transparent'
});

export default AdminDashboard;
