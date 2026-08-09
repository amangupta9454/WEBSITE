require('dotenv').config({ path: './.env.vercel' });
const mongoose = require('mongoose');
const QuizApplicant = require('./models/QuizApplicant');
const QuizSponsor = require('./models/QuizSponsor');

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
  console.log('Connected to DB');
  
  // 1. Find one applicant with sponsor details to migrate to QuizSponsor
  const applicants = await QuizApplicant.find({ $or: [{ sponsorLogo: { $ne: "" } }, { "quizzes.sponsorLogo": { $ne: "" } }] }).limit(10);
  
  for (const app of applicants) {
    if (app.sponsorLogo) {
      await QuizSponsor.updateOne(
        { quizName: app.quizName },
        {
          $set: {
            quizName: app.quizName,
            sponsorName: app.sponsorName || "",
            sponsorSignatoryName: app.sponsorSignatoryName || "",
            quizDate: app.quizDate || "",
            sponsorLogo: app.sponsorLogo || "",
            sponsorSignature: app.sponsorSignature || ""
          }
        },
        { upsert: true }
      );
      console.log('Migrated root sponsor details for', app.quizName);
    }
    
    for (const qz of app.quizzes) {
      if (qz.sponsorLogo) {
        await QuizSponsor.updateOne(
          { quizName: qz.quizName },
          {
            $set: {
              quizName: qz.quizName,
              sponsorName: qz.sponsorName || "",
              sponsorSignatoryName: qz.sponsorSignatoryName || "",
              quizDate: qz.quizDate || "",
              sponsorLogo: qz.sponsorLogo || "",
              sponsorSignature: qz.sponsorSignature || ""
            }
          },
          { upsert: true }
        );
        console.log('Migrated quizzes array sponsor details for', qz.quizName);
      }
    }
  }

  // 2. Unset from all QuizApplicants to free space
  console.log('Unsetting from QuizApplicant root...');
  const res1 = await QuizApplicant.updateMany({}, {
    $unset: { sponsorLogo: "", sponsorSignature: "" }
  });
  console.log('Unset root modified:', res1.modifiedCount);
  
  console.log('Unsetting from QuizApplicant quizzes array...');
  const res2 = await QuizApplicant.updateMany({}, {
    $unset: { "quizzes.$[].sponsorLogo": "", "quizzes.$[].sponsorSignature": "" }
  });
  console.log('Unset array modified:', res2.modifiedCount);
  
  console.log('Migration and cleanup completed!');
  process.exit(0);
}
migrate().catch(console.error);
