import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AlertTriangle, Trash2, X } from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5006";

export default function ConfirmDeleteModal({
  isOpen,
  team,
  onClose,
  onDeleted,
}) {
  const [deleting, setDeleting] = useState(false);
  const [reason, setReason] = useState("");

  if (!isOpen || !team) return null;

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
      const res = await axios.delete(
        `${BACKEND_URL}/api/hackathon/admin/teams/${team.teamId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { reason: reason || "Admin soft-deleted team via Teams workspace" },
        }
      );

      if (res.data?.success) {
        toast.success(`Team "${team.teamName}" soft-deleted successfully.`);
        onDeleted(team);
        onClose();
      }
    } catch (err) {
      console.error("Delete team error:", err);
      toast.error(err.response?.data?.message || "Failed to delete team.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <Trash2 className="w-6 h-6" />
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <h3 className="text-base font-black text-slate-900">Are you sure you want to delete this team?</h3>
          <p className="text-xs text-slate-500 mt-1">
            This will soft-delete the team record from active workspaces. All historical audit logs and data integrity will be preserved.
          </p>
        </div>

        {/* Team Details Badge */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">{team.teamName}</span>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
              {team.teamId}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Leader: <span className="font-semibold text-slate-700">{team.leader?.name || "—"}</span> ({team.leader?.email})
          </p>
          {team.track && (
            <p className="text-[11px] text-slate-400">
              Track: <span className="font-medium text-slate-600">{team.track}</span>
            </p>
          )}
        </div>

        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Notice:</span> Related submissions, review records, and participant queries for this team will be marked inactive.
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">Reason for Deletion (Optional)</label>
          <input
            type="text"
            placeholder="e.g. Duplicate registration, disqualification, test entry"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <Trash2 className={`w-3.5 h-3.5 ${deleting ? "animate-spin" : ""}`} />
            {deleting ? "Deleting Team..." : "Yes, Delete Team"}
          </button>
        </div>
      </div>
    </div>
  );
}
