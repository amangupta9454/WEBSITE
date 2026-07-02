import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { Link } from "react-router-dom";
import { PlayCircle, Clock, CheckCircle, Video, Tag, Settings, X, Star } from "lucide-react";
import BuyTokensModal from "./BuyTokensModal";
import ProfileSettingsModal from "../../../Components/ProfileSettingsModal";

function FeedbackModal({ feedback, onClose }) {
  if (!feedback) return null;
  const evaluation = feedback.ai_evaluation;
  
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors">
          <X size={20} />
        </button>
        <div className="p-6 md:p-8">
          <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">
            <Star className="text-amber-500 fill-amber-500" /> AI Evaluation Report
          </h2>
          
          {evaluation ? (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-indigo-50 p-4 rounded-xl text-center border border-indigo-100">
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Overall</p>
                  <p className="text-3xl font-black text-indigo-900">{evaluation.overall_score}<span className="text-lg text-indigo-400">/10</span></p>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl text-center border border-blue-100">
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Technical</p>
                  <p className="text-3xl font-black text-blue-900">{evaluation.technical_score}<span className="text-lg text-blue-400">/10</span></p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-xl text-center border border-emerald-100">
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Comm.</p>
                  <p className="text-3xl font-black text-emerald-900">{evaluation.communication_score}<span className="text-lg text-emerald-400">/10</span></p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">Detailed Feedback</h3>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-600 leading-relaxed text-sm">
                  {evaluation.detailed_feedback}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-bold text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Strengths
                  </h3>
                  <ul className="space-y-2">
                    {evaluation.strengths?.map((s, i) => (
                      <li key={i} className="text-sm text-slate-600 bg-emerald-50/50 px-3 py-2 rounded-lg border border-emerald-100">{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div> Areas to Improve
                  </h3>
                  <ul className="space-y-2">
                    {evaluation.weaknesses?.map((w, i) => (
                      <li key={i} className="text-sm text-slate-600 bg-amber-50/50 px-3 py-2 rounded-lg border border-amber-100">{w}</li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {evaluation.enhancements && evaluation.enhancements.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div> Actionable Enhancements
                  </h3>
                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                    <ul className="space-y-3">
                      {evaluation.enhancements.map((e, i) => (
                        <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                          <span className="text-blue-500 font-bold mt-0.5">•</span>
                          <span className="leading-relaxed">{e}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-center">
                <p className="text-amber-700 font-medium text-sm">The raw transcript was collected, but no structured AI evaluation is available for this session.</p>
              </div>

              {/* Attention Metrics Section */}
              {feedback.attentionMetrics && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Attention Metrics</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(feedback.attentionMetrics).map(([k, v]) => (
                      <div key={k} className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-sm">
                        <p className="text-[10px] font-bold text-slate-400 uppercase truncate mb-1">{k}</p>
                        <p className="text-lg font-black text-slate-700">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Transcript Section */}
              {feedback.conversation && feedback.conversation.length > 0 && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Raw Transcript</h4>
                  <div className="max-h-80 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {feedback.conversation.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-sm shadow-md shadow-indigo-200' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm shadow-sm'}`}>
                          <p className="text-[10px] uppercase font-black opacity-70 mb-1">{msg.role === 'user' ? 'You' : 'AI Interviewer'}</p>
                          <p className="leading-relaxed">{msg.transcript || msg.text || ''}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function InterviewDashboardContent({ credits, isUnlimited, sessions, isLoading, onStartInterview, isIntern, userData, onBuyClick }) {
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [interviewEnabled, setInterviewEnabled] = useState(true);

  useEffect(() => {
    const checkFeature = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5004'}/api/admin/interview-settings`);
        const data = await res.json();
        if (data.success) setInterviewEnabled(data.enabled);
      } catch {}
    };
    checkFeature();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {interviewEnabled ? (
          <div className="bg-white p-6 rounded-2xl border border-blue-200 shadow-sm shadow-blue-100 relative overflow-hidden group cursor-pointer" onClick={onStartInterview}>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Video size={80} />
            </div>
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4 relative z-10">
              <PlayCircle size={24} />
            </div>
            <h3 className="font-bold text-slate-800 mb-1 relative z-10">Mock Interviews</h3>
            <p className="text-sm text-slate-500 relative z-10">Practice with AI</p>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 opacity-60 cursor-not-allowed relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Video size={80} />
            </div>
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center mb-4 relative z-10">
              <PlayCircle size={24} />
            </div>
            <h3 className="font-bold text-slate-800 mb-1 relative z-10">Mock Interviews</h3>
            <p className="text-sm text-slate-500 relative z-10">Coming Soon</p>
          </div>
        )}
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 opacity-60 cursor-not-allowed">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center mb-4">
            <CheckCircle size={24} />
          </div>
          <h3 className="font-bold text-slate-800 mb-1">Coding Challenges</h3>
          <p className="text-sm text-slate-500">Coming Soon</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 opacity-60 cursor-not-allowed">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center mb-4">
            <Clock size={24} />
          </div>
          <h3 className="font-bold text-slate-800 mb-1">Project Sandbox</h3>
          <p className="text-sm text-slate-500">Coming Soon</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 opacity-60 cursor-not-allowed">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center mb-4">
            <Tag size={24} />
          </div>
          <h3 className="font-bold text-slate-800 mb-1">Certifications</h3>
          <p className="text-sm text-slate-500">Coming Soon</p>
        </div>
      </div>

      {/* Mock Interviews Section */}
      {interviewEnabled && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black text-slate-800">Recent Interview Sessions</h3>
            <div className="flex items-center gap-3">
              <button 
                onClick={onStartInterview}
                className="text-blue-600 hover:text-blue-700 font-bold text-sm flex items-center gap-1"
              >
                Start New <PlayCircle size={16} />
              </button>
            </div>
          </div>


        {isLoading ? (
          <div className="text-center py-10">Loading your sessions...</div>
        ) : sessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <div key={session._id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-blue-50 text-blue-700 p-2 rounded-lg">
                    <Video size={20} />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    session.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {session.status}
                  </span>
                </div>
                <h4 className="font-bold text-lg text-slate-800 mb-1">{session.jobTitle}</h4>
                <p className="text-sm text-slate-500 mb-4 line-clamp-2">{session.jobDescription}</p>
                
                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock size={12} /> {new Date(session.createdAt).toLocaleDateString()}
                  </span>
                  
                  {session.feedback ? (
                    <button className="text-sm font-bold text-indigo-600 hover:text-indigo-800" onClick={() => setSelectedFeedback(session.feedback)}>
                      View Feedback
                    </button>
                  ) : (
                    <span className="text-sm text-slate-400 font-medium">No Feedback</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white py-16 px-6 text-center rounded-2xl shadow-sm border border-slate-200">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Video className="text-slate-400 w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No Interviews Yet</h3>
            <p className="text-slate-500 font-medium max-w-md mx-auto mb-6">
              You haven't completed any mock interviews yet. Start one now to practice your skills!
            </p>
            <button 
              onClick={onStartInterview}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 mx-auto transition-colors"
            >
              <PlayCircle size={18} /> Start Practice
            </button>
          </div>
        )}
        </div>
      )}

      <FeedbackModal feedback={selectedFeedback} onClose={() => setSelectedFeedback(null)} />
    </div>
  );
}
