import { useState, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  Layers,
  Database,
  ShieldAlert,
  ExternalLink,
  SlidersHorizontal,
  Check,
  Users,
  Presentation,
  Sparkles,
  Info,
  Link as LinkIcon,
} from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5006";

const TARGET_FIELDS = [
  { value: "", label: "— Do Not Map (Keep in Raw Data) —" },
  { value: "unstopApplicationId", label: "Unstop Application / Team ID" },
  { value: "teamName", label: "Team Name *" },
  { value: "track", label: "Track / Theme" },
  { value: "leaderName", label: "Leader Name *" },
  { value: "leaderEmail", label: "Leader Email *" },
  { value: "leaderMobile", label: "Leader Mobile / Phone" },
  { value: "leaderCollege", label: "Leader College / Institution" },
  { value: "leaderState", label: "Leader State / Location" },
  { value: "ideaTitle", label: "Idea / Project Title" },
  { value: "ideaDescription", label: "Idea Description / Abstract" },
  { value: "problemStatement", label: "Problem Statement" },
  { value: "proposedSolution", label: "Proposed Solution" },
  { value: "techStack", label: "Tech Stack / Technologies" },
  { value: "pptUrl", label: "PPT / Pitch Deck Link" },
  { value: "githubUrl", label: "GitHub Repository Link" },
  { value: "hostedProjectUrl", label: "Hosted Project / Live Demo Link" },
  { value: "demoVideoUrl", label: "Video Demo / YouTube Link" },
  { value: "linkedInUrl", label: "LinkedIn Profile Link" },
  { value: "member_1_Name", label: "Member 1 Name" },
  { value: "member_1_Email", label: "Member 1 Email" },
  { value: "member_1_College", label: "Member 1 College" },
  { value: "member_2_Name", label: "Member 2 Name" },
  { value: "member_2_Email", label: "Member 2 Email" },
  { value: "member_2_College", label: "Member 2 College" },
  { value: "member_3_Name", label: "Member 3 Name" },
  { value: "member_3_Email", label: "Member 3 Email" },
  { value: "member_3_College", label: "Member 3 College" },
];

