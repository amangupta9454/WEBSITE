import React, { useState, useEffect, useRef, useCallback } from "react";
import { Timer, Mic, MicOff, PhoneOff, AlertTriangle, PlayCircle } from "lucide-react";
import Vapi from "@vapi-ai/web";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import AiAvatar from "./components/AiAvatar";
import { useFaceTracking } from "../../hooks/useFaceTracking";
import toast from "react-hot-toast";

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
  const [isStarted, setIsStarted] = useState(false);
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
        toast.error("Warning: Tab switch detected! In a real interview, this might lead to rejection.", { duration: 5000 });
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
        if (msg.transcriptType === "final") {
          conversationRef.current.push({ role: msg.role, transcript: msg.transcript });
        }
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
      setVapiError(err.message || "An unexpected error occurred.");
    });
    
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
    if (time < 60) {
      toast("Interview ended too soon. You can retry it from the dashboard.", { icon: "ℹ️", duration: 5000 });
      if (localStorage.getItem('studentToken')) {
        navigate('/dashboard');
      } else {
        navigate('/dashboard');
      }
      return;
    }

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
You are an expert AI Technical Interviewer at a top-tier tech company. 
Your objective is to conduct a professional, rigorous, yet friendly interview for the position of "${interviewData.jobTitle}".
The candidate has "${interviewData.experienceYears}" of experience.

INTERVIEW GUIDELINES:
1. Start by welcoming the candidate and immediately ask a warm-up question related to their experience or the job role.
2. Ask one question at a time. DO NOT ask multiple questions in a single response. Wait for the candidate's answer.
3. Tailor the difficulty of your questions to their stated experience level (${interviewData.experienceYears}).
4. If their answer is shallow, ask a follow-up question to probe deeper (e.g., "Can you elaborate on how you handled the state management in that scenario?").
5. If they don't know the answer, politely move on to the next topic. Do not provide the full solution.
6. Cover a mix of theoretical concepts, practical problem-solving, and scenario-based questions relevant to ${interviewData.jobTitle}.
7. Keep your responses concise and conversational. You are a voice assistant, so avoid long monologues or reading code snippets.
8. This interview is strictly scheduled for ${interviewData.durationMinutes} minutes. You MUST wrap up the interview gracefully when the time is up.

