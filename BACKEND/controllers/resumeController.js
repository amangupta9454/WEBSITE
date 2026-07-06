const Resume = require('../models/Resume');
const User = require('../models/User');
const mongoose = require('mongoose');

const RESUME_CREATE_COST = 10;
const RESUME_DOWNLOAD_COST = 2;
const FREE_DOWNLOAD_LIMIT = 3;

// Helper to deduct tokens securely
const deductTokens = async (user, amount, reason) => {
  if (user.interviewCredits < amount) {
    return false;
  }
  user.interviewCredits -= amount;
  if (!user.tokenHistory) user.tokenHistory = [];
  user.tokenHistory.push({
    type: 'USE',
    amount: amount,
    reason: reason,
    date: new Date()
  });
  await user.save();
  return true;
};

// GET /api/resume
exports.getAllResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user.id }).sort({ updatedAt: -1 });
    res.json({ success: true, resumes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// GET /api/resume/:id
exports.getResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user.id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    
    const user = await User.findById(req.user.id);
    let verifiedPhone = null;
    if (user && user.mobile && user.mobile !== 'Google Auth') {
      verifiedPhone = user.mobile;
    } else if (user && user.internships && user.internships.length > 0) {
      for (let i = user.internships.length - 1; i >= 0; i--) {
        const intern = user.internships[i];
        if (intern.whatsapp || intern.mobile) {
          verifiedPhone = intern.whatsapp || intern.mobile;
          break;
        }
      }
    }

    res.json({ success: true, resume, verifiedPhone });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// POST /api/resume/create
exports.createResume = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Check if user has a free resume left
    const existingResumes = await Resume.countDocuments({ userId: req.user.id, isFree: true });
    let isFree = false;

    if (existingResumes === 0) {
      isFree = true; // First resume is free
    } else {
      // Deduct 10 tokens
      const deducted = await deductTokens(user, RESUME_CREATE_COST, 'Created new premium resume');
      if (!deducted) {
        return res.status(403).json({ success: false, message: `Insufficient tokens. Creating a resume costs ${RESUME_CREATE_COST} tokens.` });
      }
    }

    // Default data from Master Profile (Only personal info, clean start for everything else)
    let masterData = user.resumeData || {};
    let initialData = {
      personalInfo: masterData.personalInfo || {}
    };
    initialData.personalInfo.firstName = initialData.personalInfo.firstName || user.name?.split(' ')[0] || "";
    initialData.personalInfo.lastName = initialData.personalInfo.lastName || user.name?.split(' ').slice(1).join(' ') || "";
    initialData.personalInfo.email = initialData.personalInfo.email || user.email || "";
    initialData.personalInfo.phone = initialData.personalInfo.phone || user.mobile || "";
    initialData.personalInfo.github = initialData.personalInfo.github || user.github || "";
    initialData.personalInfo.linkedin = initialData.personalInfo.linkedin || user.linkedin || "";
    initialData.personalInfo.portfolio = initialData.personalInfo.portfolio || user.portfolio || "";

    const newResume = new Resume({
      userId: req.user.id,
      name: req.body.name || 'Untitled Resume',
      isFree: isFree,
      data: initialData
    });

    await newResume.save();
    res.json({ success: true, resume: newResume, creditsRemaining: user.interviewCredits });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// PUT /api/resume/:id
exports.updateResume = async (req, res) => {
  try {
    const { name, data, template } = req.body;
    
    const resume = await Resume.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: { name, data, template, status: 'Completed' } },
      { new: true }
    );

    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });

    // --- 1st RESUME SMART SYNC ---
    // Keep Master Profile perfectly in sync with the user's VERY FIRST resume, forever.
    if (data) {
      const firstResume = await Resume.findOne({ userId: req.user.id }).sort({ createdAt: 1 });
      if (firstResume && firstResume._id.toString() === req.params.id) {
        const user = await User.findById(req.user.id);
        if (user) {
          user.resumeData = data;
          user.markModified('resumeData');
          await user.save();
        }
      }
    }
    // -----------------------------

    res.json({ success: true, resume });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// POST /api/resume/:id/download
