require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const ProjectSubmission = require('./models/ProjectSubmission');
const SummerProject = require('./models/SummerProject');

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const users = await User.find({});
    let updatedUsers = 0;

    for (let user of users) {
      let userModified = false;
      for (let internship of user.internships) {
        if (!internship.pointsHistory || internship.pointsHistory.length === 0) continue;

        // Fetch normal submissions for this student
        const submission = await ProjectSubmission.findOne({ studentId: internship.studentId });

        for (let history of internship.pointsHistory) {
          let matchedDate = null;

          // Summer Project Match
          if (history.reason.includes('Summer Project') || history.reason.includes('Winter Project') || history.reason.includes('Summer/Winter Project')) {
            for (let repo of (internship.assignedRepos || [])) {
              const project = await SummerProject.findById(repo.projectId);
              if (project && history.reason.includes(project.name)) {
                matchedDate = repo.submittedAt || project.dueDate;
                break;
              }
            }
            if (!matchedDate && internship.assignedRepos && internship.assignedRepos.length > 0) {
               const firstRepo = internship.assignedRepos[0];
               const project = await SummerProject.findById(firstRepo.projectId);
               matchedDate = firstRepo.submittedAt || (project ? project.dueDate : new Date('2024-06-01'));
            }
          } 
          // Normal Project Match
          else if (history.reason.includes('Project Accepted') || history.reason.includes('AI Verified Project') || history.reason.includes('AI Re-verified Project') || history.reason.includes('Admin SP Override')) {
             if (submission && submission.assignments && submission.assignments.length > 0) {
                for (let assignment of submission.assignments) {
                  if (history.reason.includes(assignment.projectName)) {
                    matchedDate = assignment.submittedAt;
                    break;
                  }
                }
                if (!matchedDate) {
                  matchedDate = submission.assignments[0].submittedAt;
                }
             }
          }

          if (matchedDate) {
            history.date = matchedDate;
            userModified = true;
          } else {
             // Fallback to June 15th for legacy back-allocated points if no match found
             history.date = new Date('2024-06-15');
             userModified = true;
          }
        }
      }
      
      if (userModified) {
        await user.save();
        updatedUsers++;
      }
    }

    console.log(`Successfully updated pointsHistory dates for ${updatedUsers} users.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
