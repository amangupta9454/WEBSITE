import React from "react";
import MainLayout from '../layouts/MainLayout';
import SEO from '../Components/SEO';
import { motion } from "framer-motion";
import { fadeUp } from '../animations/variants';
import { Shield, Lock, Eye, FileText, CheckCircle2 } from "lucide-react";

const Privacy = () => {
  const sections = [
    {
      title: "1. Information We Collect",
      content: (
        <>
          <p className="mb-4">
            We collect personal information directly when you interact with our website, submit forms, apply for programs, or utilize our digital tools. The categories of data collected include:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Contact & Project Inquiries:</strong> Your full name, email address, phone or WhatsApp number, requested service type, and project specifications submitted via our contact forms.
            </li>
            <li>
              <strong>Student & Internship Applications:</strong> Full name, email address, mobile/WhatsApp number, college or university name, degree/specialization, graduation year, state/location, and professional links (GitHub, LinkedIn, or portfolio URLs).
            </li>
            <li>
              <strong>Account Registration & Credentials:</strong> Email address, name, and securely hashed passwords created for accessing student dashboards and portal tools.
            </li>
            <li>
              <strong>Resume Builder & Uploaded Documents:</strong> Professional history, education records, project summaries, and technical skills provided when using our resume builder or uploading files.
            </li>
            <li>
              <strong>Technical & Usage Data:</strong> Standard server logs including IP address, browser type, device information, operating system, and referral source collected for diagnostic and security purposes.
            </li>
          </ul>
        </>
      )
    },
    {
      title: "2. How We Use Collected Information",
      content: (
        <>
          <p className="mb-4">Information gathered through our platform is used solely for legitimate operational purposes:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>To review project briefs and prepare customized software engineering proposals.</li>
            <li>To process internship applications, manage task evaluations, and issue verifiable digital completion certificates.</li>
            <li>To authenticate registered users and maintain personal dashboard sessions.</li>
            <li>To provide customer support and respond to incoming technical queries.</li>
            <li>To detect, prevent, and address technical issues, fraud, or misuse of our services.</li>
          </ul>
        </>
      )
    },
    {
      title: "3. Third-Party Advertising & Google AdSense Cookie Disclosure",
      content: (
        <>
          <p className="mb-4">
            We display advertisements provided by <strong>Google AdSense</strong> to support our informational resources and free developer tools. In compliance with Google's advertising policies:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Third-Party Vendors & Cookies:</strong> Third-party vendors, including Google, use cookies to serve ads based on a user's prior visits to this website or other websites across the internet.
            </li>
            <li>
              <strong>Advertising Cookies:</strong> Google's use of advertising cookies enables it and its partners to serve targeted ads to users based on their browsing behavior on our platform and across other digital properties.
            </li>
            <li>
              <strong>Opt-Out Options:</strong> You can opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-semibold">Google Ads Settings</a>. Alternatively, you can opt out of third-party vendor cookies for personalized advertising by visiting <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-semibold">aboutads.info</a>.
            </li>
            <li>
              <strong>Browser Controls:</strong> Most web browsers allow you to manage or block cookie settings entirely through browser preferences.
            </li>
          </ul>
        </>
      )
    },
    {
      title: "4. Third-Party Service Providers",
      content: (
        <>
          <p className="mb-4">
            We rely on reputable cloud infrastructure and processing providers to operate our platform securely:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Database & Cloud Hosting:</strong> MongoDB Atlas cloud databases and cloud edge networks for data storage and content delivery.</li>
            <li><strong>Payment Processing:</strong> Razorpay for any optional digital tokens or platform features. We never collect or store sensitive credit card numbers, UPI PINs, or bank account credentials on our servers.</li>
            <li><strong>Transactional Email Services:</strong> Hostinger SMTP and Resend for delivering contact form confirmations and administrative notifications.</li>
          </ul>
        </>
      )
    },
    {
      title: "5. Data Storage & Security",
      content: (
        <p>
          We implement industry-standard physical, electronic, and administrative safeguards to protect user information against unauthorized access, loss, or misuse. All sensitive transmissions are encrypted using Transport Layer Security (TLS/HTTPS). Account passwords are encrypted using one-way cryptographic hashing algorithms. However, no internet-based transmission is completely invulnerable, and we encourage users to maintain unique, secure passwords.
        </p>
      )
    },
    {
      title: "6. Data Retention & Deletion Requests",
      content: (
        <p>
          We retain personal information for the period necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required by law. Users have the right to request access to their personal data, correct inaccurate details, or request full deletion of their account and associated submissions. To request data deletion, please contact us at <strong>codeanova26@gmail.com</strong> or <strong>hr@code-a-nova.online</strong>.
        </p>
      )
    },
    {
      title: "7. Children's Privacy",
      content: (
        <p>
          Our platform is intended for university students, professionals, and adult business clients. We do not knowingly collect personal data from individuals under the age of 13. If you believe a child has provided us with personal information, please contact us immediately so we can promptly delete the data.
        </p>
      )
    },
    {
      title: "8. Policy Updates & Contact",
      content: (
        <p>
          We may update this Privacy Policy periodically to reflect technological or legal changes. Any modifications will be posted on this page with an updated revision date. If you have questions regarding this policy, please reach out to us at <strong>codeanova26@gmail.com</strong> or through our Contact page.
        </p>
      )
    }
  ];

  return (
    <MainLayout>
      <SEO 
        title="Privacy Policy | Code-A-Nova"
        description="Review Code-A-Nova's official Privacy Policy, outlining our data collection practices, Google AdSense cookie disclosures, and user rights."
        canonicalUrl="https://code-a-nova.online/privacy-policy"
      />
      <div className="pt-32 pb-24 bg-[#FAFAFA] min-h-screen relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-50 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl mb-6 shadow-sm border border-blue-100">
              <Shield size={32} />
            </div>
            <h1 className="text-4xl md:text-6xl font-black mb-4 text-gray-900 tracking-tight">Privacy Policy</h1>
            <p className="text-gray-500 text-sm md:text-base font-medium">Last Updated: September 2026</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white border border-gray-100 rounded-3xl p-8 md:p-12 shadow-sm"
          >
            <div className="space-y-10">
              <p className="text-gray-600 font-medium leading-relaxed pb-6 border-b border-gray-100">
                Code-A-Nova ("we", "our", or "us") is dedicated to maintaining the confidentiality and integrity of your personal information. This Privacy Policy details how we handle data collected through our corporate website, custom software solutions, student internship portal, and educational resources.
              </p>

              {sections.map((sec, idx) => (
                <div key={idx} className="space-y-3">
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900">{sec.title}</h2>
                  <div className="text-gray-600 text-sm sm:text-base font-medium leading-relaxed">
                    {sec.content}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Privacy;
