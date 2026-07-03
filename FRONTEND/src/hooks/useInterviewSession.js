import { useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export function useInterviewSession(sessionId) {
  const navigate = useNavigate();
  const [interviewData, setInterviewData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const isFeedbackGenerating = useRef(false);

  const fetchSession = useCallback(async () => {
    try {
      const token = localStorage.getItem('interviewToken');
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/interview-session/my-sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        const session = res.data.sessions.find(s => s._id === sessionId);
        if (session) {
          setInterviewData(session);
          return session;
        } else {
          toast.error("Session not found");
        }
      }
    } catch (err) {
      console.error("Failed to fetch session:", err);
      toast.error("Failed to load interview session.");
    }
    return null;
  }, [sessionId]);

  const endSession = useCallback(async (status, conversation, attentionReport, recruiterMemory) => {
    if (isFeedbackGenerating.current) return;
    isFeedbackGenerating.current = true;
    setIsSaving(true);

    try {
      const token = localStorage.getItem('interviewToken');
      
      const payload = {
        sessionId,
        status
      };

      if (status === 'Completed' && conversation) {
        payload.feedback = {
          conversation,
          attentionMetrics: attentionReport,
          recruiterMemory
        };
      }

      const endRes = await axios.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/interview-session/end`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (status === 'Aborted') {
        toast.success("Interview aborted. You can re-practice.");
        setIsSaving(false);
        navigate('/dashboard');
        return;
      }

      if (endRes.status === 202) {
        toast.success("Interview ended! Generating AI feedback in the background...");
        
        // Fire and forget the heavy process
        axios.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/interview-session/process-evaluation/${sessionId}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(e => console.error("Process evaluation error:", e));

        // Poll for completion
        const pollInterval = setInterval(async () => {
          try {
            const statusRes = await axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/interview-session/status/${sessionId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (statusRes.data.success) {
              const currentStatus = statusRes.data.status;
              if (currentStatus === 'Completed' || currentStatus === 'Failed') {
                clearInterval(pollInterval);
                setIsSaving(false);
                if (currentStatus === 'Completed') toast.success("Feedback generation complete!");
                else toast.error("Failed to generate complete feedback.");
                navigate('/dashboard');
              }
            }
          } catch (pollErr) {
            console.error("Polling error:", pollErr);
          }
        }, 5000); // poll every 5 seconds
      } else {
        setIsSaving(false);
        navigate('/dashboard');
      }

    } catch (err) {
      console.error("End session error:", err);
      toast.error("Failed to save session data.");
      setIsSaving(false);
      navigate('/dashboard');
    }
  }, [sessionId, navigate]);

  return {
    interviewData,
    isSaving,
    fetchSession,
    endSession
  };
}
