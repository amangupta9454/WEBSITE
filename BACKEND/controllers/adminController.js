const Admin = require('../models/Admin');
const User = require('../models/User');
const Certificate = require('../models/Certificate');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const XLSX = require('xlsx');
const multer = require('multer');
const ProjectSubmission = require('../models/ProjectSubmission');
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
    const allSubmissions = await ProjectSubmission.find({}); // Globally pull tracking histories
    const allCertificates = await Certificate.find({}); // Fetch all certificates to match studentId

    const allApplications = [];

    users.forEach(user => {
      user.internships.forEach(app => {
        const isVerified = allCertificates.some(cert => {
          return cert.studentId && app.studentId && 
            cert.studentId.toString().trim().toLowerCase() === app.studentId.toString().trim().toLowerCase();
        });
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
          batch: app.batch,
          appliedAt: app.appliedAt,
          downloadedAt: app.downloadedAt,
          startDate: app.startDate,
          endDate: app.endDate,
          totalMonths: app.totalMonths,
          certificateUrl: app.certificateUrl,
          offerLetterStatus: app.offerLetterStatus,
          hasPaid: app.hasPaid,
          paidExported: app.paidExported || false,
          projectExported: app.projectExported || false,
          bypassBlock: app.bypassBlock || false,
          isCertificateVerified: isVerified,
          submissions: allSubmissions.filter(sub => String(sub.studentId) === String(app.studentId))
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
    const { applicationId, startDate, certificateUrl } = req.body;

    if (!applicationId) {
      return res.status(400).json({ message: 'Application ID required' });
    }

    const user = await User.findOne({ 'internships._id': applicationId });
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const internship = user.internships.id(applicationId);
    if (!internship) return res.status(404).json({ message: 'Internship not found' });

    const durationStr = internship.duration || '1 Month';
    const totalMonths = parseInt(durationStr.split(' ')[0], 10) || 1;
    
    const start = new Date(startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + totalMonths);

    internship.startDate = start;
    internship.endDate = end;
    internship.totalMonths = totalMonths;
    if (certificateUrl) {
      internship.certificateUrl = certificateUrl;
    }

    await user.save();

    res.json({ message: 'Internship details updated successfully', startDate: start, endDate: end });
  } catch (error) {
    console.error('[Admin] Error updating internship details:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateOfferStatus = async (req, res) => {
  try {
    const { applicationId, status } = req.body;
    if (!applicationId || !status) {
      return res.status(400).json({ message: 'Application ID and status required' });
    }

    const result = await User.updateOne(
      { 'internships._id': applicationId },
      { $set: { 'internships.$.offerLetterStatus': status } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: 'Application not found' });
    }

    res.json({ message: `Offer letter marked as ${status}` });
  } catch (error) {
    console.error('[Admin] Error updating offer status:', error);
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
        return null; // Skip invalid dates instead of throwing 500 Error
      }

      return {
        certificateNumber: row.Certificate_Number?.toString().trim(),
        studentName: row.Student_Name?.toString().trim(),
        domain: row.Domain?.toString().trim(),
        startDate,
        endDate,
        duration: row.Duration?.toString().trim(),
        studentId: row.Student_ID?.toString().trim(),
        batch: row.Batch?.toString().trim()
      };
    }).filter(cert => cert && cert.certificateNumber && cert.studentId); // Filter invalid

    if (certificates.length === 0) {
      return res.status(400).json({ message: 'No valid certificates found in the Excel file' });
    }

    // Insert to DB (ignore duplicates safely)
    try {
      await Certificate.insertMany(certificates, { ordered: false });
      res.json({ message: `${certificates.length} certificates uploaded successfully` });
    } catch (insertError) {
      if (insertError.code === 11000) {
        // This means some (or all) were duplicates, but others were inserted because of ordered: false
        const insertedCount = insertError.insertedDocs ? insertError.insertedDocs.length : 0;
        res.json({ message: `Upload completed. Inserted ${insertedCount} new certificates (skipped duplicates).` });
      } else {
        throw insertError;
      }
    }

  } catch (error) {
    console.error('[Admin] Error uploading certificates:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};
const setStartDate = async (req, res) => {
  try {
    const { applicationId, startDate } = req.body;
    if (!applicationId || !startDate) {
      return res.status(400).json({ message: 'Application ID and start date required' });
    }

    const user = await User.findOne({ 'internships._id': applicationId });
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const internship = user.internships.id(applicationId);
    if (!internship) return res.status(404).json({ message: 'Internship not found' });

    const durationStr = internship.duration || '1 Month';
    const totalMonths = parseInt(durationStr.split(' ')[0], 10) || 1;
    
    const start = new Date(startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + totalMonths);

    internship.startDate = start;
    internship.endDate = end;
    internship.totalMonths = totalMonths;

    await user.save();

    res.json({ message: 'Timeline updated successfully', startDate: start, endDate: end });
  } catch (error) {
    console.error('[Admin] Error setting start date:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updatePaidStatus = async (req, res) => {
  try {
    const { applicationId, hasPaid } = req.body;
    if (!applicationId) {
      return res.status(400).json({ message: 'Application ID required' });
    }

    const result = await User.updateOne(
      { 'internships._id': applicationId },
      { 
        $set: { 
          'internships.$.hasPaid': hasPaid,
          'internships.$.paidExported': false 
        } 
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: 'Application not found' });
    }

    res.json({ message: `Paid status updated to ${hasPaid ? 'Yes' : 'No'}` });
  } catch (error) {
    console.error('[Admin] Error updating paid status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateBypassBlock = async (req, res) => {
  try {
    const { applicationId, bypassBlock } = req.body;
    if (!applicationId) {
      return res.status(400).json({ message: 'Application ID required' });
    }

    const result = await User.updateOne(
      { 'internships._id': applicationId },
      { $set: { 'internships.$.bypassBlock': bypassBlock } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: 'Application not found' });
    }

    res.json({ message: `Bypass block status updated to ${bypassBlock ? 'Yes' : 'No'}` });
  } catch (error) {
    console.error('[Admin] Error updating bypass block:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const markPaidExported = async (req, res) => {
  try {
    const { applicationIds } = req.body;
    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({ message: 'No application IDs provided' });
    }

    let modifiedCount = 0;
    for (const appId of applicationIds) {
      const result = await User.updateOne(
        { 'internships._id': appId },
        { $set: { 'internships.$.paidExported': true } }
      );
      if (result.modifiedCount > 0) {
        modifiedCount++;
      }
    }

    res.json({ message: `Successfully marked ${modifiedCount} paid student(s) as exported.`, modifiedCount });
  } catch (error) {
    console.error('[Admin] Error marking paid exported:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const markProjectExported = async (req, res) => {
  try {
    const { applicationIds } = req.body;
    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({ message: 'No application IDs provided' });
    }

    let modifiedCount = 0;
    for (const appId of applicationIds) {
      const result = await User.updateOne(
        { 'internships._id': appId },
        { $set: { 'internships.$.projectExported': true } }
      );
      if (result.modifiedCount > 0) {
        modifiedCount++;
      }
    }

    res.json({ message: `Successfully marked ${modifiedCount} submitted student(s) as exported.`, modifiedCount });
  } catch (error) {
    console.error('[Admin] Error marking project exported:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { 
  adminLogin, 
  getInternships, 
  markDownloaded, 
  updateInternshipDetails, 
  uploadCertificates, 
  updateOfferStatus, 
  setStartDate,
  updatePaidStatus,
  updateBypassBlock,
  markPaidExported,
  markProjectExported
};