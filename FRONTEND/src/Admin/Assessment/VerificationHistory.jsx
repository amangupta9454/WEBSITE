import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  History, Download, Search, Filter, CheckCircle2, 
  AlertOctagon, Clock, Loader2, Building2, FileSpreadsheet, FileText, ChevronLeft, ChevronRight 
} from "lucide-react";

const VerificationHistory = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`/api/admin/assessment/recruiter/history?page=${page}&limit=20&status=${statusFilter}&method=${methodFilter}&search=${encodeURIComponent(searchTerm)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data && res.data.success) {
        setLogs(res.data.logs || []);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to load verification audit history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page, statusFilter, methodFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchHistory();
  };

  const triggerExport = async (format) => {
    try {
      setExporting(true);
      setExportMenuOpen(false);
      const token = localStorage.getItem("token");
      const url = `/api/admin/assessment/recruiter/export?format=${format}&limit=500`;

      if (format === "csv") {
        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob"
        });
        const downloadUrl = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.setAttribute("download", `CodeANova_Verification_Audit_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data, null, 2));
        const link = document.createElement("a");
        link.href = jsonStr;
        link.setAttribute("download", `CodeANova_Verification_Audit_${Date.now()}.${format === "excel" ? "xlsx.json" : "json"}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to compile audit report export.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Header & Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            Immutable Verification Audit Stream & Export Center
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict read-only repository tracking every third-party employer verification, QR scanning event, and candidate credential lookup. Records can never be edited or deleted.
          </p>
        </div>

        {/* Export Dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => setExportMenuOpen(!exportMenuOpen)}
            disabled={exporting}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export Verification Report
          </button>

          {exportMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-fade-in">
              <div className="text-[10px] font-black uppercase text-slate-400 px-3 py-1">Select Report Format</div>
              <button 
                onClick={() => triggerExport("csv")}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
              >
                <FileText className="w-4 h-4 text-emerald-600" /> Export as Comma-Separated (CSV)
              </button>
              <button 
                onClick={() => triggerExport("excel")}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-blue-600" /> Export Excel Workbook Structure
              </button>
              <button 
                onClick={() => triggerExport("pdf")}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-indigo-600 hover:bg-indigo-50 border-t border-slate-100 flex items-center gap-2.5 transition-colors"
              >
                <Download className="w-4 h-4" /> Export Printable PDF Audit Report
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
        <form onSubmit={handleSearchSubmit} className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Filter by Certificate ID, Verifier, or Company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-900 transition-colors">
            Search
          </button>
        </form>

        <div className="flex gap-2 shrink-0">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="Verified">Verified Authentic</option>
            <option value="Revoked">Revoked</option>
            <option value="Unknown">Unknown / Failed</option>
          </select>
          <select
            value={methodFilter}
            onChange={(e) => { setMethodFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Methods</option>
            <option value="CERTIFICATE_ID">By Certificate ID</option>
            <option value="PUBLIC_URL">By Public Web Gateway</option>
            <option value="QR_CODE">By Scanned QR</option>
            <option value="CANDIDATE_SEARCH">By Candidate Lookup</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
            <p className="text-xs font-semibold">Retrieving immutable verification audit records...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Audit Event ID</th>
                    <th className="py-3.5 px-4">Target Credential</th>
                    <th className="py-3.5 px-4">Verifier Entity</th>
                    <th className="py-3.5 px-4">Verification Method</th>
                    <th className="py-3.5 px-4 text-center">Outcome Status</th>
                    <th className="py-3.5 px-4">Timestamp</th>
                    <th className="py-3.5 px-4">Client IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {logs.length > 0 ? (
                    logs.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">{item.verificationId}</td>
                        <td className="py-3 px-4 font-mono font-black text-indigo-600 bg-indigo-50/30">{item.certificateId}</td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{item.verifiedBy || "External Verifier"}</span>
                          <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-slate-300" /> {item.companyName || "Public Employer"}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-600">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                            {item.verificationMethod || "CERTIFICATE_ID"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {item.verificationStatus === "Verified" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-black border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Verified
                            </span>
                          ) : item.verificationStatus === "Revoked" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-black border border-rose-200">
                              <AlertOctagon className="w-3 h-3 text-rose-500" /> Revoked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold border border-slate-300">
                              {item.verificationStatus || "Unknown"}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-semibold whitespace-nowrap">
                          {item.timestamp ? new Date(item.timestamp).toLocaleString() : "Just now"}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-400">{item.ipAddress || "0.0.0.0"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-semibold">
                        No verification audit records found matching current query boundaries.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                <span className="text-xs text-slate-500 font-semibold">Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 disabled:opacity-40 shadow-2xs"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-700" />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 disabled:opacity-40 shadow-2xs"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-700" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default VerificationHistory;
