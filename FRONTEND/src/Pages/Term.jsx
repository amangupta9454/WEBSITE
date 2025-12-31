import React, { useState } from "react";
import { ChevronDown, Mail, MessageCircle, MapPin } from "lucide-react";

const Terms = () => {
  const [expandedSection, setExpandedSection] = useState(null);

  const sections = [
    {
      id: 1,
      title: "Acceptance of Terms",
      content: "By accessing or using Code-A-Nova's platform, website, and services, you agree to be bound by these Terms & Conditions in their entirety. These terms constitute a legally binding agreement between you and Code-A-Nova. If you do not agree with any provision of these terms, you must immediately discontinue your use of our platform. We reserve the absolute right to modify, update, or revise these terms at any time without prior notice. Your continued use of our services following any such changes constitutes your acceptance of the modified terms. It is your responsibility to regularly review these terms to stay informed of any updates or modifications."
    },
    {
      id: 2,
      title: "User Responsibilities & Eligibility",
      content: "You must be at least 18 years old to use our platform. By registering, you agree to provide accurate, complete, and truthful information. You are solely responsible for maintaining the confidentiality of your account credentials and for all activities conducted under your account. You agree not to share, sell, transfer, or allow any third party to access your account. Unauthorized account access must be reported immediately to our support team. You are responsible for all actions taken through your account, including any violations of these terms. You agree to notify us of any unauthorized use or suspected security breaches. Failure to maintain account security may result in liability for unauthorized activities."
    },
    {
      id: 3,
      title: "Intellectual Property Rights & Ownership",
      content: "All content, materials, designs, text, graphics, logos, images, videos, trademarks, patents, and intellectual property available on our platform are the exclusive property of Code-A-Nova or our content providers, protected under international copyright and intellectual property laws. You may not copy, download, reproduce, modify, distribute, transmit, display, perform, or create derivative works from any content without explicit written permission from Code-A-Nova. Unauthorized use of our intellectual property may result in immediate legal action and civil or criminal penalties. User-generated content (posts, comments, submissions) remains your property; however, by submitting content to our platform, you grant Code-A-Nova a perpetual, irrevocable, worldwide, royalty-free, non-exclusive license to use, modify, reproduce, distribute, and display your content. This license survives even after you cease using our platform."
    },
    {
      id: 4,
      title: "Service Availability & Modifications",
      content: "Code-A-Nova provides its internship platform and services on an 'AS IS' and 'AS AVAILABLE' basis. While we strive to maintain reliable and uninterrupted service, we do not guarantee continuous availability. We reserve the right to modify, suspend, or discontinue any features, services, or portions of our platform at any time without prior notice. Scheduled maintenance, system updates, unforeseen technical issues, or circumstances beyond our control may temporarily make our services unavailable. We are not liable for any service interruptions, loss of data, or inability to access our platform. Users are advised to regularly backup any important information stored on our platform. We recommend checking our status page for announcements regarding maintenance or service updates."
    },
    {
      id: 5,
      title: "Limitation of Liability & Disclaimers",
      content: "Code-A-Nova, its directors, employees, agents, and partners are not responsible for any indirect, incidental, special, consequential, punitive, or exemplary damages arising from your use of our platform or services. This includes but is not limited to: loss of profits, data loss, business interruption, reputational harm, or lost opportunities. Our total liability to you for any claim, regardless of cause, shall not exceed the amount you paid to Code-A-Nova, if any. Some jurisdictions do not allow limitations on liability, so this clause may not apply to you in those locations. You acknowledge that you use our platform at your own risk and discretion. Code-A-Nova does not warrant that our services will meet your specific requirements or expectations. No oral or written statement by Code-A-Nova representatives creates any warranty beyond what is explicitly stated in these terms."
    },
    {
      id: 6,
      title: "Prohibited Activities & User Conduct",
      content: "You strictly agree not to engage in any illegal, unethical, or harmful activities on our platform. Prohibited conduct includes but is not limited to: harassment, intimidation, threats, or abusive language toward other users; posting defamatory, slanderous, offensive, discriminatory, or hateful content; spreading misinformation, false information, or fraudulent claims; attempting to gain unauthorized access, hacking, or reverse-engineering our platform; uploading or distributing malware, viruses, or malicious code; spamming, excessive promotional content, or unsolicited commercial messages; impersonating other users or misrepresenting your identity; collecting or harvesting personal data without explicit consent; engaging in phishing, fraud, or financial scams; violating any applicable laws, regulations, or third-party rights; circumventing security measures or access controls. Violation of these prohibitions will result in immediate account suspension, termination, and potential legal action. We cooperate with law enforcement in investigating serious violations."
    },
    {
      id: 7,
      title: "Data Privacy, Security & Protection",
      content: "Code-A-Nova is committed to protecting your personal information and respecting your privacy. We collect, process, and store personal data in compliance with applicable data protection laws, including GDPR and local privacy regulations. Your information is protected using industry-standard security measures including SSL encryption, firewalls, secure servers, and regular security audits. However, no online platform is completely immune to security breaches. While we implement robust security protocols, we cannot guarantee absolute security. We will not sell, rent, share, or disclose your personal information to third parties without your explicit written consent, except as required by law or court order. You have the right to access, review, update, correct, or delete your personal data. Submit data access or deletion requests to our support team, and we will respond within 30 days. We maintain a detailed privacy policy that explains how we collect and use your data. By using our platform, you consent to the collection and processing of your information as outlined in our privacy policy."
    },
    {
      id: 8,
      title: "External Links, Third-Party Services & Content",
      content: "Our platform may contain links to third-party websites, applications, and services that are not operated by Code-A-Nova. We do not control, endorse, or take responsibility for the content, accuracy, legality, reliability, quality, or security of external websites. We are not liable for any harm, loss, or damage resulting from your use of third-party services or websites. Inclusion of a link does not imply affiliation, endorsement, or partnership. We strongly recommend reviewing the terms of service and privacy policies of any external websites before providing personal information or making transactions. You access third-party services entirely at your own risk and discretion. Code-A-Nova assumes no responsibility for third-party content, including advertisements, offers, or claims. Any disputes or issues with third-party services should be resolved directly with those service providers."
    },
    {
      id: 9,
      title: "Warranty Disclaimers & AS-IS Provision",
      content: "Code-A-Nova provides its platform and services on an 'AS IS' and 'AS AVAILABLE' basis without any warranties, express or implied. We make no warranties regarding the accuracy, completeness, reliability, timeliness, quality, suitability, or legality of our services. We disclaim all warranties of merchantability, fitness for a particular purpose, non-infringement of third-party rights, and title. We do not warrant that our services will be uninterrupted, error-free, virus-free, or free from harmful components. We do not guarantee that bugs, errors, or defects will be corrected. We do not warrant that our services will meet your expectations or requirements. Your use of our platform is at your own risk. You assume all responsibility and risk for any damage to your device, loss of data, or other consequences arising from your use of our services."
    },
    {
      id: 10,
      title: "Indemnification & Hold Harmless",
      content: "You agree to indemnify, defend, and hold harmless Code-A-Nova, its directors, officers, employees, agents, contractors, and partners from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable legal fees) arising from or related to: your violation of these terms; your misuse or unauthorized use of our platform; your violation of any applicable laws, statutes, regulations, or ordinances; your infringement of third-party intellectual property rights; your user-generated content or submissions; your conduct, statements, or actions on our platform; any breach of your representations or warranties; your transaction disputes or payment issues. This indemnification obligation applies regardless of whether we knew of the potential liability. This clause survives indefinitely, even after you cease using our platform or your account is terminated."
    },
    {
      id: 11,
      title: "User-Generated Content & Submissions",
      content: "Any content you submit, upload, post, or share on our platform (including text, images, videos, documents) is considered user-generated content. You retain ownership of your content, but by submitting it, you grant Code-A-Nova an irrevocable, perpetual, worldwide, royalty-free license to use, display, reproduce, modify, and distribute your content. Code-A-Nova may use your content for marketing, promotional, or educational purposes without additional compensation. You represent and warrant that you own all rights to your submitted content and that it does not infringe any third-party rights. You assume all responsibility for your content and its consequences. Code-A-Nova does not endorse or verify user-generated content. We reserve the right to remove, edit, or refuse any content that violates these terms. You agree that Code-A-Nova may moderate or flag content without liability. We are not responsible for any consequences of your content, including copyright claims or legal disputes."
    },
    {
      id: 12,
      title: "Account Termination & Suspension",
      content: "Code-A-Nova reserves the absolute right to terminate, suspend, or restrict your account at any time for any reason, including but not limited to: violation of these terms; fraudulent or illegal activity; non-payment of fees; abuse of our services; failure to respond to our inquiries within 14 days; extended inactivity (typically 6+ months); or any conduct we deem harmful to our community. Termination may be immediate without prior notice or explanation. Upon termination, your access to our platform is revoked, and you forfeit any benefits or credits. We may retain your data for legal compliance or investigative purposes. Termination does not waive any obligations you have to Code-A-Nova, including payment of outstanding fees. You may request account deletion through our support portal, subject to legal retention requirements."
    },
    {
      id: 13,
      title: "Modification & Updates to Terms",
      content: "Code-A-Nova may update, modify, or revise these Terms & Conditions at any time without prior notice. Major changes will be communicated via email notification or prominent website announcement at least 30 days in advance. Minor updates or clarifications may take effect immediately. Your continued use of our platform following any modifications constitutes your acceptance of the updated terms. It is your responsibility to periodically review these terms to stay informed of changes. We maintain a version history of significant modifications for your reference. If you do not agree with any modifications, you must discontinue using our platform. Material changes will be clearly highlighted on our website."
    },
    {
      id: 14,
      title: "Governing Law & Dispute Resolution",
      content: "These Terms & Conditions are governed by and construed in accordance with the laws of India, without regard to its conflict of law principles. You consent to the exclusive jurisdiction and venue of the courts located in India for resolution of any legal disputes. If any provision of these terms is found to be invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect. Before pursuing legal action, you agree to attempt resolving disputes through good faith negotiation for at least 30 days. If negotiation fails, disputes may be resolved through binding arbitration in accordance with Indian arbitration laws. Each party bears its own arbitration costs unless the arbitrator determines otherwise. Claims must be filed within one year of the cause of action, or they are forever barred."
    },
    {
      id: 15,
      title: "Contact Information & Support",
      content: "If you have questions, concerns, complaints, or require assistance regarding these Terms & Conditions or our services, please contact our support team through the following channels. Our dedicated support team is available to assist you and will respond to inquiries within 24-48 business hours. For urgent matters or escalations, please specify the nature of your concern in your message. You can reach us via email, WhatsApp, or mail. We value your feedback and are committed to resolving issues promptly and professionally. All communications are treated confidentially and securely."
    }
  ];

  return (
    <div className="w-full min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-gray-100 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="text-center mb-8 sm:mb-10">
            <div className="inline-block mb-3 sm:mb-4 px-4 py-2 bg-blue-500/20 border border-blue-400/30 rounded-full">
              <span className="text-blue-300 text-xs sm:text-sm font-medium">Last Updated: {new Date().toLocaleDateString()}</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-3 sm:mb-4 bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent leading-tight">
              Terms & Conditions
            </h1>
            <p className="text-gray-400 max-w-3xl mx-auto text-sm sm:text-base md:text-lg leading-relaxed">
              Please read these terms carefully. Your use of our platform means you accept all terms below.
            </p>
          </div>
        </div>

        {/* Terms Sections */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20 lg:pb-24">
          <div className="space-y-3 sm:space-y-4">
            {sections.map((section, index) => {
              const colors = [
                "from-blue-500 to-cyan-500",
                "from-cyan-500 to-teal-500",
                "from-teal-500 to-emerald-500",
                "from-emerald-500 to-green-500",
                "from-blue-500 to-cyan-500",
                "from-cyan-500 to-teal-500",
                "from-teal-500 to-emerald-500",
                "from-emerald-500 to-green-500",
                "from-blue-500 to-cyan-500",
                "from-cyan-500 to-teal-500",
                "from-teal-500 to-emerald-500",
                "from-emerald-500 to-green-500",
                "from-blue-500 to-cyan-500",
                "from-cyan-500 to-teal-500",
                "from-teal-500 to-emerald-500",
                "from-emerald-500 to-green-500"
              ];

              return (
                <div
                  key={section.id}
                  className="group bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden hover:border-slate-600/80 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10"
                >
                  <button
                    onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                    className="w-full text-left"
                  >
                    <div className="p-4 sm:p-5 lg:p-6 flex items-center justify-between gap-4 sm:gap-6 hover:bg-slate-700/20 transition-colors">
                      <div className="flex items-center gap-3 sm:gap-5 flex-1 min-w-0">
                        <div className={`shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-linear-to-br ${colors[index]} rounded-xl flex items-center justify-center text-white font-bold text-sm sm:text-base group-hover:scale-110 transition-transform`}>
                          {section.id}
                        </div>
                        <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-100 group-hover:text-cyan-300 transition-colors">
                          {section.title}
                        </h3>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 sm:w-6 sm:h-6 text-gray-500 shrink-0 transition-transform duration-300 ${
                          expandedSection === section.id ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </button>

                  {/* Expanded Content */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      expandedSection === section.id ? "max-h-96" : "max-h-0"
                    }`}
                  >
                    <div className="px-4 sm:px-5 lg:px-6 pb-5 sm:pb-6 lg:pb-8 border-t border-slate-700/30 pt-4 sm:pt-5 bg-slate-900/50">
                      <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                        {section.content}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Contact Section */}
        <div className="w-full bg-linear-to-b from-slate-900/50 to-slate-950 py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold mb-12 text-center text-gray-100">Have Questions? Get in Touch</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Email */}
              <div className="group bg-slate-800/50 border border-slate-700/50 hover:border-blue-500/50 rounded-2xl p-6 sm:p-8 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:scale-105">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-linear-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Mail size={24} className="text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-100 mb-2">Email Support</h3>
                <p className="text-gray-400 text-sm sm:text-base mb-4">Get in touch with us</p>
                <a href="mailto:codenova31@gmail.com" className="text-blue-400 hover:text-blue-300 font-semibold text-sm sm:text-base transition-colors break-all">
                 codenova31@gmail.com
                </a>
              </div>

              {/* WhatsApp */}
              <div className="group bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/50 rounded-2xl p-6 sm:p-8 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10 hover:scale-105">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-linear-to-br from-cyan-500 to-teal-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <MessageCircle size={24} className="text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-100 mb-2">WhatsApp</h3>
                <p className="text-gray-400 text-sm sm:text-base mb-4">Quick chat support available</p>
                <a href="https://wa.me/917880533908?text=Hi%20CodeNova%2C%20I%20have%20a%20question%20about%20your%20terms." target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 font-semibold text-sm sm:text-base transition-colors">
                  +91 7880533908
                </a>
              </div>

              {/* Location */}
              <div className="group bg-slate-800/50 border border-slate-700/50 hover:border-teal-500/50 rounded-2xl p-6 sm:p-8 transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/10 hover:scale-105 sm:col-span-2 lg:col-span-1">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-linear-to-br from-teal-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <MapPin size={24} className="text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-100 mb-2">Location</h3>
                <p className="text-gray-400 text-sm sm:text-base mb-4">Where to find us</p>
                <p className="text-teal-400 font-semibold text-sm sm:text-base">
                  India
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center text-xs sm:text-sm text-gray-500">
          <p>We take your privacy and security seriously. Review our Terms & Conditions periodically for updates.</p>
          <p className="mt-3">© {new Date().getFullYear()} Code-A-Nova. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Terms;
