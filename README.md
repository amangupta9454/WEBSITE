<h1 align="center" style="color:#4CAF50; font-size: 40px; font-family: Arial, sans-serif; font-weight: bold;">🚀 Code-A-Nova – Official Website</h1>
<h3 align="center" style="color:gray; font-family: Arial, sans-serif; font-weight: normal; margin-top: -10px;"> A professional, full-stack web platform built for managing internships, training programs, certificate verification, and student engagement.</h3>

<p align="center" style="font-family: Arial, sans-serif;">
  <a href="https://code-a-nova.online/" style="color:#4CAF50; font-weight:bold; font-size: 18px; text-decoration: none; border: 2px solid #4CAF50; padding: 8px 16px; border-radius: 5px;">🌐 LIVE DEMO</a>
</p>

<hr>

<h2 id="toc" style="color:#4CAF50; font-family: Arial, sans-serif;">📚 Table of Contents</h2>

<ul style="font-family: Arial, sans-serif; line-height: 1.8;">
  <li><a href="#about" style="color:#4CAF50; text-decoration: none; font-weight: bold;">🧭 About the Project</a></li>
  <li><a href="#structure" style="color:#4CAF50; text-decoration: none; font-weight: bold;">🗂️ Folder & File Structure</a></li>
  <li><a href="#tech" style="color:#4CAF50; text-decoration: none; font-weight: bold;">🧰 Tech Stack</a></li>
  <li><a href="#dependencies" style="color:#4CAF50; text-decoration: none; font-weight: bold;">📦 All Dependencies</a></li>
  <li><a href="#setup" style="color:#4CAF50; text-decoration: none; font-weight: bold;">⚙️ How to Use This Project</a></li>
  <li><a href="#env" style="color:#4CAF50; text-decoration: none; font-weight: bold;">🔐 Environment Variables</a></li>
  <li><a href="#features" style="color:#4CAF50; text-decoration: none; font-weight: bold;">✨ Key Features</a></li>
  <li><a href="#mechanics" style="color:#4CAF50; text-decoration: none; font-weight: bold;">⚡ Core Mechanics & Process Logic</a></li>
  <li><a href="#api" style="color:#4CAF50; text-decoration: none; font-weight: bold;">📡 API Endpoints Reference</a></li>
  <li><a href="#screenshots" style="color:#4CAF50; text-decoration: none; font-weight: bold;">📸 Screenshots</a></li>
  <li><a href="#enhancements" style="color:#4CAF50; text-decoration: none; font-weight: bold;">🚀 Future Enhancements</a></li>
  <li><a href="#contact" style="color:#4CAF50; text-decoration: none; font-weight: bold;">📬 Contact Me</a></li>
  <li><a href="#creator" style="color:#4CAF50; text-decoration: none; font-weight: bold;">👨‍💻 Created By</a></li>
</ul>

<hr>

<h2 id="about" style="color:#4CAF50; font-family: Arial, sans-serif;">🧭 About the Project</h2>

<p style="font-family: Arial, sans-serif; line-height: 1.6;">
  This is my <strong>first freelance project</strong> developed for <strong>Code-A-Nova</strong>, a startup that provides
  <strong>internships and industry-level training</strong> to students. The platform is designed to be simple, scalable, and student-friendly, transitioning manual operations into an automated full-stack training ecosystem.
</p>

<ul style="font-family: Arial, sans-serif; line-height: 1.6;">
  <li>🎓 Students can explore internships, services, and build resumes natively</li>
  <li>📝 Register for internship programs via custom checkout pages</li>
  <li>💰 Integrated secure orders and payment processing</li>
  <li>🧑‍💻 Interactive Student Dashboard to configure passwords, upload milestones, and track tenure</li>
  <li>📧 Automated timeline notifications and warnings dispatched recursively via serverless schedulers</li>
  <li>🔐 Public Certificate Verification Portal ensuring credential integrity</li>
  <li>📊 Robust Admin Dashboard mapping internal metrics, custom start dates, block bypass options, and spreadsheet pipelines</li>
  <li>📨 Contact forms integrated with Getform.io for seamless community outreach</li>
</ul>

<hr>

<h2 id="structure" style="color:#4CAF50; font-family: Arial, sans-serif;">🗂️ Folder & File Structure</h2>

<p style="font-family: Arial, sans-serif; font-size: 14px; margin-bottom: 10px; color:#666;">
  This tree represents the exact, actual contents of the repository, highlighting structural modifications for serverless hosting and additional student-portal pages.
</p>

