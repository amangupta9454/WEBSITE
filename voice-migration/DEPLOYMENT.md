# Self-Hosted Voice Stack Deployment

This document outlines the deployment strategy for the Code-A-Nova Self-Hosted Voice Stack.

## 1. System Architecture

The self-hosted voice architecture consists of the following isolated services:
1. **Frontend (Next.js/React)**: Captures audio via Web Audio API and streams binary PCM data via WebSockets.
2. **Node.js Backend**: Handles JWT authentication, interview session logic, panel routing, and score evaluation.
3. **Python Voice Gateway (FastAPI)**: WebRTC/WebSocket termination point.
    - Runs `Silero VAD` on CPU for sub-millisecond endpointing.
    - Runs `Faster-Whisper` on GPU/CPU for Speech-to-Text.
    - Routes final transcripts to Groq API.
    - Pipes LLM text to `Piper TTS` (or macOS `say` for development).

## 2. Server Requirements

### CPU / Memory
- **Minimum**: 4 vCPUs, 8GB RAM (Whisper Medium on CPU).
- **Recommended**: 8 vCPUs, 16GB RAM for concurrent sessions.

### GPU (Recommended for Production)
For latency < 1.5 seconds under load:
- NVIDIA T4 (16GB VRAM) or A10G.
- Enables `Faster-Whisper large-v3-turbo` with `float16` precision.

## 3. Environment Variables

**Python Gateway (`gateway/.env`)**:
```env
WHISPER_MODEL=medium
PIPER_MODEL_PATH=en_US-lessac-medium.onnx
GROQ_API_KEY=gsk_...
PORT=8000
```

**Frontend (`FRONTEND/.env`)**:
```env
VITE_VOICE_PROVIDER=self-hosted
VITE_SELF_HOSTED_WS_URL=wss://voice.codeanova.com/ws
```

## 4. Process Management

Run the Python Gateway using `gunicorn` with `uvicorn` workers to handle concurrent WebSocket connections.

```bash
# Start Gateway with 4 workers
gunicorn server:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## 5. Health Checks
The gateway exposes an HTTP GET endpoint at `/` or `/health` (to be implemented) that should return `200 OK`. Load balancers (e.g., NGINX/AWS ALB) should check this endpoint.

## 6. Model Loading & Cold Starts
- **Preloading**: `Faster-Whisper` models and `Silero VAD` models are loaded *before* the server starts accepting connections (during module initialization).
- **Cold Start Penalty**: The first request to Whisper may take 2-3 seconds to compile CUDA kernels or JIT compilation on CPU. It is recommended to send a dummy warmup audio packet during deployment.

## 7. Known Limitations
- The current Gateway uses local TTS generation (`subprocess.Popen` or macOS `say`). In a highly concurrent production environment, Piper TTS should run as a persistent daemon or gRPC service to avoid process forking overhead.
- WebSocket binary streaming requires a robust network connection. Brief network drops may result in audio artifacts.

## 8. Rollback Procedure
If the self-hosted gateway fails:
1. Change `VITE_VOICE_PROVIDER=vapi` in the frontend environment variables.
2. Redeploy the frontend.
3. Traffic will instantly route back to the `@vapi-ai/web` SDK. No code changes are required.
