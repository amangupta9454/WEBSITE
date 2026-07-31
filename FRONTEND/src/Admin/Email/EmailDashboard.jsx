import React from "react";
import { Mail, CheckCircle2, XCircle, Calendar, Clock, Activity, BarChart3, PieChart, ArrowUpRight } from "lucide-react";

export default function EmailDashboard({ analytics, loading, onNavigateToLogs }) {
  if (loading || !analytics) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Loading Email Center analytics...</p>
      </div>
    );
  }

  const { stats = {}, charts = {} } = analytics;
  const { dailyEmails = {}, monthlyEmails = {}, campaigns = [] } = charts;

  // Prepare Daily Chart items
  const dailyEntries = Object.entries(dailyEmails);
  const maxDaily = dailyEntries.length ? Math.max(...dailyEntries.map(([, v]) => v), 1) : 1;

  // Prepare Monthly Chart items
  const monthlyEntries = Object.entries(monthlyEmails);
  const maxMonthly = monthlyEntries.length ? Math.max(...monthlyEntries.map(([, v]) => v), 1) : 1;

  const totalCampaignVolume = campaigns.reduce((acc, c) => acc + (c.total || 0), 0) || 1;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Module Welcome Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
        <div className="relative z-10 max-w-2xl">
          <span className="px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold tracking-wide uppercase inline-block mb-3 border border-white/20">
            Enterprise Email Center
          </span>
          <h2 className="text-3xl font-black tracking-tight leading-tight">
            Single Source of Truth for Platform Transmissions
          </h2>
          <p className="text-indigo-200 mt-2 text-sm font-medium leading-relaxed">
            Every outbound notification, internship offer, certificate, and verification OTP is permanently cataloged in MongoDB with instant HTML playback and retry capabilities.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Sent */}
        <div 
          onClick={() => onNavigateToLogs && onNavigateToLogs("ALL")}
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Sent</span>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
              <Mail className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-800 mt-4">{stats.totalEmails?.toLocaleString() || 0}</p>
          <div className="mt-2 flex items-center text-xs font-bold text-indigo-600 gap-1">
            <span>View all historical audit logs</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Success Rate</span>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-600 mt-4">{stats.successRate || 100}%</p>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${stats.successRate || 100}%` }} 
            />
          </div>
        </div>

        {/* Success Count */}
        <div 
          onClick={() => onNavigateToLogs && onNavigateToLogs("SUCCESS")}
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Delivered</span>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-800 mt-4">{stats.success?.toLocaleString() || 0}</p>
          <div className="mt-2 flex items-center text-xs font-bold text-emerald-600 gap-1">
            <span>Confirmed Hostinger 250 OK</span>
          </div>
        </div>

        {/* Failed Count */}
        <div 
          onClick={() => onNavigateToLogs && onNavigateToLogs("FAILED")}
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-rose-200 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Bounced / Failed</span>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${stats.failed > 0 ? "bg-rose-100 text-rose-600 animate-pulse" : "bg-slate-100 text-slate-400"}`}>
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <p className={`text-3xl font-black mt-4 ${stats.failed > 0 ? "text-rose-600" : "text-slate-800"}`}>
            {stats.failed?.toLocaleString() || 0}
          </p>
          <div className="mt-2 flex items-center text-xs font-bold text-rose-600 gap-1">
            <span>Click to inspect & re-dispatch</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Time-Based Quick Metrics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Sent Today</span>
            <p className="text-2xl font-black text-slate-800">{stats.todayEmails?.toLocaleString() || 0}</p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">This Week (7 Days)</span>
            <p className="text-2xl font-black text-slate-800">{stats.thisWeek?.toLocaleString() || 0}</p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">This Month</span>
            <p className="text-2xl font-black text-slate-800">{stats.thisMonth?.toLocaleString() || 0}</p>
          </div>
        </div>
      </div>

      {/* Interactive Charting Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Email Volume (Last 14 Days) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" /> Daily Dispatch Trend (Last 14 Days)
                </h3>
                <p className="text-xs text-slate-500 font-medium">Daily automated transmission volumes across all microservices</p>
              </div>
            </div>

            {/* Custom Bar Chart Component */}
            <div className="h-56 flex items-end gap-2.5 pt-6 border-b border-slate-100 pb-2">
              {dailyEntries.map(([dateStr, count]) => {
                const heightPct = Math.round((count / maxDaily) * 100);
                const shortDate = dateStr.slice(5); // MM-DD
                return (
                  <div key={dateStr} className="flex-1 flex flex-col items-center gap-2 group relative">
                    {/* Hover tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-10 bg-slate-900 text-white text-[11px] font-bold py-1 px-2 rounded-lg shadow-lg pointer-events-none transition-opacity z-20 whitespace-nowrap">
                      {dateStr}: {count} emails
                    </div>
                    <div className="w-full bg-slate-100 rounded-t-lg h-40 flex items-end justify-center overflow-hidden">
                      <div 
                        style={{ height: `${heightPct}%` }}
                        className="w-full bg-gradient-to-t from-indigo-600 to-indigo-500 rounded-t-lg group-hover:from-indigo-700 group-hover:to-indigo-600 transition-all duration-300 min-h-[4px]" 
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 tracking-tighter truncate w-full text-center">{shortDate}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Historical window: 14 Days</span>
            <span className="font-bold text-slate-700">Peak Daily: {maxDaily} emails</span>
          </div>
        </div>

        {/* Campaign Wise Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-1">
              <PieChart className="w-5 h-5 text-purple-600" /> Campaign Distribution
            </h3>
            <p className="text-xs text-slate-500 font-medium mb-5">Proportional share by category</p>

            <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
              {campaigns.length === 0 ? (
                <p className="text-sm text-slate-400 font-medium text-center py-8">No campaign data recorded yet.</p>
              ) : (
                campaigns.map((camp, idx) => {
                  const pct = Math.round((camp.total / totalCampaignVolume) * 100) || 0;
                  const colors = [
                    "from-blue-600 to-indigo-600",
                    "from-purple-600 to-pink-600",
                    "from-emerald-500 to-teal-600",
                    "from-amber-500 to-orange-600",
                    "from-rose-500 to-red-600",
                  ];
                  const colorClass = colors[idx % colors.length];
                  return (
                    <div key={camp.campaign} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                        <span className="truncate pr-2">{camp.campaign}</span>
                        <span className="text-slate-500">{camp.total} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className={`h-full rounded-full bg-gradient-to-r ${colorClass}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>Total Categories: {campaigns.length}</span>
            <span>100% Verified Logging</span>
          </div>
        </div>
      </div>

      {/* Monthly Volume Bar (Last 12 Months) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-lg font-black text-slate-800 mb-1 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-teal-600" /> Annual Transmission Cadence (Monthly Breakdown)
        </h3>
        <p className="text-xs text-slate-500 font-medium mb-6">Total emails delivered per month over the previous 12 months</p>

        <div className="h-44 flex items-end gap-4 pt-4 border-b border-slate-100 pb-2">
          {monthlyEntries.length === 0 ? (
            <div className="w-full text-center py-12 text-slate-400 font-medium text-sm">No historical monthly aggregates available yet.</div>
          ) : (
            monthlyEntries.map(([monthStr, count]) => {
              const hPct = Math.round((count / maxMonthly) * 100);
              return (
                <div key={monthStr} className="flex-1 flex flex-col items-center gap-2 group relative">
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-9 bg-slate-900 text-white text-[11px] font-bold py-1 px-2.5 rounded-lg shadow-lg pointer-events-none transition-opacity whitespace-nowrap">
                    {monthStr}: {count} emails
                  </div>
                  <div className="w-full bg-slate-100 rounded-t-xl h-32 flex items-end justify-center overflow-hidden">
                    <div style={{ height: `${hPct}%` }} className="w-full bg-gradient-to-t from-teal-600 to-emerald-500 rounded-t-xl group-hover:brightness-110 transition-all min-h-[6px]" />
                  </div>
                  <span className="text-xs font-bold text-slate-600 truncate">{monthStr}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
