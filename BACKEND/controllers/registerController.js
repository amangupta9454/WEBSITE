// const User = require('../models/User');
// const Counter = require('../models/Counter');

// const registerInternship = async (req, res) => {
//   try {
//     console.log('[Backend] Public internship application received:', req.body.email || 'No email');

//     const { email, batch } = req.body;
//     if (!batch) {
//       return res.status(400).json({ message: 'Batch selection required' });
//     }

//     let user = await User.findOne({ email });

//     if (user && user.internships.length > 0) {
//       // Check last application date
//       const lastApp = user.internships[user.internships.length - 1];
//       const daysSinceLast = Math.floor((new Date() - new Date(lastApp.appliedAt)) / (1000 * 60 * 60 * 24));
//       if (daysSinceLast < 10) {
//         return res.status(429).json({ 
//           message: `You can reapply after 10 days from your last application (${new Date(lastApp.appliedAt).toLocaleDateString()}). Days remaining: ${10 - daysSinceLast}` 
//         });
//       }
//     }

//     const currentYear = new Date().getFullYear();
//     const counterId = `internship_${currentYear}`;

//     // Atomically increment counter
//     const counter = await Counter.findByIdAndUpdate(
//       { _id: counterId },
//       { $inc: { seq: 1 } },
//       { new: true, upsert: true }
//     );

//     const serialNumber = String(counter.seq).padStart(3, '0');
//     const studentId = `CN/INT/${currentYear}/${serialNumber}`;

//     console.log('[Backend] Generated Student ID:', studentId);

//     const applicationData = {
//       ...req.body,
//       studentId,
//       appliedAt: new Date()
//     };

//     if (!user) {
//       // Create new user without password (since no login)
//       user = await User.create({
//         name: req.body.name,
//         email: req.body.email,
//         mobile: req.body.mobile,
//         // No password, profileImage, etc.
//         internships: []
//       });
//     }

//     user.internships.push(applicationData);
//     await user.save();

//     console.log('[Backend] Internship saved with Student ID:', studentId);

//     res.status(201).json({ 
//       message: 'Application submitted successfully',
//       studentId 
//     });
//   } catch (error) {
//     console.error('[Backend] Internship registration error:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// module.exports = { registerInternship };
// backend/controllers/registerController.js

const User = require('../models/User');
const Counter = require('../models/Counter');
const { sendInternshipConfirmation } = require('../config/nodemailer');

const registerInternship = async (req, res) => {
  try {
    console.log('[Backend] Public internship application received:', req.body.email || 'No email');

    const { email, batch, name, domain, duration, college } = req.body;

    if (!batch) {
      return res.status(400).json({ message: 'Batch selection required' });
    }

    let user = await User.findOne({ email });

    if (user && user.internships.length > 0) {
      const lastApp = user.internships[user.internships.length - 1];
      const daysSinceLast = Math.floor((new Date() - new Date(lastApp.appliedAt)) / (1000 * 60 * 60 * 24));
      if (daysSinceLast < 10) {
        return res.status(429).json({ 
          message: `You can reapply after 10 days from your last application (${new Date(lastApp.appliedAt).toLocaleDateString()}). Days remaining: ${10 - daysSinceLast}` 
        });
      }
    }

    const currentYear = new Date().getFullYear();
    const counterId = `internship_${currentYear}`;

    const counter = await Counter.findByIdAndUpdate(
      { _id: counterId },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const serialNumber = String(counter.seq).padStart(3, '0');
    const studentId = `CN/INT/${currentYear}/${serialNumber}`;

    console.log('[Backend] Generated Student ID:', studentId);

    const applicationData = {
      ...req.body,
      studentId,
      appliedAt: new Date()
    };

    if (!user) {
      user = await User.create({
        name: req.body.name,
        email: req.body.email,
        mobile: req.body.mobile,
        internships: []
      });
    }

    user.internships.push(applicationData);
    await user.save();

    console.log('[Backend] Internship saved with Student ID:', studentId);

    // Send email (non-blocking - don't await in response)
    sendInternshipConfirmation({
      name,
      email,
      domain,
      duration,
      college,
      batch,
      studentId
    }).catch(err => console.error('Email sending failed but registration succeeded:', err));

    res.status(201).json({ 
      message: 'Application submitted successfully',
      studentId 
    });

  } catch (error) {
    console.error('[Backend] Internship registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { registerInternship };

