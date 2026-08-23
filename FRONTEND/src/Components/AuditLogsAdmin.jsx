import React, { useState, useEffect, useMemo } from 'react';
import { Activity, Calendar, Users, List, RefreshCw, Globe, ChevronUp, ChevronDown } from 'lucide-react';

const AuditLogsAdmin = () => {
  const [activeTab, setActiveTab] = useState('recent'); // 'recent' or 'stats'
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [filterAction, setFilterAction] = useState('');
  const [filterDays, setFilterDays] = useState('');
  const [expandedIps, setExpandedIps] = useState({});
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async (pageNum = 1) => {
    setLoading(true);
    try {
      let url = `${import.meta.env.VITE_BACKEND_URL}/api/admin/audit-logs/recent?page=${pageNum}&limit=50`;
      if (filterAction) url += `&action=${filterAction}`;
      if (filterDays) url += `&days=${filterDays}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      const data = await response.json();
      if (data.logs) {
        setLogs(data.logs);
        setPage(data.page);
        setTotalPages(data.totalPages);
      }
    } catch (err) {
      console.error("Failed to fetch audit logs", err);
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      let url = `${import.meta.env.VITE_BACKEND_URL}/api/admin/audit-logs/stats`;
      const params = new URLSearchParams();
      if (filterAction) params.append('action', filterAction);
      if (filterDays) params.append('days', filterDays);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch audit stats", err);
    }
    setLoading(false);
  };

  const groupedLogs = useMemo(() => {
    const map = {};
    logs.forEach(log => {
      const ip = (log.details && log.details.ipAddress) || 'Unknown IP';
      if (!map[ip]) {
        map[ip] = {
          ip,
          emails: new Set(),
          actionsCount: 0,
          latestActionAt: log.createdAt,
          actionCounts: {},
          logs: []
        };
      }
      map[ip].actionsCount++;
      const email = log.userEmail;
      if (email && email !== 'Anonymous / Guest') {
        map[ip].emails.add(email);
      } else if (map[ip].emails.size === 0) {
        map[ip].emails.add('Anonymous / Guest');
      }
      map[ip].actionCounts[log.action] = (map[ip].actionCounts[log.action] || 0) + 1;
      map[ip].logs.push(log);
      if (new Date(log.createdAt) > new Date(map[ip].latestActionAt)) {
        map[ip].latestActionAt = log.createdAt;
      }
    });
    return Object.values(map).sort((a, b) => new Date(b.latestActionAt) - new Date(a.latestActionAt));
  }, [logs]);

  const fetchSummary = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/audit-logs/summary`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      const data = await response.json();
      setSummary(data);
    } catch (err) {
      console.error("Failed to fetch summary stats", err);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    if (activeTab === 'recent') {
      fetchLogs(1); // Reset to page 1 on filter/tab change
    } else {
      fetchStats();
    }
  }, [activeTab, filterAction, filterDays]);

  // Separate effect for pagination
  useEffect(() => {
    if (activeTab === 'recent') {
      fetchLogs(page);
    }
  }, [page]);

  return (
    <div className="animate-fade-in bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-black text-slate-800">System Audit Logs</h2>
          <p className="text-sm text-slate-500 mt-1">
            Track user activity and system events. Detailed logs are kept for 7 days to conserve space, while aggregated statistics are kept indefinitely.
          </p>
        </div>
        <button
          onClick={() => activeTab === 'recent' ? fetchLogs(page) : fetchStats()}
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100 flex flex-col justify-center shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xs font-bold text-indigo-600 mb-2 uppercase tracking-widest">Today's Visits</h3>
            <p className="text-4xl font-black text-indigo-900">{summary.todaysVisits}</p>
          </div>
          <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100 flex flex-col justify-center shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Yesterday's Visits</h3>
            <p className="text-4xl font-black text-slate-700">{summary.yesterdaysVisits}</p>
          </div>
          <div className={`rounded-2xl p-6 border flex flex-col justify-center shadow-sm hover:shadow-md transition-shadow ${summary.growth >= 0 ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50/50 border-rose-100'}`}>
            <h3 className={`text-xs font-bold mb-2 uppercase tracking-widest ${summary.growth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>Growth VS Yesterday</h3>
            <div className={`flex items-center gap-2 text-4xl font-black ${summary.growth >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              <span className="text-3xl">{summary.growth >= 0 ? '↑' : '↓'}</span>
              {Math.abs(summary.growth)}%
            </div>
          </div>
          <div className="bg-fuchsia-50/50 rounded-2xl p-6 border border-fuchsia-100 flex flex-col justify-center shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xs font-bold text-fuchsia-600 mb-2 uppercase tracking-widest">Total Unique IPs</h3>
            <p className="text-4xl font-black text-fuchsia-900">{summary.totalUniqueIps}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-slate-500 mb-1">Filter by Feature/Action</label>
          <input 
            type="text" 
            placeholder="e.g. STUDENT_LOGIN" 
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-slate-500 mb-1">Time Range</label>
          <select 
            value={filterDays}
            onChange={(e) => setFilterDays(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">All Available</option>
            <option value="1">Last 24 Hours</option>
            <option value="3">Last 3 Days</option>
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days (Stats only)</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-200 pb-4">
        <button
          onClick={() => setActiveTab('recent')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'recent' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <List className="w-4 h-4" /> Recent Logs (Last 7 Days)
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'stats' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Activity className="w-4 h-4" /> Aggregated Stats
        </button>
      </div>

      {/* Content */}
      {loading && logs.length === 0 && stats.length === 0 ? (
        <div className="py-12 text-center text-slate-500 font-extrabold text-base">Loading data...</div>
      ) : activeTab === 'recent' ? (
        <div className="space-y-4">
          {groupedLogs.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm text-slate-500 font-extrabold text-base">
              🌐 No visitor activity recorded in this period.
            </div>
          ) : (
            groupedLogs.map((group) => {
              const isExpanded = expandedIps[group.ip];
              return (
                <div key={group.ip} className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden transition-all hover:border-purple-300">
                  {/* Expandable Header Card */}
                  <div 
                    onClick={() => setExpandedIps(prev => ({ ...prev, [group.ip]: !prev[group.ip] }))}
                    className="p-5 bg-gradient-to-r from-slate-50 via-purple-50/20 to-slate-50 hover:bg-slate-100/70 cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-4 select-none"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black shadow-md shrink-0">
                        <Globe className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-base sm:text-lg font-black text-slate-900 font-mono tracking-tight">{group.ip}</span>
                          <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 text-[11px] font-black rounded-full border border-purple-200 uppercase tracking-wider">
                            Unique Visitor IP
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-600 mt-1 flex items-center gap-2 flex-wrap">
                          <span className="text-slate-500">📧 Associated Email(s):</span>
                          {Array.from(group.emails).map((email, idx) => (
                            <span key={idx} className={`px-2 py-0.5 rounded text-[11px] font-extrabold ${email === 'Anonymous / Guest' ? 'bg-slate-200 text-slate-700' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'}`}>
                              {email}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action Count Badges */}
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap lg:justify-end">
                      <span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl font-black text-xs border border-indigo-100 shadow-sm">
                        ⚡ {group.actionsCount} Total Actions
                      </span>
                      {Object.entries(group.actionCounts).slice(0, 3).map(([act, count]) => (
                        <span key={act} className="px-2.5 py-1.5 bg-slate-100 text-slate-800 rounded-lg text-xs font-extrabold border border-slate-200">
                          {count}x {act}
                        </span>
                      ))}
                      <div className="p-2 bg-white rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-sm ml-auto lg:ml-0">
                        {isExpanded ? <ChevronUp className="w-5 h-5 stroke-[3]" /> : <ChevronDown className="w-5 h-5 stroke-[3]" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Activity Timeline */}
                  {isExpanded && (
                    <div className="p-5 sm:p-6 border-t-2 border-slate-100 bg-white">
                      <div className="text-xs font-black text-slate-500 uppercase tracking-wider mb-4 flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <span>Detailed Activity Timeline for IP: {group.ip}</span>
                        <span>Latest First ↓</span>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {group.logs.map((log) => (
                          <div key={log._id} className="py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 px-3 rounded-xl transition-colors">
                            <div className="flex items-start sm:items-center gap-3">
                              <span className={`px-2.5 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wide shrink-0 border bg-purple-50 text-purple-800 border-purple-200`}>
                                {log.action}
                              </span>
                              <div>
                                <div className="font-extrabold text-slate-900 text-sm">
                                  {log.userEmail || 'Anonymous'}
                                </div>
                                <div className="text-xs text-slate-500 font-semibold mt-0.5">
                                  {JSON.stringify(log.details)}
                                </div>
                              </div>
                            </div>
                            <div className="text-xs font-bold text-slate-400 shrink-0 flex flex-col items-end">
                              <span>{new Date(log.createdAt).toLocaleDateString()}</span>
                              <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6 text-sm font-bold text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-white rounded-lg disabled:opacity-50 border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
              >
                Previous
              </button>
              <span>Page {page} of {totalPages}</span>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-white rounded-lg disabled:opacity-50 border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
              >
                Next
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-sm text-slate-500">
                <th className="py-3 px-4 font-medium">Date</th>
                <th className="py-3 px-4 font-medium">Action</th>
                <th className="py-3 px-4 font-medium text-right">Count (All-time limit)</th>
              </tr>
            </thead>
            <tbody>
              {stats.length > 0 ? stats.map((stat) => (
                <tr key={stat._id} className="border-b border-slate-100 hover:bg-slate-50 text-sm text-slate-700">
                  <td className="py-3 px-4 whitespace-nowrap flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" /> {stat.date}
                  </td>
                  <td className="py-3 px-4">
                     <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                      {stat.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-medium">{stat.count}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="3" className="py-8 text-center text-slate-500">No stats found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AuditLogsAdmin;
