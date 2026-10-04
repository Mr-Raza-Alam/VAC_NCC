import React, { useState, useEffect } from 'react';
import { useUI } from '../context/UIContext';
import '../styles/adminDashboard.css';
import RecordSection from '../components/admin/RecordSection';
import TestSection from '../components/admin/TestSection';
import SystemSection from '../components/admin/SystemSection';
import AdminSidebar from '../components/admin/AdminSidebar';

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState(localStorage.getItem('adminActiveSection') || 'system'); // default
  const [activeSubTab, setActiveSubTab] = useState(localStorage.getItem('adminActiveSubTab') || 'home');
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
        
        // Sync test states with database
        setTestStates(prev => {
          const updated = { ...prev };
          data.forEach(setting => {
            let phase = setting.testType;
            if (phase === 'Int-1') phase = 'internal_1';
            if (phase === 'Int-2') phase = 'internal_2';
            if (phase === 'Int-3') phase = 'internal_3';
            
            if (setting.isFinalized) {
              updated[phase] = 'done';
            } else if (setting.isActive) {
              updated[phase] = 'active';
            }
          });
          return updated;
        });
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

  const fetchLiveData = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/test-management/live-data`);
      if (response.ok) {
        const data = await response.json();
        setTableData(data);
      }
    } catch (err) {
      console.error("Failed to fetch live table data", err);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchSettings();
    fetchLiveData();
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
    localStorage.setItem('adminActiveSection', section);
    localStorage.setItem('adminActiveSubTab', subTab);
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
      showLoader();
      try {
        const testTypeMap = { internal_1: 'Int-1', internal_2: 'Int-2', internal_3: 'Int-3' };
        const tType = testTypeMap[phase] || phase;

        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/test-management/settings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ testType: tType, isActive: true })
        });
        
        if (response.ok) {
          setTestStates(prev => ({ ...prev, [phase]: newState }));
          await fetchSettings();
          showFlash(`${phase.replace('_', ' ').toUpperCase()} Activated! Live Entry Mode.`, "success");
        } else {
          const result = await response.json();
          showFlash(result.message || "Failed to activate test on backend.", "error");
        }
      } catch (err) {
        showFlash("Server error during activation.", "error");
      } finally {
        hideLoader();
      }
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

    // Instantly sync the change to the backend so it persists across devices (sessions)
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/test-management/live-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNo, phaseKey, field, value })
    }).catch(err => console.error("Failed to sync live data", err));
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
    <div className="admin-layout-container">
      
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

      {/* Sidebar Component */}
      <AdminSidebar 
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        hasPermission={hasPermission}
        activeSection={activeSection}
        activeSubTab={activeSubTab}
        handleTabClick={handleTabClick}
      />

      {/* Main Content Area */}
      <main className="admin-main-content">
        
        {/* Main Content Header */}
        <div className="admin-top-header">
          
          <button className="admin-hamburger-btn" onClick={() => setIsMobileMenuOpen(true)}>
            ☰
          </button>

          <div style={{ position: 'relative', marginLeft: 'auto' }}>
            <div 
              className="profile-menu-btn"
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
        <div className="admin-content-area">
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
