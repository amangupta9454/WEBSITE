import React from 'react';
import { User, Volume2, MicOff } from 'lucide-react';

const InterviewerCard = ({ name, role, isActive, isThinking, isMuted }) => {
  return (
    <div className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 ${
      isActive 
        ? 'border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-100 scale-105' 
        : 'border-slate-200 bg-white opacity-75'
    }`}>
      {/* Speaking Indicator */}
      {isActive && !isThinking && !isMuted && (
        <div className="absolute top-4 right-4 flex space-x-1">
          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      )}

      {/* Thinking Indicator */}
      {isActive && isThinking && (
        <div className="absolute top-4 right-4 text-xs font-semibold text-indigo-500 animate-pulse">
          Thinking...
        </div>
      )}

      {/* Avatar */}
      <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-3 transition-all ${
        isActive ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-400'
      }`}>
        <User size={40} />
      </div>

      <h3 className={`font-black text-lg ${isActive ? 'text-indigo-900' : 'text-slate-600'}`}>{name}</h3>
      <p className={`text-xs font-semibold uppercase tracking-wider ${isActive ? 'text-indigo-500' : 'text-slate-400'}`}>{role}</p>

      {/* Status Badges */}
      <div className="mt-3 flex gap-2">
        {isActive ? (
          <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] rounded-md font-bold flex items-center gap-1">
            <Volume2 size={12} /> Active
          </span>
        ) : (
          <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] rounded-md font-bold flex items-center gap-1">
            <MicOff size={12} /> Listening
          </span>
        )}
      </div>
    </div>
  );
};

export default InterviewerCard;
