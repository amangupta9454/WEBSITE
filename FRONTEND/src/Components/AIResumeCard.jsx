import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FileText, Download, Clock, PlusCircle, ArrowRight, Sparkles, Coins } from "lucide-react";

const AIResumeCard = ({ interviewCredits }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalResumes: 0,
    hasFreeResume: true,
    lastEdited: null,
    totalDownloadsUsed: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResumeStats = async () => {
      try {
        const token = localStorage.getItem('interviewToken') || localStorage.getItem('studentToken');
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/resume`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data.success && res.data.resumes) {
          const resumes = res.data.resumes;
          const totalResumes = resumes.length;
          const hasFreeResume = resumes.some(r => r.isFree);
          const lastEdited = resumes.length > 0 ? resumes[0].updatedAt : null;
          const totalDownloadsUsed = resumes.reduce((acc, curr) => acc + curr.downloadsUsed, 0);

          setStats({
            totalResumes,
            hasFreeResume: !hasFreeResume, // True if they haven't used their free resume yet
            lastEdited,
            totalDownloadsUsed
          });
        }
      } catch (error) {
        console.error("Error fetching resume stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchResumeStats();
  }, []);

  return (
    <div className="bg-linear-to-br from-slate-900 to-black p-1 rounded-2xl shadow-xl border border-slate-800 mb-8 relative overflow-hidden group">
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none rounded-2xl">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/30 transition-all duration-700"></div>
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl group-hover:bg-purple-500/30 transition-all duration-700"></div>
      </div>
      
      <div className="bg-slate-900/80 backdrop-blur-md rounded-xl p-6 sm:p-8 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0 mt-1">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-white tracking-tight">AI Resume Builder</h2>
                <span className="bg-linear-to-r from-amber-200 to-yellow-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Premium</span>
              </div>
              <p className="text-slate-400 text-sm font-medium mt-1">Build ATS-friendly premium resumes tailored for top tech companies.</p>
            </div>
          </div>

          <button 
            onClick={() => navigate("/my-resumes")}
            className="group/btn relative overflow-hidden bg-white text-slate-900 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all duration-300 transform hover:-translate-y-1 w-full md:w-auto justify-center"
          >
            <div className="absolute inset-0 w-full h-full bg-linear-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]"></div>
            Open Builder <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-slate-800">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-2 text-slate-400 mb-2 text-xs font-bold uppercase tracking-wider">
              <FileText className="w-4 h-4 text-blue-400" /> Total Resumes
            </div>
            <div className="text-2xl font-black text-white">
              {loading ? "..." : stats.totalResumes}
            </div>
          </div>
          
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-2 text-slate-400 mb-2 text-xs font-bold uppercase tracking-wider">
              <Coins className="w-4 h-4 text-amber-400" /> Token Balance
            </div>
            <div className="text-2xl font-black text-white">
              {interviewCredits}
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-2 text-slate-400 mb-2 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-emerald-400" /> Free Resumes
            </div>
            <div className="text-2xl font-black text-white">
              {loading ? "..." : (stats.hasFreeResume ? "1" : "0")}
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-2 text-slate-400 mb-2 text-xs font-bold uppercase tracking-wider">
              <Download className="w-4 h-4 text-purple-400" /> Downloads Used
            </div>
            <div className="text-2xl font-black text-white">
              {loading ? "..." : stats.totalDownloadsUsed}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIResumeCard;
