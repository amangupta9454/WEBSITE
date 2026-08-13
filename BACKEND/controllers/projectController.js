// backend/controllers/projectController.js

const User = require('../models/User');
const ProjectSubmission = require('../models/ProjectSubmission');
const Settings = require('../models/Settings');
const Razorpay = require('razorpay');
const crypto = require('crypto');
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const nodemailer = require('nodemailer');
const pdfParse = require('pdf-parse');

let currentGroqKeyIndex = 0;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

// Secondary transporter specifically for status emails to avoid rate limits
const statusEmailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER_2 || process.env.EMAIL_USER, // fallback to primary if not set
    pass: process.env.EMAIL_APP_PASSWORD_2 || process.env.EMAIL_APP_PASSWORD,
  },
});

const sendAIEvaluationEmail = async (email, name, projectName, aiStatus, aiFeedback, spAwarded, maxSp = 50) => {
  try {
    const bannerUrl = "https://res.cloudinary.com/dwyxsqxvt/image/upload/v1738743128/f3056093-9c84-4861-bb38-4b7264883d6a_p2hixp.png";
    const senderEmail = process.env.EMAIL_USER_2 || process.env.EMAIL_USER;
    const mailOptions = {
      from: `"Code-A-Nova" <${senderEmail}>`,
      to: email,
      subject: `Project AI Evaluation Result - ${projectName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
          <img src="${bannerUrl}" alt="Code-A-Nova" style="width: 100%; height: auto;" />
          <div style="padding: 20px;">
            <h2 style="color: #1e293b;">Hi ${name},</h2>
            <p style="color: #475569; font-size: 16px;">Your project <strong>"${projectName}"</strong> has been evaluated by our AI.</p>
            
            <div style="background-color: ${aiStatus === 'Accepted' ? '#f0fdf4' : '#fef2f2'}; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: ${aiStatus === 'Accepted' ? '#166534' : '#991b1b'};">Status: ${aiStatus}</h3>
              <p style="margin: 0; font-size: 15px;"><strong>AI Feedback:</strong> ${aiFeedback}</p>
            </div>

            <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; font-size: 18px; color: #334155;">Points Awarded</p>
              <h1 style="margin: 10px 0 0 0; color: #2563eb;">${spAwarded} <span style="font-size: 16px; color: #64748b;">/ ${maxSp} SP</span></h1>
            </div>

            <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
              <em>Note: If you update your project and its submission link from your dashboard, it will be re-evaluated and your SP may be adjusted (a standard deduction of 5 SP applies for resubmissions).</em>
            </p>
            <p style="color: #475569; margin-top: 30px;">Best regards,<br><strong>Code-A-Nova Team</strong></p>
          </div>
        </div>
      `
    };
    await statusEmailTransporter.sendMail(mailOptions);
    console.log(`Email sent to ${email} for ${projectName} using ${senderEmail}`);
  } catch (err) {
    console.error("Failed to send AI evaluation email:", err);
  }
};

const rzp = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'dummy_key' });