<pre style="background:#020617; padding:16px; border-radius:10px; color:#f8fafc; font-family: Consolas, Monaco, monospace; font-size: 13px; line-height: 1.4; overflow-x: auto;">
CODENOVA/
├── BACKEND/
│   ├── .env                       # Backend local environment configuration
│   ├── .gitignore                 # Excludes environments and developer seeder scripts
│   ├── index.js                   # Primary Express entrypoint (Vercel Serverless ready)
│   ├── package.json               # Backend npm metadata & scripts
│   ├── package-lock.json          
│   ├── controllers/               # Route handling logic
│   │   ├── adminController.js     # Administrative functions (Excel uploads, exports, bypasses)
│   │   ├── authController.js      # Student credential configurations & login
│   │   ├── cronController.js      # Serverless Daily cron timeline calculations
│   │   ├── projectController.js   # Student milestone project uploads & validations
│   │   ├── registerController.js  # Registration orders & Razorpay payment confirmations
│   │   ├── studentController.js   # Student dashboard statistics, profiles, and read alerts
│   │   └── verifyController.js    # Public certificate verification
│   ├── middleware/
│   │   └── auth.js                # JWT session verification middleware
│   ├── models/                    # MongoDB schemas
│   │   ├── Admin.js               # Admin authentication records
│   │   ├── Certificate.js         # Issued credentials records
│   │   ├── Counter.js             # Mongoose auto-increment keys
│   │   ├── ProjectSubmission.js   # Submitted student milestone projects
│   │   └── User.js                # Combined student profile & nested internship database
│   └── routes/                    # API sub-routers
│       ├── admin.js
│       ├── auth.js
│       ├── cron.js
│       ├── project.js
│       ├── register.js
│       ├── student.js
│       └── verify.js
│
├── FRONTEND/
│   ├── .env                       # Frontend public client variables
│   ├── .gitignore
│   ├── index.html
│   ├── netlify.toml               # Single Page Application SPA routing configuration
│   ├── package.json               # Frontend dependencies (React 19, Tailwind CSS v4)
│   ├── package-lock.json
│   ├── vite.config.js             # Vite configuration using Tailwind CSS v4 compiler
│   └── src/
│       ├── App.jsx                # React Router DOM routes and page mappings
│       ├── index.css              # Global styling layers
│       ├── main.jsx               # React DOM initialization
│       ├── Components/            # Core dashboard panels and user inputs
│       │   ├── AdminDashboard.jsx # Extensive admin system management UI
│       │   ├── AdminLogin.jsx     # Administrative secure access page
│       │   ├── Project.jsx        # Project submission portal
│       │   ├── Registration.jsx   # Interactive registration wizard
│       │   ├── SetupPassword.jsx  # Student first-time credential setup
│       │   ├── StudentDashboard.jsx# Student workspace dashboard
│       │   ├── StudentLogin.jsx   # Student login interface
│       │   └── Verify.jsx         # Public certificate verification page
│       └── Pages/                 # Structural pages and static documentation
│           ├── About.jsx
│           ├── Contact.jsx
│           ├── Footer.jsx
│           ├── Home.jsx
│           ├── Navbar.jsx
│           ├── Privacy.jsx
│           ├── Refund.jsx
│           ├── ResumeEmbed.jsx    # Custom interactive resume builder
│           ├── Services.jsx
│           └── Term.jsx
</pre>

<hr>

<h2 id="tech" style="color:#4CAF50; font-family: Arial, sans-serif;">🧰 Tech Stack</h2>

<table style="width:100%; border-collapse:collapse; font-family: Arial, sans-serif; margin-bottom: 20px;">
  <tr style="background:#1e293b; color:#fff;">
    <th style="padding:12px; border: 1px solid #ddd; text-align: left;">Category</th>
    <th style="padding:12px; border: 1px solid #ddd; text-align: left;">Technology Details</th>
  </tr>
  <tr>
    <td style="padding:10px; border: 1px solid #ddd; font-weight: bold;">Frontend UI</td>
    <td style="padding:10px; border: 1px solid #ddd;">React (v19), Vite (bundler), Tailwind CSS (v4)</td>
  </tr>
  <tr>
    <td style="padding:10px; border: 1px solid #ddd; font-weight: bold;">Routing</td>
    <td style="padding:10px; border: 1px solid #ddd;">React Router DOM (v7)</td>
  </tr>
  <tr>
    <td style="padding:10px; border: 1px solid #ddd; font-weight: bold;">Backend</td>
    <td style="padding:10px; border: 1px solid #ddd;">Node.js, Express.js (v5)</td>
  </tr>
  <tr>
    <td style="padding:10px; border: 1px solid #ddd; font-weight: bold;">Database</td>
    <td style="padding:10px; border: 1px solid #ddd;">MongoDB Atlas, Mongoose ODM</td>
  </tr>
  <tr>
    <td style="padding:10px; border: 1px solid #ddd; font-weight: bold;">Security / Auth</td>
    <td style="padding:10px; border: 1px solid #ddd;">JSON Web Tokens (JWT), BcryptJS password hashing</td>
  </tr>
  <tr>
    <td style="padding:10px; border: 1px solid #ddd; font-weight: bold;">File Uploads</td>
    <td style="padding:10px; border: 1px solid #ddd;">Multer, Cloudinary API integration (Student profile photos)</td>
  </tr>
  <tr>
    <td style="padding:10px; border: 1px solid #ddd; font-weight: bold;">Email Alerts</td>
    <td style="padding:10px; border: 1px solid #ddd;">Nodemailer (Gmail SMTP server integration), Resend SDK</td>
  </tr>
  <tr>
    <td style="padding:10px; border: 1px solid #ddd; font-weight: bold;">Spreadsheets</td>
    <td style="padding:10px; border: 1px solid #ddd;">SheetJS (XLSX parsing and compilation)</td>
  </tr>
  <tr>
    <td style="padding:10px; border: 1px solid #ddd; font-weight: bold;">Hosting Platforms</td>
    <td style="padding:10px; border: 1px solid #ddd;">Netlify (Client-side), Vercel Serverless (Server endpoints)</td>
  </tr>
</table>

<hr>

<h2 id="dependencies" style="color:#4CAF50; font-family: Arial, sans-serif;">📦 All Dependencies</h2>

