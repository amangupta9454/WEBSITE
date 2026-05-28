require('dotenv').config();
const mongoose = require('mongoose');

async function fix() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB.");
    const collection = mongoose.connection.collection('users');
    const indexes = await collection.indexes();
    console.log("Existing indexes:", indexes.map(i => i.name));
    
    if (indexes.find(i => i.name === 'studentId_1')) {
      await collection.dropIndex('studentId_1');
      console.log("Dropped studentId_1 index successfully.");
    } else {
      console.log("No studentId_1 index found.");
    }
  } catch(e) {
    console.error(e);
  } finally {
    process.exit();
  }
}
fix();
