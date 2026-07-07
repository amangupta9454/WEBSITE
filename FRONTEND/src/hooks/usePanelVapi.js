import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Vapi from '@vapi-ai/web';
import axios from 'axios';
import { Logger } from '../utils/logger';
import { INTERVIEW_ERRORS } from '../constants/errors';
import { PANEL_CONFIG } from '../constants/panelConfig';
import { buildInterviewContext, buildInterviewContextObject, buildRouterContextSummary } from '../utils/interviewContextBuilder';
import { SystemMessageHandoffTransport } from '../services/HandoffTransportService';

const AI_RESPONSE_TIMEOUT_MS = 15000;

export const VAPI_STATES = {
  IDLE: 'IDLE',
  CONNECTING: 'CONNECTING',
  LISTENING: 'LISTENING',
  THINKING: 'THINKING',
  SPEAKING: 'SPEAKING',
  ENDING: 'ENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  SPEAKER_SWITCHING: 'SPEAKER_SWITCHING'
};

export function usePanelVapi(interviewData) {
  const vapiRef = useRef(null);
  const handoffTransportRef = useRef(null);
  
  const [fsmState, setFsmState] = useState(VAPI_STATES.IDLE);
  const [isMuted, setIsMuted] = useState(false);
  const [vapiError, setVapiError] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [thinkingStatus, setThinkingStatus] = useState("");
  
  // Panel specific state
  const [activeSpeaker, setActiveSpeaker] = useState("Sarah"); // Sarah or David
  const activeSpeakerRef = useRef("Sarah");

  // Stage Management
  const [currentStage, setCurrentStage] = useState("Introduction");
  const currentStageRef = useRef("Introduction");

  // Speaker Transition Context
  const defaultTransition = { active: false, from: null, to: null, reason: null, startedAt: null, topic: null, difficulty: null, confidence: null, greeting: null, openingQuestion: null, interviewerMood: null };
  const [transitionContext, setTransitionContext] = useState(defaultTransition);
  const transitionContextRef = useRef(defaultTransition);

  const conversationRef = useRef([]);
  const recruiterMemoryRef = useRef({
    verifiedSkills: [], weakSkills: [], missingSkills: [],
    unverifiedClaims: [], questionHistory: [], projectsMentioned: [],
    contradictions: [], confidenceSignals: [], evidenceGraph: [],
    discussedTopics: [],
    confidenceHistory: [],
    currentDifficulty: "Medium",
    followUpQueue: [],
    observations: [],
    competencyProfile: {
      technicalKnowledge: { score: null, confidenceOfAssessment: null, evidence: null, lastUpdated: null },
      problemSolving: { score: null, confidenceOfAssessment: null, evidence: null, lastUpdated: null },
      communication: { score: null, confidenceOfAssessment: null, evidence: null, lastUpdated: null },
      confidence: { score: null, confidenceOfAssessment: null, evidence: null, lastUpdated: null },
      systemDesign: { score: null, confidenceOfAssessment: null, evidence: null, lastUpdated: null },
      leadership: { score: null, confidenceOfAssessment: null, evidence: null, lastUpdated: null },
      ownership: { score: null, confidenceOfAssessment: null, evidence: null, lastUpdated: null },
      debugging: { score: null, confidenceOfAssessment: null, evidence: null, lastUpdated: null },
      codingQuality: { score: null, confidenceOfAssessment: null, evidence: null, lastUpdated: null },
      learningAbility: { score: null, confidenceOfAssessment: null, evidence: null, lastUpdated: null }
    },
    coveredTopics: [],
    missingTopics: [],
    orchestration: {
      action: "ASK_QUESTION",
      handoverTarget: null,
      interrupt: false,
      backchannel: null,
      pauseRecommendation: "Medium",
      reason: ""
    }
  });

  const SKILL_DICTIONARY = useMemo(() => ({
    languages: ['javascript', 'python', 'java', 'c++', 'ruby', 'go', 'typescript', 'php', 'swift', 'rust', 'c#'],
    frameworks: ['react', 'angular', 'vue', 'django', 'flask', 'spring', 'express', 'next.js', 'nest', 'laravel'],
    databases: ['sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'cassandra', 'dynamodb', 'oracle'],
    cloud: ['aws', 'azure', 'gcp', 'heroku', 'vercel', 'netlify', 'digitalocean', 'kubernetes', 'docker'],
    tools: ['git', 'webpack', 'babel', 'jenkins', 'jira', 'figma', 'postman', 'terraform', 'ansible']
  }), []);

  const normalizeTranscript = (text) => text.toLowerCase().replace(/[.,!?;()]/g, '').replace(/\s+/g, ' ').trim();

  const updateRecruiterMemory = useCallback((msg, transcriptIndex) => {
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
            recruiterMemoryRef.current.evidenceGraph.push({ skill, category, evidence: originalText, transcriptIndex, timestamp, confidence: 1.0 });
            if (!recruiterMemoryRef.current.verifiedSkills.includes(skill)) {
              recruiterMemoryRef.current.verifiedSkills.push(skill);
            }
          }
        });
      };

      extractCategory('Language', SKILL_DICTIONARY.languages);
      extractCategory('Framework', SKILL_DICTIONARY.frameworks);
      extractCategory('Database', SKILL_DICTIONARY.databases);
    }
  }, [SKILL_DICTIONARY]);

  const callDurationTimerRef = useRef(null);
  const timeoutsRef = useRef([]);
  const sessionMetricsRef = useRef({
    latencies: [], confidences: [], interruptions: 0, retries: 0, networkDrops: 0, hardwareErrors: 0
  });

  const generateHealthScore = useCallback(() => {
    return { avgConfidence: 100 }; 
  }, []);

  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  const requestMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (err) {
      setVapiError(INTERVIEW_ERRORS.MIC_PERMISSION_DENIED);
      setFsmState(VAPI_STATES.FAILED);
      return false;
    }
  };

  const buildSquadConfig = (conversationHistory) => {
    // Evaluate Intelligence Engine metrics
    const currentConfidence = recruiterMemoryRef.current.confidenceHistory.length > 0 
        ? recruiterMemoryRef.current.confidenceHistory[recruiterMemoryRef.current.confidenceHistory.length - 1] 
        : 50;
    const currentDifficulty = recruiterMemoryRef.current.currentDifficulty || "Medium";

    // Filter follow-up queue to show only up to 2 items
    const pendingFollowUps = recruiterMemoryRef.current.followUpQueue.slice(0, 2).join(', ') || 'None yet';

    // Build Competency Snapshot String
    const compProfile = recruiterMemoryRef.current.competencyProfile;
    const competencySnapshot = Object.keys(compProfile)
       .filter(key => compProfile[key].score !== null)
       .map(key => `${key}: ${compProfile[key].score}/100`)
       .join(', ') || 'No data yet';
       
    const missingTopicsSnapshot = recruiterMemoryRef.current.missingTopics.length > 0 
       ? recruiterMemoryRef.current.missingTopics.join(', ') 
       : 'None identified';
       
    const coveredTopicsSnapshot = recruiterMemoryRef.current.coveredTopics.length > 0 
       ? recruiterMemoryRef.current.coveredTopics.join(', ') 
       : 'None yet';

    // Build Orchestration Directives
    const { action, handoverTarget, interrupt, backchannel, pauseRecommendation } = recruiterMemoryRef.current.orchestration;
    
    let orchestratorRule = `Action: ${action}. `;
    if (interrupt) {
      orchestratorRule += "Start your sentence by politely interrupting the candidate (e.g. 'Sorry to interrupt, but...'). ";
    } else if (backchannel) {
      orchestratorRule += `Start your sentence with a natural acknowledgement: '${backchannel}'. `;
    }
    
    if (action === "HANDOVER" && handoverTarget) {
      orchestratorRule += `Acknowledge the candidate's last point, then explicitly hand the conversation over to ${handoverTarget}. `;
    } else if (action === "AGREE") {
      orchestratorRule += "Start by explicitly agreeing with the previous point before moving forward. ";
    } else if (action === "CLARIFY") {
      orchestratorRule += "Ask the candidate to clarify their last statement before proceeding. ";
    }

    // Transform conversation history for Vapi
    const mappedHistory = conversationHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.transcript
    }));

    const baseContextParams = {
      mode: 'panel',
      candidate: {
        resumeText: interviewData.resumeText || interviewData.resume || '',
        parsedResume: interviewData.parsedResume || null,
        jobTitle: interviewData.jobTitle,
        jobDescription: interviewData.jobDescription || '',
        experienceYears: interviewData.experienceYears,
        language: interviewData.language,
        durationMinutes: interviewData.durationMinutes,
      }
    };

    const sarahContext = buildInterviewContext({
      ...baseContextParams,
      interviewerName: 'Sarah',
      liveState: {
        currentStage: currentStageRef.current,
        currentDifficulty,
        currentConfidence,
        interviewerMood: PANEL_CONFIG.determineMood(currentConfidence, 0, currentDifficulty, "Sarah"),
        recruiterMemory: recruiterMemoryRef.current,
        conversationHistory,
      }
    });

    const davidContext = buildInterviewContext({
      ...baseContextParams,
      interviewerName: 'David',
      liveState: {
        currentStage: currentStageRef.current,
        currentDifficulty,
        currentConfidence,
        interviewerMood: PANEL_CONFIG.determineMood(currentConfidence, 0, currentDifficulty, "David"),
        recruiterMemory: recruiterMemoryRef.current,
        conversationHistory,
      }
    });

    const sarahMessages = [{ role: "system", content: sarahContext.systemPrompt }, ...mappedHistory];
    const davidMessages = [{ role: "system", content: davidContext.systemPrompt }, ...mappedHistory];

    const transcriber = { provider: "deepgram", model: "nova-3", language: interviewData.language || "en-IN", smartFormat: true };

    const handoffToDavid = {
       type: "handoff",
       destinations: [{ type: "assistant", assistantName: "David" }],
    };

    const handoffToSarah = {
       type: "handoff",
       destinations: [{ type: "assistant", assistantName: "Sarah" }],
    };

    return {
      name: "Code A Nova FAANG Panel Squad",
      members: [
        {
          assistant: {
            name: "Sarah",
            model: {
              provider: "openai",
              model: import.meta.env.VITE_OPENAI_MODEL || "gpt-4o",
              messages: sarahMessages,
            },
            voice: { provider: "openai", voiceId: "nova", speed: 1.05 },
            transcriber,
            silenceTimeoutSeconds: 60,
            responseDelaySeconds: 0.6,
            endCallFunctionEnabled: true,
            tools: [handoffToDavid]
          }
        },
        {
          assistant: {
            name: "David",
            model: {
              provider: "openai",
              model: import.meta.env.VITE_OPENAI_MODEL || "gpt-4o",
              messages: davidMessages,
            },
            voice: { provider: "openai", voiceId: "onyx", speed: 1.05 },
            transcriber,
            silenceTimeoutSeconds: 60,
            responseDelaySeconds: 0.6,
            endCallFunctionEnabled: true,
            tools: [handoffToSarah]
          }
        }
      ]
    };
  };

  const triggerRouter = async (transcriptArray) => {
    try {
      const token = localStorage.getItem('interviewToken');
      
      // Build structured context object for Router enrichment
      const currentConfidenceForRouter = recruiterMemoryRef.current.confidenceHistory.length > 0
        ? recruiterMemoryRef.current.confidenceHistory[recruiterMemoryRef.current.confidenceHistory.length - 1]
        : 50;
      const routerCtx = buildInterviewContextObject(
        {
          resumeText: interviewData.resumeText || interviewData.resume || '',
          parsedResume: interviewData.parsedResume || null,
          jobTitle: interviewData.jobTitle,
          jobDescription: interviewData.jobDescription || '',
          experienceYears: interviewData.experienceYears,
        },
        {
          mode: 'panel',
          currentStage: currentStageRef.current,
          currentDifficulty: recruiterMemoryRef.current.currentDifficulty || 'Medium',
          currentConfidence: currentConfidenceForRouter,
          recruiterMemory: recruiterMemoryRef.current,
        }
      );
      const candidateContextSummary = buildRouterContextSummary(routerCtx);

      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/interview-session/panel-router`, {
        transcript: transcriptArray,
        jobTitle: interviewData.jobTitle,
        currentStage: currentStageRef.current,
        candidateContext: candidateContextSummary,
      }, { headers: { Authorization: `Bearer ${token}` } });

      if (res.data.success) {
        const { speaker, nextStage, topic, reason, confidenceScore, difficulty, followUpQueue, recruiterObservation, conversationAction, handoverTarget, interrupt, backchannel, pauseRecommendation, conversationReason } = res.data;
        
        // --- 1C. Phase 2B Orchestration Updates ---
        recruiterMemoryRef.current.orchestration = {
           action: conversationAction || "ASK_QUESTION",
           handoverTarget: handoverTarget || null,
           interrupt: interrupt || false,
           backchannel: backchannel || null,
           pauseRecommendation: pauseRecommendation || "Medium",
           reason: conversationReason || ""
        };
        
        // --- 1. Intelligence Engine Updates ---
        if (confidenceScore !== undefined) {
           recruiterMemoryRef.current.confidenceHistory.push(confidenceScore);
        }
        if (difficulty) {
           recruiterMemoryRef.current.currentDifficulty = difficulty;
        }
        if (followUpQueue && Array.isArray(followUpQueue)) {
           // Add unique follow-ups to the queue
           followUpQueue.forEach(item => {
             if (!recruiterMemoryRef.current.followUpQueue.includes(item)) {
               recruiterMemoryRef.current.followUpQueue.push(item);
             }
           });
        }
        if (recruiterObservation) {
           recruiterMemoryRef.current.observations.push(recruiterObservation);
        }

        // --- 1B. Phase 2A.1 Enhancements ---
        const { competencyUpdates, coveredTopics, missingTopics } = res.data;
        if (competencyUpdates) {
           Object.keys(competencyUpdates).forEach(compKey => {
             if (recruiterMemoryRef.current.competencyProfile[compKey] !== undefined) {
               recruiterMemoryRef.current.competencyProfile[compKey] = {
                 ...recruiterMemoryRef.current.competencyProfile[compKey],
                 ...competencyUpdates[compKey],
                 lastUpdated: Date.now()
               };
             }
           });
        }
        
        if (coveredTopics && Array.isArray(coveredTopics)) {
           coveredTopics.forEach(topic => {
             if (!recruiterMemoryRef.current.coveredTopics.includes(topic)) {
                recruiterMemoryRef.current.coveredTopics.push(topic);
             }
           });
        }
        
        if (missingTopics && Array.isArray(missingTopics)) {
           // Overwrite with the latest missing topics evaluation
           recruiterMemoryRef.current.missingTopics = missingTopics;
        }

        // --- 2. Stage Management Updates ---
        if (nextStage && nextStage !== currentStageRef.current) {
          Logger.info(`Stage transitioned from ${currentStageRef.current} to ${nextStage}`);
          currentStageRef.current = nextStage;
          setCurrentStage(nextStage);
        }
        
        if (topic && !recruiterMemoryRef.current.discussedTopics.includes(topic)) {
          recruiterMemoryRef.current.discussedTopics.push(topic);
        }

        // --- 3. Speaker Routing Updates ---
        // Only swap if the speaker actually changed!
        if (speaker && speaker !== activeSpeakerRef.current) {
          Logger.info(`Router switching speaker from ${activeSpeakerRef.current} to ${speaker}`);
          
          const routerTransition = res.data.transition || null;
          const newTransition = {
            active: true,
            from: activeSpeakerRef.current,
            to: speaker,
            reason: reason || "RouterDecision",
            startedAt: Date.now(),
            topic: topic || null,
            difficulty: difficulty || "Medium",
            confidence: confidenceScore || 50,
            greeting: routerTransition?.greeting || `Thanks ${activeSpeakerRef.current}. I'll take over from here.`,
            openingQuestion: routerTransition?.openingQuestion || `Let's continue with ${topic || 'the next topic'}.`,
            interviewerMood: routerTransition?.mood || "Neutral"
          };
          transitionContextRef.current = newTransition;
          setTransitionContext(newTransition);
          
          activeSpeakerRef.current = speaker;
          setActiveSpeaker(speaker);
          setThinkingStatus(`${speaker} is reviewing...`);
          setFsmState(VAPI_STATES.SPEAKER_SWITCHING);
          
          if (vapiRef.current) {
            // TRANSITION MANAGER: Trigger Squad Handoff natively via WebRTC Transport Layer
            if (handoffTransportRef.current) {
              handoffTransportRef.current.transfer({
                target: speaker,
                greeting: routerTransition?.greeting || '',
                openingQuestion: routerTransition?.openingQuestion || '',
                reason: reason || "RouterDecision"
              });
            }
          }
        }
      }
    } catch (err) {
      console.error("Router error", err);
    }
  };

  useEffect(() => {
    if (!interviewData) return;
    const key = import.meta.env.VITE_VAPI_PUBLIC_API_KEY || '5195e2cd-7f02-4ec4-9d56-a9ff3360824b';
    vapiRef.current = new Vapi(key);
    handoffTransportRef.current = new SystemMessageHandoffTransport(vapiRef.current);

    const vapi = vapiRef.current;

    const onCallStart = () => { 
      setFsmState(VAPI_STATES.LISTENING); 
      setVapiError(null); 
    };
    
    const onCallEnd = () => { 
      clearAllTimeouts(); 
      setFsmState(VAPI_STATES.COMPLETED); 
    };
    
    const onSpeechStart = () => { 
      if (transitionContextRef.current.active) {
        transitionContextRef.current = defaultTransition;
        setTransitionContext(defaultTransition);
      }
      setThinkingStatus(""); 
      setFsmState(VAPI_STATES.SPEAKING); 
    };
    const onSpeechEnd = () => { setFsmState(VAPI_STATES.LISTENING); };

    const onMessage = (msg) => {
      if (msg.type === "transcript" && msg.transcriptType === "final") {
        const lastMsg = conversationRef.current[conversationRef.current.length - 1];
        if (!lastMsg || lastMsg.transcript !== msg.transcript) {
          let transcriptEntry = msg.transcript;
          if (msg.role === 'assistant') {
             transcriptEntry = `[${activeSpeakerRef.current}] ${msg.transcript}`;
          }
          
          conversationRef.current.push({ role: msg.role, transcript: transcriptEntry, raw: msg.transcript });
          updateRecruiterMemory(msg, conversationRef.current.length - 1);
          
          if (msg.role === "assistant") {
            setCurrentQuestion(msg.transcript);
          } else if (msg.role === "user") {
            setFsmState(VAPI_STATES.THINKING);
            setThinkingStatus("Thinking...");
            triggerRouter(conversationRef.current);
          }
        }
      }
    };

    const onError = (err) => {
      clearAllTimeouts();
      Logger.error("Vapi Engine Error", err);
    };

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("message", onMessage);
    vapi.on("error", onError);

    return () => {
      clearAllTimeouts();
      vapi.removeAllListeners();
      if (vapiRef.current) {
        vapiRef.current.stop();
        vapiRef.current = null;
      }
    };
  }, [interviewData]);

  const startCall = useCallback(async (onStart) => {
    if (!vapiRef.current || fsmState !== VAPI_STATES.IDLE) return;
    setFsmState(VAPI_STATES.CONNECTING);
    const micGranted = await requestMicrophone();
    if (!micGranted) return;
    
    const squadConfig = buildSquadConfig([]);
    squadConfig.members[0].assistant.firstMessage = `Hi, I'm Sarah from HR. We also have David here, our Tech Lead. Ready to start your panel interview for ${interviewData.jobTitle}?`;
    
    try {
      vapiRef.current.start(undefined, undefined, squadConfig);
      if (onStart) onStart();
    } catch (err) {
      setVapiError(INTERVIEW_ERRORS.UNKNOWN_ERROR);
      setFsmState(VAPI_STATES.FAILED);
    }
  }, [interviewData, fsmState]);

  const endCall = useCallback(() => {
    if (vapiRef.current) {
      setFsmState(VAPI_STATES.ENDING);
      vapiRef.current.stop();
    }
  }, []);

  const toggleMic = useCallback(() => {
    if (vapiRef.current) {
      const isMutedNow = vapiRef.current.isMuted();
      vapiRef.current.setMuted(!isMutedNow);
      setIsMuted(!isMutedNow);
    }
  }, []);

  return {
    fsmState, isMuted, vapiError, currentQuestion, thinkingStatus,
    conversation: conversationRef.current, recruiterMemory: recruiterMemoryRef.current,
    sessionMetrics: sessionMetricsRef.current, startCall, endCall, toggleMic, generateHealthScore,
    activeSpeaker, currentStage, transitionContext
  };
};