exports.recordDownload = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user.id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const currentDownloads = resume.downloadsUsed || 0;
    const newDownloads = currentDownloads + 1;

    // Check if we have free downloads left for this resume
    if (currentDownloads < FREE_DOWNLOAD_LIMIT) {
      // Use targeted update to avoid schema conflict with legacy skills data format
      await Resume.updateOne(
        { _id: req.params.id },
        { $set: { downloadsUsed: newDownloads } }
      );
      return res.json({ success: true, freeDownload: true, downloadsUsed: newDownloads });
    }

    // Otherwise deduct 2 tokens
    const deducted = await deductTokens(user, RESUME_DOWNLOAD_COST, `Downloaded PDF for resume: ${resume.name}`);
    if (!deducted) {
      return res.status(403).json({ success: false, message: `Insufficient tokens. Premium downloads cost ${RESUME_DOWNLOAD_COST} tokens.` });
    }

    // Use targeted update to avoid schema conflict with legacy skills data format
    await Resume.updateOne(
      { _id: req.params.id },
      { $set: { downloadsUsed: newDownloads } }
    );

    res.json({ success: true, freeDownload: false, downloadsUsed: newDownloads, creditsRemaining: user.interviewCredits });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// POST /api/resume/:id/duplicate
exports.duplicateResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user.id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });

    const user = await User.findById(req.user.id);
    
    // Always costs 10 tokens to duplicate
    const deducted = await deductTokens(user, RESUME_CREATE_COST, `Duplicated resume: ${resume.name}`);
    if (!deducted) {
      return res.status(403).json({ success: false, message: `Insufficient tokens. Duplicating a resume costs ${RESUME_CREATE_COST} tokens.` });
    }

    const newResume = new Resume({
      userId: req.user.id,
      name: `${resume.name} (Copy)`,
      template: resume.template,
      data: resume.data,
      isFree: false
    });

    await newResume.save();
    res.json({ success: true, resume: newResume, creditsRemaining: user.interviewCredits });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// DELETE /api/resume/:id
exports.deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    res.json({ success: true, message: 'Resume deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// POST /api/resume/:id/send-whatsapp
exports.sendWhatsapp = async (req, res) => {
  try {
    const { phone, pdfBase64 } = req.body;
    
    if (!phone || !pdfBase64) {
      return res.status(400).json({ success: false, message: 'Phone and PDF data are required' });
    }

    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user.id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const currentDownloads = resume.whatsappDownloadsUsed || 0;
    const newDownloads = currentDownloads + 1;

    // Check if we have free whatsapp sends left for this resume (limit 3)
    if (currentDownloads < 3) {
      await Resume.updateOne(
        { _id: req.params.id },
        { $set: { whatsappDownloadsUsed: newDownloads } }
      );
    } else {
      // Otherwise deduct 2 tokens
      const deducted = await deductTokens(user, 2, `Sent PDF via WhatsApp for resume: ${resume.name}`);
      if (!deducted) {
        return res.status(403).json({ success: false, message: `Insufficient tokens. Premium WhatsApp sends cost 2 tokens.` });
      }
      await Resume.updateOne(
        { _id: req.params.id },
        { $set: { whatsappDownloadsUsed: newDownloads } }
      );
    }

    // Queue WhatsApp Media Message
    // Strip the data: URI prefix if it exists
    const base64Data = pdfBase64.includes('base64,') ? pdfBase64.split('base64,')[1] : pdfBase64;
    const caption = `📄 *Your Resume is Ready!*\n\nHello *${user.name.split(' ')[0]}*,\nHere is your requested resume from Code-A-Nova: *${resume.name}*\n\n📧 Email: codeanova26@gmail.com\n🌐 Website: https://code-a-nova.online\n\nThank you for choosing us!`;
    const filename = `${resume.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    
    const { queueWhatsAppMedia } = require("../utils/whatsappClient");
    queueWhatsAppMedia(phone, caption, 'application/pdf', base64Data, filename);

    res.json({ 
      success: true, 
      freeSend: currentDownloads < 3, 
      whatsappDownloadsUsed: newDownloads,
      creditsRemaining: user.interviewCredits 
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
