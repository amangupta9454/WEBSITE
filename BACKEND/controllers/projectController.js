// backend/controllers/projectController.js

const User = require('../models/User');
const ProjectSubmission = require('../models/ProjectSubmission');
const Settings = require('../models/Settings');
const Razorpay = require('razorpay');
const crypto = require('crypto');
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const rzp = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function evaluateRepoWithAI(githubLink, projectName) {
  try {
    if (!githubLink || githubLink.trim() === '') {
      return { aiStatus: 'Rejected', aiFeedback: 'No GitHub URL provided.' };
    }

    const regex = /github\.com\/([^/]+)\/([^/]+)/;
    const match = githubLink.match(regex);
    if (!match) {
      return { aiStatus: 'Rejected', aiFeedback: 'Invalid GitHub URL format.' };
    }
    let [, owner, repo] = match;
    repo = repo.replace('.git', '');

    const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`);
    let treeData = await treeRes.json();
    if (treeData.message && treeData.message.includes('Not Found')) {
      const treeResMaster = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=1`);
      treeData = await treeResMaster.json();
    }

    if (treeData.message && treeData.message.includes('Not Found')) {
      return { aiStatus: 'Rejected', aiFeedback: 'Repository not found or is private.' };
    }

    const files = (treeData.tree || []).map(t => t.path).slice(0, 100);
    if (files.length === 0) {
      return { aiStatus: 'Rejected', aiFeedback: 'Repository is completely empty.' };
    }

    let readmeText = '';
    const readmeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`);
    const readmeData = await readmeRes.json();
    if (readmeData.content) {
      readmeText = Buffer.from(readmeData.content, 'base64').toString('utf-8').slice(0, 1500);
    }

    const prompt = `
You are an expert code evaluator. 
A student has submitted a project repository for the assignment titled: "${projectName}".
Here is the file structure of their repository:
${files.join('\n')}

Here is a snippet of their README.md:
${readmeText}

Evaluate if this repository looks like a valid submission for "${projectName}". 
Does the file structure and README indicate they actually built the project, or is it blank/irrelevant/spam?
Also, evaluate the project's quality (0-10) based on structure and README, and complexity (0-10) based on the files present.
Respond ONLY with a valid JSON object in the exact format:
{"status": "Accepted" or "Rejected", "reason": "A brief 1-sentence reason.", "codeQualityScore": number, "complexityScore": number}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    let text = response.text || '';
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(text);

    return { 
      aiStatus: result.status, 
      aiFeedback: result.reason,
      codeQualityScore: result.codeQualityScore || 0,
      complexityScore: result.complexityScore || 0
    };
  } catch (error) {
    console.error('AI Eval error:', error);
    return { aiStatus: 'Pending', aiFeedback: 'AI evaluation failed. Please review manually.', codeQualityScore: 0, complexityScore: 0 };
  }
}

async function processAssignmentsWithAI(assignments, internship, user) {
  let totalPointsToAdd = 0;
  for (let assignment of assignments) {
    if (assignment.github) {
      const evaluation = await evaluateRepoWithAI(assignment.github, assignment.projectName);
      assignment.aiStatus = evaluation.aiStatus;
      assignment.aiFeedback = evaluation.aiFeedback;

      if (evaluation.aiStatus === 'Accepted') {
        const baseSP = 20;
        const qualitySP = Math.min(20, Math.floor((evaluation.codeQualityScore || 0) * 2));
        const complexitySP = Math.min(10, Math.floor((evaluation.complexityScore || 0) * 1));
        const awardedSP = baseSP + qualitySP + complexitySP;

        assignment.spAwarded = awardedSP;
        totalPointsToAdd += awardedSP;
        
        if (!internship.pointsHistory) internship.pointsHistory = [];
        internship.pointsHistory.push({
          reason: `AI Verified Project: ${assignment.projectName} (Quality: ${evaluation.codeQualityScore}/10, Complexity: ${evaluation.complexityScore}/10)`,
          pointsAdded: awardedSP,
          date: new Date()
        });
      }
    }
  }

  if (totalPointsToAdd > 0) {
    internship.synergyPoints = (internship.synergyPoints || 0) + totalPointsToAdd;
    await user.save();
  }
  return assignments;
}

