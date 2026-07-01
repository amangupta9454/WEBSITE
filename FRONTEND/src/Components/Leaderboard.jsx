import { useState, useEffect } from "react";
import axios from "axios";
import { Trophy, Star, Medal, Award, Crown, ChevronLeft, ChevronRight, Zap } from "lucide-react";
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
    bgGradient = "bg-gradient-to-b from-yellow-500/20 to-slate-900 border-yellow-500/50";
    borderGlow = "shadow-[0_0_40px_rgba(234,179,8,0.3)]";
    badgeColor = "text-yellow-400 bg-yellow-400/10";
    rankText = "text-yellow-400";
  } else if (rank === 2) {
    bgGradient = "bg-gradient-to-b from-slate-300/20 to-slate-900 border-slate-300/50";
    borderGlow = "shadow-[0_0_30px_rgba(203,213,225,0.2)]";
    badgeColor = "text-slate-300 bg-slate-300/10";
    rankText = "text-slate-300";
  } else {
    bgGradient = "bg-gradient-to-b from-orange-500/20 to-slate-900 border-orange-500/50";
    borderGlow = "shadow-[0_0_30px_rgba(249,115,22,0.2)]";
    badgeColor = "text-orange-400 bg-orange-400/10";
    rankText = "text-orange-400";
  }

  return (
    <div className={`relative flex flex-col items-center p-6 rounded-3xl border backdrop-blur-md transition-all duration-500 hover:-translate-y-2 ${bgGradient} ${borderGlow} w-full max-w-sm mx-auto`}>
      {isFirst && <Crown className="absolute -top-6 text-yellow-400 w-12 h-12 drop-shadow-[0_0_15px_rgba(234,179,8,0.8)] animate-bounce z-10" />}
      
      <div className={`absolute top-4 left-4 text-3xl font-black opacity-30 ${rankText}`}>
        #{rank}
      </div>

      <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full p-1 mb-4 z-10">
        <div className={`absolute inset-0 rounded-full animate-spin-slow bg-gradient-to-tr ${rank === 1 ? 'from-yellow-400 to-transparent' : rank === 2 ? 'from-slate-400 to-transparent' : 'from-orange-500 to-transparent'}`}></div>
        <div className="w-full h-full rounded-full overflow-hidden border-4 border-slate-900 relative z-10 bg-slate-800">
          <img src={user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&color=fff&rounded=true&bold=true`} alt={user.name} className="w-full h-full object-cover" />
        </div>
      </div>

      <h3 className="text-xl md:text-2xl font-black text-white text-center mb-1">{user.name}</h3>
      <p className="text-slate-400 text-sm font-medium mb-4 text-center">{user.domain}</p>
      
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${tier.color}`}>
          {tier.title}
        </span>
        {user.internshipType && (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/5 border border-white/10 text-slate-300">
            {user.internshipType}
          </span>
        )}
      </div>

      <div className={`mt-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-white/5 w-full ${badgeColor}`}>
        <Zap className="w-5 h-5" />
        <span className="text-2xl font-black tracking-tight">{user.synergyPoints}</span>
        <span className="text-xs font-bold uppercase opacity-70 mt-1">SP</span>
      </div>
    </div>
  );
};

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { width, height } = useWindowSize();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        const settingsRes = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/settings/leaderboard`);
        if (!settingsRes.data.showLeaderboard) return navigate("/");

        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/student/leaderboard`);
        setLeaderboard(res.data.leaderboard);
      } catch (err) {
        console.error("Failed to fetch leaderboard", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboardData();
  }, [navigate]);

  const getTier = (points) => {
    if (points >= 600) return { title: "Elite Intern", color: "text-purple-300 bg-purple-500/20 border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]" };
    if (points >= 300) return { title: "Pro Developer", color: "text-orange-300 bg-orange-500/20 border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.2)]" };
    if (points >= 100) return { title: "Rising Star", color: "text-blue-300 bg-blue-500/20 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]" };
    return { title: "Novice Intern", color: "text-emerald-300 bg-emerald-500/20 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]" };
  };

  const top3 = leaderboard.slice(0, 3);
  const currentItems = leaderboard.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const isFirstPage = currentPage === 1;
  const listItems = isFirstPage ? currentItems.slice(3) : currentItems;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 relative overflow-hidden font-sans selection:bg-blue-500/30 selection:text-blue-200">
      
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        {/* Glowing Orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob"></div>
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-indigo-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000"></div>
      </div>

      <div className="fixed inset-0 z-50 pointer-events-none">
        {leaderboard.length > 0 && <Confetti width={width} height={height} recycle={false} numberOfPieces={800} gravity={0.12} colors={['#eab308', '#60a5fa', '#a855f7', '#fb923c', '#ffffff']} />}
      </div>

      <Navbar />
      
      <main className="relative z-10 pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        
        {/* Hero Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
            <Trophy className="w-4 h-4 text-yellow-400 mr-2" />
            <span className="text-sm font-semibold tracking-wide uppercase text-slate-300">Codeanova Elite Rankings</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 drop-shadow-sm">
            WALL OF FAME
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
            Honoring the masterminds pushing the boundaries of code. Consistency, logic, and brilliance live here.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="p-20 text-center bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm">
            <Star className="mx-auto text-slate-600 mb-4" size={48} />
            <h3 className="text-xl font-bold text-slate-300 mb-2">Awaiting the First Legend</h3>
            <p className="text-slate-500">The leaderboard will ignite once interns start earning Synergy Points.</p>
          </div>
        ) : (
          <div className="space-y-16">
            
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
              <div className="max-w-4xl mx-auto flex flex-col gap-3">
                <h3 className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-4 px-2 flex items-center gap-3">
                  <span className="w-8 h-[1px] bg-slate-700"></span>
                  {isFirstPage ? "The Challengers" : "Leaderboard"}
                  <span className="flex-1 h-[1px] bg-slate-800"></span>
                </h3>
                
                {listItems.map((user, idx) => {
                  const actualRank = isFirstPage ? idx + 3 + 1 : (currentPage - 1) * itemsPerPage + idx + 1; // +1 for 1-based indexing
                  const tier = getTier(user.synergyPoints);
                  
                  return (
                    <div key={user.studentId || actualRank} className="group relative flex items-center p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300">
                      {/* Glow effect on hover */}
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                      
                      <div className="flex-shrink-0 w-12 text-center">
                        <span className="text-xl font-black text-slate-500 group-hover:text-slate-300 transition-colors">#{actualRank}</span>
                      </div>
                      
                      <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden border border-slate-700 ml-2">
                        <img src={user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&color=fff&rounded=true&bold=true`} alt={user.name} className="w-full h-full object-cover" />
                      </div>
                      
                      <div className="flex-1 min-w-0 ml-4 sm:ml-6 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-bold text-slate-200 truncate group-hover:text-white transition-colors">{user.name}</h3>
                          <p className="text-xs sm:text-sm text-slate-500 truncate">{user.domain}</p>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1 sm:mt-0 flex-shrink-0">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${tier.color}`}>
                            {tier.title}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex-shrink-0 ml-4 text-right">
                        <div className="flex items-center gap-1.5 justify-end">
                          <span className="text-xl sm:text-2xl font-black text-blue-400 group-hover:text-blue-300 transition-colors drop-shadow-[0_0_10px_rgba(96,165,250,0.3)]">{user.synergyPoints}</span>
                          <Zap className="w-4 h-4 text-blue-500/70" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {leaderboard.length > itemsPerPage && (
              <div className="flex items-center justify-center gap-4 pt-8">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center px-5 py-2.5 rounded-full text-sm font-semibold bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all backdrop-blur-sm"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Prev
                </button>
                <div className="px-5 py-2.5 rounded-full bg-slate-900/50 border border-slate-800 text-sm font-bold text-slate-400 shadow-inner backdrop-blur-sm">
                  <span className="text-white">{currentPage}</span> <span className="opacity-50 mx-1">/</span> {Math.ceil(leaderboard.length / itemsPerPage)}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(leaderboard.length / itemsPerPage)))}
                  disabled={currentPage === Math.ceil(leaderboard.length / itemsPerPage)}
                  className="flex items-center px-5 py-2.5 rounded-full text-sm font-semibold bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all backdrop-blur-sm"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            )}
          </div>
        )}
      </main>
      
      <div className="border-t border-white/5 bg-slate-950/50 backdrop-blur-md relative z-20">
        <Footer />
      </div>
    </div>
  );
};

export default Leaderboard;
