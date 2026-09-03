import React, { useState, useEffect } from "react";
import { BarChart3, ListFilter, ShieldCheck, CheckCircle2, AlertCircle, MessageSquareQuote } from "lucide-react";
import EmailDashboard from "./EmailDashboard";
import EmailLogsTable from "./EmailLogsTable";
import ContactInquiriesTable from "./ContactInquiriesTable";

export default function EmailCenter() {
  const [activeTab, setActiveTab] = useState("contact-forms"); // "contact-forms" | "dashboard" | "logs"
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [resendingId, setResendingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5006"}/api/email/logs/analytics`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (data.success) {
        setAnalytics(data);
      }
    } catch (err) {
      console.error("Failed to load Email Center analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const showToast = (msg, isError = false) => {
    setToastMessage({ msg, isError });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleResendEmail = async (logId) => {
    setResendingId(logId);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5006"}/api/email/resend/${logId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (data.success) {
        showToast("✔ Email successfully resent via Hostinger SMTP & logged as new record!");
        fetchAnalytics(); // refresh totals
        return { success: true, messageId: data.messageId };
      } else {
        showToast(`❌ Resend failed: ${data.message || data.error || "SMTP error"}`, true);
        return { success: false, error: data.message };
      }
    } catch (err) {
      console.error("Error executing resend:", err);
      showToast("❌ Network or server exception during resend attempt.", true);
      return { success: false, error: err.message };
    } finally {
      setResendingId(null);
    }
  };

  const navigateToLogsWithFilter = (status) => {
    setStatusFilter(status || "ALL");
    setActiveTab("logs");
  };

  return (
    <div className="w-full space-y-6">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className={`fixed top-24 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-xl font-black text-sm flex items-center gap-2.5 animate-slide-in-right ${toastMessage.isError ? "bg-rose-600 text-white" : "bg-emerald-600 text-white"}`}>
          {toastMessage.isError ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* Sub-Module Tab Navigation Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center bg-slate-100/80 rounded-xl p-1 gap-1 flex-wrap">
          <button
            onClick={() => setActiveTab("contact-forms")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-black transition-all cursor-pointer ${activeTab === "contact-forms" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
          >
            <MessageSquareQuote className="w-4 h-4 text-blue-600" /> Contact Inquiries / Forms
          </button>
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-black transition-all cursor-pointer ${activeTab === "dashboard" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
          >
            <BarChart3 className="w-4 h-4 text-indigo-600" /> Email Dashboard & KPIs
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-black transition-all cursor-pointer ${activeTab === "logs" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
          >
            <ListFilter className="w-4 h-4 text-emerald-600" /> Historical Audit Logs
          </button>
        </div>

        <div className="px-4 py-2 flex items-center gap-2 text-xs font-bold text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Admin Command Center • Instant Submissions Sync</span>
        </div>
      </div>

      {/* Render selected module tab */}
      {activeTab === "contact-forms" && (
        <ContactInquiriesTable />
      )}

      {activeTab === "dashboard" && (
        <EmailDashboard
          analytics={analytics}
          loading={loading}
          onNavigateToLogs={navigateToLogsWithFilter}
        />
      )}

      {activeTab === "logs" && (
        <EmailLogsTable
          initialStatusFilter={statusFilter}
          onResendEmail={handleResendEmail}
          resendingId={resendingId}
        />
      )}
    </div>
  );
}
