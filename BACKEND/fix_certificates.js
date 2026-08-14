require('dotenv').config();
const mongoose = require('mongoose');
const AssessmentCertificate = require('./models/assessment/AssessmentCertificate');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log("Connected to MongoDB. Fixing old certificates...");
  
  const certs = await AssessmentCertificate.find({ 
    $or: [
      { candidateName: 'Code-A-Nova Candidate' },
      { candidateName: { $exists: false } }
    ]
  });
  
  let updatedCount = 0;
  
  for(let c of certs) {
    if (!c.candidateId) continue;
    
    const user = await User.findOne({ email: c.candidateId });
    if (user && user.name) {
      c.candidateName = user.name;
      if (c.snapshot) {
        c.snapshot.candidateName = user.name;
      }
      
      await AssessmentCertificate.updateOne(
        { _id: c._id },
        { 
          candidateName: user.name, 
          snapshot: c.snapshot 
        }
      );
      
      updatedCount++;
      console.log('✅ Updated certificate', c.certificateId, 'with actual name:', user.name);
    } else {
      console.log('⚠️ Could not find User name for email:', c.candidateId);
    }
  }
  
  console.log('🎉 Total certificates fixed:', updatedCount);
  process.exit(0);
}).catch(err => {
  console.error("Database connection error:", err);
  process.exit(1);
});
