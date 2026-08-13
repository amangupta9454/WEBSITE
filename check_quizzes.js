const mongoose = require('mongoose');
const QuizApplicant = require('./BACKEND/models/QuizApplicant');
const User = require('./BACKEND/models/User');

mongoose.connect('mongodb://localhost:27017/code-a-nova', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const apps = await QuizApplicant.find({}).select('email name quizName quizzes').lean();
    console.log("Total applicants:", apps.length);
    console.log("Sample:", apps.slice(0, 3));
    mongoose.disconnect();
  });