<div style="display: flex; flex-wrap: wrap; gap: 20px; font-family: Arial, sans-serif;">
  
  <div style="flex: 1 1 45%; min-width: 280px;">
    <h3 style="color: #333; margin-bottom: 10px;">🔧 Backend Dependencies</h3>
    <table style="width:100%; border-collapse:collapse;">
      <tr style="background:#334155; color: #fff;">
        <th style="padding:8px; border: 1px solid #ddd; text-align: left;">Package</th>
        <th style="padding:8px; border: 1px solid #ddd; text-align: left;">Version</th>
      </tr>
      <tr><td style="padding:8px; border: 1px solid #ddd;">bcryptjs</td><td style="padding:8px; border: 1px solid #ddd;">^3.0.3</td></tr>
      <tr><td style="padding:8px; border: 1px solid #ddd;">cloudinary</td><td style="padding:8px; border: 1px solid #ddd;">^2.8.0</td></tr>
      <tr><td style="padding:8px; border: 1px solid #ddd;">cors</td><td style="padding:8px; border: 1px solid #ddd;">^2.8.5</td></tr>
      <tr><td style="padding:8px; border: 1px solid #ddd;">dotenv</td><td style="padding:8px; border: 1px solid #ddd;">^17.2.3</td></tr>
      <tr><td style="padding:8px; border: 1px solid #ddd;">express</td><td style="padding:8px; border: 1px solid #ddd;">^5.2.1</td></tr>
      <tr><td style="padding:8px; border: 1px solid #ddd;">jsonwebtoken</td><td style="padding:8px; border: 1px solid #ddd;">^9.0.3</td></tr>
      <tr><td style="padding:8px; border: 1px solid #ddd;">mongoose</td><td style="padding:8px; border: 1px solid #ddd;">^9.1.1</td></tr>
      <tr><td style="padding:8px; border: 1px solid #ddd;">multer</td><td style="padding:8px; border: 1px solid #ddd;">^2.0.2-beta.1</td></tr>
      <tr><td style="padding:8px; border: 1px solid #ddd;">nodemailer</td><td style="padding:8px; border: 1px solid #ddd;">^7.0.12</td></tr>
      <tr><td style="padding:8px; border: 1px solid #ddd;">resend</td><td style="padding:8px; border: 1px solid #ddd;">^6.6.0</td></tr>
      <tr><td style="padding:8px; border: 1px solid #ddd;">xlsx</td><td style="padding:8px; border: 1px solid #ddd;">^0.18.5</td></tr>
    </table>
  </div>

  <div style="flex: 1 1 45%; min-width: 280px;">
    <h3 style="color: #333; margin-bottom: 10px;">🎨 Frontend Dependencies</h3>
    <table style="width:100%; border-collapse:collapse;">
      <tr style="background:#334155; color: #fff;">
        <th style="padding:8px; border: 1px solid #ddd; text-align: left;">Package</th>
        <th style="padding:8px; border: 1px solid #ddd; text-align: left;">Version</th>
      </tr>
      <tr><td style="padding:8px; border: 1px solid #ddd;">@emailjs/browser</td><td style="padding:8px; border: 1px solid #ddd;">^4.4.1</td></tr>
      <tr><td style="padding:8px; border: 1px solid #ddd;">@tailwindcss/vite</td><td style="padding:8px; border: 1px solid #ddd;">^4.1.18</td></tr>
      <tr><td style="padding:8px; border: 1px solid #ddd;">axios</td><td style="padding:8px; border: 1px solid #ddd;">^1.13.2</td></tr>
      <tr><td style="padding:8px; border: 1px solid #ddd;">dotenv</td><td style="padding:8px; border: 1px solid #ddd;">^17.2.3</td></tr>
      <tr><td style="padding:8px; border: 1px solid #ddd;">lucide-react</td><td style="padding:8px; border: 1px solid #ddd;">^0.562.0</td></tr>
      <tr><td style="padding:8px; border: 1px solid #ddd;">react</td><td style="padding:8px; border: 1px solid #ddd;">^19.2.0</td></tr>
      <tr><td style="padding:8px; border: 1px solid #ddd;">react-dom</td><td style="padding:8px; border: 1px solid #ddd;">^19.2.0</td></tr>
      <tr><td style="padding:8px; border: 1px solid #ddd;">react-icons</td><td style="padding:8px; border: 1px solid #ddd;">^5.5.0</td></tr>
      <tr><td style="padding:8px; border: 1px solid #ddd;">react-router-dom</td><td style="padding:8px; border: 1px solid #ddd;">^7.11.0</td></tr>
      <tr><td style="padding:8px; border: 1px solid #ddd;">react-toastify</td><td style="padding:8px; border: 1px solid #ddd;">^11.0.5</td></tr>
      <tr><td style="padding:8px; border: 1px solid #ddd;">tailwindcss</td><td style="padding:8px; border: 1px solid #ddd;">^4.1.18</td></tr>
      <tr><td style="padding:8px; border: 1px solid #ddd;">xlsx</td><td style="padding:8px; border: 1px solid #ddd;">^0.18.5</td></tr>
    </table>
  </div>

</div>

<hr>

<h2 id="setup" style="color:#4CAF50; font-family: Arial, sans-serif;">⚙️ How to Use This Project</h2>

