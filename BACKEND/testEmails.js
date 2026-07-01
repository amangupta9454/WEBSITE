require('dotenv').config();
const mongoose = require('mongoose');
const { sendEvaluationEmails } = require('./controllers/adminController');

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const req = {};
  const res = {
    json: (data) => {
      console.log('SUCCESS JSON:', data);
    },
    status: (code) => {
      return {
        json: (data) => {
          console.log(`ERROR ${code} JSON:`, data);
        }
      }
    }
  };

  await sendEvaluationEmails(req, res);
  process.exit(0);
}

test();
