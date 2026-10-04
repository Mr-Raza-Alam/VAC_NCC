import React, { useState, useEffect } from 'react';
import { useUI } from '../../context/UIContext';

const LiveTest = ({ testType, settings, onSubmit }) => {
  const { showFlash } = useUI();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // { questionId: selectedOption }
  const [timeLeft, setTimeLeft] = useState(settings?.duration ? settings.duration * 60 : 30 * 60); 
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [antiCheatTriggered, setAntiCheatTriggered] = useState(false);

  // Restore state resilience from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem(`vac_test_state_${testType}`);
    if (savedState) {
        try {
            const parsed = JSON.parse(savedState);
            const timePassed = Math.floor((Date.now() - parsed.timestamp) / 1000);
            const remaining = parsed.timeLeft - timePassed;
            if (remaining > 0) {
                setTimeLeft(remaining);
                setAnswers(parsed.answers || {});
            } else {
                setTimeLeft(1); // will trigger auto-submit next tick
            }
        } catch (e) {
            console.error("Failed to restore test state", e);
        }
    }
  }, [testType]);

  // Save state continuously when answers or timeLeft change
  useEffect(() => {
      if (isLoading || isSubmitting) return;
      localStorage.setItem(`vac_test_state_${testType}`, JSON.stringify({
          answers,
          timeLeft,
          timestamp: Date.now()
      }));
  }, [answers, timeLeft, testType, isLoading, isSubmitting]);

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

  // Anti-cheating mechanism (Tab visibility)
  useEffect(() => {
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden' && !isSubmitting && !isLoading) {
            setAntiCheatTriggered(true);
            handleAutoSubmit("Test auto-submitted due to tab switching (Anti-Cheating protocol triggered).");
        }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isLoading, isSubmitting]);

  const handleOptionChange = (qId, optionStr) => {
    setAnswers(prev => ({ ...prev, [qId]: optionStr }));
  };

  const handleAutoSubmit = (msg) => {
    showFlash(msg || "Auto-submitting your test...", "info");
    submitTestData();
  };

  const handleManualSubmit = () => {
    if (window.confirm("Are you sure you want to submit? You cannot change your answers after submitting.")) {
      submitTestData();
    }
  };

  const submitTestData = async () => {
    setIsSubmitting(true);
    const token = localStorage.getItem('studentToken');
    
    // Format answers array: [{ questionId, selectedOption }]
    const formattedAnswers = Object.keys(answers).map(qId => ({
      questionId: qId,
      selectedOption: answers[qId]
    }));

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/student/submit-test/${testType}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ answers: formattedAnswers })
      });
      const data = await res.json();
      if (res.ok) {
        showFlash("Test submitted successfully!", "success");
        localStorage.removeItem(`vac_test_state_${testType}`); // Clear saved state on success
        onSubmit(); // Callback to return to dashboard
      } else {
        showFlash(data.message || "Submission failed", "error");
        setIsSubmitting(false); // allow retry if it failed (e.g. network error)
      }
    } catch (err) {
      showFlash("Network error during submission", "error");
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (isLoading) return <div style={{ textAlign: 'center', padding: '50px' }}>Loading questions...</div>;

  return (
    <div style={{ paddingBottom: '100px' }}>
      
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
        marginBottom: '40px'
      }}>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{testType.replace('_', ' ').toUpperCase()}</h2>
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

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px' }}>
        {questions.length === 0 ? (
          <p>No questions found for this test.</p>
        ) : (
          questions.map((q, index) => (
            <div key={q._id} style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ fontSize: '1.2rem', color: '#1e293b', marginBottom: '20px', lineHeight: '1.6' }}>
                <span style={{ color: '#3b82f6', marginRight: '8px' }}>Q{index + 1}.</span> {q.text}
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {['A', 'B', 'C', 'D'].map(opt => (
                  <label 
                    key={opt}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '16px',
                      borderRadius: '8px',
                      border: answers[q._id] === opt ? '2px solid #3b82f6' : '1px solid #cbd5e1',
                      backgroundColor: answers[q._id] === opt ? '#eff6ff' : '#f8fafc',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontWeight: answers[q._id] === opt ? '600' : '400',
                    }}
                  >
                    <input 
                      type="radio" 
                      name={`q_${q._id}`} 
                      value={opt}
                      checked={answers[q._id] === opt}
                      onChange={() => handleOptionChange(q._id, opt)}
                      style={{ marginRight: '16px', transform: 'scale(1.2)' }}
                    />
                    <span style={{ width: '30px', fontWeight: 'bold', color: '#64748b' }}>{opt})</span>
                    <span>{q.options[opt]}</span>
                  </label>
                ))}
              </div>
            </div>
          ))
        )}

        {questions.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
            <button 
              onClick={handleManualSubmit}
              disabled={isSubmitting}
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                padding: '16px 60px',
                borderRadius: '30px',
                border: 'none',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                transition: 'transform 0.2s'
              }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Test'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveTest;