<div style="font-family: Arial, sans-serif; line-height: 1.6;">
  
  <h3 style="color:#333;">🧩 Local Backend Setup</h3>
  <ol>
    <li>Navigate to the BACKEND directory: <code>cd BACKEND</code></li>
    <li>Install NPM modules: <code>npm install</code></li>
    <li>Set up backend environment variables in a local <code>.env</code> file.</li>
    <li>
      <strong>Admin Registration Seeding:</strong> Create an admin credential seeding script named <code>createAdmin.js</code> (which is excluded by <code>.gitignore</code>) to write your administrator details to MongoDB:
      <pre style="background:#020617; padding:12px; border-radius:8px; color:#f8fafc; font-family:Consolas, monospace; font-size:12px; overflow-x:auto;">
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');
require('dotenv').config();

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  const hashedPassword = await bcrypt.hash('YOUR_ADMIN_PASSWORD', 10);
  await Admin.create({ username: 'admin', password: hashedPassword });
  console.log('Admin account created successfully!');
  process.exit();
}
seed();</pre>
      Execute this script locally to register your admin user:
      <code>node createAdmin.js</code>
    </li>
    <li>Start the backend application: <code>npm run dev</code></li>
  </ol>

  <h3 style="color:#333; margin-top:20px;">🌐 Local Frontend Setup</h3>
  <ol>
    <li>Navigate to the FRONTEND directory: <code>cd ../FRONTEND</code></li>
    <li>Install the frontend NPM requirements: <code>npm install</code></li>
    <li>Configure the client variables inside your local <code>.env</code>.</li>
    <li>Execute the Vite compiler server: <code>npm run dev</code></li>
  </ol>

</div>

<hr>

<h2 id="env" style="color:#4CAF50; font-family: Arial, sans-serif;">🔐 Environment Variables</h2>

<div style="font-family: Arial, sans-serif; line-height: 1.6;">

  <h3 style="color:#333;">🖥️ Backend Environment Configurations (<code>BACKEND/.env</code>)</h3>
  <table style="width:100%; border-collapse:collapse; margin-bottom: 20px;">
    <tr style="background:#1e293b; color:#fff;">
      <th style="padding:10px; border: 1px solid #ddd; text-align: left;">Key</th>
      <th style="padding:10px; border: 1px solid #ddd; text-align: left;">Usage</th>
      <th style="padding:10px; border: 1px solid #ddd; text-align: left;">Default / Value Format</th>
    </tr>
    <tr>
      <td style="padding:10px; border: 1px solid #ddd; font-family: monospace;">PORT</td>
      <td style="padding:10px; border: 1px solid #ddd;">Local backend server port</td>
      <td style="padding:10px; border: 1px solid #ddd; font-family: monospace;">5000</td>
    </tr>
    <tr>
      <td style="padding:10px; border: 1px solid #ddd; font-family: monospace;">MONGO_URI</td>
      <td style="padding:10px; border: 1px solid #ddd;">MongoDB Atlas database connection URI</td>
      <td style="padding:10px; border: 1px solid #ddd; font-family: monospace;">mongodb+srv://...</td>
    </tr>
    <tr>
      <td style="padding:10px; border: 1px solid #ddd; font-family: monospace;">JWT_SECRET</td>
      <td style="padding:10px; border: 1px solid #ddd;">Secret token key for session hashing and encryption</td>
      <td style="padding:10px; border: 1px solid #ddd;">your_jwt_private_key</td>
    </tr>
    <tr>
      <td style="padding:10px; border: 1px solid #ddd; font-family: monospace;">CLOUDINARY_NAME</td>
      <td style="padding:10px; border: 1px solid #ddd;">Cloudinary cloud project name</td>
      <td style="padding:10px; border: 1px solid #ddd; font-family: monospace;">dgtyqhtor</td>
    </tr>
    <tr>
      <td style="padding:10px; border: 1px solid #ddd; font-family: monospace;">CLOUDINARY_API_KEY</td>
      <td style="padding:10px; border: 1px solid #ddd;">Cloudinary API connection credential</td>
      <td style="padding:10px; border: 1px solid #ddd; font-family: monospace;">182749102839218</td>
    </tr>
    <tr>
      <td style="padding:10px; border: 1px solid #ddd; font-family: monospace;">CLOUDINARY_API_SECRET</td>
      <td style="padding:10px; border: 1px solid #ddd;">Cloudinary key signature</td>
      <td style="padding:10px; border: 1px solid #ddd; font-family: monospace;">xK187-s1a98as7</td>
    </tr>
    <tr>
      <td style="padding:10px; border: 1px solid #ddd; font-family: monospace;">EMAIL_USER</td>
      <td style="padding:10px; border: 1px solid #ddd;">Gmail address used for notifications and warnings</td>
      <td style="padding:10px; border: 1px solid #ddd; font-family: monospace;">system.codenova@gmail.com</td>
    </tr>
    <tr>
      <td style="padding:10px; border: 1px solid #ddd; font-family: monospace;">EMAIL_APP_PASSWORD</td>
      <td style="padding:10px; border: 1px solid #ddd;">Google generated app password</td>
      <td style="padding:10px; border: 1px solid #ddd; font-family: monospace;">xxxx xxxx xxxx xxxx</td>
    </tr>
    <tr>
      <td style="padding:10px; border: 1px solid #ddd; font-family: monospace;">CRON_SECRET</td>
      <td style="padding:10px; border: 1px solid #ddd;">Verification token to secure daily cron scheduler access</td>
      <td style="padding:10px; border: 1px solid #ddd;">bearer_cron_key_code</td>
    </tr>
  </table>

  <h3 style="color:#333; margin-top:20px;">🌐 Frontend Environment Configurations (<code>FRONTEND/.env</code>)</h3>
  <table style="width:100%; border-collapse:collapse;">
    <tr style="background:#1e293b; color:#fff;">
      <th style="padding:10px; border: 1px solid #ddd; text-align: left;">Key</th>
      <th style="padding:10px; border: 1px solid #ddd; text-align: left;">Usage</th>
      <th style="padding:10px; border: 1px solid #ddd; text-align: left;">Value Format</th>
    </tr>
    <tr>
      <td style="padding:10px; border: 1px solid #ddd; font-family: monospace;">VITE_BACKEND_URL</td>
      <td style="padding:10px; border: 1px solid #ddd;">Live backend API endpoint target</td>
      <td style="padding:10px; border: 1px solid #ddd; font-family: monospace;">http://localhost:5000 or production domain</td>
    </tr>
    <tr>
      <td style="padding:10px; border: 1px solid #ddd; font-family: monospace;">VITE_CLOUDINARY_CLOUD_NAME</td>
      <td style="padding:10px; border: 1px solid #ddd;">Cloudinary cloud project name</td>
      <td style="padding:10px; border: 1px solid #ddd; font-family: monospace;">dgtyqhtor</td>
    </tr>
    <tr>
      <td style="padding:10px; border: 1px solid #ddd; font-family: monospace;">VITE_CLOUDINARY_UPLOAD_PRESET</td>
      <td style="padding:10px; border: 1px solid #ddd;">Upload preset to enable direct image saves</td>
      <td style="padding:10px; border: 1px solid #ddd; font-family: monospace;">presets_profile</td>
    </tr>
    <tr>
      <td style="padding:10px; border: 1px solid #ddd; font-family: monospace;">VITE_EMAILJS_SERVICE_ID</td>
      <td style="padding:10px; border: 1px solid #ddd;">EmailJS service connector for public page inquiries</td>
      <td style="padding:10px; border: 1px solid #ddd; font-family: monospace;">service_xxxx</td>
    </tr>
    <tr>
      <td style="padding:10px; border: 1px solid #ddd; font-family: monospace;">VITE_EMAILJS_TEMPLATE_ID</td>
      <td style="padding:10px; border: 1px solid #ddd;">EmailJS template code</td>
      <td style="padding:10px; border: 1px solid #ddd; font-family: monospace;">template_xxxx</td>
    </tr>
    <tr>
      <td style="padding:10px; border: 1px solid #ddd; font-family: monospace;">VITE_EMAILJS_PUBLIC_KEY</td>
      <td style="padding:10px; border: 1px solid #ddd;">EmailJS developer public token</td>
      <td style="padding:10px; border: 1px solid #ddd; font-family: monospace;">user_xxxx</td>
    </tr>
  </table>

