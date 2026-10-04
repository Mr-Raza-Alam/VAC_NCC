import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUI } from '../context/UIContext';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { showFlash } = useUI();
  
  const [studentName, setStudentName] = useState("");
  const [isOnboarded, setIsOnboarded] = useState(true); // Default true until fetched
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('online_test'); // online_test, practical_test, continuous_assessment
  
  const [scores, setScores] = useState(null);
  
  const [onboardData, setOnboardData] = useState({
    gender: '', category: '', state: '', guardianContact: '', dob: ''
  });

  const [syllabusUrl, setSyllabusUrl] = useState(null);
  const [notesUrl, setNotesUrl] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/system/settings`);
        const data = await response.json();
        if (data) {
          setSyllabusUrl(data.syllabusUrl);
          setNotesUrl(data.notesUrl);
        }
      } catch (error) {
        console.error("Failed to fetch system settings");
      }
    };

    const fetchStudentData = async () => {
      const token = localStorage.getItem('studentToken');
      if (!token) {
        navigate('/student/login');
        return;
      }
      try {
        // Fetch Profile
        const profileRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/student/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const profileData = await profileRes.json();
        
        if (profileRes.ok) {
          setStudentName(profileData.name);
          setIsOnboarded(profileData.isOnboarded);
        } else {
          navigate('/student/login');
          return;
        }

        // Fetch Scores
        if (profileData.isOnboarded) {
          const scoresRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/student/dashboard-scores`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const scoresData = await scoresRes.json();
          if (scoresRes.ok) {
            setScores(scoresData);
          }
        }
      } catch (error) {
        console.error("Failed to fetch student data");
      }
    };

    fetchSettings();
    fetchStudentData();
  }, [navigate]);

  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('studentToken');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/student/onboard`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(onboardData)
      });
      
      if (response.ok) {
        setIsOnboarded(true);
        showFlash("Profile completed successfully!", "success");
        // Refetch scores
        const scoresRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/student/dashboard-scores`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const scoresData = await scoresRes.json();
        if (scoresRes.ok) setScores(scoresData);
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

  return (
    <div className="dashboard-page">
      
      {/* Top Bar / Header */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          Welcome, {studentName}
        </h1>
        
        {/* Profile Dropdown */}
        <div style={{ position: 'relative' }}>
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
              <div style={menuItemStyle} onClick={() => { setShowProfileMenu(false); showFlash("Profile clicked", "info"); }}>Profile</div>
              <div style={menuItemStyle} onClick={() => { 
                setShowProfileMenu(false); 
                if (syllabusUrl) window.open(syllabusUrl, '_blank'); 
                else showFlash("Syllabus not uploaded yet", "error"); 
              }}>Syllabus</div>
              <div style={menuItemStyle} onClick={() => { 
                setShowProfileMenu(false); 
                if (notesUrl) window.open(notesUrl, '_blank'); 
                else showFlash("Notes not uploaded yet", "error"); 
              }}>Notes</div>
              <div style={menuItemStyle} onClick={() => { setShowProfileMenu(false); showFlash("Result clicked", "info"); }}>Result</div>
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

        {/* Tab Content */}
        <div style={{ backgroundColor: 'white', padding: '50px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.03)', border: '1px solid #f1f5f9' }}>
          
          {activeTab === 'online_test' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px' }}>
              <ScoreBox title="Internal-1 Score" score={scores?.online_test?.internal1 || 'N/A'} total="15" color="#3b82f6" />
              <ScoreBox title="Internal-2 Score" score={scores?.online_test?.internal2 || 'N/A'} total="15" color="#8b5cf6" />
              <ScoreBox title="Internal-3 Score" score={scores?.online_test?.internal3 || 'N/A'} total="15" color="#ec4899" />
            </div>
          )}

          {activeTab === 'practical_test' && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <ScoreBox title="Practical Test Score" score={scores?.practical_test?.score || 'N/A'} total="20" color="#10b981" large />
            </div>
          )}

          {activeTab === 'continuous_assessment' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px' }}>
              <ScoreBox title="Attendance Score" score={scores?.continuous_assessment?.attendance || 'N/A'} total="5" color="#f59e0b" />
              <ScoreBox title="Assessment Score" score={scores?.continuous_assessment?.assessment || 'N/A'} total="5" color="#14b8a6" />
              <ScoreBox title="Presentation Score" score={scores?.continuous_assessment?.presentation || 'N/A'} total="5" color="#f43f5e" />
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

// --- Reusable Styles and Subcomponents ---

const labelStyle = {
  display: 'block',
  marginBottom: '8px',
  color: '#475569',
  fontSize: '0.95rem',
  fontWeight: '600'
};

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: '10px',
  border: '1px solid #cbd5e1',
  fontSize: '1rem',
  color: '#1e293b',
  backgroundColor: '#f8fafc',
  boxSizing: 'border-box',
  outline: 'none',
  transition: 'border-color 0.2s'
};

const menuItemStyle = {
  padding: '14px 20px',
  cursor: 'pointer',
  color: '#475569',
  fontWeight: '600',
  fontSize: '0.95rem',
  borderBottom: '1px solid #f8fafc'
};

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

const ScoreBox = ({ title, score, total, color, large = false }) => (
  <div style={{ 
    backgroundColor: '#ffffff', 
    border: `1px solid #e2e8f0`,
    borderRadius: '20px', 
    padding: large ? '50px' : '40px', 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
    minWidth: large ? '450px' : 'auto',
    transition: 'transform 0.3s ease'
  }}>
    {/* Colored top bar for visual hierarchy */}
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '8px', backgroundColor: color }}></div>
    
    <h3 style={{ color: '#64748b', margin: '0 0 20px 0', fontSize: large ? '1.4rem' : '1.1rem', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '700' }}>
      {title}
    </h3>
    
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
      <span style={{ fontSize: large ? '5rem' : '3.5rem', fontWeight: '900', color: color, lineHeight: '1', letterSpacing: '-2px' }}>
        {score}
      </span>
      <span style={{ fontSize: large ? '1.8rem' : '1.4rem', fontWeight: '700', color: '#cbd5e1' }}>
        /{total}
      </span>
    </div>
  </div>
);

export default StudentDashboard;
