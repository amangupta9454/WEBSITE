require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  const users = await User.find({ 'internships.synergyPoints': { $gt: 0 } });
  console.log('Users with synergyPoints > 0:', users.length);
  
  let totalWithPointsHistory = 0;
  for (let u of users) {
     let hasHist = false;
     for (let i of u.internships) {
       if (i.pointsHistory && i.pointsHistory.length > 0) hasHist = true;
     }
     if (hasHist) totalWithPointsHistory++;
  }
  console.log('Of those, users with pointsHistory:', totalWithPointsHistory);
  
  process.exit(0);
}
test();
