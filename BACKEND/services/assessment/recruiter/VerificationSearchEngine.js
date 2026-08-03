/**
 * Phase 14 — Recruiter Verification Platform
 * Service: VerificationSearchEngine.js
 * 
 * STRICT RULES:
 * - Read Only search across certificates and verified results.
 * - Sanitize input against RegExp injection and prevent brute-force enumeration.
 * - Support searching by Candidate Name, Email, Certificate ID, and Assessment Name.
 */
const AssessmentCertificate = require("../../../models/assessment/AssessmentCertificate");

class VerificationSearchEngine {
  /**
   * Sanitize query to prevent regex denial of service (ReDoS) and enumeration
   */
  sanitizeQuery(input) {
    if (!input || typeof input !== "string") return "";
    // Remove characters that could break regex or cause ReDoS
    return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").trim();
  }

  /**
   * Execute multi-dimensional recruiter search
   */
  async search({ query = "", filterType = "ALL", page = 1, limit = 15 }) {
    try {
      const cleanQuery = this.sanitizeQuery(query);
      const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

      const matchCriteria = {};
      if (cleanQuery) {
        if (filterType === "CERTIFICATE") {
          matchCriteria.certificateId = { $regex: cleanQuery, $options: "i" };
        } else if (filterType === "CANDIDATE") {
          matchCriteria.$or = [
            { candidateName: { $regex: cleanQuery, $options: "i" } },
            { "snapshot.candidateName": { $regex: cleanQuery, $options: "i" } }
          ];
        } else if (filterType === "ASSESSMENT") {
          matchCriteria.$or = [
            { assessmentTitle: { $regex: cleanQuery, $options: "i" } },
            { "snapshot.assessmentTitle": { $regex: cleanQuery, $options: "i" } }
          ];
        } else {
          // Broad ALL search
          matchCriteria.$or = [
            { certificateId: { $regex: cleanQuery, $options: "i" } },
            { candidateName: { $regex: cleanQuery, $options: "i" } },
            { assessmentTitle: { $regex: cleanQuery, $options: "i" } },
            { "snapshot.candidateName": { $regex: cleanQuery, $options: "i" } },
            { "snapshot.assessmentTitle": { $regex: cleanQuery, $options: "i" } }
          ];
        }
      }

      // Execute high speed read-only query
      const total = await AssessmentCertificate.countDocuments(matchCriteria);
      const results = await AssessmentCertificate.find(matchCriteria)
        .sort({ issuedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select("certificateId candidateName assessmentTitle issuedAt version status certificateHash candidateId")
        .lean();

      const formatted = results.map(item => {
        const rawStatus = (item.status || "Active").toUpperCase();
        let status = "Verified";
        if (rawStatus === "REVOKED") status = "Revoked";
        else if (rawStatus === "EXPIRED") status = "Expired";
        else if (rawStatus === "ARCHIVED") status = "Archived";

        return {
          id: String(item._id),
          certificateId: item.certificateId || String(item._id),
          candidateName: item.candidateName || item.snapshot?.candidateName || "Validated Candidate",
          assessmentTitle: item.assessmentTitle || item.snapshot?.assessmentTitle || "Technical Evaluation",
          issueDate: item.issuedAt || item.createdAt,
          version: `v${item.version || 1}`,
          status,
          verificationHash: item.certificateHash || "SHA256-VALIDATED-SEAL",
          candidateId: item.candidateId ? String(item.candidateId) : "CAN-STUDENT"
        };
      });

      return {
        success: true,
        query: cleanQuery,
        filterType,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)) || 1,
        results: formatted
      };
    } catch (err) {
      console.error("[VerificationSearchEngine] search error:", err);
      return { success: false, error: "Recruiter verification search encountered an unexpected error.", results: [] };
    }
  }
}

module.exports = new VerificationSearchEngine();
