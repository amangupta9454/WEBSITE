import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  Loader2,
  Search,
  BrainCircuit,
  ExternalLink,
  Mail,
  Phone,
  Calendar,
  Eye,
  Trash2,
  X,
  GraduationCap,
  Building2,
  FileText,
  Award,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Users,
  RefreshCw,
  Download,
  Send
} from 'lucide-react';
import QuizCertificate from './QuizCertificate';

const QuizUsersAdmin = () => {
  const [quizApplicants, setQuizApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [quizFilter, setQuizFilter] = useState("All Quizzes");
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [applicantToDelete, setApplicantToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Certificate & Bulk Actions State
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [certData, setCertData] = useState(null);
  const [isSendingBulk, setIsSendingBulk] = useState(false);
  const [sendingProgress, setSendingProgress] = useState({ current: 0, total: 0 });
  
  // Custom Email Modal states
  const [showCustomEmailModal, setShowCustomEmailModal] = useState(false);
  const [customMessage, setCustomMessage] = useState("");
  const [pendingAction, setPendingAction] = useState(null); // 'single' or 'bulk'
  const [pendingSingleData, setPendingSingleData] = useState(null);
  
  const certRef = useRef(null);

  useEffect(() => {
    fetchQuizApplicants();
  }, []);

  const fetchQuizApplicants = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/quiz-applicants`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuizApplicants(res.data.applicants || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch quiz applicants');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteApplicant = async () => {
    if (!applicantToDelete) return;
    try {
      setIsDeleting(true);
      const token = localStorage.getItem('adminToken');
      const res = await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/quiz-applicants/${applicantToDelete._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        toast.success('Quiz applicant deleted successfully');
        setQuizApplicants(prev => prev.filter(app => app._id !== applicantToDelete._id));
        setApplicantToDelete(null);
        if (selectedApplicant?._id === applicantToDelete._id) {
          setSelectedApplicant(null);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to delete applicant');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = new Set(filteredApplicants.map(a => a._id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleDownloadSingle = (applicant, quiz) => {
    setCertData({ applicant, quizData: quiz });
    setTimeout(() => {
      if (certRef.current) {
        certRef.current.triggerDownload();
      }
    }, 500);
  };

  const handleSendSingleClick = (app, quiz) => {
    setPendingAction('single');
    setPendingSingleData({ applicant: app, quiz });
    setShowCustomEmailModal(true);
  };

  const handleBulkSendClick = () => {
    if (selectedIds.size === 0) return;
    setPendingAction('bulk');
    setShowCustomEmailModal(true);
  };

  const executeSend = async () => {
    setShowCustomEmailModal(false);
    if (pendingAction === 'single') {
      await executeSendSingle(pendingSingleData.applicant, pendingSingleData.quiz);
    } else if (pendingAction === 'bulk') {
      await executeBulkSend();
    }
    // reset states
    setPendingAction(null);
    setPendingSingleData(null);
    setCustomMessage("");
    // Re-fetch applicants to get updated certificateSent status
    fetchQuizApplicants();
  };

  const executeSendSingle = async (applicant, quiz) => {
    try {
      toast.info(`Generating certificate for ${applicant.name}...`);
      setCertData({ applicant, quizData: quiz });
      
      // Wait for React to render the hidden certificate
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const base64 = await certRef.current.getBase64();
      if (!base64) throw new Error("Failed to generate certificate image");

      toast.info(`Sending email to ${applicant.email}...`);
      const token = localStorage.getItem('adminToken');
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/quiz-applicants/send-certificate`,
        {
          email: applicant.email,
          name: applicant.name,
          quizName: quiz.quizName,
          result: quiz.result,
          certificateImage: base64,
          customMessage: customMessage
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data.success) {
        toast.success(`Certificate sent to ${applicant.email}`);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to send certificate');
    }
  };

  const executeBulkSend = async () => {
    if (selectedIds.size === 0) return;
    
    setIsSendingBulk(true);
    setSendingProgress({ current: 0, total: selectedIds.size });
    
    let successCount = 0;
    let failCount = 0;
    const token = localStorage.getItem('adminToken');
    
    const selectedArray = Array.from(selectedIds);
    for (let i = 0; i < selectedArray.length; i++) {
      const id = selectedArray[i];
      const applicant = quizApplicants.find(a => a._id === id);
      if (!applicant) continue;
      
      const quiz = (quizFilter !== "All Quizzes") 
        ? (applicant.quizzes?.find(q => q.quizName === quizFilter) || { quizName: applicant.quizName, registrationId: applicant.registrationId, score: applicant.score, result: applicant.result })
        : (applicant.quizzes && applicant.quizzes.length > 0 
            ? applicant.quizzes[0] 
            : { quizName: applicant.quizName, registrationId: applicant.registrationId, score: applicant.score, result: applicant.result });
        
      setSendingProgress({ current: i + 1, total: selectedIds.size });
      
      try {
        setCertData({ applicant, quizData: quiz });
        await new Promise(resolve => setTimeout(resolve, 800)); // give it time to render images/canvas
        
        const base64 = await certRef.current.getBase64();
        if (!base64) throw new Error("Failed to generate base64");
        
        await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/admin/quiz-applicants/send-certificate`,
          {
            email: applicant.email,
            name: applicant.name,
            quizName: quiz.quizName,
            result: quiz.result,
            certificateImage: base64,
            customMessage: customMessage
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        successCount++;
      } catch (err) {
        console.error(`Failed for ${applicant.email}:`, err);
        failCount++;
      }
    }
    
    setIsSendingBulk(false);
    toast.success(`Bulk send complete: ${successCount} sent, ${failCount} failed.`);
    setSelectedIds(new Set()); // clear selection
  };

  const filteredApplicants = quizApplicants.filter(app => {
    const q = searchQuery.toLowerCase();
    const quizNames = app.quizzes?.map(qz => qz.quizName?.toLowerCase()).join(" ") || "";
    const matchesSearch = (
      app.name?.toLowerCase().includes(q) ||
      app.email?.toLowerCase().includes(q) ||
      app.quizName?.toLowerCase().includes(q) ||
      quizNames.includes(q) ||
      app.registrationId?.toLowerCase().includes(q) ||
      app.organisation?.toLowerCase().includes(q) ||
      app.domain?.toLowerCase().includes(q)
    );

    if (quizFilter !== "All Quizzes") {
      const hasQuiz = app.quizzes?.some(qz => qz.quizName === quizFilter) || app.quizName === quizFilter;
      return matchesSearch && hasQuiz;
    }
    return matchesSearch;
  });

  // Calculate quick metrics
  const uniqueQuizzesList = Array.from(
    new Set(
      quizApplicants.flatMap(app => 
        app.quizzes && app.quizzes.length > 0
          ? app.quizzes.map(q => q.quizName)
          : [app.quizName]
      ).filter(Boolean)
    )
  ).sort();
  const uniqueQuizzes = uniqueQuizzesList.length;

  const quizCardsData = uniqueQuizzesList.map(quizName => {
    const applicants = quizApplicants.filter(app => {
      return app.quizzes?.some(q => q.quizName === quizName) || app.quizName === quizName;
    });
    
    let sentCount = 0;
    applicants.forEach(app => {
      const qz = app.quizzes?.find(q => q.quizName === quizName);
      if (qz?.certificateSent) sentCount++;
    });

    return {
      quizName,
      totalParticipants: applicants.length,
      sentCount,
      pendingCount: applicants.length - sentCount
    };
  });

  const totalResumes = quizApplicants.filter(
    app => app.resumeUrl && app.resumeUrl !== 'NA' && app.resumeUrl !== 'N/A'
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <BrainCircuit className="w-6 h-6" />
            </div>
            Imported Quiz Applicants
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage candidates imported from Unstop & external quiz registrations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {selectedIds.size > 0 && quizFilter !== "All Quizzes" && (
            <button
              onClick={handleBulkSendClick}
              disabled={isSendingBulk}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md disabled:opacity-70"
            >
              {isSendingBulk ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {isSendingBulk ? `Sending (${sendingProgress.current}/${sendingProgress.total})...` : `Send Certificates (${selectedIds.size})`}
            </button>
          )}
          <button
            onClick={fetchQuizApplicants}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Quizzes Overview OR Table View */}
      {quizFilter === "All Quizzes" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizCardsData.map((quiz, idx) => (
            <div 
              key={idx} 
              onClick={() => setQuizFilter(quiz.quizName)}
              className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:border-indigo-300"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-100 transition-colors">
                  <Award className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                    <Users className="w-3.5 h-3.5" />
                    {quiz.totalParticipants} Participants
                  </span>
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 mb-4 line-clamp-2">{quiz.quizName}</h3>
              
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                <div className="bg-emerald-50 rounded-xl p-3">
                  <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Cert Sent</div>
                  <div className="text-xl font-black text-emerald-700">{quiz.sentCount}</div>
                </div>
                <div className="bg-amber-50 rounded-xl p-3">
                  <div className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Pending</div>
                  <div className="text-xl font-black text-amber-700">{quiz.pendingCount}</div>
                </div>
              </div>
            </div>
          ))}
          {quizCardsData.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500">
              No quizzes found.
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Top Metrics Cards - Only shown in Table View */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Candidates</span>
            <div className="text-3xl font-black text-slate-900 mt-1">{quizApplicants.length}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quizzes Active</span>
            <div className="text-3xl font-black text-indigo-600 mt-1">{uniqueQuizzes}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resumes Attached</span>
            <div className="text-3xl font-black text-emerald-600 mt-1">{totalResumes}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <FileText className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Toolbar & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs font-semibold text-slate-500 min-w-max">
          Showing <strong className="text-slate-900">{filteredApplicants.length}</strong> of {quizApplicants.length} applicants
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Quiz Filter */}
          <div className="relative min-w-[200px]">
            <select
              value={quizFilter}
              onChange={(e) => setQuizFilter(e.target.value)}
              className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
            >
              <option value="All Quizzes">All Quizzes</option>
              {uniqueQuizzesList.map((qName, idx) => (
                <option key={idx} value={qName}>{qName}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name, email, quiz, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-medium"
            >
              Clear
            </button>
          )}
        </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-4 w-10">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    checked={filteredApplicants.length > 0 && selectedIds.size === filteredApplicants.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="px-2 py-4">Candidate Info</th>
                <th className="px-6 py-4">Quiz Enrolled</th>
                <th className="px-6 py-4">Status & Score</th>
                <th className="px-6 py-4">Domain & College</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredApplicants.length > 0 ? (
                filteredApplicants.map((app) => {
                  const quizList = app.quizzes && app.quizzes.length > 0
                    ? app.quizzes
                    : [{ quizName: app.quizName, registrationId: app.registrationId, score: app.score, result: app.result }];

                  const hasResume = app.resumeUrl && app.resumeUrl !== 'NA' && app.resumeUrl !== 'N/A';
                  
                  const targetQuiz = (quizFilter !== "All Quizzes")
                    ? (app.quizzes?.find(q => q.quizName === quizFilter) || quizList[0])
                    : quizList[0];

                  return (
                    <tr key={app._id} className={`hover:bg-slate-50/70 transition-colors ${selectedIds.has(app._id) ? 'bg-indigo-50/30' : ''}`}>
                      <td className="px-4 py-4">
                        <input 
                          type="checkbox" 
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                          checked={selectedIds.has(app._id)}
                          onChange={() => handleSelectRow(app._id)}
                        />
                      </td>
                      {/* Candidate Avatar & Name */}
                      <td className="px-2 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-sm flex-shrink-0">
                            {app.name?.charAt(0)?.toUpperCase() || "Q"}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 flex items-center gap-1.5">
                              {app.name}
                              {quizList.length > 1 && (
                                <span className="text-[10px] bg-indigo-100 text-indigo-700 font-extrabold px-2 py-0.5 rounded-full border border-indigo-200">
                                  {quizList.length} Quizzes
                                </span>
                              )}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              <span className="truncate max-w-[200px]">{app.email}</span>
                            </div>
                            {app.mobile && (
                              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                <span>{app.mobile}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Quiz Details Pill & ID */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5 items-start">
                          {quizList.slice(0, 2).map((q, idx) => (
                            <div key={idx} className="flex items-center gap-2 flex-wrap">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 max-w-[240px] truncate" title={q.quizName}>
                                <Sparkles className="w-3 h-3 text-indigo-500 flex-shrink-0" />
                                {q.quizName}
                              </span>
                              {q.registrationId && (
                                <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                  ID: {q.registrationId}
                                </span>
                              )}
                            </div>
                          ))}
                          {quizList.length > 2 && (
                            <button 
                              onClick={() => setSelectedApplicant(app)}
                              className="text-xs text-indigo-600 font-bold hover:underline"
                            >
                              +{quizList.length - 2} more quiz registrations
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Score & Status */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-start gap-1">
                          {targetQuiz.score && targetQuiz.score !== "N/A" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-slate-900 text-white shadow-sm">
                              Score: {targetQuiz.score} {targetQuiz.totalScore && targetQuiz.totalScore !== "N/A" ? `/ ${targetQuiz.totalScore}` : ""}
                            </span>
                          ) : null}

                          {targetQuiz.result && targetQuiz.result !== "N/A" ? (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              targetQuiz.result?.toLowerCase().includes("pass") || targetQuiz.result?.toLowerCase().includes("qual")
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : "bg-indigo-100 text-indigo-800 border border-indigo-200"
                            }`}>
                              {targetQuiz.result}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Registered
                            </span>
                          )}

                          {targetQuiz.certificateSent && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 border border-green-200/80 px-2 py-0.5 rounded-full mt-1">
                              <CheckCircle2 className="w-3 h-3 text-green-600" /> Email Sent
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Domain & College */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col max-w-[220px]">
                          <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                            {app.domain || app.course || "General"}
                          </span>
                          {app.organisation && app.organisation !== "N/A" ? (
                            <span className="text-xs text-slate-500 flex items-center gap-1 mt-1 truncate" title={app.organisation}>
                              <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <span className="truncate">{app.organisation}</span>
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic mt-0.5">College: N/A</span>
                          )}
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Download Cert */}
                          <button
                            onClick={() => handleDownloadSingle(app, targetQuiz)}
                            className="p-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-100 transition-colors"
                            title="Download Certificate"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          
                          {/* Send Cert */}
                          <button
                            onClick={() => handleSendSingleClick(app, targetQuiz)}
                            className={`p-1.5 rounded-xl border transition-colors ${
                              targetQuiz.certificateSent 
                                ? "text-green-600 bg-green-50 hover:bg-green-100 border-green-200" 
                                : "text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-emerald-100"
                            }`}
                            title={targetQuiz.certificateSent ? "Send Again" : "Send Certificate to Email"}
                          >
                            <Send className="w-4 h-4" />
                          </button>

                          {/* View Details Button */}
                          <button
                            onClick={() => setSelectedApplicant(app)}
                            className="p-1.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
                            title="View Full Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>



                          {/* Delete Button */}
                          <button
                            onClick={() => setApplicantToDelete(app)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                            title="Delete Applicant"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                        <Search className="w-6 h-6 text-slate-400" />
                      </div>
                      <p className="text-slate-600 font-bold">No quiz applicants found</p>
                      <p className="text-slate-400 text-xs mt-1">Try tweaking your search term or upload a new Excel file.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW DETAILS MODAL */}
      {selectedApplicant && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200 p-6 space-y-6">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-bold text-lg flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  {selectedApplicant.name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    {selectedApplicant.name}
                  </h3>
                  <p className="text-xs text-slate-500">{selectedApplicant.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedApplicant(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Candidate Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-400 font-semibold block">Mobile Number</span>
                <span className="text-slate-800 font-bold text-sm mt-0.5 block">{selectedApplicant.mobile || "N/A"}</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-400 font-semibold block">Gender</span>
                <span className="text-slate-800 font-bold text-sm mt-0.5 block">{selectedApplicant.gender || "N/A"}</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-400 font-semibold block">Location</span>
                <span className="text-slate-800 font-bold text-sm mt-0.5 block">{selectedApplicant.location || "N/A"}</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-400 font-semibold block">Domain</span>
                <span className="text-indigo-700 font-bold text-sm mt-0.5 block">{selectedApplicant.domain || "N/A"}</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-400 font-semibold block">Course</span>
                <span className="text-slate-800 font-bold text-sm mt-0.5 block">{selectedApplicant.course || "N/A"}</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-400 font-semibold block">Graduation Year</span>
                <span className="text-slate-800 font-bold text-sm mt-0.5 block">{selectedApplicant.yearOfGraduation || "N/A"}</span>
              </div>
            </div>

            {/* Academic & Organisation */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <Building2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <span><strong>Organisation / College:</strong> {selectedApplicant.organisation || "N/A"}</span>
              </div>
              {selectedApplicant.specialization && (
                <div className="flex items-center gap-2 text-slate-700">
                  <GraduationCap className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <span><strong>Specialization:</strong> {selectedApplicant.specialization}</span>
                </div>
              )}
              {selectedApplicant.resumeUrl && selectedApplicant.resumeUrl !== 'NA' && selectedApplicant.resumeUrl !== 'N/A' && (
                <div className="flex items-center gap-2 pt-1">
                  <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <a
                    href={selectedApplicant.resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline font-semibold flex items-center gap-1"
                  >
                    View Candidate Resume <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* All Quiz Registrations & Results */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-600" />
                Quiz Registrations & Results ({(selectedApplicant.quizzes?.length || 1)})
              </h4>
              <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold">
                      <th className="p-3">Quiz Name</th>
                      <th className="p-3">Registration ID</th>
                      <th className="p-3">Score / Marks</th>
                      <th className="p-3">Result / Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedApplicant.quizzes && selectedApplicant.quizzes.length > 0
                      ? selectedApplicant.quizzes
                      : [{
                          quizName: selectedApplicant.quizName,
                          registrationId: selectedApplicant.registrationId,
                          score: selectedApplicant.score,
                          result: selectedApplicant.result
                        }]
                    ).map((qz, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-3 font-semibold text-slate-900">{qz.quizName}</td>
                        <td className="p-3 font-mono text-slate-600">{qz.registrationId || "N/A"}</td>
                        <td className="p-3 font-bold text-slate-800">
                          {qz.score || "N/A"} {qz.totalScore && qz.totalScore !== "N/A" ? `/ ${qz.totalScore}` : ""}
                        </td>
                        <td className="p-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            qz.result?.toLowerCase().includes("pass") || qz.result?.toLowerCase().includes("qual")
                              ? "bg-emerald-100 text-emerald-800"
                              : qz.result && qz.result !== "N/A"
                              ? "bg-indigo-100 text-indigo-800"
                              : "bg-slate-100 text-slate-600"
                          }`}>
                            {qz.result || "N/A"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedApplicant(null)}
                className="px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-all shadow-md"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {applicantToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">Delete Quiz Applicant?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete applicant <strong className="text-slate-800">{applicantToDelete.name}</strong> ({applicantToDelete.email})? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setApplicantToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteApplicant}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/25"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete Applicant"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM EMAIL MODAL */}
      {showCustomEmailModal && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-600" />
                Customize Email
              </h3>
              <button onClick={() => setShowCustomEmailModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto pr-2 space-y-4 text-sm text-slate-600">
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
                <p className="font-bold text-indigo-800 text-xs uppercase tracking-wider mb-1">Tips</p>
                <ul className="list-disc list-inside space-y-1 text-indigo-700">
                  <li>Use <code className="font-bold bg-white px-1 py-0.5 rounded">{"{{name}}"}</code> to insert the candidate's name dynamically.</li>
                  <li>If left empty, a generic default email will be sent.</li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Custom Email Body (Optional)</label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Dear {{name}},\n\nCongratulations on completing the quiz!"
                  className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none shadow-inner"
                />
              </div>
            </div>

            <div className="pt-6 mt-4 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => setShowCustomEmailModal(false)}
                className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeSend}
                className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
              >
                <Send className="w-4 h-4" />
                Confirm & Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Certificate Generator */}
      <QuizCertificate 
        ref={certRef} 
        applicant={certData?.applicant} 
        quizData={certData?.quizData} 
      />
      </>
      )}

    </div>
  );
};

export default QuizUsersAdmin;
