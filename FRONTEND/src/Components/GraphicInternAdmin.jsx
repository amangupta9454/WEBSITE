import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Trash2, 
  Send, 
  Sparkles, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  UserX, 
  Plus, 
  FileText, 
  ExternalLink,
  ChevronDown,
  Calendar,
  AlertCircle,
  Flame,
  Copy,
  Check,
  MessageSquare,
  Mail
} from "lucide-react";
import toast from "react-hot-toast";

const GraphicInternAdmin = ({ BACKEND_URL, authToken }) => {
  const [interns, setInterns] = useState([]);
  const [resources, setResources] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active tab inside Graphic Designer section: 'active' | 'notice' | 'resigned'
  const [activeLifecycleTab, setActiveLifecycleTab] = useState("active");

  // Track copied caption state for instant visual feedback
  const [copiedKey, setCopiedKey] = useState(null);

  // Manage top section view: 'tasks' | 'resources'
  const [topToolTab, setTopToolTab] = useState("tasks");

  // Task Form State
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskTarget, setTaskTarget] = useState("All");
  const [taskTargetUserId, setTaskTargetUserId] = useState("");
  const [taskDeadline, setTaskDeadline] = useState("");
  const [taskIsUrgent, setTaskIsUrgent] = useState(false);
  const [assigningTask, setAssigningTask] = useState(false);

  // Resource Form State
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceLink, setResourceLink] = useState("");
  const [resourceFile, setResourceFile] = useState(null);
  const [resourceTarget, setResourceTarget] = useState("All");
  const [resourceTargetUserId, setResourceTargetUserId] = useState("");
  const [resourceRequestId, setResourceRequestId] = useState("");
  const [resourceRequests, setResourceRequests] = useState([]);
  const [sharingResource, setSharingResource] = useState(false);

  // SP Grading Modal
  const [gradingModal, setGradingModal] = useState({
    isOpen: false,
    userId: null,
    internshipId: null,
    submissionId: null,
    currentPoints: ""
  });
  const [savingGrade, setSavingGrade] = useState(false);

  // Feedback & Changes Request Modal
  const [feedbackModal, setFeedbackModal] = useState({
    isOpen: false,
    userId: null,
    internshipId: null,
    submissionId: null,
    internName: "",
    internEmail: "",
    taskTitle: "",
    currentStatus: "Changes Requested",
    currentFeedback: "",
    currentPoints: "",
    sendEmail: true
  });
  const [savingFeedback, setSavingFeedback] = useState(false);

  useEffect(() => {
    fetchInterns();
    fetchResources();
    fetchTasks();
    fetchResourceRequests();
  }, []);

  const fetchInterns = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/graphic-interns`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setInterns(response.data.interns || []);
    } catch (err) {
      console.error("Error fetching graphic interns:", err);
      setError("Failed to fetch graphic interns");
    } finally {
      setLoading(false);
    }
  };

  const fetchResources = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/graphic-resources`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setResources(response.data.resources || []);
    } catch (err) {
      console.error("Error fetching graphic resources:", err);
    }
  };

  const fetchResourceRequests = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/graphic-resource-requests`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setResourceRequests(response.data.requests || []);
    } catch (err) {
      console.error("Error fetching graphic resource requests:", err);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/graphic-tasks`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setTasks(response.data.tasks || []);
    } catch (err) {
      console.error("Error fetching graphic tasks:", err);
    }
  };

  // Copy Caption with exact formatting, spacing, and line breaks
  const handleCopyCaption = (text, key, platform) => {
    if (!text) return;
    const fallbackCopy = () => {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
        toast.success(`${platform} copied with exact spacing & line breaks!`);
      } catch (err) {
        toast.error("Failed to copy caption");
      }
      textArea.remove();
    };

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text)
        .then(() => {
          setCopiedKey(key);
          setTimeout(() => setCopiedKey(null), 2000);
          toast.success(`${platform} copied with exact spacing & line breaks!`);
        })
        .catch(() => fallbackCopy());
    } else {
      fallbackCopy();
    }
  };

  // Assign Task
  const handleAssignTask = async (e) => {
    e.preventDefault();
    if (!taskTitle) return toast.error("Task title is required");

    setAssigningTask(true);
    const formData = new FormData();
    formData.append("title", taskTitle);
    formData.append("description", taskDescription);
    formData.append("target", taskTarget);
    formData.append("isUrgent", taskIsUrgent);
    if (taskTarget === "Specific") {
      formData.append("targetUserId", taskTargetUserId);
    }
    if (taskDeadline) {
      formData.append("deadline", taskDeadline);
    }

    try {
      await axios.post(`${BACKEND_URL}/api/admin/graphic-task`, formData, {
        headers: { 
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "multipart/form-data"
        }
      });
      toast.success(taskTarget === "All" ? "Task assigned to all Graphic Designers!" : "Task assigned to selected intern!");
      setTaskTitle("");
      setTaskDescription("");
      setTaskTarget("All");
      setTaskTargetUserId("");
      setTaskDeadline("");
      setTaskIsUrgent(false);
      fetchTasks();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to assign task");
    } finally {
      setAssigningTask(false);
    }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await axios.delete(`${BACKEND_URL}/api/admin/graphic-task/${id}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      toast.success("Task deleted successfully");
      fetchTasks();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete task");
    }
  };

  // Share Resource
  const handleShareResource = async (e) => {
    e.preventDefault();
    if (!resourceTitle) return toast.error("Resource title is required");
    
    setSharingResource(true);
    const formData = new FormData();
    formData.append("title", resourceTitle);
    formData.append("link", resourceLink);
    formData.append("target", resourceTarget);
    if (resourceTarget === "Specific") {
      formData.append("targetUserId", resourceTargetUserId);
    }
    if (resourceRequestId) {
      formData.append("requestId", resourceRequestId);
    }
    if (resourceFile) {
      formData.append("file", resourceFile);
    }

    try {
      await axios.post(`${BACKEND_URL}/api/admin/graphic-resource`, formData, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      toast.success(resourceRequestId ? "Resource shared & request fulfilled!" : "Resource shared successfully!");
      setResourceTitle("");
      setResourceLink("");
      setResourceFile(null);
      setResourceTarget("All");
      setResourceTargetUserId("");
      setResourceRequestId("");
      fetchResources();
      fetchResourceRequests();
    } catch (err) {
      console.error(err);
      toast.error("Failed to share resource");
    } finally {
      setSharingResource(false);
    }
  };

  const handleDeleteResource = async (id) => {
    if (!window.confirm("Are you sure you want to delete this resource?")) return;
    try {
      await axios.delete(`${BACKEND_URL}/api/admin/graphic-resource/${id}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      toast.success("Resource deleted successfully");
      fetchResources();
    } catch (err) {
      console.error("Error deleting resource:", err);
      toast.error("Failed to delete resource");
    }
  };

  const handleRejectResourceRequest = async (id) => {
    if (!window.confirm("Are you sure you want to decline this resource request?")) return;
    try {
      await axios.put(`${BACKEND_URL}/api/admin/graphic-resource-request/${id}`, 
        { status: 'Rejected' },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      toast.success("Request marked as declined");
      fetchResourceRequests();
    } catch (err) {
      console.error("Error updating resource request:", err);
      toast.error("Failed to update request");
    }
  };

  // Update Stipend
  const handleUpdateStipend = async (userId, internshipId, status, amount) => {
    try {
      await axios.post(
        `${BACKEND_URL}/api/admin/update-stipend`,
        { userId, internshipId, stipendStatus: status, stipendAmount: amount },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      fetchInterns();
      toast.success("Stipend updated successfully!");
    } catch (err) {
      console.error("Error updating stipend:", err);
      toast.error("Failed to update stipend");
    }
  };

  // Mark Resigned (Starts 15-day notice period)
  const handleMarkResigned = async (userId, internshipId, currentResignedStatus) => {
    if (currentResignedStatus) {
      toast.error("Intern is already marked as resigned.");
      return;
    }
    if (!window.confirm("Are you sure you want to mark this intern as resigned? A 15-day notice period will begin.")) return;

    try {
      const res = await axios.post(`${BACKEND_URL}/api/admin/internship-resignation`, 
        { userId, internshipId },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      if (res.data.success) {
        toast.success("Intern marked as resigned. 15-day notice period active.");
        fetchInterns();
      } else {
        toast.error(res.data.message || "Failed to mark resigned");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred marking intern resigned");
    }
  };

  // Reject Intern (Permanently hides intern from graphic designer views)
  const handleRejectInternship = async (userId, internshipId) => {
    if (!window.confirm("Are you sure you want to reject this internship application? A rejection email will be sent and this intern will no longer appear here.")) return;

    try {
      const res = await axios.post(`${BACKEND_URL}/api/admin/internship-reject`, 
        { userId, internshipId },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      if (res.data.success) {
        toast.success("Internship rejected successfully");
        fetchInterns();
      } else {
        toast.error(res.data.message || "Failed to reject application");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error rejecting internship");
    }
  };

  // Submit SP Grade
  const handleSaveSpPoints = async (e) => {
    e.preventDefault();
    const pointsNum = parseInt(gradingModal.currentPoints, 10);
    if (isNaN(pointsNum) || pointsNum < 0 || pointsNum > 10) {
      toast.error("Please enter a valid number of SP points between 0 and 10.");
      return;
    }

    setSavingGrade(true);
    try {
      await axios.post(
        `${BACKEND_URL}/api/admin/graphic-submission-status`,
        { 
          userId: gradingModal.userId, 
          internshipId: gradingModal.internshipId, 
          submissionId: gradingModal.submissionId, 
          status: 'Reviewed', 
          spPoints: pointsNum 
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      toast.success(`Awarded ${pointsNum}/10 SP points! Submission marked Reviewed.`);
      setGradingModal({ isOpen: false, userId: null, internshipId: null, submissionId: null, currentPoints: "" });
      fetchInterns();
    } catch (err) {
      console.error("Error updating submission status:", err);
      toast.error("Failed to update submission status");
    } finally {
      setSavingGrade(false);
    }
  };

  // Submit Feedback & Request Changes
  const handleSaveFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackModal.currentFeedback.trim()) {
      toast.error("Please enter feedback or required changes.");
      return;
    }
    setSavingFeedback(true);
    try {
      const res = await axios.post(
        `${BACKEND_URL}/api/admin/graphic-submission-status`,
        {
          userId: feedbackModal.userId,
          internshipId: feedbackModal.internshipId,
          submissionId: feedbackModal.submissionId,
          status: feedbackModal.currentStatus,
          spPoints: feedbackModal.currentPoints ? Number(feedbackModal.currentPoints) : null,
          feedback: feedbackModal.currentFeedback,
          sendEmail: feedbackModal.sendEmail
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        setFeedbackModal({ ...feedbackModal, isOpen: false });
        fetchInterns();
      } else {
        toast.error(res.data.message || "Failed to update feedback");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error saving feedback");
    } finally {
      setSavingFeedback(false);
    }
  };

  // Lifecycle Categorization Helper
  // Requirement: Exclude rejected completely ("reject ka show nhi hoga")
  const visibleInterns = interns.filter(i => !i.rejected?.isRejected);

  const getInternStatusInfo = (intern) => {
    const isResigned = intern.resigned?.isResigned;
    if (!isResigned) {
      return { category: "active", isNoticeActive: false, diffDays: 0, daysRemaining: 0 };
    }

    const resDate = new Date(intern.resigned.resignationDate || Date.now());
    const now = new Date();
    const diffDays = Math.floor(Math.abs(now - resDate) / (1000 * 60 * 60 * 24));
    const isNoticeActive = diffDays <= 15;
    const daysRemaining = Math.max(0, 15 - diffDays);
    const noticeEndDate = new Date(resDate);
    noticeEndDate.setDate(noticeEndDate.getDate() + 15);

    if (isNoticeActive) {
      return { category: "notice", isNoticeActive: true, diffDays, daysRemaining, noticeEndDate };
    } else {
      return { category: "resigned", isNoticeActive: false, diffDays, daysRemaining: 0, noticeEndDate };
    }
  };

  const activeInterns = visibleInterns.filter(i => getInternStatusInfo(i).category === "active");
  const noticeInterns = visibleInterns.filter(i => getInternStatusInfo(i).category === "notice");
  const resignedInterns = visibleInterns.filter(i => getInternStatusInfo(i).category === "resigned");

  const currentTabInterns = 
    activeLifecycleTab === "active" ? activeInterns :
    activeLifecycleTab === "notice" ? noticeInterns :
    resignedInterns;

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
      <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-3"></div>
      <p className="text-slate-600 font-medium text-sm">Loading Graphic Designers...</p>
    </div>
  );

  if (error) return (
    <div className="p-6 bg-red-50 text-red-700 rounded-2xl border border-red-200 text-center font-medium">
      {error}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-pink-50 via-purple-50 to-indigo-50 p-6 rounded-2xl border border-pink-100 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <span className="p-2 bg-pink-500 text-white rounded-xl shadow-sm">
              <Sparkles className="w-6 h-6" />
            </span>
            Graphic Designer Workspace
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Assign custom or global tasks, manage resources, review submissions with SP points, and monitor intern lifecycle.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTopToolTab(topToolTab === "tasks" ? "resources" : "tasks")}
            className="px-4 py-2 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold shadow-sm transition-all"
          >
            {topToolTab === "tasks" ? "Switch to Resources" : "Switch to Task Assignment"}
          </button>
        </div>
      </div>

      {/* Tools Section: Task Assignment & Resources */}
      {topToolTab === "tasks" ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4 border-b pb-3">
            <div>
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                Assign Tasks to Graphic Designers
              </h2>
              <p className="text-xs text-slate-500">
                Give individual tasks to specific designers or broadcast the same task to everyone at once.
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg">
              {tasks.length} Active Task{tasks.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Task Assignment Form */}
          <form onSubmit={handleAssignTask} className="bg-slate-50 p-5 rounded-xl border border-slate-200 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Task Title *
              </label>
              <input 
                type="text" 
                className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 font-medium" 
                value={taskTitle} 
                onChange={e => setTaskTitle(e.target.value)} 
                required 
                placeholder="e.g. Design 3 Promotional Instagram Carousel Slides" 
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Task Description
              </label>
              <textarea 
                rows="3"
                className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500" 
                value={taskDescription} 
                onChange={e => setTaskDescription(e.target.value)} 
                placeholder="Short instructions, guidelines, or topic notes..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Assign Target *
              </label>
              <select 
                className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white font-semibold text-slate-800" 
                value={taskTarget} 
                onChange={e => {
                  setTaskTarget(e.target.value);
                  if (e.target.value === "All") setTaskTargetUserId("");
                }}
              >
                <option value="All">📢 All Graphic Designers (Same Task to Everyone)</option>
                <option value="Specific">👤 Specific Graphic Designer (Different Individual Task)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Due Date / Deadline
              </label>
              <input 
                type="date" 
                className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white font-medium" 
                value={taskDeadline} 
                onChange={e => setTaskDeadline(e.target.value)} 
              />
            </div>

            <div className="md:col-span-2 flex items-center gap-3 p-3.5 bg-rose-50 border border-rose-200 rounded-xl">
              <input 
                type="checkbox"
                id="taskIsUrgent"
                checked={taskIsUrgent}
                onChange={e => setTaskIsUrgent(e.target.checked)}
                className="w-5 h-5 text-rose-600 rounded border-rose-300 focus:ring-rose-500 cursor-pointer"
              />
              <label htmlFor="taskIsUrgent" className="text-xs font-bold text-rose-900 flex items-center gap-2 cursor-pointer select-none">
                <Flame className="w-4 h-4 text-rose-600 animate-bounce" />
                <span>Mark as <strong>URGENT TASK</strong> ("🚨 Sb chodo phle isko kro" • Top Priority)</span>
              </label>
            </div>

            {taskTarget === "Specific" && (
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Select Specific Graphic Designer *
                </label>
                <select 
                  className="w-full border border-indigo-300 rounded-xl p-2.5 text-sm bg-white font-semibold text-indigo-900" 
                  value={taskTargetUserId} 
                  onChange={e => setTaskTargetUserId(e.target.value)} 
                  required={taskTarget === "Specific"}
                >
                  <option value="">-- Choose Graphic Designer --</option>
                  {visibleInterns.map(i => (
                    <option key={i.userId} value={i.userId}>
                      {i.name} ({i.studentId}) {i.resigned?.isResigned ? "• [On Notice]" : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="md:col-span-2 pt-2 flex justify-end">
              <button 
                type="submit" 
                disabled={assigningTask} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {assigningTask ? "Assigning Task..." : "Assign Task"}
              </button>
            </div>
          </form>

          {/* Assigned Tasks Table */}
          <div>
            <h3 className="font-bold text-slate-800 text-sm mb-3">Currently Assigned Tasks</h3>
            {tasks.length === 0 ? (
              <p className="text-slate-400 text-sm py-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No tasks assigned yet. Use the form above to assign work.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-slate-200 rounded-xl text-sm">
                  <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold tracking-wider">
                    <tr>
                      <th className="py-2.5 px-4 border-b text-left">Date</th>
                      <th className="py-2.5 px-4 border-b text-left">Task Title & Description</th>
                      <th className="py-2.5 px-4 border-b text-left">Assigned To</th>
                      <th className="py-2.5 px-4 border-b text-left">Due Date</th>
                      <th className="py-2.5 px-4 border-b text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tasks.map(t => (
                      <tr key={t._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                          {new Date(t.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800 flex items-center gap-2">
                            {t.isUrgent && (
                              <span className="bg-rose-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full shadow-sm animate-pulse inline-flex items-center gap-1">
                                <Flame className="w-3 h-3" /> URGENT
                              </span>
                            )}
                            {t.title}
                          </div>
                          {t.description && (
                            <p className="text-xs text-slate-500 mt-1 max-w-md line-clamp-2">{t.description}</p>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {t.target === "All" ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              📢 All Designers
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              👤 {t.targetUserName || "Specific Intern"} {t.targetStudentId ? `(${t.targetStudentId})` : ""}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs whitespace-nowrap">
                          {t.deadline ? (
                            <span className="font-bold text-slate-700 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {new Date(t.deadline).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-slate-400">No deadline</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button 
                            onClick={() => handleDeleteTask(t._id)} 
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Task"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Resources Management */
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4 border-b pb-3">
            <div>
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-pink-600" />
                Manage Graphic Resources & Assets
              </h2>
              <p className="text-xs text-slate-500">
                Share logos, fonts, templates, and general design assets.
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-pink-50 text-pink-700 border border-pink-100 rounded-lg">
              {resources.length} Resource{resources.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Incoming Intern Resource Requests */}
          {resourceRequests.length > 0 && (
            <div className="mb-6 bg-purple-50/70 border border-purple-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-purple-950 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  Incoming Intern Resource Requests
                  <span className="bg-purple-200 text-purple-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                    {resourceRequests.filter(r => r.status === 'Pending').length} Pending
                  </span>
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-purple-100 rounded-lg text-xs">
                  <thead className="bg-purple-100/50 text-purple-900 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2 px-3 text-left">Date</th>
                      <th className="py-2 px-3 text-left">Intern</th>
                      <th className="py-2 px-3 text-left">Requested Item & Notes</th>
                      <th className="py-2 px-3 text-left">Status</th>
                      <th className="py-2 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-100">
                    {resourceRequests.map(req => (
                      <tr key={req._id} className="hover:bg-purple-50/50">
                        <td className="py-2.5 px-3 whitespace-nowrap text-slate-500">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-800">{req.userName}</div>
                          {req.studentId && <div className="text-[10px] text-slate-400 font-mono">{req.studentId}</div>}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-purple-900">{req.title}</div>
                          {req.description && <div className="text-slate-500 mt-0.5">{req.description}</div>}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            req.status === 'Fulfilled' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : req.status === 'Rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {req.status === 'Fulfilled' ? '✅ Fulfilled' : req.status === 'Rejected' ? '❌ Declined' : '⏳ Pending'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap space-x-1.5">
                          {req.status === 'Pending' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setResourceTitle(req.title);
                                  setResourceTarget("Specific");
                                  setResourceTargetUserId(req.userId);
                                  setResourceRequestId(req._id);
                                  toast.success(`Fulfilling request for ${req.userName}. Add link/file below and click Share.`);
                                }}
                                className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-[11px] shadow-2xs transition-all cursor-pointer"
                              >
                                Fulfill Request
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectResourceRequest(req._id)}
                                className="px-2 py-1 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 rounded-lg font-medium text-[11px] transition-all cursor-pointer"
                              >
                                Decline
                              </button>
                            </>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {resourceRequestId && (
            <div className="bg-purple-100 border border-purple-300 text-purple-900 p-3 rounded-xl mb-4 flex items-center justify-between text-xs font-bold">
              <span>🎯 Fulfilling Request for Intern: "{resourceTitle}"</span>
              <button 
                type="button"
                onClick={() => {
                  setResourceRequestId("");
                  setResourceTitle("");
                  setResourceTarget("All");
                  setResourceTargetUserId("");
                }}
                className="text-purple-700 hover:text-purple-900 underline text-[11px] cursor-pointer"
              >
                Cancel Fulfillment
              </button>
            </div>
          )}

          <form onSubmit={handleShareResource} className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Resource Title *</label>
              <input type="text" className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white" value={resourceTitle} onChange={e => setResourceTitle(e.target.value)} required placeholder="e.g. Official Vector Logo & Brand Guide" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Resource Link</label>
              <input type="url" className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white" value={resourceLink} onChange={e => setResourceLink(e.target.value)} placeholder="e.g. Google Drive / Figma Link" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Upload File</label>
              <input type="file" className="w-full border border-slate-200 rounded-xl p-1.5 text-sm bg-white" onChange={e => setResourceFile(e.target.files[0])} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Target Intern</label>
              <select className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white font-semibold" value={resourceTarget} onChange={e => {
                setResourceTarget(e.target.value);
                if (e.target.value === "All") setResourceTargetUserId("");
              }}>
                <option value="All">All Graphic Designers</option>
                <option value="Specific">Specific Intern</option>
              </select>
            </div>
            {resourceTarget === "Specific" && (
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Select Specific Intern *</label>
                <select className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white font-semibold" value={resourceTargetUserId} onChange={e => setResourceTargetUserId(e.target.value)} required={resourceTarget === "Specific"}>
                  <option value="">-- Select Intern --</option>
                  {visibleInterns.map(i => <option key={i.userId} value={i.userId}>{i.name} ({i.studentId})</option>)}
                </select>
              </div>
            )}
            <div className="md:col-span-2 pt-2 flex justify-end">
              <button type="submit" disabled={sharingResource} className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all disabled:opacity-50">
                {sharingResource ? "Sharing..." : "Share Resource"}
              </button>
            </div>
          </form>

          <div>
            <h3 className="font-bold text-slate-800 text-sm mb-3">Shared Resources</h3>
            {resources.length === 0 ? <p className="text-slate-400 text-sm py-4 text-center bg-slate-50 rounded-xl">No resources shared yet.</p> : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border rounded-xl text-sm">
                  <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold">
                    <tr>
                      <th className="py-2.5 px-4 border-b text-left">Date</th>
                      <th className="py-2.5 px-4 border-b text-left">Title</th>
                      <th className="py-2.5 px-4 border-b text-left">Target</th>
                      <th className="py-2.5 px-4 border-b text-left">Link/File</th>
                      <th className="py-2.5 px-4 border-b text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resources.map(res => (
                      <tr key={res._id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 border-b text-xs text-slate-500">{new Date(res.createdAt).toLocaleDateString()}</td>
                        <td className="py-2.5 px-4 border-b font-medium text-slate-800">{res.title}</td>
                        <td className="py-2.5 px-4 border-b">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${res.target === 'All' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                            {res.target === 'All' ? 'All Designers' : 'Specific Intern'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 border-b text-xs space-y-1">
                          {res.link && <a href={res.link} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline block font-semibold">View Link</a>}
                          {res.fileUrl && <a href={res.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline block font-semibold">Download File</a>}
                        </td>
                        <td className="py-2.5 px-4 border-b text-center">
                          <button onClick={() => handleDeleteResource(res._id)} className="text-slate-400 hover:text-red-600 p-1 rounded"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3 Lifecycle Sections / Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-6">
          <div>
            <h2 className="text-xl font-black text-slate-800">
              Graphic Designer Submissions & Lifecycle
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review tasks, award SP points, and manage notice periods.
            </p>
          </div>

          {/* 3 Tabs */}
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl self-start sm:self-auto overflow-x-auto">
            <button
              onClick={() => setActiveLifecycleTab("active")}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap ${
                activeLifecycleTab === "active"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              Active Interns
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeLifecycleTab === "active" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"
              }`}>
                {activeInterns.length}
              </span>
            </button>

            <button
              onClick={() => setActiveLifecycleTab("notice")}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap ${
                activeLifecycleTab === "notice"
                  ? "bg-white text-amber-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              On Notice Period
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeLifecycleTab === "notice" ? "bg-amber-100 text-amber-800" : "bg-slate-200 text-slate-700"
              }`}>
                {noticeInterns.length}
              </span>
            </button>

            <button
              onClick={() => setActiveLifecycleTab("resigned")}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap ${
                activeLifecycleTab === "resigned"
                  ? "bg-white text-rose-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              Notice Period Over / Resigned
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeLifecycleTab === "resigned" ? "bg-rose-100 text-rose-800" : "bg-slate-200 text-slate-700"
              }`}>
                {resignedInterns.length}
              </span>
            </button>
          </div>
        </div>

        {/* Tab Content Display */}
        {currentTabInterns.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <UserX className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-bold text-sm">
              {activeLifecycleTab === "active" && "No active Graphic Designers found."}
              {activeLifecycleTab === "notice" && "No Graphic Designers currently on notice period."}
              {activeLifecycleTab === "resigned" && "No Graphic Designers with completed notice periods."}
            </p>
            <p className="text-slate-400 text-xs mt-1">
              {activeLifecycleTab === "notice" ? "Interns marked as resigned will appear here during their 15-day notice period." : ""}
              {activeLifecycleTab === "resigned" ? "Interns move here automatically once their 15-day notice period ends." : ""}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {currentTabInterns.map((intern) => {
              const statusInfo = getInternStatusInfo(intern);

              // Submissions sorted newest first (descending by submittedAt)
              const sortedSubmissions = [...(intern.graphicSubmissions || [])].sort(
                (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)
              );

              // Count unreviewed submissions (spPoints is null/undefined)
              const unreviewedSubmissions = sortedSubmissions.filter(
                s => s.spPoints === null || s.spPoints === undefined
              );
              const unreviewedCount = unreviewedSubmissions.length;

              return (
                <div 
                  key={intern.internshipId} 
                  className={`border rounded-2xl p-6 transition-all ${
                    unreviewedCount > 0 
                      ? "border-emerald-300 bg-emerald-50/20 shadow-sm" 
                      : "border-slate-200 bg-slate-50/50"
                  }`}
                >
                  {/* Notice Period Status Banner */}
                  {statusInfo.category === "notice" && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-xl mb-4 flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span>
                          <strong>15-Day Notice Period Active:</strong> Day {statusInfo.diffDays} of 15. 
                          Ends on {statusInfo.noticeEndDate ? statusInfo.noticeEndDate.toLocaleDateString() : 'N/A'}.
                        </span>
                      </div>
                      <span className="bg-amber-200 text-amber-900 px-2.5 py-0.5 rounded-full font-bold">
                        {statusInfo.daysRemaining} days left
                      </span>
                    </div>
                  )}

                  {statusInfo.category === "resigned" && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-2.5 rounded-xl mb-4 flex items-center gap-2 text-xs font-semibold">
                      <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      <span>
                        <strong>Notice Period Completed:</strong> This intern's 15-day notice period has elapsed. Internship is closed.
                      </span>
                    </div>
                  )}

                  {/* Header Row */}
                  <div className="flex flex-wrap justify-between items-start gap-4 mb-4 pb-4 border-b border-slate-200">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-black text-slate-800">{intern.name}</h3>
                        
                        {/* New Uploads Indicator Badge */}
                        {unreviewedCount > 0 && (
                          <span className="bg-emerald-500 text-white font-black text-xs px-2.5 py-1 rounded-full shadow-sm animate-pulse inline-flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" />
                            {unreviewedCount} NEW TASK{unreviewedCount > 1 ? 'S' : ''} UPLOADED
                          </span>
                        )}

                        {unreviewedCount === 0 && sortedSubmissions.length > 0 && (
                          <span className="bg-slate-200 text-slate-700 font-bold text-[11px] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            All Tasks Reviewed
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        <strong>ID:</strong> <span className="font-mono">{intern.studentId}</span> | <strong>Email:</strong> {intern.email} | <strong>Mobile:</strong> {intern.mobile || "N/A"}
                      </p>
                    </div>

                    {/* Action Controls */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Quick Assign Task */}
                      <button
                        onClick={() => {
                          setTopToolTab("tasks");
                          setTaskTarget("Specific");
                          setTaskTargetUserId(intern.userId);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                          toast(`Assigning task for ${intern.name}`, { icon: "📝" });
                        }}
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Assign Task
                      </button>

                      {/* Share Resource */}
                      <button 
                        onClick={() => {
                          setTopToolTab("resources");
                          setResourceTarget("Specific");
                          setResourceTargetUserId(intern.userId);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                          toast(`Sharing resource with ${intern.name}`, { icon: "📁" });
                        }}
                        className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Share Resource
                      </button>

                      {/* Stipend Controller */}
                      <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-600">Stipend:</label>
                        <select 
                          className="border border-slate-200 rounded-lg p-1 text-xs font-bold text-slate-800"
                          value={intern.stipendStatus || 'Unpaid'}
                          onChange={(e) => handleUpdateStipend(intern.userId, intern.internshipId, e.target.value, intern.stipendAmount)}
                        >
                          <option value="Unpaid">Unpaid</option>
                          <option value="Paid">Paid</option>
                        </select>

                        {intern.stipendStatus === 'Paid' && (
                          <input 
                            type="number" 
                            className="border border-slate-200 rounded-lg p-1 text-xs w-20 font-bold text-slate-800"
                            value={intern.stipendAmount || ''}
                            onChange={(e) => {
                              const updatedInterns = [...interns];
                              const idx = updatedInterns.findIndex(i => i.internshipId === intern.internshipId);
                              if (idx !== -1) {
                                updatedInterns[idx].stipendAmount = e.target.value;
                                setInterns(updatedInterns);
                              }
                            }}
                            onBlur={(e) => handleUpdateStipend(intern.userId, intern.internshipId, intern.stipendStatus, e.target.value)}
                            placeholder="₹ Amount"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Submissions Section (Sorted Newest First) */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-black text-slate-800 text-sm flex items-center gap-2">
                        Submitted Tasks
                        <span className="text-xs font-bold text-slate-500">
                          ({sortedSubmissions.length} total • ordered newest first)
                        </span>
                      </h4>
                    </div>

                    {sortedSubmissions.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-slate-200 rounded-xl">
                          <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold tracking-wider">
                            <tr>
                              <th className="py-2.5 px-4 border-b text-left">Date & Time</th>
                              <th className="py-2.5 px-4 border-b text-left">Task / Work Submitted</th>
                              <th className="py-2.5 px-4 border-b text-left">Captions</th>
                              <th className="py-2.5 px-4 border-b text-left">Review & SP Points</th>
                              <th className="py-2.5 px-4 border-b text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {sortedSubmissions.map((sub, idx) => {
                              const isUnreviewed = sub.spPoints === null || sub.spPoints === undefined;

                              return (
                                <tr 
                                  key={sub._id || idx} 
                                  className={`transition-colors ${isUnreviewed ? "bg-emerald-50/40 hover:bg-emerald-50/60" : "hover:bg-slate-50"}`}
                                >
                                  <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap align-top">
                                    <div className="font-semibold text-slate-700">
                                      {new Date(sub.submittedAt).toLocaleDateString()}
                                    </div>
                                    <div className="text-[11px] text-slate-400">
                                      {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    {/* Prominent NEW badge */}
                                    {isUnreviewed && (
                                      <div className="mt-1.5">
                                        <span className="bg-emerald-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full shadow-sm animate-pulse inline-flex items-center gap-1">
                                          ✨ NEW
                                        </span>
                                      </div>
                                    )}
                                  </td>

                                  <td className="py-3 px-4 text-xs align-top space-y-1.5">
                                    {sub.taskTitle && (
                                      <div className="font-bold text-indigo-700 text-xs bg-indigo-50 px-2 py-0.5 rounded inline-block border border-indigo-100">
                                        🎯 Task: {sub.taskTitle}
                                      </div>
                                    )}

                                    <div className="space-y-1">
                                      {sub.link && (
                                        <a href={sub.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-bold flex items-center gap-1">
                                          <ExternalLink className="w-3 h-3" /> View Work Link
                                        </a>
                                      )}
                                      {sub.fileUrl && (
                                        <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-bold flex items-center gap-1">
                                          <FileText className="w-3 h-3" /> View Attached File
                                        </a>
                                      )}
                                      {sub.fileUrls && sub.fileUrls.map((url, fIdx) => (
                                        <a key={fIdx} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-bold flex items-center gap-1">
                                          <FileText className="w-3 h-3" /> Attachment #{fIdx + 1}
                                        </a>
                                      ))}
                                      {!sub.link && !sub.fileUrl && (!sub.fileUrls || sub.fileUrls.length === 0) && (
                                        <span className="text-slate-400">No link/files attached</span>
                                      )}
                                    </div>
                                  </td>

                                  <td className="py-3 px-4 text-xs align-top min-w-[220px] max-w-sm space-y-2">
                                    {sub.linkedinCaption && (
                                      <div className="p-2.5 bg-white rounded-xl border border-blue-100 shadow-2xs hover:border-blue-300 transition-colors">
                                        <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-slate-100">
                                          <span className="font-bold text-blue-700 text-[11px] uppercase tracking-wider">
                                            LinkedIn Caption
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => handleCopyCaption(sub.linkedinCaption, `${sub._id || idx}-linkedin`, "LinkedIn Caption")}
                                            className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 active:scale-95 text-blue-700 border border-blue-200 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                                            title="Copy full caption with all line breaks and spaces"
                                          >
                                            {copiedKey === `${sub._id || idx}-linkedin` ? (
                                              <>
                                                <Check className="w-3 h-3 text-emerald-600" />
                                                <span className="text-emerald-700">Copied!</span>
                                              </>
                                            ) : (
                                              <>
                                                <Copy className="w-3 h-3 text-blue-600" />
                                                <span>Copy</span>
                                              </>
                                            )}
                                          </button>
                                        </div>
                                        <div className="text-slate-700 text-xs font-normal whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed select-all">
                                          {sub.linkedinCaption}
                                        </div>
                                      </div>
                                    )}

                                    {sub.instagramCaption && (
                                      <div className="p-2.5 bg-white rounded-xl border border-pink-100 shadow-2xs hover:border-pink-300 transition-colors">
                                        <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-slate-100">
                                          <span className="font-bold text-pink-700 text-[11px] uppercase tracking-wider">
                                            Instagram Caption
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => handleCopyCaption(sub.instagramCaption, `${sub._id || idx}-instagram`, "Instagram Caption")}
                                            className="px-2 py-0.5 bg-pink-50 hover:bg-pink-100 active:scale-95 text-pink-700 border border-pink-200 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                                            title="Copy full caption with all line breaks and spaces"
                                          >
                                            {copiedKey === `${sub._id || idx}-instagram` ? (
                                              <>
                                                <Check className="w-3 h-3 text-emerald-600" />
                                                <span className="text-emerald-700">Copied!</span>
                                              </>
                                            ) : (
                                              <>
                                                <Copy className="w-3 h-3 text-pink-600" />
                                                <span>Copy</span>
                                              </>
                                            )}
                                          </button>
                                        </div>
                                        <div className="text-slate-700 text-xs font-normal whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed select-all">
                                          {sub.instagramCaption}
                                        </div>
                                      </div>
                                    )}
                                  </td>

                                  <td className="py-3 px-4 text-xs align-top whitespace-nowrap">
                                    {sub.status === 'Changes Requested' ? (
                                      <div className="space-y-1">
                                        <span className="bg-rose-100 text-rose-800 border border-rose-200 font-bold px-2.5 py-1 rounded-full text-xs inline-flex items-center gap-1">
                                          <AlertTriangle className="w-3 h-3 text-rose-600" /> Changes Requested
                                        </span>
                                        {sub.spPoints !== undefined && sub.spPoints !== null && (
                                          <div className="font-bold text-slate-500 text-xs">
                                            ⭐ {sub.spPoints}/10 SP
                                          </div>
                                        )}
                                      </div>
                                    ) : isUnreviewed ? (
                                      <div className="space-y-1">
                                        <span className="bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-full text-xs inline-block">
                                          Pending Review
                                        </span>
                                        <div className="text-[11px] text-slate-400 font-medium">Needs SP points</div>
                                      </div>
                                    ) : (
                                      <div className="space-y-1">
                                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full text-xs inline-flex items-center gap-1">
                                          <CheckCircle className="w-3 h-3" /> Reviewed
                                        </span>
                                        <div className="font-black text-purple-700 text-xs mt-1">
                                          ⭐ {sub.spPoints}/10 SP Points
                                        </div>
                                      </div>
                                    )}

                                    {sub.feedback && (
                                      <div className="mt-2 p-2 bg-amber-50/90 border border-amber-200 rounded-lg text-left max-w-xs whitespace-normal">
                                        <div className="text-[10px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1 mb-0.5">
                                          <MessageSquare className="w-3 h-3 text-amber-700" /> Feedback / Changes:
                                        </div>
                                        <div className="text-slate-700 text-xs font-normal whitespace-pre-wrap line-clamp-3" title={sub.feedback}>
                                          {sub.feedback}
                                        </div>
                                      </div>
                                    )}
                                  </td>

                                  <td className="py-3 px-4 text-xs align-top text-center whitespace-nowrap space-y-1.5">
                                    <div>
                                      <button 
                                        onClick={() => setGradingModal({
                                          isOpen: true,
                                          userId: intern.userId,
                                          internshipId: intern.internshipId,
                                          submissionId: sub._id,
                                          currentPoints: sub.spPoints !== null && sub.spPoints !== undefined ? String(sub.spPoints) : ""
                                        })}
                                        className={`w-full px-3 py-1.5 rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer ${
                                          isUnreviewed 
                                            ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                                            : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                        }`}
                                      >
                                        {isUnreviewed ? "Grade (0-10 SP)" : "Edit SP Points"}
                                      </button>
                                    </div>

                                    <div>
                                      <button
                                        onClick={() => setFeedbackModal({
                                          isOpen: true,
                                          userId: intern.userId,
                                          internshipId: intern.internshipId,
                                          submissionId: sub._id,
                                          internName: intern.name,
                                          internEmail: intern.email,
                                          taskTitle: sub.taskTitle || "Graphic Submission",
                                          currentStatus: sub.status === 'Reviewed' ? 'Reviewed' : 'Changes Requested',
                                          currentFeedback: sub.feedback || "",
                                          currentPoints: sub.spPoints !== null && sub.spPoints !== undefined ? String(sub.spPoints) : "",
                                          sendEmail: true
                                        })}
                                        className="w-full px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                                        title="Suggest changes or give feedback with optional email to this designer"
                                      >
                                        <MessageSquare className="w-3 h-3 text-indigo-600" />
                                        <span>{sub.feedback ? "Edit Feedback" : "Request Changes"}</span>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 py-3 text-center bg-white rounded-xl border border-dashed border-slate-200">
                        No work submitted by this intern yet.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SP Grading Modal */}
      {gradingModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 transform transition-all">
            <h3 className="text-xl font-black text-slate-800 mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Award SP Points
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Assign synergy points (0 to 10) for this submission. Once awarded, the "NEW" badge will be cleared.
            </p>

            <form onSubmit={handleSaveSpPoints} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  SP Points (Out of 10) *
                </label>
                <div className="flex items-center gap-3">
                  <input 
                    type="number"
                    min="0"
                    max="10"
                    step="1"
                    autoFocus
                    required
                    className="w-full border-2 border-indigo-200 focus:border-indigo-600 rounded-2xl p-3 text-center text-2xl font-black text-indigo-900 bg-indigo-50/30"
                    placeholder="e.g. 8"
                    value={gradingModal.currentPoints}
                    onChange={(e) => setGradingModal({ ...gradingModal, currentPoints: e.target.value })}
                  />
                  <span className="text-lg font-black text-slate-400">/ 10</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setGradingModal({ isOpen: false, userId: null, internshipId: null, submissionId: null, currentPoints: "" })}
                  className="flex-1 py-3 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingGrade}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md transition-all disabled:opacity-50"
                >
                  {savingGrade ? "Saving..." : "Save & Mark Reviewed"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feedback & Art Changes Modal */}
      {feedbackModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-indigo-600" />
                  Design Feedback & Changes
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Task: <span className="font-bold text-slate-700">{feedbackModal.taskTitle}</span>
                </p>
                <p className="text-xs text-indigo-600 font-semibold mt-0.5">
                  Intern: {feedbackModal.internName} ({feedbackModal.internEmail})
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveFeedback} className="space-y-4">
              {/* Status Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Review Decision *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFeedbackModal({ ...feedbackModal, currentStatus: "Changes Requested" })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      feedbackModal.currentStatus === "Changes Requested"
                        ? "bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-200"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    Changes Requested
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedbackModal({ ...feedbackModal, currentStatus: "Reviewed" })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      feedbackModal.currentStatus === "Reviewed"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-200"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    Reviewed / Approved
                  </button>
                </div>
              </div>

              {/* Feedback / Changes Required */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Feedback / Specific Changes Needed *
                </label>
                <textarea
                  rows="4"
                  required
                  value={feedbackModal.currentFeedback}
                  onChange={(e) => setFeedbackModal({ ...feedbackModal, currentFeedback: e.target.value })}
                  placeholder="E.g., Font size badhao, logo high-res use karo, alignment left karo, background color thoda light rakho..."
                  className="w-full border border-slate-300 rounded-xl p-3 text-xs text-slate-800 font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Optional SP Points */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Award Synergy Points (0-10, Optional)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="1"
                  value={feedbackModal.currentPoints}
                  onChange={(e) => setFeedbackModal({ ...feedbackModal, currentPoints: e.target.value })}
                  placeholder="Points out of 10 (Leave blank if grading later)"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Email Option Checkbox */}
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={feedbackModal.sendEmail}
                    onChange={(e) => setFeedbackModal({ ...feedbackModal, sendEmail: e.target.checked })}
                    className="w-4 h-4 mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-indigo-600" />
                      Send Email Notification to this Graphic Designer
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Email will be sent to: <span className="font-mono font-medium text-slate-700">{feedbackModal.internEmail}</span>
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setFeedbackModal({ ...feedbackModal, isOpen: false })}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingFeedback}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {savingFeedback ? "Saving & Sending..." : "Save Feedback & Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GraphicInternAdmin;
