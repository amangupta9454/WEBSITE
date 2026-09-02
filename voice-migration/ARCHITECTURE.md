# Code-A-Nova Self-Hosted Voice Architecture

## Final Authoritative Data Flow

The migration from Vapi to a Self-Hosted Voice Stack ensures that the existing **Code-A-Nova Interview Brain (Node.js)** remains the authoritative Single Source of Truth for all logic, routing, scoring, and prompt building.

The Python Voice Gateway acts purely as an audio/WebRTC bridge.

```mermaid
sequenceDiagram
    participant Browser
    participant Gateway as Python Voice Gateway (Server)
    participant VAD as Silero VAD / Faster-Whisper
    participant Backend as Node.js (Interview Brain)
    participant Groq as GroqManager
    participant TTS as Piper TTS

    Note over Browser, Backend: WebRTC Connection Initialization
    Browser->>Gateway: WebSocket CONNECT
    Browser->>Gateway: CONFIG (sessionId, JWT Token)

    Note over Browser, VAD: Candidate Speech Phase
    Browser->>Gateway: Audio Chunks (Float32)
    Gateway->>VAD: Detect Speech (Silero)
    VAD-->>Gateway: speech_start event
    Gateway->>Browser: ai-speech-end (Interrupt TTS if playing)
    
    VAD-->>Gateway: speech_end event
    Gateway->>VAD: Transcribe (Faster-Whisper)
    VAD-->>Gateway: Final Transcript ("I scale databases using sharding.")
    Gateway->>Browser: "transcript" event (for UI & Deduplication)

    Note over Gateway, Groq: Authoritative AI Inference
    Gateway->>Backend: POST /api/interview/chat<br/>{ sessionId, transcript, JWT }
    Backend->>Backend: Auth check & Load InterviewSession
    
    alt Panel Mode
        Backend->>Backend: Execute panelRouterService.js
        Backend->>Backend: Determine next speaker & Stage
    end
    
    Backend->>Backend: buildInterviewContextObject() (Personas & Prompt Registry)
    Backend->>Groq: executeInference(systemPrompt + transcript)
    Groq-->>Backend: AI Response ("Great, what are the drawbacks of sharding?")
    Backend-->>Gateway: JSON Response { content, interviewer, nextStage }

    Note over Gateway, TTS: Speech Synthesis
    Gateway->>TTS: Route to specific Piper Voice model based on interviewer
    TTS-->>Gateway: Audio synthesis stream (WAV)
    Gateway->>Browser: Audio Bytes (Blob)
    Browser->>Browser: Play Audio (Web Audio API)
```

## Security & State Ownership
1. **No Frontend Spoofing**: The frontend cannot spoof the `systemPrompt` or `interviewerName` by injecting it into the Voice Gateway. The gateway forwards only the `sessionId` and candidate transcript.
2. **Backend Authentication**: The Gateway uses the candidate's JWT Token to authorize the `POST /api/interview/chat` endpoint on the Node.js backend.
3. **Immutable History**: The Node.js backend maintains deterministic control over the interview flow and uses the centralized `GroqManager` for retry logic and key failover.
