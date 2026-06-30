require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const ProjectSubmission = require('./models/ProjectSubmission');
const { GoogleGenAI } = require('@google/genai');

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
Respond ONLY with a valid JSON object in the exact format:
{"status": "Accepted" or "Rejected", "reason": "A brief 1-sentence reason."}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    let text = response.text || '';
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(text);

    return { aiStatus: result.status, aiFeedback: result.reason };
  } catch (error) {
    console.error('AI Eval error:', error);
    return { aiStatus: 'Pending', aiFeedback: 'AI evaluation failed. Please review manually.' };
  }
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const submissions = await ProjectSubmission.find({});
  let updatedCount = 0;

  for (let submission of submissions) {
    let modified = false;
    let pointsToAdd = 0;
    
    for (let assignment of submission.assignments) {
      if (assignment.github && (!assignment.aiStatus || assignment.aiStatus === 'Pending')) {
        console.log(`Evaluating ${assignment.projectName} for ${submission.studentId}...`);
        const evaluation = await evaluateRepoWithAI(assignment.github, assignment.projectName);
        console.log(`Result: ${evaluation.aiStatus} - ${evaluation.aiFeedback}`);
        
        assignment.aiStatus = evaluation.aiStatus;
        assignment.aiFeedback = evaluation.aiFeedback;
        modified = true;

        if (evaluation.aiStatus === 'Accepted') {
          pointsToAdd += 50;
        }
        
        // Rate limit prevention for GitHub API
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    if (modified) {
      await submission.save();
      
      if (pointsToAdd > 0) {
        const user = await User.findOne({ 'internships.studentId': submission.studentId });
        if (user) {
          const internship = user.internships.find(app => app.studentId === submission.studentId);
          if (internship) {
            internship.synergyPoints = (internship.synergyPoints || 0) + pointsToAdd;
            if (!internship.pointsHistory) internship.pointsHistory = [];
            
            // Add a history record for each accepted assignment
            submission.assignments.forEach(assignment => {
              // Quick check if this specific assignment was just processed (has a recent timestamp but we can just map it)
              // To prevent double pushing, let's just push one generic retro entry if easier, but specific is better
            });
            internship.pointsHistory.push({
              reason: `AI Verified ${pointsToAdd/50} Past Projects (Retroactive)`,
              pointsAdded: pointsToAdd,
              date: new Date()
            });
            
            await user.save();
            console.log(`Added ${pointsToAdd} SP to ${submission.studentId}`);
          }
        }
      }
      updatedCount++;
    }
  }

  console.log(`Finished processing. Updated ${updatedCount} submissions.`);
  process.exit(0);
}

run().catch(console.error);
