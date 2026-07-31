import React, { useState, useEffect } from "react";
import { Search, Filter, RefreshCw, Send, Eye, CheckCircle2, XCircle, Clock, ChevronLeft, ChevronRight, FileText, Mail } from "lucide-react";
import ViewEmailModal from "./ViewEmailModal";

const CAMPAIGN_OPTIONS = [
  "All",
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
  "Verification",
  "General",
];

const SOURCE_OPTIONS = ["All", "Backend API", "Google Apps Script", "Admin Resend"];
const STATUS_OPTIONS = ["ALL", "SUCCESS", "FAILED", "PENDING"];

export default function EmailLogsTable({ initialStatusFilter, onResendEmail, resendingId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filter & Search states
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(initialStatusFilter || "ALL");
  const [campaign, setCampaign] = useState("All");
  const [source, setSource] = useState("All");

  // Modal inspection state
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(status && status !== "ALL" && { status }),
        ...(campaign && campaign !== "All" && { campaign }),
        ...(source && source !== "All" && { source }),
      });

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/email/logs?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (data.success) {
        setLogs(data.logs || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } else {
        console.error("Failed to fetch email logs:", data.message);
      }
    } catch (err) {
      console.error("Error calling email logs API:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialStatusFilter && initialStatusFilter !== "ALL") {
      setStatus(initialStatusFilter);
    }
  }, [initialStatusFilter]);

  useEffect(() => {
    // Debounce search input to prevent hammering server
    const handler = setTimeout(() => {
      setPage(1);
      fetchLogs();
    }, 400);
    return () => clearTimeout(handler);
  }, [search, status, campaign, source, limit]);

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const handleResendClick = async (id) => {
    if (onResendEmail) {
      const res = await onResendEmail(id);
      if (res && res.success) {
        fetchLogs(); // Automatically refresh list to show newly generated log entry
      }
    }
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case "SUCCESS":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black tracking-wide bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
            <CheckCircle2 className="w-3.5 h-3.5" /> Success
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black tracking-wide bg-rose-100 text-rose-800 border border-rose-200 uppercase animate-pulse">
            <XCircle className="w-3.5 h-3.5" /> Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black tracking-wide bg-amber-100 text-amber-800 border border-amber-200 uppercase">
            <Clock className="w-3.5 h-3.5" /> Pending
          </span>
        );
    }
  };

  const getCampaignColor = (camp) => {
    const c = camp?.toLowerCase() || "";
    if (c.includes("offer") || c.includes("internship")) return "bg-blue-100 text-blue-800 border-blue-200";
    if (c.includes("certificate") || c.includes("completion")) return "bg-amber-100 text-amber-800 border-amber-200";
    if (c.includes("interview") || c.includes("ai")) return "bg-purple-100 text-purple-800 border-purple-200";
    if (c.includes("quiz") || c.includes("test")) return "bg-teal-100 text-teal-800 border-teal-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      
      {/* Top Filter and Search Action Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Instant Search Bar */}
          <div className="relative flex-1 max-w-lg">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Recipient Name, Email, Subject, Campaign or Message ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all bg-slate-50/50"
            />
          </div>

          {/* Refresh & Pagination info */}
          <div className="flex items-center gap-3 justify-end">
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all disabled:opacity-50"
              title="Refresh Logs Table"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Dropdown Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-400 mr-2">
            <Filter className="w-3.5 h-3.5" /> Filters:
          </div>

          {/* Status filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-600 cursor-pointer hover:bg-slate-50 transition-colors"
          >
            {STATUS_OPTIONS.map((st) => (
              <option key={st} value={st}>Status: {st === "ALL" ? "All Statuses" : st}</option>
            ))}
          </select>

          {/* Campaign filter */}
          <select
            value={campaign}
            onChange={(e) => setCampaign(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-600 cursor-pointer hover:bg-slate-50 transition-colors"
          >
            {CAMPAIGN_OPTIONS.map((c) => (
              <option key={c} value={c}>Campaign: {c}</option>
            ))}
          </select>

          {/* Source filter */}
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-600 cursor-pointer hover:bg-slate-50 transition-colors"
          >
            {SOURCE_OPTIONS.map((s) => (
              <option key={s} value={s}>Source: {s}</option>
            ))}
          </select>

          {(search || status !== "ALL" || campaign !== "All" || source !== "All") && (
            <button
              onClick={() => {
                setSearch("");
                setStatus("ALL");
                setCampaign("All");
                setSource("All");
              }}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline ml-auto"
            >
              Reset All Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Enterprise Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-5">Recipient Details</th>
                <th className="py-4 px-4">Campaign & Source</th>
                <th className="py-4 px-4">Subject</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4">Message ID</th>
                <th className="py-4 px-4">Sent Timestamp</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-slate-400 font-medium animate-pulse">
                    Retrieving email historical records from MongoDB...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-slate-400 font-medium">
                    <Mail className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                    No email logs found matching your search and filter criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isResendingThis = resendingId === log._id;
                  return (
                    <tr key={log._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Recipient */}
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-800 leading-tight">
                          {log.recipientName || "Valued Student"}
                        </div>
                        <div className="text-xs text-indigo-600 font-semibold hover:underline">
                          {log.recipientEmail}
                        </div>
                      </td>

                      {/* Campaign Badge */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-tight border ${getCampaignColor(log.campaign)}`}>
                          {log.campaign || "General"}
                        </span>
                        <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                          {log.source}
                        </div>
                      </td>

                      {/* Subject */}
                      <td className="py-3.5 px-4 font-semibold text-slate-700 max-w-xs truncate" title={log.subject}>
                        <div className="truncate flex items-center gap-1.5">
                          {log.attachments && log.attachments.length > 0 && (
                            <FileText className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" title="Contains attachments" />
                          )}
                          <span className="truncate">{log.subject}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(log.status)}
                      </td>

                      {/* Message ID */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200/60 block max-w-[120px] truncate" title={log.messageId || "None"}>
                          {log.messageId || "None"}
                        </span>
                      </td>

                      {/* Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs font-bold text-slate-600">
                        <div>{new Date(log.createdAt).toLocaleDateString()}</div>
                        <div className="text-[11px] text-slate-400 font-normal">{new Date(log.createdAt).toLocaleTimeString()}</div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => handleResendClick(log._id)}
                            disabled={isResendingThis}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all disabled:opacity-50"
                            title="Resend email via SMTP Gateway (Creates a new log entry)"
                          >
                            <Send className={`w-3.5 h-3.5 text-indigo-600 ${isResendingThis ? "animate-spin" : ""}`} />
                            <span>{isResendingThis ? "Resending..." : "Resend"}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Server-side Pagination Controls */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-bold text-slate-600">
          <div>
            Showing <span className="text-slate-900 font-black">{logs.length > 0 ? (page - 1) * limit + 1 : 0}</span> to{" "}
            <span className="text-slate-900 font-black">{Math.min(page * limit, total)}</span> of{" "}
            <span className="text-indigo-600 font-black text-sm">{total}</span> automated email logs
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-400">Rows per page:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-bold focus:outline-none"
            >
              <option value={15}>15</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>

            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 bg-white rounded-lg border border-slate-200 text-slate-800">
                Page <span className="font-black">{page}</span> of <span className="font-black">{totalPages}</span>
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* View Email Drawer / Modal */}
      <ViewEmailModal
        log={selectedLog}
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        onResend={handleResendClick}
        resendingId={resendingId}
      />
    </div>
  );
}
