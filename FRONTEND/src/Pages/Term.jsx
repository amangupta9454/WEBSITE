import React from "react";
import MainLayout from '../layouts/MainLayout';
import SEO from '../Components/SEO';
import { motion } from "framer-motion";
import { fadeUp } from '../animations/variants';
import { FileText } from "lucide-react";

const Terms = () => {
  const sections = [
    {
      title: "1. Acceptance of Terms",
      content: (
        <p>
          By browsing or interacting with the Code-A-Nova website (https://code-a-nova.online/) or utilizing any of our software engineering services, student internship portals, or educational resources, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please refrain from using our platform.
        </p>
      )
    },
    {
      title: "2. Website Usage & Eligibility",
      content: (
        <p>
          You must be at least 18 years of age, or have reached the legal age of majority in your jurisdiction, or have parental/guardian consent to use our services. You agree to use the site exclusively for lawful purposes and in accordance with all applicable local, national, and international laws and regulations.
        </p>
      )
    },
    {
      title: "3. User Accounts & Security",
      content: (
        <p>
          When you create an account to access student dashboards, career tools, or project workspaces, you are responsible for maintaining the confidentiality of your login credentials. You agree to accept responsibility for all activities that occur under your account and must notify us immediately of any unauthorized use or security breach.
        </p>
      )
    },
    {
      title: "4. Internship & Student Registration Programs",
      content: (
        <p>
          Registration for Code-A-Nova internship and learning programs is provided to help students gain real-world practical experience. Participants agree to submit original work, adhere to task deadlines, and act ethically. Certificates of completion are issued solely upon meeting the verification criteria and code review benchmarks established by our technical mentors. Code-A-Nova reserves the right to revoke certificates or terminate participation in cases of plagiarism, fraudulent submissions, or code of conduct violations.
        </p>
      )
    },
    {
      title: "5. Web & Software Development Services",
      content: (
        <p>
          Commercial engagements for custom website development, ERP solutions, and AI automation are governed by distinct project scopes and milestone schedules agreed upon in writing. Code-A-Nova commits to delivering code according to specified functional requirements. Client deliverables are deployed following milestone approval.
        </p>
      )
    },
    {
      title: "6. Intellectual Property Rights",
      content: (
        <p>
          All trademarks, logos, brand assets, proprietary software code, visual designs, and educational articles hosted on Code-A-Nova are the intellectual property of Code-A-Nova, unless otherwise indicated. Users may not copy, reproduce, distribute, or reverse-engineer any portion of the website without prior written authorization.
        </p>
      )
    },
    {
      title: "7. User-Submitted Content & Acceptable Use",
      content: (
        <>
          <p className="mb-3">You agree not to upload, post, or transmit any content or materials that:</p>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>Are unlawful, defamatory, abusive, threatening, or infringing upon intellectual property rights.</li>
            <li>Contain software viruses, malicious scripts, scrapers, or automated harvesting mechanisms.</li>
            <li>Attempt to bypass authentication barriers, probe system vulnerabilities, or disrupt server infrastructure.</li>
          </ul>
        </>
      )
    },
    {
      title: "8. Disclaimer & Limitation of Liability",
      content: (
        <p>
          Code-A-Nova provides this website, its content, and free online tools on an "as is" and "as available" basis without warranties of any kind, whether express or implied. In no event shall Code-A-Nova, its founders, or team members be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use our platform or reliance on informational resources.
        </p>
      )
    },
    {
      title: "9. Service Availability & Modifications",
      content: (
        <p>
          We strive to ensure continuous website availability, but do not guarantee uninterrupted uptime. We reserve the right to modify, suspend, or discontinue any feature, page, or service at any time without prior notice.
        </p>
      )
    },
    {
      title: "10. Contact Information",
      content: (
        <p>
          For any inquiries or legal notices regarding these Terms of Service, please contact us via email at <strong>codeanova26@gmail.com</strong> or <strong>hr@code-a-nova.online</strong>.
        </p>
      )
    }
  ];

  return (
    <MainLayout>
      <SEO 
        title="Terms of Service | Code-A-Nova"
        description="Review the official Terms of Service governing the use of Code-A-Nova's website, development services, and student learning programs."
        canonicalUrl="https://code-a-nova.online/terms"
      />
      <div className="pt-32 pb-24 bg-[#FAFAFA] min-h-screen relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-50 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl mb-6 shadow-sm border border-purple-100">
              <FileText size={32} />
            </div>
            <h1 className="text-4xl md:text-6xl font-black mb-4 text-gray-900 tracking-tight">Terms of Service</h1>
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
                These Terms of Service govern your access to and use of Code-A-Nova's digital properties, software services, and educational programs. Please review them carefully.
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

export default Terms;
