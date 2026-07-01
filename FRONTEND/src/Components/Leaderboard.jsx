import { useState, useEffect } from "react";
import axios from "axios";
import { Trophy, Star, Medal, Award, Crown, ChevronLeft, ChevronRight, Zap, Github, Linkedin } from "lucide-react";
import { useWindowSize } from "react-use";
import Confetti from "react-confetti";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useNavigate } from "react-router-dom";

// Premium VIP Card Component for Top 3
const VIPCard = ({ user, rank, getTier }) => {
  if (!user) return null;
  const isFirst = rank === 1;
  const tier = getTier(user.synergyPoints);
  
  // Styling based on rank
  let bgGradient = "";
  let borderGlow = "";
  let badgeColor = "";
  let rankText = "";
  
  if (rank === 1) {
    bgGradient = "bg-gradient-to-b from-yellow-50 to-white border-yellow-200";
    borderGlow = "shadow-[0_0_20px_rgba(234,179,8,0.15)]";
    badgeColor = "text-yellow-600 bg-yellow-100";
    rankText = "text-yellow-600/30";
  } else if (rank === 2) {
    bgGradient = "bg-gradient-to-b from-slate-50 to-white border-slate-200";
    borderGlow = "shadow-[0_0_15px_rgba(203,213,225,0.15)]";
    badgeColor = "text-slate-600 bg-slate-100";
    rankText = "text-slate-400/50";
  } else {
    bgGradient = "bg-gradient-to-b from-orange-50 to-white border-orange-200";
    borderGlow = "shadow-[0_0_15px_rgba(249,115,22,0.15)]";
    badgeColor = "text-orange-600 bg-orange-100";
    rankText = "text-orange-500/30";
  }

  return (
    <div className={`relative flex flex-col items-center p-4 sm:p-5 rounded-3xl border backdrop-blur-md transition-all duration-500 hover:-translate-y-1 ${bgGradient} ${borderGlow} w-full max-w-sm mx-auto`}>
      {isFirst && <Crown className="absolute -top-5 text-yellow-500 w-10 h-10 drop-shadow-md animate-bounce z-10" />}
      
      <div className={`absolute top-4 left-4 text-2xl font-black ${rankText}`}>
        #{rank}
      </div>

      <div className="relative w-20 h-20 md:w-28 md:h-28 rounded-full p-1 mb-3 z-10">
        <div className={`absolute inset-0 rounded-full animate-spin-slow bg-gradient-to-tr ${rank === 1 ? 'from-yellow-300 to-transparent' : rank === 2 ? 'from-slate-300 to-transparent' : 'from-orange-300 to-transparent'}`}></div>
        <div className="w-full h-full rounded-full overflow-hidden border-4 border-white relative z-10 bg-white">
          <img src={user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&color=fff&rounded=true&bold=true`} alt={user.name} className="w-full h-full object-cover" />
        </div>
      </div>

      <div className="mb-2 z-10 flex justify-center">
        <span className={`px-3 py-1 rounded-full text-xs md:text-sm font-bold border shadow-sm ${tier.color}`}>
          {tier.title}
        </span>
      </div>
      <h3 className="text-lg md:text-xl font-black text-slate-800 text-center mb-1 z-10">{user.name}</h3>
      <div className="flex items-center justify-center gap-2 mb-3 text-slate-500 text-xs sm:text-sm font-medium">
        <span>{user.domain}</span>
        {user.studentId && (
          <>
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <span className="text-slate-400 font-mono text-[10px] sm:text-xs">{user.studentId}</span>
          </>
        )}
      </div>
      
      <div className="flex flex-wrap justify-center items-center gap-2 mb-3">
        {user.github && (
          <a href={user.github} target="_blank" rel="noreferrer" className="p-1 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors">
            <Github size={14} />
          </a>
        )}
        {user.linkedin && (
          <a href={user.linkedin} target="_blank" rel="noreferrer" className="p-1 rounded-full bg-slate-100 text-slate-500 hover:text-blue-600 hover:bg-slate-200 transition-colors">
            <Linkedin size={14} />
          </a>
        )}
        {user.internshipType && (
          <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-600">
            {user.internshipType}
          </span>
        )}
      </div>

      <div className={`mt-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-2xl border border-white/50 w-full ${badgeColor}`}>
        <Zap className="w-4 h-4" />
        <span className="text-xl font-black tracking-tight">{user.synergyPoints}</span>
        <span className="text-[10px] font-bold uppercase opacity-70 mt-1">SP</span>
      </div>
    </div>
  );
};

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [timeframe, setTimeframe] = useState('current_month');
  const itemsPerPage = 10;
  const { width, height } = useWindowSize();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        setLoading(true);
        const settingsRes = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/settings/leaderboard`);
        if (!settingsRes.data.showLeaderboard) return navigate("/");

        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/student/leaderboard?timeframe=${timeframe}`);
        setLeaderboard(res.data.leaderboard);
        setCurrentPage(1);
      } catch (err) {
        console.error("Failed to fetch leaderboard", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboardData();
  }, [navigate, timeframe]);

  const getTier = (points) => {
    if (points >= 600) return { title: "Elite Intern", color: "text-purple-600 bg-purple-100 border-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.1)]" };
    if (points >= 300) return { title: "Pro Developer", color: "text-orange-600 bg-orange-100 border-orange-200 shadow-[0_0_10px_rgba(249,115,22,0.1)]" };
    if (points >= 100) return { title: "Rising Star", color: "text-blue-600 bg-blue-100 border-blue-200 shadow-[0_0_10px_rgba(59,130,246,0.1)]" };
    return { title: "Novice Intern", color: "text-emerald-600 bg-emerald-100 border-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.1)]" };
  };

  const top3 = leaderboard.slice(0, 3);
  const currentItems = leaderboard.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const isFirstPage = currentPage === 1;
  const listItems = isFirstPage ? currentItems.slice(3) : currentItems;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 relative overflow-hidden font-sans selection:bg-blue-500/30 selection:text-blue-900">
      
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:30px_30px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        {/* Glowing Orbs */}
        <div className="absolute top-0 left-1/4 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob"></div>
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-4000"></div>
      </div>

      <div className="fixed inset-0 z-50 pointer-events-none">
        {leaderboard.length > 0 && <Confetti width={width} height={height} recycle={false} numberOfPieces={800} gravity={0.15} colors={['#eab308', '#60a5fa', '#a855f7', '#fb923c']} />}
      </div>

      <Navbar />
      
      <main className="relative z-10 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        
        {/* Hero Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full border border-slate-200 bg-white/50 backdrop-blur-md mb-6 shadow-sm">
            <Trophy className="w-4 h-4 text-yellow-500 mr-2" />
            <span className="text-[10px] md:text-xs font-bold tracking-wide uppercase text-slate-600">Codeanova Elite Rankings</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 drop-shadow-sm">
            WALL OF FAME
          </h1>
          <p className="text-sm md:text-base text-slate-500 max-w-xl mx-auto font-medium leading-relaxed mb-6">
            Honoring the masterminds pushing the boundaries of code. Consistency, logic, and brilliance live here.
          </p>
          
          {/* Timeframe Filters */}
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { id: 'current_month', label: `${new Date().toLocaleString('default', { month: 'long' })} Leaderboard` },
              { id: 'all', label: 'All Time' }
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => setTimeframe(filter.id)}
                className={`px-4 py-2 rounded-full text-xs md:text-sm font-bold transition-all duration-300 border shadow-sm ${
                  timeframe === filter.id 
                    ? 'bg-blue-600 text-white border-blue-600 scale-105' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-blue-600'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="p-16 text-center bg-white/80 border border-slate-200 rounded-3xl backdrop-blur-sm shadow-sm max-w-md mx-auto">
            <Star className="mx-auto text-slate-300 mb-4" size={40} />
            <h3 className="text-lg font-bold text-slate-700 mb-2">Awaiting the First Legend</h3>
            <p className="text-sm text-slate-500">The leaderboard will ignite once interns start earning Synergy Points.</p>
          </div>
        ) : (
          <div className="space-y-10">
            
            {/* Top 3 VIP Grid (Only on First Page) */}
            {isFirstPage && top3.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end max-w-5xl mx-auto">
                <div className="order-2 md:order-1">
                  {top3[1] && <VIPCard user={top3[1]} rank={2} getTier={getTier} />}
                </div>
                <div className="order-1 md:order-2 transform md:-translate-y-8">
                  {top3[0] && <VIPCard user={top3[0]} rank={1} getTier={getTier} />}
                </div>
                <div className="order-3 md:order-3">
                  {top3[2] && <VIPCard user={top3[2]} rank={3} getTier={getTier} />}
                </div>
              </div>
            )}

            {/* List for Rest of the Interns */}
            {listItems.length > 0 && (
              <div className="max-w-4xl mx-auto flex flex-col gap-2">
                <h3 className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-2 px-2 flex items-center gap-3">
                  <span className="w-8 h-[1px] bg-slate-200"></span>
                  {isFirstPage ? "The Challengers" : "Leaderboard"}
                  <span className="flex-1 h-[1px] bg-slate-200"></span>
                </h3>
                
                {listItems.map((user, idx) => {
                  const actualRank = isFirstPage ? idx + 3 + 1 : (currentPage - 1) * itemsPerPage + idx + 1; // +1 for 1-based indexing
                  const tier = getTier(user.synergyPoints);
                  
                  return (
                    <div key={user.studentId || actualRank} className="group relative flex items-center p-3 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-300">
                      {/* Glow effect on hover */}
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-50/0 via-blue-50 to-purple-50/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      
                      <div className="flex-shrink-0 w-10 text-center z-10">
                        <span className="text-lg font-black text-slate-400 group-hover:text-blue-600 transition-colors">#{actualRank}</span>
                      </div>
                      
                      <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden border border-slate-200 ml-2 z-10 bg-slate-100">
                        <img src={user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&color=fff&rounded=true&bold=true`} alt={user.name} className="w-full h-full object-cover" />
                      </div>
                      
                      <div className="flex-1 min-w-0 ml-3 sm:ml-4 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 z-10">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm sm:text-base font-bold text-slate-800 truncate group-hover:text-blue-900 transition-colors">{user.name}</h3>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] sm:text-xs font-medium text-slate-500 truncate">
                            <span>{user.domain}</span>
                            {user.studentId && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                <span className="text-slate-400 font-mono">{user.studentId}</span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1.5 mt-2 sm:mt-0 flex-shrink-0 flex-wrap justify-end">
                          {user.github && (
                            <a href={user.github} target="_blank" rel="noreferrer" className="p-1 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors">
                              <Github size={12} />
                            </a>
                          )}
                          {user.linkedin && (
                            <a href={user.linkedin} target="_blank" rel="noreferrer" className="p-1 rounded-full text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors">
                              <Linkedin size={12} />
                            </a>
                          )}
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${tier.color}`}>
                            {tier.title}
                          </span>
                          {user.internshipType && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 border border-slate-200 text-slate-600">
                              {user.internshipType}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-shrink-0 ml-3 text-right z-10">
                        <div className="flex items-center gap-1 justify-end">
                          <span className="text-lg sm:text-xl font-black text-blue-600">{user.synergyPoints}</span>
                          <Zap className="w-3.5 h-3.5 text-blue-500" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {leaderboard.length > itemsPerPage && (
              <div className="flex items-center justify-center gap-3 pt-6">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center px-4 py-2 rounded-full text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                  Prev
                </button>
                <div className="px-4 py-2 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-500 shadow-inner">
                  <span className="text-slate-800">{currentPage}</span> <span className="opacity-50 mx-1">/</span> {Math.ceil(leaderboard.length / itemsPerPage)}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(leaderboard.length / itemsPerPage)))}
                  disabled={currentPage === Math.ceil(leaderboard.length / itemsPerPage)}
                  className="flex items-center px-4 py-2 rounded-full text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </button>
              </div>
            )}
          </div>
        )}
      </main>
      
      <div className="border-t border-slate-200 bg-white/80 backdrop-blur-md relative z-20">
        <Footer />
      </div>
    </div>
  );
};

export default Leaderboard;
