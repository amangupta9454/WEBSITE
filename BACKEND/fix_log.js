const fs = require('fs');
let content = fs.readFileSync('/Volumes/Himanshu/github-repos/WEBSITE/BACKEND/controllers/registerController.js', 'utf8');
content = content.replace(/req\.body\.email/g, "req.body?.email");
content = content.replace(/Object\.keys\(req\.body\)/g, "req.body ? Object.keys(req.body) : []");
fs.writeFileSync('/Volumes/Himanshu/github-repos/WEBSITE/BACKEND/controllers/registerController.js', content);
