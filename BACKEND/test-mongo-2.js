require('dotenv').config({ path: './.env.local' });
const mongoose = require('mongoose');

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const doc = await db.collection('quizapplicants').findOne();
  console.log('Doc size:', JSON.stringify(doc).length / 1024 / 1024, 'MB');
  process.exit(0);
}
test().catch(console.error);
