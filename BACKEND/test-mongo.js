require('dotenv').config({ path: './.env.local' });
const mongoose = require('mongoose');

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const count = await db.collection('quizapplicants').countDocuments();
  console.log('Total applicants:', count);
  const start = Date.now();
  const docs = await db.collection('quizapplicants').find().sort({ _id: -1 }).toArray();
  console.log('Fetched', docs.length, 'in', Date.now() - start, 'ms');
  console.log('Payload size:', JSON.stringify(docs).length / 1024 / 1024, 'MB');
  process.exit(0);
}
test().catch(console.error);