</div>

<hr>

<h2 id="features" style="color:#4CAF50; font-family: Arial, sans-serif;">✨ Key Features</h2>

<ul style="font-family: Arial, sans-serif; line-height: 1.6;">
  <li>🏠 Modern and responsive Home page: Built using a modern dark UI and tailored color schemes.</li>
  <li>🛠️ Services section**: Thorough descriptions detailing all developer courses and internship tracks.</li>
  <li>🧑‍💻 Dynamic Student Dashboard: Lets students verify milestone progression alerts, save password details on first login, customize profiles, and submit milestone codes.</li>
  <li>🤖 Automated Timeline checks via Cron Jobs: Daily serverless updates that calculate days elapsed, save notification arrays directly to user schemas, and email warnings via Nodemailer.</li>
  <li>📊 Robust Admin Control Panel: Provides custom start date assignments, offer letter dispatch status settings, and exports specifically filtered pipelines (like Paid subscribers) as clean Excel sheets.</li>
  <li>🔐 Certificate Verification Portal: Instant, public verification lookup system mapping issued IDs to authenticated certificates database.</li>
  <li>⚡ SEO Optimization: Fully optimized metadata structures matching standard web guidelines.</li>
</ul>

<hr>

<h2 id="mechanics" style="color:#4CAF50; font-family: Arial, sans-serif;">⚡ Core Mechanics & Process Logic</h2>

<div style="font-family: Arial, sans-serif; line-height: 1.6;">

  <h3 style="color:#333;">1. Milestone Alerting & Warning Algorithm</h3>
  <p>
    When a student accesses their dashboard portal, the platform calculates their milestone metrics on the fly based on the internship's admin-assigned <code>startDate</code>:
  </p>
  <ul>
    <li>
      <strong>Days Passed Calculation:</strong>
      <pre style="background:#020617; padding:8px 12px; border-radius:5px; color:#f8fafc; display:inline-block; font-family:Consolas, monospace;">Math.floor((today - startDate) / (1000 * 60 * 60 * 24))</pre>
    </li>
    <li>
      <strong>Progress Metric:</strong> Computes the current target month using the student's submission count:
      <pre style="background:#020617; padding:8px 12px; border-radius:5px; color:#f8fafc; display:inline-block; font-family:Consolas, monospace;">const currentDueMonth = submittedMonths + 1;</pre>
    </li>
    <li>
      <strong>Alert States:</strong>
      <ul>
        <li><span style="color:#22c55e; font-weight:bold;">Green Alert (Milestone approaching):</span> Days elapsed is within 10 days of the deadline: <code>daysElapsed >= (30 * currentDueMonth - 10)</code>.</li>
        <li><span style="color:#eab308; font-weight:bold;">Yellow Alert (Due window open):</span> Days elapsed has crossed the warning threshold: <code>daysElapsed >= (30 * currentDueMonth - 2 * currentDueMonth)</code>.</li>
        <li><span style="color:#ef4444; font-weight:bold;">Red Alert (Delayed):</span> Student has exceeded the 30-day milestone mark: <code>daysElapsed >= (30 * currentDueMonth)</code>.</li>
      </ul>
    </li>
    <li>
      <strong>Dashboard Bypass:</strong> Students are never locked out of submissions, ensuring they can submit delayed tasks. Admins can globally configure block bypasses using the <code>bypassBlock</code> setting.
    </li>
  </ul>

  <h3 style="color:#333; margin-top:20px;">2. Automated Serverless Cron Engine</h3>
  <p>
    A Vercel daily serverless scheduler maps system-wide milestones to prevent late submissions. The cron runner hits <code>GET /api/cron/daily</code>:
  </p>
  <ol>
    <li>Secures the endpoint by checking the request's <code>Authorization: Bearer CRON_SECRET</code> header.</li>
    <li>Queries all student models with active internship start dates.</li>
    <li>Computes days passed for each nested program.</li>
    <li>Checks if the student's progress has crossed a milestone interval (every 28 days represents a month segment).</li>
    <li>
      If a milestone boundary is crossed and a warning has not been issued yet:
      <ul>
        <li>Pushes a warning object natively into the student's <code>internships.alerts</code> MongoDB sub-document.</li>
        <li>Dispatches an email notification via Nodemailer to prompt the student.</li>
        <li>Saves the user model state.</li>
      </ul>
    </li>
  </ol>

  <h3 style="color:#333; margin-top:20px;">3. Excel Export pipelines</h3>
  <p>
    To ensure seamless student coordination, the Admin Dashboard exports custom spreadsheet files on the fly:
  </p>
  <ul>
    <li><strong>Paid Intern Pipeline:</strong> Exports a list of students who have completed payment checks (<code>hasPaid = true</code>), and sets `paidExported = true` to avoid duplicate exports.</li>
    <li><strong>Project Pipeline:</strong> Consolidates submissions and links for students who have uploaded milestones, setting `projectExported = true` once completed.</li>
  </ul>

