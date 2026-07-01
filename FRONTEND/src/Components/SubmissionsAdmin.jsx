import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ExternalLink, Edit3, Save, X, Search, ChevronDown, ChevronUp, Check, AlertTriangle } from 'lucide-react';

const SubmissionsAdmin = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const autoRunRef = useRef(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedStudents, setExpandedStudents] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
  const [modalState, setModalState] = useState({ isOpen: false, type: '', submission: null });
  const [modalSp, setModalSp] = useState(0);
  const [modalReason, setModalReason] = useState('');

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/all-submissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubmissions(res.data.submissions);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  };

  const toggleStudent = (studentId) => {
    setExpandedStudents(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const openModal = (type, sub) => {
    setModalState({ isOpen: true, type, submission: sub });
    if (type === 'accept') {
      setModalSp(sub.spAwarded || 0);
      setModalReason('');
    } else if (type === 'reject') {
      setModalReason(sub.aiFeedback || '');
      setModalSp(0);
    } else {
      // Edit SP
      setModalSp(sub.spAwarded || 0);
      setModalReason('');
    }
  };

  const closeModal = () => {
    setModalState({ isOpen: false, type: '', submission: null });
    setModalSp(0);
    setModalReason('');
  };

  const handleAction = async () => {
    const { type, submission } = modalState;
    if (!submission) return;

    if (modalSp > 50) {
      toast.error('Maximum 50 SP allowed per project');
      return;
    }

    if (type === 'reject' && !modalReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('adminToken');
      
      let payload = {
        modelRef: submission.modelRef,
        docId: submission.docId,
        internshipId: submission.internshipId,
        assignmentId: submission.assignmentId,
      };

      if (type === 'accept') {
        payload.aiStatus = 'Accepted';
        payload.newSpAwarded = modalSp;
        payload.reason = modalReason || 'Admin manually accepted project';
      } else if (type === 'reject') {
        payload.aiStatus = 'Rejected';
        payload.aiFeedback = modalReason;
        payload.newSpAwarded = 0;
        payload.reason = 'Admin rejected project';
      } else {
        // Edit SP
        payload.newSpAwarded = modalSp;
        payload.reason = modalReason || 'Admin manually edited SP';
      }

      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/admin/override-sp`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Project status updated successfully');
      closeModal();
      fetchSubmissions();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEvaluateAI = async () => {
    if (!window.confirm("Are you sure you want to run AI evaluation on all pending submissions? Do not close this tab until finished.")) return;
    
    setIsAutoRunning(true);
    autoRunRef.current = true;
    
    let totalProcessed = 0;
    try {
      while(autoRunRef.current) {
        setLoading(true);
        const token = localStorage.getItem('adminToken');
        const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/admin/evaluate-pending-ai`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        await fetchSubmissions();
        const count = res.data.processedCount || 0;
        totalProcessed += count;
        
        if (count === 0) {
          autoRunRef.current = false;
          setIsAutoRunning(false);
          toast.success(`AI evaluation completed. Total processed: ${totalProcessed}`);
          break;
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to run AI evaluation. Auto-run stopped.');
      autoRunRef.current = false;
      setIsAutoRunning(false);
      setLoading(false);
    }
  };

  const stopAutoRun = () => {
    autoRunRef.current = false;
    setIsAutoRunning(false);
    toast('Auto-run stopped by user', { icon: '🛑' });
  };

  const handleSendEmails = async () => {
    if (!window.confirm("Are you sure you want to send evaluation emails to all processed projects?")) return;
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/admin/send-evaluation-emails`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(res.data.message);
    } catch (err) {
      toast.error('Failed to send evaluation emails');
    }
  };

  // Group submissions by student
  const groupedSubmissions = {};
  submissions.forEach(sub => {
    if (!groupedSubmissions[sub.studentId]) {
      groupedSubmissions[sub.studentId] = {
        name: sub.name,
        studentId: sub.studentId,
        internshipType: sub.internshipType,
        totalSp: 0,
        submissions: []
      };
    }
    groupedSubmissions[sub.studentId].submissions.push(sub);
    groupedSubmissions[sub.studentId].totalSp += (sub.spAwarded || 0);
  });

  const studentsList = Object.values(groupedSubmissions).filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.studentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSubmissions = submissions.length;
  const acceptedSubmissions = submissions.filter(s => s.aiStatus === 'Accepted').length;
  const rejectedSubmissions = submissions.filter(s => s.aiStatus === 'Rejected').length;
  const pendingSubmissions = submissions.filter(s => s.aiStatus === 'Pending' || s.aiStatus === 'pending').length;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div className="w-full lg:w-auto">
          <h2 className="text-2xl font-bold text-slate-800">All Project Submissions</h2>
          <div className="flex items-center gap-2 mt-2 text-sm overflow-x-auto pb-2 lg:pb-0 whitespace-nowrap">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md font-medium border border-blue-200 shadow-sm">Total: {totalSubmissions}</span>
            <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md font-medium border border-emerald-200 shadow-sm">Accepted: {acceptedSubmissions}</span>
            <span className="bg-rose-100 text-rose-800 px-2 py-1 rounded-md font-medium border border-rose-200 shadow-sm">Rejected: {rejectedSubmissions}</span>
            <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-md font-medium border border-amber-200 shadow-sm">Pending: {pendingSubmissions}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
          <div className="relative flex-shrink-0 w-64 max-w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by Name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {!isAutoRunning ? (
              <button
                onClick={handleEvaluateAI}
                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                title="Force AI to evaluate all Pending submissions"
              >
                Run AI on Pending
              </button>
            ) : (
              <button
                onClick={stopAutoRun}
                className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-sm animate-pulse"
                title="Stop auto-evaluating"
              >
                Stop Auto-Run
              </button>
            )}
            
            <button
              onClick={handleSendEmails}
              className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
              title="Send evaluation emails to all processed submissions"
            >
              Send Evaluation Emails
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {studentsList.length > 0 ? studentsList.map((student) => (
            <div key={student.studentId} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div 
                className="bg-slate-50 p-4 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => toggleStudent(student.studentId)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{student.name}</h3>
                    <p className="text-xs text-slate-500">{student.studentId} • {student.internshipType}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-bold text-slate-700">{student.submissions.length} Projects</div>
                    <div className="text-xs text-slate-500">{student.totalSp} Total SP Awarded</div>
                  </div>
                  <div className="text-slate-400">
                    {expandedStudents[student.studentId] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>
              </div>

              {expandedStudents[student.studentId] && (
                <div className="bg-white p-4 border-t border-slate-200 overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2">Project Name</th>
                        <th className="px-4 py-2">Submitted</th>
                        <th className="px-4 py-2">Links</th>
                        <th className="px-4 py-2">Status</th>
                        <th className="px-4 py-2">SP</th>
                        <th className="px-4 py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {student.submissions.map((sub) => (
                        <tr key={sub.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-medium text-slate-800">
                            {sub.projectName}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">
                            {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              {sub.githubLink && (
                                <a href={sub.githubLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded" title="GitHub">
                                  <ExternalLink size={12} /> GitHub
                                </a>
                              )}
                              {sub.hostedLink && (
                                <a href={sub.hostedLink} target="_blank" rel="noreferrer" className="text-emerald-600 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded" title="Hosted">
                                  <ExternalLink size={12} /> Hosted
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              !sub.isFinalSubmitted ? 'bg-slate-100 text-slate-500' :
                              sub.aiStatus === 'Accepted' ? 'bg-emerald-100 text-emerald-700' :
                              sub.aiStatus === 'Rejected' ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {!sub.isFinalSubmitted ? 'Draft (Not Submitted)' : sub.aiStatus}
                            </span>
                            {sub.aiFeedback && (
                               <div className="relative group mt-1">
                                 <div className="text-[10px] max-w-[200px] truncate text-slate-500 cursor-help border-b border-dashed border-slate-300">
                                   {sub.aiFeedback}
                                 </div>
                                 <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-max max-w-[300px] p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl z-50 whitespace-normal leading-relaxed">
                                   {sub.aiFeedback}
                                   <div className="absolute -bottom-1 left-4 w-2 h-2 bg-slate-800 transform rotate-45"></div>
                                 </div>
                               </div>
                            )}
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-700">
                            {sub.spAwarded}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {sub.isFinalSubmitted ? (
                                <>
                                  {sub.aiStatus !== 'Accepted' && (
                                    <button 
                                      onClick={() => openModal('accept', sub)}
                                      className="flex items-center gap-1 px-2 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded text-xs font-bold transition-colors"
                                    >
                                      <Check size={14} /> Accept
                                    </button>
                                  )}
                                  {sub.aiStatus !== 'Rejected' && (
                                    <button 
                                      onClick={() => openModal('reject', sub)}
                                      className="flex items-center gap-1 px-2 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded text-xs font-bold transition-colors"
                                    >
                                      <X size={14} /> Reject
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => openModal('edit', sub)}
                                    className="flex items-center gap-1 px-2 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded text-xs font-bold transition-colors"
                                    title="Edit SP"
                                  >
                                    <Edit3 size={14} /> Edit SP
                                  </button>
                                </>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">No Actions (Draft)</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )) : (
            <div className="text-center py-10 text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
              No interns or submissions found.
            </div>
          )}
        </div>
      )}

      {/* Action Modal */}
      {modalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={closeModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 bg-slate-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
            
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              {modalState.type === 'accept' && <><Check className="text-emerald-500" /> Accept Project</>}
              {modalState.type === 'reject' && <><X className="text-red-500" /> Reject Project</>}
              {modalState.type === 'edit' && <><Edit3 className="text-blue-500" /> Edit SP</>}
            </h3>

            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-sm font-bold text-slate-800">{modalState.submission.projectName}</div>
                <div className="text-xs text-slate-500">Student: {modalState.submission.name}</div>
              </div>

              {(modalState.type === 'accept' || modalState.type === 'edit') && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Assign SP (Max 50)</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={modalSp}
                    onChange={(e) => setModalSp(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  {modalSp > 50 && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertTriangle size={12}/> SP cannot exceed 50 per project</p>}
                </div>
              )}

              {modalState.type === 'reject' && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Reason for Rejection</label>
                  <textarea
                    rows="3"
                    value={modalReason}
                    onChange={(e) => setModalReason(e.target.value)}
                    placeholder="Provide feedback on why the project is rejected..."
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none resize-none"
                  ></textarea>
                </div>
              )}

              {(modalState.type === 'accept' || modalState.type === 'edit') && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Reason (Optional)</label>
                  <input
                    type="text"
                    value={modalReason}
                    onChange={(e) => setModalReason(e.target.value)}
                    placeholder="Reason for manual SP assignment"
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              )}

              <button
                onClick={handleAction}
                disabled={submitting || modalSp > 50}
                className={`w-full py-3 rounded-xl font-bold text-white transition-all shadow-sm ${
                  submitting ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-0.5 hover:shadow-md'
                } ${
                  modalState.type === 'accept' ? 'bg-emerald-600 hover:bg-emerald-700' :
                  modalState.type === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                  'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {submitting ? 'Saving...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmissionsAdmin;
