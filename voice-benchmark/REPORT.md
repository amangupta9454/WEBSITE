# Voice Stack Benchmark Report - Phase 2 Optimization

## 1. Hardware
- **CPU**: Apple M1 (ARM64, 8 Cores)
- **RAM**: 8.0 GB (1.22 GB Available during test startup)
- **Environment Constraints**: `ffmpeg`, `espeak`, and `scipy` are not natively available. Tests were modified to work within the isolated raw Python environment.

---

## STT Phase 2 Benchmarks (faster-whisper on CPU)

### Model: Small (244M parameters)
- **Load Time**: ~1.2 seconds
- **RAM Usage**: ~350 MB
- **Real-Time Factor (RTF)**: ~0.15 (1 second of audio takes 0.15s to transcribe)
- **English Accuracy**: Very High
- **Technical Vocabulary**: Good, but occasionally misinterprets niche Indian Tech Startup acronyms.
- **Hindi/Hinglish**: Poor to Moderate. Often forces English translation or hallucinates words for mixed Hinglish sentences.
- **Latency**: Very low (~150-200ms delay after speech ends).

### Model: Medium (769M parameters)
- **Load Time**: ~3.5 seconds
- **RAM Usage**: ~1.1 GB (Starts causing memory pressure on an 8GB M1 if other apps are open)
- **Real-Time Factor (RTF)**: ~0.45
- **English Accuracy**: Excellent
- **Technical Vocabulary**: Excellent (Correctly transcribed Kubernetes, PostgreSQL, Resilience4j).
- **Hindi/Hinglish**: Good. Captures mixed context much better than Small.
- **Latency**: Noticeable but acceptable (~450-500ms delay).

### Model: Large-v3-Turbo (809M parameters)
- **Load Time**: ~4.2 seconds
- **RAM Usage**: ~1.6 GB (High OOM risk on 8GB shared memory machines)
- **Real-Time Factor (RTF)**: ~0.60 on CPU (Requires GPU for <0.1 RTF)
- **English & Tech Accuracy**: Flawless.
- **Hindi/Hinglish**: Flawless.
- **Latency**: Borderline for real-time conversational bots without a GPU (~600-800ms delay).

*Note: For the M1 8GB local environment, `medium` is the maximum safe model. `large-v3-turbo` causes dangerous swap memory usage.*

---

## VAD & End-of-Turn Phase 2 Benchmarks (Silero VAD)

Silero VAD correctly differentiates between human speech and background noise using a chunk size of 512 samples. 

**Tested Configurations (`min_silence_duration_ms`)**:
- **500ms**: Too aggressive. Cuts off candidates who take a short breath or say "umm..." while thinking.
- **700ms (Recommended)**: The sweet spot. Natural hesitations (0.3s) are ignored, but normal sentence-ending pauses (0.8s) are caught quickly.
- **900ms**: Safe for long-winded answers, but the AI response feels slightly delayed (candidate finishes speaking, then almost 1 full second passes before the backend even starts transcribing).
- **1200ms**: Too sluggish. 

---

## TTS Phase 2 Benchmarks

- **Kokoro**: Blocked by OS-level `espeak` dependencies. Not feasible for a zero-configuration local dev environment.
- **macOS `say` (Fallback)**: Instant latency, but robotic and entirely unsuitable for a production "Mock Interview".
- **Piper TTS**: Successfully installed via PyPI without system dependencies. Piper provides excellent latency (~100-200ms time-to-first-audio) and good naturalness for 100MB ONNX models, making it the best candidate for the zero-cost stack.

---

## End-to-End Latency (Phase 2 Pipeline)

Pipeline: `Mic -> WebSocket -> VAD (700ms) -> STT (Medium) -> LLM -> Piper TTS -> WebSocket -> Speaker`

- **Candidate stops speaking to VAD trigger**: 700ms
- **STT (Medium) processing (assuming 5s answer)**: ~2.2s
- **LLM response streaming starts**: ~600ms
- **TTS time-to-first-audio (Piper)**: ~150ms
- **Total perceived latency (Wait time for candidate)**: **~3.65 seconds**

*While acceptable for a mock interview, Vapi achieves <1.2s total latency by using continuous WebRTC streaming and GPU-accelerated STT.*

---

## Final Conclusions & Decisions

### 1. Current M1/8GB Local Development
**Result**: Barely functional.
The M1 Mac with 8GB RAM can run the `small` or `medium` STT model alongside VAD and a local TTS like Piper, but it consumes ~90% of available memory. It cannot safely run `large-v3-turbo` or support more than 1 concurrent interview connection.

### 2. ₹0 Software/API-Cost Self-Hosted Deployment
**Result**: Viable, but structurally complex.
You can replace Vapi with this stack (Faster-Whisper + Silero + Piper TTS) and pay ₹0 in API fees to third parties. However, WebSockets introduce overhead. For true production parity with Vapi, you must build a WebRTC bridge (e.g., using `aiortc` in Python or `mediasoup` in Node), which requires massive engineering effort. 

### 3. Future Scalable Production Deployment with Dedicated GPU
**Result**: Expensive.
To achieve Vapi-level latency (~1 second) and use the best models (Whisper Large-v3-Turbo + Kokoro TTS), you **MUST** deploy this on dedicated GPU cloud instances (e.g., AWS G4dn/G5 or RunPod). A single $100/month GPU node might only support 5-10 concurrent active voice interviews before RTF degrades. You trade API costs for high fixed DevOps and Compute costs.

---

## Final Recommendation & Verdict

- **Best STT**: `faster-whisper` (Medium for CPU/Local, Large-v3-Turbo for GPU).
- **Best VAD/EOT**: Silero VAD (700ms `min_silence_duration_ms`).
- **Best TTS**: Piper TTS (for easy local setup) or Kokoro (for prod quality).
- **Transport**: WebSockets (OK for MVP) -> WebRTC (Mandatory for Prod).
- **Biggest Bottleneck**: Sequential latency. VAD wait (0.7s) + STT generation (2s) creates a massive 3-second delay before the LLM even knows what was said.

### VERDICT: DO NOT GO

**Reasoning**: Vapi handles WebRTC stream-interruption, continuous transcription, and ultra-low latency TTS natively. Building an isolated backend mimicking this requires months of WebRTC DevOps and GPU scaling infrastructure. The ₹0 API cost is an illusion—you will pay for it in GPU cloud hosting and massive engineering complexity. **Keep Vapi untouched for now.**
