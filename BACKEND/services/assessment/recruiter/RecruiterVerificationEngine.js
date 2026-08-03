/**
 * Phase 14 — Recruiter Verification Platform
 * Master Orchestrator: RecruiterVerificationEngine.js
 * 
 * STRICT RULES:
 * - This module is ONLY responsible for Certificate Verification, Candidate Verification,
 *   Recruiter Search, Credential Authenticity, Employer Validation, and Public Verification Portal.
 * - MUST NOT Generate Certificates, Modify Certificates, Evaluate Results, Edit Students,
 *   Edit Assessments, Change Scores, Change Sessions, Generate AI, or Update Analytics.
 * - Read Only (except immutable audit logging).
 */
const certificateVerificationEngine = require("./CertificateVerificationEngine");
const candidateVerificationEngine = require("./CandidateVerificationEngine");
const verificationAuditService = require("./VerificationAuditService");
const verificationSearchEngine = require("./VerificationSearchEngine");
const publicVerificationEngine = require("./PublicVerificationEngine");
const employerDashboardAggregator = require("./EmployerDashboardAggregator");
const verificationExportService = require("./VerificationExportService");

class RecruiterVerificationEngine {
  async getDashboardSummary() {
    return employerDashboardAggregator.getDashboardSummary();
  }

  async verifyCertificate(params) {
    return certificateVerificationEngine.verifyCertificate(params);
  }

  async verifyCandidate(params) {
    return candidateVerificationEngine.verifyCandidate(params);
  }

  async getCandidateById(candidateId) {
    return candidateVerificationEngine.getCandidateById(candidateId);
  }

  async search(params) {
    return verificationSearchEngine.search(params);
  }

  async verifyPublicCredential(params) {
    return publicVerificationEngine.verifyPublicCredential(params);
  }

  async getVerificationHistory(params) {
    return verificationAuditService.getVerificationHistory(params);
  }

  async generateExport(params) {
    return verificationExportService.generateExport(params);
  }
}

module.exports = new RecruiterVerificationEngine();
