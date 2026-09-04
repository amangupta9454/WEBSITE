const crypto = require('crypto');
const HackathonCertificate = require('../models/HackathonCertificate');
const HackathonResult = require('../models/HackathonResult');
const HackathonTeam = require('../models/HackathonTeam');
const HackathonSetting = require('../models/HackathonSetting');
const HackathonAuditLog = require('../models/HackathonAuditLog');

class HackathonCertificateService {
  /**
   * Generates a deterministic unique certificate number: CAN-2026-XXXXXX
   */
  generateCertificateNumber() {
    const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `CAN-2026-${randomPart}`;
  }

  /**
   * Generates a cryptographically secure verification code
   */
  generateVerificationCode() {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Builds high-fidelity printable HTML for the certificate
   */
  buildCertificateHtml({
    certificateNumber,
    verificationCode,
    recipientName,
    recipientRole,
    award,
    type,
    rank,
    projectName,
    track,
    issueDate,
    clientUrl,
  }) {
    const formattedDate = new Date(issueDate || Date.now()).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const verifyUrl = `${clientUrl || 'https://code-a-nova.online'}/hackathon/certificate/verify/${verificationCode}`;

    const isTopWinner = type === 'WINNER' || rank === 1;
    const isRunnerUp = type === 'RUNNER_UP' || (rank && rank <= 3);

    const primaryColor = isTopWinner ? '#d97706' : isRunnerUp ? '#4f46e5' : '#0284c7';
    const borderColor = isTopWinner ? '#f59e0b' : isRunnerUp ? '#6366f1' : '#38bdf8';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Code-A-Nova Hackathon Certificate - ${certificateNumber}</title>
  <style>
    @page { size: A4 landscape; margin: 0; }
    * { box-sizing: border-box; }
    body {
      margin: 0; padding: 24px; font-family: 'Helvetica Neue', Arial, sans-serif;
      background-color: #0b0f19; color: #1e293b; display: flex; justify-content: center; align-items: center; min-height: 100vh;
    }
    .cert-container {
      width: 1020px; height: 720px; background: #ffffff; border: 12px solid #0f172a; position: relative;
      padding: 36px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); border-radius: 16px; overflow: hidden;
      background-image: radial-gradient(#e2e8f0 1.2px, transparent 0); background-size: 20px 20px;
    }
    .inner-border {
      width: 100%; height: 100%; border: 3px solid ${borderColor}; padding: 28px 36px;
      display: flex; flex-direction: column; justify-content: space-between; position: relative; background: #ffffff; border-radius: 8px;
    }
    .cert-header { text-align: center; }
    .org-title { font-size: 22px; font-weight: 900; color: #0f172a; letter-spacing: 3px; text-transform: uppercase; margin: 0; }
    .org-sub { font-size: 11px; font-weight: 700; color: ${primaryColor}; letter-spacing: 4px; text-transform: uppercase; margin-top: 4px; }
    .cert-title { font-size: 34px; font-weight: 900; color: #0f172a; margin: 16px 0 6px; font-family: 'Georgia', serif; font-style: italic; }
    .cert-lead { font-size: 14px; color: #64748b; margin: 4px 0 10px; }
    .recipient-name { font-size: 34px; font-weight: 800; color: #0f172a; margin: 10px 0; border-bottom: 2px solid #cbd5e1; display: inline-block; padding: 0 32px 6px; }
    .cert-body { text-align: center; font-size: 14px; color: #334155; line-height: 1.6; max-width: 820px; margin: 0 auto; }
    .award-pill { display: inline-block; background: ${primaryColor}15; color: ${primaryColor}; border: 1px solid ${borderColor}; padding: 6px 20px; border-radius: 20px; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin: 8px 0; }
    .project-highlight { font-weight: 800; color: #0f172a; }
    .cert-footer { display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 16px; }
    .footer-col { font-size: 11px; color: #64748b; }
    .sig-line { width: 160px; border-bottom: 1px solid #0f172a; margin-bottom: 6px; }
    .sig-name { font-weight: 800; color: #0f172a; font-size: 12px; }
    .sig-title { font-size: 10px; color: #64748b; }
    .cert-meta { font-family: monospace; font-size: 10px; color: #475569; }
    .badge-seal {
      position: absolute; bottom: 85px; right: 80px; width: 84px; height: 84px; border-radius: 50%;
      background: ${primaryColor}; color: #ffffff; display: flex; flex-direction: column; align-items: center; justify-content: center;
      text-align: center; font-size: 9px; font-weight: 900; border: 3px dashed #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.15);
      transform: rotate(-10deg); letter-spacing: 0.5px;
    }
    .print-btn-bar { text-align: center; margin-bottom: 16px; }
    @media print {
      body { background-color: #ffffff; padding: 0; }
      .print-btn-bar { display: none; }
      .cert-container { box-shadow: none; width: 100%; height: 100vh; border: none; }
    }
  </style>
</head>
<body>
  <div style="display: flex; flex-direction: column; align-items: center;">
    <div class="print-btn-bar">
      <button onclick="window.print()" style="padding: 8px 20px; font-size: 12px; font-weight: bold; background: #4f46e5; color: #fff; border: none; border-radius: 8px; cursor: pointer;">
        Print / Save as PDF
      </button>
    </div>
    <div class="cert-container">
      <div class="inner-border">
        <div class="cert-header">
          <div class="org-title">Code-A-Nova National Hackathon</div>
          <div class="org-sub">Official Certificate of Recognition • 2026 Edition</div>
          <div class="cert-title">${award}</div>
          <div class="cert-lead">This authoritative credential is proudly presented to</div>
          <div class="recipient-name">${recipientName}</div>
        </div>

        <div class="cert-body">
          <p>
            for meritorious demonstration of technical innovation, engineering excellence, and problem-solving prowess
            in the <strong>${track}</strong> track with the project <span class="project-highlight">"${projectName || 'Innovator Prototype'}"</span>.
          </p>
          <div>
            <span class="award-pill">${award}${rank ? ` • Rank #${rank}` : ''}</span>
          </div>
        </div>

        <div class="badge-seal">
          <span>CODE-A-NOVA</span>
          <span style="font-size: 14px; margin: 2px 0;">★</span>
          <span>VERIFIED</span>
        </div>

        <div class="cert-footer">
          <div class="footer-col" style="text-align: left;">
            <div class="cert-meta">Certificate No: <strong>${certificateNumber}</strong></div>
            <div class="cert-meta">Issue Date: <strong>${formattedDate}</strong></div>
            <div class="cert-meta" style="margin-top: 4px;">
              Verify Online: <a href="${verifyUrl}" target="_blank" style="color: #4f46e5; text-decoration: none;">${verifyUrl}</a>
            </div>
          </div>

          <div class="footer-col" style="text-align: right;">
            <div class="sig-line"></div>
            <div class="sig-name">Organizing Committee</div>
            <div class="sig-title">Code-A-Nova Hackathon 2026</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Generates all eligible certificates for a hackathon
   */
  async generateAllEligibleCertificates({ hackathonId = 'can-hackathon-2026', adminId, actorDetails }) {
    const settings = await HackathonSetting.findOne({ hackathonId }).lean();
    const isPublished = settings?.isResultsPublished;

    // Fetch official results
    const results = await HackathonResult.find({
      hackathonId,
      resultStatus: { $in: ['APPROVED', 'PUBLISHED', 'LOCKED'] },
    }).lean();

    const resultMap = new Map();
    for (const r of results) {
      resultMap.set(r.teamId, r);
    }

    // Fetch confirmed teams
    const teams = await HackathonTeam.find({
      hackathonId,
      status: { $in: ['CONFIRMED', 'SUBMITTED', 'RESULT_PUBLISHED', 'EVALUATED'] },
      isDeleted: false,
    }).lean();

    let generatedCount = 0;
    let skippedCount = 0;
    const errors = [];
    const clientUrl = process.env.CLIENT_URL || 'https://code-a-nova.online';

    for (const team of teams) {
      const res = resultMap.get(team.teamId);

      // Determine award and certificate type
      let certType = 'PARTICIPATION';
      let awardTitle = 'Certificate of Participation';
      let rank = null;
      let score = null;

      if (res) {
        score = res.finalScore;
        rank = res.rank;

        if (res.isWinner || res.rank === 1) {
          certType = 'WINNER';
          awardTitle = res.category || 'Winner (1st Place)';
        } else if (res.isRunnerUp || (res.rank && res.rank <= 3)) {
          certType = 'RUNNER_UP';
          awardTitle = res.category || (res.rank === 2 ? '1st Runner Up' : '2nd Runner Up');
        } else if (res.category && res.category !== 'General') {
          certType = 'SPECIAL_AWARD';
          awardTitle = res.category;
        } else if (team.status === 'SUBMITTED' || team.status === 'RESULT_PUBLISHED') {
          certType = 'FINALIST';
          awardTitle = 'National Finalist';
        }
      }

      // Collect all team recipients: Leader + each Member
      const recipients = [];
      if (team.leader?.name && team.leader?.email) {
        recipients.push({
          name: team.leader.name,
          email: team.leader.email.toLowerCase().trim(),
          role: 'LEADER',
          college: team.leader.college || '',
        });
      }

      if (Array.isArray(team.members)) {
        for (const m of team.members) {
          if (m.name && m.email) {
            recipients.push({
              name: m.name,
              email: m.email.toLowerCase().trim(),
              role: 'MEMBER',
              college: m.college || '',
            });
          }
        }
      }

      for (const rec of recipients) {
        try {
          // Check for existing active certificate of same type
          const existing = await HackathonCertificate.findOne({
            hackathonId,
            recipientEmail: rec.email,
            type: certType,
            version: 1,
          });

          if (existing) {
            skippedCount++;
            continue;
          }

          const certId = `CAN-2026-CERT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
          const certNumber = this.generateCertificateNumber();
          const verificationCode = this.generateVerificationCode();
          const verificationUrl = `${clientUrl}/hackathon/certificate/verify/${verificationCode}`;

          const htmlContent = this.buildCertificateHtml({
            certificateNumber: certNumber,
            verificationCode,
            recipientName: rec.name,
            recipientRole: rec.role,
            award: awardTitle,
            type: certType,
            rank,
            projectName: team.initialIdea?.title || team.submittedLinks?.projectName || team.teamName,
            track: team.track || 'General',
            issueDate: new Date(),
            clientUrl,
          });

          await HackathonCertificate.create({
            hackathonId,
            certificateId: certId,
            certificateNumber: certNumber,
            verificationCode,
            type: certType,
            teamId: team.teamId,
            team: team._id,
            resultId: res ? res._id : null,
            recipientName: rec.name,
            recipientEmail: rec.email,
            recipientRole: rec.role,
            recipientCollege: rec.college,
            projectName: team.initialIdea?.title || team.submittedLinks?.projectName || team.teamName,
            track: team.track || 'General',
            award: awardTitle,
            rank,
            score,
            issuedAt: new Date(),
            generatedAt: new Date(),
            generatedBy: adminId || null,
            verificationUrl,
            htmlContent,
            status: 'ISSUED',
          });

          generatedCount++;
        } catch (err) {
          errors.push({ recipient: rec.email, error: err.message });
        }
      }
    }

    // Log to audit trail
    await HackathonAuditLog.create({
      actorId: actorDetails?.id || adminId || 'admin',
      actorName: actorDetails?.name || 'Admin',
      actorEmail: actorDetails?.email || '',
      role: 'admin',
      action: 'CERTIFICATE_GENERATED',
      targetEntity: 'HackathonCertificate',
      targetId: hackathonId,
      newState: { generatedCount, skippedCount, errorsCount: errors.length },
      reason: 'Bulk generation of eligible hackathon certificates',
    });

    return {
      success: true,
      generatedCount,
      skippedCount,
      errorsCount: errors.length,
      errors,
    };
  }

  /**
   * Revokes a certificate
   */
  async revokeCertificate({ certificateId, reason, adminId, actorDetails }) {
    if (!reason || !reason.trim()) {
      throw new Error('Revocation reason is required.');
    }

    const cert = await HackathonCertificate.findOne({
      $or: [{ certificateId }, { certificateNumber: certificateId }],
    });

    if (!cert) {
      throw new Error('Certificate not found.');
    }

    if (cert.isRevoked) {
      return { success: true, message: 'Certificate is already revoked.', certificate: cert };
    }

    cert.isRevoked = true;
    cert.status = 'REVOKED';
    cert.revokedAt = new Date();
    cert.revokedBy = adminId || null;
    cert.revocationReason = reason.trim();
    await cert.save();

    await HackathonAuditLog.create({
      actorId: actorDetails?.id || adminId || 'admin',
      actorName: actorDetails?.name || 'Admin',
      actorEmail: actorDetails?.email || '',
      role: 'admin',
      action: 'CERTIFICATE_REVOKED',
      targetEntity: 'HackathonCertificate',
      targetId: cert.certificateNumber,
      previousState: { status: 'ISSUED', isRevoked: false },
      newState: { status: 'REVOKED', isRevoked: true, reason: cert.revocationReason },
      reason: cert.revocationReason,
    });

    return { success: true, certificate: cert };
  }

  /**
   * Public verification query (strips all private details)
   */
  async verifyCertificate(verificationCode) {
    if (!verificationCode) {
      return { isValid: false, message: 'Verification code required.' };
    }

    const cert = await HackathonCertificate.findOne({
      $or: [
        { verificationCode: verificationCode.trim() },
        { certificateNumber: verificationCode.trim().toUpperCase() },
        { certificateId: verificationCode.trim().toUpperCase() },
      ],
    }).lean();

    if (!cert) {
      return {
        isValid: false,
        message: 'Certificate not found. The code does not match our official records.',
      };
    }

    if (cert.isRevoked) {
      return {
        isValid: false,
        isRevoked: true,
        revokedAt: cert.revokedAt,
        revocationReason: cert.revocationReason || 'Revoked by organizers',
        certificateNumber: cert.certificateNumber,
        recipientName: cert.recipientName,
        award: cert.award,
        hackathonName: 'Code-A-Nova National Hackathon 2026',
        message: 'This certificate was officially issued but has been REVOKED.',
      };
    }

    return {
      isValid: true,
      isRevoked: false,
      certificateNumber: cert.certificateNumber,
      recipientName: cert.recipientName,
      type: cert.type,
      award: cert.award,
      rank: cert.rank,
      projectName: cert.projectName,
      track: cert.track,
      issueDate: cert.issuedAt,
      hackathonName: 'Code-A-Nova National Hackathon 2026',
      status: cert.status,
    };
  }
}

module.exports = new HackathonCertificateService();
