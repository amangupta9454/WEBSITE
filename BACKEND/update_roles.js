const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  try {
    const result = await User.updateMany({}, { $set: { role: 'intern' } });
    console.log(`Successfully updated ${result.modifiedCount} users to 'intern' role.`);
  } catch (error) {
    console.error("Error updating users:", error);
  } finally {
    process.exit(0);
  }
});
