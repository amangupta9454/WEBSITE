const mongoose = require('mongoose');
require('dotenv').config({ path: '/Volumes/Himanshu/github-repos/WEBSITE/backend/.env' });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const indexes = await db.collection('users').indexes();
  console.log(indexes);
  
  // drop the studentId_1 index
  try {
    await db.collection('users').dropIndex('studentId_1');
    console.log('Dropped studentId_1 index successfully!');
  } catch (e) {
    console.log('Error dropping index (might not exist or different name):', e.message);
  }

  process.exit(0);
}
run();
