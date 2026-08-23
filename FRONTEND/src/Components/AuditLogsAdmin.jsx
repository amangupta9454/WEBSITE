import React, { useState, useEffect } from 'react';
import { Activity, Calendar, Users, List, RefreshCw } from 'lucide-react';

const AuditLogsAdmin = () => {
  const [activeTab, setActiveTab] = useState('recent'); // 'recent' or 'stats'
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [filterAction, setFilterAction] = useState('');
  const [filterDays, setFilterDays] = useState('');
  
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
        <div className="py-12 text-center text-slate-500">Loading data...</div>
      ) : activeTab === 'recent' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-sm text-slate-500">
                <th className="py-3 px-4 font-medium">Timestamp</th>
                <th className="py-3 px-4 font-medium">Action</th>
                <th className="py-3 px-4 font-medium">User Email</th>
                <th className="py-3 px-4 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.length > 0 ? logs.map((log) => (
                <tr key={log._id} className="border-b border-slate-100 hover:bg-slate-50 text-sm text-slate-700">
                  <td className="py-3 px-4 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4">{log.userEmail || '-'}</td>
                  <td className="py-3 px-4 max-w-xs truncate" title={JSON.stringify(log.details)}>
                    {JSON.stringify(log.details)}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-slate-500">No recent logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4 text-sm text-slate-600">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 bg-slate-100 rounded-md disabled:opacity-50"
              >
                Previous
              </button>
              <span>Page {page} of {totalPages}</span>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 bg-slate-100 rounded-md disabled:opacity-50"
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
