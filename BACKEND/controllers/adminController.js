// // backend/controllers/adminController.js

// const Admin = require('../models/Admin');
// const User = require('../models/User');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');

// const adminLogin = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const admin = await Admin.findOne({ email });
//     if (!admin) return res.status(400).json({ message: 'Invalid credentials' });

//     const isMatch = await bcrypt.compare(password, admin.password);
//     if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

//     const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

//     res.json({ token });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// const getInternships = async (req, res) => {
//   try {
//     const users = await User.find({ 'internships.0': { $exists: true } }); // Users with at least one internship

//     const allApplications = [];

//     users.forEach(user => {
//       user.internships.forEach(app => {
//         allApplications.push({
//           _id: app._id, // ← MUST include this
//           studentId: app.studentId,
//           name: app.name,
//           email: app.email,
//           mobile: app.mobile,
//           whatsapp: app.whatsapp,
//           course: app.course,
//           branch: app.branch,
//           year: app.year,
//           college: app.college,
//           state: app.state,
//           domain: app.domain,
//           duration: app.duration,
//           appliedAt: app.appliedAt,
//           downloadedAt: app.downloadedAt,
//           // Add other fields
//         });
//       });
//     });

//     res.json(allApplications);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// // backend/controllers/adminController.js

// const markDownloaded = async (req, res) => {
//   try {
//     const { applicationIds } = req.body;

//     if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
//       return res.status(400).json({ message: 'No application IDs provided' });
//     }

//     let modifiedCount = 0;

//     // Loop through each application ID and update individually
//     for (const appId of applicationIds) {
//       const result = await User.updateOne(
//         { 'internships._id': appId },
//         { $set: { 'internships.$.downloadedAt': new Date() } }
//       );
//       if (result.modifiedCount > 0) {
//         modifiedCount++;
//       }
//     }

//     console.log(`[Admin] Successfully marked ${modifiedCount} applications as downloaded`);

//     res.json({
//       message: 'Marked as downloaded',
//       modifiedCount
//     });
//   } catch (error) {
//     console.error('[Admin] Error marking downloaded:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// module.exports = { adminLogin, getInternships, markDownloaded };

// backend/controllers/adminController.js with certificate upload

// const Admin = require('../models/Admin');
// const User = require('../models/User');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');

// const adminLogin = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const admin = await Admin.findOne({ email });
//     if (!admin) return res.status(400).json({ message: 'Invalid credentials' });

//     const isMatch = await bcrypt.compare(password, admin.password);
//     if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

//     const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

//     res.json({ token });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// const getInternships = async (req, res) => {
//   try {
//     const users = await User.find({ 'internships.0': { $exists: true } }); // Users with at least one internship

//     const allApplications = [];

//     users.forEach(user => {
//       user.internships.forEach(app => {
//         allApplications.push({
//           _id: app._id, // ← MUST include this
//           studentId: app.studentId,
//           name: app.name,
//           email: app.email,
//           mobile: app.mobile,
//           whatsapp: app.whatsapp,
//           course: app.course,
//           branch: app.branch,
//           year: app.year,
//           college: app.college,
//           state: app.state,
//           passingYear: app.passingYear,
//           domain: app.domain,
//           duration: app.duration,
//           portfolio: app.portfolio,
//           github: app.github,
//           linkedin: app.linkedin,
//           whyHire: app.whyHire,
//           hearAbout: app.hearAbout,
//           resumeUrl: app.resumeUrl,
//           appliedAt: app.appliedAt,
//           downloadedAt: app.downloadedAt,
//           startDate: app.startDate,
//           endDate: app.endDate,
//           totalMonths: app.totalMonths,
//           certificateUrl: app.certificateUrl
//         });
//       });
//     });

//     res.json(allApplications);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// const markDownloaded = async (req, res) => {
//   try {
//     const { applicationIds } = req.body;

//     if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
//       return res.status(400).json({ message: 'No application IDs provided' });
//     }

//     let modifiedCount = 0;

//     // Loop through each application ID and update individually
//     for (const appId of applicationIds) {
//       const result = await User.updateOne(
//         { 'internships._id': appId },
//         { $set: { 'internships.$.downloadedAt': new Date() } }
//       );
//       if (result.modifiedCount > 0) {
//         modifiedCount++;
//       }
//     }

//     console.log(`[Admin] Successfully marked ${modifiedCount} applications as downloaded`);

//     res.json({
//       message: 'Marked as downloaded',
//       modifiedCount
//     });
//   } catch (error) {
//     console.error('[Admin] Error marking downloaded:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// const updateInternshipDetails = async (req, res) => {
//   try {
//     const { applicationId, startDate, endDate, certificateUrl } = req.body;

//     if (!applicationId) {
//       return res.status(400).json({ message: 'Application ID required' });
//     }

//     // Calculate total months
//     const start = new Date(startDate);
//     const end = new Date(endDate);
//     const totalMonths = Math.ceil((end - start) / (1000 * 60 * 60 * 24 * 30)); // Approximate months

//     const result = await User.updateOne(
//       { 'internships._id': applicationId },
//       {
//         $set: {
//           'internships.$.startDate': start,
//           'internships.$.endDate': end,
//           'internships.$.totalMonths': totalMonths,
//           'internships.$.certificateUrl': certificateUrl
//         }
//       }
//     );