const submitProject = async (req, res) => {
  try {
    const { studentId, name, email, mobile, domain, duration, assignments } = req.body;

    const user = await User.findOne({ 'internships.studentId': studentId });
    if (!user) {
      return res.status(404).json({ message: 'Invalid Student ID' });
    }

    const internship = user.internships.find(app => app.studentId === studentId);
    if (!internship) {
      return res.status(404).json({ message: 'Internship not found' });
    }

    const now = new Date();
    if (!internship.startDate || !internship.endDate) {
      return res.status(400).json({ message: 'Your internship dates have not been set by the admin yet.' });
    }
    
    const end = new Date(internship.endDate);
    end.setHours(23, 59, 59, 999);
    
    if (now < new Date(internship.startDate) || now > end) {
      return res.status(400).json({ message: 'You can only submit projects within your active internship dates.' });
    }

    const registeredDuration = parseInt(internship.duration.split(' ')[0]);

    const previousCount = await ProjectSubmission.countDocuments({ studentId });
    if (previousCount >= registeredDuration) {
      return res.status(400).json({ message: 'All monthly submissions completed' });
    }

    const currentMonth = previousCount + 1;
    const paymentRequired = (currentMonth === registeredDuration && !internship.hasPaid);

    if (paymentRequired) {
      const amount = registeredDuration === 3 ? 99 : 69;
      const order = await rzp.orders.create({
        amount: amount * 100,
        currency: 'INR',
        receipt: `proj_${studentId}_${currentMonth}`
      });

      return res.json({
        order,
        key: process.env.RAZORPAY_KEY_ID,
        amount,
        message: 'Payment required for final submission'
      });
    } else {
      const processedAssignments = await processAssignmentsWithAI(assignments || [], internship, user);

      const submission = new ProjectSubmission({
        studentId,
        name,
        email,
        mobile: internship.mobile,
        domain,
        duration: registeredDuration,
        assignments: processedAssignments,
        month: currentMonth
      });

      await submission.save();
      return res.json({ message: 'Project submitted and AI-evaluated successfully' });
    }
  } catch (error) {
    console.error('[Project] Submit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body.response;
    const formData = req.body; // Full form data sent from FE

    // Verify signature
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // Re-validate (similar to submit)
    const { studentId, name, email, mobile, domain, duration, assignments } = formData;
    const user = await User.findOne({ 'internships.studentId': studentId });
    if (!user) {
      return res.status(404).json({ message: 'Invalid Student ID' });
    }

    const internship = user.internships.find(app => app.studentId === studentId);
    if (!internship || internship.hasPaid) {
      return res.status(400).json({ message: 'Payment already processed or invalid' });
    }

    const registeredDuration = parseInt(internship.duration.split(' ')[0]);
    const previousCount = await ProjectSubmission.countDocuments({ studentId });
    const currentMonth = previousCount + 1;

    if (currentMonth !== registeredDuration) {
      return res.status(400).json({ message: 'Not the final submission month' });
    }

    const processedAssignments = await processAssignmentsWithAI(assignments || [], internship, user);

    // Save submission
    const submission = new ProjectSubmission({
      studentId,
      name,
      email,
      mobile: internship.mobile,
      domain,
      duration: registeredDuration,
      assignments: processedAssignments,
      month: currentMonth
    });

    await submission.save();

    // Update hasPaid and store actual payment details
    await User.updateOne(
      { 'internships.studentId': studentId },
      { 
        $set: { 
          'internships.$.hasPaid': true,
          'internships.$.paymentAmount': registeredDuration === 3 ? 99 : 69,
          'internships.$.razorpayPaymentId': razorpay_payment_id
        } 
      }
    );

    res.json({ message: 'Payment verified and project submitted successfully' });
  } catch (error) {
    console.error('[Project] Verify error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { submitProject, verifyPayment };