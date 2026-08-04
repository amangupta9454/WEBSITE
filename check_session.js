require('dotenv').config({ path: 'BACKEND/.env' });
const mongoose = require('mongoose');
const AssessmentSession = require('./BACKEND/models/assessment/AssessmentSession');

async function run() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const session = await AssessmentSession.findOne({ sessionId: 'SES-1785784010966-6505' }).lean();
  console.log("Session:", session ? {
    id: session.sessionId,
    totalQuestions: session.totalQuestions,
    snapshotLength: session.questionSnapshot?.length,
    status: session.status
  } : "Not found");
  mongoose.disconnect();
}
run();
