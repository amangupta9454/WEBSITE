import { useState, useEffect } from "react";
import axios from "axios";
import { Trophy, Star, Medal, Award, Crown } from "lucide-react";
import { useWindowSize } from "react-use";
import Confetti from "react-confetti";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useNavigate } from "react-router-dom";


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
            <div className="flex flex-col p-4 sm:p-6 gap-2">
              {leaderboard.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((user, idx) => {
                const actualRank = (currentPage - 1) * itemsPerPage + idx;
                const tier = getTier(user.synergyPoints);
                let rowClasses = 'border-l-4 border-transparent border-b border-b-slate-100';
                if (actualRank === 0) rowClasses = 'bg-gradient-to-r from-yellow-50 to-white border-l-4 border-yellow-400 shadow-md transform hover:-translate-y-1 z-30 relative mb-2 rounded-xl border border-yellow-200';
                else if (actualRank === 1) rowClasses = 'bg-gradient-to-r from-slate-50 to-white border-l-4 border-slate-400 shadow-sm transform hover:-translate-y-1 z-20 relative mb-2 rounded-xl border border-slate-200';
                else if (actualRank === 2) rowClasses = 'bg-gradient-to-r from-orange-50 to-white border-l-4 border-orange-400 shadow-sm transform hover:-translate-y-1 z-10 relative mb-4 rounded-xl border border-orange-200';
                else if (actualRank < 10) rowClasses = 'bg-gradient-to-r from-blue-50/30 to-transparent border-l-4 border-blue-400 border-b border-b-slate-100';

                return (
                  <div key={user.studentId || actualRank} className={`p-4 sm:p-6 flex items-center gap-4 sm:gap-6 transition-all duration-300 hover:bg-slate-50 overflow-hidden ${rowClasses}`}>
                    {actualRank === 0 && <Crown className="absolute top-2 right-4 text-yellow-400 w-8 h-8 opacity-20" />}
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
                          <h3 className={`text-lg font-bold text-slate-900 ${actualRank < 3 ? '' : 'truncate'}`}>
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
            
            {/* Pagination Controls */}
            {leaderboard.length > itemsPerPage && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-3xl">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm font-medium text-slate-600">
                  Page {currentPage} of {Math.ceil(leaderboard.length / itemsPerPage)}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(leaderboard.length / itemsPerPage)))}
                  disabled={currentPage === Math.ceil(leaderboard.length / itemsPerPage)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
            </>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Leaderboard;