Begin the interview now.
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

  if (!interviewData) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-indigo-400">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="font-bold tracking-widest uppercase text-sm animate-pulse">Initializing Setup...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19] text-slate-200 relative overflow-hidden font-sans selection:bg-indigo-500/30">
      {/* Decorative background elements matching Code-A-Nova */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-900/20 via-indigo-900/5 to-transparent pointer-events-none"></div>
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full mix-blend-screen filter blur-[120px] pointer-events-none animate-pulse duration-10000"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full mix-blend-screen filter blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 flex flex-col h-full flex-1">
        <header className="flex items-center justify-between px-8 py-5 border-b border-white/5 bg-[#0B0F19]/80 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="font-black text-white text-lg">C</span>
            </div>
            <div>
              <h1 className="font-black text-xl text-white tracking-tight">{interviewData.jobTitle}</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mock Interview</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono font-bold bg-white/5 border border-white/10 text-indigo-300 backdrop-blur-md">
              <Timer className="w-4 h-4 text-indigo-400" />
              <span className="text-sm">{Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}</span>
            </div>
            <div className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold backdrop-blur-md border ${isCallActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
              <div className={`w-2 h-2 rounded-full ${isCallActive ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse' : 'bg-amber-500'}`}></div>
              {isCallActive ? "Live" : "Connecting..."}
            </div>
          </div>
        </header>
      
        <main className="flex-1 flex flex-col md:flex-row gap-6 p-6 md:p-8 w-full max-w-[1400px] mx-auto items-stretch justify-center">
          
          {/* AI Avatar Side */}
          <div className="flex-1 relative rounded-3xl overflow-hidden bg-[#131B2C] border border-white/10 shadow-2xl flex flex-col min-h-[400px]">
            <div className="absolute top-4 left-6 flex items-center gap-2 z-20">
              <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/5 text-[10px] font-bold tracking-widest text-indigo-300 uppercase">AI Interviewer</span>
            </div>
            <div className="flex-1 flex items-center justify-center p-8 relative">
              {!isStarted && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-[#131B2C]/80 backdrop-blur-sm">
                  <button 
                    onClick={() => {
                      setIsStarted(true);
                      startCall();
                    }}
                    className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold text-lg shadow-[0_0_30px_rgba(79,70,229,0.5)] hover:scale-105 transition-all flex items-center gap-3"
                  >
                    <PlayCircle size={24} /> Start AI Interview
                  </button>
                  <p className="text-indigo-300/70 text-sm mt-4 font-medium tracking-wide">Ready when you are!</p>
                </div>
              )}
              {isAiSpeaking && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 bg-indigo-500/20 rounded-full blur-[50px] animate-pulse"></div>
                </div>
              )}
              <div className={`relative z-10 transform scale-125 transition-transform duration-700 ${!isStarted ? 'opacity-50 blur-sm' : ''}`}>
                <AiAvatar isSpeaking={isAiSpeaking} isListening={isCallActive && !isAiSpeaking} />
              </div>
            </div>
            
            {/* Real-time Subtitles Area */}
            <div className="h-32 bg-black/40 backdrop-blur-md border-t border-white/5 p-6 flex flex-col justify-end">
              {currentQuestion ? (
                <p className="text-lg md:text-xl font-medium text-white/90 leading-relaxed animate-fade-in drop-shadow-md">
                  "{currentQuestion}"
                </p>
              ) : (
                <p className="text-sm font-medium text-white/30 italic">AI is thinking...</p>
              )}
            </div>
          </div>
          
          {/* Candidate Video Side */}
          <div className="flex-1 relative rounded-3xl overflow-hidden bg-[#131B2C] border border-white/10 shadow-2xl flex flex-col min-h-[400px]">
             <div className="absolute top-4 left-6 flex items-center gap-2 z-20">
              <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/5 text-[10px] font-bold tracking-widest text-emerald-300 uppercase">You (Candidate)</span>
            </div>
            <div className="relative w-full h-full bg-black">
              <video ref={candidateVideoRef} autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-90 transition-opacity" style={{ transform: "scaleX(-1)" }} />
              
              {/* Subtle face tracking overlay effect (optional aesthetic) */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#131B2C] via-transparent to-transparent opacity-80 pointer-events-none"></div>

              {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-sm z-30">
                  <AlertTriangle className="w-10 h-10 text-red-500 mb-4" />
                  <div className="text-white font-medium text-center max-w-xs">{cameraError}</div>
                </div>
              )}
            </div>
          </div>
        </main>

        {vapiError && (
           <div className="px-8 pb-4 shrink-0 bg-transparent animate-fade-in">
             <div className="px-6 py-4 rounded-2xl max-w-3xl mx-auto text-sm font-bold text-red-200 bg-red-950/50 border border-red-500/30 backdrop-blur-md flex items-center justify-center gap-3">
               <AlertTriangle className="w-5 h-5 text-red-500" />
               {vapiError}
             </div>
           </div>
         )}

        <footer className="px-8 py-6 bg-[#0B0F19]/90 backdrop-blur-xl border-t border-white/5 flex items-center justify-center gap-6 mt-auto">
          <button 
            onClick={toggleMic} 
            className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 group ${isMuted ? 'bg-red-500/10 border-red-500/30 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.15)]' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white hover:border-white/20'}`}
          >
            {isMuted ? <MicOff className="w-6 h-6 group-hover:scale-110 transition-transform" /> : <Mic className="w-6 h-6 group-hover:scale-110 transition-transform" />}
          </button>
          
          <button 
            onClick={endCall} 
            className="h-16 px-10 rounded-2xl flex items-center gap-3 font-bold bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] transition-all duration-300 hover:-translate-y-1"
          >
            <PhoneOff className="w-5 h-5" /> 
            <span className="tracking-wide">End Interview</span>
          </button>
        </footer>
      </div>
    </div>
  );
}

export default InterviewActive;