export default function UnstopImportModal({ isOpen, onClose, onImportSuccess }) {
  const fileInputRef = useRef(null);
  const [step, setStep] = useState(1); // 1: Upload, 2: Preview & Mapping, 3: Success
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedStage, setSelectedStage] = useState("AUTO"); // 'AUTO', 'REGISTRATION', 'PPT'
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);

  // Preview Data State
  const [previewData, setPreviewData] = useState(null);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [customMapping, setCustomMapping] = useState({});
  const [showMappingConfig, setShowMappingConfig] = useState(false);
  const [duplicateHandling, setDuplicateHandling] = useState("UPDATE"); // default to UPDATE for master upsert
  const [previewFilter, setPreviewFilter] = useState("ALL");
  const [commitResult, setCommitResult] = useState(null);

  if (!isOpen) return null;

  const getAdminToken = () => {
    return localStorage.getItem("adminToken") || localStorage.getItem("token");
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExts = [".xlsx", ".xls"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!validExts.includes(ext)) {
      toast.error("Invalid file format. Please choose an Excel file (.xlsx or .xls).");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error("File is too large. Maximum allowed size is 20MB.");
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadAndPreview = async (overrideSheet = null, overrideMapping = null) => {
    if (!selectedFile) {
      toast.error("Please choose an Excel file to upload.");
      return;
    }

    try {
      setIsProcessing(true);
      const token = getAdminToken();
      const formData = new FormData();
      formData.append("excelFile", selectedFile);
      if (selectedStage !== "AUTO") {
        formData.append("importType", selectedStage);
      }
      if (overrideSheet || selectedSheet) {
        formData.append("sheetName", overrideSheet || selectedSheet);
      }
      if (overrideMapping || Object.keys(customMapping).length > 0) {
        formData.append("customMapping", JSON.stringify(overrideMapping || customMapping));
      }

      const res = await axios.post(`${BACKEND_URL}/api/hackathon/admin/unstop/preview`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data?.success) {
        setPreviewData(res.data);
        setSelectedSheet(res.data.activeSheet);
        setPreviewFilter("ALL");

        // Populate initial mapping if not overridden
        if (!overrideMapping && res.data.mappedColumns) {
          const initialMap = {};
          Object.values(res.data.mappedColumns).forEach((col) => {
            initialMap[col.headerName] = col.targetField;
          });
          setCustomMapping(initialMap);
        }

        setStep(2);
        const count = res.data.stats?.totalRows || 0;
        const typeLabel =
          res.data.importType === "REGISTRATION"
            ? "Stage 1: Registration"
            : res.data.importType === "PPT"
            ? "Stage 2: PPT Enrichment"
            : "Legacy Sheet";
        toast.success(`Processed ${count} rows as [${typeLabel}] from "${res.data.activeSheet}"`);
      }
    } catch (err) {
      console.error("Preview Error:", err);
      toast.error(err.response?.data?.message || "Failed to process Excel file.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSheetChange = (newSheet) => {
    setSelectedSheet(newSheet);
    handleUploadAndPreview(newSheet, customMapping);
  };

  const handleMappingChange = (headerName, targetField) => {
    setCustomMapping((prev) => ({
      ...prev,
      [headerName]: targetField,
    }));
  };

  const handleApplyCustomMapping = () => {
    handleUploadAndPreview(selectedSheet, customMapping);
    setShowMappingConfig(false);
  };

  const handleCommitImport = async () => {
    if (!previewData || !previewData.previewRows) return;

    try {
      setIsCommitting(true);
      const token = getAdminToken();

      const payload = {
        importType: previewData.importType,
        rows: previewData.previewRows,
        duplicateHandling,
        filename: selectedFile?.name || "unstop_export.xlsx",
      };

      const res = await axios.post(`${BACKEND_URL}/api/hackathon/admin/unstop/commit`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        setCommitResult({
          ...res.data.result,
          importType: res.data.importType || previewData.importType,
        });
        setStep(3);
        toast.success("Import successfully completed!");
        if (onImportSuccess) {
          onImportSuccess();
        }
      }
    } catch (err) {
      console.error("Commit Error:", err);
      toast.error(err.response?.data?.message || "Failed to commit import.");
    } finally {
      setIsCommitting(false);
    }
  };

  const isRegistration = previewData?.importType === "REGISTRATION";
  const isPpt = previewData?.importType === "PPT";

  // Filter logic for preview table
  const filteredRegistrationTeams = (previewData?.previewRows || []).filter((team) => {
    if (previewFilter === "ALL") return true;
    if (previewFilter === "NEW") return team.status === "NEW";
    if (previewFilter === "UPDATE") return team.status === "EXISTING_UPDATE";
    return true;
  });

  const filteredPptRows = (previewData?.previewRows || []).filter((row) => {
    if (previewFilter === "ALL") return true;
    if (previewFilter === "MATCHED") return row.status === "NEW_PPT" || row.status === "UPDATE_PPT";
    if (previewFilter === "NEW_PPT") return row.status === "NEW_PPT";
    if (previewFilter === "UPDATE_PPT") return row.status === "UPDATE_PPT";
    if (previewFilter === "AMBIGUOUS") return row.status === "AMBIGUOUS";
    if (previewFilter === "UNMATCHED") return row.status === "UNMATCHED";
    return true;
  });

  const filteredLegacyRows = (previewData?.previewRows || []).filter((row) => {
    if (previewFilter === "ALL") return true;
    return row.status === previewFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                Unstop Two-Stage Import System
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Step {step} of 3
                </span>
                {previewData?.importType && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      isRegistration
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : isPpt
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {isRegistration ? "📋 Stage 1: Registration" : isPpt ? "📊 Stage 2: PPT Enrichment" : "Legacy"}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Zero-prep intelligent Excel parser for Code-A-Nova: Registration (Master) &amp; PPT (Enrichment).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ─── STEP 1: UPLOAD & STAGE SELECTION ─── */}
          {step === 1 && (
            <div className="max-w-3xl mx-auto py-6 space-y-6 text-center">
              {/* Stage Selection Pills */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
                  Select Import Type
                </span>
                <div className="inline-flex p-1.5 bg-slate-100 rounded-2xl border border-slate-200 gap-1.5 shadow-inner">
                  <button
                    type="button"
                    onClick={() => setSelectedStage("AUTO")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      selectedStage === "AUTO"
                        ? "bg-white text-indigo-700 shadow-sm border border-slate-200"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    Auto-Detect
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedStage("REGISTRATION")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      selectedStage === "REGISTRATION"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Stage 1: Registration (Master)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedStage("PPT")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      selectedStage === "PPT"
                        ? "bg-amber-600 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Presentation className="w-4 h-4" />
                    Stage 2: PPT Round (Enrichment)
                  </button>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-3xl p-10 bg-slate-50 hover:bg-indigo-50/40 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 group"
              >
                <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {selectedFile ? selectedFile.name : "Click to browse or drag & drop raw Unstop Excel export"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Upload directly as downloaded from Unstop (.xlsx, .xls) — zero manual preparation required
                  </p>
                </div>
                {selectedFile && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
                    {(selectedFile.size / 1024).toFixed(1)} KB selected
                  </span>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedFile || isProcessing}
                  onClick={() => handleUploadAndPreview()}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isProcessing ? "animate-spin" : ""}`} />
                  {isProcessing ? "Analyzing & Validating Spreadsheet..." : "Inspect & Preview Data →"}
                </button>
              </div>

              {/* Informational Guidelines Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-xs space-y-1.5">
                  <span className="font-black text-emerald-800 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-600" /> Stage 1: Registration Import (Master)
                  </span>
                  <p className="text-emerald-900/80">
                    • Master source of truth for creating and updating teams &amp; multiple members.
                  </p>
                  <p className="text-emerald-900/80">
                    • Groups candidate rows by <strong>Team ID</strong> and automatically links leaders and team members.
                  </p>
                  <p className="text-emerald-900/80">
                    • Idempotent: safe to re-import anytime. Missing teams or members from later exports are never deleted.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs space-y-1.5">
                  <span className="font-black text-amber-800 flex items-center gap-1.5">
                    <Presentation className="w-4 h-4 text-amber-600" /> Stage 2: PPT Round Import (Enrichment)
                  </span>
                  <p className="text-amber-900/80">
                    • Attaches PPT submission URLs and metadata strictly to existing teams.
                  </p>
                  <p className="text-amber-900/80">
                    • <strong>NEVER creates a new Team</strong> or rogue individual participants.
                  </p>
                  <p className="text-amber-900/80">
                    • Unstop Status (Selected/Rejected) and Round 1 Score are strictly ignored.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 2: PREVIEW & REVIEW ─── */}
          {step === 2 && previewData && (
            <div className="space-y-6">
              {/* STAGE 1: REGISTRATION PREVIEW */}
              {isRegistration && (
                <>
                  {/* Explanatory Banner */}
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                    <Users className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-emerald-900">
                      <strong className="font-bold">Stage 1 Registration Import (Master Source):</strong> Candidate rows have been grouped by Team ID into full teams. Re-running this will safely update existing records and append new members without deleting any data.
                    </div>
                  </div>

                  {/* Top Stats Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Candidate Rows</div>
                      <div className="text-xl font-black text-slate-800 mt-0.5">{previewData.stats.totalRows}</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                      <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">New Teams</div>
                      <div className="text-xl font-black text-emerald-700 mt-0.5">{previewData.stats.newCount}</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-center">
                      <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Existing Teams (Update)</div>
                      <div className="text-xl font-black text-indigo-700 mt-0.5">{previewData.stats.existingUpdateCount}</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-center">
                      <div className="text-[10px] font-bold text-teal-600 uppercase tracking-wider">New Members to Add</div>
                      <div className="text-xl font-black text-teal-700 mt-0.5">{previewData.stats.totalNewMembers}</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-cyan-50 border border-cyan-200 text-center">
                      <div className="text-[10px] font-bold text-cyan-600 uppercase tracking-wider">Members to Update</div>
                      <div className="text-xl font-black text-cyan-700 mt-0.5">{previewData.stats.totalUpdatedMembers}</div>
                    </div>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                      {[
                        { id: "ALL", label: `All Teams (${previewData.stats.totalTeams})` },
                        { id: "NEW", label: `New Teams (${previewData.stats.newCount})` },
                        { id: "UPDATE", label: `Existing Teams (${previewData.stats.existingUpdateCount})` },
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setPreviewFilter(f.id)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            previewFilter === f.id
                              ? "bg-white text-indigo-600 shadow-xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    <div className="text-xs text-slate-500 font-medium">
                      Showing {filteredRegistrationTeams.length} of {previewData.stats.totalTeams} teams
                    </div>
                  </div>

                  {/* Registration Teams Table */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <div className="max-h-96 overflow-y-auto">
                      <table className="w-full text-left text-xs text-slate-600">
                        <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10">
                          <tr>
                            <th className="p-3">#</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Unstop Team ID</th>
                            <th className="p-3">Team Name</th>
                            <th className="p-3">Leader</th>
                            <th className="p-3">Total Members</th>
                            <th className="p-3">College / Org</th>
                            <th className="p-3">Member Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredRegistrationTeams.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="p-8 text-center text-slate-400">
                                No teams match the selected filter.
                              </td>
                            </tr>
                          ) : (
                            filteredRegistrationTeams.map((team, idx) => {
                              const isNew = team.status === "NEW";
                              return (
                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                  <td className="p-3 font-mono text-[11px] text-slate-400">{idx + 1}</td>
                                  <td className="p-3">
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        isNew
                                          ? "bg-emerald-100 text-emerald-800"
                                          : "bg-indigo-100 text-indigo-800"
                                      }`}
                                    >
                                      {isNew ? "NEW TEAM" : `UPDATE (${team.existingTeamCode || "EXISTING"})`}
                                    </span>
                                  </td>
                                  <td className="p-3 font-mono text-[11px] text-slate-500 font-bold">
                                    {team.teamId}
                                  </td>
                                  <td className="p-3 font-bold text-slate-900">{team.teamName}</td>
                                  <td className="p-3">
                                    <div className="font-semibold text-slate-800">{team.leader.name}</div>
                                    <div className="text-[11px] text-slate-400">{team.leader.email}</div>
                                    {team.leader.phone && (
                                      <div className="text-[10px] text-slate-400">{team.leader.phone}</div>
                                    )}
                                  </td>
                                  <td className="p-3 font-bold text-slate-700">
                                    {team.memberCount} candidate{team.memberCount > 1 ? "s" : ""}
                                    {!isNew && team.memberDiff && (
                                      <div className="text-[10px] font-normal text-indigo-600">
                                        +{team.memberDiff.newCount} new, {team.memberDiff.updatedCount} update
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-3 text-slate-600 max-w-xs truncate" title={team.organization || ""}>
                                    {team.organization || "—"}
                                  </td>
                                  <td className="p-3 max-w-sm">
                                    <div className="space-y-0.5 text-[11px]">
                                      {team.members.map((m, mIdx) => (
                                        <div key={mIdx} className="text-slate-600 truncate">
                                          <span className="font-medium text-slate-800">{m.name}</span>{" "}
                                          <span className="text-slate-400">({m.email})</span>
                                        </div>
                                      ))}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {/* STAGE 2: PPT PREVIEW */}
              {isPpt && (
                <>
                  {/* Explanatory Banner */}
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                    <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-900 space-y-1">
                      <div>
                        <strong className="font-bold">Stage 2 PPT Round Import (Enrichment Only):</strong> Matching PPT submissions against existing teams. <strong>PPT import NEVER creates a new Team.</strong>
                      </div>
                      <div className="text-[11px] text-amber-800">
                        • Unstop selection status (Selected/Rejected) and Round 1 score are strictly ignored — Code-A-Nova internal scoring is preserved.
                        • Only confident 1-to-1 matches will be enriched. Ambiguous or unmatched rows are held for review.
                      </div>
                    </div>
                  </div>

                  {/* Top Stats Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total PPT Rows</div>
                      <div className="text-xl font-black text-slate-800 mt-0.5">{previewData.stats.totalRows}</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                      <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Total Matched</div>
                      <div className="text-xl font-black text-emerald-700 mt-0.5">{previewData.stats.matchedCount}</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-teal-50 border border-teal-200 text-center">
                      <div className="text-[10px] font-bold text-teal-600 uppercase tracking-wider">New PPTs</div>
                      <div className="text-xl font-black text-teal-700 mt-0.5">{previewData.stats.newPptCount}</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-200 text-center">
                      <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Updated PPTs</div>
                      <div className="text-xl font-black text-indigo-700 mt-0.5">{previewData.stats.updatePptCount}</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-center">
                      <div className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Unmatched Queue</div>
                      <div className="text-xl font-black text-rose-700 mt-0.5">{previewData.stats.unmatchedCount}</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-center">
                      <div className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Needs Review</div>
                      <div className="text-xl font-black text-purple-700 mt-0.5">{previewData.stats.ambiguousCount}</div>
                    </div>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto">
                      {[
                        { id: "ALL", label: `All (${previewData.stats.totalRows})` },
                        { id: "MATCHED", label: `Matched (${previewData.stats.matchedCount})` },
                        { id: "NEW_PPT", label: `New PPT (${previewData.stats.newPptCount})` },
                        { id: "UPDATE_PPT", label: `Updated PPT (${previewData.stats.updatePptCount})` },
                        { id: "UNMATCHED", label: `Unmatched (${previewData.stats.unmatchedCount})` },
                        { id: "AMBIGUOUS", label: `Needs Review (${previewData.stats.ambiguousCount})` },
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setPreviewFilter(f.id)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                            previewFilter === f.id
                              ? "bg-white text-indigo-600 shadow-xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    <div className="text-xs text-slate-500 font-medium">
                      Showing {filteredPptRows.length} of {previewData.stats.totalRows} rows
                    </div>
                  </div>

                  {/* PPT Rows Table */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <div className="max-h-96 overflow-y-auto">
                      <table className="w-full text-left text-xs text-slate-600">
                        <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10">
                          <tr>
                            <th className="p-3">#</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Regn ID / App ID</th>
                            <th className="p-3">Excel Team Name</th>
                            <th className="p-3">Candidate / Leader Email</th>
                            <th className="p-3">PPT Deck Link</th>
                            <th className="p-3">Matched Team (Code)</th>
                            <th className="p-3">Match Method / Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredPptRows.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="p-8 text-center text-slate-400">
                                No rows match the selected filter.
                              </td>
                            </tr>
                          ) : (
                            filteredPptRows.map((row, idx) => {
                              const isMatched = row.status === "NEW_PPT" || row.status === "UPDATE_PPT";
                              const statusBadge =
                                row.status === "NEW_PPT" ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    NEW PPT
                                  </span>
                                ) : row.status === "UPDATE_PPT" ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                                    UPDATE PPT
                                  </span>
                                ) : row.status === "AMBIGUOUS" ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                                    NEEDS REVIEW
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                    UNMATCHED
                                  </span>
                                );

                              return (
                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                  <td className="p-3 font-mono text-[11px] text-slate-400">{row.rowIndex}</td>
                                  <td className="p-3">{statusBadge}</td>
                                  <td className="p-3 font-mono text-[11px] text-slate-600 font-bold">
                                    {row.unstopApplicationId || "—"}
                                  </td>
                                  <td className="p-3 font-bold text-slate-900">{row.teamName || "—"}</td>
                                  <td className="p-3">
                                    <div className="text-slate-800 font-medium truncate max-w-[180px]">
                                      {row.leaderEmail || row.candidateEmail || "—"}
                                    </div>
                                    {row.candidateName && (
                                      <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                                        {row.candidateName}
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-3 max-w-[200px]">
                                    {row.pptUrl ? (
                                      <a
                                        href={row.pptUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[11px] text-indigo-600 hover:underline inline-flex items-center gap-1 font-medium truncate max-w-[180px]"
                                        title={row.pptUrl}
                                      >
                                        <LinkIcon className="w-3 h-3 shrink-0" />
                                        <span className="truncate">{row.pptUrl}</span>
                                        <ExternalLink className="w-3 h-3 shrink-0" />
                                      </a>
                                    ) : (
                                      <span className="text-slate-400 italic">No PPT URL</span>
                                    )}
                                  </td>
                                  <td className="p-3">
                                    {row.matchedTeam ? (
                                      <div>
                                        <span className="font-bold font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                          {row.matchedTeam.teamCode}
                                        </span>
                                        <div className="text-[11px] text-slate-600 font-medium truncate max-w-[150px] mt-0.5">
                                          {row.matchedTeam.teamName}
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-rose-500 text-[11px] font-medium">None</span>
                                    )}
                                  </td>
                                  <td className="p-3 max-w-xs text-[11px]">
                                    {row.matchConfidence && (
                                      <div className="text-slate-600 font-medium">
                                        Matched by: <span className="font-bold text-slate-800">{row.matchConfidence}</span>
                                      </div>
                                    )}
                                    {row.warnings?.length > 0 && (
                                      <div className="text-amber-700">{row.warnings.join(", ")}</div>
                                    )}
                                    {row.ambiguousCandidates?.length > 0 && (
                                      <div className="text-purple-700">
                                        Found {row.ambiguousCandidates.length} candidate teams.
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {/* LEGACY SHEET PREVIEW (Fallback) */}
              {!isRegistration && !isPpt && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Rows</div>
                      <div className="text-xl font-black text-slate-800 mt-0.5">{previewData.stats?.totalRows}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                      <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">New Teams</div>
                      <div className="text-xl font-black text-emerald-700 mt-0.5">{previewData.stats?.newCount}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                      <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Duplicates</div>
                      <div className="text-xl font-black text-amber-700 mt-0.5">{previewData.stats?.duplicateCount}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-center">
                      <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Warnings</div>
                      <div className="text-xl font-black text-blue-700 mt-0.5">{previewData.stats?.warningCount}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-center">
                      <div className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Invalid / Blocked</div>
                      <div className="text-xl font-black text-rose-700 mt-0.5">{previewData.stats?.invalidCount}</div>
                    </div>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 overflow-x-auto">
                    {[
                      { id: "ALL", label: `All (${previewData.stats?.totalRows})` },
                      { id: "NEW", label: `New (${previewData.stats?.newCount})` },
                      { id: "DUPLICATE", label: `Duplicates (${previewData.stats?.duplicateCount})` },
                      { id: "WARNING", label: `Warnings (${previewData.stats?.warningCount})` },
                      { id: "INVALID", label: `Invalid (${previewData.stats?.invalidCount})` },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setPreviewFilter(f.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                          previewFilter === f.id
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {/* Legacy Table */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <div className="max-h-80 overflow-y-auto">
                      <table className="w-full text-left text-xs text-slate-600">
                        <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10">
                          <tr>
                            <th className="p-3">#</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Team Name</th>
                            <th className="p-3">Unstop ID</th>
                            <th className="p-3">Leader</th>
                            <th className="p-3">Track</th>
                            <th className="p-3">Idea &amp; PPT</th>
                            <th className="p-3">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredLegacyRows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                              <td className="p-3 font-mono text-[11px] text-slate-400">{row.rowIndex}</td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                                  {row.status}
                                </span>
                              </td>
                              <td className="p-3 font-bold text-slate-900">{row.teamName || "—"}</td>
                              <td className="p-3 font-mono text-[11px] text-slate-500">{row.unstopApplicationId || "—"}</td>
                              <td className="p-3">
                                <div className="font-semibold text-slate-800">{row.leader?.name || "—"}</div>
                                <div className="text-[11px] text-slate-400">{row.leader?.email}</div>
                              </td>
                              <td className="p-3 text-slate-600">{row.track}</td>
                              <td className="p-3 max-w-xs">{row.ideaTitle || "—"}</td>
                              <td className="p-3 max-w-xs text-[11px] text-rose-600">{row.errors?.join(", ")}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {/* Action Buttons Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Upload Different File
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={
                      isCommitting ||
                      (isRegistration && (previewData.stats?.teamsToImportCount === 0 || !previewData.stats?.teamsToImportCount)) ||
                      (isPpt && (previewData.stats?.validToImportCount === 0 || !previewData.stats?.validToImportCount)) ||
                      (!isRegistration && !isPpt && previewData.stats?.validToImportCount === 0)
                    }
                    onClick={handleCommitImport}
                    className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black text-white shadow-md transition-all cursor-pointer disabled:opacity-50 ${
                      isRegistration
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : isPpt
                        ? "bg-amber-600 hover:bg-amber-700"
                        : "bg-indigo-600 hover:bg-indigo-700"
                    }`}
                  >
                    <CheckCircle2 className={`w-4 h-4 ${isCommitting ? "animate-spin" : ""}`} />
                    {isCommitting
                      ? "Importing & Updating Database..."
                      : isRegistration
                      ? `Confirm & Save ${previewData.stats?.teamsToImportCount || 0} Teams (Master Upsert)`
                      : isPpt
                      ? `Confirm & Enrich ${previewData.stats?.validToImportCount || 0} Matched Teams`
                      : `Confirm & Import ${previewData.stats?.validToImportCount || 0} Teams`}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 3: RESULT & AUDIT SUMMARY ─── */}
          {step === 3 && commitResult && (
            <div className="max-w-2xl mx-auto py-8 text-center space-y-6 animate-fade-in">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-md ${
                  commitResult.importType === "REGISTRATION"
                    ? "bg-emerald-100 text-emerald-600"
                    : commitResult.importType === "PPT"
                    ? "bg-amber-100 text-amber-600"
                    : "bg-indigo-100 text-indigo-600"
                }`}
              >
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-900">
                  {commitResult.importType === "REGISTRATION"
                    ? "Registration Import & Master Upsert Completed!"
                    : commitResult.importType === "PPT"
                    ? "PPT Round Enrichment Completed!"
                    : "Unstop Import Completed!"}
                </h3>
                <p className="text-xs text-slate-500">
                  Data has been stored in Code-A-Nova database, audit logged, and synchronized idempotently.
                </p>
              </div>

              {/* Stage-specific result cards */}
              {commitResult.importType === "REGISTRATION" ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                    <div className="text-[10px] font-bold text-emerald-600 uppercase">Teams Created</div>
                    <div className="text-2xl font-black text-emerald-700 mt-1">{commitResult.createdCount || 0}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200">
                    <div className="text-[10px] font-bold text-indigo-600 uppercase">Teams Updated</div>
                    <div className="text-2xl font-black text-indigo-700 mt-1">{commitResult.updatedCount || 0}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200">
                    <div className="text-[10px] font-bold text-teal-600 uppercase">Members Appended</div>
                    <div className="text-2xl font-black text-teal-700 mt-1">{commitResult.membersAppended || 0}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-cyan-50 border border-cyan-200">
                    <div className="text-[10px] font-bold text-cyan-600 uppercase">Members Updated</div>
                    <div className="text-2xl font-black text-cyan-700 mt-1">{commitResult.membersUpdated || 0}</div>
                  </div>
                </div>
              ) : commitResult.importType === "PPT" ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                    <div className="text-[10px] font-bold text-emerald-600 uppercase">Teams Enriched</div>
                    <div className="text-2xl font-black text-emerald-700 mt-1">{commitResult.updatedCount || 0}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200">
                    <div className="text-[10px] font-bold text-teal-600 uppercase">Matched Total</div>
                    <div className="text-2xl font-black text-teal-700 mt-1">{commitResult.matchedCount || 0}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                    <div className="text-[10px] font-bold text-amber-600 uppercase">Skipped / Unmatched</div>
                    <div className="text-2xl font-black text-amber-700 mt-1">{commitResult.skippedCount || 0}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
                    <div className="text-[10px] font-bold text-rose-600 uppercase">Failed</div>
                    <div className="text-2xl font-black text-rose-700 mt-1">{commitResult.failedCount || 0}</div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                    <div className="text-[10px] font-bold text-emerald-600 uppercase">Imported</div>
                    <div className="text-2xl font-black text-emerald-700 mt-1">{commitResult.importedCount || 0}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                    <div className="text-[10px] font-bold text-amber-600 uppercase">Skipped</div>
                    <div className="text-2xl font-black text-amber-700 mt-1">{commitResult.skippedCount || 0}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200">
                    <div className="text-[10px] font-bold text-indigo-600 uppercase">Updated</div>
                    <div className="text-2xl font-black text-indigo-700 mt-1">{commitResult.updatedCount || 0}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
                    <div className="text-[10px] font-bold text-rose-600 uppercase">Failed</div>
                    <div className="text-2xl font-black text-rose-700 mt-1">{commitResult.failedCount || 0}</div>
                  </div>
                </div>
              )}

              {commitResult.failedRows?.length > 0 && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-left text-xs space-y-2">
                  <span className="font-bold text-rose-800 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" /> Failed Rows Details:
                  </span>
                  <div className="max-h-36 overflow-y-auto space-y-1">
                    {commitResult.failedRows.map((f, i) => (
                      <div key={i} className="text-[11px] text-rose-700">
                        Row {f.rowIndex}: <span className="font-semibold">{f.teamName || "Unnamed"}</span> —{" "}
                        {f.reason}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all cursor-pointer"
                >
                  Close &amp; View Teams List
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
