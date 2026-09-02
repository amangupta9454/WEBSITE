import { EventEmitter } from './EventEmitter';
import { Logger } from '../utils/logger';

export class SelfHostedVoiceProvider extends EventEmitter {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey;
    this.socket = null;
    this.audioContext = null;
    this.scriptProcessor = null;
    this.microphone = null;
    this.isRecording = false;
    this.muted = false;
    
    // We will track if AI is speaking to trigger speech-start/speech-end for the UI
    this.aiSpeaking = false;
    this.activeAudioElements = [];
  }

  async start(assistant, overrideConfig, squadConfig) {
    this.emit("call-start");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      this.microphone = this.audioContext.createMediaStreamSource(stream);
      
      // Use 512 chunks
      this.scriptProcessor = this.audioContext.createScriptProcessor(512, 1, 1);
      
      const wsUrl = import.meta.env.VITE_SELF_HOSTED_WS_URL || 'ws://localhost:8000/ws';
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        Logger.info("SelfHostedVoiceProvider: WebSocket connected");
        // Send initial config to backend
        const configMessage = {
          type: "config",
          assistant: assistant,
          squadConfig: squadConfig
        };
        this.socket.send(JSON.stringify(configMessage));
      };

      this.socket.onmessage = async (event) => {
        if (typeof event.data === 'string') {
            const data = JSON.parse(event.data);
            if (data.type === 'transcript') {
                // Synthesize the exact message shape that Vapi emits
                this.emit("message", {
                    type: "transcript",
                    transcriptType: "final",
                    role: data.role || "user", // "user" or "assistant"
                    transcript: data.text,
                    confidence: data.confidence || 0.99
                });
            } else if (data.type === 'vad') {
                if (data.status === 'speech_started') {
                    // This means User started speaking
                }
            } else if (data.type === 'ai-speech-start') {
                this.aiSpeaking = true;
                this.emit("speech-start");
            } else if (data.type === 'ai-speech-end') {
                this.aiSpeaking = false;
                this.emit("speech-end");
            } else if (data.type === 'interrupt') {
                // Stop all currently playing audio
                this.activeAudioElements.forEach(audio => {
                    audio.pause();
                    audio.currentTime = 0;
                });
                this.activeAudioElements = [];
                if (this.aiSpeaking) {
                    this.aiSpeaking = false;
                    this.emit("speech-end");
                }
            }
        } else if (event.data instanceof Blob) {
            // Audio response from TTS
            if (!this.aiSpeaking) {
                this.aiSpeaking = true;
                this.emit("speech-start");
            }
            const url = URL.createObjectURL(event.data);
            const audio = new Audio(url);
            this.activeAudioElements.push(audio);
            audio.onended = () => {
                this.activeAudioElements = this.activeAudioElements.filter(a => a !== audio);
                if (this.activeAudioElements.length === 0) {
                    this.emit("speech-end");
                    this.aiSpeaking = false;
                }
            };
            audio.play().catch(e => Logger.error("Failed to play AI audio", e));
        }
      };

      this.socket.onerror = (err) => {
        this.emit("error", err);
      };

      this.socket.onclose = () => {
        this.stop();
      };

      this.scriptProcessor.onaudioprocess = (event) => {
          if (this.isRecording && this.socket && this.socket.readyState === WebSocket.OPEN && !this.muted) {
              const inputData = event.inputBuffer.getChannelData(0);
              const int16Data = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                  const s = Math.max(-1, Math.min(1, inputData[i]));
                  int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
              }
              this.socket.send(int16Data.buffer);
          }
      };

      this.microphone.connect(this.scriptProcessor);
      this.scriptProcessor.connect(this.audioContext.destination);
      this.isRecording = true;

    } catch (err) {
      Logger.error("Failed to start SelfHostedVoiceProvider", err);
      this.emit("error", err);
    }
  }

  stop() {
    if (this.isRecording) {
      this.microphone?.disconnect();
      this.scriptProcessor?.disconnect();
      this.audioContext?.close();
      this.isRecording = false;
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          this.socket.send(JSON.stringify({ type: 'stop' }));
          this.socket.close();
      }
      this.emit("call-end");
    }
  }

  isMuted() {
    return this.muted;
  }

  setMuted(mute) {
    this.muted = mute;
  }

  send(msg) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: "client-message", message: msg }));
    }
  }
}
