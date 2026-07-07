import React from "react";
import { Mic, User } from "lucide-react";

/**
 * AiAvatar - Voice Visualization Implementation
 *
 * Replaces the legacy video loop with a lightweight, GPU-friendly animated 
 * CSS visualization that reacts accurately to the AI's speaking state.
 */
function AiAvatar({ gender, isSpeaking, isListening }) {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-100 overflow-hidden">
      
      {/* Background Pulse when speaking */}
      {isSpeaking && (
        <div className="absolute inset-0 bg-indigo-500/10 animate-pulse transition-opacity duration-500"></div>
      )}
       
      {/* Central Orb / Avatar */}
      <div className={`relative flex items-center justify-center w-32 h-32 rounded-full transition-all duration-500 z-10 ${
        isSpeaking ? 'bg-indigo-600 shadow-[0_0_40px_rgba(79,70,229,0.5)] scale-110' : 'bg-slate-300 shadow-md scale-100'
      }`}>
         
        {/* Ripples when speaking */}
        {isSpeaking && (
          <>
            <div className="absolute inset-0 rounded-full border-4 border-indigo-400 animate-ping opacity-75"></div>
            <div className="absolute inset-0 rounded-full border-4 border-indigo-300 animate-ping opacity-50" style={{ animationDelay: '0.3s' }}></div>
          </>
        )}

        <User size={64} className={`transition-colors duration-500 ${isSpeaking ? 'text-white' : 'text-slate-500'}`} />
      </div>

      {/* Voice Waveform Indicator */}
      {isSpeaking && (
        <div className="absolute bottom-16 flex space-x-1.5 items-end h-8 z-10">
          <div className="w-1.5 h-3 bg-indigo-500 rounded-full animate-[bounce_0.8s_infinite]"></div>
          <div className="w-1.5 h-6 bg-indigo-500 rounded-full animate-[bounce_0.8s_infinite]" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-1.5 h-8 bg-indigo-500 rounded-full animate-[bounce_0.8s_infinite]" style={{ animationDelay: '0.4s' }}></div>
          <div className="w-1.5 h-5 bg-indigo-500 rounded-full animate-[bounce_0.8s_infinite]" style={{ animationDelay: '0.6s' }}></div>
          <div className="w-1.5 h-3 bg-indigo-500 rounded-full animate-[bounce_0.8s_infinite]" style={{ animationDelay: '0.8s' }}></div>
        </div>
      )}

      {/* Status Badge */}
      <div className="absolute bottom-6 flex items-center gap-2 z-10">
        {isSpeaking ? (
          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 font-bold rounded-full text-xs uppercase tracking-widest flex items-center gap-2 shadow-sm border border-indigo-200">
            <Mic size={14} className="animate-pulse" /> AI Speaking
          </span>
        ) : (
          <span className="px-3 py-1 bg-slate-200 text-slate-500 font-bold rounded-full text-xs uppercase tracking-widest border border-slate-300 shadow-sm">
            AI Idle
          </span>
        )}
      </div>

    </div>
  );
}

export default AiAvatar;
