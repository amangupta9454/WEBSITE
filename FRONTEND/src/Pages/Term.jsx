import React from "react";
import MainLayout from '../layouts/MainLayout';
import SEO from '../Components/SEO';
import { motion } from "framer-motion";
import { fadeUp } from '../animations/variants';
import { FileText } from "lucide-react";

const Terms = () => {
  const sections = [
    {
      title: "1. Acceptance of Terms & Eligibility",
      content: (
        <p>
          By accessing or using Code-A-Nova's platform, you agree to be bound by these Terms & Conditions. You must be at least 18 years old to use our premium services. By creating an account, you confirm that you are providing accurate and complete information and are responsible for all activities under your account credentials.
        </p>
      )
    },
    {
      title: "2. AI-Generated Feedback Disclaimer",
      content: (
        <p>
          Our mock interviews are conducted by an Artificial Intelligence system (powered by Vapi and Groq). The feedback, scores, and hiring recommendations generated are <strong>for educational and practice purposes only</strong>. Code-A-Nova does not guarantee that high performance on our platform will result in actual employment offers. AI-generated feedback is subjective and may occasionally contain errors or hallucinations.
        </p>
      )
    },
    {
      title: "3. User Responsibilities & Conduct",
      content: (
        <>
          <p className="mb-4">You agree NOT to use the platform to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Submit malicious prompts (Prompt Injection) designed to bypass or break the AI's system instructions.</li>
            <li>Upload resumes containing sensitive personal identifiers (like Social Security Numbers or explicit material).</li>
            <li>Share, resell, or distribute your account credentials or interview credits to third parties.</li>
            <li>Reverse engineer, scrape, or attempt to extract the underlying source code or system prompts.</li>
          </ul>
        </>
      )
    },
    {
      title: "4. Payments, Credits, & Refunds",
      content: (
        <p>
          All purchases of interview tokens or unlimited packages are processed securely via Razorpay. Due to the significant computational costs associated with LLM inferencing and real-time audio streaming, <strong>all sales are final and non-refundable</strong> unless required by law. Unused interview credits do not expire as long as your account remains active.
        </p>
      )
    },
    {
      title: "5. Intellectual Property Rights",
      content: (
        <p>
          All platform content, UI designs, code, algorithms, and system architectures are the exclusive intellectual property of Code-A-Nova. However, you retain full ownership of the resumes you upload. By using the service, you grant us a limited, temporary license to process your resume and audio exclusively for the purpose of delivering your interview feedback.
        </p>
      )
    },
    {
      title: "6. Limitation of Liability",
      content: (
        <p>
          Code-A-Nova is provided on an "AS IS" basis. To the maximum extent permitted by law, Code-A-Nova and its affiliates shall not be liable for any indirect, incidental, special, or consequential damages, including loss of profits, lost opportunities, or data loss arising from platform downtime, AI errors, or third-party API outages (e.g., Groq or OpenAI).
        </p>
      )
    },
    {
      title: "7. Account Termination",
      content: (
        <p>
          We reserve the right to suspend or terminate your account immediately, without prior notice or refund, if you violate these Terms (e.g., attempting prompt injection attacks or committing payment fraud). You may terminate your account at any time by contacting support.
        </p>
      )
    },
    {
      title: "8. Contact Information",
      content: (
        <p>
          If you have any questions regarding these Terms & Conditions, please contact us via our Support page or directly at <strong>support@codeanova.com</strong>.
        </p>
      )
    }
  ];

  return (
    <MainLayout>
      <SEO 
        title="Terms & Conditions | Code-A-Nova"
        description="Read the terms and conditions governing the use of Code-A-Nova services and website."
        canonicalUrl="https://code-a-nova.online/terms"
      />
      <div className="pt-32 pb-24 bg-[#FAFAFA] dark:bg-gray-900 min-h-screen relative overflow-hidden transition-colors duration-300">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-50 dark:bg-purple-900/20 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl mb-6 shadow-sm border border-purple-100 dark:border-purple-800">
              <FileText size={32} />
            </div>
            <h1 className="text-4xl md:text-6xl font-black mb-6 text-gray-900 dark:text-white tracking-tight">Terms & Conditions</h1>
            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">Effective Date: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl p-8 md:p-12 shadow-sm"
          >
            <div className="space-y-12">
              <div className="prose prose-purple dark:prose-invert max-w-none">
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

export default Terms;