async function evaluateRepoWithAI(githubLink, projectName, pdfUrl = null) {
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

    const filesList = treeData.tree || [];
    const files = filesList.map(t => t.path).slice(0, 100);
    if (files.length === 0) {
      return { aiStatus: 'Rejected', aiFeedback: 'Repository is completely empty.' };
    }

    let readmeText = '';
    const readmeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`);
    const readmeData = await readmeRes.json();
    if (readmeData.content) {
      readmeText = Buffer.from(readmeData.content, 'base64').toString('utf-8').slice(0, 1500);
    }

    // Fetch key source code files to allow AI to deeply evaluate and "soft run"
    const validExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', '.html', '.css', '.php', '.go', '.rb', '.rs', '.txt', '.ipynb', '.xlsx', '.csv'];
    const sourceNodes = filesList.filter(t => {
      if (t.type !== 'blob') return false;
      const lowerPath = t.path.toLowerCase();
      if (lowerPath.includes('node_modules') || lowerPath.includes('package-lock') || lowerPath.includes('.min.') || lowerPath.includes('dist/') || lowerPath.includes('build/')) return false;
      return validExtensions.some(ext => lowerPath.endsWith(ext));
    });

    const projectKeywords = projectName.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(w => w.length > 2);

    sourceNodes.sort((a, b) => {
      const aPath = a.path.toLowerCase();
      const bPath = b.path.toLowerCase();
      
      let aScore = 0;
      let bScore = 0;

      // Bonus for matching project name keywords (crucial for monorepos where multiple projects exist in one repo)
      projectKeywords.forEach(kw => {
        if (aPath.includes(kw)) aScore += 10;
        if (bPath.includes(kw)) bScore += 10;
      });

      if (/main|index|app|server/i.test(aPath)) aScore += 2;
      if (/main|index|app|server/i.test(bPath)) bScore += 2;

      return bScore - aScore;
    });

    const topSourceFiles = sourceNodes.slice(0, 15); // Up to 15 files
    let codeSnippets = '';
    let totalChars = 0;
    const MAX_CHARS = 40000;

    const fetchPromises = topSourceFiles.map(async (node) => {
      const fileRes = await fetch(node.url);
      const fileData = await fileRes.json();
      if (fileData.content) {
        return { path: node.path, content: Buffer.from(fileData.content, 'base64').toString('utf-8') };
      }
      return null;
    });

    const results = await Promise.allSettled(fetchPromises);
    
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        const textContent = result.value.content;
        const snippet = `\n--- FILE: ${result.value.path} ---\n${textContent.slice(0, 3000)}\n`;
        if (totalChars + snippet.length > MAX_CHARS) {
          codeSnippets += snippet.slice(0, MAX_CHARS - totalChars) + '\n...[TRUNCATED TO FIT CONTEXT]...';
          break;
        }
        codeSnippets += snippet;
        totalChars += snippet.length;
      }
    }

    let pdfTextPrompt = '';
    if (pdfUrl) {
      try {
        const pdfRes = await fetch(pdfUrl);
        if (pdfRes.ok) {
          const pdfBuffer = await pdfRes.arrayBuffer();
          const parsedPdf = await pdfParse(Buffer.from(pdfBuffer));
          const truncatedPdfText = parsedPdf.text.slice(0, 3000); // Send up to 3000 chars of instructions
          pdfTextPrompt = `\n--- ADMIN PROVIDED INSTRUCTIONS (PDF) ---\n${truncatedPdfText}\n\nYou MUST ensure the submitted code closely matches the functional requirements detailed above.\n`;
        }
      } catch (pdfErr) {
        console.error('Failed to parse PDF for AI prompt:', pdfErr);
      }
    }

    const systemPrompt = `You are an expert, STRICT code evaluator. You must evaluate the provided code against the project requirements.
You MUST respond ONLY with a valid JSON object. Do NOT include any markdown formatting like \`\`\`json, and do NOT include explanations outside of the JSON object. 
The JSON object MUST have this exact schema:
{
  "status": "Accepted" or "Rejected",
  "reason": "A brief 1-2 sentence reason detailing your findings.",
  "codeQualityScore": number (0-10),
  "complexityScore": number (0-10)
}`;

    const prompt = `
A student has submitted a project repository for the assignment titled: "${projectName}".

IMPORTANT CONTEXT:
The student was given the requirements for "${projectName}" in a PDF document (which you cannot see in full, but instructions are provided below).
Your primary job is to verify that the submitted code ACTUALLY implements a project that matches the title "${projectName}" and follows the given instructions.

Here is the file structure of their repository:
${files.join('\n')}

--- README CONTENT ---
${readmeText}
${pdfTextPrompt}
Here are the contents of key source files from the project for you to deeply evaluate and simulate ("soft run") in your mind:
${codeSnippets}

EVALUATION RULES:
1. RELEVANCE CHECK (CRITICAL): Does the code align with the project name "${projectName}"? 
   - If the project is supposed to be a "Food Delivery App" but the code is for a "To-Do List", REJECT IT.
   - If the project is an "E-commerce Website" but they submitted a generic template, a completely random tutorial repo, or boilerplate code, REJECT IT.
   - You MUST look for domain-specific clues in the code (variable names, routes, components, database schemas) that prove it is a real attempt at "${projectName}".
   - If an admin provided PDF instructions, the submission MUST fulfill those instructions.
2. QUALITY CHECK: Evaluate the project's code quality (0-10) based on clean code practices.
3. COMPLEXITY CHECK: Evaluate complexity (0-10) based on the algorithms/logic used.

Remember, return ONLY the JSON object.`;

    const groqKeys = [
      process.env.GROQ_API_KEY,
      process.env.GROQ_API_KEY_2,
      process.env.GROQ_API_KEY_3,
      process.env.GROQ_API_KEY_4
    ].filter(Boolean);

    if (groqKeys.length === 0) {
      return { aiStatus: 'Pending', aiFeedback: 'GROQ_API_KEY is missing. AI evaluation paused.', codeQualityScore: 0, complexityScore: 0 };
    }

    let response = null;
    let data = null;
    let success = false;
    let lastError = null;

    const startIndex = currentGroqKeyIndex % groqKeys.length;
    currentGroqKeyIndex = (currentGroqKeyIndex + 1) % groqKeys.length;

    for (let i = 0; i < groqKeys.length; i++) {
      const keyIndex = (startIndex + i) % groqKeys.length;
      const key = groqKeys[keyIndex];

      try {
        const tempRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt }
            ],
            response_format: { type: 'json_object' }
          })
        });

        const tempData = await tempRes.json();
        
        if (tempRes.status === 429 || (tempData.error && tempData.error.code === 'rate_limit_exceeded')) {
          console.warn(`Groq API Key (index ${keyIndex}) rate limited, trying next key...`);
          lastError = 'Rate limit exceeded on all available Groq API keys.';
          continue; // Try next key
        }

        if (!tempData.choices || !tempData.choices[0]) {
          console.error(`Groq API unexpected response with key (index ${keyIndex}):`, tempData);
          lastError = 'AI evaluation failed. Please review manually.';
          continue; // Try next key just in case
        }

        response = tempRes;
        data = tempData;
        success = true;
        break; // Success! Break out of the loop
      } catch (err) {
        console.error(`Fetch error with a Groq key (index ${keyIndex}):`, err);
        lastError = 'Network error contacting AI provider.';
      }
    }

    if (!success) {
      return { aiStatus: 'Pending', aiFeedback: lastError || 'AI evaluation failed after trying all keys.', codeQualityScore: 0, complexityScore: 0 };
    }

    const text = data.choices[0].message.content.trim();
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
        
        assignment.emailSent = false;
      } else {
        assignment.emailSent = false;
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
    
    // Add 5 days grace period
    const graceEnd = new Date(end);
    graceEnd.setDate(graceEnd.getDate() + 5);
    
    if (now < new Date(internship.startDate) || now > graceEnd) {
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
      const amount = registeredDuration === 3 ? 299 : 199;
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
          'internships.$.paymentAmount': registeredDuration === 3 ? 299 : 199,
          'internships.$.paymentDate': new Date(),
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

module.exports = {
  submitProject,
  verifyPayment,
  processAssignmentsWithAI,
  evaluateRepoWithAI,
  sendAIEvaluationEmail
};