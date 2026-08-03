import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Users, Search, Award, TrendingUp, ChevronLeft, ChevronRight, 
  UserCheck, Calendar, ArrowUpRight, ShieldAlert, BookOpen, Loader2 
} from "lucide-react";

const StudentAnalytics = () => {
  const [data, setData] = useState({ items: [], pagination: { page: 1, totalPages: 1 } });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchStudentStats = async (currentPage) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`/api/admin/assessment/analytics/students?page=${currentPage}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load student analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentDetail = async (candidateId) => {
    try {
      setDetailLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`/api/admin/assessment/analytics/students/${candidateId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        setSelectedStudent(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load student detail:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentStats(page);
  }, [page]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Description & Actions */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Candidate & Student Intelligence
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Read-only evaluation telemetry tracking candidate attempts, score boundaries, skill growth timelines, and certificate attainment.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
          <p className="text-xs font-semibold">Synchronizing with student evaluation records...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Table List */}
          <div className={`${selectedStudent ? "lg:col-span-2" : "lg:col-span-3"} bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all`}>
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <span className="text-xs font-black uppercase text-slate-500 tracking-wider">Candidate Registry ({data.pagination?.totalCount || data.items.length})</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Candidate</th>
                    <th className="py-3 px-3 text-center">Attempts</th>
                    <th className="py-3 px-3 text-center">Avg %</th>
                    <th className="py-3 px-3 text-center">High / Low %</th>
                    <th className="py-3 px-3 text-center">Certificates</th>
                    <th className="py-3 px-4">Skill Maturity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                  {data.items && data.items.length > 0 ? (
                    data.items.map((stu) => (
                      <tr 
                        key={stu.candidateId} 
                        onClick={() => loadStudentDetail(stu.candidateId)}
                        className="hover:bg-indigo-50/40 cursor-pointer transition-colors"
                      >
                        <td className="py-3.5 px-4 font-bold text-slate-800 flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-black">
                            {stu.name ? stu.name.charAt(0).toUpperCase() : "S"}
                          </div>
                          <div>
                            <div className="text-sm font-black text-slate-800">{stu.name}</div>
                            <div className="text-[11px] text-slate-400 font-normal">{stu.candidateId}</div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-center font-black text-indigo-600">{stu.attempts}</td>
                        <td className="py-3.5 px-3 text-center font-bold">
                          <span className={`px-2 py-0.5 rounded text-xs ${stu.averagePercentage >= 75 ? "bg-emerald-50 text-emerald-700" : stu.averagePercentage >= 55 ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"}`}>
                            {stu.averagePercentage}%
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center text-xs text-slate-600">
                          <span className="font-bold text-emerald-600">{stu.highestPercentage}%</span> / <span className="text-rose-500">{stu.lowestPercentage}%</span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="inline-flex items-center gap-1 text-xs font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <Award className="w-3.5 h-3.5" /> {stu.certificatesEarned}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                            {stu.currentSkillProgress}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-12 text-slate-400 font-semibold">
                        No student assessment sessions evaluated yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
              <span className="text-xs font-medium text-slate-500">
                Page <strong className="text-slate-800">{data.pagination.page}</strong> of <strong className="text-slate-800">{data.pagination.totalPages}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-600" />
                </button>
                <button
                  disabled={page >= data.pagination.totalPages}
                  onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none"
                >
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Drill-down Candidate Inspector Panel */}
          {selectedStudent && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-md flex flex-col justify-between h-full border-t-4 border-t-indigo-600">
              {detailLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mb-2" />
                  <span className="text-xs">Extracting candidate telemetry...</span>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h4 className="font-black text-slate-800 text-base flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-indigo-600" /> Candidate Profile
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">{selectedStudent.candidateId}</p>
                    </div>
                    <button 
                      onClick={() => setSelectedStudent(null)}
                      className="text-xs font-bold text-slate-400 hover:text-rose-600 px-2 py-1 rounded bg-slate-50 hover:bg-rose-50"
                    >
                      Close
                    </button>
                  </div>

                  {/* Summary Metric Squares */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Total Attempts</div>
                      <div className="text-lg font-black text-indigo-600 mt-0.5">{selectedStudent.totalAttempts}</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Certificates Earned</div>
                      <div className="text-lg font-black text-amber-600 mt-0.5">{selectedStudent.certificatesEarned}</div>
                    </div>
                  </div>

                  {/* Category Performance */}
                  <div>
                    <h5 className="text-xs font-black text-slate-600 uppercase tracking-wider mb-2.5">Category Domain Mastery</h5>
                    <div className="space-y-2">
                      {selectedStudent.categoryPerformance && selectedStudent.categoryPerformance.map((cat, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between">
                          <div>
                            <div className="text-xs font-bold text-slate-800">{cat.categoryName}</div>
                            <div className="text-[10px] text-slate-400">{cat.attempts} attempts</div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-black text-indigo-600">{cat.averageScore}%</span>
                            <div className="text-[10px] text-emerald-600 font-semibold">{cat.passRate}% Pass Rate</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Growth Timeline Chart Representation */}
                  <div>
                    <h5 className="text-xs font-black text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Growth Trajectory
                    </h5>
                    <div className="h-20 flex items-end gap-1 px-2 pt-4 bg-slate-50/80 rounded-xl border border-slate-100 overflow-hidden">
                      {selectedStudent.growthTimeline && selectedStudent.growthTimeline.map((item, idx) => {
                        const heightPct = Math.max(15, Math.min(100, item.score));
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center group relative">
                            <div className="text-[9px] font-black text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity -mt-4 absolute -top-4">
                              {item.score}%
                            </div>
                            <div 
                              style={{ height: `${heightPct}%` }} 
                              className={`w-full max-w-[16px] rounded-t-sm transition-all ${item.passed ? "bg-indigo-600 group-hover:bg-indigo-700" : "bg-rose-400 group-hover:bg-rose-500"}`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentAnalytics;
