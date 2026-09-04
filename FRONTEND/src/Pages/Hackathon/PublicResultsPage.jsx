import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  Trophy,
  Medal,
  Award,
  Search,
  Filter,
  ArrowLeft,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Clock,
  ShieldCheck,
  Flame,
  CheckCircle2,
  Terminal,
  Layers,
  Star,
} from "lucide-react";
import SEO from "../../Components/SEO";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5006";

export default function PublicResultsPage() {
  const [loading, setLoading] = useState(true);
  const [resultsData, setResultsData] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrack, setSelectedTrack] = useState("ALL");

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${BACKEND_URL}/api/hackathon/public/results`);
        if (res.data?.success) {
          setResultsData(res.data);
        }
      } catch (err) {
        console.error("Failed to load public hackathon results:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  const isPublished = resultsData?.isPublished;
  const leaderboard = resultsData?.leaderboard || resultsData?.rankings || [];
  const tracks = ["ALL", ...new Set(leaderboard.map((item) => item.track).filter(Boolean))];

  // Filter leaderboard by search query and track
  const filteredLeaderboard = leaderboard.filter((item) => {
    const matchesTrack = selectedTrack === "ALL" || item.track === selectedTrack;
    const matchesSearch =
      !searchQuery ||
      item.teamName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.projectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTrack && matchesSearch;
  });

  // Top 3 Podium (from the full published leaderboard)
  const top1 = leaderboard.find((r) => r.rank === 1);
  const top2 = leaderboard.find((r) => r.rank === 2);
  const top3 = leaderboard.find((r) => r.rank === 3);

  // Other special winners (outside of top 3 or specific titles)
  const specialWinners = leaderboard.filter(
    (r) => r.category && r.rank > 3
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500/30 font-sans">
      <SEO
        title="Code-A-Nova Hackathon 2026 — Official Results & Winners Leaderboard"
        description="Official results, winner announcements, and verified leaderboard for the Code-A-Nova National Hackathon 2026."
      />

      {/* Header Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/hackathon"
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Back to Hackathon Home"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-purple-600 to-cyan-400 p-[1.5px] shadow-lg shadow-amber-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-amber-400" />
                </div>
              </div>
              <div>
                <span className="font-black text-sm tracking-tight text-white flex items-center gap-1.5">
                  CODE-A-NOVA <span className="text-amber-400 font-extrabold text-xs">RESULTS</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium block -mt-0.5">
                  Official Hall of Fame 2026
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/hackathon#team-status"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 transition-all"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>My Result</span>
            </Link>
            <Link
              to="/hackathon"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all hidden sm:inline-flex"
            >
              <span>Hackathon Hub</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* Hero Section */}
        <section className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-inner">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Official Hackathon Results & Leaderboard</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Celebrating The Best Of{" "}
            <span className="bg-gradient-to-r from-amber-400 via-rose-400 to-cyan-400 bg-clip-text text-transparent">
              Code-A-Nova 2026
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Over dozens of hours of relentless ideation, building, and deployment, these standout engineering teams pushed boundaries across AI, Web3, and Open Innovation.
          </p>

          {isPublished && (
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs">
              <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Verified & Locked
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                {leaderboard.length} Finalists Ranked
              </span>
              {resultsData?.publishedAt && (
                <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
                  Published on {new Date(resultsData.publishedAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                </span>
              )}
            </div>
          )}
        </section>

        {loading ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400 uppercase tracking-widest font-mono">Loading official results...</p>
          </div>
        ) : !isPublished ? (
          /* Unpublished / Deliberation State */
          <div className="max-w-2xl mx-auto bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl p-8 sm:p-12 border border-slate-800 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">Results Deliberation In Progress</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                The editorial board and jury are currently finalizing evaluations, normalizing scores, and reviewing codebases.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-300 space-y-2">
              <div className="font-semibold text-white">Official Announcement Coming Soon</div>
              <div className="text-slate-500">
                Final winners, podium standings, and overall leaderboard will be unlocked right here.
              </div>
              {resultsData?.resultDate && (
                <div className="pt-2 border-t border-slate-800/80 text-amber-400 font-bold flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Scheduled Result Announcement:{" "}
                    <span className="text-white">
                      {new Date(resultsData.resultDate).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </span>
                </div>
              )}
            </div>
            <div className="pt-2">
              <Link
                to="/hackathon"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                Back to Hackathon Home <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          /* Published State: Podium + Leaderboard */
          <div className="space-y-16">
            {/* Podium Section (Top 3) */}
            {(top1 || top2 || top3) && (
              <section className="space-y-8">
                <div className="text-center space-y-1">
                  <h2 className="text-xs font-black uppercase tracking-widest text-amber-400 flex items-center justify-center gap-1.5">
                    <Award className="w-4 h-4" /> The Winners Podium
                  </h2>
                  <p className="text-xl sm:text-2xl font-black text-white">
                    National Champions & Runners-Up
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-6">
                  {/* 2nd Place */}
                  {top2 ? (
                    <div className="order-2 md:order-1 bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl p-6 border border-slate-700/60 shadow-xl relative text-center space-y-4 hover:border-slate-500 transition-all">
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-slate-700 border-2 border-slate-400 flex items-center justify-center text-white font-black text-sm shadow-md">
                        2
                      </div>
                      <div className="pt-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-600 mx-auto flex items-center justify-center text-slate-300 mb-2">
                          <Medal className="w-6 h-6" />
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-600">
                          {top2.category || "1st Runner Up"}
                        </span>
                        <h3 className="text-lg font-black text-white mt-2 truncate">
                          {top2.teamName}
                        </h3>
                        <p className="text-xs text-indigo-400 font-semibold truncate">
                          {top2.projectName || "Project"}
                        </p>
                        <span className="text-[10px] text-slate-500 block">{top2.track}</span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Final Score</div>
                        <div className="text-xl font-mono font-black text-white">
                          {Number(top2.finalScore || 0).toFixed(2)}
                          <span className="text-xs text-slate-500 font-normal"> / 100</span>
                        </div>
                        {top2.prize && (
                          <div className="text-xs font-bold text-emerald-400 mt-1">
                            🏆 {top2.prize}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="order-2 md:order-1" />
                  )}

                  {/* 1st Place (Champion - Elevated) */}
                  {top1 && (
                    <div className="order-1 md:order-2 bg-gradient-to-b from-amber-950/30 via-slate-900 to-slate-950 rounded-3xl p-8 border-2 border-amber-500/50 shadow-2xl shadow-amber-500/10 relative text-center space-y-5 md:-translate-y-4 hover:border-amber-400 transition-all">
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 border-2 border-amber-200 flex items-center justify-center text-slate-950 font-black text-lg shadow-lg">
                        1
                      </div>
                      <div className="pt-2">
                        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 mx-auto flex items-center justify-center text-amber-400 mb-3 shadow-inner">
                          <Trophy className="w-8 h-8" />
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          👑 {top1.category || "Winner 1st Place"}
                        </span>
                        <h3 className="text-2xl font-black text-white mt-3 truncate">
                          {top1.teamName}
                        </h3>
                        <p className="text-sm text-cyan-400 font-bold truncate">
                          {top1.projectName || "Winning Project"}
                        </p>
                        <span className="text-xs text-slate-400 block mt-0.5">{top1.track}</span>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-950/90 border border-amber-500/20 space-y-1">
                        <div className="text-[10px] uppercase font-bold text-amber-400/80">Champion Score</div>
                        <div className="text-3xl font-mono font-black text-white">
                          {Number(top1.finalScore || 0).toFixed(2)}
                          <span className="text-sm text-slate-500 font-normal"> / 100</span>
                        </div>
                        {top1.prize && (
                          <div className="text-sm font-black text-amber-400 pt-1">
                            💰 {top1.prize}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 3rd Place */}
                  {top3 ? (
                    <div className="order-3 bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl p-6 border border-amber-900/40 shadow-xl relative text-center space-y-4 hover:border-amber-700 transition-all">
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-amber-900 border-2 border-amber-600 flex items-center justify-center text-amber-200 font-black text-sm shadow-md">
                        3
                      </div>
                      <div className="pt-3">
                        <div className="w-12 h-12 rounded-xl bg-amber-900/20 border border-amber-700/40 mx-auto flex items-center justify-center text-amber-600 mb-2">
                          <Medal className="w-6 h-6" />
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-900/30 text-amber-400 border border-amber-700/40">
                          {top3.category || "2nd Runner Up"}
                        </span>
                        <h3 className="text-lg font-black text-white mt-2 truncate">
                          {top3.teamName}
                        </h3>
                        <p className="text-xs text-indigo-400 font-semibold truncate">
                          {top3.projectName || "Project"}
                        </p>
                        <span className="text-[10px] text-slate-500 block">{top3.track}</span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Final Score</div>
                        <div className="text-xl font-mono font-black text-white">
                          {Number(top3.finalScore || 0).toFixed(2)}
                          <span className="text-xs text-slate-500 font-normal"> / 100</span>
                        </div>
                        {top3.prize && (
                          <div className="text-xs font-bold text-emerald-400 mt-1">
                            🏆 {top3.prize}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="order-3" />
                  )}
                </div>
              </section>
            )}

            {/* Special Category Winners (if any) */}
            {specialWinners.length > 0 && (
              <section className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-xs font-black uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
                    <Star className="w-4 h-4" /> Special Recognitions
                  </h3>
                  <p className="text-lg font-black text-white">Special Category Awardees</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {specialWinners.map((winner, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          {winner.category}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-400">
                          Rank #{winner.rank}
                        </span>
                      </div>
                      <div>
                        <div className="font-black text-white text-base truncate">{winner.teamName}</div>
                        <div className="text-xs text-slate-400 truncate">{winner.projectName || "Project"}</div>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                        <span className="text-slate-500">{winner.track}</span>
                        <span className="font-mono font-bold text-white">
                          {Number(winner.finalScore || 0).toFixed(2)} pts
                        </span>
                      </div>
                      {winner.prize && (
                        <div className="text-xs font-bold text-emerald-400">{winner.prize}</div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Complete Leaderboard Section */}
            <section className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-400" /> Complete Final Leaderboard
                  </h3>
                  <p className="text-xs text-slate-400">
                    Comprehensive ranking of all evaluated finalists based on verified scores.
                  </p>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search team or project..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
                    <Filter className="w-3.5 h-3.5 text-slate-500" />
                    <select
                      value={selectedTrack}
                      onChange={(e) => setSelectedTrack(e.target.value)}
                      className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
                    >
                      {tracks.map((t) => (
                        <option key={t} value={t} className="bg-slate-900 text-white">
                          {t === "ALL" ? "All Tracks" : t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                      <tr>
                        <th className="py-3.5 px-4 w-16 text-center">Rank</th>
                        <th className="py-3.5 px-4">Team & Project</th>
                        <th className="py-3.5 px-4">Track</th>
                        <th className="py-3.5 px-4 text-right">Final Score</th>
                        <th className="py-3.5 px-4">Award & Category</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {filteredLeaderboard.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-500">
                            No teams found matching search criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredLeaderboard.map((row) => (
                          <tr
                            key={row.teamId}
                            className={`hover:bg-slate-800/40 transition-colors ${
                              row.rank === 1
                                ? "bg-amber-500/5 font-semibold"
                                : row.rank === 2
                                ? "bg-slate-500/5 font-semibold"
                                : row.rank === 3
                                ? "bg-amber-900/5 font-semibold"
                                : ""
                            }`}
                          >
                            <td className="py-4 px-4 text-center">
                              {row.rank === 1 ? (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 font-black text-xs border border-amber-500/40">
                                  1
                                </span>
                              ) : row.rank === 2 ? (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-500/20 text-slate-300 font-black text-xs border border-slate-500/40">
                                  2
                                </span>
                              ) : row.rank === 3 ? (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-900/20 text-amber-500 font-black text-xs border border-amber-700/40">
                                  3
                                </span>
                              ) : (
                                <span className="font-mono text-slate-400 font-bold">
                                  #{row.rank}
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <div className="font-bold text-white text-sm">
                                {row.teamName}
                              </div>
                              <div className="text-slate-400 text-xs truncate max-w-xs">
                                {row.projectName || "Project Prototype"}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-950 border border-slate-800 text-slate-300">
                                {row.track || "General"}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="font-mono font-bold text-white text-sm">
                                {Number(row.finalScore || 0).toFixed(2)}
                              </div>
                              <div className="text-[10px] text-slate-500">out of 100</div>
                            </td>
                            <td className="py-4 px-4">
                              {row.category ? (
                                <div className="space-y-0.5">
                                  <span
                                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                      row.rank === 1
                                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                        : row.rank === 2
                                        ? "bg-slate-700 text-slate-300 border border-slate-600"
                                        : row.rank === 3
                                        ? "bg-amber-900/30 text-amber-400 border border-amber-700/40"
                                        : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                                    }`}
                                  >
                                    {row.category}
                                  </span>
                                  {row.prize && (
                                    <div className="text-[11px] font-bold text-emerald-400">
                                      {row.prize}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-500 text-xs">Finalist</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-slate-800/80 py-8 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 space-y-2">
          <div>
            Code-A-Nova Hackathon 2026 • Official Final Evaluation & Winner Records
          </div>
          <div>
            Scoring verified by the Editorial & Judging Committee. Rankings frozen and immutable.
          </div>
        </div>
      </footer>
    </div>
  );
}
