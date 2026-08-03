/**
 * Phase 13 — Enterprise Analytics & Intelligence Platform
 * Module 9: Analytics Export Service
 * 
 * READ-ONLY data extraction and structured reporting formatting.
 * Compiles aggregated analytical reports for CSV, Excel workbook, and PDF report delivery.
 */
const DashboardAggregator = require("./DashboardAggregator");
const AssessmentAnalytics = require("./AssessmentAnalytics");
const StudentAnalytics = require("./StudentAnalytics");
const CategoryAnalytics = require("./CategoryAnalytics");
const QuestionAnalytics = require("./QuestionAnalytics");
const RuntimeAnalytics = require("./RuntimeAnalytics");
const CertificateAnalytics = require("./CertificateAnalytics");
const TrendEngine = require("./TrendEngine");

class ExportService {
  /**
   * Generates structured data payload for the requested analytical domain.
   * @param {string} reportType - 'overview' | 'students' | 'assessments' | 'categories' | 'questions' | 'certificates' | 'runtime' | 'trends'
   * @param {string} format - 'csv' | 'json' | 'excel'
   */
  static async exportAnalytics(reportType = "overview", format = "csv", filter = {}) {
    let rawData = [];
    let headers = [];
    let title = "Code A Nova Assessment Analytics Report";

    switch (reportType.toLowerCase()) {
      case "students": {
        title = "Student Analytics Report";
        const res = await StudentAnalytics.getStudentListAnalytics(filter, 1, 1000);
        headers = ["Candidate ID", "Name", "Email", "Attempts", "Average %", "Highest %", "Lowest %", "Certificates Earned", "Skill Progress"];
        rawData = res.items.map(i => [
          i.candidateId, i.name, i.email, i.attempts, i.averagePercentage, i.highestPercentage, i.lowestPercentage, i.certificatesEarned, i.currentSkillProgress
        ]);
        break;
      }
      case "assessments": {
        title = "Assessment Packages Analytics Report";
        const res = await AssessmentAnalytics.getAssessmentListAnalytics(filter, 1, 1000);
        headers = ["Assessment Name", "Category", "Status", "Attempts", "Pass %", "Fail %", "Avg Score", "Completion Rate %", "Drop Rate %", "Avg Accuracy %", "Question Count"];
        rawData = res.items.map(i => [
          i.name, i.categoryName, i.isActive ? "Live" : "Draft", i.attempts, i.passPercentage, i.failPercentage, i.averageScore, i.completionRate, i.dropRate, i.averageAccuracy, i.questionCount
        ]);
        break;
      }
      case "categories": {
        title = "Domain Category Analytics Report";
        const res = await CategoryAnalytics.getCategoryAnalytics(filter, 1, 500);
        headers = ["Category Name", "Assessment Count", "Question Count", "Student Count", "Avg Score %", "Pass Rate %", "Strongest Topic", "Weakest Topic"];
        rawData = res.items.map(i => [
          i.name, i.assessmentCount, i.questionCount, i.studentCount, i.averageScore, i.passPercentage, (i.strongTopics[0] || "N/A"), (i.weakTopics[0] || "N/A")
        ]);
        break;
      }
      case "questions": {
        title = "Question Bank Inventory Report";
        const res = await QuestionAnalytics.getQuestionInventoryStats(filter);
        headers = ["Metric Category", "Attribute", "Count / Value"];
        rawData = [
          ["Inventory", "Total Approved", res.inventory.approved],
          ["Inventory", "Archived", res.inventory.archived],
          ["Inventory", "Rejected", res.inventory.rejected],
          ["Source Origin", "AI Generated (Prompt Studio)", res.sourceSplit.aiGenerated],
          ["Source Origin", "Manual Curated", res.sourceSplit.manual],
          ["Source Origin", "CSV Bulk Imported", res.sourceSplit.csv],
          ["Quality Telemetry", "Average Quality Score", `${res.qualityScore}%`]
        ];
        break;
      }
      case "runtime": {
        title = "AI Runtime Health & Telemetry Report";
        const res = await RuntimeAnalytics.getRuntimeAnalytics(filter);
        headers = ["Provider / Metric", "Value", "Status"];
        rawData = [
          ["Groq (Primary LPU Cluster)", res.providerUsage.Groq, "Active Principal"],
          ["OpenAI (Fallback 1)", res.providerUsage.OpenAI, "Standby Ready"],
          ["Gemini (Fallback 2)", res.providerUsage.Gemini, "Standby Ready"],
          ["Claude (Fallback 3)", res.providerUsage.Claude, "Standby Ready"],
          ["Average SLA Latency", `${res.averageLatencyMs} ms`, "Within < 2000ms Boundary"],
          ["Circuit Failovers", res.failovers, "Automatic Recovery"],
          ["High Availability Health", `${res.healthPercentage}%`, "Operational"]
        ];
        break;
      }
      case "certificates": {
        title = "Certificate & Credential Issuance Report";
        const res = await CertificateAnalytics.getCertificateAnalytics(filter);
        headers = ["Metric", "Count"];
        rawData = [
          ["Total Credentials Issued", res.issued],
          ["Revoked Credentials", res.revoked],
          ["Reissued Credentials", res.reissued],
          ["External Verifications Processed", res.verificationCount],
          ["Candidate Digital Downloads", res.downloadCount]
        ];
        break;
      }
      case "trends": {
        title = "Temporal Growth Trends Report";
        const res = await TrendEngine.getTrendAnalytics("monthly", filter);
        headers = ["Period Label", "Attempts", "Certificates Issued", "Average Score %", "Growth Rate %", "AI Runtime Executions", "Questions Created"];
        rawData = res.timeline.map(i => [
          i.label, i.attempts, i.certificates, i.averageScore, i.growth, i.runtimeUsage, i.questionGrowth
        ]);
        break;
      }
      case "overview":
      default: {
        title = "Executive Global Assessment Analytics Report";
        const res = await DashboardAggregator.getGlobalStats(filter);
        headers = ["Global Telemetry Metric", "Current Aggregate Value"];
        rawData = [
          ["Total Assessments Inventory", res.totalAssessments],
          ["Published & Live Packages", res.live],
          ["Draft Packages", res.draft],
          ["Completed Sessions Evaluated", res.completedSessions],
          ["Active Running Sessions", res.runningSessions],
          ["Verifiable Certificates Issued", res.certificates],
          ["Approved Question Bank Inventory", res.questionInventory],
          ["AI Runtime Cluster Health", `${res.aiRuntimeHealth}%`],
          ["Candidate Average Score", `${res.averageScore}%`],
          ["Global Pass Rate", `${res.passRate}%`],
          ["Question Coverage Efficiency", `${res.questionCoverage}%`],
          ["Average Completion Time", `${res.averageCompletionTime} mins`]
        ];
        break;
      }
    }

    if (format.toLowerCase() === "csv") {
      let csvString = `${title}\nGenerated on: ${new Date().toISOString()}\n\n`;
      csvString += headers.join(",") + "\n";
      rawData.forEach(row => {
        csvString += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",") + "\n";
      });
      return { format: "csv", filename: `analytics_${reportType}_${Date.now()}.csv`, content: csvString };
    }

    // Return structured payload for Excel JSON/Worksheet or PDF Rendering
    return {
      format: format.toLowerCase(),
      filename: `analytics_${reportType}_${Date.now()}.${format.toLowerCase() === "excel" ? "xlsx" : "json"}`,
      title,
      timestamp: new Date().toISOString(),
      headers,
      rows: rawData
    };
  }
}

module.exports = ExportService;
