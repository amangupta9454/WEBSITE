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
  const [isSaving, setIsSaving] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hasVapiErrorRef = useRef(false);
  const isFeedbackGenerating = useRef(false);

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

  // Hide controls on idle
  useEffect(() => {
    let timeout;
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setShowControls(false);
      }, 5000);
    };

    window.addEventListener("mousemove", handleMouseMove);
    
    timeout = setTimeout(() => {
      setShowControls(false);
    }, 5000);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(timeout);
    };
  }, []);

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
      if (hasVapiErrorRef.current) return;
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
    if (isFeedbackGenerating.current) return;
    isFeedbackGenerating.current = true;

    setIsSaving(true);
    const attentionReport = getAttentionReport();
    
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
      toast.success("Interview completed! Feedback generated.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save feedback.");
    } finally {
      navigate('/dashboard');
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

  const endCall = useCallback(async () => {
    if (vapiRef.current && isCallActive) {
      setIsSaving(true);
      vapiRef.current.stop();
      setIsCallActive(false);
      stopTimer();
      await GenerateFeedback(conversationRef.current);
    }
  }, [isCallActive]);

  const toggleMic = () => {
    if (vapiRef.current?.mute) {
      vapiRef.current.mute(!isMuted);
      setIsMuted((p) => !p);
    }
  };

  if (!interviewData) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-indigo-600">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="font-bold tracking-widest uppercase text-sm animate-pulse text-indigo-500">Initializing Setup...</p>
      </div>
    </div>
  );

  if (isSaving) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-indigo-600">
      <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-3xl shadow-2xl border border-slate-200">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <h2 className="text-xl font-black text-slate-800">Generating Feedback...</h2>
        <p className="font-medium text-slate-500 text-sm max-w-xs text-center">Please wait while our AI analyzes your performance and generates a detailed report.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 relative overflow-hidden font-sans selection:bg-indigo-500/30">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-100/50 via-blue-50/50 to-transparent pointer-events-none"></div>
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-indigo-200/40 rounded-full mix-blend-multiply filter blur-[120px] pointer-events-none animate-pulse duration-10000"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-200/40 rounded-full mix-blend-multiply filter blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 flex flex-col h-full flex-1">
        <header className="flex items-center justify-between px-8 py-4 border-b border-slate-200 bg-white/80 backdrop-blur-xl shadow-sm z-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="font-black text-white text-lg">C</span>
            </div>
            <div>
              <h1 className="font-black text-xl text-slate-800 tracking-tight">{interviewData.jobTitle}</h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">AI Mock Interview</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono font-bold bg-indigo-50 border border-indigo-100 text-indigo-700">
              <Timer className="w-4 h-4 text-indigo-500" />
              <span className="text-sm">{Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}</span>
            </div>
            <div className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border ${isCallActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
              <div className={`w-2 h-2 rounded-full ${isCallActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-amber-500'}`}></div>
              {isCallActive ? "Live Session" : "Connecting..."}
            </div>
          </div>
        </header>
      
        <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 w-full max-w-5xl mx-auto relative">
          
          {/* Warning Message */}
          {warningMessage && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-white px-6 py-3 rounded-2xl shadow-xl shadow-amber-500/20 flex items-center gap-3 z-50 animate-bounce">
              <AlertTriangle size={20} />
              <span className="font-bold">{warningMessage}</span>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-6 md:gap-12 w-full justify-center items-center">
            
            {/* AI Avatar Side (Portrait) */}
            <div className="relative rounded-[2.5rem] overflow-hidden bg-white border-4 border-white shadow-2xl shadow-indigo-100 w-full max-w-[320px] aspect-[3/4] flex-shrink-0 group">
              <div className="absolute top-4 left-4 flex items-center gap-2 z-20">
                <span className="px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-md border border-slate-100 shadow-sm text-[10px] font-bold tracking-widest text-indigo-600 uppercase">AI Interviewer</span>
              </div>
              <div className="relative w-full h-full bg-slate-100">
                {!isStarted && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-white/80 backdrop-blur-md">
                    <button 
                      onClick={() => {
                        setIsStarted(true);
                        startCall();
                      }}
                      className="w-20 h-20 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-[0_0_30px_rgba(79,70,229,0.4)] hover:scale-105 transition-all flex items-center justify-center mb-4"
                    >
                      <PlayCircle size={40} />
                    </button>
                    <h3 className="font-black text-slate-800 text-lg">Start Session</h3>
                  </div>
                )}
                {isAiSpeaking && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-full h-full bg-indigo-400/10 blur-xl animate-pulse"></div>
                  </div>
                )}
                <div className={`relative z-10 w-full h-full transition-all duration-700 ${!isStarted ? 'opacity-30 blur-sm scale-110' : ''}`}>
                  <AiAvatar isSpeaking={isAiSpeaking} isListening={isCallActive && !isAiSpeaking} />
                </div>
              </div>
            </div>
            
            {/* Candidate Video Side (Portrait) */}
            <div className="relative rounded-[2.5rem] overflow-hidden bg-slate-900 border-4 border-white shadow-2xl shadow-slate-200 w-full max-w-[320px] aspect-[3/4] flex-shrink-0 group">
               <div className="absolute top-4 left-4 flex items-center gap-2 z-20">
                <span className="px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 shadow-sm text-[10px] font-bold tracking-widest text-emerald-400 uppercase">You</span>
              </div>
              <div className="relative w-full h-full bg-slate-900">
                <video ref={candidateVideoRef} autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} />
                
                {/* Subtle overlay for better text contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 pointer-events-none"></div>

                {cameraError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-sm z-30 p-6 text-center">
                    <AlertTriangle className="w-10 h-10 text-red-500 mb-4" />
                    <div className="text-white font-medium text-sm">{cameraError}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Real-time Subtitles Area */}
          <div className="mt-12 max-w-3xl text-center min-h-[100px] flex flex-col justify-center">
            {currentQuestion ? (
              <p className="text-xl md:text-3xl font-black text-slate-800 leading-tight animate-fade-in drop-shadow-sm">
                "{currentQuestion}"
              </p>
            ) : isStarted ? (
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">Waiting for response...</p>
            ) : null}
          </div>

          {/* Floating Controls */}
          {isStarted && (
            <div 
              className={`fixed bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/90 backdrop-blur-xl p-3 rounded-full shadow-2xl border border-slate-200 z-50 transition-all duration-700 ease-in-out ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20 pointer-events-none'}`}
              onMouseEnter={() => setShowControls(true)}
            >
               <button 
                 onClick={toggleMic} 
                 title={isMuted ? "Unmute" : "Mute"}
                 className={`w-14 h-14 flex items-center justify-center rounded-full transition-all ${isMuted ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
               >
                 {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
               </button>
               <button 
                 onClick={endCall} 
                 title="End Interview"
                 className="w-14 h-14 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-full transition-all shadow-lg shadow-red-500/30 hover:scale-105"
               >
                 <PhoneOff size={24} />
               </button>
            </div>
          )}
        </main>

        {vapiError && (
           <div className="px-8 pb-4 shrink-0 bg-transparent animate-fade-in">
             <div className="px-6 py-4 rounded-2xl max-w-3xl mx-auto text-sm font-bold text-red-200 bg-red-950/50 border border-red-500/30 backdrop-blur-md flex items-center justify-center gap-3">
               <AlertTriangle className="w-5 h-5 text-red-500" />
               {vapiError}
             </div>
           </div>
         )}

      </div>
    </div>
  );
}

export default InterviewActive;
