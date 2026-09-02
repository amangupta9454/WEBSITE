# Vapi Architecture Audit

## 1. Current Vapi Architecture
The current architecture relies on `@vapi-ai/web` initialized within two primary React hooks:
- `useVapi.js` for Standard interviews.
- `usePanelVapi.js` for Panel interviews.

Vapi handles the entire WebRTC connection, STT (Deepgram `nova-3`), LLM orchestration (OpenAI `gpt-4o` + tools), and TTS (OpenAI voices) in the cloud. The frontend is largely passive regarding audio, reacting to Vapi's event streams.

## 2. Every Vapi Event Used
- `call-start`: Transitions FSM to `LISTENING`. Initializes session duration timers. For Panel mode, manually injects a `add-message` (system) to trigger the first speaker.
- `call-end`: Triggers `InterviewTerminationController.requestTermination` to evaluate if the interview is concluded. Transitions to `COMPLETED`.
- `speech-start`: Clears UI timeouts, calculates AI response latency, transitions FSM to `SPEAKING`. For Panel mode, syncs the `activeSpeaker` state to the `pendingSpeaker`.
- `speech-end`: Transitions FSM back to `LISTENING`.
- `message`:
  - `type: "transcript"`: Captures `final` transcripts. De-duplicates consecutive identical transcripts. Feeds into `updateRecruiterMemory` (skill/keyword extraction). Updates `conversationRef`.
  - `type: "transfer-update"` (Panel only): Detects intent to handoff to another assistant. Updates `pendingSpeakerRef`.
  - `type: "tool-calls"` (Panel only): Parses `handoff` tool calls to determine the pending speaker.
- `error`: Handles unexpected disconnects. Specifically filters out benign shutdown messages (e.g. "meeting has ended", "ejected"). Transitions to `FAILED`.

## 3. Data Flow
- **Audio In**: Browser `getUserMedia` -> Vapi SDK WebRTC -> Deepgram STT.
- **Text**: Vapi SDK `message` events -> React State -> `recruiterMemory` / `triggerRouter` API.
- **Audio Out**: Vapi SDK WebRTC -> Browser AudioElement.

## 4. Transcript Flow
Final transcripts (from both `user` and `assistant`) are received via WebSocket messages from Vapi. They are appended to a local `conversationRef` and synchronously parsed to extract verified skills, confidence, and metrics.

## 5. Audio Flow
The frontend does not handle raw PCM data. It merely calls `navigator.mediaDevices.getUserMedia` to acquire microphone permissions and passes control to `vapi.start()`.

## 6. Error Handling
Errors are caught in `onError()`. Microphone permissions are checked proactively before calling `vapi.start()`. Metrics track `hardwareErrors` and `networkDrops`.

## 7. Interruption/Barging Behavior
Vapi handles the actual audio interruption natively via WebRTC/VAD. The frontend tracks interruptions loosely by checking if `msg.role === "user"` arrives while `fsmState === VAPI_STATES.SPEAKING`, incrementing the `sessionMetricsRef.current.interruptions` counter.

## 8. Session Lifecycle
`IDLE` -> `CONNECTING` (Mic check) -> `LISTENING` -> `THINKING` (User finished speaking) -> `SPEAKING` (AI talking) -> `ENDING` (User clicked End) -> `COMPLETED` / `FAILED`.

## 9. How Standard Mode Uses Vapi
Passes a single `assistant` configuration object to `vapi.start()`, defining the system prompt, LLM model, TTS voice, and STT config.

## 10. How Panel Mode Uses Vapi
Passes a "Squad" configuration to `vapi.start()`. The squad contains multiple assistants (e.g., Sarah, David). Each assistant has a system prompt generated via `buildInterviewContext` and is provided with `handoff` tools that allow them to transfer control to other panel members based on instructions from the backend `triggerRouter` API.

## 11. What Existing Code Must Remain Untouched
- `updateRecruiterMemory` and the entire intelligence engine.
- `triggerRouter` API call and backend escalation engine.
- `InterviewTerminationController` and `interviewContextBuilder`.
- Frontend components (`InterviewActive.jsx`, `PanelInterviewActive.jsx`) should have minimal changes.

## 12. Exact Replacement Points
The replacement must occur at the boundary of `useVapi` and `usePanelVapi`.
We will introduce a `VoiceProvider` factory pattern:
```javascript
const provider = VoiceProviderFactory.create(import.meta.env.VITE_VOICE_PROVIDER || 'vapi');
```
The provider must expose:
- `startCall(config, onStart)`
- `endCall()`
- `toggleMic()`
- Event Listeners/Callbacks matching Vapi's semantics: `onCallStart`, `onCallEnd`, `onSpeechStart`, `onSpeechEnd`, `onMessage`, `onError`.
