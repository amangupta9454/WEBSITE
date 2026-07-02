import React, { useState, useEffect, useRef, useCallback } from "react";
import { Timer, Mic, MicOff, PhoneOff, AlertTriangle } from "lucide-react";
import Vapi from "@vapi-ai/web";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import AiAvatar from "./components/AiAvatar";
import { useFaceTracking } from "../../hooks/useFaceTracking";

function InterviewActive() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [interviewData, setInterviewData] = useState(null);
  
  const vapiRef = useRef(null);
  const isInitializing = useRef(false);
  const conversationRef = useRef([]);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [vapiError, setVapiError] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [fatalError, setFatalError] = useState("");
  const hasVapiErrorRef = useRef(false);

  const [time, setTime] = useState(0);
  const timerIntervalRef = useRef(null);
  const aiSpeechTimeoutRef = useRef(null);
  const userSpeechTimeoutRef = useRef(null);

  const candidateVideoRef = useRef(null);
  const candidateStreamRef = useRef(null);
  const [cameraError, setCameraError] = useState("");
  const [cameraActive, setCameraActive] = useState(false);

  const {
    faceDetected,
    gazeDirection,
    warningCount,
    warningMessage,
    attentionStats,
    isTrackerReady,
    getAttentionReport,
  } = useFaceTracking({ videoRef: candidateVideoRef, isActive: cameraActive });

  useEffect(() => {
    // Fetch session
    const fetchSession = async () => {
      try {
        const token = localStorage.getItem('interviewToken');
        // We actually just get it from the backend if we created a route for it, 
        // but we can also just fetch all my-sessions and find it.
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5004'}/api/interview-session/my-sessions`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          const session = res.data.sessions.find(s => s._id === sessionId);
          if (session) {
            setInterviewData(session);
          } else {
            setVapiError("Session not found");
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSession();
  }, [sessionId]);

  useEffect(() => {
    let stream = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
          audio: false,
        });
        candidateStreamRef.current = stream;
        if (candidateVideoRef.current) {
          candidateVideoRef.current.srcObject = stream;
          await candidateVideoRef.current.play();
        }
        setCameraActive(true);
        setCameraError("");
      } catch (err) {
        if (err.name === "NotAllowedError") {
          setCameraError("Camera permission denied.");
        } else {
          setCameraError("Camera unavailable. " + err.message);
        }
      }
    };
    startCamera();
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isCallActive) {
        setFatalError("Tab switch detected. Interview terminated to ensure fairness.");
        setTimeout(() => endCall(), 2000);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isCallActive]);

  useEffect(() => {
    if (!interviewData) return;
    try {
      // Setup VAPI
      const key = import.meta.env.VITE_VAPI_PUBLIC_API_KEY || '5195e2cd-7f02-4ec4-9d56-a9ff3360824b'; // Need to make sure this exists
      vapiRef.current = new Vapi(key);
    } catch (e) {
      console.error(e);
      return;
    }

    vapiRef.current.on("call-start", () => {
      isInitializing.current = false;
      setIsCallActive(true);
      startTimer();
    });

    vapiRef.current.on("call-end", async () => {
      isInitializing.current = false;
      setIsCallActive(false);
      stopTimer();
      setIsAiSpeaking(false);
      setIsUserSpeaking(false);
      
      await GenerateFeedback(conversationRef.current);
    });

    vapiRef.current.on("message", (msg) => {
      if (msg.type === "transcript") {
        conversationRef.current.push({ role: msg.role, transcript: msg.transcript });
        if (msg.role === "assistant") {
          if (msg.transcript?.trim()) setCurrentQuestion(msg.transcript);
          setIsAiSpeaking(true);
          clearTimeout(aiSpeechTimeoutRef.current);
          aiSpeechTimeoutRef.current = setTimeout(() => setIsAiSpeaking(false), 2000);
        } else {
          setIsUserSpeaking(true);
          clearTimeout(userSpeechTimeoutRef.current);
          userSpeechTimeoutRef.current = setTimeout(() => setIsUserSpeaking(false), 2000);
        }
      }
    });

    vapiRef.current.on("error", (err) => {
      isInitializing.current = false;
      hasVapiErrorRef.current = true;
      setVapiError(err.message || "An unexpected error occurred.");
    });
    
    startCall();

    return () => {
      vapiRef.current?.stop();
    };
  }, [interviewData]);

  const startTimer = () => {
    if (timerIntervalRef.current) return;
    timerIntervalRef.current = setInterval(() => setTime((p) => p + 1), 1000);
  };
  const stopTimer = () => {
    clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = null;
  };

  const GenerateFeedback = async (conversation) => {
    const attentionReport = getAttentionReport();
    
    // Send feedback generation request to backend
    // Since we don't have the ai-feedback endpoint implemented in this new backend, we will just send raw transcript for now
    try {
      const token = localStorage.getItem('interviewToken');
      await axios.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5004'}/api/interview-session/end`, {
        sessionId,
        status: 'Completed',
        feedback: {
            conversation,
            attentionMetrics: attentionReport
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error(err);
    } finally {
      if (localStorage.getItem('studentToken')) {
        navigate('/dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  };

  const startCall = () => {
    if (!vapiRef.current || isInitializing.current || isCallActive) return;
    isInitializing.current = true;

    const systemPrompt = `
You are an AI voice assistant conducting interviews.
Your job is to ask the candidate interview questions for the position of ${interviewData.jobTitle}.
The candidate has ${interviewData.experienceYears} experience.
This interview is strictly for ${interviewData.durationMinutes} minutes. You MUST wrap up the interview before this time limit.
Keep the conversation natural, friendly and engaging.
`.trim();

    const assistant = {
      name: "AI Interviewer",
      model: {
        provider: "openai",
        model: "gpt-3.5-turbo",
        messages: [{ role: "system", content: systemPrompt }],
      },
      voice: {
        provider: "openai",
        voiceId: "nova"
      },
      firstMessage: `Hi, ready for your interview for ${interviewData.jobTitle}?`,
    };

    navigator.mediaDevices.getUserMedia({ audio: true }).then(() => {
      vapiRef.current.start(assistant);
    }).catch(err => {
      setVapiError("Microphone access is required.");
    });
  };

  const endCall = useCallback(() => {
    if (vapiRef.current && isCallActive) {
      vapiRef.current.stop();
      setIsCallActive(false);
      stopTimer();
      navigate('/dashboard');
    }
  }, [isCallActive, navigate]);

  const toggleMic = () => {
    if (vapiRef.current?.mute) {
      vapiRef.current.mute(!isMuted);
      setIsMuted((p) => !p);
    }
  };

  if (!interviewData) return <div className="p-8">Loading interview...</div>;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 relative overflow-hidden font-sans">
      {/* Decorative background elements matching Code-A-Nova */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none rounded-b-[3rem]"></div>
      <div className="absolute top-20 right-10 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 pointer-events-none"></div>
      <div className="absolute top-40 left-10 w-96 h-96 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 pointer-events-none"></div>

      <div className="relative z-10 flex flex-col h-full flex-1">
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white/80 backdrop-blur-xl shadow-sm">
          <div>
            <h1 className="font-black text-xl text-slate-800 tracking-tight">{interviewData.jobTitle} Interview</h1>
          </div>
        <div className="flex items-center gap-2 px-5 py-2 rounded-xl font-mono font-bold bg-white border border-slate-200 shadow-sm text-slate-600">
          <Timer className="w-5 h-5 text-indigo-500" />
          <span>{Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-sm bg-emerald-50 text-emerald-700 border border-emerald-100">
          <div className={`w-2 h-2 rounded-full bg-emerald-500 ${isCallActive ? 'animate-ping' : ''}`}></div>
          {isCallActive ? "Live" : "Connecting..."}
        </div>
      </header>
      
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 p-8 max-w-7xl mx-auto w-full items-center">
        <div className="relative rounded-[2rem] overflow-hidden bg-white/50 backdrop-blur-sm border border-white shadow-xl h-[450px] flex items-center justify-center p-4 ring-1 ring-slate-900/5">
          <AiAvatar isSpeaking={isAiSpeaking} isListening={isCallActive && !isAiSpeaking} />
        </div>
        
        <div className="relative rounded-[2rem] overflow-hidden bg-white/50 backdrop-blur-sm border border-white shadow-xl h-[450px] p-2 ring-1 ring-slate-900/5">
          <div className="relative w-full h-full rounded-3xl overflow-hidden bg-slate-100">
            <video ref={candidateVideoRef} autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} />
            {cameraError && <div className="absolute inset-0 flex items-center justify-center bg-slate-800/90 text-white font-medium">{cameraError}</div>}
          </div>
        </div>
      </main>

      {currentQuestion && (
        <div className="px-6 py-5 bg-white/80 backdrop-blur-md border-y border-slate-200 shadow-sm">
          <div className="max-w-5xl mx-auto flex items-start gap-4">
            <span className="bg-indigo-600 text-white text-[10px] font-black tracking-wider uppercase px-3 py-1.5 rounded-lg shadow-sm shrink-0">AI Interviewer</span>
            <p className="text-slate-800 font-medium text-lg leading-relaxed">{currentQuestion}</p>
          </div>
        </div>
      )}

      {vapiError && (
         <div className="px-6 py-4 shrink-0 bg-transparent">
           <div className="px-5 py-4 rounded-2xl max-w-5xl mx-auto text-sm font-bold text-red-700 bg-red-50 border border-red-200 shadow-sm flex items-center gap-3">
             <AlertTriangle className="w-5 h-5" />
             {vapiError}
           </div>
         </div>
       )}

      <footer className="px-6 py-6 bg-white/80 backdrop-blur-xl border-t border-slate-200 flex justify-center gap-6 mt-auto">
        <button onClick={toggleMic} className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all ${isMuted ? 'bg-red-50 border-red-200 text-red-600 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 shadow-sm hover:shadow'}`}>
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>
        <button onClick={endCall} className="h-16 px-8 rounded-2xl flex items-center gap-3 font-bold bg-red-600 text-white shadow-lg shadow-red-600/20 hover:bg-red-700 hover:-translate-y-0.5 transition-all">
          <PhoneOff className="w-5 h-5" /> End Interview
        </button>
      </footer>
      </div>
    </div>
  );
}

export default InterviewActive;
