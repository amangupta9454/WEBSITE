const mailService = require('./mailService');

/**
 * Service to handle Hackathon email communications.
 */
class HackathonEmailService {
  /**
   * Generates a modern, responsive HTML email for shortlisted teams.
   */
  generateShortlistEmailHtml({ teamName, leaderName, track, fee, portalUrl, deadline }) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Congratulations! Team Shortlisted</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 0; color: #334155; }
    .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 36px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px; }
    .header p { margin: 8px 0 0; font-size: 13px; opacity: 0.9; }
    .badge { display: inline-block; background-color: #10b981; color: #ffffff; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.5px; }
    .content { padding: 32px 28px; line-height: 1.6; }
    .welcome-text { font-size: 15px; color: #1e293b; margin-bottom: 20px; }
    .details-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0; }
    .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; }
    .detail-label { color: #64748b; font-weight: 600; }
    .detail-value { color: #0f172a; font-weight: 700; text-align: right; }
    .alert-box { background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 14px 18px; border-radius: 6px; margin: 20px 0; }
    .alert-title { font-weight: 800; font-size: 13px; color: #065f46; margin-bottom: 4px; }
    .alert-desc { font-size: 12px; color: #047857; margin: 0; }
    .btn-container { text-align: center; margin: 30px 0; }
    .cta-btn { display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 800; font-size: 14px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3); }
    .footer { background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">Official Selection</div>
      <h1>Congratulations, Team ${teamName}!</h1>
      <p>Code-A-Nova National Hackathon 2026</p>
    </div>
    <div class="content">
      <p class="welcome-text">
        Dear <strong>${leaderName}</strong>,
      </p>
      <p class="welcome-text">
        We are thrilled to inform you that your team <strong>${teamName}</strong> has been <strong>shortlisted</strong> for the Code-A-Nova National Hackathon! Out of hundreds of ideation submissions on Unstop, your problem statement and proposed approach stood out to our initial evaluation panel.
      </p>

      <div class="details-box">
        <div class="detail-row">
          <span class="detail-label">Team Name:</span>
          <span class="detail-value">${teamName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Team Leader:</span>
          <span class="detail-value">${leaderName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Track:</span>
          <span class="detail-value">${track}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Confirmation Fee:</span>
          <span class="detail-value" style="color: #059669;">₹${fee} / Team</span>
        </div>
        ${deadline ? `
        <div class="detail-row">
          <span class="detail-label">Confirmation Deadline:</span>
          <span class="detail-value" style="color: #d97706;">${new Date(deadline).toLocaleString()}</span>
        </div>` : ''}
      </div>

      <div class="alert-box">
        <div class="alert-title">Important Notice — Single Team Payment:</div>
        <p class="alert-desc">
          The nominal <strong>₹${fee}</strong> participation confirmation fee is charged <strong>ONCE PER TEAM</strong>, NOT per member. As the Team Leader, only you need to complete this one-time confirmation for your entire team.
        </p>
      </div>

      <p class="welcome-text" style="font-size: 13px;">
        Completing your participation confirmation immediately unlocks:
      </p>
      <ul style="font-size: 13px; color: #475569; padding-left: 20px; margin-bottom: 24px;">
        <li>Access to the private <strong>Official Hackathon WhatsApp Community</strong></li>
        <li>Direct mentorship, problem statement refinement sessions & office hours</li>
        <li>Final project submission workspace and prototype judging eligibility</li>
      </ul>

      <div class="btn-container">
        <a href="${portalUrl}" class="cta-btn" target="_blank">Confirm Team Participation (₹${fee}) →</a>
      </div>

      <p style="font-size: 11px; color: #64748b; text-align: center; margin-top: 24px;">
        Can't click the button? Copy and paste this URL into your browser:<br>
        <a href="${portalUrl}" style="color: #4f46e5; word-break: break-all;">${portalUrl}</a>
      </p>
    </div>
    <div class="footer">
      © 2026 Code-A-Nova Technologies. All rights reserved.<br>
      This is an automated notification sent exclusively to the designated Team Leader.
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Sends the shortlist notification email to the Team Leader.
   */
  async sendShortlistEmail({ team, settings, portalUrl }) {
    const leaderEmail = team.leader?.email;
    if (!leaderEmail) {
      throw new Error(`Team ${team.teamId} does not have a valid leader email.`);
    }

    const effectiveFee = settings?.participationFee ?? 49;
    const effectivePortalUrl = portalUrl || process.env.CLIENT_URL || 'https://code-a-nova.online/hackathon';
    const deadline = settings?.submissionDeadline || null;

    const html = this.generateShortlistEmailHtml({
      teamName: team.teamName,
      leaderName: team.leader?.name || 'Team Leader',
      track: team.track || 'General Track',
      fee: effectiveFee,
      portalUrl: effectivePortalUrl,
      deadline,
    });

    const subject = `Congratulations! Your team "${team.teamName}" has been shortlisted for Code-A-Nova Hackathon`;

    return await mailService.sendEmail({
      to: leaderEmail,
      subject,
      html,
      recipientName: team.leader?.name || 'Team Leader',
      campaign: 'Hackathon Shortlist Notification',
      source: 'Hackathon Phase 4 System',
    });
  }

  /**
   * Generates and sends a welcome notification to newly provisioned editorial members.
   * NOTE: Never includes plaintext password. Instructs user to use admin-provided initial credential
   * and change password on first login.
   */
  async sendEditorialWelcomeEmail({ email, name, loginUrl }) {
    if (!email) return { success: false, error: 'Recipient email required' };

    const effectiveLoginUrl = loginUrl || `${process.env.CLIENT_URL || 'https://code-a-nova.online'}/editorial/login`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Code-A-Nova Hackathon Editorial Panel Invitation</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 36px 24px; text-align: center; color: #ffffff; }
    .badge { display: inline-block; background-color: #6366f1; color: #ffffff; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; margin-bottom: 12px; }
    .content { padding: 32px 28px; line-height: 1.6; color: #334155; }
    .cred-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0; }
    .cta-btn { display: inline-block; background: #4f46e5; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 800; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">Official Editorial Panel</div>
      <h1 style="margin:0;font-size:22px;">Welcome to Code-A-Nova Hackathon</h1>
      <p style="margin:8px 0 0;font-size:13px;opacity:0.8;">Editorial & Evaluation Workspace</p>
    </div>
    <div class="content">
      <p>Dear <strong>${name}</strong>,</p>
      <p>You have been officially provisioned as an Editorial / Judge member for the <strong>Code-A-Nova National Hackathon</strong>.</p>
      <div class="cred-box">
        <p style="margin:0 0 8px 0;font-size:13px;"><strong>Login Email:</strong> ${email}</p>
        <p style="margin:0 0 8px 0;font-size:13px;"><strong>Initial Password:</strong> As configured by Hackathon Administrators</p>
        <p style="margin:0;font-size:12px;color:#dc2626;"><strong>Security Notice:</strong> You will be prompted to update your password immediately upon your first login.</p>
      </div>
      <div style="text-align:center;margin:30px 0;">
        <a href="${effectiveLoginUrl}" class="cta-btn">Access Editorial Dashboard</a>
      </div>
      <p style="font-size:12px;color:#64748b;">If you have any questions or require credentials assistance, please contact the hackathon organizing committee.</p>
    </div>
  </div>
</body>
</html>`;

    return await mailService.sendEmail({
      to: email,
      subject: 'Code-A-Nova Hackathon — Editorial Panel Invitation & Workspace Access',
      html,
      recipientName: name,
      campaign: 'Hackathon Editorial Invitation',
      source: 'Hackathon Phase 6 System',
    });
  }

  /**
   * Sends certificate notification email with verification link
   */
  async sendCertificateEmail({ email, name, award, certificateNumber, verificationUrl, downloadUrl }) {
    if (!email) return { success: false, error: 'Recipient email required' };

    const clientUrl = process.env.CLIENT_URL || 'https://code-a-nova.online';
    const effectiveVerifyUrl = verificationUrl || `${clientUrl}/hackathon/certificate/verify/${certificateNumber}`;
    const effectiveDownloadUrl = downloadUrl || `${clientUrl}/hackathon#team-status`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Your Code-A-Nova Hackathon Certificate is Ready 🎉</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%); padding: 36px 24px; text-align: center; color: #ffffff; }
    .badge { display: inline-block; background-color: #f59e0b; color: #0f172a; font-size: 11px; font-weight: 900; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; margin-bottom: 12px; }
    .content { padding: 32px 28px; line-height: 1.6; color: #334155; }
    .cert-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0; }
    .cta-btn { display: inline-block; background: #4f46e5; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 800; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">Official Credential</div>
      <h1 style="margin:0;font-size:22px;">Your Hackathon Certificate is Ready!</h1>
      <p style="margin:8px 0 0;font-size:13px;opacity:0.9;">Code-A-Nova National Hackathon 2026</p>
    </div>
    <div class="content">
      <p>Dear <strong>${name}</strong>,</p>
      <p>Congratulations on your participation and achievement in the Code-A-Nova National Hackathon! Your official verifiable certificate has been issued by the organizing committee.</p>
      <div class="cert-box">
        <p style="margin:0 0 8px 0;font-size:13px;"><strong>Award / Recognition:</strong> ${award}</p>
        <p style="margin:0 0 8px 0;font-size:13px;"><strong>Certificate Number:</strong> ${certificateNumber}</p>
        <p style="margin:0;font-size:12px;color:#475569;">You can view, download, or verify this credential online at any time.</p>
      </div>
      <div style="text-align:center;margin:30px 0;">
        <a href="${effectiveDownloadUrl}" class="cta-btn">Access My Certificate</a>
      </div>
      <p style="font-size:12px;color:#64748b;text-align:center;">
        Public Verification Link: <br/>
        <a href="${effectiveVerifyUrl}" style="color:#4f46e5;">${effectiveVerifyUrl}</a>
      </p>
    </div>
  </div>
</body>
</html>`;

    return await mailService.sendEmail({
      to: email,
      subject: `Your Code-A-Nova Hackathon Certificate is Ready 🎉 (${certificateNumber})`,
      html,
      recipientName: name,
      campaign: 'Hackathon Certificate Delivery',
      source: 'Hackathon Phase 8 System',
    });
  }

  /**
   * Sends prize fulfillment update notification
   */
  async sendPrizeFulfillmentEmail({ email, name, award, prizeName, fulfillmentStatus, message }) {
    if (!email) return { success: false, error: 'Recipient email required' };

    const clientUrl = process.env.CLIENT_URL || 'https://code-a-nova.online';

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Code-A-Nova Hackathon — Prize Fulfillment Update</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #065f46 0%, #047857 100%); padding: 36px 24px; text-align: center; color: #ffffff; }
    .badge { display: inline-block; background-color: #10b981; color: #ffffff; font-size: 11px; font-weight: 900; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; margin-bottom: 12px; }
    .content { padding: 32px 28px; line-height: 1.6; color: #334155; }
    .status-box { background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 24px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">Prize Department</div>
      <h1 style="margin:0;font-size:22px;">Prize Fulfillment Update</h1>
      <p style="margin:8px 0 0;font-size:13px;opacity:0.9;">Code-A-Nova National Hackathon 2026</p>
    </div>
    <div class="content">
      <p>Dear <strong>${name}</strong>,</p>
      <p>We are writing with an update regarding your team's prize fulfillment for your award in the Code-A-Nova Hackathon.</p>
      <div class="status-box">
        <p style="margin:0 0 8px 0;font-size:13px;"><strong>Award:</strong> ${award}</p>
        <p style="margin:0 0 8px 0;font-size:13px;"><strong>Prize:</strong> ${prizeName}</p>
        <p style="margin:0;font-size:13px;color:#047857;"><strong>Fulfillment Status:</strong> ${fulfillmentStatus}</p>
      </div>
      ${message ? `<p style="font-size:13px;color:#1e293b;">${message}</p>` : ''}
      <p style="font-size:12px;color:#64748b;">If you need assistance or have questions, you may view your status in the hackathon portal.</p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${clientUrl}/hackathon#team-status" style="display:inline-block;background:#059669;color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:bold;font-size:13px;">
          View Hackathon Portal
        </a>
      </div>
    </div>
  </div>
</body>
</html>`;

    return await mailService.sendEmail({
      to: email,
      subject: `Code-A-Nova Hackathon — Prize Fulfillment Update: ${prizeName}`,
      html,
      recipientName: name,
      campaign: 'Hackathon Prize Fulfillment Notification',
      source: 'Hackathon Phase 8 System',
    });
  }
}

module.exports = new HackathonEmailService();
