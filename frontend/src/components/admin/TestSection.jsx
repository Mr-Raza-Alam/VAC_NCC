import React, { useState } from 'react';
import { useUI } from '../../context/UIContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const TestSection = ({ students, activeSubTab, testStates, handleTestStateChange, tableData, handleTableDataChange, testSettings }) => {
  const { showFlash, showLoader, hideLoader } = useUI();
  const [filterLetter, setFilterLetter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState(null);

  const downloadTransparencyReport = async (phaseKey, format = 'csv') => {
    showLoader();
    try {
      const testTypeMap = { internal_1: 'Int-1', internal_2: 'Int-2', internal_3: 'Int-3' };
      const tType = testTypeMap[phaseKey];
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/test-management/transparency-report/${tType}`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message || 'Failed to fetch report');
      if (data.length === 0) return showFlash("No records found for this test.", "error");

      const originalHeaders = Array.from(new Set(data.flatMap(Object.keys)));
      const headers = ['S.No.', ...originalHeaders];

      if (format === 'csv') {
          const csvRows = [headers.join(',')];
          data.forEach((row, idx) => {
              const values = originalHeaders.map(header => {
                  const val = row[header] !== undefined && row[header] !== null ? row[header] : '';
                  return `"${String(val).replace(/"/g, '""')}"`;
              });
              csvRows.push(`${idx + 1},${values.join(',')}`);
          });
          const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.setAttribute('hidden', '');
          a.setAttribute('href', url);
          a.setAttribute('download', `Transparency_Report_${tType}.csv`);
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          showFlash("Transparency Report downloaded successfully!", "success");
      } else if (format === 'pdf') {
          const doc = new jsPDF();
          doc.text(`Transparency Report - ${tType}`, 14, 15);
          
          const rows = data.map((row, idx) => {
              const mappedRow = originalHeaders.map(h => row[h] !== undefined && row[h] !== null ? String(row[h]) : '');
              return [String(idx + 1), ...mappedRow];
          });
          
          autoTable(doc, {
              head: [headers],
              body: rows,
              startY: 20,
              styles: { fontSize: 8 },
              headStyles: { fillColor: [15, 23, 42] }
          });
          
          doc.save(`Transparency_Report_${tType}.pdf`);
          showFlash("Transparency Report PDF downloaded successfully!", "success");
      }
    } catch (err) {
      showFlash(err.message, "error");
    } finally {
      hideLoader();
    }
  };

  let filteredStudents = students.filter(st => {
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

  if (sortOrder) {
      filteredStudents.sort((a, b) => {
          let scoreA = 0;
          let scoreB = 0;

          if (activeSubTab.startsWith('internal_')) {
              const phaseMatch = activeSubTab.match(/internal_[123]/);
              const phaseKey = phaseMatch ? phaseMatch[0] : 'internal_1';
              scoreA = Number(tableData[a.vac_rollNo]?.[phaseKey]?.score) || 0;
              scoreB = Number(tableData[b.vac_rollNo]?.[phaseKey]?.score) || 0;
          } else if (activeSubTab.startsWith('practical_')) {
              scoreA = Number(tableData[a.vac_rollNo]?.practical?.score) || 0;
              scoreB = Number(tableData[b.vac_rollNo]?.practical?.score) || 0;
          } else if (activeSubTab.startsWith('ca_')) {
              const caA = tableData[a.vac_rollNo]?.ca;
              const caB = tableData[b.vac_rollNo]?.ca;
              scoreA = (caA?.ass && caA?.present) ? Number(caA.ass) + Number(caA.present) : 0;
              scoreB = (caB?.ass && caB?.present) ? Number(caB.ass) + Number(caB.present) : 0;
          }

          if (scoreA < scoreB) return sortOrder === 'asc' ? -1 : 1;
          if (scoreA > scoreB) return sortOrder === 'asc' ? 1 : -1;
          return 0;
      });
  }

  const renderFilterDropdown = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <label style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>Filter Name:</label>
      <select 
        value={filterLetter} 
        onChange={(e) => setFilterLetter(e.target.value)} 
        style={{ padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: 'white', color: '#1e293b' }}
      >
        <option value="">All (A-Z)</option>
        {Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map(letter => (
          <option key={letter} value={letter}>{letter}</option>
        ))}
      </select>
      <input 
        type="text" 
        placeholder="Search by Name or Roll No." 
        value={searchTerm} 
        onChange={e => setSearchTerm(e.target.value)} 
        style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', width: '250px', marginLeft: '10px' }} 
      />
    </div>
  );

  if (students.length === 0) {
    return (
      <div style={{ padding: '60px 40px', textAlign: 'center', backgroundColor: '#f1f5f9', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <p style={{ color: '#475569', fontSize: '1.1rem', fontWeight: '500' }}>
          Awaiting student records. The <strong>{activeSubTab.replace(/_/g, ' ')}</strong> table will automatically populate once the Admin uploads the VAC_Student record.
        </p>
      </div>
    );
  }

  let headers = [];
  let rowRender = null;

  if (activeSubTab.startsWith('internal_')) {
    const phaseMatch = activeSubTab.match(/internal_[123]/);
    const phaseKey = phaseMatch ? phaseMatch[0] : 'internal_1';
    const currentState = testStates[phaseKey];
    const isResultView = activeSubTab.endsWith('_result');
    const tName = phaseKey === 'internal_1' ? 'Int-1' : phaseKey === 'internal_2' ? 'Int-2' : 'Int-3';
    
    headers = ['Name', 'Roll No.', 'Dept.', 'Att.', tName];
    rowRender = (st) => (
      <>
        <td style={{ padding: '12px 16px', color: '#1e293b', fontWeight: '600' }}>{st.name}</td>
        <td style={{ padding: '12px 16px', color: '#1e293b' }}>{st.vac_rollNo}</td>
        <td style={{ padding: '12px 16px', color: '#1e293b' }}>{st.department}</td>
        <td style={{ padding: '12px 16px' }}>
          {!isResultView && currentState === 'pending' ? (
            <select 
              value={tableData[st.vac_rollNo]?.[phaseKey]?.att || ''}
              onChange={(e) => handleTableDataChange(st.vac_rollNo, phaseKey, 'att', e.target.value)}
              style={{ padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
            >
              <option value=""></option>
              <option value="P">P</option>
              <option value="A">A</option>
            </select>
          ) : (tableData[st.vac_rollNo]?.[phaseKey]?.att || (isResultView ? 'A' : '-'))}
        </td>
        <td style={{ padding: '12px 16px', color: '#94a3b8' }}>
          {(tableData[st.vac_rollNo]?.[phaseKey]?.score !== undefined && tableData[st.vac_rollNo]?.[phaseKey]?.score !== '')
             ? tableData[st.vac_rollNo][phaseKey].score 
             : (isResultView ? '0' : '-')}
        </td>
      </>
    );
  } else if (activeSubTab.startsWith('practical_')) {
    headers = ['Name', 'Roll No.', 'Dept.', 'Att.', 'Pract.'];
    rowRender = (st) => (
      <>
        <td style={{ padding: '12px 16px', color: '#1e293b', fontWeight: '600' }}>{st.name}</td>
        <td style={{ padding: '12px 16px', color: '#1e293b' }}>{st.vac_rollNo}</td>
        <td style={{ padding: '12px 16px', color: '#1e293b' }}>{st.department}</td>
        <td style={{ padding: '12px 16px' }}>
          {activeSubTab === 'practical_entry' && testStates.practical !== 'done' ? (
            <select 
              value={tableData[st.vac_rollNo]?.practical?.att || ''}
              onChange={(e) => handleTableDataChange(st.vac_rollNo, 'practical', 'att', e.target.value)}
              style={{ padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
            >
              <option value=""></option>
              <option value="P">P</option>
              <option value="A">A</option>
            </select>
          ) : (tableData[st.vac_rollNo]?.practical?.att || (activeSubTab === 'practical_result' ? 'A' : '-'))}
        </td>
        <td style={{ padding: '12px 16px' }}>
          {activeSubTab === 'practical_entry' && testStates.practical !== 'done' ? (
            <input 
              type="number" 
              max="20" 
              placeholder="0-20" 
              value={tableData[st.vac_rollNo]?.practical?.score || ''}
              onChange={(e) => handleTableDataChange(st.vac_rollNo, 'practical', 'score', e.target.value)}
              disabled={tableData[st.vac_rollNo]?.practical?.att === 'A'}
              style={{ padding: '4px 8px', width: '70px', border: '1px solid #cbd5e1', borderRadius: '4px' }} 
            />
          ) : ((tableData[st.vac_rollNo]?.practical?.score !== undefined && tableData[st.vac_rollNo]?.practical?.score !== '')
             ? tableData[st.vac_rollNo].practical.score 
             : (activeSubTab === 'practical_result' ? '0' : '-'))}
        </td>
      </>
    );
  } else if (activeSubTab.startsWith('ca_')) {
    headers = ['Name', 'Roll No.', 'Dept.', 'Att.', 'Ass.', 'Present.', 'CA'];
    rowRender = (st) => (
      <>
        <td style={{ padding: '12px 16px', color: '#1e293b', fontWeight: '600' }}>{st.name}</td>
        <td style={{ padding: '12px 16px', color: '#1e293b' }}>{st.vac_rollNo}</td>
        <td style={{ padding: '12px 16px', color: '#1e293b' }}>{st.department}</td>
        <td style={{ padding: '12px 16px' }}>
          {activeSubTab === 'ca_entry' && testStates.ca !== 'done' ? (
            <select 
              value={tableData[st.vac_rollNo]?.ca?.att || ''}
              onChange={(e) => handleTableDataChange(st.vac_rollNo, 'ca', 'att', e.target.value)}
              style={{ padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
            >
              <option value=""></option>
              <option value="P">P</option>
              <option value="A">A</option>
            </select>
          ) : (tableData[st.vac_rollNo]?.ca?.att || (activeSubTab === 'ca_result' ? 'A' : '-'))}
        </td>
        <td style={{ padding: '12px 16px' }}>
          {activeSubTab === 'ca_entry' && testStates.ca !== 'done' ? (
            <input 
              type="number" max="5" placeholder="/ 5" 
              value={tableData[st.vac_rollNo]?.ca?.ass || ''}
              onChange={(e) => handleTableDataChange(st.vac_rollNo, 'ca', 'ass', e.target.value)}
              disabled={tableData[st.vac_rollNo]?.ca?.att === 'A'}
              style={{ padding: '4px 8px', width: '60px', border: '1px solid #cbd5e1', borderRadius: '4px' }} 
            />
          ) : ((tableData[st.vac_rollNo]?.ca?.ass !== undefined && tableData[st.vac_rollNo]?.ca?.ass !== '') ? tableData[st.vac_rollNo].ca.ass : (activeSubTab === 'ca_result' ? '0' : '-'))}
        </td>
        <td style={{ padding: '12px 16px' }}>
          {activeSubTab === 'ca_entry' && testStates.ca !== 'done' ? (
            <input 
              type="number" max="5" placeholder="/ 5" 
              value={tableData[st.vac_rollNo]?.ca?.present || ''}
              onChange={(e) => handleTableDataChange(st.vac_rollNo, 'ca', 'present', e.target.value)}
              disabled={tableData[st.vac_rollNo]?.ca?.att === 'A'}
              style={{ padding: '4px 8px', width: '60px', border: '1px solid #cbd5e1', borderRadius: '4px' }} 
            />
          ) : ((tableData[st.vac_rollNo]?.ca?.present !== undefined && tableData[st.vac_rollNo]?.ca?.present !== '') ? tableData[st.vac_rollNo].ca.present : (activeSubTab === 'ca_result' ? '0' : '-'))}
        </td>
        <td style={{ padding: '12px 16px', color: '#1e3a8a', fontWeight: 'bold' }}>
          { (tableData[st.vac_rollNo]?.ca?.ass !== undefined && tableData[st.vac_rollNo]?.ca?.present !== undefined && tableData[st.vac_rollNo]?.ca?.ass !== '' && tableData[st.vac_rollNo]?.ca?.present !== '') 
              ? (Number(tableData[st.vac_rollNo].ca.ass) + Number(tableData[st.vac_rollNo].ca.present)) 
              : (activeSubTab === 'ca_result' ? '0' : '-') 
          }
        </td>
      </>
    );
  }

  // Dynamic Stats Calculation for P/A
  let presentCount = 0;
  if (activeSubTab.startsWith('internal_')) {
    const phaseKey = activeSubTab.match(/internal_[123]/)?.[0] || 'internal_1';
    presentCount = students.filter(st => {
      const record = tableData[st.vac_rollNo]?.[phaseKey];
      if (!record) return false;
      if (record.att === 'A') return false; // Strict override for manually marked Absentees
      return record.att === 'P' || (record.score !== undefined && record.score !== null && record.score !== '' && record.score !== '-');
    }).length;
  } else if (activeSubTab.startsWith('practical_')) {
    presentCount = students.filter(st => {
      const record = tableData[st.vac_rollNo]?.practical;
      if (!record) return false;
      if (record.att === 'A') return false;
      return record.att === 'P' || (record.score !== undefined && record.score !== null && record.score !== '' && record.score !== '-');
    }).length;
  } else if (activeSubTab.startsWith('ca_')) {
    presentCount = students.filter(st => {
      const record = tableData[st.vac_rollNo]?.ca;
      if (!record) return false;
      if (record.att === 'A') return false;
      return record.att === 'P';
    }).length;
  }
  const absentCount = students.length - presentCount;

  return (
    <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
      <div style={{ padding: '16px 24px', backgroundColor: '#eef2ff', borderBottom: '1px solid #c7d2fe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
           <div style={{ display: 'flex', flexDirection: 'column' }}>
             <span style={{ fontWeight: 'bold', color: '#1e3a8a', textTransform: 'capitalize', fontSize: '1.1rem' }}>
               {activeSubTab.replace(/_/g, ' ')}
             </span>
             <span style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px', fontWeight: '500' }}>
               Total : {students.length} | [P : {presentCount} / A : {absentCount} ]
             </span>
           </div>
           {renderFilterDropdown()}
         </div>
         
         {activeSubTab.endsWith('_entry') && activeSubTab.startsWith('internal_') && (
           <div style={{ display: 'flex', gap: '10px' }}>
             {(() => {
               const phaseKey = activeSubTab.match(/internal_[123]/)[0];
               const currentState = testStates[phaseKey];
               return (
                 <>
                   {currentState === 'pending' && (
                     <div style={{ display: 'flex', gap: '10px' }}>
                       <button onClick={() => handleTestStateChange(phaseKey, 'active')} style={{ backgroundColor: '#2563eb', color: 'white', padding: '6px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                         ▶ Activate Test
                       </button>
                       <button onClick={() => handleTestStateChange(phaseKey, 'canceled')} style={{ backgroundColor: '#ef4444', color: 'white', padding: '6px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                         ✖ Cancel Test
                       </button>
                     </div>
                   )}
                   {currentState === 'active' && (
                     <>
                       <span style={{ padding: '6px 16px', backgroundColor: '#fffbeb', color: '#b45309', borderRadius: '4px', fontWeight: 'bold', border: '1px solid #fde68a' }}>
                         Test in Progress...
                       </span>
                       <button onClick={() => handleTestStateChange(phaseKey, 'ready_to_finalize')} style={{ backgroundColor: '#475569', color: 'white', padding: '6px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                         [Dev: Force Ready]
                       </button>
                     </>
                   )}
                   {currentState === 'ready_to_finalize' && (
                     <button onClick={() => handleTestStateChange(phaseKey, 'done')} style={{ backgroundColor: '#16a34a', color: 'white', padding: '6px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                       ✔ Finalize Round
                     </button>
                   )}
                   {currentState === 'done' && (
                     <span style={{ padding: '6px 16px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '4px', fontWeight: 'bold', border: '1px solid #bbf7d0' }}>
                       Phase Completed
                     </span>
                   )}
                 </>
               );
             })()}
           </div>
         )}

         {activeSubTab.endsWith('_result') && activeSubTab.startsWith('internal_') && (
           <div style={{ display: 'flex', gap: '8px' }}>
             <button 
               onClick={() => downloadTransparencyReport(activeSubTab.match(/internal_[123]/)[0], 'csv')} 
               style={{ backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}
             >
               CSV
             </button>
             <button 
               onClick={() => downloadTransparencyReport(activeSubTab.match(/internal_[123]/)[0], 'pdf')} 
               style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}
             >
               PDF
             </button>
           </div>
         )}

         {/* Practical & CA Finalize Button */}
         {(activeSubTab === 'practical_entry' || activeSubTab === 'ca_entry') && (
           <div style={{ display: 'flex', gap: '10px' }}>
             <button 
               onClick={() => {
                  const phase = activeSubTab === 'practical_entry' ? 'practical' : 'ca';
                  handleTestStateChange(phase, 'done');
               }} 
               style={{ backgroundColor: '#16a34a', color: 'white', padding: '6px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
             >
               ✔ Finalize Round
             </button>
           </div>
         )}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
            {headers.map((h, idx) => {
              const isScoreCol = h === 'Int-1' || h === 'Int-2' || h === 'Int-3' || h === 'Pract.' || h === 'CA';
              return (
                <th 
                  key={idx} 
                  onClick={isScoreCol ? () => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc') : undefined}
                  style={{ 
                    padding: '12px 16px', 
                    textAlign: isScoreCol ? 'center' : 'left', 
                    color: isScoreCol ? '#1e3a8a' : '#475569', 
                    fontSize: '0.9rem',
                    cursor: isScoreCol ? 'pointer' : 'default',
                    fontWeight: isScoreCol ? 'bold' : 'normal'
                  }}
                  title={isScoreCol ? "Click to sort by Score" : ""}
                >
                  {h} {isScoreCol && (sortOrder === 'asc' ? '⬆️' : sortOrder === 'desc' ? '⬇️' : '↕️')}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {(() => {
             const phaseMatch = activeSubTab.match(/internal_[123]/);
             const phaseKey = phaseMatch ? phaseMatch[0] : null;
             if (phaseKey && testStates[phaseKey] === 'canceled') {
                 const setting = testSettings?.find(s => s.testType === (phaseKey === 'internal_1' ? 'Int-1' : phaseKey === 'internal_2' ? 'Int-2' : 'Int-3'));
                 return (
                     <tr>
                       <td colSpan={headers.length} style={{ padding: '60px', textAlign: 'center', backgroundColor: '#fef2f2' }}>
                           <h3 style={{ color: '#dc2626', margin: 0, fontSize: '1.8rem', fontWeight: 'bold' }}>This Phase was Canceled by Admin</h3>
                           <p style={{ color: '#991b1b', marginTop: '15px', fontSize: '1.2rem' }}><strong>Reason:</strong> {setting?.cancelReason || 'Not specified'}</p>
                       </td>
                     </tr>
                 );
             }
             
             if (filteredStudents.length === 0) {
                return <tr><td colSpan={headers.length} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>No students match the filter.</td></tr>;
             }
             
             return filteredStudents.map((st, i) => (
               <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                 {rowRender(st)}
               </tr>
             ));
          })()}
        </tbody>
      </table>
    </div>
  );
};

export default TestSection;
