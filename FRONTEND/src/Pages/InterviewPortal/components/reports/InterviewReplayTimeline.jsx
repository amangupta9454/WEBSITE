import React from 'react';
import { PlayCircle } from 'lucide-react';

export default function InterviewReplayTimeline({ messages }) {
  if (!messages || messages.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
      <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
        <PlayCircle className="text-indigo-500" /> Interview Replay Timeline
      </h3>

      <div className="max-h-96 overflow-y-auto space-y-4 pr-2 custom-scrollbar border-l-2 border-slate-100 ml-2 pl-4">
        {messages.map((msg, i) => {
          let text = msg.transcript || msg.text || '';
          let speakerHeader = msg.role === 'user' ? 'Candidate (You)' : 'AI Interviewer';
          let isPanelist = false;
          
          const speakerMatch = text.match(/^\[(.*?)\]\s*(.*)$/s);
          if (speakerMatch) {
            speakerHeader = speakerMatch[1];
            text = speakerMatch[2];
            isPanelist = true;
          }

          return (
            <div key={i} className="relative">
              <div className={`absolute -left-[23px] top-1.5 w-3 h-3 rounded-full border-2 border-white ${msg.role === 'user' ? 'bg-indigo-500' : speakerHeader === 'Sarah' ? 'bg-pink-400' : speakerHeader === 'David' ? 'bg-emerald-400' : 'bg-slate-400'}`}></div>
              
              <div className="mb-1 flex items-center gap-2">
                <span className={`text-[10px] font-black uppercase tracking-wider ${msg.role === 'user' ? 'text-indigo-600' : speakerHeader === 'Sarah' ? 'text-pink-600' : speakerHeader === 'David' ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {speakerHeader}
                </span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
