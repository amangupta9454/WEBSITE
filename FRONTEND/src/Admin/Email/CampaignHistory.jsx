import React from "react";
import { Award, Briefcase, Cpu, Terminal, Calendar, HelpCircle, Mail, ArrowRight, ShieldCheck, Activity } from "lucide-react";

export default function CampaignHistory({ analytics, loading, onSelectCampaign }) {
  if (loading || !analytics) {
    return (
      <div className="py-20 text-center text-slate-500 font-bold animate-pulse">
        Calculating campaign historical aggregates...
      </div>
    );
  }

  const campaigns = analytics.charts?.campaigns || [];

  // Icon selector helper for visual differentiation of campaigns
  const getCampaignIcon = (name = "") => {
    const n = name.toLowerCase();
    if (n.includes("internship") || n.includes("offer")) return <Briefcase className="w-6 h-6 text-blue-600" />;
    if (n.includes("hackathon")) return <Terminal className="w-6 h-6 text-purple-600" />;
    if (n.includes("interview") || n.includes("ai")) return <Cpu className="w-6 h-6 text-indigo-600" />;
    if (n.includes("prompt") || n.includes("llm")) return <Activity className="w-6 h-6 text-pink-600" />;
    if (n.includes("certificate") || n.includes("completion")) return <Award className="w-6 h-6 text-amber-600" />;
    if (n.includes("quiz") || n.includes("test")) return <HelpCircle className="w-6 h-6 text-teal-600" />;
    if (n.includes("verification") || n.includes("otp")) return <ShieldCheck className="w-6 h-6 text-emerald-600" />;
    return <Mail className="w-6 h-6 text-slate-600" />;
  };

  // Pre-defined enterprise categories to display even if volume is currently 0
  const defaultCategories = [
    "Internship Offer",
    "Offer Letter",
    "Completion Letter",
    "Hackathon",
    "AI Interview",
    "Prompt Engineering",
    "Project Assigned",
    "Project Reminder",
    "Quiz",
    "Certificate",
  ];

  // Merge database recorded campaigns with default categories to ensure full platform visibility
  const mergedCampaigns = [...campaigns];
  defaultCategories.forEach((cat) => {
    if (!mergedCampaigns.find((c) => c.campaign === cat)) {
      mergedCampaigns.push({
        campaign: cat,
        total: 0,
        success: 0,
        failed: 0,
        lastSent: null,
      });
    }
  });

  // Sort by volume descending
  mergedCampaigns.sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Campaign History & Categorized Volumes</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Grouped analytics across automated student workflows, Hackathons, AI Interviews, and internship letters
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">
          <span>Active Tracked Campaigns: {mergedCampaigns.filter(c => c.total > 0).length}</span>
        </div>
      </div>

      {/* Grid of Campaign Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {mergedCampaigns.map((camp) => {
          const successPct = camp.total > 0 ? Math.round((camp.success / camp.total) * 100) : 100;
          return (
            <div
              key={camp.campaign}
              onClick={() => onSelectCampaign && onSelectCampaign(camp.campaign)}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 group-hover:bg-indigo-50 transition-colors flex items-center justify-center shadow-sm">
                    {getCampaignIcon(camp.campaign)}
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase ${successPct >= 95 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                    {successPct}% Delivery Rate
                  </span>
                </div>

                <h3 className="text-lg font-black text-slate-800 mt-4 group-hover:text-indigo-600 transition-colors">
                  {camp.campaign}
                </h3>
                
                <div className="mt-4 grid grid-cols-3 gap-2 py-2.5 px-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">Total</span>
                    <p className="text-base font-black text-slate-800">{camp.total?.toLocaleString() || 0}</p>
                  </div>
                  <div className="border-x border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Success</span>
                    <p className="text-base font-black text-emerald-600">{camp.success?.toLocaleString() || 0}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">Failed</span>
                    <p className={`text-base font-black ${camp.failed > 0 ? "text-rose-600" : "text-slate-500"}`}>
                      {camp.failed?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {camp.lastSent ? `Last: ${new Date(camp.lastSent).toLocaleDateString()}` : "No historical dispatch"}
                  </span>
                </div>
                <span className="text-indigo-600 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  View Logs <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
