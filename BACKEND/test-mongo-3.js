require('dotenv').config({ path: './.env.local' });
const mongoose = require('mongoose');

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const start = Date.now();
  const docs = await db.collection('quizapplicants').find({}, { projection: { sponsorLogo: 0, sponsorSignature: 0, "quizzes.sponsorLogo": 0, "quizzes.sponsorSignature": 0 } }).sort({ _id: -1 }).toArray();
  console.log('Fetched', docs.length, 'in', Date.now() - start, 'ms');
  console.log('Payload size:', JSON.stringify(docs).length / 1024 / 1024, 'MB');
  process.exit(0);
}
test().catch(console.error);
