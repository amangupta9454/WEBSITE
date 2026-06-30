require('dotenv').config();
const mongoose = require('mongoose');
const { evaluatePendingAI } = require('./controllers/adminController');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");
    
    const req = {};
    const res = {
      json: (data) => console.log("JSON response:", data),
      status: (code) => {
        console.log("Status:", code);
        return { json: (data) => console.log("JSON:", data) };
      }
    };
    
    await evaluatePendingAI(req, res);
    
    console.log("Done");
    process.exit(0);
  } catch (err) {
    console.error("Script Error:", err);
    process.exit(1);
  }
};

run();
