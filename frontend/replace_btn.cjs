const fs = require('fs'); 
const file = 'c:/Users/LENOVO/OneDrive/Desktop/VAC_NCC/frontend/src/components/admin/TestSection.jsx'; 
let content = fs.readFileSync(file, 'utf8'); 

// The emoji causes replace to fail with exact strings, so we use regex
const targetRegex = /<div style={{ display: 'flex', gap: '10px' }}>\s*<button\s*onClick={\(\) => downloadTransparencyReport[\s\S]*?<\/button>\s*<\/div>/;

const replacement = `<div style={{ display: 'flex', gap: '8px' }}>
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
           </div>`;

content = content.replace(targetRegex, replacement); 
fs.writeFileSync(file, content);
console.log("Successfully replaced buttons!");
