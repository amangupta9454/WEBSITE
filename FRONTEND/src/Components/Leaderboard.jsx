import { useState, useEffect } from "react";
import axios from "axios";
import { Trophy, Star, Medal, Award, Crown } from "lucide-react";
import { useWindowSize } from "react-use";
import Confetti from "react-confetti";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useNavigate } from "react-router-dom";

const PodiumCard = ({ user, rank, getTier }) => {
  if (!user) return null;
  const isFirst = rank === 1;
  const heightClasses = rank === 1 ? "h-48 md:h-56" : rank === 2 ? "h-36 md:h-44" : "h-28 md:h-36";
  const bgClasses = rank === 1 ? "bg-gradient-to-t from-yellow-500 to-yellow-300" : rank === 2 ? "bg-gradient-to-t from-slate-400 to-slate-200" : "bg-gradient-to-t from-amber-700 to-orange-400";
  const glowClasses = rank === 1 ? "shadow-[0_0_30px_rgba(234,179,8,0.5)]" : rank === 2 ? "shadow-[0_0_20px_rgba(148,163,184,0.4)]" : "shadow-[0_0_20px_rgba(217,119,6,0.4)]";
  const tier = getTier(user.synergyPoints);

  return (
    <div className={`flex flex-col items-center justify-end ${rank === 1 ? 'z-20 -mx-2 md:-mx-4' : 'z-10'} relative group`}>
      <div className={`relative mb-4 flex flex-col items-center transform transition-transform duration-500 group-hover:-translate-y-2`}>
        {isFirst && <Crown className="absolute -top-8 w-10 h-10 text-yellow-400 drop-shadow-md animate-bounce" />}
        <div className={`w-16 h-16 md:w-24 md:h-24 rounded-full p-1 bg-gradient-to-tr ${rank === 1 ? 'from-yellow-600 to-yellow-300' : rank === 2 ? 'from-slate-500 to-slate-200' : 'from-orange-600 to-orange-300'} shadow-lg`}>
          <div className="w-full h-full rounded-full overflow-hidden border-2 border-white bg-white">
            <img src={user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&color=fff&rounded=true&bold=true`} alt={user.name} className="w-full h-full object-cover" />
          </div>
        </div>
        <div className="mt-3 text-center bg-white/90 backdrop-blur-sm px-3 py-2 rounded-xl shadow-lg border border-white/50 min-w-[100px] md:min-w-[140px]">
          <h3 className="text-sm md:text-base font-black text-slate-800 truncate max-w-[80px] md:max-w-[120px] mx-auto">{user.name}</h3>
          <p className="text-xs md:text-sm font-bold text-blue-600">{user.synergyPoints} SP</p>
          <div className="mt-1 flex justify-center">
             <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] md:text-[10px] font-bold border ${tier.color}`}>
               {tier.title}
             </span>
          </div>
        </div>
      </div>
      
      <div className={`w-24 md:w-36 ${heightClasses} ${bgClasses} rounded-t-lg md:rounded-t-2xl relative flex justify-center pt-4 ${glowClasses} overflow-hidden border-t-2 border-white/40`}>
        <div className="absolute inset-0 bg-white/10"></div>
        <span className="text-4xl md:text-6xl font-black text-white/90 drop-shadow-md">{rank}</span>
      </div>
    </div>
  );
};

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const { width, height } = useWindowSize();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        // First check if leaderboard is enabled
        const settingsRes = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/settings/leaderboard`);
        if (!settingsRes.data.showLeaderboard) {
          return navigate("/");
        }

        // If enabled, fetch leaderboard data
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

  const getRankBadge = (rank) => {
    if (rank === 0) return <div className="bg-yellow-100 text-yellow-600 p-2 rounded-full"><Crown size={24} /></div>;
    if (rank === 1) return <div className="bg-slate-200 text-slate-500 p-2 rounded-full"><Medal size={24} /></div>;
    if (rank === 2) return <div className="bg-orange-100 text-orange-700 p-2 rounded-full"><Award size={24} /></div>;
    return <div className="w-10 h-10 flex items-center justify-center font-bold text-slate-400">#{rank + 1}</div>;
  };

  const getTier = (points) => {
    if (points >= 600) return { title: "Elite Intern", color: "text-purple-600 bg-purple-100 border-purple-200" };
    if (points >= 300) return { title: "Pro Developer", color: "text-orange-600 bg-orange-100 border-orange-200" };
    if (points >= 100) return { title: "Rising Star", color: "text-blue-600 bg-blue-100 border-blue-200" };
    return { title: "Novice Intern", color: "text-emerald-600 bg-emerald-100 border-emerald-200" };
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-blue-900 to-indigo-900 text-white pt-32 pb-20 px-4 relative overflow-hidden">
        {leaderboard.length > 0 && <Confetti width={width} height={height} recycle={false} numberOfPieces={300} />}
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-2xl mb-6 backdrop-blur-sm border border-white/20">
            <Trophy className="text-yellow-400 w-8 h-8 mr-3" />
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">Wall of Fame</h1>
          </div>
          <p className="text-blue-100 text-lg md:text-xl max-w-2xl mx-auto font-medium">
            Celebrating the top-performing interns who have demonstrated exceptional dedication, high-quality code, and consistency.
          </p>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-1/4 left-10 text-white/5 opacity-50"><Star size={120} /></div>
        <div className="absolute bottom-10 right-10 text-white/5 opacity-50"><Award size={150} /></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-10 relative z-20 pb-24">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-20 text-center text-slate-500 font-medium animate-pulse">
              Loading leaderboard...
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="p-20 text-center">
              <Trophy className="mx-auto text-slate-300 mb-4" size={48} />
              <h3 className="text-xl font-bold text-slate-700 mb-2">No data yet</h3>
              <p className="text-slate-500">The leaderboard will update once interns start earning Synergy Points.</p>
            </div>
          ) : (
            <>
              {leaderboard.length >= 3 && (
                <div className="mb-10 px-4 md:px-10 pt-10 pb-8 bg-slate-50/50 border-b border-slate-100">
                  <div className="flex justify-center items-end gap-2 md:gap-6 pt-10">
                    <PodiumCard user={leaderboard[1]} rank={2} getTier={getTier} />
                    <PodiumCard user={leaderboard[0]} rank={1} getTier={getTier} />
                    <PodiumCard user={leaderboard[2]} rank={3} getTier={getTier} />
                  </div>
                </div>
              )}
              <div className="divide-y divide-slate-100">
                {leaderboard.slice(leaderboard.length >= 3 ? 3 : 0).map((user, idx) => {
                  const actualRank = leaderboard.length >= 3 ? idx + 3 : idx;
                  const tier = getTier(user.synergyPoints);
                  return (
                    <div key={user.studentId || actualRank} className={`p-4 sm:p-6 flex items-center gap-4 sm:gap-6 transition-colors hover:bg-slate-50 relative overflow-hidden ${
                      actualRank < 10 ? 'bg-gradient-to-r from-blue-50/50 to-transparent border-l-4 border-blue-400' : 'border-l-4 border-transparent'
                    }`}>
                      {actualRank < 10 && actualRank >= 3 && (
                        <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[10px] font-bold rounded-bl-lg shadow-sm opacity-90">
                          TOP 10
                        </div>
                      )}
                      <div className="flex-shrink-0 w-12 sm:w-16 flex justify-center">
                        {getRankBadge(actualRank)}
                      </div>
                    
                    <div className="flex-1 min-w-0 flex items-center gap-3 sm:gap-4">
                      <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-slate-100 shadow-sm">
                        <img 
                          src={user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&color=fff&rounded=true&bold=true`}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1">
                          <h3 className="text-lg font-bold text-slate-900 truncate">
                            {user.name}
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${tier.color} w-fit`}>
                              {tier.title}
                            </span>
                            {user.internshipType && (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border w-fit ${user.internshipType === 'Normal Intern' ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-indigo-100 text-indigo-700 border-indigo-200'}`}>
                                {user.internshipType}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm font-medium text-slate-500 truncate">
                          {user.domain}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-black text-blue-600">
                        {user.synergyPoints}
                      </div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        SP
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            </>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Leaderboard;
