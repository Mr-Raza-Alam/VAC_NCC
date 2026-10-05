import React, { useState, useEffect } from 'react';
import { useUI } from '../../context/UIContext';

const TestManagement = () => {
  const [testType, setTestType] = useState('Int-1');
  const [duration, setDuration] = useState(30);
  const [marksPerQuestion, setMarksPerQuestion] = useState(1);
  const [resultsVisibility, setResultsVisibility] = useState('OFF');
  const [testDate, setTestDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isFinalized, setIsFinalized] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  
  // Document Upload States
  const [docFile, setDocFile] = useState(null);
  const [docType, setDocType] = useState('syllabus');
  
  const { showFlash, showLoader, hideLoader } = useUI();

  // Fetch settings whenever the testType changes
  useEffect(() => {
    fetchSettings();
  }, [testType]);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/test-management/settings/${testType}`);
      if (response.ok) {
        const data = await response.json();
        setDuration(data.duration || 30);
        setMarksPerQuestion(data.marksPerQuestion || 1);
        setResultsVisibility(data.resultsVisibility || 'OFF');
        
        setTestDate(data.testDate || '');
        setStartTime(data.startTime || '');
        setEndTime(data.endTime || '');
        
        setIsFinalized(data.isFinalized || false);
      }
    } catch (error) {
      console.error("Failed to fetch settings", error);
    }
  };

  const handleSaveSettings = async () => {
    showLoader();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/test-management/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testType,
          duration,
          marksPerQuestion,
          resultsVisibility,
          testDate: testDate || null,
          startTime: startTime || null,
          endTime: endTime || null,
          isFinalized
        })
      });
      const data = await response.json();
      if (response.ok) showFlash("Settings saved successfully!", "success");
      else showFlash("Error: " + data.message, "error");
    } catch (error) {
      showFlash("Server error", "error");
    } finally {
      hideLoader();
    }
  };

  const handleUploadCSV = async () => {
    if (!csvFile) return showFlash("Please select a CSV file first!", "error");
    
    const formData = new FormData();
    formData.append('testType', testType);
    formData.append('csvFile', csvFile);

    showLoader();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/test-management/upload-questions`, {
        method: 'POST',
        body: formData // No Content-Type header, fetch sets it automatically with boundary for FormData
      });
      const data = await response.json();
      if (response.ok) showFlash(data.message, "success");
      else showFlash("Error: " + data.message, "error");
    } catch (error) {
      showFlash("Server error during upload", "error");
    } finally {
      hideLoader();
    }
  };

  const handleUploadDocument = async () => {
    if (!docFile) return showFlash("Please select a PDF document first!", "error");
    
    const formData = new FormData();
    formData.append('type', docType); // 'syllabus' or 'notes'
    formData.append('pdf', docFile);

    showLoader();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/system/upload-document`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (response.ok) showFlash(data.message, "success");
      else showFlash("Error: " + data.message, "error");
    } catch (error) {
      showFlash("Server error during document upload", "error");
    } finally {
      hideLoader();
    }
  };

  const generateTemplate = () => {
    const headers = "QuestionText,Option1,Option2,Option3,Option4,CorrectAnswer\n";
    const sample = "What is the motto of NCC?,Unity and Discipline,Duty and Honor,Service before Self,Valor and Wisdom,Unity and Discipline\n";
    const blob = new Blob([headers + sample], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Questions_Template.csv';
    a.click();
  };

  return (
    <div style={{ padding: '0' }}>
      
      {/* Test Selection Dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
        <h2 style={{ fontSize: '1.4rem', color: '#1e293b', margin: 0 }}>Configure Test:</h2>
        <select 
          value={testType} 
          onChange={(e) => setTestType(e.target.value)}
          style={{ padding: '8px 16px', fontSize: '1.1rem', borderRadius: '6px', border: '2px solid #cbd5e1', fontWeight: 'bold', color: '#1e3a8a' }}
        >
          <option value="Int-1">Internal-1</option>
          <option value="Int-2">Internal-2</option>
          <option value="Int-3">Internal-3</option>
        </select>
      </div>

      {/* Status Overview Banner */}
      <div style={{ backgroundColor: '#eef2ff', padding: '16px 24px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', border: '1px solid #c7d2fe', marginBottom: '24px' }}>
        <div style={{ fontSize: '0.9rem', color: '#1e3a8a', fontWeight: 'bold', width: '100%' }}>
          <div style={{ marginBottom: '8px' }}>Status Overview ({testType})</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155', fontWeight: 'normal', fontSize: '0.85rem' }}>
            <span><strong>Timer:</strong> {duration} mins</span>
            <span><strong>Date:</strong> <span style={{ color: testDate ? '#16a34a' : '#d97706' }}>{testDate ? new Date(testDate).toLocaleDateString() : 'Not Set'}</span></span>
            <span><strong>Time:</strong> <span style={{ color: startTime ? '#16a34a' : '#d97706' }}>{startTime ? `${startTime} - ${endTime}` : 'To be Announced'}</span></span>
            <span><strong>Status:</strong> {isFinalized ? 'Finalized' : 'Draft'}</span>
            <span><strong>Results Visibility:</strong> {resultsVisibility}</span>
          </div>
        </div>
      </div>

      {/* Grid Layout for Settings and Window */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        
        {/* Test Settings Card */}
        <div style={{ backgroundColor: '#f8fafc', padding: '24px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1.2rem', color: '#1e293b', marginBottom: '20px', fontWeight: '600' }}>Test Settings</h3>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', color: '#475569', marginBottom: '6px' }}>Test Duration (minutes)</label>
            <input 
              type="number" 
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '4px' }} 
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', color: '#475569', marginBottom: '6px' }}>Marks per Question</label>
            <input 
              type="number" 
              step="0.1"
              min="0.1"
              value={marksPerQuestion}
              onChange={(e) => setMarksPerQuestion(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '4px' }} 
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', color: '#475569', marginBottom: '6px' }}>Results Visibility for Students</label>
            <select 
              value={resultsVisibility}
              onChange={(e) => setResultsVisibility(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
            >
              <option value="OFF">OFF (Only show total score)</option>
              <option value="ON">ON (Show detailed correct/incorrect)</option>
            </select>
          </div>

          <button onClick={handleSaveSettings} style={{ backgroundColor: '#0f172a', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
            SAVE SETTINGS
          </button>
        </div>

        {/* Test Window Card */}
        <div style={{ backgroundColor: '#f8fafc', padding: '24px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1.2rem', color: '#1e293b', marginBottom: '20px', fontWeight: '600' }}>Test Window (IST)</h3>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', color: '#475569', marginBottom: '6px' }}>Test Date</label>
            <input 
              type="date" 
              value={testDate}
              onChange={(e) => setTestDate(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '4px' }} 
            />
          </div>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.9rem', color: '#475569', marginBottom: '6px' }}>Start Time</label>
                <input 
                  type="time" 
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '4px' }} 
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.9rem', color: '#475569', marginBottom: '6px' }}>End Time</label>
                <input 
                  type="time" 
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '4px' }} 
                />
              </div>
          </div>



          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleSaveSettings} style={{ backgroundColor: '#0f172a', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
              SAVE WINDOW
            </button>
            <button 
              onClick={() => { setTestDate(''); setStartTime(''); setEndTime(''); setIsFinalized(false); }} 
              style={{ backgroundColor: '#b91c1c', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              CLEAR WINDOW
            </button>
          </div>
        </div>

      </div>

      {/* Question Bank Management Card */}
      <div style={{ backgroundColor: '#f8fafc', padding: '24px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '1.2rem', color: '#1e293b', marginBottom: '12px', fontWeight: '600' }}>Question Bank Management ({testType})</h3>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '24px' }}>
          Upload a CSV file to seamlessly <strong>append</strong> new questions to the current question bank for {testType}. The CSV must have specific columns.
        </p>

        <div style={{ marginBottom: '16px' }}>
          <input 
            type="file" 
            accept=".csv"
            onChange={(e) => setCsvFile(e.target.files[0])}
            style={{ padding: '8px', border: '1px dashed #cbd5e1', width: '100%', borderRadius: '4px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <button onClick={generateTemplate} style={{ backgroundColor: 'transparent', color: '#334155', border: '1px solid #cbd5e1', padding: '10px 20px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
            DOWNLOAD CSV TEMPLATE
          </button>
          <button onClick={handleUploadCSV} style={{ backgroundColor: '#0f172a', color: 'white', padding: '10px 24px', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
            UPLOAD QUESTIONS (CSV)
          </button>
        </div>
      </div>

      {/* Document (Syllabus/Notes) Management Card */}
      <div style={{ backgroundColor: '#f8fafc', padding: '24px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', color: '#1e293b', marginBottom: '12px', fontWeight: '600' }}>Study Material Management</h3>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '24px' }}>
          Upload official Syllabus and Notes for students. Documents are securely delivered via Cloudflare CDN.
        </p>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
          <select 
            value={docType} 
            onChange={(e) => setDocType(e.target.value)}
            style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
          >
            <option value="syllabus">Syllabus PDF</option>
            <option value="notesUnit1">Notes: Unit 1 PDF</option>
            <option value="notesUnit2">Notes: Unit 2 PDF</option>
            <option value="notesUnit3">Notes: Unit 3 PDF</option>
            <option value="notesUnit4">Notes: Unit 4 PDF</option>
            <option value="notesUnit5">Notes: Unit 5 PDF</option>
          </select>
          <input 
            type="file" 
            accept=".pdf"
            onChange={(e) => setDocFile(e.target.files[0])}
            style={{ padding: '8px', border: '1px dashed #cbd5e1', flex: 1, borderRadius: '4px' }}
          />
        </div>

        <button onClick={handleUploadDocument} style={{ backgroundColor: '#2563eb', color: 'white', padding: '10px 24px', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
          UPLOAD DOCUMENT
        </button>
      </div>

    </div>
  );
};

export default TestManagement;
