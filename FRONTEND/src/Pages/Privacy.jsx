import React from "react";
import MainLayout from '../layouts/MainLayout';
import { motion } from "framer-motion";
import { fadeUp } from '../animations/variants';
import { Shield } from "lucide-react";

const Privacy = () => {
  const sections = [
    {
      title: "Information Collection",
      content: "We collect personal information you provide (name, email, phone), automatically gathered data (IP address, browser type, device info), and usage analytics to improve our services. Payment information is securely processed through third-party processors."
    },
    {
      title: "How We Use Your Data",
      content: "Your information helps us deliver and improve our services, process transactions, provide customer support, send relevant communications, personalize your experience, prevent fraud, and comply with legal obligations. We never sell your data to third parties."
    },
    {
      title: "Data Sharing",
      content: "We share data only with trusted service providers (hosting, analytics, payments), when legally required, to protect our rights or safety, and in business transactions. All partners are contractually bound to protect your information."
    },
    {
      title: "Security Measures",
      content: "We implement SSL/TLS encryption, secure servers with firewalls, regular security audits, strict access controls, and industry-standard password hashing. While no system is completely secure, we maintain robust protections for your data."
    },
    {
      title: "Your Privacy Rights",
      content: "You can access, correct, or delete your personal data, opt-out of marketing, request data portability, and withdraw consent at any time. Contact us to exercise these rights, and we'll respond within 30 days."
    },
    {
      title: "Cookies & Tracking",
      content: "We use essential, performance, and marketing cookies to enhance functionality and personalize your experience. Manage preferences through your browser settings. Third-party cookies may be used for analytics and advertising."
    }
  ];

  return (
    <MainLayout>
      <div className="pt-32 pb-24 bg-[#FAFAFA] min-h-screen relative overflow-hidden">
        {/* Subtle Background Glow */}
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
            <h1 className="text-4xl md:text-6xl font-black mb-6 text-gray-900 tracking-tight">Privacy Policy</h1>
            <p className="text-gray-500 text-lg font-medium">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white border border-gray-100 rounded-3xl p-8 md:p-12 shadow-sm"
          >
            <div className="space-y-12">
              {sections.map((sec, idx) => (
                <div key={idx}>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{idx + 1}. {sec.title}</h3>
                  <p className="text-gray-600 font-medium leading-relaxed">{sec.content}</p>
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
