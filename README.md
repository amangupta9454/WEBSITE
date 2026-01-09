<h1 align="center" style="color:#4CAF50; font-size: 40px;">🚀 Code-A-Nova – Official Website</h1>
<h3 align="center" style="color:gray;"> A full-stack web platform built for managing internships, training programs, certificate verification, and student engagement.</h3>


<li><a href="https://code-a-nova.online/">LIVE DEMO</a></li>

<hr>

<h2>📚 Table of Contents</h2>

<ul>
  <li><a href="#about">About the Project</a></li>
  <li><a href="#structure">Folder & File Structure</a></li>
  <li><a href="#tech">Tech Stack</a></li>
  <li><a href="#dependencies">All Dependencies</a></li>
  <li><a href="#setup">How to Use This Project</a></li>
  <li><a href="#features">Key Features</a></li>
  <li><a href="#enhancements">Future Enhancements</a></li>
  <li><a href="#contact">Contact Me</a></li>
  <li><a href="#creator">Created By</a></li>
</ul>

<hr>

<h2 id="about">🧭 About the Project</h2>

<p>
    This is my <strong>first freelance project</strong> developed for <strong>Code-A-Nova</strong>, a startup that provides
    <strong>internships and industry-level training</strong> to students.  
    The platform is designed to be simple, scalable, and student-friendly.
  </p>

  <ul>
    <li>🎓 Students can explore internships and services</li>
    <li>📝 Register for internship programs</li>
    <li>📧 Automated email notifications</li>
    <li>🔐 Certificate verification system</li>
    <li>📨 Contact form integrated with Getform.io</li>
  </ul>

<hr>

<h2 id="structure">🗂️ Folder & File Structure</h2>

<pre>
AGRI/
├── BACKEND/
│   ├── .env
│   ├── .gitignore
│   ├── createAdmin.js
│   ├── package.json
│   ├── package-lock.json
│   ├── server.js
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── registerController.js
│   │   ├── verifyController.js
│   ├── middleware/
│   │   ├── auth.js
│   ├── models/
│   │   ├── Admin.js
│   │   ├── Certificate.js
│   │   ├── Counter.js
│   │   ├── User.js
│   ├── routes/
│   │   ├── admin.js
│   │   ├── auth.js
│   │   ├── register.js
│   │   ├── verify.js
├── FRONTEND/
│   ├── .env
│   ├── .gitignore
│   ├── index.html
│   ├── netlify.toml
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js
│   ├── dist/
│   ├── node_modules/
│   ├── public/
│   └── src/
│       ├── app.jsx
│       ├── index.css
│       ├── main.jsx
│       ├── assets/
│       ├── components/
│       │   ├── AdminLogin.jsx
│       │   ├── AdminDashboard.jsx
│       │   ├── Login.jsx
│       │   ├── ProtectedRoute.jsx
│       │   ├── Register.jsx
│       │   ├── Registration.jsx
│       │   ├── StudentDashboard.jsx
│       │   ├── Verify.jsx
│       ├── pages/
│       │   ├── About.jsx
│       │   ├── Contact.jsx
│       │   ├── Footer.jsx
│       │   ├── Home.jsx
│       │   ├── Navbar.jsx
│       │   ├── Privacy.jsx
│       │   ├── Refund.jsx
│       │   ├── Services.jsx
│       │   └── Term.jsx
</pre>

<hr>

<h2 id="tech">🧰 Tech Stack</h2>

<table style="width:100%; border-collapse:collapse;">
    <tr style="background:#1e293b;">
      <th style="padding:10px;">Category</th>
      <th style="padding:10px;">Technology</th>
    </tr>
    <tr><td style="padding:10px;">Frontend</td><td style="padding:10px;">React, Vite, HTML, CSS</td></tr>
    <tr><td style="padding:10px;">Backend</td><td style="padding:10px;">Node.js, Express.js</td></tr>
    <tr><td style="padding:10px;">Database</td><td style="padding:10px;">MongoDB</td></tr>
    <tr><td style="padding:10px;">Email</td><td style="padding:10px;">Nodemailer</td></tr>
    <tr><td style="padding:10px;">Forms</td><td style="padding:10px;">Getform.io</td></tr>
    <tr><td style="padding:10px;">Hosting</td><td style="padding:10px;">Vercel</td></tr>
  </table>

<hr>

<h2 id="dependencies">📦 All Dependencies</h2>

<h3>🔧 Backend</h3>