</div>

<hr>

<h2 id="api" style="color:#4CAF50; font-family: Arial, sans-serif;">📡 API Endpoints Reference</h2>

<div style="font-family: Arial, sans-serif; line-height: 1.6;">

  <p>All API endpoints are prefixed with <code>/api</code>. Enforced access validations require passing a bearer token processed by the <code>auth</code> middleware.</p>

  <h3 style="color:#333;">🔐 Authentication Endpoints (<code>/api/auth</code>)</h3>
  <table style="width:100%; border-collapse:collapse; margin-bottom: 20px;">
    <tr style="background:#1e293b; color:#fff;">
      <th style="padding:10px; border: 1px solid #ddd; text-align: left;">Route</th>
      <th style="padding:10px; border: 1px solid #ddd; text-align: left;">Method</th>
      <th style="padding:10px; border: 1px solid #ddd; text-align: left;">Auth Required</th>
      <th style="padding:10px; border: 1px solid #ddd; text-align: left;">Description</th>
    </tr>
    <tr>
      <td style="padding:10px; border: 1px solid #ddd; font-family: monospace;">/login</td>
      <td style="padding:10px; border: 1px solid #ddd; font-weight: bold; color:#2563eb;">POST</td>
      <td style="padding:10px; border: 1px solid #ddd; color:gray;">None</td>
      <td style="padding:10px; border: 1px solid #ddd;">Validates student credentials, returning profile statistics and a JWT session token.</td>
    </tr>
    <tr>
      <td style="padding:10px; border: 1px solid #ddd; font-family: monospace;">/setup-password</td>
      <td style="padding:10px; border: 1px solid #ddd; font-weight: bold; color:#2563eb;">POST</td>
      <td style="padding:10px; border: 1px solid #ddd; color:#16a34a; font-weight: bold;">Student JWT</td>
      <td style="padding:10px; border: 1px solid #ddd;">Hashes the new password and sets <code>isFirstLogin</code> to false.</td>
    </tr>
  </table>

  <h3 style="color:#333; margin-top:20px;">👥 Student Endpoints (<code>/api/student</code>)</h3>
  <table style="width:100%; border-collapse:collapse; margin-bottom: 20px;">
    <tr style="background:#1e293b; color:#fff;">
      <th style="padding:10px; border: 1px solid #ddd; text-align: left;">Route</th>
      <th style="padding:10px; border: 1px solid #ddd; text-align: left;">Method</th>
      <th style="padding:10px; border: 1px solid #ddd; text-align: left;">Auth Required</th>
      <th style="padding:10px; border: 1px solid #ddd; text-align: left;">Description</th>
    </tr>
    <tr>
      <td style="padding:10px; border: 1px solid #ddd; font-family: monospace;">/dashboard</td>
      <td style="padding:10px; border: 1px solid #ddd; font-weight: bold; color:#16a34a;">GET</td>
      <td style="padding:10px; border: 1px solid #ddd; color:#16a34a; font-weight: bold;">Student JWT</td>
      <td style="padding:10px; border: 1px solid #ddd;">Fetches profile statistics, nested internship dates, current milestone targets, and active alerts.</td>
    </tr>
    <tr>
      <td style="padding:10px; border: 1px solid #ddd; font-family: monospace;">/profile</td>
      <td style="padding:10px; border: 1px solid #ddd; font-weight: bold; color:#2563eb;">POST</td>
      <td style="padding:10px; border: 1px solid #ddd; color:#16a34a; font-weight: bold;">Student JWT</td>
      <td style="padding:10px; border: 1px solid #ddd;">Updates the student's profile information (GitHub, LinkedIn, Portfolio links, and profile image).</td>
    </tr>
    <tr>
      <td style="padding:10px; border: 1px solid #ddd; font-family: monospace;">/mark-alert</td>
      <td style="padding:10px; border: 1px solid #ddd; font-weight: bold; color:#2563eb;">POST</td>
      <td style="padding:10px; border: 1px solid #ddd; color:#16a34a; font-weight: bold;">Student JWT</td>
      <td style="padding:10px; border: 1px solid #ddd;">Flags a specific alert inside the internship sub-document as read.</td>
    </tr>
  </table>

  <h3 style="color:#333; margin-top:20px;">🛡️ Administrative Endpoints (<code>/api/admin</code>)</h3>
  <table style="width:100%; border-collapse:collapse; margin-bottom: 20px;">
    <tr style="background:#1e293b; color:#fff;">
      <th style="padding:10px; border: 1px solid #ddd; text-align: left;">Route</th>
      <th style="padding:10px; border: 1px solid #ddd; text-align: left;">Method</th>
      <th style="padding:10px; border: 1px solid #ddd; text-align: left;">Auth Required</th>
      <th style="padding:10px; border: 1px solid #ddd; text-align: left;">Description</th>
    </tr>
    <tr>
      <td style="padding:10px; border: 1px solid #ddd; font-family: monospace;">/login</td>
      <td style="padding:10px; border: 1px solid #ddd; font-weight: bold; color:#2563eb;">POST</td>
      <td style="padding:10px; border: 1px solid #ddd; color:gray;">None</td>
      <td style="padding:10px; border: 1px solid #ddd;">Validates administrative credentials and returns a secure admin JWT token.</td>
    </tr>
    <tr>
      <td style="padding:10px; border: 1px solid #ddd; font-family: monospace;">/internships</td>
      <td style="padding:10px; border: 1px solid #ddd; font-weight: bold; color:#16a34a;">GET</td>
      <td style="padding:10px; border: 1px solid #ddd; color:#e11d48; font-weight: bold;">Admin JWT</td>
      <td style="padding:10px; border: 1px solid #ddd;">Retrieves a complete list of student profiles and applications.</td>
    </tr>
    <tr>
      <td style="padding:10px; border: 1px solid #ddd; font-family: monospace;">/set-start-date</td>
      <td style="padding:10px; border: 1px solid #ddd; font-weight: bold; color:#2563eb;">POST</td>
      <td style="padding:10px; border: 1px solid #ddd; color:#e11d48; font-weight: bold;">Admin JWT</td>
      <td style="padding:10px; border: 1px solid #ddd;">Sets the start date for a student's internship, which triggers milestone calculations.</td>
    </tr>
    <tr>
      <td style="padding:10px; border: 1px solid #ddd; font-family: monospace;">/update-paid-status</td>
      <td style="padding:10px; border: 1px solid #ddd; font-weight: bold; color:#2563eb;">POST</td>
      <td style="padding:10px; border: 1px solid #ddd; color:#e11d48; font-weight: bold;">Admin JWT</td>
      <td style="padding:10px; border: 1px solid #ddd;">Manually updates a student's payment completion status.</td>
    </tr>
    <tr>
      <td style="padding:10px; border: 1px solid #ddd; font-family: monospace;">/update-bypass-block</td>
      <td style="padding:10px; border: 1px solid #ddd; font-weight: bold; color:#2563eb;">POST</td>
      <td style="padding:10px; border: 1px solid #ddd; color:#e11d48; font-weight: bold;">Admin JWT</td>
      <td style="padding:10px; border: 1px solid #ddd;">Configures the late submission block bypass for a student's profile.</td>
    </tr>
    <tr>
      <td style="padding:10px; border: 1px solid #ddd; font-family: monospace;">/upload-certificates</td>
      <td style="padding:10px; border: 1px solid #ddd; font-weight: bold; color:#2563eb;">POST</td>
      <td style="padding:10px; border: 1px solid #ddd; color:#e11d48; font-weight: bold;">Admin JWT</td>
      <td style="padding:10px; border: 1px solid #ddd;">Parses an Excel spreadsheet in bulk to populate the certificates database.</td>
    </tr>
  </table>

  <h3 style="color:#333; margin-top:20px;">🤖 Automated Scheduler Engine Endpoints (<code>/api/cron</code>)</h3>
  <table style="width:100%; border-collapse:collapse; margin-bottom: 20px;">
    <tr style="background:#1e293b; color:#fff;">
      <th style="padding:10px; border: 1px solid #ddd; text-align: left;">Route</th>
      <th style="padding:10px; border: 1px solid #ddd; text-align: left;">Method</th>
      <th style="padding:10px; border: 1px solid #ddd; text-align: left;">Auth Required</th>
      <th style="padding:10px; border: 1px solid #ddd; text-align: left;">Description</th>
    </tr>
    <tr>
      <td style="padding:10px; border: 1px solid #ddd; font-family: monospace;">/daily</td>
      <td style="padding:10px; border: 1px solid #ddd; font-weight: bold; color:#16a34a;">GET</td>
      <td style="padding:10px; border: 1px solid #ddd; color:gray;">CRON_SECRET Check</td>
      <td style="padding:10px; border: 1px solid #ddd;">Triggers daily milestone checks, pushes notifications, and sends reminder emails.</td>
    </tr>
  </table>

