require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const thresholdDate = new Date("2026-07-25T00:00:00.000Z");
    
    const users = await User.find({ "internships.startDate": { $gte: thresholdDate } });
    
    let updatedCount = 0;
    
    for (const user of users) {
      let modified = false;
      user.internships.forEach(internship => {
        if (internship.startDate && new Date(internship.startDate) >= thresholdDate) {
          if (internship.workflowVersion !== 'v2') {
            internship.workflowVersion = 'v2';
            modified = true;
          }
        }
      });
      if (modified) {
        await user.save();
        updatedCount++;
      }
    }
    
    console.log(`Successfully migrated ${updatedCount} existing internships starting on or after July 25th to V2.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
