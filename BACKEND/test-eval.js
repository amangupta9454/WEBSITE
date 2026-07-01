const mongoose = require('mongoose');
const User = require('./models/User');
const ProjectSubmission = require('./models/ProjectSubmission');
const SummerProject = require('./models/SummerProject');
const { evaluateRepoWithAI } = require('./controllers/projectController');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  try {
    let processedCount = 0;
    const MAX_BATCH_SIZE = 1;

    // 1. Process Normal Projects
    const normalSubmissions = await ProjectSubmission.find({});
    for (let sub of normalSubmissions) {
      if (processedCount >= MAX_BATCH_SIZE) break;
      const user = await User.findOne({ 'internships.studentId': sub.studentId });
      if (!user) continue;
      const internship = user.internships.find(app => app.studentId === sub.studentId);
      if (!internship) continue;

      let subUpdated = false;
      for (let assignment of sub.assignments) {
        if (processedCount >= MAX_BATCH_SIZE) break;
        if (assignment.aiStatus === 'Pending' && assignment.github) {
          console.log('Evaluating Normal project:', assignment.projectName);
          const evaluation = await evaluateRepoWithAI(assignment.github, assignment.projectName);
          console.log('Evaluation:', evaluation);
          processedCount++;
        }
      }
    }

    // 2. Process Summer Projects
    if (processedCount < MAX_BATCH_SIZE) {
      const users = await User.find({ 'internships.assignedRepos': { $exists: true, $not: {$size: 0} } });
      for (let user of users) {
        if (processedCount >= MAX_BATCH_SIZE) break;
        for (let internship of user.internships) {
          if (processedCount >= MAX_BATCH_SIZE) break;
          if (internship.assignedRepos && internship.assignedRepos.length > 0) {
            for (let repo of internship.assignedRepos) {
              if (processedCount >= MAX_BATCH_SIZE) break;
              if (repo.reviewStatus === 'Pending' && repo.repoLink) {
                console.log('Evaluating Summer project:', repo.projectId);
                const project = await SummerProject.findById(repo.projectId);
                const projectName = project ? project.name : 'Summer Project';
                const evaluation = await evaluateRepoWithAI(repo.repoLink, projectName);
                console.log('Evaluation:', evaluation);
                processedCount++;
              }
            }
          }
        }
      }
    }

    console.log('Processed:', processedCount);
  } catch (err) {
    console.error('CAUGHT ERROR:', err);
  } finally {
    process.exit(0);
  }
}
run();
