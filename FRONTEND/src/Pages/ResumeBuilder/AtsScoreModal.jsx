import React from 'react';
import { X, Sparkles, AlertTriangle, CheckCircle, Target } from 'lucide-react';

const AtsScoreModal = ({ isOpen, onClose, score, suggestions }) => {
  if (!isOpen) return null;

  // Determine color based on score
  let scoreColor = "text-rose-500";
  let bgGlow = "shadow-rose-500/20";
  if (score >= 80) {
    scoreColor = "text-emerald-500";
    bgGlow = "shadow-emerald-500/20";
  } else if (score >= 60) {
    scoreColor = "text-amber-500";
    bgGlow = "shadow-amber-500/20";
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[95vh] flex flex-col overflow-hidden border border-slate-200 relative">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" /> AI ATS Analysis
          </h2>
          <button 
            onClick={onClose}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 flex flex-col items-center overflow-y-auto">
          
          {/* Score Display */}
          <div className="mb-8 flex flex-col items-center text-center">
            <p className="text-slate-500 text-sm font-medium uppercase tracking-widest mb-3">Overall ATS Match</p>
            <div className={`w-32 h-32 rounded-full border-8 bg-slate-50 flex items-center justify-center shadow-2xl ${bgGlow}`} style={{ borderColor: 'currentColor', color: score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#f43f5e' }}>
              <span className={`text-4xl font-black ${scoreColor}`}>{score}<span className="text-xl">%</span></span>
            </div>
            <p className="mt-4 text-sm text-slate-600 max-w-[280px]">
              {score >= 80 
                ? "Excellent! Your resume is highly optimized for Applicant Tracking Systems." 
                : score >= 60 
                ? "Good, but there is room for improvement to pass strict ATS filters." 
                : "Needs work. Follow the suggestions below to improve your chances."}
            </p>
          </div>

          {/* Suggestions */}
          <div className="w-full bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5 mb-3">
              <Target className="w-4 h-4 text-indigo-500" /> Actionable Suggestions
            </h3>
            {suggestions && suggestions.length > 0 ? (
              <ul className="space-y-3">
                {suggestions.map((sug, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                    {score >= 80 ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    )}
                    <span className="leading-relaxed">{sug}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500 italic">No suggestions provided by AI.</p>
            )}
          </div>
          
          <button 
            onClick={onClose}
            className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg active:scale-[0.98]"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};

export default AtsScoreModal;
