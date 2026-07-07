import React from 'react';
import { User, Volume2, MicOff } from 'lucide-react';

const InterviewerCard = ({ name, role, state }) => {
  // state can be: 'SPEAKING', 'THINKING', 'LISTENING', 'OBSERVING', 'IDLE'
  
  const isSpeaking = state === 'SPEAKING';
  const isThinking = state === 'THINKING';
  const isListening = state === 'LISTENING';
  
  return (
    <div className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-500 ${
      isSpeaking 
        ? 'border-indigo-500 bg-indigo-50 shadow-[0_0_20px_rgba(79,70,229,0.3)] scale-105' 
        : 'border-blue-200/50 bg-white/95 opacity-90 scale-100 shadow-sm'
    }`}>
      {/* Speaking Voice Wave Indicator */}
      {isSpeaking && (
        <div className="absolute top-4 right-4 flex space-x-1">
          <div className="w-1 h-3 bg-indigo-500 rounded-full animate-[bounce_0.8s_infinite]"></div>
          <div className="w-1 h-4 bg-indigo-500 rounded-full animate-[bounce_0.8s_infinite]" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-1 h-2 bg-indigo-500 rounded-full animate-[bounce_0.8s_infinite]" style={{ animationDelay: '0.4s' }}></div>
        </div>
      )}

      {/* Thinking Indicator */}
      {isThinking && (
        <div className="absolute top-4 right-4 text-xs font-semibold text-indigo-400 animate-pulse flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
          Thinking...
        </div>
      )}

      {/* Avatar */}
      <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-3 transition-all duration-500 ${
        isSpeaking ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]' : 'bg-slate-100 text-slate-400'
      }`}>
        <User size={40} />
      </div>

      <h3 className={`font-black text-lg ${isSpeaking ? 'text-indigo-900' : 'text-slate-600'}`}>{name}</h3>
      <p className={`text-xs font-semibold uppercase tracking-wider ${isSpeaking ? 'text-indigo-500' : 'text-slate-400'}`}>{role}</p>

      {/* Status Badges */}
      <div className="mt-3 flex gap-2">
        {isSpeaking ? (
          <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] rounded-md font-bold flex items-center gap-1">
            <Volume2 size={12} /> Speaking
          </span>
        ) : isThinking ? (
          <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[10px] rounded-md font-bold flex items-center gap-1 animate-pulse">
            Thinking
          </span>
        ) : isListening ? (
          <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] rounded-md font-bold flex items-center gap-1">
            <MicOff size={12} /> Listening
          </span>
        ) : (
          <span className="px-2 py-1 bg-slate-50 text-slate-400 text-[10px] rounded-md font-bold flex items-center gap-1">
            Observing
          </span>
        )}
      </div>
    </div>
  );
};

export default InterviewerCard;
