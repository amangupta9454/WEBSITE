import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  X,
  Plus,
  Trash2,
  Save,
  Users,
  Lightbulb,
  Globe,
  FileText,
  User,
  Building2,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5006";

export default function TeamFormModal({
  isOpen,
  mode = "create", // "create" or "edit"
  team = null,
  tracks = [],
  onClose,
  onSuccess,
}) {
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    teamName: "",
    track: "General Track",
    leader: {
      name: "",
      email: "",
      mobile: "",
      college: "",
      state: "",
    },
    members: [],
    initialIdea: {
      title: "",
      description: "",
      problemStatement: "",
      proposedSolution: "",
      techStackString: "",
      pptUrl: "",
      theme: "",
    },
    submittedLinks: {
      githubUrl: "",
      hostedProjectUrl: "",
      linkedInUrl: "",
      demoVideoUrl: "",
    },
  });

  useEffect(() => {
    if (!isOpen) return;

    if (mode === "edit" && team) {
      setFormData({
        teamName: team.teamName || "",
        track: team.track || (tracks[0]?.name || "General Track"),
        leader: {
          name: team.leader?.name || "",
          email: team.leader?.email || "",
          mobile: team.leader?.mobile || "",
          college: team.leader?.college || "",
          state: team.leader?.state || "",
        },
        members: (team.members || []).map((m) => ({
          name: m.name || "",
          email: m.email || "",
          mobile: m.mobile || "",
          college: m.college || "",
          state: m.state || "",
          role: m.role || "Team Member",
        })),
        initialIdea: {
          title: team.initialIdea?.title || "",
          description: team.initialIdea?.description || "",
          problemStatement: team.initialIdea?.problemStatement || "",
          proposedSolution: team.initialIdea?.proposedSolution || "",
          techStackString: (team.initialIdea?.techStack || []).join(", "),
          pptUrl: team.initialIdea?.pptUrl || "",
          theme: team.initialIdea?.theme || "",
        },
        submittedLinks: {
          githubUrl: team.submittedLinks?.githubUrl || "",
          hostedProjectUrl: team.submittedLinks?.hostedProjectUrl || "",
          linkedInUrl: team.submittedLinks?.linkedInUrl || "",
          demoVideoUrl: team.submittedLinks?.demoVideoUrl || "",
        },
      });
    } else {
      // Reset for Create
      setFormData({
        teamName: "",
        track: tracks[0]?.name || "General Track",
        leader: {
          name: "",
          email: "",
          mobile: "",
          college: "",
          state: "",
        },
        members: [],
        initialIdea: {
          title: "",
          description: "",
          problemStatement: "",
          proposedSolution: "",
          techStackString: "",
          pptUrl: "",
          theme: "",
        },
        submittedLinks: {
          githubUrl: "",
          hostedProjectUrl: "",
          linkedInUrl: "",
          demoVideoUrl: "",
        },
      });
    }
  }, [isOpen, mode, team, tracks]);

  const handleLeaderChange = (field, val) => {
    setFormData((prev) => ({
      ...prev,
      leader: { ...prev.leader, [field]: val },
    }));
  };

  const handleIdeaChange = (field, val) => {
    setFormData((prev) => ({
      ...prev,
      initialIdea: { ...prev.initialIdea, [field]: val },
    }));
  };

  const handleLinkChange = (field, val) => {
    setFormData((prev) => ({
      ...prev,
      submittedLinks: { ...prev.submittedLinks, [field]: val },
    }));
  };

  const handleAddMember = () => {
    setFormData((prev) => ({
      ...prev,
      members: [
        ...prev.members,
        { name: "", email: "", mobile: "", college: "", state: "", role: "Team Member" },
      ],
    }));
  };

  const handleMemberChange = (index, field, val) => {
    setFormData((prev) => {
      const updated = [...prev.members];
      updated[index] = { ...updated[index], [field]: val };
      return { ...prev, members: updated };
    });
  };

  const handleRemoveMember = (index) => {
    setFormData((prev) => ({
      ...prev,
      members: prev.members.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.teamName.trim()) {
      return toast.warning("Team Name is required.");
    }
    if (!formData.leader.name.trim() || !formData.leader.email.trim()) {
      return toast.warning("Leader Name and Email are required.");
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("adminToken") || localStorage.getItem("token");

      const techStack = formData.initialIdea.techStackString
        ? formData.initialIdea.techStackString
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      const payload = {
        teamName: formData.teamName.trim(),
        track: formData.track,
        leader: {
          name: formData.leader.name.trim(),
          email: formData.leader.email.trim().toLowerCase(),
          mobile: formData.leader.mobile.trim(),
          college: formData.leader.college.trim(),
          state: formData.leader.state.trim(),
        },
        members: formData.members.map((m) => ({
          name: m.name.trim(),
          email: m.email.trim().toLowerCase(),
          mobile: (m.mobile || "").trim(),
          college: (m.college || "").trim(),
          state: (m.state || "").trim(),
          role: (m.role || "Team Member").trim(),
        })),
        initialIdea: {
          title: formData.initialIdea.title.trim(),
          description: formData.initialIdea.description,
          problemStatement: formData.initialIdea.problemStatement,
          proposedSolution: formData.initialIdea.proposedSolution,
          techStack,
          pptUrl: formData.initialIdea.pptUrl.trim(),
          theme: formData.initialIdea.theme.trim(),
        },
        submittedLinks: {
          githubUrl: formData.submittedLinks.githubUrl.trim(),
          hostedProjectUrl: formData.submittedLinks.hostedProjectUrl.trim(),
          linkedInUrl: formData.submittedLinks.linkedInUrl.trim(),
          demoVideoUrl: formData.submittedLinks.demoVideoUrl.trim(),
        },
      };

      if (mode === "edit" && team) {
        const res = await axios.put(
          `${BACKEND_URL}/api/hackathon/admin/teams/${team.teamId}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data?.success) {
          toast.success("Team updated successfully!");
          onSuccess(res.data.team);
          onClose();
        }
      } else {
        const res = await axios.post(`${BACKEND_URL}/api/hackathon/admin/teams`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data?.success) {
          toast.success(`Team ${res.data.team?.teamId} created successfully!`);
          onSuccess(res.data.team);
          onClose();
        }
      }
    } catch (err) {
      console.error("Team form submission error:", err);
      toast.error(err.response?.data?.message || "Failed to save team record.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900">
              {mode === "edit" ? `Edit Team: ${team?.teamName}` : "Create New Hackathon Team"}
            </h3>
            <p className="text-xs text-slate-500">
              {mode === "edit"
                ? `Update details for ${team?.teamId}. Immutable IDs are protected.`
                : "Manual administrative team registration with source indicator."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section: Basic Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
              1. Basic Team Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Team Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cyber Guardians"
                  value={formData.teamName}
                  onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Track</label>
                <select
                  value={formData.track}
                  onChange={(e) => setFormData({ ...formData, track: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="General Track">General Track</option>
                  {tracks.map((t, idx) => (
                    <option key={idx} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section: Leader Info */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              2. Team Leader (Primary Contact)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Leader Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={formData.leader.name}
                  onChange={(e) => handleLeaderChange("name", e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Leader Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="email@college.edu"
                  value={formData.leader.email}
                  onChange={(e) => handleLeaderChange("email", e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile</label>
                <input
                  type="tel"
                  placeholder="+91 9876543210"
                  value={formData.leader.mobile}
                  onChange={(e) => handleLeaderChange("mobile", e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">College / Institute</label>
                <input
                  type="text"
                  placeholder="University / College Name"
                  value={formData.leader.college}
                  onChange={(e) => handleLeaderChange("college", e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">State / Location</label>
                <input
                  type="text"
                  placeholder="State / Region"
                  value={formData.leader.state}
                  onChange={(e) => handleLeaderChange("state", e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section: Additional Members */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                3. Additional Team Members ({formData.members.length})
              </h4>
              <button
                type="button"
                onClick={handleAddMember}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Member
              </button>
            </div>

            {formData.members.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-1">No additional members added yet.</p>
            ) : (
              <div className="space-y-3">
                {formData.members.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 relative space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Member #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(idx)}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <input
                        type="text"
                        placeholder="Member Name"
                        value={m.name}
                        onChange={(e) => handleMemberChange(idx, "name", e.target.value)}
                        className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                        required
                      />
                      <input
                        type="email"
                        placeholder="Member Email"
                        value={m.email}
                        onChange={(e) => handleMemberChange(idx, "email", e.target.value)}
                        className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                        required
                      />
                      <input
                        type="tel"
                        placeholder="Mobile"
                        value={m.mobile}
                        onChange={(e) => handleMemberChange(idx, "mobile", e.target.value)}
                        className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                      />
                      <input
                        type="text"
                        placeholder="College"
                        value={m.college}
                        onChange={(e) => handleMemberChange(idx, "college", e.target.value)}
                        className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                      />
                      <input
                        type="text"
                        placeholder="State"
                        value={m.state}
                        onChange={(e) => handleMemberChange(idx, "state", e.target.value)}
                        className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                      />
                      <input
                        type="text"
                        placeholder="Role (e.g. Frontend Dev)"
                        value={m.role}
                        onChange={(e) => handleMemberChange(idx, "role", e.target.value)}
                        className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Idea & Submission */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              4. Idea & Project Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Idea / Project Title</label>
                <input
                  type="text"
                  placeholder="e.g. AI-Powered Medical Diagnosis Engine"
                  value={formData.initialIdea.title}
                  onChange={(e) => handleIdeaChange("title", e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Theme</label>
                <input
                  type="text"
                  placeholder="e.g. Healthcare, FinTech"
                  value={formData.initialIdea.theme}
                  onChange={(e) => handleIdeaChange("theme", e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">PPT Presentation URL</label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={formData.initialIdea.pptUrl}
                  onChange={(e) => handleIdeaChange("pptUrl", e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Problem Statement</label>
                <textarea
                  rows={2}
                  placeholder="Explain the problem being addressed..."
                  value={formData.initialIdea.problemStatement}
                  onChange={(e) => handleIdeaChange("problemStatement", e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Proposed Solution</label>
                <textarea
                  rows={2}
                  placeholder="How does your solution tackle the problem?"
                  value={formData.initialIdea.proposedSolution}
                  onChange={(e) => handleIdeaChange("proposedSolution", e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tech Stack (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="React, Node.js, MongoDB, PyTorch"
                  value={formData.initialIdea.techStackString}
                  onChange={(e) => handleIdeaChange("techStackString", e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section: Submitted Links */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-600" />
              5. Project Links
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">GitHub Repo URL</label>
                <input
                  type="url"
                  placeholder="https://github.com/..."
                  value={formData.submittedLinks.githubUrl}
                  onChange={(e) => handleLinkChange("githubUrl", e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hosted Demo URL</label>
                <input
                  type="url"
                  placeholder="https://myproject.vercel.app"
                  value={formData.submittedLinks.hostedProjectUrl}
                  onChange={(e) => handleLinkChange("hostedProjectUrl", e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">LinkedIn Post / Profile</label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/..."
                  value={formData.submittedLinks.linkedInUrl}
                  onChange={(e) => handleLinkChange("linkedInUrl", e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Demo Video (YouTube/Loom)</label>
                <input
                  type="url"
                  placeholder="https://youtube.com/..."
                  value={formData.submittedLinks.demoVideoUrl}
                  onChange={(e) => handleLinkChange("demoVideoUrl", e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className={`w-4 h-4 ${submitting ? "animate-spin" : ""}`} />
              {submitting ? "Saving Team..." : mode === "edit" ? "Update Team Record" : "Create Team"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
