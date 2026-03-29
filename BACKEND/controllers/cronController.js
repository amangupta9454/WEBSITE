const User = require('../models/User');
const nodemailer = require('nodemailer');

// Setup Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
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
    await transporter.sendMail(mailOptions);
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
        
        // Month targets are roughly 28-30 days per cycle
        // Check for Month 1, Month 2, Month 3
        for (let targetMonth = 1; targetMonth <= maxMonths; targetMonth++) {
          // If days passed is >= 28 * targetMonth, it's time for that month's alert
          if (daysPassed >= (28 * targetMonth)) {
             
             // Check if we ALREADY pushed an alert for this exact month target
             const alertIdentifier = `Month ${targetMonth} Task Due`;
             const hasAlert = internship.alerts.some(a => a.message.includes(alertIdentifier));

             if (!hasAlert) {
               // Push the new alert to the internship subdocument natively!
               internship.alerts.push({
                 message: `[Action Required]: Your ${alertIdentifier}. Please submit your assignment via the Dashboard immediately.`,
                 type: 'warning',
                 date: new Date(),
                 isRead: false
               });

               // Fire off the email warning
               await sendAlertEmail(user.email, user.name, targetMonth, internship.domain);

               isModified = true;
               alertsGenerated++;
             }
          }
        }
      }

      if (isModified) {
        await user.save();
      }
    }

    console.log(`[Cron] Check complete. Generated ${alertsGenerated} new alert(s).`);
    return res.status(200).json({ success: true, alertsGenerated });

  } catch (error) {
    console.error('[Cron Error]', error);
    return res.status(500).json({ error: 'Cron execution failed' });
  }
};

module.exports = { runDailyCron };
