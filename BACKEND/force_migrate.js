require('dotenv').config({ path: '/Volumes/Himanshu/github-repos/WEBSITE/BACKEND/.env' });
const mongoose = require('mongoose');

async function run() {
  try {
    const altUri = "mongodb+srv://testing:Aman11@cluster0.doonfjp.mongodb.net/Registration";
    console.log("Connecting to:", altUri);
    await mongoose.connect(altUri);
    console.log("Connected to MongoDB.");

    const db = mongoose.connection.db;

    // 1. Update AssessmentRuntimeConfig
    const configResult = await db.collection('assessmentruntimeconfigs').updateMany(
      { modelName: 'llama3-70b-8192' },
      { $set: { modelName: 'llama-3.3-70b-versatile' } }
    );
    console.log(`Updated ${configResult.modifiedCount} AssessmentRuntimeConfig documents.`);

    // 2. Update AssessmentAIBlueprint
    const blueprintResult = await db.collection('assessmentaiblueprints').updateMany(
      { providerModel: 'llama3-70b-8192' },
      { $set: { providerModel: 'llama-3.3-70b-versatile' } }
    );
    console.log(`Updated ${blueprintResult.modifiedCount} AssessmentAIBlueprint documents.`);

    // 3. Update AssessmentCategory (just in case)
    const categoryResult = await db.collection('assessmentcategories').updateMany(
      { modelName: 'llama3-70b-8192' },
      { $set: { modelName: 'llama-3.3-70b-versatile' } }
    );
    console.log(`Updated ${categoryResult.modifiedCount} AssessmentCategory documents.`);

    process.exit(0);
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  }
}

run();
