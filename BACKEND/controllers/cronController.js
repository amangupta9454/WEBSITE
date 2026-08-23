const User = require('../models/User');
const nodemailer = require('nodemailer');
const sendSafeEmail = require('../utils/safeMailSender');
const jobController = require('./jobController');

// Setup Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER_2,
    pass: process.env.EMAIL_APP_PASSWORD_2
  }
}); 

const sendAlertEmail = async (email, name, monthNumber, domain) => {
  const mailOptions = {
    from: `"CODE-A-NOVA Internships" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Action Required: Month ${monthNumber} Task Due for ${domain} Internship`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
        <h2 style="color: #1e3a8a;">Code-A-Nova Internship Update</h2>
        <p>Dear <strong>${name}</strong>,</p>
        <p>This is an automated reminder regarding your <strong>${domain}</strong> internship.</p>
        <p style="font-size: 16px; padding: 15px; background: #fee2e2; border-left: 4px solid #ef4444; color: #991b1b;">
          <strong>Reminder:</strong> Your <strong>Month ${monthNumber}</strong> internship tasks are due! Please ensure you have completed your assigned milestone and uploaded your project link through the Student Dashboard.
        </p>
        <p>Delay in submission may impact your final certification evaluation.</p>
        <a href="https://code-a-nova.online/student-login" style="display: inline-block; padding: 10px 20px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 15px;">
          Go to Dashboard
        </a>
        <br/><br/>
        <p style="font-size: 13px; color: #6b7280;">If you have already submitted your month ${monthNumber} project, you can ignore this alert.</p>
        <p>Best Regards,<br/><strong>Team Code-A-Nova</strong></p>
      </div>
    `
  };
  try {
    await sendSafeEmail(transporter, mailOptions, 'Cron Unused Tokens');
  } catch (err) {
    console.error(`Failed to send alert email to ${email}:`, err);
  }
};

const runDailyCron = async (req, res) => {
  try {
    // If you want to secure it so only Vercel can trigger it
    // Vercel Cron sends an Authorization header matching CRON_SECRET if configured.
    if (process.env.CRON_SECRET) {
       const authHeader = req.headers.authorization;
       if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
         return res.status(401).json({ error: 'Unauthorized' });
       }
    }

    console.log('[Cron] Starting daily timeline check...');
    const users = await User.find({ "internships.startDate": { $exists: true } });
    let alertsGenerated = 0;
    const now = new Date();

    for (const user of users) {
      let isModified = false;

      for (const internship of user.internships) {
        if (!internship.startDate) continue;

        // Determine total duration target (e.g. "1 Month" -> 1)
        const durationStr = internship.duration || "1";
        const maxMonths = parseInt(durationStr.split(' ')[0], 10) || 1;

        // Calculate exact days passed
        const daysPassed = Math.floor((now - new Date(internship.startDate)) / (1000 * 60 * 60 * 24));
        
        for (let targetMonth = 1; targetMonth <= maxMonths; targetMonth++) {
          const monthStartDay = (targetMonth - 1) * 30;
          
          // --- TASK 1 ASSIGNMENT (Day 0 of month) ---
          if (daysPassed === monthStartDay || daysPassed === monthStartDay + 1) {
             const alertIdentifier = `Month ${targetMonth} Task 1 Assigned`;
             if (!internship.alerts.some(a => a.message.includes(alertIdentifier))) {
               internship.alerts.push({
                 message: `[New Assignment]: Your ${alertIdentifier}. Please check your Dashboard.`,
                 type: 'info', date: new Date(), isRead: false
               });
               const mailOptions = {
                 from: `"CODE-A-NOVA Internships" <${process.env.EMAIL_USER}>`,
                 to: user.email,
                 subject: `New Task Assigned: Month ${targetMonth} Task 1 (${internship.domain})`,
                 html: `<p>Dear <strong>${user.name}</strong>,</p><p>Your first task for Month ${targetMonth} has been unlocked. Please log in to your dashboard to view the details.</p>`
               };
               sendSafeEmail(transporter, mailOptions, 'Cron Profile Reminder').catch(console.error);
               isModified = true; alertsGenerated++;
             }
          }
          
          // --- TASK 1 REMINDER (Day 14-15 of month) ---
          if (daysPassed === monthStartDay + 14 || daysPassed === monthStartDay + 15) {
             const alertIdentifier = `Month ${targetMonth} Task 1 Reminder`;
             if (!internship.alerts.some(a => a.message.includes(alertIdentifier))) {
               internship.alerts.push({
                 message: `[Reminder]: Your ${alertIdentifier}. Deadline is approaching. Submit to avoid SP penalty.`,
                 type: 'warning', date: new Date(), isRead: false
               });
               const mailOptions = {
                 from: `"CODE-A-NOVA Internships" <${process.env.EMAIL_USER}>`,
                 to: user.email,
                 subject: `Reminder: Month ${targetMonth} Task 1 Due (${internship.domain})`,
                 html: `<p>Dear <strong>${user.name}</strong>,</p><p>This is a reminder to submit your Task 1 for Month ${targetMonth}. If missed, a 5 SP penalty will apply during the grace period.</p>`
               };
               sendSafeEmail(transporter, mailOptions, 'Cron Project Due').catch(console.error);
               isModified = true; alertsGenerated++;
             }
          }

          const isAug05Batch = new Date(internship.startDate) >= new Date("2026-08-05T00:00:00.000Z");

          // --- TASK 2 ASSIGNMENT (Day 15-16 of month) ---
          if (isAug05Batch && (daysPassed === monthStartDay + 15 || daysPassed === monthStartDay + 16)) {
             const alertIdentifier = `Month ${targetMonth} Task 2 Assigned`;
             if (!internship.alerts.some(a => a.message.includes(alertIdentifier))) {
               internship.alerts.push({
                 message: `[New Assignment]: Your ${alertIdentifier}. Please check your Dashboard.`,
                 type: 'info', date: new Date(), isRead: false
               });
               const mailOptions = {
                 from: `"CODE-A-NOVA Internships" <${process.env.EMAIL_USER}>`,
                 to: user.email,
                 subject: `New Task Assigned: Month ${targetMonth} Task 2 (${internship.domain})`,
                 html: `<p>Dear <strong>${user.name}</strong>,</p><p>Your second task for Month ${targetMonth} has been unlocked. Please log in to your dashboard to view the details.</p>`
               };
               sendSafeEmail(transporter, mailOptions, 'Cron Pending Interview').catch(console.error);
               isModified = true; alertsGenerated++;
             }
          }

          // --- TASK 2 REMINDER / MONTH END (Day 29-30 of month) ---
          if (daysPassed === monthStartDay + 29 || daysPassed === monthStartDay + 30) {
             const alertIdentifier = `Month ${targetMonth} Task Due`; // Keeps legacy compatibility
             if (!internship.alerts.some(a => a.message.includes(alertIdentifier))) {
               internship.alerts.push({
                 message: `[Action Required]: Your ${alertIdentifier}. Please submit your assignment via the Dashboard immediately.`,
                 type: 'warning', date: new Date(), isRead: false
               });
               await sendAlertEmail(user.email, user.name, targetMonth, internship.domain);
               isModified = true; alertsGenerated++;
             }
          }
        }
      }

      if (isModified) {
        await user.save();
      }
    }

    console.log(`[Cron] Check complete. Generated ${alertsGenerated} new alert(s).`);
    
    // Sync Jobs from RapidAPI
    try {
      const jobSyncResult = await jobController.syncJobsFromAPI();
      console.log('[Cron] Job Sync Result:', jobSyncResult);
    } catch (jobErr) {
      console.error('[Cron] Error syncing jobs:', jobErr);
    }

    return res.status(200).json({ success: true, alertsGenerated });

  } catch (error) {
    console.error('[Cron Error]', error);
    return res.status(500).json({ error: 'Cron execution failed' });
  }
};

const runWeeklySocialCron = async (req, res) => {
  try {
    if (process.env.CRON_SECRET) {
       const authHeader = req.headers.authorization;
       if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
         return res.status(401).json({ error: 'Unauthorized' });
       }
    }

    console.log('[Cron] Starting weekly social media check...');
    const users = await User.find({ "internships.0": { $exists: true } });
    let emailsSent = 0;

    for (const user of users) {
      // Check if both github and linkedin are missing.
      // If the user's profile already has both github and linkedin saved, then don't send mail.
      if (!user.github || !user.linkedin) {
        
        // Ensure they have an active internship (not just an empty array)
        if (user.internships && user.internships.length > 0) {
          
          // Send reminder email
          const mailOptions = {
            from: `"CODE-A-NOVA Internships" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: `Action Required: Update Your Social Media Profiles on Student Dashboard`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
                <h2 style="color: #1e3a8a;">Code-A-Nova Dashboard Update</h2>
                <p>Dear <strong>${user.name}</strong>,</p>
                <p>We noticed that your GitHub and/or LinkedIn profile links are missing from your Student Dashboard.</p>
                <p style="font-size: 16px; padding: 15px; background: #e0f2fe; border-left: 4px solid #3b82f6; color: #1e3a8a;">
                  <strong>Action Needed:</strong> Adding your social links helps you build a strong professional network and proves the authenticity of your ranking on the public Leaderboard.
                </p>
                <p><strong>Registered Email:</strong> ${user.email}<br/><strong>Student ID:</strong> ${user.internships[0].studentId}</p>
                <a href="https://code-a-nova.online/student-login" style="display: inline-block; padding: 10px 20px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 15px;">
                  Update Profile Now
                </a>
                <br/><br/>
                <p style="font-size: 13px; color: #6b7280;">If you have already updated your links, please ignore this email.</p>
                <p>Best Regards,<br/><strong>Team Code-A-Nova</strong></p>
              </div>
            `
          };
          
          try {
            await sendSafeEmail(transporter, mailOptions, 'Cron Missing Action');
            emailsSent++;
          } catch (err) {
            console.error(`Failed to send social reminder email to ${user.email}:`, err);
          }
        }
      }
    }

    console.log(`[Cron] Social check complete. Sent ${emailsSent} emails.`);
    return res.status(200).json({ success: true, emailsSent });

  } catch (error) {
    console.error('[Cron Error]', error);
    return res.status(500).json({ error: 'Weekly social cron execution failed' });
  }
};

module.exports = { runDailyCron, runWeeklySocialCron };