//     if (result.modifiedCount === 0) {
//       return res.status(404).json({ message: 'Application not found' });
//     }

//     res.json({ message: 'Internship details updated successfully' });
//   } catch (error) {
//     console.error('[Admin] Error updating internship details:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// module.exports = { adminLogin, getInternships, markDownloaded, updateInternshipDetails };


// with upload the excel sheet
// backend/controllers/adminController.js

const Admin = require('../models/Admin');
const User = require('../models/User');
const Certificate = require('../models/Certificate');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const XLSX = require('xlsx');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getInternships = async (req, res) => {
  try {
    const users = await User.find({ 'internships.0': { $exists: true } }); // Users with at least one internship

    const allApplications = [];

    users.forEach(user => {
      user.internships.forEach(app => {
        allApplications.push({
          _id: app._id, // ← MUST include this
          studentId: app.studentId,
          name: app.name,
          email: app.email,
          mobile: app.mobile,
          whatsapp: app.whatsapp,
          course: app.course,
          branch: app.branch,
          year: app.year,
          college: app.college,
          state: app.state,
          passingYear: app.passingYear,
          domain: app.domain,
          duration: app.duration,
          portfolio: app.portfolio,
          github: app.github,
          linkedin: app.linkedin,
          whyHire: app.whyHire,
          hearAbout: app.hearAbout,
          resumeUrl: app.resumeUrl,
          appliedAt: app.appliedAt,
          downloadedAt: app.downloadedAt,
          startDate: app.startDate,
          endDate: app.endDate,
          totalMonths: app.totalMonths,
          certificateUrl: app.certificateUrl
        });
      });
    });

    res.json(allApplications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const markDownloaded = async (req, res) => {
  try {
    const { applicationIds } = req.body;

    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({ message: 'No application IDs provided' });
    }

    let modifiedCount = 0;

    // Loop through each application ID and update individually
    for (const appId of applicationIds) {
      const result = await User.updateOne(
        { 'internships._id': appId },
        { $set: { 'internships.$.downloadedAt': new Date() } }
      );
      if (result.modifiedCount > 0) {
        modifiedCount++;
      }
    }

    console.log(`[Admin] Successfully marked ${modifiedCount} applications as downloaded`);

    res.json({
      message: 'Marked as downloaded',
      modifiedCount
    });
  } catch (error) {
    console.error('[Admin] Error marking downloaded:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateInternshipDetails = async (req, res) => {
  try {
    const { applicationId, startDate, endDate, certificateUrl } = req.body;

    if (!applicationId) {
      return res.status(400).json({ message: 'Application ID required' });
    }

    // Calculate total months
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalMonths = Math.ceil((end - start) / (1000 * 60 * 60 * 24 * 30)); // Approximate months

    const result = await User.updateOne(
      { 'internships._id': applicationId },
      {
        $set: {
          'internships.$.startDate': start,
          'internships.$.endDate': end,
          'internships.$.totalMonths': totalMonths,
          'internships.$.certificateUrl': certificateUrl
        }
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: 'Application not found' });
    }

    res.json({ message: 'Internship details updated successfully' });
  } catch (error) {
    console.error('[Admin] Error updating internship details:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// backend/controllers/adminController.js - Replace uploadCertificates with this

const uploadCertificates = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true, raw: false });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const certificates = data.map(row => {
      let startDate = row.Start_Date;
      let endDate = row.End_Date;

      // If not Date, parse as string in dd-mm-yyyy
      const parseDate = (val) => {
  if (val instanceof Date) return val;
  if (typeof val !== 'string') return null;

  const parts = val.trim().split(/[-\/.]/);
  if (parts.length !== 3) return null;

  let d = parseInt(parts[0], 10);
  let m = parseInt(parts[1], 10);
  let y = parseInt(parts[2], 10);

  if (y < 100) y += 2000;

  // Handle if accidentally mm-dd-yyyy
  if (m > 12 && d <= 12) {
    [d, m] = [m, d];
  }

  const dateObj = new Date(y, m - 1, d);
  if (isNaN(dateObj.getTime())) return null;

  dateObj.setUTCHours(0, 0, 0, 0); // Critical fix
  return dateObj;
};

      startDate = parseDate(startDate);
      endDate = parseDate(endDate);

      if (!startDate || !endDate) {
        console.warn('Invalid date in row:', row);
        throw new Error(`Invalid date format in row for Certificate ${row.Certificate_Number}`);
      }

      return {
        certificateNumber: row.Certificate_Number?.toString().trim(),
        studentName: row.Student_Name?.toString().trim(),
        domain: row.Domain?.toString().trim(),
        startDate,
        endDate,
        duration: row.Duration?.toString().trim(),
        studentId: row.Student_ID?.toString().trim()
      };
    }).filter(cert => cert.certificateNumber && cert.studentId); // Filter invalid

    if (certificates.length === 0) {
      return res.status(400).json({ message: 'No valid certificates found in the Excel file' });
    }

    // Insert to DB (ignore duplicates)
    await Certificate.insertMany(certificates, { ordered: false });

    res.json({ message: `${certificates.length} certificates uploaded successfully` });
  } catch (error) {
    console.error('[Admin] Error uploading certificates:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { adminLogin, getInternships, markDownloaded, updateInternshipDetails, uploadCertificates };