import React from 'react';

const BranchCard = ({ title, testType, settings, score, onStartTest, onViewResult }) => {
  // Determine state
  const isFinalized = settings?.isFinalized;
  const isActive = settings?.isActive;
  const isScheduled = !!settings?.testDate;
  let hasSubmitted = false;
  if (score && typeof score === 'object') {
    hasSubmitted = score.isSubmitted;
  } else {
    hasSubmitted = score !== undefined && score !== null && score !== 'N/A';
  }

  let statusText = "Not Scheduled Yet";
  let statusColor = "#64748b"; // gray
  let actionButton = null;

  if (settings?.isCanceled) {
    statusText = "CANCELED";
    statusColor = "#ef4444"; // red
    actionButton = (
      <div style={{ marginTop: '10px', color: '#991b1b', fontWeight: 'bold', textAlign: 'center' }}>
        This phase has been canceled by the Admin.
      </div>
    );
  } else if (isFinalized) {
    statusText = "Finalized - Results Published";
    statusColor = "#10b981"; // green
    actionButton = (
      <button onClick={() => onViewResult(testType)} style={btnStyle('#10b981')}>
        View Result
      </button>
    );
  } else if (hasSubmitted) {
    statusText = "Test Submitted. Awaiting Admin Finalization.";
    statusColor = "#f59e0b"; // orange/yellow
  } else if (isActive) {
    statusText = "Test is LIVE!";
    statusColor = "#ef4444"; // red/live
    actionButton = (
      <button onClick={() => onStartTest(testType)} style={btnStyle('#ef4444')}>
        Start Test
      </button>
    );
  } else if (isScheduled) {
    statusText = `Scheduled for: ${settings.testDate} at ${settings.startTime || 'TBD'}`;
    statusColor = "#3b82f6"; // blue
  }

  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: `2px solid ${statusColor}`,
      borderRadius: '16px',
      padding: '30px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      cursor: 'default',
      position: 'relative',
      overflow: 'hidden',
      opacity: settings?.isCanceled ? 0.6 : 1
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', backgroundColor: statusColor }}></div>
      <h3 style={{ color: '#1e293b', fontSize: '1.5rem', fontWeight: '800', marginBottom: '16px' }}>{title}</h3>
      <p style={{ color: statusColor, fontSize: '0.95rem', fontWeight: '600', textAlign: 'center', marginBottom: actionButton ? '24px' : '0' }}>
        {statusText}
      </p>
      {actionButton}
    </div>
  );
};

const btnStyle = (color) => ({
  backgroundColor: color,
  color: 'white',
  padding: '12px 24px',
  borderRadius: '8px',
  border: 'none',
  fontWeight: 'bold',
  fontSize: '1rem',
  cursor: 'pointer',
  transition: 'transform 0.1s ease',
  boxShadow: `0 4px 10px ${color}40`,
});

export default BranchCard;
