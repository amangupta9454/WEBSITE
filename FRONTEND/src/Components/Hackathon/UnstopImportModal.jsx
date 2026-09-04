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
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);

  // Preview Data State
  const [previewData, setPreviewData] = useState(null);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [customMapping, setCustomMapping] = useState({});
  const [showMappingConfig, setShowMappingConfig] = useState(false);
  const [duplicateHandling, setDuplicateHandling] = useState("SKIP"); // 'SKIP' or 'UPDATE'
  const [previewFilter, setPreviewFilter] = useState("ALL"); // 'ALL', 'NEW', 'DUPLICATE', 'WARNING', 'INVALID'
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

    if (file.size > 15 * 1024 * 1024) {
      toast.error("File is too large. Maximum allowed size is 15MB.");
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

        // Populate initial mapping if not overridden
        if (!overrideMapping && res.data.mappedColumns) {
          const initialMap = {};
          Object.values(res.data.mappedColumns).forEach((col) => {
            initialMap[col.headerName] = col.targetField;
          });
          setCustomMapping(initialMap);
        }

        setStep(2);
        toast.success(`Processed ${res.data.stats?.totalRows || 0} rows from sheet "${res.data.activeSheet}"`);
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

      // Pass previewRows to commit endpoint
      const payload = {
        rows: previewData.previewRows,
        duplicateHandling,
        filename: selectedFile?.name || "unstop_export.xlsx",
      };

      const res = await axios.post(`${BACKEND_URL}/api/hackathon/admin/unstop/commit`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        setCommitResult(res.data.result);
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

  const filteredRows = (previewData?.previewRows || []).filter((row) => {
    if (previewFilter === "ALL") return true;
    return row.status === previewFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                Import Unstop Hackathon Data
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Step {step} of 3
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Tolerant Excel parser with dynamic column matching and duplicate detection.
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
          {/* ─── STEP 1: UPLOAD EXCEL ─── */}
          {step === 1 && (
            <div className="max-w-2xl mx-auto py-8 space-y-6 text-center">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-3xl p-10 bg-slate-50 hover:bg-indigo-50/40 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 group"
              >
                <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {selectedFile ? selectedFile.name : "Click to browse or drag & drop Unstop Excel export"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports .xlsx, .xls spreadsheets up to 15MB
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
                  {isProcessing ? "Reading & Validating Excel..." : "Process & Preview Data →"}
                </button>
              </div>

              {/* Informational Guidelines Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left text-xs text-slate-500 space-y-1.5">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Intelligent Tolerant Parser:
                </span>
                <p>• Automatically identifies Team Name, Leader info, Members, Tracks, Idea, and PPT Link.</p>
                <p>• Duplicate detection runs both within the file and against existing database records.</p>
                <p>• Unmapped extra columns are preserved in full inside raw team metadata so no data is lost.</p>
              </div>
            </div>
          )}

          {/* ─── STEP 2: PREVIEW & COLUMN MAPPING ─── */}
          {step === 2 && previewData && (
            <div className="space-y-6">
              {/* Top Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Rows</div>
                  <div className="text-xl font-black text-slate-800 mt-0.5">{previewData.stats.totalRows}</div>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                  <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">New Teams</div>
                  <div className="text-xl font-black text-emerald-700 mt-0.5">{previewData.stats.newCount}</div>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                  <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Duplicates</div>
                  <div className="text-xl font-black text-amber-700 mt-0.5">{previewData.stats.duplicateCount}</div>
                </div>
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-center">
                  <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Warnings</div>
                  <div className="text-xl font-black text-blue-700 mt-0.5">{previewData.stats.warningCount}</div>
                </div>
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-center">
                  <div className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Invalid / Blocked</div>
                  <div className="text-xl font-black text-rose-700 mt-0.5">{previewData.stats.invalidCount}</div>
                </div>
              </div>

              {/* Controls & Options Toolbar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex flex-wrap items-center gap-4">
                  {/* Multi-sheet Selector */}
                  {previewData.sheetNames?.length > 1 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5" /> Sheet:
                      </span>
                      <select
                        value={selectedSheet}
                        onChange={(e) => handleSheetChange(e.target.value)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {previewData.sheetNames.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Duplicate Handling Option */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600">Duplicate Handling:</span>
                    <select
                      value={duplicateHandling}
                      onChange={(e) => setDuplicateHandling(e.target.value)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="SKIP">Skip Duplicates (Recommended)</option>
                      <option value="UPDATE">Update Existing Records</option>
                    </select>
                  </div>

                  {/* Column Mapping Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowMappingConfig(!showMappingConfig)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                    {showMappingConfig ? "Hide Column Mappings" : "Customize Column Mapping"}
                  </button>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 overflow-x-auto">
                  {[
                    { id: "ALL", label: `All (${previewData.stats.totalRows})` },
                    { id: "NEW", label: `New (${previewData.stats.newCount})` },
                    { id: "DUPLICATE", label: `Duplicates (${previewData.stats.duplicateCount})` },
                    { id: "WARNING", label: `Warnings (${previewData.stats.warningCount})` },
                    { id: "INVALID", label: `Invalid (${previewData.stats.invalidCount})` },
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
              </div>

              {/* Collapsible Custom Column Mapping Editor */}
              {showMappingConfig && (
                <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wider">
                        Column Mapping Configuration
                      </h4>
                      <p className="text-[11px] text-indigo-700/80">
                        Adjust which Excel column maps to each Hackathon team field.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyCustomMapping}
                      className="px-4 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer shadow-xs"
                    >
                      Re-parse with Custom Mappings
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {previewData.headers.map((hdr, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-white border border-indigo-100 text-xs space-y-1">
                        <span className="font-semibold text-slate-800 block truncate" title={hdr}>
                          Column: <span className="text-indigo-600 font-bold">{hdr}</span>
                        </span>
                        <select
                          value={customMapping[hdr] || ""}
                          onChange={(e) => handleMappingChange(hdr, e.target.value)}
                          className="w-full p-1.5 rounded-lg text-xs border border-slate-200 bg-slate-50 focus:bg-white"
                        >
                          {TARGET_FIELDS.map((tf) => (
                            <option key={tf.value} value={tf.value}>
                              {tf.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Data Rows Preview Table */}
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
                        <th className="p-3">Idea & PPT</th>
                        <th className="p-3">Validation Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRows.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-400">
                            No rows match the selected filter.
                          </td>
                        </tr>
                      ) : (
                        filteredRows.map((row, idx) => {
                          const statusColor =
                            row.status === "NEW"
                              ? "bg-emerald-100 text-emerald-800"
                              : row.status === "DUPLICATE"
                              ? "bg-amber-100 text-amber-800"
                              : row.status === "WARNING"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-rose-100 text-rose-800";

                          return (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                              <td className="p-3 font-mono text-[11px] text-slate-400">{row.rowIndex}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor}`}>
                                  {row.status}
                                </span>
                              </td>
                              <td className="p-3 font-bold text-slate-900">{row.teamName || "—"}</td>
                              <td className="p-3 font-mono text-[11px] text-slate-500">
                                {row.unstopApplicationId || "—"}
                              </td>
                              <td className="p-3">
                                <div className="font-semibold text-slate-800">{row.leader.name || "—"}</div>
                                <div className="text-[11px] text-slate-400">{row.leader.email}</div>
                              </td>
                              <td className="p-3 text-slate-600">{row.track}</td>
                              <td className="p-3 max-w-xs">
                                <div className="font-semibold text-slate-800 truncate">{row.ideaTitle || "—"}</div>
                                {row.pptUrl && (
                                  <a
                                    href={row.pptUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[11px] text-indigo-600 hover:underline inline-flex items-center gap-1"
                                  >
                                    View PPT <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </td>
                              <td className="p-3 max-w-xs text-[11px]">
                                {row.errors?.length > 0 && (
                                  <div className="text-rose-600 font-semibold">{row.errors.join(", ")}</div>
                                )}
                                {row.duplicateReason && (
                                  <div className="text-amber-700 font-medium">{row.duplicateReason}</div>
                                )}
                                {row.warnings?.length > 0 && (
                                  <div className="text-slate-500">{row.warnings.join(", ")}</div>
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
                    disabled={previewData.stats.validToImportCount === 0 || isCommitting}
                    onClick={handleCommitImport}
                    className="inline-flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className={`w-4 h-4 ${isCommitting ? "animate-spin" : ""}`} />
                    {isCommitting
                      ? "Importing in Batches..."
                      : `Confirm & Import ${previewData.stats.validToImportCount} Valid Teams`}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 3: RESULT & AUDIT SUMMARY ─── */}
          {step === 3 && commitResult && (
            <div className="max-w-2xl mx-auto py-8 text-center space-y-6 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-900">Unstop Import Completed!</h3>
                <p className="text-xs text-slate-500">
                  Data has been normalized, stored in the Hackathon database, and logged in the audit trail.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <div className="text-[10px] font-bold text-emerald-600 uppercase">Imported</div>
                  <div className="text-2xl font-black text-emerald-700 mt-1">{commitResult.importedCount}</div>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                  <div className="text-[10px] font-bold text-amber-600 uppercase">Skipped</div>
                  <div className="text-2xl font-black text-amber-700 mt-1">{commitResult.skippedCount}</div>
                </div>
                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200">
                  <div className="text-[10px] font-bold text-indigo-600 uppercase">Updated</div>
                  <div className="text-2xl font-black text-indigo-700 mt-1">{commitResult.updatedCount}</div>
                </div>
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
                  <div className="text-[10px] font-bold text-rose-600 uppercase">Failed</div>
                  <div className="text-2xl font-black text-rose-700 mt-1">{commitResult.failedCount}</div>
                </div>
              </div>

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
                  Close & View Teams List
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
