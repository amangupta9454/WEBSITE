/**
 * Phase 14 — Recruiter Verification Platform
 * Controller: recruiterController.js
 * 
 * STRICT RULES:
 * - Read-Only API handlers. Zero mutation of students, assessments, or results.
 * - Protect internal endpoints with JWT / verifyAdmin authorization.
 * - Secure public verification against sensitive data exposure and enumeration.
 */
const recruiterEngine = require("../../services/assessment/recruiter/RecruiterVerificationEngine");

class RecruiterController {
  /**
   * GET /api/public/assessment/verify/:certificateId
   * Public credential verification gateway (Rate limited & zero sensitive info)
   */
  async publicVerifyCertificate(req, res) {
    try {
      const { certificateId } = req.params;
      const ipAddress = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "0.0.0.0";
      const userAgent = req.headers["user-agent"] || "Public Verifier";
      const referer = req.headers["referer"] || null;

      const result = await recruiterEngine.verifyPublicCredential({
        certificateId,
        ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : String(ipAddress).split(",")[0],
        userAgent,
        referer
      });

      if (!result.success && result.status === "Unknown") {
        return res.status(404).json({ success: false, status: "Unknown", message: result.message });
      }

      return res.status(200).json(result);
    } catch (err) {
      console.error("[RecruiterController] publicVerifyCertificate error:", err);
      return res.status(500).json({ success: false, status: "Unknown", message: "Internal verification gateway error." });
    }
  }

  /**
   * GET /api/admin/assessment/recruiter/dashboard
   * Admin/Recruiter verification KPIs and employer intelligence
   */
  async getDashboard(req, res) {
    try {
      const result = await recruiterEngine.getDashboardSummary();
      if (!result.success) {
        return res.status(500).json(result);
      }
      return res.status(200).json(result);
    } catch (err) {
      console.error("[RecruiterController] getDashboard error:", err);
      return res.status(500).json({ success: false, error: "Failed to fetch recruiter dashboard data." });
    }
  }

  /**
   * GET /api/admin/assessment/recruiter/search
   * Sanitized multi-field recruiter search
   */
  async search(req, res) {
    try {
      const { query = "", filterType = "ALL", page = 1, limit = 15 } = req.query;
      const result = await recruiterEngine.search({ query, filterType, page, limit });
      return res.status(200).json(result);
    } catch (err) {
      console.error("[RecruiterController] search error:", err);
      return res.status(500).json({ success: false, error: "Recruiter search failed." });
    }
  }

  /**
   * GET /api/admin/assessment/recruiter/history
   * Immutable verification audit trail
   */
  async getHistory(req, res) {
    try {
      const { page = 1, limit = 20, status = null, method = null, search = null } = req.query;
      const result = await recruiterEngine.getVerificationHistory({ page, limit, status, method, search });
      return res.status(200).json(result);
    } catch (err) {
      console.error("[RecruiterController] getHistory error:", err);
      return res.status(500).json({ success: false, error: "Failed to retrieve verification history." });
    }
  }

  /**
   * GET /api/admin/assessment/recruiter/candidate/:id
   * Complete candidate verification profile & passed assessments
   */
  async getCandidate(req, res) {
    try {
      const { id } = req.params;
      const result = await recruiterEngine.getCandidateById(id);
      if (!result.success) {
        return res.status(404).json(result);
      }
      return res.status(200).json(result);
    } catch (err) {
      console.error("[RecruiterController] getCandidate error:", err);
      return res.status(500).json({ success: false, error: "Failed to load candidate verification record." });
    }
  }

  /**
   * GET /api/admin/assessment/recruiter/certificate/:id
   * Detailed credential audit inspection
   */
  async getCertificate(req, res) {
    try {
      const { id } = req.params;
      const ipAddress = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "0.0.0.0";
      const userAgent = req.headers["user-agent"] || "Admin Console";
      const verifiedBy = req.user?.name || req.user?.email || "Admin Verifier";

      const result = await recruiterEngine.verifyCertificate({
        certificateId: id,
        verificationMethod: "CERTIFICATE_ID",
        verifiedBy,
        companyName: "Internal Admin Governance",
        ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : String(ipAddress).split(",")[0],
        userAgent
      });

      if (!result.success) {
        return res.status(404).json(result);
      }
      return res.status(200).json(result);
    } catch (err) {
      console.error("[RecruiterController] getCertificate error:", err);
      return res.status(500).json({ success: false, error: "Failed to audit certificate." });
    }
  }

  /**
   * GET /api/admin/assessment/recruiter/export
   * Multi-format verification audit export
   */
  async exportReport(req, res) {
    try {
      const { format = "csv", limit = 500 } = req.query;
      const result = await recruiterEngine.generateExport({ format, limit });
      
      if (!result.success) {
        return res.status(500).json(result);
      }

      if (result.format === "csv") {
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="CodeANova_Verification_Audit_${Date.now()}.csv"`);
        return res.status(200).send(result.data);
      }

      return res.status(200).json(result);
    } catch (err) {
      console.error("[RecruiterController] exportReport error:", err);
      return res.status(500).json({ success: false, error: "Export compilation failed." });
    }
  }
}

module.exports = new RecruiterController();
