import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { PlayCircle, Clock, CheckCircle, Video, Tag, Settings, X, Star, Briefcase } from "lucide-react";
import BuyTokensModal from "./BuyTokensModal";
import ProfileSettingsModal from "../../../Components/ProfileSettingsModal";

function FeedbackModal({ feedback: session, onClose }) {
  if (!session) return null;
  const evaluation = session.feedback?.ai_evaluation || session.feedback;
  const enterprise = session.feedback?.enterprise_evaluation;
  
  const deduplicatedConversation = session.messages?.reduce((acc, curr) => {
    if (acc.length === 0) return [{ ...curr }];
    const last = acc[acc.length - 1];
    const currText = (curr.transcript || curr.text || '').trim();
    const lastText = (last.transcript || last.text || '').trim();
    
    if (last.role === curr.role && (currText === lastText || currText.includes(lastText) || lastText.includes(currText))) {
      // Keep the longer text as it's likely the final transcript
      if (currText.length > lastText.length) {
        last.transcript = currText;
        last.text = currText;
      }
      return acc;
    }
    acc.push({ ...curr });
    return acc;
  }, []) || [];

  const formatMetricValue = (key, value) => {
    if (key === 'eyeContactScore' || key === 'attentionScore') return `${value}/10`;
    if (key === 'faceVisibilityPct') return `${value}%`;
    if (key === 'lookAwayDurationSec') return `${value}s`;
    if (key === 'interviewDurationMin') return `${value}m`;
    return value;
  };
  
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
              
              {enterprise && (
                <div className="space-y-6 pt-6 border-t border-slate-100">
                  <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <Briefcase className="text-indigo-500" /> Enterprise Hiring Assessment
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Recommendation</p>
                      <p className="text-sm font-bold text-slate-700">{enterprise.final_recommendation || "N/A"}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Experience Level</p>
                      <p className="text-sm font-bold text-slate-700">{enterprise.estimated_experience_level || "N/A"}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Hiring Risk</p>
                      <p className="text-sm font-bold text-slate-700">{enterprise.hiring_risk || "N/A"}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Salary Band</p>
                      <p className="text-sm font-bold text-slate-700">{enterprise.estimated_salary_band || "N/A"}</p>
                    </div>
                  </div>

                  {enterprise.recommendation_reason && (
                    <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                      <p className="text-xs font-bold text-indigo-800 mb-1">Reasoning</p>
                      <p className="text-sm text-indigo-900/80">{enterprise.recommendation_reason}</p>
                    </div>
                  )}

                  {enterprise.skill_matrix && enterprise.skill_matrix.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Skill Matrix</h4>
                      <div className="grid gap-2">
                        {enterprise.skill_matrix.map((sk, i) => (
                          <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm gap-2">
                            <div className="flex items-center gap-3">
                              <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase ${
                                sk.status?.toLowerCase() === 'verified' ? 'bg-emerald-100 text-emerald-700' :
                                sk.status?.toLowerCase() === 'weak' ? 'bg-amber-100 text-amber-700' :
                                'bg-rose-100 text-rose-700'
                              }`}>
                                {sk.status}
                              </span>
                              <span className="font-bold text-slate-700 text-sm">{sk.skill}</span>
                            </div>
                            <span className="text-xs text-slate-500 italic">{sk.evidence}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {enterprise.knowledge_gaps && enterprise.knowledge_gaps.length > 0 && (
                    <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100 mt-4">
                      <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wider mb-3">Critical Knowledge Gaps Detected</h4>
                      <ul className="space-y-2 text-sm text-rose-900/80">
                        {enterprise.knowledge_gaps.map((gap, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-rose-500 mt-0.5">•</span>
                            <span>{gap}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {enterprise.interview_timeline && enterprise.interview_timeline.length > 0 && (
                    <div className="pt-6 border-t border-slate-100 mt-6">
                      <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Question-by-Question Breakdown</h4>
                      <div className="space-y-4">
                        {enterprise.interview_timeline.map((item, i) => (
                          <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="font-bold text-slate-800 text-sm">{item.question}</h5>
                              <span className="px-2 py-1 bg-indigo-100 text-indigo-700 font-black text-xs rounded-lg">Score: {item.score}/10</span>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-3 text-sm text-slate-600">
                              <strong className="text-slate-700 text-xs uppercase block mb-1">Your Answer Summary:</strong>
                              {item.candidate_answer_summary}
                            </div>
                            {item.suggested_better_answer && (
                              <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 mb-3 text-sm text-emerald-800">
                                <strong className="text-emerald-700 text-xs uppercase block mb-1">How you could have improved:</strong>
                                {item.suggested_better_answer}
                              </div>
                            )}
                            {item.learning_resource && (
                              <p className="text-xs text-indigo-600 font-medium">
                                📚 <span className="underline decoration-indigo-300 underline-offset-2 cursor-pointer">{item.learning_resource}</span>
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-center mb-8">
              <p className="text-amber-700 font-medium text-sm">The raw transcript was collected, but no structured AI evaluation is available for this session.</p>
            </div>
          )}

          <div className="space-y-8 mt-8 pt-8 border-t border-slate-100">
            {/* Attention Metrics Section */}
            {session.attentionReport && Object.keys(session.attentionReport).length > 0 && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Attention Metrics</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(session.attentionReport).map(([k, v]) => (
                    <div key={k} className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-sm">
                      <p className="text-[10px] font-bold text-slate-400 uppercase truncate mb-1">{k.replace(/([A-Z])/g, ' $1').trim()}</p>
                      <p className="text-lg font-black text-slate-700">{formatMetricValue(k, v)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transcript Section */}
            {deduplicatedConversation.length > 0 && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Raw Transcript</h4>
                <div className="max-h-80 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                  {deduplicatedConversation.map((msg, i) => (
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
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function InterviewDashboardContent({ credits, isUnlimited, interviewEnabled = true, sessions, isLoading, onStartInterview, isIntern, userData, onBuyClick }) {
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [rePracticeSession, setRePracticeSession] = useState(null);
  const navigate = useNavigate();
  
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);

  const handleStartAttempt = () => {
    if (!isUnlimited && credits <= 0) {
      if (onBuyClick) {
        onBuyClick();
      } else {
        setIsBuyModalOpen(true);
      }
    } else {
      if (onStartInterview) onStartInterview();
    }
  };



  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* Feature Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {interviewEnabled ? (
          <div className="bg-white p-3 sm:p-6 rounded-xl sm:rounded-2xl border border-blue-200 shadow-sm shadow-blue-100 relative overflow-hidden group cursor-pointer" onClick={onStartInterview}>
            <div className="absolute top-0 right-0 p-2 sm:p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Video className="w-12 h-12 sm:w-20 sm:h-20" />
            </div>
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-100 text-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-4 relative z-10">
              <PlayCircle className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-[11px] sm:text-base leading-tight mb-0.5 sm:mb-1 relative z-10">Mock Interviews</h3>
            <p className="text-[9px] sm:text-sm text-slate-500 relative z-10 leading-tight">Practice with AI</p>
          </div>
        ) : (
          <div className="bg-white p-3 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200 opacity-60 cursor-not-allowed relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 sm:p-4 opacity-10">
              <Video className="w-12 h-12 sm:w-20 sm:h-20" />
            </div>
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-slate-100 text-slate-400 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-4 relative z-10">
              <PlayCircle className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-[11px] sm:text-base leading-tight mb-0.5 sm:mb-1 relative z-10">Mock Interviews</h3>
            <p className="text-[9px] sm:text-sm text-slate-500 relative z-10 leading-tight">Not Available</p>
          </div>
        )}
        
        <div className="bg-white p-3 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200 opacity-60 cursor-not-allowed">
          <div className="w-8 h-8 sm:w-12 sm:h-12 bg-slate-100 text-slate-400 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-4">
            <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-[11px] sm:text-base leading-tight mb-0.5 sm:mb-1">Coding Challenges</h3>
          <p className="text-[9px] sm:text-sm text-slate-500 leading-tight">Not Available</p>
        </div>

        <div className="bg-white p-3 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200 opacity-60 cursor-not-allowed">
          <div className="w-8 h-8 sm:w-12 sm:h-12 bg-slate-100 text-slate-400 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-4">
            <Clock className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-[11px] sm:text-base leading-tight mb-0.5 sm:mb-1">Project Sandbox</h3>
          <p className="text-[9px] sm:text-sm text-slate-500 leading-tight">Not Available</p>
        </div>

        <div className="bg-white p-3 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200 opacity-60 cursor-not-allowed">
          <div className="w-8 h-8 sm:w-12 sm:h-12 bg-slate-100 text-slate-400 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-4">
            <Tag className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-[11px] sm:text-base leading-tight mb-0.5 sm:mb-1">Certifications</h3>
          <p className="text-[9px] sm:text-sm text-slate-500 leading-tight">Not Available</p>
        </div>
      </div>

      {/* Mock Interviews Section */}
      <div>
          <div className="flex items-center justify-between mb-3 sm:mb-6">
            <h3 className="text-base sm:text-xl font-black text-slate-800 leading-tight">Recent Interview Sessions</h3>
            <div className="flex items-center shrink-0 ml-2">
              {interviewEnabled && (
                <button 
                  onClick={handleStartAttempt}
                  className="text-blue-600 hover:text-blue-700 font-bold text-xs sm:text-sm flex items-center gap-1"
                >
                  <span className="hidden sm:inline">Start New</span>
                  <span className="sm:hidden">Start</span>
                  <PlayCircle size={16} />
                </button>
              )}
            </div>
          </div>


        {isLoading ? (
          <div className="text-center py-10">Loading your sessions...</div>
        ) : sessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {sessions.map((session) => (
              <div key={session._id} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex flex-col">
                <div className="flex justify-between items-start mb-3 sm:mb-4">
                  <div className="bg-blue-50 text-blue-700 p-1.5 sm:p-2 rounded-lg">
                    <Video size={20} />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    session.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {session.status}
                  </span>
                </div>
                <h4 className="font-bold text-base sm:text-lg text-slate-800 mb-0.5 sm:mb-1">{session.jobTitle}</h4>
                <p className="text-xs sm:text-sm text-slate-500 mb-3 sm:mb-4 line-clamp-2">{session.jobDescription}</p>
                
                <div className="mt-auto pt-3 sm:pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock size={12} /> {new Date(session.createdAt).toLocaleDateString()}
                  </span>
                  
                  {session.status !== 'Completed' && localStorage.getItem(`repracticed_${session._id}`) !== 'true' ? (
                    <button className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors" onClick={() => setRePracticeSession(session)}>
                      <PlayCircle size={14} /> Re-practice
                    </button>
                  ) : session.feedback ? (
                    <button className="text-sm font-bold text-indigo-600 hover:text-indigo-800" onClick={() => setSelectedFeedback(session)}>
                      View Feedback
                    </button>
                  ) : (
                    <span className="text-sm text-slate-400 font-medium">Session Closed</span>
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
              You haven't completed any mock interviews yet.
            </p>
            {interviewEnabled && (
              <button 
                onClick={handleStartAttempt}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 mx-auto transition-colors"
              >
                <PlayCircle size={18} /> Start Practice
              </button>
            )}
          </div>
        )}
      </div>

      <FeedbackModal feedback={selectedFeedback} onClose={() => setSelectedFeedback(null)} />

      {rePracticeSession && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl relative text-center">
            <button onClick={() => setRePracticeSession(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors">
              <X size={20} />
            </button>
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <PlayCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Resume Session</h3>
            <p className="text-slate-500 text-sm mb-6">
              You are about to resume your unfinished interview for <strong>{rePracticeSession.jobTitle}</strong>. No extra credits will be deducted.
            </p>
            <button 
              onClick={() => {
                const id = rePracticeSession._id;
                localStorage.setItem(`repracticed_${id}`, 'true');
                setRePracticeSession(null);
                navigate(`/interview-active/${id}`);
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-indigo-200"
            >
              Start Interview Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
