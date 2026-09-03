import React, { useState, useEffect } from "react";
import { 
  Inbox, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  Phone, 
  Mail, 
  MessageSquare, 
  Trash2, 
  Eye, 
  User, 
  X, 
  Send,
  Sparkles,
  Check,
  RotateCw,
  MessageCircle,
  ChevronDown,
  ArrowUpRight,
  ShieldCheck,
  Calendar
} from "lucide-react";
import toast from "react-hot-toast";

const QUICK_TEMPLATES = [
  {
    label: "Acknowledge & Schedule Call",
    subject: "Following Up on Your Inquiry with Code-A-Nova",
    body: `Hi {name},

Thank you for reaching out to Code-A-Nova regarding {subject}.

We have reviewed your inquiry and would love to schedule a quick 15-minute discovery call to discuss your requirements in detail.

Could you let us know your availability over the next couple of days? Alternatively, feel free to reply directly to this email or message us on WhatsApp.

Looking forward to connecting!

Best regards,
Code-A-Nova Solutions Team`
  },
  {
    label: "Request Project Scope Details",
    subject: "Project Requirements Clarification — Code-A-Nova",
    body: `Hi {name},

Thanks for submitting your project brief regarding {subject}.

To help us prepare an accurate timeline and technical proposal, could you provide a few more details:
1. Do you have existing wireframes, reference links, or design preferences?
2. Are there specific third-party integrations required (e.g. payment gateway, CRM, custom APIs)?
3. What is your ideal launch timeline?

Once we have these details, we'll share a tailored roadmap and milestone estimate.

Best regards,
Code-A-Nova Engineering Team`
  },
  {
    label: "Internship & Academic Guidance",
    subject: "Regarding Your Student / Internship Inquiry — Code-A-Nova",
    body: `Hi {name},

Thank you for your inquiry regarding our student internship ecosystem and learning programs.

Our internship registrations are completely free. If you have already applied, our academic mentors review submissions on a rolling basis. You can also view your active assessment modules directly by logging into your student dashboard.

If you have a specific query regarding your domain or batch, please reply directly to this email and our mentorship desk will assist you promptly.

Warm regards,
Code-A-Nova Student Support`
  },
  {
    label: "Issue Resolved",
    subject: "Update Regarding Ticket #{ticketId} — Code-A-Nova",
    body: `Hi {name},

We are following up to confirm that your inquiry regarding {subject} (Ticket #{ticketId}) has been addressed.

If you need any further assistance, feel free to reply directly to this thread anytime.

Best regards,
Code-A-Nova Support Desk`
  }
];

