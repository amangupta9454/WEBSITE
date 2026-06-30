require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({});
    for (let u of users) {
      for (let i of u.internships) {
        if (i.assignedRepos) {
          for (let r of i.assignedRepos) {
             if (r.reviewStatus === 'Pending' && r.repoLink) {
                 if (!r.projectId) {
                     console.log("No projectId for repo:", r);
                 } else if (!mongoose.Types.ObjectId.isValid(r.projectId)) {
                     console.log("Invalid projectId:", r.projectId);
                 }
             }
          }
        }
      }
    }
    console.log("Done checking");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
run();
