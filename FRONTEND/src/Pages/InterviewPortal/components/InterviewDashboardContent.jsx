import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { PlayCircle, Clock, CheckCircle, Video, Tag, Settings, X, Star, Briefcase, Loader2, FileText, Sparkles, User, RefreshCw } from "lucide-react";
import BuyTokensModal from "./BuyTokensModal";
import ProfileSettingsModal from "../../../Components/ProfileSettingsModal";
import axios from "axios";

// V2 Panel Components
import ExecutiveSummaryCard from "./reports/ExecutiveSummaryCard";
import SarahReportCard from "./reports/SarahReportCard";
import DavidReportCard from "./reports/DavidReportCard";
import CommitteeDecisionCard from "./reports/CommitteeDecisionCard";
import ResumeVerificationCard from "./reports/ResumeVerificationCard";
import InterviewTimelineCard from "./reports/InterviewTimelineCard";
import StagePerformanceCard from "./reports/StagePerformanceCard";
import SkillIntelligenceCard from "./reports/SkillIntelligenceCard";
import DifficultyProgressionCard from "./reports/DifficultyProgressionCard";
import KnowledgeGapCard from "./reports/KnowledgeGapCard";
import ImprovementRoadmapCard from "./reports/ImprovementRoadmapCard";
import InterviewReplayTimeline from "./reports/InterviewReplayTimeline";
import PerformanceAnalyticsCard from "./reports/PerformanceAnalyticsCard";
import InterviewerReportCard from "./reports/InterviewerReportCard";

// Enterprise Layer Components
import EnterpriseCommitteeCard from "./reports/EnterpriseCommitteeCard";
import EnterpriseSkillHeatmap from "./reports/EnterpriseSkillHeatmap";
import EnterpriseKnowledgeDepth from "./reports/EnterpriseKnowledgeDepth";
import EnterpriseResumeVerification from "./reports/EnterpriseResumeVerification";

