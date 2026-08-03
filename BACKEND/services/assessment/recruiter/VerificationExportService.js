/**
 * Phase 14 — Recruiter Verification Platform
 * Service: VerificationExportService.js
 * 
 * STRICT RULES:
 * - Read only report extraction for employer verification logs.
 * - Supports exporting as CSV, Excel (JSON structure), and PDF formatting.
 */
const AssessmentVerificationAudit = require("../../../models/assessment/AssessmentVerificationAudit");

class VerificationExportService {
  /**
   * Export verification audit data in requested format
   */
  async generateExport({ format = "csv", limit = 500 }) {
    try {
      const logs = await AssessmentVerificationAudit.find({})
        .sort({ timestamp: -1 })
        .limit(parseInt(limit))
        .lean();

      if (format.toLowerCase() === "csv") {
        const headers = ["Verification ID", "Certificate ID", "Candidate ID", "Verified By", "Company Name", "Method", "Status", "Timestamp", "IP Address"];
        const rows = logs.map(l => [
          `"${l.verificationId || ""}"`,
          `"${l.certificateId || ""}"`,
          `"${l.candidateId || "N/A"}"`,
          `"${l.verifiedBy || ""}"`,
          `"${l.companyName || ""}"`,
          `"${l.verificationMethod || ""}"`,
          `"${l.verificationStatus || ""}"`,
          `"${l.timestamp ? new Date(l.timestamp).toISOString() : ""}"`,
          `"${l.ipAddress || "0.0.0.0"}"`
        ]);

        const csvString = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        return { success: true, format: "csv", contentType: "text/csv", data: csvString };
      }

      if (format.toLowerCase() === "excel" || format.toLowerCase() === "json") {
        // Structured data ready for XLSX / Excel generation or JSON export
        return {
          success: true,
          format: "excel",
          contentType: "application/json",
          exportData: {
            reportTitle: "Code-A-Nova Recruiter Verification & Audit Logs",
            generatedAt: new Date().toISOString(),
            totalRecords: logs.length,
            records: logs
          }
        };
      }

      if (format.toLowerCase() === "pdf") {
        // Prepare summary payload for PDF printing / presentation
        return {
          success: true,
          format: "pdf",
          contentType: "application/json",
          pdfDocument: {
            header: "Code-A-Nova Official Credential Verification Audit Report",
            timestamp: new Date().toISOString(),
            totalEvaluated: logs.length,
            verifiedPercentage: `${Math.round((logs.filter(l => l.verificationStatus === "Verified").length / (logs.length || 1)) * 100)}%`,
            auditStream: logs.slice(0, 100)
          }
        };
      }

      return { success: false, error: "Unsupported export formatting requested." };
    } catch (err) {
      console.error("[VerificationExportService] generateExport error:", err);
      return { success: false, error: "Failed to compile verification export report." };
    }
  }
}

module.exports = new VerificationExportService();
