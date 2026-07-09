import React, { useState, useEffect, useRef, useCallback } from "react";
import { Logger } from '../../utils/logger';
import { INTERVIEW_ERRORS } from '../../constants/errors';
import { Timer, Mic, MicOff, PhoneOff, AlertTriangle, PlayCircle, WifiOff } from "lucide-react";
import { useParams } from "react-router-dom";
import AiAvatar from "./components/AiAvatar";
import { useFaceTracking } from "../../hooks/useFaceTracking";
import { useVapi, VAPI_STATES } from "../../hooks/useVapi";
import { useInterviewSession } from "../../hooks/useInterviewSession";
import { useNetworkResilience } from "../../hooks/useNetworkResilience";
import { useAudioDeviceManager } from "../../hooks/useAudioDeviceManager";
import { ERROR_MESSAGES } from "../../constants/errors";
import toast from "react-hot-toast";
import { InterviewTerminationController } from "../../utils/InterviewTerminationController";
function InterviewActive() {
  const { sessionId } = useParams();

  const { interviewData, isSaving, fetchSession, endSession } = useInterviewSession(sessionId);
  const { isOffline } = useNetworkResilience();
  const { deviceChanged } = useAudioDeviceManager();

  const {
    fsmState,
    isMuted,
    vapiError,
    currentQuestion,
    thinkingStatus,
    conversation,
    recruiterMemory,
    sessionMetrics,
    startCall,
    endCall,
    toggleMic,
    generateHealthScore
  } = useVapi(interviewData);

  const isStarted = fsmState !== VAPI_STATES.IDLE;
  const isCallActive = fsmState === VAPI_STATES.LISTENING || fsmState === VAPI_STATES.THINKING || fsmState === VAPI_STATES.SPEAKING;
  const isAiSpeaking = fsmState === VAPI_STATES.SPEAKING;

  const [showControls, setShowControls] = useState(true);

  // Timer logic
  const [time, setTime] = useState(0);
  const timeRef = useRef(0);
  const timerIntervalRef = useRef(null);

  // Camera logic
  const candidateVideoRef = useRef(null);
  const candidateStreamRef = useRef(null);
  const [cameraError, setCameraError] = useState("");
  const [cameraActive, setCameraActive] = useState(false);

  const {
    warningMessage,
    getAttentionReport,
  } = useFaceTracking({ videoRef: candidateVideoRef, isActive: cameraActive });

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Inject Correlation IDs
  useEffect(() => {
    Logger.setCorrelationIds({ sessionId, browser: navigator.userAgent });
  }, [sessionId]);

  // Handle device change notification
  useEffect(() => {
    if (deviceChanged && isStarted) {
      if (sessionMetrics) sessionMetrics.hardwareErrors++;
      Logger.warn(INTERVIEW_ERRORS.MIC_CHANGED || 'ERR_MIC_CHANGED');
      toast('Audio device changed. Ensure your headset is connected.', { icon: '🎧', duration: 4000 });
    }
  }, [deviceChanged, isStarted, sessionMetrics]);

  // Handle Network Connectivity
  useEffect(() => {
    const handleOffline = () => {
      if (sessionMetrics) sessionMetrics.networkDrops++;
      Logger.warn(INTERVIEW_ERRORS.NETWORK_OFFLINE || 'ERR_NETWORK', { state: fsmState });
    };
    const handleOnline = () => {
      Logger.info('Network Reconnected');
    };
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [fsmState, sessionMetrics]);

  // Hide Controls on Idle
  useEffect(() => {
    let timeout;
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 5000);
    };

    window.addEventListener("mousemove", handleMouseMove);
    timeout = setTimeout(() => setShowControls(false), 5000);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(timeout);
    };
  }, []);

  // Keyboard Accessibility
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isCallActive) return;
      if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        toggleMic();
      }
      if (e.code === 'Escape') {
        e.preventDefault();
        handleEndSession();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCallActive, toggleMic]);

  // Camera initialization
  useEffect(() => {
    let stream = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
          audio: false,
        });
        candidateStreamRef.current = stream;
        const video = candidateVideoRef.current;
        if (video) {
          // Reset srcObject first to force a fresh render cycle on some browsers
          video.srcObject = null;
          video.srcObject = stream;
          // Use loadedmetadata event instead of calling play() directly.
          // Calling play() while autoPlay is also set causes an AbortError race
          // condition that silently leaves the video black even though the camera is on.
          video.onloadedmetadata = () => {
            video.play().catch((e) => {
              console.warn("Camera play() failed:", e.message);
            });
          };
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

  // Tab switch cheat prevention
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isCallActive) {
        toast.error("Warning: Tab switch detected! In a real interview, this might lead to rejection.", { duration: 5000 });
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isCallActive]);

  // Sync Timer with Call State
  useEffect(() => {
    if (isCallActive && !isOffline) {
      if (!timerIntervalRef.current) {
        timerIntervalRef.current = setInterval(() => {
          setTime((p) => {
            timeRef.current = p + 1;
            return p + 1;
          });
        }, 1000);
      }
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  }, [isCallActive, isOffline]);

  // Auto-complete logic based on state machine ending naturally
  useEffect(() => {
    if (fsmState === VAPI_STATES.COMPLETED && !isSaving && isStarted) {
      const isRouterConcluded = true; // Standard mode relies on Vapi native end
      const allowed = InterviewTerminationController.requestTermination("VAPI_COMPLETED_STATE", { 
        elapsedSeconds: timeRef.current,
        isRouterConcluded
      });
      if (allowed) {
        handleEndSession(true);
      }
    }
  }, [fsmState, isSaving, isStarted, recruiterMemory]);

  const handleEndSession = useCallback(async (autoCompleted = false) => {
    if (!autoCompleted) {
      const allowed = InterviewTerminationController.requestTermination("USER_CLICKED_END", { 
        elapsedSeconds: timeRef.current 
      });
      if (!allowed) return;
      endCall(); // Instruct FSM to stop
    }

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    // Minimum valid time (e.g., 60s) for a completed interview
    if (timeRef.current < 60) {
      await endSession('Aborted', null, null, null);
    } else {
      const attentionReport = getAttentionReport();
      if (generateHealthScore) generateHealthScore();
      await endSession('Completed', conversation, attentionReport, recruiterMemory);
    }
  }, [endCall, endSession, conversation, getAttentionReport, recruiterMemory, generateHealthScore]);

  const handleStartInterview = () => {
    startCall();
  };

  const getFsmStatusDisplay = () => {
    if (isOffline) return "Offline - Reconnecting...";
    switch (fsmState) {
      case VAPI_STATES.CONNECTING: return "Connecting...";
      case VAPI_STATES.LISTENING: return "Listening...";
      case VAPI_STATES.THINKING: return "Thinking...";
      case VAPI_STATES.SPEAKING: return "Live Session";
      case VAPI_STATES.ENDING: return "Ending...";
      case VAPI_STATES.FAILED: return "Connection Failed";
      default: return "Ready";
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

  if (isSaving || fsmState === VAPI_STATES.PROCESSING) return (
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
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-100/50 via-blue-50/50 to-transparent pointer-events-none"></div>
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-indigo-200/40 rounded-full mix-blend-multiply filter blur-[120px] pointer-events-none animate-pulse duration-10000"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-200/40 rounded-full mix-blend-multiply filter blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 flex flex-col h-full flex-1">

        {/* Offline Banner */}
        {isOffline && (
          <div className="w-full bg-red-500 text-white text-center text-sm font-bold py-2 flex items-center justify-center gap-2 z-[100]">
            <WifiOff className="w-4 h-4" /> Internet connection lost. Pausing interview.
          </div>
        )}

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
              {getFsmStatusDisplay()}
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 w-full max-w-5xl mx-auto relative">

          {warningMessage && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-white px-6 py-3 rounded-2xl shadow-xl shadow-amber-500/20 flex items-center gap-3 z-50 animate-bounce">
              <AlertTriangle size={20} />
              <span className="font-bold">{warningMessage}</span>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-6 md:gap-12 w-full justify-center items-center">

            <div className="relative rounded-[2.5rem] overflow-hidden bg-white border-4 border-white shadow-2xl shadow-indigo-100 w-full max-w-[320px] aspect-[3/4] flex-shrink-0 group">
              <div className="absolute top-4 left-4 flex items-center gap-2 z-20">
                <span className="px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-md border border-slate-100 shadow-sm text-[10px] font-bold tracking-widest text-indigo-600 uppercase">AI Interviewer</span>
              </div>
              <div className="relative w-full h-full bg-slate-100">
                {!isStarted && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-white/80 backdrop-blur-md">
                    <button
                      onClick={handleStartInterview}
                      className="w-20 h-20 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-[0_0_30px_rgba(79,70,229,0.4)] hover:scale-105 transition-all flex items-center justify-center mb-4"
                      aria-label="Start Interview"
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

            <div className="relative rounded-[2.5rem] overflow-hidden bg-slate-900 border-4 border-white shadow-2xl shadow-slate-200 w-full max-w-[320px] aspect-[3/4] flex-shrink-0 group">
              <div className="absolute top-4 left-4 flex items-center gap-2 z-20">
                <span className="px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 shadow-sm text-[10px] font-bold tracking-widest text-emerald-400 uppercase">You</span>
              </div>
              <div className="relative w-full h-full bg-slate-900">
                <video ref={candidateVideoRef} autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} />

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

          <div className="mt-12 max-w-3xl text-center min-h-[100px] flex flex-col justify-center" aria-live="polite">
            {currentQuestion ? (
              <p className="text-xl md:text-3xl font-black text-slate-800 leading-tight animate-fade-in drop-shadow-sm">
                "{currentQuestion}"
              </p>
            ) : isStarted && !isOffline ? (
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">Waiting for response...</p>
            ) : null}
          </div>

          {isStarted && (
            <div
              className={`fixed bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/90 backdrop-blur-xl p-3 rounded-full shadow-2xl border border-slate-200 z-50 transition-all duration-700 ease-in-out ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20 pointer-events-none'}`}
              onMouseEnter={() => setShowControls(true)}
            >
              <button
                onClick={toggleMic}
                title={isMuted ? "Unmute (Space)" : "Mute (Space)"}
                aria-label={isMuted ? "Unmute Microphone" : "Mute Microphone"}
                className={`w-14 h-14 flex items-center justify-center rounded-full transition-all ${isMuted ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
              >
                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
              </button>
              <button
                onClick={() => handleEndSession(false)}
                title="End Interview (Esc)"
                aria-label="End Interview"
                className="w-14 h-14 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-full transition-all shadow-lg shadow-red-500/30 hover:scale-105"
              >
                <PhoneOff size={24} />
              </button>
            </div>
          )}
        </main>

        {vapiError && (
          <div className="px-8 pb-4 shrink-0 bg-transparent animate-fade-in z-50">
            <div className="px-6 py-4 rounded-2xl max-w-3xl mx-auto text-sm font-bold text-red-200 bg-red-950/50 border border-red-500/30 backdrop-blur-md flex items-center justify-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              {ERROR_MESSAGES[vapiError] || ERROR_MESSAGES.UNKNOWN_ERROR}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default InterviewActive;
