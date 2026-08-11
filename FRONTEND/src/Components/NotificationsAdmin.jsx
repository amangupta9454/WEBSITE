import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Loader2, Plus, Trash2, Bell } from "lucide-react";

const NotificationsAdmin = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ message: "", audience: "All" });

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/notifications`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(res.data);
    } catch (error) {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.message) return toast.error("Message is required");
    try {
      setAdding(true);
      const token = localStorage.getItem("adminToken");
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/notifications`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Notification created");
      setForm({ message: "", audience: "All" });
      fetchNotifications();
    } catch (error) {
      toast.error("Failed to create notification");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this notification?")) return;
    try {
      const token = localStorage.getItem("adminToken");
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/notifications/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Notification deleted");
      fetchNotifications();
    } catch (error) {
      toast.error("Failed to delete notification");
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-600" /> Create Notification
        </h2>
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
            <input
              type="text"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Enter notification message..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Target Audience</label>
            <select
              value={form.audience}
              onChange={(e) => setForm({ ...form, audience: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="All">All Interns</option>
              <option value="Normal Intern">Normal Interns Only</option>
              <option value="Summer/Winter Intern">Summer/Winter Interns Only</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={adding}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Broadcast Notification
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          Active Notifications
        </h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : notifications.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No active notifications</p>
        ) : (
          <div className="space-y-4">
            {notifications.map((n) => (
              <div key={n._id} className="border border-slate-200 rounded-xl p-4 flex justify-between items-start gap-4">
                <div>
                  <p className="font-medium text-slate-800">{n.message}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Audience: <span className="font-semibold">{n.audience}</span> • Created: {new Date(n.createdAt).toLocaleDateString('en-GB')}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(n._id)}
                  className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors shrink-0"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsAdmin;
