# Voice Migration - Self-Hosted Voice Stack

This folder contains the self-hosted replacement for the Vapi voice layer in the Code-A-Nova Mock Interview feature.

## Requirements

- Python 3.9+
- Node.js 18+
- Faster-Whisper, Silero VAD, Groq Python SDK
- Piper TTS (Optional, falls back to macOS `say` if not installed)

## Setup Gateway

1. Navigate to the `gateway` directory:
   ```bash
   cd gateway
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install fastapi uvicorn faster-whisper torch groq websockets aiohttp numpy
   ```
4. Set your Groq API key:
   ```bash
   export GROQ_API_KEY="your_api_key_here"
   ```
5. Run the gateway:
   ```bash
   uvicorn server:app --host 127.0.0.1 --port 8000
   ```

## Setup Frontend

The frontend is already configured via the `VoiceProviderFactory`. 
To toggle between Vapi and the self-hosted stack, edit the `FRONTEND/.env` file:

```env
# Use self-hosted stack
VITE_VOICE_PROVIDER=self-hosted

# Or fallback to Vapi
# VITE_VOICE_PROVIDER=vapi
```

Start the frontend normally:
```bash
cd ../FRONTEND
npm run dev
```

## Available Scripts

- `tests/run_offline_stt.py`: Benchmarks STT offline.
- `tests/run_offline_vad.py`: Benchmarks VAD thresholding offline.
