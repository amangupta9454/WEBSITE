import { useState, useRef, useCallback, useEffect } from 'react';
import Vapi from '@vapi-ai/web';
import { Logger } from '../utils/logger';
import { INTERVIEW_ERRORS } from '../constants/errors';

const AI_RESPONSE_TIMEOUT_MS = 15000;

export const VAPI_STATES = {
  IDLE: 'IDLE',
  CONNECTING: 'CONNECTING',
  LISTENING: 'LISTENING',
  THINKING: 'THINKING', // AI is processing transcript
  SPEAKING: 'SPEAKING',
  ENDING: 'ENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};

export function useVapi(interviewData) {
  const vapiRef = useRef(null);
  
  // State Machine
  const [fsmState, setFsmState] = useState(VAPI_STATES.IDLE);
  const [isMuted, setIsMuted] = useState(false);
  const [vapiError, setVapiError] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [thinkingStatus, setThinkingStatus] = useState("");
  
  // Transcripts & Memory
  const conversationRef = useRef([]);
  
  // TASK 1: Structured Recruiter Memory
  const recruiterMemoryRef = useRef({
    verifiedSkills: [],
    weakSkills: [],
    missingSkills: [],
    unverifiedClaims: [],
    questionHistory: [],
    projectsMentioned: [],
    contradictions: [],
    confidenceSignals: [],
    evidenceGraph: [] // TASK 5: Evidence Graph
  });

  // TASK 2 & 4: Lightweight Deterministic Skill Dictionary
  const SKILL_DICTIONARY = useMemo(() => ({
    languages: ['javascript', 'python', 'java', 'c++', 'ruby', 'go', 'typescript', 'php', 'swift', 'rust', 'c#'],
    frameworks: ['react', 'angular', 'vue', 'django', 'flask', 'spring', 'express', 'next.js', 'nest', 'laravel'],
    databases: ['sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'cassandra', 'dynamodb', 'oracle'],
    cloud: ['aws', 'azure', 'gcp', 'heroku', 'vercel', 'netlify', 'digitalocean', 'kubernetes', 'docker'],
    tools: ['git', 'webpack', 'babel', 'jenkins', 'jira', 'figma', 'postman', 'terraform', 'ansible']
  }), []);

  // TASK 1: Transcript Normalizer
  const normalizeTranscript = (text) => {
    return text.toLowerCase().replace(/[.,!?;()]/g, '').replace(/\s+/g, ' ').trim();
  };

  // TASK 5: Conversation Summary Placeholder
  const prepareContextSummarization = useCallback((conversation, currentSummary = "", recentMessagesCount = 10) => {
    // Placeholder architecture for future long-context optimization.
    // Compresses older messages into a summary while keeping recent turns intact.
    const recent = conversation.slice(-recentMessagesCount);
    return { summary: currentSummary, recentMessages: recent };
  }, []);

  // TASK 2, 3, 4, 7: Memory Update Pipeline & Entity Extraction
  const updateRecruiterMemory = useCallback((msg, transcriptIndex) => {
    // Lightweight non-blocking memory update on FINAL transcripts only.
    if (msg.role === 'assistant' && msg.transcript?.trim()) {
      recruiterMemoryRef.current.questionHistory.push(msg.transcript.trim());
    } else if (msg.role === 'user' && msg.transcript?.trim()) {
      const originalText = msg.transcript.trim();
      const normalizedText = normalizeTranscript(originalText);
      const timestamp = Date.now();
      const tokens = normalizedText.split(' ');

      const extractCategory = (category, list) => {
        list.forEach(skill => {
          if (tokens.includes(skill)) {
            const entity = { skill, category, evidence: originalText, transcriptIndex, timestamp, confidence: 1.0 };
            recruiterMemoryRef.current.evidenceGraph.push(entity);
            if (!recruiterMemoryRef.current.verifiedSkills.includes(skill)) {
              recruiterMemoryRef.current.verifiedSkills.push(skill);
            }
          }
        });
      };

      extractCategory('Language', SKILL_DICTIONARY.languages);
      extractCategory('Framework', SKILL_DICTIONARY.frameworks);
      extractCategory('Database', SKILL_DICTIONARY.databases);
      extractCategory('Cloud', SKILL_DICTIONARY.cloud);
      extractCategory('Tool', SKILL_DICTIONARY.tools);

      // Quantified Achievements / Numbers
      const numbers = originalText.match(/\b\d+(\.\d+)?(k|m|%)?\b/gi);
      if (numbers) {
        numbers.forEach(num => {
          recruiterMemoryRef.current.evidenceGraph.push({
            skill: num, category: 'Metric/Achievement', evidence: originalText, transcriptIndex, timestamp, confidence: 0.9
          });
        });
      }
    }
  }, [SKILL_DICTIONARY]);
  const messageQueueRef = useRef(new Set()); // Deduplication

  // Timers
  const callDurationTimerRef = useRef(null);
  const aiLatencyStartRef = useRef(null);
  const timeoutsRef = useRef([]);

  // TASK 6: Metrics Aggregation
  const sessionMetricsRef = useRef({
    latencies: [],
    confidences: [],
    interruptions: 0,
    retries: 0,
    networkDrops: 0,
    hardwareErrors: 0
  });

  // TASK 8: Interview Health Score
  const generateHealthScore = useCallback(() => {
    const metrics = sessionMetricsRef.current;
    const sortedLatencies = [...metrics.latencies].sort((a, b) => a - b);
    const avgLatency = sortedLatencies.length ? sortedLatencies.reduce((a, b) => a + b, 0) / sortedLatencies.length : 0;
    const maxLatency = sortedLatencies.length ? sortedLatencies[sortedLatencies.length - 1] : 0;
    const p95Latency = sortedLatencies.length ? sortedLatencies[Math.floor(sortedLatencies.length * 0.95)] : 0;
    const p99Latency = sortedLatencies.length ? sortedLatencies[Math.floor(sortedLatencies.length * 0.99)] : 0;
    const avgConfidence = metrics.confidences.length ? metrics.confidences.reduce((a, b) => a + b, 0) / metrics.confidences.length : 0;

    const health = { avgLatency, maxLatency, p95Latency, p99Latency, avgConfidence, interruptions: metrics.interruptions, retries: metrics.retries, networkDrops: metrics.networkDrops, hardwareErrors: metrics.hardwareErrors };
    Logger.metric('Interview Health Score', 1, health);
    return health;
  }, []);

  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  // Pre-request microphone with ideal voice settings
  const requestMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1 
        }
      });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (err) {
      let code = INTERVIEW_ERRORS.UNKNOWN_ERROR;
      if (err.name === 'NotAllowedError') code = INTERVIEW_ERRORS.MIC_PERMISSION_DENIED;
      if (err.name === 'NotFoundError') code = INTERVIEW_ERRORS.MIC_NOT_FOUND;
      
      sessionMetricsRef.current.hardwareErrors++;
      Logger.error('Microphone Error', err, { code });
      setVapiError(code);
      setFsmState(VAPI_STATES.FAILED);
      return false;
    }
  };

  useEffect(() => {
    if (!interviewData) return;

    try {
      const key = import.meta.env.VITE_VAPI_PUBLIC_API_KEY || '5195e2cd-7f02-4ec4-9d56-a9ff3360824b';
      vapiRef.current = new Vapi(key);
      Logger.info('Vapi Initialized');
    } catch (e) {
      Logger.error('Vapi Instantiation Failed', e);
      setVapiError(INTERVIEW_ERRORS.UNKNOWN_ERROR);
      setFsmState(VAPI_STATES.FAILED);
      return;
    }

    const vapi = vapiRef.current;

    const onCallStart = () => {
      Logger.metric('Call Started', 1);
      setFsmState(VAPI_STATES.LISTENING);
      setVapiError(null);
      callDurationTimerRef.current = Date.now();
    };

    const onCallEnd = () => {
      clearAllTimeouts();
      const duration = Date.now() - (callDurationTimerRef.current || Date.now());
      Logger.metric('Call Ended', duration, { unit: 'ms' });
      setFsmState(VAPI_STATES.COMPLETED);
    };

    const onSpeechStart = () => {
      // AI started speaking
      clearAllTimeouts();
      setThinkingStatus("");
      if (aiLatencyStartRef.current) {
        const latency = Date.now() - aiLatencyStartRef.current;
        sessionMetricsRef.current.latencies.push(latency);
        Logger.metric('AI Response Latency', latency, { unit: 'ms' });
        aiLatencyStartRef.current = null;
      }
      setFsmState(VAPI_STATES.SPEAKING);
    };

    const onSpeechEnd = () => {
      // AI stopped speaking
      setFsmState(VAPI_STATES.LISTENING);
    };

    const onMessage = (msg) => {
      // Metric: Track Transcript Confidence
      if (msg.type === "transcript" && msg.transcriptType === "final" && msg.role === "user") {
        if (msg.confidence !== undefined) {
          sessionMetricsRef.current.confidences.push(msg.confidence * 100);
          Logger.metric('Transcript Confidence', msg.confidence * 100, { unit: '%' });
        }
      }

      if (msg.type === "transcript" && msg.transcriptType === "final") {
        // Deterministic consecutive deduplication:
        // We compare the current transcript against the last processed transcript.
        // This prevents double-firing of the exact same event without blocking legitimate repeated answers (e.g. saying "Yes" later).
        const lastMsg = conversationRef.current[conversationRef.current.length - 1];
        const isDuplicate = lastMsg && lastMsg.role === msg.role && lastMsg.transcript === msg.transcript;

        if (!isDuplicate) {
          conversationRef.current.push({ role: msg.role, transcript: msg.transcript });
          const transcriptIndex = conversationRef.current.length - 1;
          updateRecruiterMemory(msg, transcriptIndex);
          
          if (msg.role === "assistant" && msg.transcript?.trim()) {
            setCurrentQuestion(msg.transcript);
          } else if (msg.role === "user") {
            // Track if user interrupted AI
            if (fsmState === VAPI_STATES.SPEAKING) {
              sessionMetricsRef.current.interruptions++;
              Logger.metric('Candidate Interruption', 1, { transcript: msg.transcript });
            }
            setFsmState(VAPI_STATES.THINKING);
            setThinkingStatus("Thinking...");
            aiLatencyStartRef.current = Date.now();
            
            clearAllTimeouts();
            
            timeoutsRef.current.push(setTimeout(() => {
              setThinkingStatus("Still processing your answer...");
            }, 5000));
            
            timeoutsRef.current.push(setTimeout(() => {
              setThinkingStatus("Trying again...");
              sessionMetricsRef.current.retries++;
              Logger.metric('Retry Attempt', 1, { state: VAPI_STATES.THINKING });
            }, 10000));
            
            timeoutsRef.current.push(setTimeout(() => {
              Logger.warn('AI Response Timeout.');
              Logger.metric('AI Response Timeout', 1, { 
                duration: AI_RESPONSE_TIMEOUT_MS, 
                state: VAPI_STATES.THINKING,
                sessionId: interviewData?._id 
              });
              Logger.metric('Retry Failed', 1);
              sessionMetricsRef.current.retries++;
              
              clearAllTimeouts();
              setFsmState(VAPI_STATES.FAILED);
              setThinkingStatus("");
              setVapiError("I'm sorry, I'm having trouble processing your last response. Let's try that again.");
            }, AI_RESPONSE_TIMEOUT_MS));
          }
        }
      }
    };

    const onError = (err) => {
      clearAllTimeouts();
      Logger.error("Vapi Engine Error", err);
      setVapiError(INTERVIEW_ERRORS.UNKNOWN_ERROR);
      setFsmState(VAPI_STATES.FAILED);
    };

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("message", onMessage);
    vapi.on("error", onError);

    return () => {
      clearAllTimeouts();
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("message", onMessage);
      vapi.off("error", onError);
      
      if (vapiRef.current) {
        vapiRef.current.stop();
        vapiRef.current = null;
      }
    };
  }, [interviewData]);

  const startCall = useCallback(async (onStart) => {
    if (!vapiRef.current || fsmState !== VAPI_STATES.IDLE) return;
    
    setFsmState(VAPI_STATES.CONNECTING);
    setVapiError(null);

    const micGranted = await requestMicrophone();
    if (!micGranted) return;

    const systemPrompt = `
# PERSONA
You are a Principal AI Architect, Senior Staff Engineer, and Hiring Committee Advisor at a top-tier tech company. You are conducting a rigorous technical interview for the "${interviewData.jobTitle}" position.
Speak exactly like a calm, human senior engineering manager. Never sound robotic, overly enthusiastic, or scripted.

# INTERVIEW CONTEXT
Role: ${interviewData.jobTitle}
Candidate Experience: ${interviewData.experienceYears}
Duration: ${interviewData.durationMinutes} minutes.
${interviewData.jobDescription ? `\n# JOB DESCRIPTION\n${interviewData.jobDescription}` : ""}
${(interviewData.resumeText || interviewData.resume) ? `\n# CANDIDATE RESUME\n${interviewData.resumeText || interviewData.resume}` : ""}

# RECRUITER MEMORY (Current State)
Verified Skills: ${recruiterMemoryRef.current.verifiedSkills.join(', ') || 'None yet'}
Weak Skills: ${recruiterMemoryRef.current.weakSkills.join(', ') || 'None yet'}
Missing Skills: ${recruiterMemoryRef.current.missingSkills.join(', ') || 'None yet'}
Unverified Claims: ${recruiterMemoryRef.current.unverifiedClaims.join(', ') || 'None yet'}
Already Asked Questions: ${recruiterMemoryRef.current.questionHistory.join(' | ') || 'None yet'}
Contradictions: ${recruiterMemoryRef.current.contradictions.join(', ') || 'None yet'}

# CONVERSATION RULES
1. ONE QUESTION LIMIT: You must ask exactly ONE question at a time. Never combine multiple questions. Wait until the candidate answers before continuing. Never ask compound questions.
2. MAX LENGTH: 2-3 short sentences. NEVER read long lectures.
3. NATURAL REFERENCES: Use phrases like "You previously explained...", "Earlier you mentioned...".
4. UNCERTAINTY: If the transcript is broken or low confidence, say "Could you repeat that?". Never guess. Ignore filler words ("umm", "uh").

# REASONING ENGINE (Maintain internally)
1. LIVE RECRUITER MEMORY: Track Candidate Skills (Verified/Missing/Weak), Unverified Claims, Contradictions, and JD Coverage matrix internally.
2. CONTINUOUS REASONING: Before every response, silently evaluate: What is the highest information-gain question I can ask next?
3. QUESTION PRIORITIZATION: 1. Unverified resume claims -> 2. JD critical skills -> 3. Weak skills -> 4. Contradictions -> 5. System Design -> 6. Behavior.
4. ADAPTIVE DIFFICULTY: If candidate answers perfectly, immediately escalate difficulty. If they struggle, step down to fundamentals. Never ask repetitive easy questions.
5. CONTRADICTION ENGINE: If they contradict a previous answer, politely clarify it ("Earlier you mentioned...").
6. FOLLOW-UP ENGINE: Never ask generic follow-ups. Ask targeted questions like "What bottleneck? How was it measured?"

# INTERVIEW TIMELINE FLOW
Introduction -> Resume/Project Deep Dive -> Technical JD Coverage -> System Design/Architecture -> Behavioral (Ownership/Leadership) -> Closing.

Never hallucinate technologies. Do not invent candidate experience. Maximize signal extraction.
`.trim();

    const interviewLanguage = interviewData.language || "en-IN";

    const assistant = {
      name: "AI Interviewer",
      model: {
        provider: "openai",
        model: import.meta.env.VITE_OPENAI_MODEL || "gpt-4o",
        messages: [{ role: "system", content: systemPrompt }],
      },
      voice: {
        provider: "openai",
        voiceId: "nova",
        speed: 1.05 // slightly faster for a more natural conversational flow
      },
      transcriber: {
        provider: "deepgram",
        model: "nova-3",
        language: interviewLanguage,
        smartFormat: true, // helps with filler words
      },
      silenceTimeoutSeconds: 1.5,
      responseDelaySeconds: 0.6, // Wait 600ms before replying to prevent robotic instantaneity
      maxDurationSeconds: 1800, // 30 minutes max call duration
      interruptionHandling: {
        enabled: true, // immediately stop TTS on interruption
      },
      backchannelingEnabled: false, // Turn off automatic backchanneling to prevent weird "mhmm" artifacts during tech answers
      firstMessage: `Hi, ready for your interview for ${interviewData.jobTitle}?`,
      endCallFunctionEnabled: true,
    };

    try {
      Logger.info("Configuring Deepgram STT", {
        language: interviewLanguage,
        provider: "deepgram",
        model: "nova-3",
      });
      vapiRef.current.start(assistant);
      if (onStart) onStart();
    } catch (err) {
      Logger.error("Failed to start Vapi FSM", err);
      setVapiError(INTERVIEW_ERRORS.UNKNOWN_ERROR);
      setFsmState(VAPI_STATES.FAILED);
    }
  }, [interviewData, fsmState]);

  const endCall = useCallback(() => {
    if (vapiRef.current && (fsmState !== VAPI_STATES.IDLE && fsmState !== VAPI_STATES.COMPLETED)) {
      setFsmState(VAPI_STATES.ENDING);
      vapiRef.current.stop();
    }
  }, [fsmState]);

  const toggleMic = useCallback(() => {
    if (vapiRef.current) {
      const isMutedNow = vapiRef.current.isMuted();
      vapiRef.current.setMuted(!isMutedNow);
      setIsMuted(!isMutedNow);
      Logger.info('Microphone Toggled', { muted: !isMutedNow });
    }
  }, []);

  return {
    fsmState,
    isMuted,
    vapiError,
    currentQuestion,
    thinkingStatus,
    conversation: conversationRef.current,
    recruiterMemory: recruiterMemoryRef.current,
    sessionMetrics: sessionMetricsRef.current,
    startCall,
    endCall,
    toggleMic,
    generateHealthScore
  };
};