</div>

<hr>

<div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
    <h2 id="screenshots" style="color: #4CAF50; font-size: 28px; font-weight: bold; margin-bottom: 20px;">📸 Screenshots</h2>
    <p style="font-size: 16px; color: #666; margin-bottom: 20px;">
        Explore the interface of Code-A-Nova to explore services, register for internships, receive email notifications, verify certificates, and contact the organization through a seamless and user-friendly interface.
    </p>
    <div style="display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 20px;">
        <div style="flex: 1 1 280px; background-color: #fff; padding: 15px; text-align: center; border: 1px solid #ddd;">
            <h3 style="color: #333; font-size: 20px; font-weight: bold; margin: 0 0 10px;">🏠 Home Page – A clean and responsive landing page introducing Code-A-Nova and its mission.</h3>
            <img src="https://res.cloudinary.com/dgtyqhtor/image/upload/v1767951669/Screenshot_2026-01-09_150858_z7h2vj.png" alt="Home Page" style="max-width: 100%; height: auto; border: 1px solid #ddd;">
        </div>
        <div style="flex: 1 1 280px; background-color: #fff; padding: 15px; text-align: center; border: 1px solid #ddd;">
            <h3 style="color: #333; font-size: 20px; font-weight: bold; margin: 0 0 10px;">ℹ️ About Us – Information about the company, vision, and core values of Code-A-Nova.</h3>
            <img src="https://res.cloudinary.com/dgtyqhtor/image/upload/v1767951669/Screenshot_2026-01-09_150910_orranx.png" alt="About Us" style="max-width: 100%; height: auto; border: 1px solid #ddd;">
        </div>
        <div style="flex: 1 1 280px; background-color: #fff; padding: 15px; text-align: center; border: 1px solid #ddd;">
            <h3 style="color: #333; font-size: 20px; font-weight: bold; margin: 0 0 10px;">🛠️ Our Services – Detailed overview of internships and training programs offered by the startup.</h3>
            <img src="https://res.cloudinary.com/dgtyqhtor/image/upload/v1767951670/Screenshot_2026-01-09_150927_agqany.png" alt="Our Services" style="max-width: 100%; height: auto; border: 1px solid #ddd;">
        </div>
        <div style="flex: 1 1 280px; background-color: #fff; padding: 15px; text-align: center; border: 1px solid #ddd;">
            <h3 style="color: #333; font-size: 20px; font-weight: bold; margin: 0 0 10px;">📝 Internship Registration – Simple and user-friendly form for students to apply for internships.</h3>
            <img src="https://res.cloudinary.com/dgtyqhtor/image/upload/v1767951669/Screenshot_2026-01-09_150938_e8gryt.png" alt="Internship Registration" style="max-width: 100%; height: auto; border: 1px solid #ddd;">
        </div>
        <div style="flex: 1 1 280px; background-color: #fff; padding: 15px; text-align: center; border: 1px solid #ddd;">
            <h3 style="color: #333; font-size: 20px; font-weight: bold; margin: 0 0 10px;">📞 Contact Us – Contact form integrated with Getform.io for seamless user communication.</h3>
            <img src="https://res.cloudinary.com/dgtyqhtor/image/upload/v1767951669/Screenshot_2026-01-09_150949_hr91ud.png" alt="Contact Us" style="max-width: 100%; height: auto; border: 1px solid #ddd;">
        </div>
        <div style="flex: 1 1 280px; background-color: #fff; padding: 15px; text-align: center; border: 1px solid #ddd;">
            <h3 style="color: #333; font-size: 20px; font-weight: bold; margin: 0 0 10px;">📜 Certificate Verification – Secure interface to verify the authenticity of issued certificates.</h3>
            <img src="https://res.cloudinary.com/dgtyqhtor/image/upload/v1767951670/Screenshot_2026-01-09_151020_ckfuva.png" alt="Verify Your Certificate" style="max-width: 100%; height: auto; border: 1px solid #ddd;">
        </div>
    </div>
