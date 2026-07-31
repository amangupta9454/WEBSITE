const cron = require('node-cron');
const InternProject = require('../models/InternProject');
const User = require('../models/User');
const { queueWhatsAppMessage } = require('../utils/whatsappClient');

// Run every day at 10:00 AM (only on traditional long-running servers, not serverless Vercel)
if (!process.env.VERCEL) {
  cron.schedule('0 10 * * *', async () => {
    console.log('[Cron] Checking for v2 projects that became visible today...');
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      const newlyVisibleProjects = await InternProject.find({
        visibleFrom: { $gte: today, $lt: endOfDay },
        status: 'Available'
      });

      if (newlyVisibleProjects.length === 0) {
        console.log('[Cron] No newly visible v2 projects today.');
        return;
      }

      const projectsByUser = {};
      for (const p of newlyVisibleProjects) {
        if (!projectsByUser[p.studentId]) {
          projectsByUser[p.studentId] = [];
        }
        projectsByUser[p.studentId].push(p);
      }

      const users = await User.find({ 'internships.studentId': { $in: Object.keys(projectsByUser) } });

      for (const user of users) {
        const activeInternship = user.internships.find(i => projectsByUser[i.studentId]);
        if (activeInternship) {
          const studentProjects = projectsByUser[activeInternship.studentId];
          
          for (const project of studentProjects) {
            const whatsappNumber = activeInternship.whatsapp || activeInternship.mobile || user.mobile;
            if (whatsappNumber && String(whatsappNumber).replace(/[^0-9]/g, '').length >= 10) {
              const message = `Hello! 👋\n\nYour Month ${project.monthNumber} - Project ${project.projectNumber} (${project.title}) is now available.\n\nPlease log in to your dashboard to view the details.\n\nBest of luck,\nCode-A-Nova Team`;
              
              try {
                await queueWhatsAppMessage(whatsappNumber, message);
              } catch (err) {
                console.error('[Cron] Failed to send WhatsApp notification', err);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('[Cron] Error processing v2 project visibility notifications:', error);
    }
  });
}
