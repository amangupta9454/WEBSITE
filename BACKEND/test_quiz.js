const mongoose = require('mongoose');
const QuizApplicant = require('./models/QuizApplicant');

mongoose.connect('mongodb://localhost:27017/code-a-nova').then(async () => {
  const app = await QuizApplicant.findOne({ email: /himanshu561hi@gmail.com/i }).lean();
  console.log("Applicant:", JSON.stringify(app, null, 2));
  mongoose.disconnect();
});