<table>
  <tr><th>Package</th><th>Version</th></tr>

  <tr><td>bcryptjs</td><td>^3.0.3</td></tr>
  <tr><td>cloudinary</td><td>^2.8.0</td></tr>
  <tr><td>cors</td><td>^2.8.5</td></tr>
  <tr><td>dotenv</td><td>^17.2.3</td></tr>
  <tr><td>express</td><td>^5.2.1</td></tr>
  <tr><td>jsonwebtoken</td><td>^9.0.3</td></tr>
  <tr><td>mongoose</td><td>^9.1.1</td></tr>
  <tr><td>multer</td><td>^2.0.2</td></tr>
  <tr><td>nodemailer</td><td>^7.0.12</td></tr>
  <tr><td>resend</td><td>^6.6.0</td></tr>
  <tr><td>xlsx</td><td>^0.18.5</td></tr>
</table>


<h3>🎨 Frontend</h3>

<table>
  <tr><th>Package</th><th>Version</th></tr>
  <tr><td>@emailjs/browser</td><td>^4.4.1</td></tr>
  <tr><td>@tailwindcss/vite</td><td>^4.1.18</td></tr>
  <tr><td>axios</td><td>^1.13.2</td></tr>
  <tr><td>dotenv</td><td>^17.2.3</td></tr>
  <tr><td>lucide-react</td><td>^0.562.0</td></tr>
  <tr><td>react</td><td>^19.2.0</td></tr>
  <tr><td>react-dom</td><td>^19.2.0</td></tr>
  <tr><td>react-icons</td><td>^5.5.0</td></tr>
  <tr><td>react-router-dom</td><td>^7.11.0</td></tr>
  <tr><td>react-toastify</td><td>^11.0.5</td></tr>
  <tr><td>tailwindcss</td><td>^4.1.18</td></tr>
  <tr><td>xlsx</td><td>^0.18.5</td></tr>
</table>


<hr>

<h2 id="setup">⚙️ How to Use This Project</h2>

<h3>🧩 Backend</h3>

<ol>
    <li>📥 Clone the repository</li>
    <li>📦 Install dependencies for frontend and backend</li>
    <li>🔐 Configure environment variables</li>
    <li>▶️ Start backend server</li>
    <li>🌐 Start frontend application</li>
  </ol>

  <!-- ENV SETUP -->
  <h2>🔐 Environment Variables</h2>

  <h3>🖥️ Backend (.env)</h3>
  <pre style="background:#020617; padding:16px; border-radius:10px;">
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   CLOUDINARY_NAME= your cloud name
   CLOUDINARY_API_KEY= your api key
   CLOUDINARY_API_SECRET= your api secret
   JWT_SECRET= your jwt secret
  </pre>

  <h3>🌐 Frontend (.env)</h3>
  <pre style="background:#020617; padding:16px; border-radius:10px;">
    VITE_BACKEND_URL= your backend url
    VITE_CLOUDINARY_CLOUD_NAME= your cloud name
    VITE_CLOUDINARY_UPLOAD_PRESET= your upload preset
    VITE_EMAILJS_SERVICE_ID= your emailjs service id
    VITE_EMAILJS_TEMPLATE_ID= your emailjs template id
    VITE_EMAILJS_PUBLIC_KEY= your emailjs public key
  </pre>

<hr> 
<h2 id="features">✨ Key Features</h2>
  <ul>
    <li>🏠 Modern and responsive Home page</li>
    <li>🛠️ Services section with detailed offerings</li>
    <li>🧑‍💻 Internship registration system</li>
    <li>📩 Email notification support</li>
    <li>📜 Certificate verification portal</li>
    <li>📞 Contact form powered by Getform.io</li>
    <li>⚡ Fast and SEO-friendly frontend</li>
    <li>🔑 Admin dashboard</li>
  </ul>
        <hr> 
        <h2 id="enhancements">🚀 Future Enhancements</h2>
         <ul>
          <li>📊 Analytics & reports</li>
          <li>🧾 Student profile management</li>
          <li>📱 Mobile-friendly improvements</li>
          <li>🔐 Advanced authentication</li>
            </ul> 
            <hr> 
            <h2 id="contact">📬 Contact Me</h2>
             <ul>
              <li><strong>Name:</strong> Aman Gupta</li>
               <li><strong>Email:</strong>  <a href="ag0567688@gmail.com">Send me an email</a> </li>
                <li><strong>LinkedIn:</strong> <a href="https://linkedin.com/in/amangupta9454">LINKEDIN</a></li>
                 <li><strong>GitHub:</strong> <a href="https://github.com/amangupta9454">GITHUB</a></li>
                 <li><strong>Portfolio:</strong> <a href="http://gupta-aman-portfolio.netlify.app/">PORTFOLIO</a></li>
                  </ul> 
                  <hr>
                   <h2 id="creator">👨‍💻 Created By</h2> 
                   <p style="text-align:center; color:#94a3b8;">
                   👨‍💻 Created by <strong>Aman Gupta</strong> | First Freelance Project for Code-A-Nova  </p>
                    <p align="center">⭐ If you found this project helpful, give it a star!</p>