export default function ContactInquiriesTable() {
  const [inquiries, setInquiries] = useState([]);
  const [counts, setCounts] = useState({ total: 0, new: 0, contacted: 0, inProgress: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Active Thread Modal
  const [activeInquiry, setActiveInquiry] = useState(null);
  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSyncingImap, setIsSyncingImap] = useState(false);
  const [savingStatusId, setSavingStatusId] = useState(null);

  // Offline log note toggle
  const [showLogNote, setShowLogNote] = useState(false);
  const [logNoteBody, setLogNoteBody] = useState("");
  const [logChannel, setLogChannel] = useState("whatsapp");

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const url = new URL(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5006"}/api/contact/inquiries`);
      if (statusFilter !== "ALL") {
        url.searchParams.append("status", statusFilter);
      }
      if (searchQuery.trim()) {
        url.searchParams.append("search", searchQuery.trim());
      }

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();
      if (data.success) {
        setInquiries(data.inquiries || []);
        if (data.counts) {
          setCounts(data.counts);
        }
        // If an inquiry is currently open in modal, update it in place
        if (activeInquiry) {
          const updated = (data.inquiries || []).find(i => i._id === activeInquiry._id);
          if (updated) setActiveInquiry(updated);
        }
      } else {
        toast.error(data.message || "Failed to load inquiries");
      }
    } catch (err) {
      console.error("Error fetching inquiries:", err);
      toast.error("Network error while loading contact inquiries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchInquiries();
  };

  const handleOpenThread = (inquiry) => {
    setActiveInquiry(inquiry);
    setReplySubject(`Re: [Code-A-Nova #${inquiry.ticketId}] ${inquiry.subject}`);
    setReplyBody("");
    setShowLogNote(false);
  };

  const handleApplyTemplate = (tpl) => {
    if (!activeInquiry) return;
    const filledSubject = tpl.subject
      .replace("{name}", activeInquiry.name)
      .replace("{subject}", activeInquiry.subject)
      .replace("{ticketId}", activeInquiry.ticketId);
    const filledBody = tpl.body
      .replace("{name}", activeInquiry.name)
      .replace("{subject}", activeInquiry.subject)
      .replace("{ticketId}", activeInquiry.ticketId);

    setReplySubject(filledSubject);
    setReplyBody(filledBody);
  };

  const handleSendEmailReply = async () => {
    if (!activeInquiry || !replyBody.trim()) {
      toast.error("Please enter a reply message before sending.");
      return;
    }

    setIsSendingEmail(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5006"}/api/contact/inquiries/${activeInquiry._id}/reply`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: replySubject.trim(),
          body: replyBody.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Email reply sent successfully!");
        setActiveInquiry(data.inquiry);
        setReplyBody("");
        // Refresh inquiries list to reflect status update
        fetchInquiries();
      } else {
        toast.error(data.message || "Failed to send email");
      }
    } catch (err) {
      console.error("Send error:", err);
      toast.error("Network exception while sending email.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSyncIncomingEmails = async () => {
    if (!activeInquiry) return;
    setIsSyncingImap(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5006"}/api/contact/inquiries/${activeInquiry._id}/sync`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        if (data.inquiry) {
          setActiveInquiry(data.inquiry);
        }
        fetchInquiries();
      } else {
        toast.error(data.message || "Sync check completed");
      }
    } catch (err) {
      console.error("Sync error:", err);
      toast.error("Could not sync incoming mail via IMAP.");
    } finally {
      setIsSyncingImap(false);
    }
  };

  const handleSaveLogNote = async () => {
    if (!activeInquiry || !logNoteBody.trim()) {
      toast.error("Please enter note details.");
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5006"}/api/contact/inquiries/${activeInquiry._id}/log-message`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: "client",
          body: `[${logChannel.toUpperCase()} Conversation Log]\n${logNoteBody.trim()}`,
          channel: logChannel,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Offline conversation logged to thread!");
        setActiveInquiry(data.inquiry);
        setLogNoteBody("");
        setShowLogNote(false);
        fetchInquiries();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to log offline note.");
    }
  };

  const handleUpdateStatus = async (inquiryId, newStatus) => {
    setSavingStatusId(inquiryId);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5006"}/api/contact/inquiries/${inquiryId}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Inquiry marked as ${newStatus}`);
        setInquiries((prev) =>
          prev.map((item) => (item._id === inquiryId ? data.inquiry : item))
        );
        if (activeInquiry && activeInquiry._id === inquiryId) {
          setActiveInquiry(data.inquiry);
        }
        fetchInquiries();
      } else {
        toast.error(data.message || "Failed to update status");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    } finally {
      setSavingStatusId(null);
    }
  };

  const handleDelete = async (inquiryId, ticketId) => {
    if (!window.confirm(`Delete contact inquiry #${ticketId}?`)) return;

    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5006"}/api/contact/inquiries/${inquiryId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Inquiry #${ticketId} deleted.`);
        setInquiries((prev) => prev.filter((item) => item._id !== inquiryId));
        if (activeInquiry && activeInquiry._id === inquiryId) {
          setActiveInquiry(null);
        }
        fetchInquiries();
      } else {
        toast.error(data.message || "Delete failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete inquiry.");
    }
  };

  const cleanPhone = (phoneStr) => {
    if (!phoneStr) return null;
    return phoneStr.replace(/[^0-9]/g, "");
  };

  return (
    <div className="space-y-6">
      {/* Top Stat Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div 
          onClick={() => setStatusFilter("ALL")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "ALL" ? "bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500/20" : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Contact Submissions</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{counts.total}</div>
        </div>

        <div 
          onClick={() => setStatusFilter("New")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "New" ? "bg-blue-50 border-blue-200 ring-2 ring-blue-500/20" : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">New (Unanswered)</span>
            {counts.new > 0 && <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-600">{counts.new}</div>
        </div>

        <div 
          onClick={() => setStatusFilter("Contacted")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "Contacted" ? "bg-emerald-50 border-emerald-200 ring-2 ring-emerald-500/20" : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-1">Contacted / Replied</span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600">{counts.contacted}</div>
        </div>

        <div 
          onClick={() => setStatusFilter("In Progress")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "In Progress" ? "bg-amber-50 border-amber-200 ring-2 ring-amber-500/20" : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block mb-1">In Discussion</span>
          <div className="text-2xl sm:text-3xl font-black text-amber-600">{counts.inProgress}</div>
        </div>

        <div 
          onClick={() => setStatusFilter("Resolved")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "Resolved" ? "bg-purple-50 border-purple-200 ring-2 ring-purple-500/20" : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <span className="text-xs font-bold text-purple-600 uppercase tracking-wider block mb-1">Resolved</span>
          <div className="text-2xl sm:text-3xl font-black text-purple-600">{counts.resolved}</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
          {["ALL", "New", "Contacted", "In Progress", "Resolved"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === st 
                  ? "bg-slate-900 text-white shadow-sm" 
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search Bar & Refresh */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contact lead..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </form>

          <button
            onClick={fetchInquiries}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
            title="Refresh Inquiries"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Inquiries Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 font-medium">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-600" />
            Loading contact submissions...
          </div>
        ) : inquiries.length === 0 ? (
          <div className="py-20 text-center">
            <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">No contact leads found</h3>
            <p className="text-xs text-slate-400 mt-1">Only users who submit through the Contact Us form appear in this direct desk.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Ticket</th>
                  <th className="py-3.5 px-4">Contact Lead</th>
                  <th className="py-3.5 px-4">Subject & Scope</th>
                  <th className="py-3.5 px-4">Thread History</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Direct Messaging</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inquiries.map((inq) => {
                  const phoneDigits = cleanPhone(inq.phone);
                  const msgCount = inq.messages?.length || 1;
                  const hasAdminReplied = inq.messages?.some(m => m.sender === 'admin');

                  return (
                    <tr 
                      key={inq._id} 
                      className={`hover:bg-slate-50/80 transition-colors ${inq.status === 'New' ? 'bg-blue-50/30' : ''}`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 whitespace-nowrap">
                        #{inq.ticketId}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">{inq.name}</div>
                        <div className="text-slate-500 font-medium text-xs mt-0.5">{inq.email}</div>
                        {inq.phone && (
                          <div className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-1">
                            <Phone size={11} className="text-emerald-500" />
                            <span>{inq.phone}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-bold text-[10px] uppercase mb-1">
                          {inq.issueType}
                        </span>
                        <div className="font-semibold text-slate-800 line-clamp-1">{inq.subject}</div>
                        <div className="text-slate-400 text-[11px] mt-0.5">
                          {new Date(inq.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenThread(inq)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          <MessageSquare size={13} className="text-indigo-500" />
                          <span>{msgCount} message{msgCount > 1 ? 's' : ''}</span>
                          {hasAdminReplied && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Replied by Admin" />}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <select
                          value={inq.status}
                          disabled={savingStatusId === inq._id}
                          onChange={(e) => handleUpdateStatus(inq._id, e.target.value)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer ${
                            inq.status === 'New' 
                              ? 'bg-blue-50 text-blue-700 border-blue-200' 
                              : inq.status === 'Contacted' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : inq.status === 'In Progress' 
                              ? 'bg-amber-50 text-amber-700 border-amber-200' 
                              : 'bg-purple-50 text-purple-700 border-purple-200'
                          }`}
                        >
                          <option value="New">New</option>
                          <option value="Contacted">Contacted</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                        <button
                          onClick={() => handleOpenThread(inq)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
                        >
                          <Mail size={13} />
                          <span>Send / View Email</span>
                        </button>

                        <button
                          onClick={() => handleDelete(inq._id, inq.ticketId)}
                          className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dedicated Email & Conversation Thread Modal */}
      {activeInquiry && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            
            {/* Modal Top Header */}
            <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50/80 flex items-start justify-between gap-4 shrink-0">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-lg">
                    Ticket #{activeInquiry.ticketId}
                  </span>
                  <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-2.5 py-0.5 rounded-lg uppercase">
                    {activeInquiry.issueType}
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-lg border ${
                    activeInquiry.status === 'Contacted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {activeInquiry.status}
                  </span>
                </div>

                <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                  {activeInquiry.subject}
                </h2>

                <div className="flex items-center gap-4 text-xs text-slate-500 font-medium mt-1 flex-wrap">
                  <span className="flex items-center gap-1 text-slate-900 font-bold">
                    <User size={13} className="text-indigo-600" /> {activeInquiry.name}
                  </span>
                  <span className="flex items-center gap-1 text-blue-600 font-bold">
                    <Mail size={13} /> {activeInquiry.email}
                  </span>
                  {activeInquiry.phone && (
                    <span className="flex items-center gap-1 text-emerald-600 font-bold">
                      <Phone size={13} /> {activeInquiry.phone}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSyncIncomingEmails}
                  disabled={isSyncingImap}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer"
                  title="Check Hostinger IMAP for incoming client replies"
                >
                  <RotateCw size={13} className={isSyncingImap ? "animate-spin text-indigo-600" : ""} />
                  <span className="hidden sm:inline">Sync Inbox</span>
                </button>

                <button
                  onClick={() => setActiveInquiry(null)}
                  className="p-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 rounded-full transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Middle Section: Scrollable Conversation Timeline */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-4 bg-slate-50/40">
              <div className="text-center">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
                  Direct Conversation Timeline with {activeInquiry.name}
                </span>
              </div>

              {/* Messages Thread */}
              {(activeInquiry.messages && activeInquiry.messages.length > 0) ? (
                activeInquiry.messages.map((msg, idx) => {
                  const isAdmin = msg.sender === 'admin';
                  return (
                    <div 
                      key={idx}
                      className={`flex flex-col ${isAdmin ? "items-end" : "items-start"} max-w-2xl ${isAdmin ? "ml-auto" : "mr-auto"}`}
                    >
                      <div className="flex items-center gap-2 mb-1 px-1">
                        <span className="text-[11px] font-bold text-slate-500">
                          {isAdmin ? "Admin (You)" : activeInquiry.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(msg.sentAt).toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          isAdmin 
                            ? "bg-indigo-100 text-indigo-700" 
                            : msg.source === 'imap_sync' 
                            ? "bg-purple-100 text-purple-700" 
                            : msg.source === 'manual_log' 
                            ? "bg-amber-100 text-amber-700" 
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {isAdmin ? "Sent via Email" : msg.source === 'imap_sync' ? "Received (Email)" : msg.source === 'manual_log' ? "Logged Note" : "Contact Form"}
                        </span>
                      </div>

                      <div className={`p-4 sm:p-5 rounded-2xl border text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                        isAdmin 
                          ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/10 rounded-tr-none" 
                          : "bg-white text-slate-800 border-slate-200 shadow-sm rounded-tl-none"
                      }`}>
                        {msg.subject && msg.subject !== activeInquiry.subject && (
                          <div className={`font-bold pb-2 mb-2 border-b text-xs ${isAdmin ? "border-indigo-400/50 text-indigo-100" : "border-slate-100 text-slate-900"}`}>
                            {msg.subject}
                          </div>
                        )}
                        {msg.body}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                  <div className="font-bold text-slate-900 mb-2">Original Inquiry:</div>
                  {activeInquiry.description}
                </div>
              )}
            </div>

            {/* Bottom Section: Direct Compose & Send Email Reply */}
            <div className="p-5 sm:p-6 border-t border-slate-200 bg-white shrink-0 space-y-4">
              
              {/* Quick Template Selector & Channel Actions */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Templates:</span>
                  {QUICK_TEMPLATES.map((tpl, tIdx) => (
                    <button
                      key={tIdx}
                      type="button"
                      onClick={() => handleApplyTemplate(tpl)}
                      className="text-[11px] font-bold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  {activeInquiry.phone && (
                    <a
                      href={`https://wa.me/${cleanPhone(activeInquiry.phone)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-lg border border-emerald-200 transition-colors flex items-center gap-1"
                    >
                      <MessageCircle size={13} />
                      <span>WhatsApp Client</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowLogNote(!showLogNote)}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 px-3 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    {showLogNote ? "Cancel Log Note" : "+ Log Call / WhatsApp Note"}
                  </button>
                </div>
              </div>

              {/* Log Offline Note Box if open */}
              {showLogNote && (
                <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-800">
                    <span>Log Offline Conversation with Client (Phone / WhatsApp):</span>
                    <select
                      value={logChannel}
                      onChange={(e) => setLogChannel(e.target.value)}
                      className="px-2 py-0.5 bg-white border border-amber-300 rounded text-xs"
                    >
                      <option value="whatsapp">WhatsApp</option>
                      <option value="phone">Phone Call</option>
                      <option value="meeting">Video Meeting</option>
                    </select>
                  </div>
                  <textarea
                    rows={2}
                    value={logNoteBody}
                    onChange={(e) => setLogNoteBody(e.target.value)}
                    placeholder="Enter discussion notes or client reply text..."
                    className="w-full p-2.5 bg-white border border-amber-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveLogNote}
                      className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
                    >
                      Save to Timeline
                    </button>
                  </div>
                </div>
              )}

              {/* Send Email Box */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase w-14">To:</span>
                  <input
                    type="text"
                    disabled
                    value={activeInquiry.email}
                    className="flex-1 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-not-allowed"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase w-14">Subject:</span>
                  <input
                    type="text"
                    value={replySubject}
                    onChange={(e) => setReplySubject(e.target.value)}
                    placeholder="Subject line..."
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="relative">
                  <textarea
                    rows={4}
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    placeholder={`Type your reply to ${activeInquiry.name} here...`}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">Status:</span>
                    <select
                      value={activeInquiry.status}
                      onChange={(e) => handleUpdateStatus(activeInquiry._id, e.target.value)}
                      className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                    >
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleSendEmailReply}
                    disabled={isSendingEmail || !replyBody.trim()}
                    className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md cursor-pointer ${
                      isSendingEmail || !replyBody.trim()
                        ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20"
                    }`}
                  >
                    {isSendingEmail ? (
                      <>
                        <RefreshCw size={15} className="animate-spin" />
                        <span>Sending Email via SMTP...</span>
                      </>
                    ) : (
                      <>
                        <Send size={15} />
                        <span>Send Email to {activeInquiry.name}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}
