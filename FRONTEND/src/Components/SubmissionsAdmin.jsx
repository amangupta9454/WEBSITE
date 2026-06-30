import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ExternalLink, Edit3, Save, X, Search, ChevronDown, ChevronUp } from 'lucide-react';

const SubmissionsAdmin = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editSp, setEditSp] = useState(0);
  const [editReason, setEditReason] = useState('');
  const [submittingSp, setSubmittingSp] = useState(false);
  const [expandedStudents, setExpandedStudents] = useState({});

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

  const handleEditClick = (sub) => {
    setEditingId(sub.id);
    setEditSp(sub.spAwarded);
    setEditReason('');
  };

  const handleSaveSp = async (sub) => {
    try {
      setSubmittingSp(true);
      const token = localStorage.getItem('adminToken');
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/admin/override-sp`, {
        modelRef: sub.modelRef,
        docId: sub.docId,
        internshipId: sub.internshipId,
        assignmentId: sub.assignmentId,
        newSpAwarded: editSp,
        reason: editReason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('SP updated successfully');
      setEditingId(null);
      fetchSubmissions();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update SP');
    } finally {
      setSubmittingSp(false);
    }
  };

  const toggleStudent = (studentId) => {
    setExpandedStudents(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
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

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-slate-800">All Project Submissions</h2>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by Name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
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
                <div className="bg-white p-4 border-t border-slate-200">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-2">Project Name</th>
                          <th className="px-4 py-2">Submitted</th>
                          <th className="px-4 py-2">Links</th>
                          <th className="px-4 py-2">AI Status</th>
                          <th className="px-4 py-2">SP Awarded</th>
                          <th className="px-4 py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {student.submissions.map((sub) => (
                          <tr key={sub.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-medium text-slate-800">
                              {sub.projectName}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500">
                              {new Date(sub.submittedAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                {sub.githubLink && (
                                  <a href={sub.githubLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 flex items-center gap-1" title="GitHub">
                                    <ExternalLink size={14} /> GitHub
                                  </a>
                                )}
                                {sub.hostedLink && (
                                  <a href={sub.hostedLink} target="_blank" rel="noreferrer" className="text-emerald-600 hover:text-emerald-800 flex items-center gap-1" title="Hosted">
                                    <ExternalLink size={14} /> Hosted
                                  </a>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${
                                sub.aiStatus === 'Accepted' ? 'bg-emerald-100 text-emerald-700' :
                                sub.aiStatus === 'Rejected' ? 'bg-red-100 text-red-700' :
                                'bg-amber-100 text-amber-700'
                              }`}>
                                {sub.aiStatus}
                              </span>
                              {sub.aiFeedback && (
                                 <div className="text-[10px] max-w-[200px] truncate text-slate-500 mt-1" title={sub.aiFeedback}>
                                   {sub.aiFeedback}
                                 </div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {editingId === sub.id ? (
                                <input
                                  type="number"
                                  value={editSp}
                                  onChange={(e) => setEditSp(Number(e.target.value))}
                                  className="w-16 px-2 py-1 border rounded text-xs"
                                />
                              ) : (
                                <span className="font-bold text-slate-700">{sub.spAwarded} SP</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {editingId === sub.id ? (
                                <div className="flex flex-col gap-2">
                                  <input
                                    type="text"
                                    placeholder="Reason..."
                                    value={editReason}
                                    onChange={(e) => setEditReason(e.target.value)}
                                    className="px-2 py-1 border rounded text-xs w-32"
                                  />
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={() => handleSaveSp(sub)}
                                      disabled={submittingSp}
                                      className="text-emerald-600 hover:bg-emerald-50 p-1 rounded"
                                    >
                                      <Save size={16} />
                                    </button>
                                    <button 
                                      onClick={() => setEditingId(null)}
                                      className="text-red-600 hover:bg-red-50 p-1 rounded"
                                    >
                                      <X size={16} />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => handleEditClick(sub)}
                                  className="text-slate-500 hover:text-blue-600 p-1.5 bg-slate-100 rounded hover:bg-blue-50 transition-colors flex items-center gap-1 text-xs font-semibold"
                                >
                                  <Edit3 size={14} /> Edit SP
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
    </div>
  );
};

export default SubmissionsAdmin;
