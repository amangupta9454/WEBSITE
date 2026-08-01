import React, { useState, useEffect } from "react";
import { X, Mail, CheckCircle2, XCircle, Clock, FileText, Download, Copy, Check, Send, Code, Monitor } from "lucide-react";

export default function ViewEmailModal({ log, isOpen, onClose, onResend, resendingId }) {
  const [activeTab, setActiveTab] = useState("preview"); // "preview" | "raw" | "text"
  const [copied, setCopied] = useState(false);
  const [fullLog, setFullLog] = useState(null);
  const [loadingContent, setLoadingContent] = useState(false);

  useEffect(() => {
    if (!isOpen || !log?._id) {
      setFullLog(null);
      return;
    }
    // If the passed log already has complete html (not stripped by list projection), use directly
    if (log.html !== undefined && log.html !== null) {
      setFullLog(log);
      return;
    }

    const fetchFullLog = async () => {
      setLoadingContent(true);
      try {
        const token = localStorage.getItem("adminToken");
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/email/logs/${log._id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        if (data.success && data.log) {
          setFullLog(data.log);
        } else {
          setFullLog(log);
        }
      } catch (err) {
        console.error("Error fetching full email log content:", err);
        setFullLog(log);
      } finally {
        setLoadingContent(false);
      }
    };

    fetchFullLog();
  }, [isOpen, log?._id]);

  if (!isOpen || !log) return null;

  const displayLog = fullLog || log;
  const isSuccess = displayLog.status === "SUCCESS";
  const isFailed = displayLog.status === "FAILED";
  const isResending = resendingId === displayLog._id;

  const handleCopyRaw = () => {
    navigator.clipboard.writeText(displayLog.html || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatFileSize = (bytes = 0) => {
    if (!bytes || bytes === 0) return "Lightweight";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleDownloadAttachment = (att) => {
    if (att.url) {
      window.open(att.url, "_blank");
      return;
    }
    if (att.content) {
      const blob = new Blob([att.content], { type: att.mimeType || "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = att.filename || "attachment";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      alert("Attachment binary payload is archived in cloud object storage.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-up">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold ${isSuccess ? "bg-emerald-100 text-emerald-700" : isFailed ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>
              {isSuccess ? <CheckCircle2 className="w-6 h-6" /> : isFailed ? <XCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 line-clamp-1">{displayLog.subject || "No Subject"}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wide bg-indigo-100 text-indigo-800 border border-indigo-200/50 flex-shrink-0">
                  {displayLog.campaign || "General"}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1.5">
                Sent on <span className="font-bold text-slate-700">{new Date(displayLog.createdAt).toLocaleString()}</span> • Source: <span className="font-bold text-slate-700">{displayLog.source || "Backend API"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onResend(displayLog._id)}
              disabled={isResending}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${isResending ? "bg-indigo-300 text-white cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-md hover:shadow-indigo-100"}`}
            >
              <Send className={`w-3.5 h-3.5 ${isResending ? "animate-spin" : ""}`} />
              {isResending ? "Resending..." : "Resend Email"}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Close viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/30">
          
          {/* Metadata Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recipient</span>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-bold text-slate-800">{displayLog.recipientName || displayLog.recipientEmail}</span>
                {displayLog.recipientName && <span className="text-xs text-slate-400 font-medium">({displayLog.recipientEmail})</span>}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status & SMTP Response</span>
              <div className="flex items-center gap-2 font-bold">
                <span className={`px-2 py-0.5 rounded text-xs font-black ${isSuccess ? "bg-emerald-100 text-emerald-800" : isFailed ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"}`}>
                  {displayLog.status}
                </span>
                <span className="text-slate-600 text-xs font-mono truncate max-w-xs">{displayLog.smtpResponse || "N/A"}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Message ID</span>
              <p className="font-mono text-xs font-medium text-slate-700 truncate bg-white py-1 px-2.5 rounded border border-slate-200">
                {displayLog.messageId || "None generated (Transmission halted)"}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Accepted / Rejected Nodes</span>
              <div className="flex items-center gap-2 text-xs font-medium">
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                  Acc: {displayLog.accepted?.length || (isSuccess ? 1 : 0)}
                </span>
                <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-bold">
                  Rej: {displayLog.rejected?.length || (isFailed ? 1 : 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Attachments Section */}
          {displayLog.attachments && displayLog.attachments.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h4 className="text-xs font-black uppercase text-slate-500 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" /> Attached Artifacts ({displayLog.attachments.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {displayLog.attachments.map((att, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-indigo-200 bg-slate-50/50 transition-all group">
                    <div className="flex items-center gap-3 truncate">
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs uppercase">
                        {att.filename?.split('.').pop() || 'FILE'}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-800 truncate">{att.filename}</p>
                        <p className="text-[11px] text-slate-400 font-medium">{formatFileSize(att.size)} • {att.mimeType}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadAttachment(att)}
                      className="p-2 rounded-lg bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 transition-colors shadow-sm"
                      title="Download or Preview Attachment"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tabs Switcher for Email Content Viewer */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab("preview")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "preview" ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                >
                  <Monitor className="w-4 h-4" /> Live HTML Preview (Exact Gmail Render)
                </button>
                <button
                  onClick={() => setActiveTab("raw")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "raw" ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                >
                  <Code className="w-4 h-4" /> Raw HTML Tab
                </button>
                {displayLog.text && (
                  <button
                    onClick={() => setActiveTab("text")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "text" ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                  >
                    <FileText className="w-4 h-4" /> Plain Text Fallback
                  </button>
                )}
              </div>

              {activeTab === "raw" && (
                <button
                  onClick={handleCopyRaw}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied!" : "Copy HTML"}
                </button>
              )}
            </div>

            {loadingContent ? (
              <div className="w-full h-[350px] rounded-2xl border border-slate-200 bg-white flex flex-col items-center justify-center gap-3 shadow-inner">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-bold text-slate-500 tracking-wide uppercase">Fetching complete HTML payload from database...</p>
              </div>
            ) : (
              <>
                {/* Tab 1: Live HTML Iframe Previewer */}
                {activeTab === "preview" && (
                  <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-inner relative">
                    <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-500">
                      <span>Rendering complete unmodified HTML payload in isolated sandbox</span>
                      <span className="text-emerald-700 font-bold flex items-center gap-1">✔ CSS & Styles Preserved</span>
                    </div>
                    <iframe
                      srcDoc={displayLog.html || "<p style='padding: 20px; color: #888;'>No HTML template stored for this email transmission.</p>"}
                      sandbox="allow-same-origin allow-popups"
                      className="w-full h-[520px] bg-white border-none transition-opacity duration-300"
                      title="Email Preview"
                    />
                  </div>
                )}

                {/* Tab 2: Raw HTML Developer Tab */}
                {activeTab === "raw" && (
                  <div className="rounded-2xl border border-slate-800 bg-slate-900 text-indigo-200 p-4 font-mono text-xs overflow-auto max-h-[520px] shadow-inner selection:bg-indigo-700 selection:text-white">
                    <pre className="whitespace-pre-wrap word-break">{displayLog.html || "// Empty HTML payload"}</pre>
                  </div>
                )}

                {/* Tab 3: Plain Text */}
                {activeTab === "text" && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 text-slate-800 p-5 font-mono text-sm overflow-auto max-h-[520px] shadow-inner whitespace-pre-wrap">
                    {displayLog.text || "No plain text fallback generated."}
                  </div>
                )}
              </>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Enterprise Single Source of Truth • MongoDB Log ID: {displayLog._id}</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-sm transition-all"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
}
