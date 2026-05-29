import React from "react";
import MainLayout from '../layouts/MainLayout';
import { motion } from "framer-motion";
import { fadeUp } from '../animations/variants';
import { FileText } from "lucide-react";

const Terms = () => {
  const sections = [
    {
      title: "Acceptance of Terms",
      content: "By accessing or using Code-A-Nova's platform, website, and services, you agree to be bound by these Terms & Conditions in their entirety. These terms constitute a legally binding agreement between you and Code-A-Nova. If you do not agree with any provision of these terms, you must immediately discontinue your use of our platform. We reserve the absolute right to modify, update, or revise these terms at any time without prior notice. Your continued use of our services following any such changes constitutes your acceptance of the modified terms."
    },
    {
      title: "User Responsibilities & Eligibility",
      content: "You must be at least 18 years old to use our platform. By registering, you agree to provide accurate, complete, and truthful information. You are solely responsible for maintaining the confidentiality of your account credentials and for all activities conducted under your account. You agree not to share, sell, transfer, or allow any third party to access your account."
    },
    {
      title: "Intellectual Property Rights",
      content: "All content, materials, designs, text, graphics, logos, images, videos, trademarks, patents, and intellectual property available on our platform are the exclusive property of Code-A-Nova or our content providers. You may not copy, download, reproduce, modify, distribute, transmit, display, perform, or create derivative works from any content without explicit written permission."
    },
    {
      title: "Service Availability & Modifications",
      content: "Code-A-Nova provides its platform and services on an 'AS IS' and 'AS AVAILABLE' basis. While we strive to maintain reliable and uninterrupted service, we do not guarantee continuous availability. We reserve the right to modify, suspend, or discontinue any features, services, or portions of our platform at any time without prior notice."
    },
    {
      title: "Limitation of Liability",
      content: "Code-A-Nova, its directors, employees, agents, and partners are not responsible for any indirect, incidental, special, consequential, punitive, or exemplary damages arising from your use of our platform or services. This includes but is not limited to: loss of profits, data loss, business interruption, reputational harm, or lost opportunities."
    },
    {
      title: "Prohibited Activities",
      content: "You strictly agree not to engage in any illegal, unethical, or harmful activities on our platform. Prohibited conduct includes harassment, threats, spreading misinformation, hacking, uploading malware, spamming, and violating any applicable laws. Violation of these prohibitions will result in immediate account suspension."
    },
    {
      title: "Governing Law & Dispute Resolution",
      content: "These Terms & Conditions are governed by and construed in accordance with the laws of India. You consent to the exclusive jurisdiction and venue of the courts located in India for resolution of any legal disputes. Before pursuing legal action, you agree to attempt resolving disputes through good faith negotiation."
    }
  ];

  return (
    <MainLayout>
      <div className="pt-32 pb-24 bg-[#FAFAFA] min-h-screen relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-emerald/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-50 text-brand-emerald rounded-2xl mb-6 shadow-sm border border-emerald-100">
              <FileText size={32} />
            </div>
            <h1 className="text-4xl md:text-6xl font-black mb-6 text-gray-900 tracking-tight">Terms & Conditions</h1>
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

export default Terms;
