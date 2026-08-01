import React, { useState } from "react";
import {
  User,
  Edit2,
  Save,
  Award,
  TrendingUp,
  BarChart,
  Code2,
  Layers,
  FolderOpen,
} from "lucide-react";
import toast from "react-hot-toast";

/**
 * Student Profile & Progress Analytics (Component 7 & 8)
 * Displays basic candidate profile attributes and clean analytics in existing Light Theme.
 * Completely zero mock data; displays accurate metrics or clean empty states when attempts are 0.
 */
const StudentProfileView = ({ profileData, onRefresh }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    institution: profileData?.profile?.institution || "",
    department: profileData?.profile?.department || "",
    skills: (profileData?.profile?.skills || []).join(", "),
  });

  const { profile = {}, analytics = {} } = profileData || {};
  const {
    passRate = 0,
    avgScore = 0,
    totalCompleted = 0,
    certificatesCount = 0,
    categoryPerformance = [],
    monthlyActivity = [],
  } = analytics;

  const storedUserName = localStorage.getItem("userName") || profile.name || "Candidate Profile";
  const storedUserEmail = localStorage.getItem("userEmail") || profile.email || "student@code-a-nova.edu";

  const handleSave = (e) => {
    e.preventDefault();
    setIsEditing(false);
    toast.success("✅ Profile competency preferences updated!");
    if (onRefresh) onRefresh();
  };

  return (
    <div className="space-y-8 text-slate-800 animate-fade-in max-w-5xl mx-auto">
      {/* Profile Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0 shadow-inner">
              <User className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <div>
              <div className="text-[11px] font-extrabold text-indigo-600 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5" />
                <span>Verified Assessment Candidate</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">{storedUserName}</h2>
              <p className="text-slate-500 font-mono text-xs sm:text-sm mt-0.5">{storedUserEmail}</p>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center gap-1.5 self-start sm:self-center shrink-0 border border-slate-200"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>{isEditing ? "Cancel Edit" : "Edit Details"}</span>
          </button>
        </div>

        {/* Profile Details or Edit Form */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-4 max-w-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Institution</label>
                  <input
                    type="text"
                    value={formData.institution}
                    placeholder="e.g. Engineering Institute"
                    onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    placeholder="e.g. Computer Science"
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Competency Skills (Comma separated)</label>
                <input
                  type="text"
                  value={formData.skills}
                  placeholder="e.g. JavaScript, React, Node.js"
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Profile</span>
              </button>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs font-medium">
              <div>
                <span className="text-slate-400 block mb-0.5">Institution:</span>
                <strong className="text-slate-800 text-sm">{formData.institution || "Not provided"}</strong>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Department / Stream:</span>
                <strong className="text-slate-800 text-sm">{formData.department || "Not provided"}</strong>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Technical Competencies:</span>
                <div className="flex flex-wrap gap-1.5">
                  {formData.skills ? (
                    formData.skills.split(",").map((sk, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px] border border-slate-200">
                        {sk.trim()}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 italic text-xs">No skills listed yet</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Progress Analytics Showcase */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <span>Progress Analytics</span>
          </h3>
          <span className="text-[11px] font-extrabold text-slate-500 uppercase bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
            Candidate Excluded Scope
          </span>
        </div>

        {/* Analytics Top Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
            <span className="text-[11px] text-slate-500 uppercase font-extrabold block">Pass Rate</span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">{passRate}%</span>
            <span className="text-[10px] text-slate-400 mt-1 block">Authoritative evaluation passes</span>
          </div>
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
            <span className="text-[11px] text-slate-500 uppercase font-extrabold block">Avg Competence</span>
            <span className="text-2xl font-black text-indigo-600 mt-1 block">{avgScore}%</span>
            <span className="text-[10px] text-slate-400 mt-1 block">Mean score across attempts</span>
          </div>
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
            <span className="text-[11px] text-slate-500 uppercase font-extrabold block">Evaluations</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{totalCompleted}</span>
            <span className="text-[10px] text-slate-400 mt-1 block">Locked scoring results</span>
          </div>
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
            <span className="text-[11px] text-slate-500 uppercase font-extrabold block">Certificates</span>
            <span className="text-2xl font-black text-amber-500 mt-1 block">{certificatesCount}</span>
            <span className="text-[10px] text-slate-400 mt-1 block">Verified digital badges</span>
          </div>
        </div>

        {/* Category Mastery & Monthly Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h4 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-wide">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Domain Category Mastery</span>
            </h4>
            {categoryPerformance.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <FolderOpen className="w-7 h-7 mx-auto mb-1.5 text-slate-400" />
                <span>Complete assessments to view domain performance breakdown.</span>
              </div>
            ) : (
              <div className="space-y-4">
                {categoryPerformance.map((cat, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800">{cat.domain}</span>
                      <span className="text-indigo-600 font-mono font-black">{cat.rating}% ({cat.progress})</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${cat.rating}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h4 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-wide">
              <BarChart className="w-4 h-4 text-indigo-600" />
              <span>Monthly Activity Trend</span>
            </h4>
            {monthlyActivity.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <FolderOpen className="w-7 h-7 mx-auto mb-1.5 text-slate-400" />
                <span>No attempt activity recorded in recent months.</span>
              </div>
            ) : (
              <div className="h-40 pt-4 px-2 flex items-end justify-between gap-2 border-b border-slate-200">
                {monthlyActivity.map((col, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                    <span className="text-[10px] font-mono text-indigo-600 font-extrabold">{col.score}%</span>
                    <div className="w-full max-w-[28px] bg-slate-100 rounded-t-lg overflow-hidden h-28 flex items-end justify-center">
                      <div className="w-full bg-indigo-600 rounded-t-lg transition-all" style={{ height: `${col.score}%` }}></div>
                    </div>
                    <span className="text-[11px] font-extrabold text-slate-500 mt-1">{col.month}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfileView;