</div>

<hr>

<h2 id="enhancements" style="color:#4CAF50; font-family: Arial, sans-serif;">🚀 Future Enhancements</h2>
<ul style="font-family: Arial, sans-serif; line-height: 1.6;">
  <li>📊 Extended reports and analysis</li>
  <li>🧾 Student detailed profile dashboards</li>
  <li>📱 Fully native mobile-responsive layouts</li>
  <li>🔐 Dynamic two-factor authentication channels</li>
</ul> 

<hr> 

<h2 id="contact" style="color:#4CAF50; font-family: Arial, sans-serif;">📬 Contact Me</h2>
<ul style="font-family: Arial, sans-serif; line-height: 1.6;">
  <li><strong>Name:</strong> Aman Gupta</li>
  <li><strong>Email:</strong> <a href="mailto:ag0567688@gmail.com" style="color:#4CAF50; text-decoration:none; font-weight:bold;">ag0567688@gmail.com</a></li>
  <li><strong>LinkedIn:</strong> <a href="https://linkedin.com/in/amangupta9454" style="color:#4CAF50; text-decoration:none; font-weight:bold;">linkedin.com/in/amangupta9454</a></li>
  <li><strong>GitHub:</strong> <a href="https://github.com/amangupta9454" style="color:#4CAF50; text-decoration:none; font-weight:bold;">github.com/amangupta9454</a></li>
  <li><strong>Portfolio:</strong> <a href="http://gupta-aman-portfolio.netlify.app/" style="color:#4CAF50; text-decoration:none; font-weight:bold;">gupta-aman-portfolio.netlify.app</a></li>
</ul> 

<hr>

<h2 id="creator" style="color:#4CAF50; font-family: Arial, sans-serif; text-align: center;">👨‍💻 Created By</h2> 
<p style="text-align:center; color:#94a3b8; font-family: Arial, sans-serif; line-height: 1.6;">
  Created by <strong>Aman Gupta</strong> | First Freelance Project for Code-A-Nova  
</p>
<p align="center" style="font-family: Arial, sans-serif;">⭐ If you found this project helpful, give it a star!</p>
