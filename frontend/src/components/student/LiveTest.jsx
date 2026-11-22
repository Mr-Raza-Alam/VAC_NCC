import React, { useState, useEffect, useRef } from 'react';
import { useUI } from '../../context/UIContext';

const LiveTest = ({ testType, settings, onSubmit }) => {
  const { showFlash } = useUI();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // { questionId: selectedOption }
  const answersRef = useRef({}); // Prevents stale closures in anti-cheat event listeners
  
  // Admin-configured duration is the single source of truth
  const configuredSeconds = (settings?.duration || 30) * 60;
  const [timeLeft, setTimeLeft] = useState(configuredSeconds); 
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingOrPromptingRef = useRef(false);
  const [antiCheatTriggered, setAntiCheatTriggered] = useState(false);
  const [warningCount, setWarningCount] = useState(0);
  const warningCountRef = useRef(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningReason, setWarningReason] = useState('');

  // 1-Question at a time + Live Question Tracking
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visited, setVisited] = useState({ 0: true });

  // Restore state resilience from localStorage (only for crash recovery mid-test)
  useEffect(() => {
    const savedState = localStorage.getItem(`vac_test_state_${testType}`);
    if (savedState) {
        try {
            const parsed = JSON.parse(savedState);
            if (parsed.warningCount !== undefined) {
                setWarningCount(parsed.warningCount);
                warningCountRef.current = parsed.warningCount;
            }
            if (parsed.currentIndex !== undefined) {
                setCurrentIndex(parsed.currentIndex);
            }
            if (parsed.visited) {
                setVisited(parsed.visited);
            }
            // Only restore if they actually had in-progress answers
            if (parsed.answers && Object.keys(parsed.answers).length > 0) {
                const timePassed = Math.floor((Date.now() - parsed.timestamp) / 1000);
                const remaining = parsed.timeLeft - timePassed;
                // Cap restored time to admin-configured duration (never exceed it)
                const cappedRemaining = Math.min(remaining, configuredSeconds);
                if (cappedRemaining > 0) {
                    setTimeLeft(cappedRemaining);
                    setAnswers(parsed.answers);
                    answersRef.current = parsed.answers;
                } else {
                    setTimeLeft(1); // will trigger auto-submit next tick
                }
            } else {
                // No real answers saved — fresh start, clear stale data
                localStorage.removeItem(`vac_test_state_${testType}`);
            }
        } catch (e) {
            console.error("Failed to restore test state", e);
            localStorage.removeItem(`vac_test_state_${testType}`);
        }
    }
  }, [testType, configuredSeconds]);

  // Save state continuously when answers or timeLeft change
  useEffect(() => {
      if (isLoading || isSubmitting) return;
      localStorage.setItem(`vac_test_state_${testType}`, JSON.stringify({
          answers,
          timeLeft,
          warningCount: warningCountRef.current,
          currentIndex,
          visited,
          timestamp: Date.now()
      }));
  }, [answers, timeLeft, warningCount, currentIndex, visited, testType, isLoading, isSubmitting]);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const token = localStorage.getItem('studentToken');
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/student/questions/${testType}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setQuestions(data);
        } else {
          showFlash(data.message || "Failed to load questions", "error");
          if (res.status === 403) {
            localStorage.removeItem(`vac_test_state_${testType}`);
            onSubmit();
          }
        }
      } catch (err) {
        showFlash("Network error", "error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuestions();
  }, [testType]);

  useEffect(() => {
    if (isLoading || isSubmitting) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit("Time is up! Auto-submitting your test...");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLoading, isSubmitting]);

  // Comprehensive Anti-cheating mechanism (1 Warning Grace: 0/1)
  useEffect(() => {
    if (isLoading || isSubmitting) return;

    const triggerAntiCheat = (reason) => {
        if (isSubmitting || isLoading || isSubmittingOrPromptingRef.current) return;

        if (warningCountRef.current === 0) {
            // First violation -> Strike 1 of 1 (0/1 -> 1/1)
            warningCountRef.current = 1;
            setWarningCount(1);
            setWarningReason(reason);
            isSubmittingOrPromptingRef.current = true;
            setShowWarningModal(true);
            showFlash("⚠️ Warning (1/1): Focus loss or tab switch detected!", "warning");
        } else {
            // Second violation -> Auto-submit
            setAntiCheatTriggered(true);
            handleAutoSubmit(`Test auto-submitted: Exceeded maximum allowed warnings (2nd violation: ${reason}).`);
        }
    };

    // 1. Tab Visibility Lock
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden' && !isSubmitting && !isLoading && !isSubmittingOrPromptingRef.current) {
            triggerAntiCheat("Tab switching or browser minimization");
        }
    };

    // 2. Window Blur Lock (Catches OS-level overlays like notifications, calls, split screen)
    const handleBlur = () => {
        if (!isSubmitting && !isLoading && !isSubmittingOrPromptingRef.current) {
            triggerAntiCheat("Loss of window focus (interacted with external app or notification)");
        }
    };

    // 3. Fullscreen Lock (If they exit fullscreen, they are penalized)
    const handleFullscreenChange = () => {
        if (!document.fullscreenElement && !isSubmitting && !isLoading && !isSubmittingOrPromptingRef.current) {
            triggerAntiCheat("Exited fullscreen mode");
        }
    };

    // 4. Disable Copy, Paste, Right Click
    const preventAction = (e) => e.preventDefault();

    // Try to enter fullscreen on mount
    try {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log(`Error attempting to enable fullscreen: ${err.message}`);
            });
        }
    } catch (e) {
       console.log("Fullscreen API not supported");
    }

    // Request Wake Lock to prevent natural screen timeout
    let wakeLock = null;
    const requestWakeLock = async () => {
        try {
            if ('wakeLock' in navigator) {
                wakeLock = await navigator.wakeLock.request('screen');
                console.log('Screen Wake Lock active');
            }
        } catch (err) {
            console.log(`Wake Lock error: ${err.message}`);
        }
    };
    requestWakeLock();

    // Attach all strict listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("contextmenu", preventAction); // Right click
    document.addEventListener("copy", preventAction);
    document.addEventListener("paste", preventAction);
    
    return () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        window.removeEventListener("blur", handleBlur);
        document.removeEventListener("fullscreenchange", handleFullscreenChange);
        document.removeEventListener("contextmenu", preventAction);
        document.removeEventListener("copy", preventAction);
        document.removeEventListener("paste", preventAction);
        
        // Exit fullscreen on cleanup
        if (document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen().catch(err => console.log(err));
        }

        // Release Wake Lock
        if (wakeLock !== null) {
            wakeLock.release().catch(err => console.log(err));
        }
    };
  }, [isLoading, isSubmitting]);

  const handleResumeFromWarning = () => {
    try {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch (e) {}

    setShowWarningModal(false);
    setTimeout(() => {
      isSubmittingOrPromptingRef.current = false;
    }, 500);
  };

  const handleOptionChange = (qId, optionStr) => {
    setAnswers(prev => {
      let updated;
      if (prev[qId] === optionStr) {
        // Tap selected option again to uncheck (toggle)
        updated = { ...prev };
        delete updated[qId];
      } else {
        updated = { ...prev, [qId]: optionStr };
      }
      answersRef.current = updated;
      return updated;
    });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      const nextIdx = currentIndex + 1;
      setVisited(prev => ({ ...prev, [nextIdx]: true }));
      setCurrentIndex(nextIdx);
    }
  };

  const handleJumpToQuestion = (idx) => {
    setVisited(prev => ({ ...prev, [idx]: true }));
    setCurrentIndex(idx);
  };

  const getCellStatus = (idx) => {
    if (idx === currentIndex) return 'current'; // Blue
    const q = questions[idx];
    if (q && answers[q._id]) return 'attempted'; // Green
    if (visited[idx]) return 'skipped'; // Red
    return 'untouched'; // Grey
  };

  const getCellStyle = (status) => {
    switch (status) {
      case 'current':
        return {
          backgroundColor: '#2563eb',
          color: '#ffffff',
          border: '2px solid #1d4ed8',
          boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.35)',
          fontWeight: 'bold'
        };
      case 'attempted':
        return {
          backgroundColor: '#16a34a',
          color: '#ffffff',
          border: '1px solid #15803d',
          fontWeight: 'bold'
        };
      case 'skipped':
        return {
          backgroundColor: '#dc2626',
          color: '#ffffff',
          border: '1px solid #b91c1c',
          fontWeight: 'bold'
        };
      case 'untouched':
      default:
        return {
          backgroundColor: '#f1f5f9',
          color: '#475569',
          border: '1px solid #cbd5e1',
          fontWeight: '500'
        };
    }
  };

  const handleAutoSubmit = (msg) => {
    showFlash(msg || "Auto-submitting your test...", "info");
    submitTestData();
  };

  const handleManualSubmit = () => {
    isSubmittingOrPromptingRef.current = true;
    if (window.confirm("Are you sure you want to submit? You cannot change your answers after submitting.")) {
      submitTestData();
    } else {
      setTimeout(() => {
        isSubmittingOrPromptingRef.current = false;
      }, 500);
    }
  };

  const submitTestData = async () => {
    setIsSubmitting(true);
    // Purge in-progress cached answers
    try {
      localStorage.removeItem(`vac_test_state_${testType}`);
    } catch (e) {
      console.error(e);
    }

    const token = localStorage.getItem('studentToken');
    
    // Format answers array: [{ questionId, selectedOption }]
    const currentAnswers = answersRef.current;
    const formattedAnswers = Object.keys(currentAnswers).map(qId => ({
      questionId: qId,
      selectedOption: currentAnswers[qId]
    }));

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/student/submit-test/${testType}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ answers: formattedAnswers }),
        keepalive: true
      });
      const data = await res.json();
      if (res.ok) {
        showFlash("Test submitted successfully!", "success");
      } else {
        showFlash(data.message || "Submission completed", "info");
      }
      onSubmit(); // Return to student dashboard
    } catch (err) {
      console.error("Submission network error:", err);
      showFlash("Test submitted.", "info");
      onSubmit(); // Even if backgrounded or network blipped, return to dashboard
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (isLoading) return <div style={{ textAlign: 'center', padding: '50px' }}>Loading questions...</div>;

  return (
    <div style={{ 
      paddingBottom: '100px',
      userSelect: 'none', // 5. Prevent text highlighting/selection globally
      WebkitUserSelect: 'none',
      msUserSelect: 'none'
    }}>
      
      {/* Anti-Cheating Strike 1 Warning Modal */}
      {showWarningModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
          boxSizing: 'border-box'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            maxWidth: '480px',
            width: '100%',
            padding: '30px 24px',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ fontSize: '2.8rem', marginBottom: '8px' }}>⚠️</div>
            <h2 style={{ color: '#dc2626', margin: '0 0 10px 0', fontSize: '1.4rem' }}>
              Anti-Cheating Warning
            </h2>
            <div style={{
              display: 'inline-block',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              padding: '6px 14px',
              borderRadius: '20px',
              fontWeight: '700',
              fontSize: '0.9rem',
              marginBottom: '16px'
            }}>
              Warning: (1/1) Used
            </div>
            <p style={{ color: '#334155', fontSize: '0.95rem', lineHeight: '1.6', margin: '0 0 16px 0' }}>
              {warningReason ? `Reason: ${warningReason}.` : "A window focus loss, tab switch, or app minimization was detected."}
            </p>
            <div style={{
              backgroundColor: '#fff1f2',
              color: '#991b1b',
              padding: '12px 14px',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: '600',
              border: '1px solid #fecdd3',
              marginBottom: '24px',
              textAlign: 'left',
              lineHeight: '1.5'
            }}>
              🚨 <strong>Final Warning:</strong> You have reached your limit (1/1). Any further tab switch, swipe gesture, notification touch, or app exit will <strong>PERMANENTLY auto-submit</strong> your test immediately.
            </div>
            <button
              onClick={handleResumeFromWarning}
              style={{
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                padding: '14px 28px',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '1rem',
                cursor: 'pointer',
                width: '100%',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
              }}
            >
              Resume Test & Re-enter Fullscreen 🚀
            </button>
          </div>
        </div>
      )}

      {/* STICKY TIMER (UI/UX Requirement) */}
      <div style={{
        position: 'sticky',
        top: 0, // stick to the top
        zIndex: 100,
        backgroundColor: '#1e3a8a',
        color: 'white',
        padding: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        borderBottomLeftRadius: '16px',
        borderBottomRightRadius: '16px',
        marginBottom: '40px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{testType.replace('_', ' ').toUpperCase()}</h2>
          <div style={{
            backgroundColor: warningCount > 0 ? '#ef4444' : 'rgba(255,255,255,0.15)',
            border: warningCount > 0 ? '1px solid #f87171' : '1px solid rgba(255,255,255,0.3)',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '0.82rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>⚠️ Warning:</span>
            <span>({warningCount}/1)</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>Time Left:</span>
          <span style={{ 
            fontSize: '1.8rem', 
            fontWeight: '900', 
            fontFamily: 'monospace',
            color: timeLeft < 60 ? '#fca5a5' : '#86efac' // turns red in last minute
          }}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* 2-Phase Test Workspace: Question Box (60%) + Live Question Track Box (40%) */}
      {questions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>
          No questions found for this test.
        </div>
      ) : (
        <div className="live-test-workspace">
          {/* Box 1: Left-side Dynamic Question Box */}
          <div className="live-question-box">
            {/* Question Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: '700', color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Single Choice
              </span>
            </div>

            {/* Question Text */}
            <h3 style={{ fontSize: '1.25rem', color: '#1e293b', marginBottom: '24px', lineHeight: '1.6', fontWeight: '600' }}>
              {questions[currentIndex]?.questionText}
            </h3>

            {/* 4 Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
              {questions[currentIndex]?.options?.map((optionText, optIdx) => {
                const optionLabel = String.fromCharCode(65 + optIdx); // A, B, C, D
                const qId = questions[currentIndex]._id;
                const isSelected = answers[qId] === optionText;

                return (
                  <label
                    key={optIdx}
                    onClick={() => handleOptionChange(qId, optionText)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '16px 20px',
                      borderRadius: '10px',
                      border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                      backgroundColor: isSelected ? '#eff6ff' : '#f8fafc',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      fontWeight: isSelected ? '600' : '400',
                      color: isSelected ? '#1e3a8a' : '#334155'
                    }}
                  >
                    <input
                      type="radio"
                      name={`q_${qId}`}
                      value={optionText}
                      checked={isSelected}
                      readOnly
                      style={{ marginRight: '16px', transform: 'scale(1.2)', accentColor: '#2563eb' }}
                    />
                    <span style={{ width: '28px', fontWeight: 'bold', color: isSelected ? '#2563eb' : '#64748b' }}>
                      {optionLabel})
                    </span>
                    <span style={{ fontSize: '1rem', lineHeight: '1.4' }}>{optionText}</span>
                  </label>
                );
              })}
            </div>

            {/* Bottom-right Action Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
              {currentIndex < questions.length - 1 ? (
                <button
                  onClick={handleNext}
                  style={{
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    padding: '12px 32px',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                    transition: 'background-color 0.2s ease'
                  }}
                >
                  Next ➔
                </button>
              ) : (
                <button
                  onClick={handleManualSubmit}
                  disabled={isSubmitting}
                  style={{
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    padding: '12px 36px',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(22, 163, 74, 0.3)',
                    transition: 'background-color 0.2s ease'
                  }}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Test 🚀'}
                </button>
              )}
            </div>
          </div>

          {/* Box 2: Right-side Live Question Track Box */}
          <div className="live-track-box">
            <h4 style={{ margin: '0 0 16px 0', color: '#1e293b', fontSize: '1.05rem', fontWeight: '700' }}>
              Live Question Track
            </h4>

            {/* 4 Dynamic Color Pellets Legend */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px 14px', marginBottom: '20px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.82rem', color: '#475569' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#2563eb', border: '1px solid #1d4ed8', display: 'inline-block', flexShrink: 0 }} />
                <span>Current</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#16a34a', border: '1px solid #15803d', display: 'inline-block', flexShrink: 0 }} />
                <span>Attempted</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#dc2626', border: '1px solid #b91c1c', display: 'inline-block', flexShrink: 0 }} />
                <span>Skipped</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', display: 'inline-block', flexShrink: 0 }} />
                <span>Untouched</span>
              </div>
            </div>

            {/* Grid of Question Cells */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(42px, 1fr))',
              gap: '10px',
              maxHeight: '380px',
              overflowY: 'auto',
              padding: '2px'
            }}>
              {questions.map((q, idx) => {
                const status = getCellStatus(idx);
                const cellStyle = getCellStyle(status);
                return (
                  <button
                    key={q._id || idx}
                    onClick={() => handleJumpToQuestion(idx)}
                    style={{
                      ...cellStyle,
                      height: '42px',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease'
                    }}
                    title={`Question ${idx + 1} (${status})`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Responsive layout styles */}
      <style dangerouslySetInnerHTML={{__html: `
        .live-test-workspace {
          display: flex;
          gap: 24px;
          max-width: 1150px;
          margin: 0 auto;
          padding: 0 20px 40px 20px;
          align-items: flex-start;
          box-sizing: border-box;
        }
        .live-question-box {
          flex: 1 1 60%;
          background: #ffffff;
          border-radius: 14px;
          padding: 28px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 14px rgba(0,0,0,0.03);
          display: flex;
          flex-direction: column;
          min-height: 440px;
          box-sizing: border-box;
        }
        .live-track-box {
          flex: 0 0 38%;
          background: #ffffff;
          border-radius: 14px;
          padding: 24px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 14px rgba(0,0,0,0.03);
          box-sizing: border-box;
          position: sticky;
          top: 90px;
        }
        @media (max-width: 768px) {
          .live-test-workspace {
            flex-direction: column;
            padding: 0 12px 30px 12px;
            gap: 16px;
          }
          .live-question-box {
            width: 100%;
            padding: 20px 16px;
            min-height: auto;
          }
          .live-track-box {
            width: 100%;
            padding: 18px 14px;
            position: static;
          }
        }
      `}} />
    </div>
  );
};

export default LiveTest;
