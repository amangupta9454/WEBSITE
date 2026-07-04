require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI)
  .then(async () => {
    const user = await User.findOne({ email: 'codeanova26@gmail.com' });
    console.log(JSON.stringify(user, null, 2));
    process.exit(0);
  });