const CircularScore = ({ score, max = 10, label, colorClass, bgClass, textClass }) => {
  const percentage = (score / max) * 100;
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`flex flex-col items-center p-5 rounded-3xl border ${bgClass} border-opacity-60 shadow-sm relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300`}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/40 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500 pointer-events-none"></div>
      <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${textClass} z-10 opacity-80`}>{label}</p>
      <div className="relative w-24 h-24 flex items-center justify-center z-10">
        <svg className="w-full h-full transform -rotate-90 drop-shadow-sm" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" className="text-black/5" />
          <circle cx="40" cy="40" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className={`${colorClass} transition-all duration-1000 ease-out`} />
        </svg>
        <div className="absolute flex items-baseline gap-0.5">
          <span className={`text-3xl font-black ${textClass}`}>{score}</span>
          <span className={`text-sm font-bold opacity-50 ${textClass}`}>/{max}</span>
        </div>
      </div>
    </div>
  );
};

export function FeedbackModal({ feedback: session, onClose }) {
  const [localSession, setLocalSession] = useState(session);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    setLocalSession(session);
  }, [session]);

  useEffect(() => {
    if (!localSession) return;
    const hasEnterprise = localSession.feedback?.enterprise_evaluation;
    const isFailed = localSession.feedback?.enterprise_evaluation?.status === "failed";
    const needsRetry = (!hasEnterprise || isFailed) && localSession.messages?.length > 0;
    
    if (needsRetry && !isRetrying) {
      setIsRetrying(true);
      const token = localStorage.getItem('token');
      axios.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/interview-session/retry-evaluation/${localSession._id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        if (res.data.success && res.data.session) {
          setLocalSession(res.data.session);
        }
      }).catch(err => {
        console.error("Failed to retry evaluation", err);
      }).finally(() => {
        setIsRetrying(false);
      });
    }
  }, [localSession?._id]); // Run only when session ID changes

  if (!localSession) return null;
  const evaluation = localSession.feedback?.ai_evaluation || localSession.feedback;
  const enterprise = localSession.feedback?.enterprise_evaluation || evaluation;
  const isEnterpriseMode = !!enterprise?.enterprise_evaluation;
  
  const deduplicatedConversation = localSession.messages?.reduce((acc, curr) => {
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
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl relative custom-scrollbar flex flex-col overflow-hidden">
        
        {/* Stunning Gradient Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-800 p-8 relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl -ml-10 -mb-10"></div>
          
          <button onClick={onClose} className="absolute top-6 right-6 p-2 text-white/60 hover:text-white bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full transition-colors z-20">
            <X size={20} />
          </button>
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 text-white/90 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 backdrop-blur-md border border-white/20">
              <Star size={12} className="text-amber-300 fill-amber-300" /> AI Evaluation Report
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-2">
              Performance Insights
            </h2>
            <p className="text-indigo-200 text-sm font-medium max-w-lg">
              Here is a deep-dive analysis of your mock interview. Use these highly actionable insights to prepare and dominate your actual interview.
            </p>
          </div>
        </div>

        <div className="p-6 md:p-8 bg-slate-50/50 flex-1">
          {evaluation ? (
            <div className="space-y-8">
              
              {(() => {
                const isPanelV2 = !!enterprise?.hiring_committee;
                const isPanelV1 = !!evaluation.hr_feedback || !!evaluation.technical_feedback;
                
                if (isPanelV2) {
                  return (
                    <div className="space-y-8">
                      {/* --- ENTERPRISE LAYER COMPOSITION --- */}
                      {isEnterpriseMode && (
                        <div className="space-y-8 mb-12 border-b border-slate-200 pb-12 relative">
                          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-50 px-4">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                              Enterprise Layer Active
                            </span>
                          </div>
                          
                          <EnterpriseCommitteeCard data={enterprise.enterprise_evaluation.committee} />
                          
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <EnterpriseSkillHeatmap data={enterprise.enterprise_evaluation.skillHeatmap} />
                            <EnterpriseKnowledgeDepth data={enterprise.enterprise_evaluation.knowledgeDepth} />
                          </div>
                          
                          <EnterpriseResumeVerification data={enterprise.enterprise_evaluation.resumeVerification} />
                        </div>
                      )}

                      <ExecutiveSummaryCard data={enterprise.executive_summary} session={localSession} />
                      
                      {enterprise.interviewer_reports && enterprise.interviewer_reports.length > 0 ? (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                          {enterprise.interviewer_reports.map((report, i) => (
                            <InterviewerReportCard key={i} data={report} />
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                          <SarahReportCard data={enterprise.sarah_report} />
                          <DavidReportCard data={enterprise.david_report} />
                        </div>
                      )}

                      <CommitteeDecisionCard data={enterprise.hiring_committee} />
                      
                      <ResumeVerificationCard data={localSession?.recruiterMemory?.evidenceGraph || []} />
                      
                      <InterviewTimelineCard data={enterprise.interview_timeline} />
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <StagePerformanceCard data={localSession?.stageHistory || []} />
                        <PerformanceAnalyticsCard data={enterprise.performance_analytics} />
                      </div>
                      
                      <SkillIntelligenceCard data={enterprise.skill_intelligence} />
                      
                      <DifficultyProgressionCard data={enterprise.difficulty_progression} />
                      
                      <KnowledgeGapCard data={enterprise.knowledge_gap_analysis} />
                      
                      <ImprovementRoadmapCard data={enterprise.improvement_roadmap} />
                      
                      <InterviewReplayTimeline messages={localSession?.messages || []} />
                    </div>
                  );
                }

                if (isPanelV1) {
                  return (
                    <div className="space-y-8">
                       {/* Sarah's Section */}
                       <div className="bg-indigo-50/50 rounded-2xl border-2 border-indigo-100 p-6 shadow-sm">
                          <h3 className="text-xl font-black text-indigo-900 mb-6 flex items-center gap-2">
                            <User className="text-indigo-500" /> Sarah (HR / Behavioral) Feedback
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 max-w-lg">
                            <CircularScore score={evaluation.hr_feedback?.communication_score} max={100} label="Communication" colorClass="text-indigo-600" bgClass="bg-white border-indigo-100" textClass="text-indigo-900" />
                            <CircularScore score={evaluation.hr_feedback?.confidence_score} max={100} label="Confidence" colorClass="text-pink-500" bgClass="bg-white border-pink-100" textClass="text-pink-900" />
                          </div>
                          
                          {evaluation.hr_feedback?.summary && (
                            <div className="bg-white p-4 rounded-xl border border-indigo-100 mb-6 shadow-sm">
                              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-2">Overall Assessment</p>
                              <p className="text-indigo-900/80 text-sm font-medium leading-relaxed italic">"{evaluation.hr_feedback?.summary}"</p>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
                               <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-2">Leadership</p>
                               <p className="text-sm font-medium text-slate-700 leading-relaxed">{evaluation.hr_feedback?.leadership_signals || "No strong signals detected."}</p>
                             </div>
                             <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
                               <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-2">Teamwork</p>
                               <p className="text-sm font-medium text-slate-700 leading-relaxed">{evaluation.hr_feedback?.teamwork_signals || "No strong signals detected."}</p>
                             </div>
                             <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
                               <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-2">Culture Fit</p>
                               <p className="text-sm font-medium text-slate-700 leading-relaxed">{evaluation.hr_feedback?.culture_fit || "Neutral culture fit."}</p>
                             </div>
                          </div>
                       </div>

                       {/* David's Section */}
                       <div className="bg-emerald-50/50 rounded-2xl border-2 border-emerald-100 p-6 shadow-sm">
                          <h3 className="text-xl font-black text-emerald-900 mb-6 flex items-center gap-2">
                            <User className="text-emerald-500" /> David (Tech Lead) Feedback
                          </h3>
                          <div className="grid grid-cols-1 gap-4 mb-6 max-w-xs">
                            <CircularScore score={evaluation.technical_feedback?.overall_technical_score} max={100} label="Technical Depth" colorClass="text-emerald-600" bgClass="bg-white border-emerald-100" textClass="text-emerald-900" />
                          </div>
                          
                          {evaluation.technical_feedback?.summary && (
                            <div className="bg-white p-4 rounded-xl border border-emerald-100 mb-6 shadow-sm">
                              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2">Overall Assessment</p>
                              <p className="text-emerald-900/80 text-sm font-medium leading-relaxed italic">"{evaluation.technical_feedback?.summary}"</p>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                             <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
                               <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-2">Problem Solving</p>
                               <p className="text-sm font-medium text-slate-700 leading-relaxed">{evaluation.technical_feedback?.problem_solving || "N/A"}</p>
                             </div>
                             <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
                               <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-2">Architecture & System Design</p>
                               <p className="text-sm font-medium text-slate-700 leading-relaxed">{evaluation.technical_feedback?.architecture_knowledge || "N/A"}</p>
                             </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h3 className="text-sm font-bold text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Technical Strengths
                              </h3>
                              <ul className="space-y-2">
                                {evaluation.technical_feedback?.strengths?.map((s, i) => (
                                  <li key={i} className="text-sm text-slate-600 bg-emerald-50/50 px-3 py-2 rounded-lg border border-emerald-100">{s}</li>
                                ))}
                                {(!evaluation.technical_feedback?.strengths || evaluation.technical_feedback?.strengths.length === 0) && (
                                  <li className="text-sm text-slate-400 italic">No specific strengths highlighted.</li>
                                )}
                              </ul>
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-amber-500"></div> Knowledge Gaps
                              </h3>
                              <ul className="space-y-2">
                                {evaluation.technical_feedback?.weaknesses?.map((w, i) => (
                                  <li key={i} className="text-sm text-slate-600 bg-amber-50/50 px-3 py-2 rounded-lg border border-amber-100">{w}</li>
                                ))}
                                {(!evaluation.technical_feedback?.weaknesses || evaluation.technical_feedback?.weaknesses.length === 0) && (
                                  <li className="text-sm text-slate-400 italic">No specific gaps highlighted.</li>
                                )}
                              </ul>
                            </div>
                          </div>
                       </div>
                       
                       {/* Hiring Committee Decision */}
                       <div className="bg-slate-900 rounded-2xl border-2 border-slate-800 p-6 text-white shadow-xl shadow-slate-900/20">
                          <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                            <Briefcase className="text-indigo-400" /> Hiring Committee Decision
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                             <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Final Recommendation</p>
                               <p className={`text-2xl font-black ${String(evaluation.final_recommendation).includes('Hire') && !String(evaluation.final_recommendation).includes('No') ? 'text-emerald-400' : 'text-red-400'}`}>
                                 {evaluation.final_recommendation || "N/A"}
                               </p>
                             </div>
                             <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Estimated Level</p>
                               <p className="text-xl font-black text-indigo-400">{evaluation.estimated_experience_level || "Unknown"}</p>
                             </div>
                          </div>
                          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                             <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Recommendation Reason</p>
                             <p className="text-sm font-medium text-slate-300 leading-relaxed">{evaluation.recommendation_reason || "No reasoning provided."}</p>
                          </div>
                       </div>
                    </div>
                  );
                }
                
                // Fallback for Standard Interview UI
                return (
                  <div className="space-y-8">

              
              {isRetrying && (
                <div className="bg-indigo-50/80 p-6 rounded-2xl border border-indigo-200 text-center flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                  <p className="text-indigo-800 font-bold text-sm">Hold on, the AI is finalizing your evaluation...</p>
                  <p className="text-indigo-500 text-xs">This takes about 10-15 seconds.</p>
                </div>
              )}

              {/* Score Dials Section */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <CircularScore 
                  score={evaluation.overall_score} 
                  label="Overall Score" 
                  colorClass="text-indigo-600" 
                  bgClass="bg-indigo-50 border-indigo-100" 
                  textClass="text-indigo-900" 
                />
                <CircularScore 
                  score={evaluation.technical_score} 
                  label="Technical Depth" 
                  colorClass="text-blue-500" 
                  bgClass="bg-blue-50 border-blue-100" 
                  textClass="text-blue-900" 
                />
                <CircularScore 
                  score={evaluation.communication_score} 
                  label="Communication" 
                  colorClass="text-emerald-500" 
                  bgClass="bg-emerald-50 border-emerald-100" 
                  textClass="text-emerald-900" 
                />
              </div>

              {/* Encouraging Action Plan Banner */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-orange-400/10 rounded-full blur-2xl"></div>
                <h3 className="text-amber-900 font-black flex items-center gap-2 text-lg mb-1">
                  🚀 Your Path to Success
                </h3>
                <p className="text-amber-800/80 text-sm font-medium mb-3">
                  Don't worry about the raw scores—interviews are about improvement! Review the Enterprise Assessment below, study your specific knowledge gaps, and practice the suggested better answers. You've got this!
                </p>
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

                  {/* Speech Analytics Section */}
                  {enterprise.speech_analysis && (
                    <div className="bg-purple-50/50 rounded-xl p-5 border border-purple-100 mt-6 shadow-sm">
                      <h4 className="text-xs font-bold text-purple-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                        🎙️ Speech & Delivery Analytics
                      </h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                        <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm flex items-center justify-between group hover:border-purple-300 transition-colors">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-purple-500 transition-colors">Confidence Score</p>
                            <div className="flex items-baseline gap-1">
                              <span className="text-3xl font-black text-purple-900">{enterprise.speech_analysis.confidence_score}</span>
                              <span className="text-sm font-bold text-purple-400">/100</span>
                            </div>
                          </div>
                          <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                            <Star size={24} className="fill-current" />
                          </div>
                        </div>
                        
                        <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-sm flex items-center justify-between group hover:border-rose-300 transition-colors">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-rose-500 transition-colors">Filler Words Detected</p>
                            <div className="flex items-baseline gap-1">
                              <span className="text-3xl font-black text-rose-600">{enterprise.speech_analysis.filler_words_used}</span>
                              <span className="text-sm font-bold text-slate-400">times</span>
                            </div>
                          </div>
                          <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
                            <Clock size={24} />
                          </div>
                        </div>
                      </div>

                      {enterprise.speech_analysis.frequent_filler_words && enterprise.speech_analysis.frequent_filler_words.length > 0 && (
                        <div className="mb-4 bg-white p-3 rounded-lg border border-purple-100">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Most frequent filler words:</p>
                          <div className="flex flex-wrap gap-2">
                            {enterprise.speech_analysis.frequent_filler_words.map((word, idx) => (
                              <span key={idx} className="px-3 py-1 bg-rose-50 text-rose-700 font-black text-xs rounded-full border border-rose-200">
                                "{word}"
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {enterprise.speech_analysis.speech_feedback && (
                        <div className="bg-white p-4 rounded-lg border border-purple-200 text-sm text-purple-900 relative overflow-hidden">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-400"></div>
                          <strong className="text-purple-700 text-[10px] uppercase block mb-1">Delivery Critique:</strong>
                          <p className="font-medium leading-relaxed">{enterprise.speech_analysis.speech_feedback}</p>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}
            </div>
            );
          })()}
            </div>
          ) : isRetrying ? (
            <div className="bg-indigo-50/80 p-8 rounded-2xl border border-indigo-200 text-center flex flex-col items-center justify-center space-y-4 mb-8">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
              <p className="text-indigo-800 font-black text-lg">AI is evaluating your transcript...</p>
              <p className="text-indigo-600/80 text-sm font-medium">This usually takes about 10-15 seconds. Please don't close this window.</p>
            </div>
          ) : (
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-center mb-8">
              <p className="text-amber-700 font-medium text-sm">The raw transcript was collected, but no structured AI evaluation is available for this session.</p>
            </div>
          )}

          <div className="space-y-8 mt-8 pt-8 border-t border-slate-100">
            {/* Attention Metrics Section */}
            {localSession.attentionReport && Object.keys(localSession.attentionReport).length > 0 && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Attention Metrics</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(localSession.attentionReport).map(([k, v]) => (
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
                  {deduplicatedConversation.map((msg, i) => {
                    let text = msg.transcript || msg.text || '';
                    let speakerHeader = msg.role === 'user' ? 'You' : 'AI Interviewer';
                    let isPanelist = false;
                    
                    // Parse [Speaker] tags if they exist
                    const speakerMatch = text.match(/^\[(.*?)\]\s*(.*)$/s);
                    if (speakerMatch) {
                      speakerHeader = speakerMatch[1];
                      text = speakerMatch[2];
                      isPanelist = true;
                    }

                    return (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-sm shadow-md shadow-indigo-200' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm shadow-sm'}`}>
                          <p className={`text-[10px] uppercase font-black mb-1 ${
                            msg.role === 'user' ? 'opacity-70' : 
                            speakerHeader === 'Sarah' ? 'text-indigo-600' : 
                            speakerHeader === 'David' ? 'text-emerald-600' : 'opacity-70'
                          }`}>
                            {speakerHeader}
                          </p>
                          <p className="leading-relaxed">{text}</p>
                        </div>
                      </div>
                    );
                  })}
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

