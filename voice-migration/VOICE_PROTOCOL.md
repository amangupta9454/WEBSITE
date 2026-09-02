# Voice Protocol

This document defines the WebSocket protocol used between the Code-A-Nova Frontend (Browser) and the Self-Hosted Voice Gateway.

## Connection
- **Endpoint**: `ws://<GATEWAY_HOST>:<GATEWAY_PORT>/ws`
- **Transport**: WebSockets (Mixed Binary and JSON)

## Client to Server (Browser -> Gateway)

### 1. Configuration (JSON)
Sent immediately after the connection opens to configure the session.
```json
{
  "type": "config",
  "assistant": { ... }, // The Vapi-compatible assistant config object
  "squadConfig": { ... } // Optional Vapi-compatible squad config for Panel mode
}
```

### 2. Audio Stream (Binary)
- **Format**: `Int16Array` buffer (PCM)
- **Sample Rate**: 16000 Hz
- **Channels**: 1 (Mono)
- **Chunk Size**: Sent in 512-frame chunks.

### 3. Programmatic Message (JSON)
Used to send manual triggers (e.g., forcing the first message).
```json
{
  "type": "client-message",
  "message": {
    "type": "add-message",
    "message": { "role": "system", "content": "..." },
    "triggerResponseEnabled": true
  }
}
```

### 4. Stop Session (JSON)
```json
{
  "type": "stop"
}
```

## Server to Client (Gateway -> Browser)

### 1. VAD Events (JSON)
Indicates when user speech starts and stops.
```json
{
  "type": "vad",
  "status": "speech_started" // or "speech_ended"
}
```

### 2. Transcripts (JSON)
Sends final text transcriptions of either the user's speech or the assistant's speech.
```json
{
  "type": "transcript",
  "transcriptType": "final",
  "role": "user", // or "assistant"
  "transcript": "I am proficient in Python.",
  "confidence": 0.99
}
```

### 3. AI Speech State (JSON)
Indicates when the AI begins or ends its vocal response. Used to sync UI state.
```json
{
  "type": "ai-speech-start" // or "ai-speech-end"
}
```

### 4. Audio Playback Stream (Binary)
- **Format**: Binary Blob (WAV format natively synthesized by Piper TTS or macOS `say`).
- **Handling**: The browser creates an Object URL from the blob and plays it via an `Audio` element.

### 5. Interruption Signal (JSON)
Sent by the gateway when it detects the user speaking while TTS is playing. The browser must immediately halt all audio playback.
```json
{
  "type": "interrupt"
}
```
