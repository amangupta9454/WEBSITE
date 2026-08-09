require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log(mongoose.connection.db.databaseName);
  const count = await mongoose.connection.db.collection('quizapplicants').countDocuments();
  console.log('Count:', count);
  const res = await mongoose.connection.db.collection('quizapplicants').updateMany({}, { $unset: { sponsorLogo: "", sponsorSignature: "", "quizzes.$[].sponsorLogo": "", "quizzes.$[].sponsorSignature": "" } });
  console.log('Modified:', res.modifiedCount);
  process.exit(0);
}
test();
