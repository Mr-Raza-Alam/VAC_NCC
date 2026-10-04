import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';
import { useUI } from '../context/UIContext';
import BranchCard from '../components/student/BranchCard';
import TestInstructions from '../components/student/TestInstructions';
import LiveTest from '../components/student/LiveTest';
import IdCardModal from '../components/student/modals/IdCardModal';
import NotesModal from '../components/student/modals/NotesModal';
import SupportModal from '../components/student/modals/SupportModal';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { showFlash } = useUI();
  
  const [studentName, setStudentName] = useState("");
  const [isOnboarded, setIsOnboarded] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('online_test'); // online_test, practical_test, continuous_assessment
  
  const [scores, setScores] = useState(null);
  const [testSettings, setTestSettings] = useState([]);
  
  // Test Flow State
  const [testState, setTestState] = useState('DASHBOARD'); // 'DASHBOARD', 'INSTRUCTIONS', 'LIVE_TEST'
  const [currentTestType, setCurrentTestType] = useState(null);

  const [onboardData, setOnboardData] = useState({
    gender: '', category: '', state: '', guardianContact: '', dob: ''
  });

  const [syllabusUrl, setSyllabusUrl] = useState(null);
  
  const [fullStudentData, setFullStudentData] = useState(null);
  const [systemSettingsData, setSystemSettingsData] = useState(null);
  
  const [showIdModal, setShowIdModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  const fetchStudentData = async () => {
    const token = localStorage.getItem('studentToken');
    if (!token) {
      navigate('/student/login');
      return;
    }
    try {
      const profileRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/student/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const profileData = await profileRes.json();
      
      if (profileRes.ok) {
        setStudentName(profileData.name);
        setIsOnboarded(profileData.isOnboarded);
        setFullStudentData(profileData);
      } else {
        navigate('/student/login');
        return;
      }

      if (profileData.isOnboarded) {
        const scoresRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/student/dashboard-scores`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const scoresData = await scoresRes.json();
        if (scoresRes.ok) setScores(scoresData);
      }
    } catch (error) {
      console.error("Failed to fetch student data");
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/test-management/settings`);
      const data = await response.json();
      if (response.ok) {
        setTestSettings(data);
      }
    } catch (error) {
      console.error("Failed to fetch test settings");
    }
  };

  const fetchSystemSettings = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/system/settings`);
      const data = await response.json();
      if (data) {
        setSyllabusUrl(data.syllabusUrl);
        setSystemSettingsData(data);
      }
    } catch (error) {
      console.error("Failed to fetch system settings");
    }
  };

  useEffect(() => {
    fetchSystemSettings();
    fetchStudentData();
    fetchSettings();
  }, [navigate]);

  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('studentToken');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/student/onboard`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(onboardData)
      });
      
      if (response.ok) {
        setIsOnboarded(true);
        showFlash("Profile completed successfully!", "success");
        fetchStudentData(); // Refresh data
      } else {
        showFlash("Failed to save profile", "error");
      }
    } catch (error) {
      showFlash("Server error", "error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('studentToken');
    localStorage.removeItem('studentData');
    navigate('/student/login');
  };

  const getSetting = (type) => testSettings.find(s => s.testType === type) || {};

  const handleStartTestFlow = (testType) => {
    setCurrentTestType(testType);
    setTestState('INSTRUCTIONS');
  };

  const handleTestCompletion = () => {
    setTestState('DASHBOARD');
    setCurrentTestType(null);
    fetchStudentData(); // Refresh scores so it shows "Submitted"
  };

  if (!isOnboarded) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', maxWidth: '500px', width: '100%' }}>
          <h2 style={{ color: '#1e293b', marginBottom: '10px', fontSize: '1.8rem', textAlign: 'center', fontWeight: '800' }}>Complete Your Profile</h2>
          <p style={{ color: '#64748b', marginBottom: '30px', textAlign: 'center', fontSize: '0.95rem' }}>Please fill in the required details before accessing your dashboard.</p>
          <form onSubmit={handleOnboardSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Gender</label>
              <select required value={onboardData.gender} onChange={(e) => setOnboardData({...onboardData, gender: e.target.value})} style={inputStyle}>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <select required value={onboardData.category} onChange={(e) => setOnboardData({...onboardData, category: e.target.value})} style={inputStyle}>
                <option value="">Select Category</option>
                <option value="General">General</option>
                <option value="OBC">OBC</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>State</label>
              <input required type="text" placeholder="e.g., Maharashtra" value={onboardData.state} onChange={(e) => setOnboardData({...onboardData, state: e.target.value})} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Guardian Contact</label>
              <input required type="text" placeholder="10-digit mobile number" value={onboardData.guardianContact} onChange={(e) => setOnboardData({...onboardData, guardianContact: e.target.value})} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Date of Birth</label>
              <input required type="date" value={onboardData.dob} onChange={(e) => setOnboardData({...onboardData, dob: e.target.value})} style={inputStyle} />
            </div>
            <button type="submit" style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', marginTop: '10px', transition: 'background-color 0.2s' }}>
              Save & Continue
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- LIVE TEST FLOW OVERRIDE ---
  if (testState === 'INSTRUCTIONS') {
    return (
      <div className="dashboard-page">
        <TestInstructions 
          testType={currentTestType} 
          onAgree={() => setTestState('LIVE_TEST')} 
        />
      </div>
    );
  }

  if (testState === 'LIVE_TEST') {
    return (
      <div className="dashboard-page" style={{ paddingTop: '0' }}> {/* No navbar offset for live test */}
        <LiveTest 
          testType={currentTestType} 
          settings={getSetting(currentTestType)} 
          onSubmit={handleTestCompletion}
        />
      </div>
    );
  }

  // --- NORMAL DASHBOARD ---
  return (
    <div className="dashboard-page">
      {/* Top Header */}
      <div className="dashboard-header">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h1 className="dashboard-title">
            Welcome, {studentName}! 🎖️
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '0.95rem', maxWidth: '600px' }}>
            Unity and Discipline. Your university journey towards excellence, leadership, and honor begins here.
          </p>
        </div>
        
        {/* Profile Dropdown */}
        <div style={{ position: 'relative', marginTop: '10px' }}>
          <div 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="profile-menu-btn-rounded"
          >
            <span style={{ fontSize: '1.2rem' }}>👤</span>
            <span style={{ fontWeight: '600', color: '#334155' }}>My Profile ▼</span>
          </div>

          {showProfileMenu && (
            <div style={{ position: 'absolute', top: '120%', right: 0, backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', minWidth: '220px', border: '1px solid #e2e8f0', zIndex: 100, overflow: 'hidden' }}>
              <div style={menuItemStyle} onClick={() => { setShowProfileMenu(false); showFlash("Overview clicked", "info"); }}>Overview</div>
              <div style={menuItemStyle} onClick={() => { setShowProfileMenu(false); setShowIdModal(true); }}>Profile (ID Card)</div>
              <div style={menuItemStyle} onClick={() => { 
                setShowProfileMenu(false); 
                if (syllabusUrl) window.open(syllabusUrl, '_blank'); 
                else showFlash("Syllabus not uploaded yet", "error"); 
              }}>Syllabus</div>
              <div style={menuItemStyle} onClick={() => { setShowProfileMenu(false); setShowNotesModal(true); }}>Notes (Study Material)</div>
              <div style={menuItemStyle} onClick={() => { setShowProfileMenu(false); setShowSupportModal(true); }}>Support</div>
              <div style={{ ...menuItemStyle, color: '#ef4444', borderTop: '1px solid #f1f5f9', backgroundColor: '#fef2f2' }} onClick={handleLogout}>Logout</div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '40px', flex: 1, maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '40px', borderBottom: '2px solid #e2e8f0' }}>
          <button style={tabStyle(activeTab === 'online_test')} onClick={() => setActiveTab('online_test')}>
            Online-test
          </button>
          <button style={tabStyle(activeTab === 'practical_test')} onClick={() => setActiveTab('practical_test')}>
            Practical-Test
          </button>
          <button style={tabStyle(activeTab === 'continuous_assessment')} onClick={() => setActiveTab('continuous_assessment')}>
            Continuous Assessment
          </button>
        </div>

        {/* Tab Content (Branch Cards) */}
        <div style={{ backgroundColor: '#f8fafc', padding: '0', borderRadius: '0' }}>
          
          {activeTab === 'online_test' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              <BranchCard 
                title="Internal 1" 
                testType="internal_1"
                settings={getSetting('internal_1')}
                score={scores?.online_test?.internal1}
                onStartTest={handleStartTestFlow}
                onViewResult={() => alert(`Result: ${scores?.online_test?.internal1}/15`)}
              />
              <BranchCard 
                title="Internal 2" 
                testType="internal_2"
                settings={getSetting('internal_2')}
                score={scores?.online_test?.internal2}
                onStartTest={handleStartTestFlow}
                onViewResult={() => alert(`Result: ${scores?.online_test?.internal2}/15`)}
              />
              <BranchCard 
                title="Internal 3" 
                testType="internal_3"
                settings={getSetting('internal_3')}
                score={scores?.online_test?.internal3}
                onStartTest={handleStartTestFlow}
                onViewResult={() => alert(`Result: ${scores?.online_test?.internal3}/15`)}
              />
            </div>
          )}

          {activeTab === 'practical_test' && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
               <BranchCard 
                title="Practical Phase" 
                testType="practical"
                settings={getSetting('practical')}
                score={scores?.practical_test?.score}
                onStartTest={() => showFlash("Practical tests are not conducted online.", "info")}
                onViewResult={() => alert(`Result: ${scores?.practical_test?.score}/20`)}
              />
            </div>
          )}

          {activeTab === 'continuous_assessment' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              <BranchCard 
                title="Attendance" 
                testType="ca_attendance"
                settings={getSetting('ca')}
                score={scores?.continuous_assessment?.attendance}
                onStartTest={() => showFlash("CA is evaluated offline.", "info")}
                onViewResult={() => alert(`Result: ${scores?.continuous_assessment?.attendance}/5`)}
              />
              <BranchCard 
                title="Assignment" 
                testType="ca_assignment"
                settings={getSetting('ca')}
                score={scores?.continuous_assessment?.assessment}
                onStartTest={() => showFlash("CA is evaluated offline.", "info")}
                onViewResult={() => alert(`Result: ${scores?.continuous_assessment?.assessment}/5`)}
              />
              <BranchCard 
                title="Presentation" 
                testType="ca_presentation"
                settings={getSetting('ca')}
                score={scores?.continuous_assessment?.presentation}
                onStartTest={() => showFlash("CA is evaluated offline.", "info")}
                onViewResult={() => alert(`Result: ${scores?.continuous_assessment?.presentation}/5`)}
              />
            </div>
          )}

        </div>
      </div>

      {/* Render Modals */}
      {showIdModal && <IdCardModal studentData={fullStudentData} onClose={() => setShowIdModal(false)} />}
      {showNotesModal && <NotesModal settings={systemSettingsData} onClose={() => setShowNotesModal(false)} />}
      {showSupportModal && <SupportModal onClose={() => setShowSupportModal(false)} />}

    </div>
  );
};

// --- Reusable Styles ---
const labelStyle = { display: 'block', marginBottom: '8px', color: '#475569', fontSize: '0.95rem', fontWeight: '600' };
const inputStyle = { width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '1rem', color: '#1e293b', backgroundColor: '#f8fafc', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s' };
const menuItemStyle = { padding: '14px 20px', cursor: 'pointer', color: '#475569', fontWeight: '600', fontSize: '0.95rem', borderBottom: '1px solid #f8fafc' };

const tabStyle = (isActive) => ({
  padding: '12px 24px',
  backgroundColor: 'transparent',
  border: 'none',
  borderBottom: isActive ? '3px solid #2563eb' : '3px solid transparent',
  color: isActive ? '#2563eb' : '#64748b',
  fontSize: '1.15rem',
  fontWeight: isActive ? '800' : '600',
  cursor: 'pointer',
  transition: 'all 0.2s ease-in-out',
  outline: 'none'
});

export default StudentDashboard;
