const fs = require('fs');
let content = fs.readFileSync('/Volumes/Himanshu/github-repos/WEBSITE/BACKEND/controllers/registerController.js', 'utf8');
content = content.replace(
  "console.log('[Backend] Public internship application received:', req.body.email || 'No email');",
  "console.log('[Backend] Public internship application received:', req.body.email || 'No email');\n    console.log('[Backend] req.body keys:', Object.keys(req.body));\n    console.log('[Backend] req.file:', req.file ? req.file.originalname : 'No file');"
);
fs.writeFileSync('/Volumes/Himanshu/github-repos/WEBSITE/BACKEND/controllers/registerController.js', content);
