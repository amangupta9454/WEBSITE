require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const users = await User.find({"internships.0": { $exists: true }});
  if(users.length === 0) {
    console.log("No users with internships");
    process.exit(0);
  }
  
  const user = users[0];
  const appId = user.internships[0]._id.toString();
  console.log("Trying to update appId:", appId);
  
  const result = await User.updateOne(
    { "internships._id": appId },
    { $set: { "internships.$.internshipType": "Summer/Winter Intern" } }
  );
  
  console.log("Update result:", result);
  process.exit(0);
}
run().catch(console.error);
