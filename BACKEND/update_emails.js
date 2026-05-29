const fs = require('fs');
let content = fs.readFileSync('controllers/registerController.js', 'utf8');

const simpleEmailHTML = `<div style="background-color: #f4f7f6; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333333;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <div style="height: 6px; background: linear-gradient(90deg, #2563eb, #3b82f6);"></div>
    
  
    
    <div style="padding: 8px;">
      <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 24px;">
        Dear <strong>\${name}</strong>,
      </p>
      <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 32px;">
        Thank you for applying to the <strong>\${domain}</strong> Internship Program.
      </p>
      <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 0;">
        If you are shortlisted, further communication will be sent to your email. Our selection committee is currently reviewing your profile.
      </p>
    </div>
    <div style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #eeeeee;">
      <p style="font-size: 12px; color: #9ca3af; margin: 0 0 10px 0; line-height: 1.5;">
        &copy; \${new Date().getFullYear()} CODE-A-NOVA. All rights reserved.<br>
        MSME Registered Organization
      </p>
    </div>
  </div>
</div>`;

// Replace the previous email HTML blocks
content = content.replace(/html: `<div style="background-color: #f4f7f6;[\s\S]*?<\/div>`/g, `html: \`${simpleEmailHTML}\``);

fs.writeFileSync('controllers/registerController.js', content);
console.log('Emails updated with banner');
