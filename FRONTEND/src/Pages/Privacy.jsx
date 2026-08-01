import React from "react";
import MainLayout from '../layouts/MainLayout';
import { motion } from "framer-motion";
import { fadeUp } from '../animations/variants';
import { Shield } from "lucide-react";

const Privacy = () => {
  const sections = [
    {
      title: "1. Information We Collect",
      content: (
        <>
          <p className="mb-4">We collect information to provide, analyze, and improve our services. The types of personal data we collect include:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>User Accounts:</strong> Name, email address, password hash, and authentication metadata.</li>
            <li><strong>Resume Uploads:</strong> Employment history, education, skills, and any other data contained within resumes provided to the platform.</li>
            <li><strong>Audio Recordings & Transcripts:</strong> Real-time voice data during mock interviews, which is processed to generate transcripts.</li>
            <li><strong>Device & Usage Data:</strong> IP addresses, browser types, interaction logs, and analytics.</li>
          </ul>
        </>
      )
    },
    {
      title: "2. AI Processing & Third-Party Integrations",
      content: (
        <>
          <p className="mb-4">Our platform relies on advanced Artificial Intelligence infrastructure. By using our service, you acknowledge that your data may be processed by the following sub-processors:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Groq & OpenAI:</strong> Used for Natural Language Processing, transcript evaluation, and feedback generation. Resumes and transcripts are passed to these APIs but are <em>not</em> used to train their foundational models.</li>
            <li><strong>Vapi.ai:</strong> Used for real-time WebRTC audio streaming and Voice AI capabilities.</li>
          </ul>
        </>
      )
    },
    {
      title: "3. Payments & Financial Data",
      content: (
        <p>
          We use <strong>Razorpay</strong> as our secure payment gateway. We do not store your credit card numbers, UPI PINs, or bank account details on our servers. Razorpay processes all financial transactions in compliance with PCI-DSS standards.
        </p>
      )
    },
    {
      title: "4. Storage & Security",
      content: (
        <p>
          Your data is stored securely in <strong>MongoDB Atlas</strong> cloud databases using AES-256 encryption at rest and TLS 1.2+ for data in transit. We implement rate limiting, DDoS protection, and automated PII (Personally Identifiable Information) redaction to minimize risk. However, no internet transmission is 100% secure, and we cannot guarantee absolute security.
        </p>
      )
    },
    {
      title: "5. Cookies & Tracking",
      content: (
        <p>
          We use strictly necessary cookies (such as JWT tokens for session management) to keep you logged in. We may also use local storage to persist interview state temporarily to prevent data loss during network interruptions.
        </p>
      )
    },
    {
      title: "6. Data Retention & Deletion",
      content: (
        <p>
          We retain your account data and interview transcripts as long as your account is active. Incomplete or abandoned interviews are automatically purged after 24 hours via TTL indexes. You have the right to request full account deletion, which will permanently erase all associated resumes, transcripts, and evaluation scores from our databases.
        </p>
      )
    },
    {
      title: "7. Your Rights (GDPR / DPDP)",
      content: (
        <p>
          Depending on your jurisdiction, you may have the right to access, rectify, or erase your personal data. You may also restrict processing or request data portability. To exercise these rights, please contact us via our Support Portal. We process all Data Subject Access Requests within 30 days.
        </p>
      )
    },
    {
      title: "8. Contact Us",
      content: (
        <p>
          If you have questions about this Privacy Policy or how we handle your data, please contact our Data Protection Officer at <strong>hr@code-a-nova.online</strong> or submit a ticket through our Support page.
        </p>
      )
    }
  ];

  return (
    <MainLayout>
      <div className="pt-32 pb-24 bg-[#FAFAFA] dark:bg-gray-900 min-h-screen relative overflow-hidden transition-colors duration-300">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-50 dark:bg-blue-900/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl mb-6 shadow-sm border border-blue-100 dark:border-blue-800">
              <Shield size={32} />
            </div>
            <h1 className="text-4xl md:text-6xl font-black mb-6 text-gray-900 dark:text-white tracking-tight">Privacy Policy</h1>
            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">Effective Date: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl p-8 md:p-12 shadow-sm"
          >
            <div className="space-y-12">
              <div className="prose prose-blue dark:prose-invert max-w-none">
                <p className="text-gray-600 dark:text-gray-300 font-medium leading-relaxed mb-8">
                  Code-A-Nova ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our platform and use our AI Mock Interview services.
                </p>
                {sections.map((sec, idx) => (
                  <div key={idx} className="mb-10">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{sec.title}</h3>
                    <div className="text-gray-600 dark:text-gray-300 font-medium leading-relaxed">
                      {sec.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Privacy;
