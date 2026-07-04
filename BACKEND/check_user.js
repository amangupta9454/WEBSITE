const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const users = await User.find({ "internships.email": "himanshu560hi@gmail.com" });
  console.log("Root emails for this internship:", users.map(u => u.email));
  process.exit(0);
});
