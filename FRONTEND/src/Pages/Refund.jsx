import React from "react";
import MainLayout from '../layouts/MainLayout';
import SEO from '../Components/SEO';
import { motion } from "framer-motion";
import { fadeUp } from '../animations/variants';
import { AlertCircle, HelpCircle } from "lucide-react";

const Refund = () => {
  const policyPoints = [
    {
      title: "Custom Software & Web Development Services",
      description: "For commercial client projects (such as custom websites, ERP platforms, and AI automations), services are delivered under milestone-based agreements. Each milestone involves discovery, prototyping, and code reviews. Once a milestone deliverable is reviewed, approved, or deployed, payments allocated to that milestone are non-refundable due to the custom engineering labor and infrastructure allocated."
    },
    {
      title: "Student Internship & Academic Programs",
      description: "Standard student registration, task assignments, and internship applications on Code-A-Nova are free. We do not charge application fees, training deposits, or certificate release charges for our standard internship tracks."
    },
    {
      title: "Digital Platform Credits & Mock Interview Tokens",
      description: "Any optional digital tokens or AI interview credits purchased through our payment gateway (Razorpay) are credited immediately to the user's account. Because digital tokens consume cloud computational resources upon activation, completed sessions are non-refundable."
    },
    {
      title: "Project Cancellation Terms",
      description: "If a commercial client elects to pause or cancel a project prior to full completion, work is halted immediately. Invoices are reconciled strictly for milestones completed and delivered up to the date of cancellation. Unworked, advance-funded future milestones may be refunded or credited as specified in the individual client contract."
    },
    {
      title: "Technical & Billing Disputes",
      description: "If you experience an accidental duplicate charge or a verified payment gateway failure where credits/services were not delivered, please contact our support desk within 7 days at codeanova26@gmail.com with your transaction receipt. Genuine billing errors will be investigated and refunded to the original payment method."
    }
  ];

  return (
    <MainLayout>
      <SEO 
        title="Refund Policy | Code-A-Nova"
        description="Review Code-A-Nova's clear and truthful Refund Policy for software development services, student programs, and digital tools."
        canonicalUrl="https://code-a-nova.online/refund-policy"
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
              <HelpCircle size={32} />
            </div>
            <h1 className="text-4xl md:text-6xl font-black mb-4 text-gray-900 tracking-tight">Refund & Cancellation Policy</h1>
            <p className="text-gray-500 text-sm md:text-base font-medium">Last Updated: September 2026</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 bg-blue-50 border border-blue-100 rounded-3xl p-6 sm:p-8 flex items-start gap-4"
          >
            <AlertCircle className="w-7 h-7 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Transparent Business Terms</h3>
              <p className="text-gray-600 text-sm font-medium leading-relaxed">
                We believe in complete transparency. Our refund policy is structured around fair, milestone-based delivery for commercial projects and free access for our standard student internship programs.
              </p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white border border-gray-100 rounded-3xl p-8 md:p-12 shadow-sm"
          >
            <div className="space-y-10">
              {policyPoints.map((sec, idx) => (
                <div key={idx} className="space-y-2 pb-6 border-b border-gray-100 last:border-b-0 last:pb-0">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">{idx + 1}. {sec.title}</h2>
                  <p className="text-gray-600 text-sm sm:text-base font-medium leading-relaxed">{sec.description}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Refund;
