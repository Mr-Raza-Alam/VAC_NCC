import React, { useState, useEffect } from 'react';
import { useUI } from '../../context/UIContext';

const ALL_FEATURES = [
  'ACCESS_RECORD',
  'ACCESS_TEST',
  'ACCESS_SYSTEM_TEST_MGMT',
  'ACCESS_SYSTEM_ROLE_MGMT',
  'ACCESS_SYSTEM_SETTINGS'
];

const RoleManagement = () => {
  const [admins, setAdmins] = useState([]);
  const { showFlash, showLoader, hideLoader } = useUI();

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    showLoader();
    try {
      const response = await fetch('http://localhost:5000/api/auth/admins');
      if (response.ok) {
        const data = await response.json();
        setAdmins(data);
      }
    } catch (err) {
      console.error(err);
      showFlash("Failed to fetch admins", "error");
    } finally {
      hideLoader();
    }
  };

  const handleCheckboxChange = async (adminId, feature, isChecked) => {
    const adminToUpdate = admins.find(a => a._id === adminId);
    if (!adminToUpdate) return;
    
    // Lead admin check on frontend (also protected on backend)
    if (adminToUpdate.role === 'lead_admin') return;

    let updatedPermissions = [...(adminToUpdate.permissions || [])];
    
    if (isChecked) {
      if (!updatedPermissions.includes(feature)) updatedPermissions.push(feature);
    } else {
      updatedPermissions = updatedPermissions.filter(f => f !== feature);
    }

    // Optimistic UI update
    setAdmins(admins.map(a => a._id === adminId ? { ...a, permissions: updatedPermissions } : a));

    try {
      const response = await fetch(`http://localhost:5000/api/auth/admins/${adminId}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: updatedPermissions })
      });
      if (response.ok) {
        showFlash("Saved!", "success");
      } else {
        showFlash("Failed to save", "error");
        fetchAdmins(); // revert on failure
      }
    } catch (err) {
      console.error(err);
      showFlash("Network error", "error");
      fetchAdmins(); // revert on failure
    }
  };

  const formatFeatureName = (feature) => {
    return feature.replace('ACCESS_', '').replace(/_/g, ' ');
  };

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      <div style={{ padding: '16px 24px', backgroundColor: '#eef2ff', borderBottom: '1px solid #c7d2fe' }}>
        <h2 style={{ fontSize: '1.4rem', color: '#1e3a8a', margin: 0 }}>Role Management</h2>
        <p style={{ color: '#475569', fontSize: '0.9rem', margin: '4px 0 0 0' }}>Manage feature access permissions for portal administrators.</p>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '16px 24px', color: '#475569', fontSize: '0.85rem', fontWeight: 'bold' }}>USERNAME</th>
              <th style={{ padding: '16px 24px', color: '#475569', fontSize: '0.85rem', fontWeight: 'bold' }}>ROLE</th>
              <th style={{ padding: '16px 24px', color: '#475569', fontSize: '0.85rem', fontWeight: 'bold' }}>FEATURES ACCESS</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => {
              const isLead = admin.role === 'lead_admin';
              return (
                <tr key={admin._id} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: isLead ? '#f8fafc' : 'white' }}>
                  <td style={{ padding: '24px', color: '#1e293b', fontWeight: '600' }}>{admin.username}</td>
                  <td style={{ padding: '24px', color: '#64748b' }}>{admin.role}</td>
                  <td style={{ padding: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                      {ALL_FEATURES.map(feature => {
                        // For lead admin, we force checked and disabled.
                        const isChecked = isLead || (admin.permissions && admin.permissions.includes(feature));
                        
                        return (
                          <label key={feature} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: isLead ? 'not-allowed' : 'pointer' }}>
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              disabled={isLead}
                              onChange={(e) => handleCheckboxChange(admin._id, feature, e.target.checked)}
                              style={{ width: '16px', height: '16px', accentColor: '#2563eb', cursor: isLead ? 'not-allowed' : 'pointer' }}
                            />
                            <span style={{ fontSize: '0.85rem', color: isLead ? '#94a3b8' : '#334155', fontWeight: '500' }}>
                              {formatFeatureName(feature)}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RoleManagement;
