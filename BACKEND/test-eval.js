const pdf = require('pdf-parse');
const mongoose = require('mongoose');
const SummerProject = require('./models/SummerProject');
require('dotenv').config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const proj = await SummerProject.findOne({ pdfUrl: { $exists: true } });
    if (!proj) { console.log('No project found with pdfUrl'); process.exit(0); }
    
    console.log('Fetching:', proj.pdfUrl);
    const res = await fetch(proj.pdfUrl);
    const buffer = await res.arrayBuffer();
    
    const data = await pdf(Buffer.from(buffer));
    console.log('PDF Text Length:', data.text.length);
    console.log('Sample:', data.text.slice(0, 200));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
