const fs = require('fs');

let content = fs.readFileSync('/Volumes/Himanshu/github-repos/WEBSITE/BACKEND/controllers/registerController.js', 'utf8');

// The new template
const template = `    const mailOptions = {
      from: \`"CODE-A-NOVA Internships" <\${process.env.EMAIL_USER}>\`,
      to: email,
      subject: \`Registration Confirmed - CODE-A-NOVA Internship\`,
      html: \`
<div style="background-color: #f4f7f6; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333333;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    
    <!-- Top Header Ribbon -->
    <div style="height: 6px; background: linear-gradient(90deg, #2563eb, #3b82f6);"></div>
    
    <!-- Header -->
    <div style="padding: 30px 40px; text-align: center; border-bottom: 1px solid #eeeeee;">
      <img src="https://res.cloudinary.com/dgtyqhtor/image/upload/v1767350736/new_logo_wwgaha.png" alt="CODE-A-NOVA" style="max-width: 160px; height: auto;">
    </div>
    
    <!-- Body Content -->
    <div style="padding: 40px;">
      <h1 style="margin: 0 0 20px 0; font-size: 24px; color: #111827; font-weight: 600; text-align: center;">Registration Confirmed</h1>
      
      <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 24px;">
        Dear <strong>\${name}</strong>,
      </p>
      
      <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 32px;">
        Thank you for applying to the <strong>\${domain}</strong> Internship Program. We are pleased to inform you that your application has been successfully received. 
      </p>
      
      <!-- Application Details Section -->
      <h2 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 16px; border-bottom: 1px solid #eeeeee; padding-bottom: 8px;">Application Summary</h2>
      
      <table style="width: 100%; margin-bottom: 32px; font-size: 15px; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; color: #6b7280; border-bottom: 1px solid #f9fafb; width: 40%;">Student ID</td>
          <td style="padding: 10px 0; color: #111827; font-weight: 500; border-bottom: 1px solid #f9fafb;">\${studentId}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #6b7280; border-bottom: 1px solid #f9fafb;">Program Domain</td>
          <td style="padding: 10px 0; color: #111827; font-weight: 500; border-bottom: 1px solid #f9fafb;">\${domain}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #6b7280; border-bottom: 1px solid #f9fafb;">Duration</td>
          <td style="padding: 10px 0; color: #111827; font-weight: 500; border-bottom: 1px solid #f9fafb;">\${duration}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #6b7280;">Institution</td>
          <td style="padding: 10px 0; color: #111827; font-weight: 500;">\${college || 'Not provided'}</td>
        </tr>
      </table>
      
      <!-- Dashboard Access Section -->
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 24px; margin-bottom: 32px;">
        <h2 style="font-size: 16px; color: #0f172a; margin: 0 0 12px 0; font-weight: 600;">Student Dashboard Access</h2>
        <p style="font-size: 14px; color: #64748b; margin-bottom: 16px; line-height: 1.5;">
          You can track your application status and access your upcoming assignments via the dashboard using the credentials below:
        </p>
        
        <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 4px; padding: 12px 16px;">
          <div style="margin-bottom: 8px;">
            <span style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">User ID</span><br>
            <strong style="font-size: 15px; color: #0f172a;">\${email}</strong>
          </div>
          <div>
            <span style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Password</span><br>
            <strong style="font-size: 15px; color: #0f172a;">\${(!user.isFirstLogin && !user.isNew) ? '(Your Existing Password)' : 'Welcome@123'}</strong>
          </div>
        </div>
      </div>
      
      <!-- CTA Button -->
      <div style="text-align: center; margin-bottom: 40px;">
        <a href="https://code-a-nova.online/student-login" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 36px; border-radius: 4px; letter-spacing: 0.5px;">Login to Dashboard</a>
      </div>
      
      <p style="font-size: 14px; line-height: 1.6; color: #6b7280; margin-bottom: 0;">
        Our selection committee is currently reviewing your profile. If shortlisted, you will receive an official offer letter and further instructions via email.<br><br>
        For any assistance, please contact us at <a href="mailto:codeanova26@gmail.com" style="color: #2563eb; text-decoration: none;">codeanova26@gmail.com</a>.
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #eeeeee;">
      <p style="font-size: 12px; color: #9ca3af; margin: 0 0 10px 0; line-height: 1.5;">
        &copy; \${new Date().getFullYear()} CODE-A-NOVA. All rights reserved.<br>
        MSME Registered Organization
      </p>
      <div style="margin-top: 12px;">
        <a href="https://code-a-nova.online" style="color: #6b7280; text-decoration: none; font-size: 12px; margin: 0 8px;">Website</a> | 
        <a href="https://linkedin.com/company/code-a-nova" style="color: #6b7280; text-decoration: none; font-size: 12px; margin: 0 8px;">LinkedIn</a> | 
        <a href="https://www.instagram.com/codenova31" style="color: #6b7280; text-decoration: none; font-size: 12px; margin: 0 8px;">Instagram</a>
      </div>
    </div>
    
  </div>
</div>
      \`
    };`;

const template1 = template.replace('    const mailOptions = {', '   const mailOptions = {');

// I will use regex to find and replace both mailOptions objects
// Find the first mailOptions
let firstMatch = content.match(/   const mailOptions = \{[\s\S]*?\};\n/);
if (firstMatch) {
  content = content.replace(firstMatch[0], template1 + '\n');
}

// Find the second mailOptions
let secondMatch = content.match(/    const mailOptions = \{[\s\S]*?\};\n/);
if (secondMatch) {
  content = content.replace(secondMatch[0], template + '\n');
}

fs.writeFileSync('/Volumes/Himanshu/github-repos/WEBSITE/BACKEND/controllers/registerController.js', content);
console.log("Updated both templates!");
