import Vapi from '@vapi-ai/web';
import { EventEmitter } from './EventEmitter';
import { Logger } from '../utils/logger';

export class VapiProvider extends EventEmitter {
  constructor(apiKey) {
    super();
    this.vapi = new Vapi(apiKey);
    
    // Pass-through events
    this.vapi.on("call-start", () => this.emit("call-start"));
    this.vapi.on("call-end", () => this.emit("call-end"));
    this.vapi.on("speech-start", () => this.emit("speech-start"));
    this.vapi.on("speech-end", () => this.emit("speech-end"));
    this.vapi.on("message", (msg) => this.emit("message", msg));
    this.vapi.on("error", (err) => this.emit("error", err));
  }

  async start(assistant, overrideConfig, squadConfig) {
    return this.vapi.start(assistant, overrideConfig, squadConfig);
  }

  stop() {
    this.vapi.stop();
  }

  isMuted() {
    return this.vapi.isMuted();
  }

  setMuted(mute) {
    this.vapi.setMuted(mute);
  }

  send(msg) {
    this.vapi.send(msg);
  }
}
