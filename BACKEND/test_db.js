const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const user = await User.findOne({});
  console.log('User ID:', user._id);
  console.log('Resume Data:', JSON.stringify(user.resumeData, null, 2));
  process.exit(0);
});
