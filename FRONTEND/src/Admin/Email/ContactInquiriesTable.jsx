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
  Filter, 
  Trash2, 
  Eye, 
  Calendar, 
  User, 
  X, 
  Save, 
  Send,
  Sparkles,
  Check
} from "lucide-react";
import toast from "react-hot-toast";

export default function ContactInquiriesTable() {
  const [inquiries, setInquiries] = useState([]);
  const [counts, setCounts] = useState({ total: 0, new: 0, contacted: 0, inProgress: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [editingNotes, setEditingNotes] = useState("");
  const [savingStatusId, setSavingStatusId] = useState(null);

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

  const handleUpdateStatus = async (inquiryId, newStatus, notes = null) => {
    setSavingStatusId(inquiryId);
    try {
      const token = localStorage.getItem("adminToken");
      const body = { status: newStatus };
      if (notes !== null) {
        body.adminNotes = notes;
      }

      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5006"}/api/contact/inquiries/${inquiryId}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || `Status updated to ${newStatus}`);
        setInquiries((prev) =>
          prev.map((item) => (item._id === inquiryId ? data.inquiry : item))
        );
        if (selectedInquiry && selectedInquiry._id === inquiryId) {
          setSelectedInquiry(data.inquiry);
        }
        // Update counts
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
    if (!window.confirm(`Are you sure you want to delete inquiry #${ticketId}?`)) return;

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
        if (selectedInquiry && selectedInquiry._id === inquiryId) {
          setSelectedInquiry(null);
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

  const openDetails = (inquiry) => {
    setSelectedInquiry(inquiry);
    setEditingNotes(inquiry.adminNotes || "");
  };

  const saveNotesOnly = async () => {
    if (!selectedInquiry) return;
    await handleUpdateStatus(selectedInquiry._id, selectedInquiry.status, editingNotes);
    toast.success("Notes saved!");
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
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">All Submissions</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{counts.total}</div>
        </div>

        <div 
          onClick={() => setStatusFilter("New")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "New" ? "bg-blue-50 border-blue-200 ring-2 ring-blue-500/20" : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">New Inquiries</span>
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
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-1">Contacted</span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600">{counts.contacted}</div>
        </div>

        <div 
          onClick={() => setStatusFilter("In Progress")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "In Progress" ? "bg-amber-50 border-amber-200 ring-2 ring-amber-500/20" : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block mb-1">In Progress</span>
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
              placeholder="Search name, email, phone, #ticket..."
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
            <h3 className="text-base font-bold text-slate-700">No contact inquiries found</h3>
            <p className="text-xs text-slate-400 mt-1">Submissions through the website contact form will appear here automatically.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Ticket</th>
                  <th className="py-3.5 px-4">Sender / Client</th>
                  <th className="py-3.5 px-4">Inquiry Type & Subject</th>
                  <th className="py-3.5 px-4">Date Submitted</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inquiries.map((inq) => {
                  const phoneDigits = cleanPhone(inq.phone);
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
                        <div className="flex items-center gap-1.5 text-slate-500 mt-0.5">
                          <Mail size={12} className="text-slate-400" />
                          <a href={`mailto:${inq.email}`} className="hover:text-blue-600 hover:underline">
                            {inq.email}
                          </a>
                        </div>
                        {inq.phone && (
                          <div className="flex items-center gap-1.5 text-slate-500 mt-0.5">
                            <Phone size={12} className="text-emerald-500" />
                            <a href={`tel:${phoneDigits}`} className="hover:text-emerald-600 hover:underline">
                              {inq.phone}
                            </a>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-bold text-[10px] uppercase mb-1">
                          {inq.issueType}
                        </span>
                        <div className="font-semibold text-slate-800 line-clamp-1">{inq.subject}</div>
                        <div className="text-slate-500 line-clamp-1 text-[11px] mt-0.5">{inq.description}</div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                        {new Date(inq.createdAt).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
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
                        {inq.status !== 'Contacted' && inq.status !== 'Resolved' && (
                          <button
                            onClick={() => handleUpdateStatus(inq._id, 'Contacted')}
                            disabled={savingStatusId === inq._id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg font-bold text-xs transition-colors cursor-pointer"
                            title="Mark as Contacted"
                          >
                            <Check size={13} />
                            <span>Mark Contacted</span>
                          </button>
                        )}

                        <button
                          onClick={() => openDetails(inq)}
                          className="p-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                          title="View Full Brief"
                        >
                          <Eye size={15} />
                        </button>

                        <button
                          onClick={() => handleDelete(inq._id, inq.ticketId)}
                          className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="Delete Submission"
                        >
                          <Trash2 size={15} />
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

      {/* Inquiry Detail & Action Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-indigo-600 uppercase bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                  Ticket #{selectedInquiry.ticketId}
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-2">
                  {selectedInquiry.subject}
                </h3>
                <span className="text-xs text-slate-400 font-medium">
                  Submitted on {new Date(selectedInquiry.createdAt).toLocaleString("en-IN")}
                </span>
              </div>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Sender Metadata Box */}
            <div className="grid sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 font-bold uppercase block mb-1">Client Name</span>
                <span className="text-sm font-bold text-slate-900">{selectedInquiry.name}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase block mb-1">Inquiry Type</span>
                <span className="text-sm font-bold text-indigo-600">{selectedInquiry.issueType}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase block mb-1">Email Address</span>
                <a href={`mailto:${selectedInquiry.email}`} className="text-sm font-bold text-blue-600 hover:underline">
                  {selectedInquiry.email}
                </a>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase block mb-1">Phone / WhatsApp</span>
                {selectedInquiry.phone ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{selectedInquiry.phone}</span>
                    <a 
                      href={`https://wa.me/${cleanPhone(selectedInquiry.phone)}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[11px] font-bold hover:bg-emerald-200"
                    >
                      WhatsApp
                    </a>
                  </div>
                ) : (
                  <span className="text-slate-400 italic">Not provided</span>
                )}
              </div>
            </div>

            {/* Brief Description Box */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Requirements / Message:</span>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-slate-800 text-sm font-medium whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                {selectedInquiry.description}
              </div>
            </div>

            {/* Admin Notes Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Internal Admin Notes:</span>
                <button
                  onClick={saveNotesOnly}
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                >
                  <Save size={13} />
                  <span>Save Notes</span>
                </button>
              </div>
              <textarea
                value={editingNotes}
                onChange={(e) => setEditingNotes(e.target.value)}
                placeholder="Add notes about call discussion, client requirement, or follow-up date..."
                rows={3}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status & Action Bar */}
            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Status:</span>
                <select
                  value={selectedInquiry.status}
                  onChange={(e) => handleUpdateStatus(selectedInquiry._id, e.target.value, editingNotes)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                >
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`mailto:${selectedInquiry.email}?subject=Re: [Code-A-Nova #${selectedInquiry.ticketId}] ${encodeURIComponent(selectedInquiry.subject)}`}
                  className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5"
                >
                  <Mail size={14} />
                  <span>Reply via Email</span>
                </a>

                {selectedInquiry.status !== 'Contacted' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedInquiry._id, 'Contacted', editingNotes)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <CheckCircle2 size={14} />
                    <span>Mark Contacted</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
