import React from 'react';
import { User, Volume2, MicOff } from 'lucide-react';

const InterviewerCard = ({ name, role, state }) => {
  // state can be: 'SPEAKING', 'THINKING', 'LISTENING', 'OBSERVING', 'IDLE'
  
  const isSpeaking = state === 'SPEAKING';
  const isThinking = state === 'THINKING';
  const isListening = state === 'LISTENING';
  
  return (
    <div className={`relative flex flex-col items-center justify-center p-4 rounded-[2.5rem] border-4 transition-all duration-700 w-full h-full ${
      isSpeaking 
        ? 'border-indigo-400 bg-gradient-to-b from-indigo-50 to-white shadow-[0_0_40px_rgba(79,70,229,0.4)]' 
        : isListening 
        ? 'border-emerald-200 bg-white shadow-xl'
        : isThinking
        ? 'border-amber-200 bg-white shadow-xl shadow-amber-500/10'
        : 'border-slate-200 bg-slate-50 opacity-100 shadow-md' // No opacity dimming for observing
    }`}>
      {/* Dynamic Top Badge */}
      <div className="absolute top-4 left-4 z-20">
        <span className={`px-3 py-1.5 rounded-xl border shadow-sm text-[10px] font-bold tracking-widest uppercase flex items-center gap-1 ${
           isSpeaking ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
           isListening ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
           isThinking ? 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse' :
           'bg-slate-100 text-slate-500 border-slate-200'
        }`}>
          {isSpeaking && <Volume2 size={12} className="animate-pulse" />}
          {isListening && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>}
          {isThinking && <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce"></div>}
          {!isSpeaking && !isListening && !isThinking && <MicOff size={12} />}
          {isSpeaking ? 'Speaking' : isListening ? 'Listening' : isThinking ? 'Thinking' : 'Observing'}
        </span>
      </div>

      {/* Speaking Voice Wave Indicator */}
      {isSpeaking && (
        <div className="absolute top-4 right-4 flex space-x-1 items-end h-4">
          <div className="w-1 h-2 bg-indigo-500 rounded-full animate-[bounce_0.8s_infinite]"></div>
          <div className="w-1 h-4 bg-indigo-500 rounded-full animate-[bounce_0.8s_infinite]" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-1 h-3 bg-indigo-500 rounded-full animate-[bounce_0.8s_infinite]" style={{ animationDelay: '0.4s' }}></div>
          <div className="w-1 h-1 bg-indigo-500 rounded-full animate-[bounce_0.8s_infinite]" style={{ animationDelay: '0.6s' }}></div>
        </div>
      )}

      {/* Thinking Glow Dots */}
      {isThinking && (
        <div className="absolute top-4 right-4 flex space-x-1 items-center h-4">
          <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping"></div>
          <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping" style={{ animationDelay: '0.4s' }}></div>
        </div>
      )}

      {/* Avatar */}
      <div className={`w-28 h-28 rounded-full flex items-center justify-center mb-6 transition-all duration-700 ${
        isSpeaking ? 'bg-indigo-600 text-white shadow-[0_0_25px_rgba(79,70,229,0.6)] scale-110' : 
        isListening ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' :
        isThinking ? 'bg-amber-100 text-amber-600 border border-amber-200' :
        'bg-slate-100 text-slate-400 border border-slate-200'
      }`}>
        <User size={48} />
      </div>

      <h3 className={`font-black text-2xl mb-1 ${isSpeaking ? 'text-indigo-900' : isListening ? 'text-emerald-900' : 'text-slate-700'}`}>{name}</h3>
      <p className={`text-xs font-bold uppercase tracking-widest ${isSpeaking ? 'text-indigo-500' : 'text-slate-400'}`}>{role}</p>

    </div>
  );
};

export default InterviewerCard;
