const puppeteer = require('puppeteer');

/**
 * Generates a PDF buffer from an AI Evaluation object.
 * @param {Object} aiEvaluation - The parsed JSON evaluation from AI
 * @param {Object} user - The user object
 * @param {Object} session - The interview session object
 * @returns {Promise<Buffer>} - The generated PDF buffer
 */
const generateFeedbackPDF = async (aiEvaluation, user, session) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    });

    const page = await browser.newPage();
    
    // Construct HTML content
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Interview Feedback</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        body {
          font-family: 'Inter', sans-serif;
          color: #1e293b;
          line-height: 1.6;
          margin: 0;
          padding: 40px;
          background: #f8fafc;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e2e8f0;
        }
        .header h1 {
          color: #3b82f6;
          margin: 0 0 10px 0;
          font-size: 28px;
        }
        .header p {
          color: #64748b;
          margin: 0;
          font-size: 14px;
        }
        .section {
          background: #ffffff;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
        .section-title {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          margin-top: 0;
          margin-bottom: 16px;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 8px;
        }
        .scores-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        .score-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
        }
        .score-title {
          font-size: 14px;
          font-weight: 600;
          color: #475569;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .score-value {
          font-size: 24px;
          font-weight: 800;
          color: #3b82f6;
        }
        .score-evidence {
          font-size: 12px;
          color: #64748b;
          margin-top: 8px;
        }
        .list-item {
          margin-bottom: 8px;
          padding-left: 20px;
          position: relative;
        }
        .list-item::before {
          content: "•";
          color: #3b82f6;
          position: absolute;
          left: 0;
          font-weight: bold;
        }
        .pill {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 600;
          margin-right: 8px;
          margin-bottom: 8px;
        }
        .pill-blue { background: #dbeafe; color: #1e40af; }
        .pill-green { background: #dcfce3; color: #166534; }
        .footer {
          text-align: center;
          margin-top: 40px;
          font-size: 12px;
          color: #94a3b8;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Detailed AI Interview Feedback</h1>
        <p>Candidate: <strong>${user.name || 'Unknown'}</strong> | Role: <strong>${session.jobTitle || 'Unknown'}</strong></p>
        <p>Date: ${new Date().toLocaleDateString()}</p>
      </div>

      <div class="section">
        <h2 class="section-title">Executive Summary</h2>
        <p style="white-space: pre-line;">${aiEvaluation.executive_summary}</p>
      </div>

      <div class="section">
        <h2 class="section-title">Performance Scores</h2>
        <div class="scores-grid">
          <div class="score-card">
            <div class="score-title">Overall Match</div>
            <div class="score-value">${aiEvaluation.confidence_scores?.overall?.score || 0}/100</div>
            <div class="score-evidence">${aiEvaluation.confidence_scores?.overall?.evidence || ''}</div>
          </div>
          <div class="score-card">
            <div class="score-title">Technical Skills</div>
            <div class="score-value">${aiEvaluation.confidence_scores?.technical?.score || 0}/100</div>
            <div class="score-evidence">${aiEvaluation.confidence_scores?.technical?.evidence || ''}</div>
          </div>
          <div class="score-card">
            <div class="score-title">Behavioral</div>
            <div class="score-value">${aiEvaluation.confidence_scores?.behavioral?.score || 0}/100</div>
            <div class="score-evidence">${aiEvaluation.confidence_scores?.behavioral?.evidence || ''}</div>
          </div>
          <div class="score-card">
            <div class="score-title">Communication</div>
            <div class="score-value">${aiEvaluation.confidence_scores?.communication?.score || 0}/100</div>
            <div class="score-evidence">${aiEvaluation.confidence_scores?.communication?.evidence || ''}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Strengths</h2>
        <div>
          ${(aiEvaluation.strengths || []).map(s => `<div class="list-item">${s}</div>`).join('')}
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Areas for Improvement</h2>
        <div>
          ${(aiEvaluation.weaknesses || []).map(w => `<div class="list-item">${w}</div>`).join('')}
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Skills Assessment</h2>
        <div>
          ${(aiEvaluation.skill_matrix || []).map(skill => `
            <div style="margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <strong>${skill.skill}</strong>
                <span class="pill ${skill.level === 'Expert' ? 'pill-green' : 'pill-blue'}">${skill.level}</span>
              </div>
              <div style="font-size: 12px; color: #64748b;">${skill.evidence}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Final Recommendation</h2>
        <p><strong>Status:</strong> <span style="color: ${aiEvaluation.final_recommendation === 'Hire' ? '#16a34a' : aiEvaluation.final_recommendation === 'Strong Hire' ? '#15803d' : '#ea580c'}">${aiEvaluation.final_recommendation}</span></p>
        <p>${aiEvaluation.recommendation_reason}</p>
        <p style="font-size: 13px; color: #64748b; margin-top: 12px;"><strong>Estimated Level:</strong> ${aiEvaluation.estimated_experience_level}</p>
      </div>

      <div class="footer">
        Powered by Code-A-Nova | Generated securely by AI
      </div>
    </body>
    </html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
    });

    await browser.close();
    return pdfBuffer;
  } catch (error) {
    if (browser) await browser.close();
    console.error("PDF Generation failed:", error);
    throw error;
  }
};

module.exports = { generateFeedbackPDF };