export default function InterviewDashboardContent({ credits, isUnlimited, interviewEnabled = true, resumeEnabled = true, sessions, isLoading, onStartInterview, isIntern, userData, onBuyClick }) {
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [rePracticeSession, setRePracticeSession] = useState(null);
  const [showJobPortal, setShowJobPortal] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchSetting = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/settings/job-portal`);
        setShowJobPortal(res.data.jobPortalEnabled);
      } catch (error) {
        console.error('Failed to fetch job portal setting', error);
      }
    };
    fetchSetting();
  }, []);
  
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

  const handleRetryEvaluation = async (sessionId) => {
    try {
      const token = localStorage.getItem('interviewToken');
      if (!token) return;
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/interview-session/retry-evaluation/${sessionId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        toast.success('Evaluation re-started in background!');
        window.location.reload(); // refresh to show evaluating status
      } else {
        toast.error(res.data.message || 'Failed to retry evaluation');
      }
    } catch (err) {
      toast.error('Error retrying evaluation');
    }
  };



  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Feature Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-6">
        
        {/* AI Resume Builder Card */}
        <div 
          className={`bg-white p-3 sm:p-6 rounded-xl sm:rounded-2xl border ${resumeEnabled ? 'border-indigo-200 shadow-sm shadow-indigo-100 hover:-translate-y-1 hover:shadow-md hover:shadow-indigo-200 cursor-pointer' : 'border-slate-200 opacity-75 cursor-not-allowed'} relative overflow-hidden group transition-all duration-300`} 
          onClick={() => {
            if (resumeEnabled) navigate('/my-resumes');
            else toast.error("Resume feature is currently disabled.");
          }}
        >
          <div className="absolute top-0 right-0 p-2 sm:p-4 opacity-10 group-hover:scale-110 transition-transform">
            <FileText className="w-12 h-12 sm:w-20 sm:h-20" />
          </div>
          <div className={`w-8 h-8 sm:w-12 sm:h-12 ${resumeEnabled ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'} rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-4 relative z-10`}>
            <FileText className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-[11px] sm:text-base leading-tight mb-0.5 sm:mb-1 relative z-10">AI Resume</h3>
          <p className="text-[9px] sm:text-sm text-slate-500 relative z-10 leading-tight">{resumeEnabled ? 'Bypass ATS smartly' : 'Currently Not Available'}</p>
        </div>

        {interviewEnabled ? (
          <div className="bg-white p-3 sm:p-6 rounded-xl sm:rounded-2xl border border-blue-200 shadow-sm shadow-blue-100 relative overflow-hidden group cursor-pointer" onClick={() => navigate('/my-interviews')}>
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
            <p className="text-[9px] sm:text-sm text-slate-500 relative z-10 leading-tight">Currently Not Available</p>
          </div>
        )}
        
        {showJobPortal && (
          <div 
            className="bg-white p-3 sm:p-6 rounded-xl sm:rounded-2xl border border-indigo-200 shadow-sm shadow-indigo-100 hover:-translate-y-1 hover:shadow-md hover:shadow-indigo-200 cursor-pointer relative overflow-hidden group transition-all duration-300"
            onClick={() => navigate('/jobs')}
          >
            <div className="absolute top-0 right-0 p-2 sm:p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Briefcase className="w-12 h-12 sm:w-20 sm:h-20" />
            </div>
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-indigo-100 text-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-4 relative z-10">
              <Briefcase className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-[11px] sm:text-base leading-tight mb-0.5 sm:mb-1 relative z-10">Latest Jobs</h3>
            <p className="text-[9px] sm:text-sm text-slate-500 relative z-10 leading-tight">Apply to verified jobs</p>
          </div>
        )}

        <div 
          className="bg-white p-3 sm:p-6 rounded-xl sm:rounded-2xl border border-cyan-200 shadow-sm shadow-cyan-100 hover:-translate-y-1 hover:shadow-md hover:shadow-cyan-200 cursor-pointer relative overflow-hidden group transition-all duration-300"
          onClick={() => navigate('/student-assessment')}
        >
          <div className="absolute top-0 right-0 p-2 sm:p-4 opacity-10 group-hover:scale-110 transition-transform text-cyan-600">
            <CheckCircle className="w-12 h-12 sm:w-20 sm:h-20" />
          </div>
          <div className="w-8 h-8 sm:w-12 sm:h-12 bg-cyan-100 text-cyan-600 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-4 relative z-10">
            <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-[11px] sm:text-base leading-tight mb-0.5 sm:mb-1 relative z-10">AI Assessments</h3>
          <p className="text-[9px] sm:text-sm text-cyan-600 font-semibold relative z-10 leading-tight">Launch & Evaluate</p>
        </div>

        <div className="bg-white p-3 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200 opacity-60 cursor-not-allowed">
          <div className="w-8 h-8 sm:w-12 sm:h-12 bg-slate-100 text-slate-400 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-4">
            <Clock className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-[11px] sm:text-base leading-tight mb-0.5 sm:mb-1">Project Sandbox</h3>
          <p className="text-[9px] sm:text-sm text-slate-500 leading-tight">Coming Soon</p>
        </div>

        <div 
          className="bg-white p-3 sm:p-6 rounded-xl sm:rounded-2xl border border-amber-200 shadow-sm shadow-amber-100 hover:-translate-y-1 hover:shadow-md hover:shadow-amber-200 cursor-pointer relative overflow-hidden group transition-all duration-300"
          onClick={() => navigate('/student-assessment')}
        >
          <div className="absolute top-0 right-0 p-2 sm:p-4 opacity-10 group-hover:scale-110 transition-transform text-amber-600">
            <Tag className="w-12 h-12 sm:w-20 sm:h-20" />
          </div>
          <div className="w-8 h-8 sm:w-12 sm:h-12 bg-amber-100 text-amber-600 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-4 relative z-10">
            <Tag className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-[11px] sm:text-base leading-tight mb-0.5 sm:mb-1 relative z-10">Certifications</h3>
          <p className="text-[9px] sm:text-sm text-amber-600 font-semibold relative z-10 leading-tight">View Verified Badges</p>
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
                  <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                    session.status === 'Completed'
                      ? 'bg-green-100 text-green-700'
                      : session.status === 'EVALUATION_RUNNING' || session.status === 'EVALUATION_PENDING'
                      ? 'bg-indigo-100 text-indigo-700'
                      : session.status === 'Aborted'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {(session.status === 'EVALUATION_RUNNING' || session.status === 'EVALUATION_PENDING') && (
                      <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    )}
                    {session.status === 'Completed' ? 'Completed'
                      : session.status === 'EVALUATION_RUNNING' ? 'Evaluating...'
                      : session.status === 'EVALUATION_PENDING' ? 'Pending Eval'
                      : session.status}
                  </span>
                </div>
                <h4 className="font-bold text-base sm:text-lg text-slate-800 mb-0.5 sm:mb-1">{session.jobTitle}</h4>
                <p className="text-xs sm:text-sm text-slate-500 mb-3 sm:mb-4 line-clamp-2">{session.jobDescription}</p>
                
                <div className="mt-auto pt-3 sm:pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock size={12} /> {new Date(session.createdAt).toLocaleDateString()}
                  </span>
                  
                  {/* Action button — depends on session status */}
                  {(session.status === 'EVALUATION_PENDING' || session.status === 'EVALUATION_RUNNING') ? (
                    <span className="text-xs font-bold text-indigo-500 flex items-center gap-1.5">
                      <Loader2 size={13} className="animate-spin" />
                      Generating Evaluation...
                    </span>
                  ) : session.status === 'Aborted' && localStorage.getItem(`repracticed_${session._id}`) !== 'true' ? (
                    <button className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors" onClick={() => setRePracticeSession(session)}>
                      <PlayCircle size={14} /> Re-practice
                    </button>
                  ) : session.status === 'Completed' && session.feedback ? (
                    (session.feedback.ai_evaluation?.overall_score === 0 || !session.feedback.ai_evaluation?.overall_score) && session.messages?.length > 2 ? (
                      <button className="text-sm font-bold text-amber-600 hover:text-amber-800 flex items-center gap-1 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors" onClick={() => handleRetryEvaluation(session._id)}>
                        <RefreshCw size={14} /> Retry Eval
                      </button>
                    ) : (
                      <button className="text-sm font-bold text-indigo-600 hover:text-indigo-800" onClick={() => setSelectedFeedback(session)}>
                        View Feedback
                      </button>
                    )
                  ) : session.status === 'Failed' ? (
                    <span className="text-xs font-bold text-red-400">Eval Failed</span>
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
            <h3 className="text-xl font-bold text-slate-800 mb-2">Re-practice Session</h3>
            <p className="text-slate-500 text-sm mb-6">
              You are about to re-practice your interview for <strong>{rePracticeSession.jobTitle}</strong>. No extra credits will be deducted.
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
