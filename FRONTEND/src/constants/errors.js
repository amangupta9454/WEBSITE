export const INTERVIEW_ERRORS = {
  MIC_PERMISSION_DENIED: 'ERR_MIC_PERMISSION',
  MIC_NOT_FOUND: 'ERR_MIC_MISSING',
  MIC_CHANGED: 'ERR_MIC_CHANGED',
  CAMERA_FAILURE: 'ERR_CAMERA',
  NETWORK_OFFLINE: 'ERR_NETWORK',
  NETWORK_TIMEOUT: 'ERR_NETWORK',
  WEBRTC_FAILURE: 'ERR_WEBRTC',
  STT_FAILURE: 'ERR_STT',
  TTS_FAILURE: 'ERR_TTS',
  GROQ_FAILURE: 'ERR_GROQ',
  LLM_TIMEOUT: 'ERR_TIMEOUT',
  TIMEOUT: 'ERR_TIMEOUT',
  TRANSCRIBER_ERROR: 'ERR_STT',
  AUDIO_PLAYBACK_FAILED: 'ERR_WEBRTC',
  UNKNOWN_ERROR: 'ERR_UNKNOWN'
};

export const ERROR_MESSAGES = {
  [INTERVIEW_ERRORS.MIC_PERMISSION_DENIED]: "Microphone access was denied. Please allow it in your browser settings.",
  [INTERVIEW_ERRORS.MIC_NOT_FOUND]: "No microphone detected. Please plug in a headset or microphone.",
  [INTERVIEW_ERRORS.NETWORK_OFFLINE]: "Network connection lost. Please check your internet connection.",
  [INTERVIEW_ERRORS.LLM_TIMEOUT]: "The AI is taking too long to respond. Reconnecting...",
  [INTERVIEW_ERRORS.STT_FAILURE]: "Failed to transcribe audio. Please speak clearly or check your mic.",
  [INTERVIEW_ERRORS.WEBRTC_FAILURE]: "Browser audio is blocked. Please interact with the page to allow audio.",
  [INTERVIEW_ERRORS.UNKNOWN_ERROR]: "An unexpected error occurred. Please refresh the page.",
};
