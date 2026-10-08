import React, { useState, useEffect } from 'react';
import { useUI } from '../../context/UIContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const RecordSection = ({ students, fetchStudents, activeSubTab }) => {
  const [vacFile, setVacFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [filterLetter, setFilterLetter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [cutoffScore, setCutoffScore] = useState('');
  const [appliedCutoff, setAppliedCutoff] = useState(null);
  const [sortOrder, setSortOrder] = useState(null);

  // Edit/Delete Modal States
  const [editingStudent, setEditingStudent] = useState(null);
  const [isDeletingRoll, setIsDeletingRoll] = useState(null);
  const [masterData, setMasterData] = useState([]);
  const [isManualAdding, setIsManualAdding] = useState(false);
  const [manualStudents, setManualStudents] = useState([{ name: '', rollNo: '', department: '' }]);
  
  const { showFlash, showLoader, hideLoader } = useUI();

  useEffect(() => {
    if (activeSubTab === 'master_table') {
        const fetchMasterData = async () => {
            showLoader();
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/test-management/master-results`);
                if (response.ok) {
                    const data = await response.json();
                    setMasterData(data);
                }
            } catch (err) {
                console.error(err);
                showFlash("Failed to load master results", "error");
            } finally {
                hideLoader();
            }
        };
        fetchMasterData();
    }
  }, [activeSubTab]);

  const handleVacUpload = async () => {
    if (!vacFile) return showFlash("Please select a CSV or Excel file first!", "error");
    
    const formData = new FormData();
    formData.append('csvFile', vacFile);

    setIsUploading(true);
    showLoader();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/record/upload-vac-students`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (response.ok) {
        showFlash(data.message, "success");
        fetchStudents();
      } else {
        showFlash("Error: " + data.message, "error");
      }
    } catch (error) {
      showFlash("Server error during upload. Ensure the backend is running.", "error");
    } finally {
      setIsUploading(false);
      hideLoader();
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    showLoader();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/record/vac-students/manual-add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: manualStudents })
      });
      const data = await response.json();
      if (response.ok) {
        showFlash(data.message, "success");
        setIsManualAdding(false);
        setManualStudents([{ name: '', rollNo: '', department: '' }]);
        fetchStudents();
      } else {
        showFlash(data.message, "error");
      }
    } catch (error) {
      showFlash("Server error during manual addition", "error");
    } finally {
      hideLoader();
    }
  };

  const handleAddRow = () => {
      setManualStudents([...manualStudents, { name: '', rollNo: '', department: '' }]);
  };

  const handleRemoveRow = (index) => {
      const updated = manualStudents.filter((_, i) => i !== index);
      setManualStudents(updated);
  };

  const handleManualStudentChange = (index, field, value) => {
      const updated = [...manualStudents];
      updated[index][field] = value;
      setManualStudents(updated);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    showLoader();
    try {
      const encodedRoll = encodeURIComponent(editingStudent.vac_rollNo);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/record/vac-students/${encodedRoll}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingStudent)
      });
      const data = await response.json();
      if (response.ok) {
        showFlash(data.message, "success");
        setEditingStudent(null);
        fetchStudents();
      } else {
        showFlash(data.message, "error");
      }
    } catch (error) {
      showFlash("Server error during update", "error");
    } finally {
      hideLoader();
    }
  };

  const handleDelete = async (rollNo) => {
    showLoader();
    try {
      const encodedRoll = encodeURIComponent(rollNo);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/record/vac-students/${encodedRoll}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (response.ok) {
        showFlash(data.message, "success");
        setIsDeletingRoll(null);
        fetchStudents();
      } else {
        showFlash(data.message, "error");
      }
    } catch (error) {
      showFlash("Server error during deletion", "error");
    } finally {
      hideLoader();
    }
  };

  const getExportData = (dataToExport, filename) => {
      let headers = [];
      let rows = [];

      if (filename.includes("Master_Table")) {
          headers = ['S.No.', 'Name', 'Roll No.', 'Dept.', 'Int-1', 'Int-2', 'Int-3', 'Int-Score', 'CA', 'Pract.', 'Total'];
          rows = dataToExport.map((st, idx) => [
              idx + 1,
              st.name || '-',
              st.vac_rollNo || '-',
              st.department || '-',
              st.int1 ?? '-',
              st.int2 ?? '-',
              st.int3 ?? '-',
              st.intScore ?? '-',
              st.ca ?? '-',
              st.pract ?? '-',
              st.total ?? '-'
          ]);
      } else {
          headers = ['S.No.', 'Name', 'Roll No.', 'Department', 'Semester', 'Email', 'Mobile', 'Gender', 'Category', 'State', 'Guardian Contact', 'DOB'];
          rows = dataToExport.map((st, idx) => [
              idx + 1,
              st.name || '-',
              st.vac_rollNo || '-',
              st.department || '-',
              st.semester || '-',
              st.email || '-',
              st.mobile || '-',
              st.gender || '-',
              st.category || '-',
              st.state || '-',
              st.guardianContact || '-',
              st.dob ? new Date(st.dob).toLocaleDateString() : '-'
          ]);
      }
      return { headers, rows };
  };

  const exportCSV = (dataToExport, filename) => {
    if (!dataToExport || dataToExport.length === 0) {
        return showFlash("No data to export", "error");
    }
    
    const { headers, rows } = getExportData(dataToExport, filename);
    
    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const row of rows) {
        const values = row.map(val => `"${String(val).replace(/"/g, '""')}"`);
        csvRows.push(values.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const exportPDF = (dataToExport, filename) => {
    if (!dataToExport || dataToExport.length === 0) {
        return showFlash("No data to export", "error");
    }
    
    const doc = new jsPDF('landscape');
    const { headers, rows } = getExportData(dataToExport, filename);

    autoTable(doc, {
        head: [headers],
        body: rows,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [30, 58, 138] },
    });

    doc.save(`${filename}.pdf`);
  };

  let filteredStudents = (activeSubTab === 'master_table' ? masterData : students).filter(st => {
    let match = true;
    if (filterLetter) {
        match = st.name.toLowerCase().startsWith(filterLetter.toLowerCase());
    }
    if (match && searchTerm) {
        const term = searchTerm.toLowerCase();
        match = st.name.toLowerCase().includes(term) || st.vac_rollNo.toLowerCase().includes(term);
    }
    return match;
  });

  if (activeSubTab === 'master_table' && sortOrder) {
      filteredStudents.sort((a, b) => {
          const scoreA = Number(a.total) || 0;
          const scoreB = Number(b.total) || 0;
          if (scoreA < scoreB) return sortOrder === 'asc' ? -1 : 1;
          if (scoreA > scoreB) return sortOrder === 'asc' ? 1 : -1;
          return 0;
      });
  }

  const renderFilterAndSearch = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <label style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>Filter:</label>
        <select 
          value={filterLetter} 
          onChange={(e) => setFilterLetter(e.target.value)} 
          style={{ padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: 'white', color: '#1e293b' }}
        >
          <option value="">A-Z</option>
          {Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map(letter => (
            <option key={letter} value={letter}>{letter}</option>
          ))}
        </select>
      </div>
      <input 
        type="text" 
        placeholder="Search Name or Roll No..." 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', width: '200px' }}
      />
    </div>
  );

  const renderExportButtons = (filename, dataToExport = students) => (
      <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => exportCSV(dataToExport, filename)} style={{ backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>CSV</button>
          <button onClick={() => exportPDF(dataToExport, filename)} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>PDF</button>
      </div>
  );

  if (activeSubTab === 'vac_student') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {students.length === 0 && (
          <div style={{ padding: '30px', border: '2px dashed #cbd5e1', borderRadius: '8px', backgroundColor: '#f8fafc', textAlign: 'center' }}>
            <h3 style={{ color: '#334155', marginBottom: '10px', fontSize: '1.3rem' }}>Upload VAC Student Whitelist</h3>
            <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '20px' }}>Upload a CSV or Excel file containing the official <strong>Name, Roll No., and Dept.</strong> to prevent unauthorized registrations.</p>
            <div style={{ display: 'inline-block', textAlign: 'left', marginBottom: '20px' }}>
              <input type="file" accept=".csv, .xlsx" onChange={(e) => setVacFile(e.target.files[0])} style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', width: '300px', backgroundColor: 'white' }} />
            </div>
            <br />
            <button onClick={handleVacUpload} disabled={isUploading} style={{ backgroundColor: '#2563eb', color: 'white', padding: '10px 30px', border: 'none', borderRadius: '6px', cursor: isUploading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '1rem', transition: 'background-color 0.2s', opacity: isUploading ? 0.7 : 1 }}>
              {isUploading ? 'Uploading...' : 'Upload Record'}
            </button>
          </div>
        )}
        
        {students.length === 0 ? (
          <div style={{ padding: '60px 40px', textAlign: 'center', backgroundColor: '#f1f5f9', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <p style={{ color: '#475569', fontSize: '1.1rem', fontWeight: '500' }}>
              Awaiting student records. The table will automatically populate here once the Admin uploads the VAC_Student record.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ padding: '16px 24px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.1rem' }}>Raw Student Records</h3>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px', fontWeight: '500' }}>Total Students: {students.length} | Showing: {filteredStudents.length}</span>
                </div>
                {renderFilterAndSearch()}
                <button 
                  onClick={() => setIsManualAdding(true)} 
                  style={{ backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}
                >
                  ➕ Add Student Manually
                </button>
              </div>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                {renderExportButtons("VAC_Student_Records_Complete")}
                <div style={{ width: '1px', height: '24px', backgroundColor: '#cbd5e1' }}></div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="file" accept=".csv, .xlsx" onChange={(e) => setVacFile(e.target.files[0])} style={{ padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px', width: '150px', backgroundColor: 'white', fontSize: '0.8rem' }} />
                  <button onClick={handleVacUpload} disabled={isUploading} style={{ backgroundColor: '#0f172a', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: isUploading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
                    {isUploading ? '...' : 'Update'}
                  </button>
                </div>
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontSize: '0.9rem' }}>Name</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontSize: '0.9rem' }}>Roll No.</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontSize: '0.9rem' }}>Dept.</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontSize: '0.9rem' }}>Email-id</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontSize: '0.9rem' }}>State</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontSize: '0.9rem' }}>Category</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontSize: '0.9rem' }}>Gender</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontSize: '0.9rem' }}>Contact</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', color: '#475569', fontSize: '0.9rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((st, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px 16px', color: '#1e293b', fontWeight: '600' }}>{st.name}</td>
                    <td style={{ padding: '12px 16px', color: '#1e293b' }}>{st.vac_rollNo}</td>
                    <td style={{ padding: '12px 16px', color: '#1e293b' }}>{st.department}</td>
                    <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.9rem' }}>{st.email || '-'}</td>
                    <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.9rem' }}>{st.state || '-'}</td>
                    <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.9rem' }}>{st.category || '-'}</td>
                    <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.9rem' }}>{st.gender || '-'}</td>
                    <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.9rem' }}>{st.mobile || '-'}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                       <span onClick={() => setEditingStudent({...st})} style={{ cursor: 'pointer', marginRight: '10px' }} title="Edit">✏️</span>
                       <span onClick={() => setIsDeletingRoll(st.vac_rollNo)} style={{ cursor: 'pointer' }} title="Delete">🗑️</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Edit Modal */}
        {editingStudent && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '500px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                    <h3 style={{ marginTop: 0, color: '#1e293b' }}>Edit Student: {editingStudent.vac_rollNo}</h3>
                    <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', color: '#475569', fontSize: '0.9rem' }}>Name</label>
                            <input type="text" value={editingStudent.name} onChange={e => setEditingStudent({...editingStudent, name: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} required />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', color: '#475569', fontSize: '0.9rem' }}>Department</label>
                            <input type="text" value={editingStudent.department} onChange={e => setEditingStudent({...editingStudent, department: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} required />
                        </div>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#475569', fontSize: '0.9rem' }}>Email</label>
                                <input type="email" value={editingStudent.email || ''} onChange={e => setEditingStudent({...editingStudent, email: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#475569', fontSize: '0.9rem' }}>Mobile</label>
                                <input type="text" value={editingStudent.mobile || ''} onChange={e => setEditingStudent({...editingStudent, mobile: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                            <button type="button" onClick={() => setEditingStudent(null)} style={{ padding: '8px 16px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#475569', fontWeight: 'bold' }}>Cancel</button>
                            <button type="submit" style={{ padding: '8px 16px', backgroundColor: '#2563eb', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'white', fontWeight: 'bold' }}>Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeletingRoll && (
             <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
             <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '400px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                 <h3 style={{ marginTop: 0, color: '#ef4444' }}>Confirm Deletion</h3>
                 <p style={{ color: '#475569', marginBottom: '20px' }}>Are you sure you want to permanently delete student <strong>{isDeletingRoll}</strong>? This action cannot be undone.</p>
                 <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                     <button onClick={() => setIsDeletingRoll(null)} style={{ padding: '8px 16px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#475569', fontWeight: 'bold' }}>Cancel</button>
                     <button onClick={() => handleDelete(isDeletingRoll)} style={{ padding: '8px 16px', backgroundColor: '#ef4444', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'white', fontWeight: 'bold' }}>Delete</button>
                 </div>
             </div>
         </div>
        )}

        {/* Manual Add Modal */}
        {isManualAdding && (
             <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '500px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                    <h3 style={{ marginTop: 0, color: '#1e293b' }}>Add Student Manually</h3>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>Quickly add a student to the whitelist without uploading a CSV file.</p>
                    <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
                            {manualStudents.map((student, index) => (
                                <div key={index} style={{ padding: '15px', border: '1px solid #cbd5e1', borderRadius: '8px', marginBottom: '15px', backgroundColor: '#f8fafc', position: 'relative' }}>
                                    {manualStudents.length > 1 && (
                                        <button type="button" onClick={() => handleRemoveRow(index)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem' }} title="Remove Row">×</button>
                                    )}
                                    <h4 style={{ margin: '0 0 10px 0', color: '#475569', fontSize: '0.9rem' }}>Student {index + 1}</h4>
                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ display: 'block', marginBottom: '5px', color: '#475569', fontSize: '0.8rem', fontWeight: 'bold' }}>Name</label>
                                            <input type="text" value={student.name} onChange={e => handleManualStudentChange(index, 'name', e.target.value)} placeholder="John Doe" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} required />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ display: 'block', marginBottom: '5px', color: '#475569', fontSize: '0.8rem', fontWeight: 'bold' }}>Roll No.</label>
                                            <input type="text" value={student.rollNo} onChange={e => handleManualStudentChange(index, 'rollNo', e.target.value)} placeholder="VAC2401" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} required />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ display: 'block', marginBottom: '5px', color: '#475569', fontSize: '0.8rem', fontWeight: 'bold' }}>Department</label>
                                            <input type="text" value={student.department} onChange={e => handleManualStudentChange(index, 'department', e.target.value)} placeholder="CSE" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} required />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button type="button" onClick={handleAddRow} style={{ width: '100%', padding: '10px', backgroundColor: '#e2e8f0', border: '1px dashed #94a3b8', borderRadius: '4px', cursor: 'pointer', color: '#475569', fontWeight: 'bold' }}>
                                ➕ Add another student row
                            </button>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                            <button type="button" onClick={() => { setIsManualAdding(false); setManualStudents([{name:'', rollNo:'', department:''}]); }} style={{ padding: '10px 16px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#475569', fontWeight: 'bold' }}>Cancel</button>
                            <button type="submit" style={{ padding: '10px 16px', backgroundColor: '#4f46e5', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'white', fontWeight: 'bold' }}>Save All ({manualStudents.length})</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

      </div>
    );
  }

  if (activeSubTab === 'master_table') {
    return (
      <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <div style={{ padding: '16px 24px', backgroundColor: '#eef2ff', borderBottom: '1px solid #c7d2fe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
             <div style={{ display: 'flex', flexDirection: 'column' }}>
               <span style={{ fontWeight: 'bold', color: '#1e3a8a', fontSize: '1.1rem' }}>Master Table - Final Results</span>
               <span style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px', fontWeight: '500' }}>Total Students: {masterData.length} | Showing: {filteredStudents.length}</span>
             </div>
             {renderFilterAndSearch()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {renderExportButtons("Master_Table_Complete_Results", masterData)}
            <div style={{ width: '1px', height: '24px', backgroundColor: '#cbd5e1' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="number" placeholder="Cut-off %" value={cutoffScore} onChange={(e) => setCutoffScore(e.target.value)} style={{ padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', width: '90px' }} />
                <button onClick={() => setAppliedCutoff(Number(cutoffScore))} style={{ backgroundColor: '#1e3a8a', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>Apply Cut-off</button>
            </div>
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontSize: '0.9rem' }}>Name</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontSize: '0.9rem' }}>Roll No.</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontSize: '0.9rem' }}>Dept.</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', color: '#475569', fontSize: '0.9rem' }}>Int-1</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', color: '#475569', fontSize: '0.9rem' }}>Int-2</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', color: '#475569', fontSize: '0.9rem' }}>Int-3</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', color: '#475569', fontSize: '0.9rem' }}>Int-Score</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', color: '#475569', fontSize: '0.9rem' }}>CA</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', color: '#475569', fontSize: '0.9rem' }}>Pract.</th>
              <th 
                  onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')} 
                  style={{ padding: '12px 16px', textAlign: 'center', color: '#1e3a8a', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer' }}
                  title="Click to sort by Total Score"
              >
                  Total {sortOrder === 'asc' ? '⬆️' : sortOrder === 'desc' ? '⬇️' : '↕️'}
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'center', color: '#475569', fontSize: '0.9rem' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 ? (
              <tr><td colSpan="11" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>Awaiting student registration or no matches for filter.</td></tr>
            ) : (
              filteredStudents.map((st, i) => {
                let statusSpan = <span style={{ color: '#94a3b8' }}>-</span>;
                if (appliedCutoff !== null && st.total !== undefined) {
                    if (st.total >= appliedCutoff) {
                        statusSpan = <span style={{ color: '#16a34a', fontWeight: 'bold' }}>Pass</span>;
                    } else {
                        statusSpan = <span style={{ color: '#ef4444', fontWeight: 'bold' }}>Fail</span>;
                    }
                }

                return (
                  <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px 16px', color: '#1e293b', fontWeight: '600' }}>{st.name}</td>
                    <td style={{ padding: '12px 16px', color: '#1e293b' }}>{st.vac_rollNo}</td>
                    <td style={{ padding: '12px 16px', color: '#1e293b' }}>{st.department}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', color: '#475569' }}>{st.int1 ?? '-'}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', color: '#475569' }}>{st.int2 ?? '-'}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', color: '#475569' }}>{st.int3 ?? '-'}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', color: '#475569', fontWeight: '500' }}>{st.intScore ?? '-'}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', color: '#475569' }}>{st.ca ?? '-'}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', color: '#475569' }}>{st.pract ?? '-'}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', color: '#1e3a8a', fontWeight: 'bold' }}>{st.total ?? '-'}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>{statusSpan}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );
  }

  return null;
};

export default RecordSection;
