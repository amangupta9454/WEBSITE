import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

const Privacy = () => {
  const [expandedSection, setExpandedSection] = useState(null);

  const sections = [
    {
      id: 1,
      title: "Introduction & Overview",
      description: "Understanding our privacy commitment",
      content: "Welcome to our Privacy Policy. We are committed to protecting your privacy and ensuring you have a positive experience on our website and services. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services, including any other media form, media channel, mobile website, or mobile application related or connected thereto (collectively, the 'Service'). Please read this Privacy Policy carefully."
    },
    {
      id: 2,
      title: "Information We Collect",
      description: "Types of data we gather from users",
      content: "We collect information in various ways. Personal identification information may include your name, email address, phone number, postal address, date of birth, username, password, and other information you voluntarily provide. We also automatically collect certain information about your device and how you interact with our Service, including IP address, browser type, operating system, pages visited, time spent on pages, links clicked, and other usage data. If you make a purchase, we collect payment information such as credit card details (processed securely through third-party payment processors). We may also collect information from cookies, web beacons, and similar technologies."
    },
    {
      id: 3,
      title: "Automatic Data Collection Technologies",
      description: "How we track and monitor usage",
      content: "Our Service uses cookies, web beacons, pixels, and similar tracking technologies to enhance your experience and gather analytics. Cookies are small files stored on your device that help us remember your preferences and track usage patterns. Web beacons are electronic images that may be used on our Service or in emails to track activity. Log files record information such as access times, pages viewed, and referring URLs. You can control cookie settings in your browser, although disabling cookies may limit certain Service functionality. We use both session-based and persistent cookies."
    },
    {
      id: 4,
      title: "How We Use Your Information",
      description: "Purposes for collecting and processing data",
      content: "We use the information we collect for multiple purposes including: providing and improving our Service; processing transactions and sending related information; responding to your inquiries and providing customer support; sending promotional and marketing communications (with your consent); analyzing usage patterns and conducting research; personalizing your experience and tailoring content; preventing fraudulent transactions and ensuring account security; complying with legal obligations; and creating de-identified, aggregated data for analytics. We do not sell your personal information to third parties for their direct marketing purposes without your explicit consent."
    },
    {
      id: 5,
      title: "Data Sharing & Disclosure",
      description: "When and with whom we share your information",
      content: "We may share your information with trusted service providers who perform services on our behalf, such as payment processors, hosting providers, analytics platforms, and customer support services. These vendors are contractually obligated to use your information only as necessary to provide services to us and to maintain the confidentiality of your data. We may disclose information when required by law, such as in response to subpoenas, court orders, or government requests. We may also share information to protect our rights, privacy, safety, or property, or that of our users or the public. In the event of a merger, acquisition, or bankruptcy, your information may be transferred as part of that transaction."
    },
    {
      id: 6,
      title: "Data Security & Protection",
      description: "Measures we take to protect your information",
      content: "We implement comprehensive security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. These include SSL/TLS encryption for data in transit, secure servers with firewalls, regular security audits and assessments, access controls limiting employee access to personal data, and secure password storage using industry-standard hashing algorithms. However, no method of transmission over the internet or electronic storage is completely secure. While we strive to protect your information using reasonable security measures, we cannot guarantee absolute security. You are responsible for maintaining the confidentiality of your account credentials."
    },
    {
      id: 7,
      title: "Cookies & Tracking Technologies",
      description: "Detailed information about cookies we use",
      content: "We use several types of cookies: Essential cookies are necessary for the Service to function properly and cannot be disabled. Performance cookies collect anonymous information about how you use the Service to help us improve functionality. Functional cookies remember your preferences and choices to enhance your experience. Marketing cookies track your browsing activity to display personalized advertisements. You can manage cookie preferences through your browser settings or our cookie consent banner. Third-party cookies may be placed by advertising partners and analytics providers. Most browsers allow you to refuse cookies or alert you when cookies are being sent."
    },
    {
      id: 8,
      title: "Your Privacy Rights & Choices",
      description: "Control over your personal information",
      content: "You have several rights regarding your personal information: the right to access, review, and obtain a copy of your personal data; the right to correct inaccurate or incomplete information; the right to delete your personal information, subject to certain exceptions; the right to opt-out of marketing communications; the right to restrict certain processing activities; the right to data portability in a structured, commonly used format; and the right to withdraw consent for data processing. To exercise these rights, contact us using the information provided in the Contact section. We will respond to requests within 30 days as required by applicable law."
    },
    {
      id: 9,
      title: "Data Retention Policy",
      description: "How long we keep your information",
      content: "We retain personal information for as long as necessary to provide our Service and fulfill the purposes outlined in this Privacy Policy. Account information is retained as long as your account is active. Transaction records are typically retained for 7 years for accounting and legal compliance purposes. Marketing data is retained until you unsubscribe or request deletion. Log files and analytics data are typically retained for 90 days. If you request deletion of your account, we will remove your personal information within 30 days, except where we are required by law to retain it. You can request deletion of your data at any time by contacting us."
    },
    {
      id: 10,
      title: "Children's Privacy Protection",
      description: "How we safeguard young users' information",
      content: "Our Service is not intended for children under 13 years of age, and we do not knowingly collect personal information from children under 13. If we discover that we have collected information from a child under 13, we will promptly delete such information. For users under 18, we comply with applicable laws protecting minors' privacy. Parents or guardians who believe their child has provided information to us may contact us immediately. We implement special protections for younger users, including limiting data collection and not using their information for marketing purposes without parental consent. We encourage parents to monitor their children's online activities."
    },
    {
      id: 11,
      title: "Third-Party Links & External Services",
      description: "Links to external websites and services",
      content: "Our Service may contain links to third-party websites and services that are not operated by us. This Privacy Policy does not apply to external websites, and we are not responsible for their privacy practices, security measures, or content. We recommend reviewing the privacy policies of any third-party services before providing your information. Our Service may integrate with social media platforms, analytics providers, and other third-party services. When you use these integrations, your information may be shared with those platforms according to their privacy policies. We are not responsible for third-party data practices, and you should review their policies independently."
    },
    {
      id: 12,
      title: "Updates & Changes to This Policy",
      description: "How we notify you of policy changes",
      content: "We may update this Privacy Policy periodically to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of material changes by posting the updated policy on our website and updating the 'Last Updated' date. For significant changes, we may provide additional notice such as sending an email notification or displaying a prominent banner. Your continued use of our Service after changes become effective constitutes your acceptance of the updated Privacy Policy. We encourage you to review this policy regularly to stay informed about how we protect your information. If you do not agree with changes, you may discontinue using our Service."
    },
    {
      id: 13,
      title: "GDPR Compliance (EU Users)",
      description: "Additional rights for European Union residents",
      content: "For users in the European Union, we comply with the General Data Protection Regulation (GDPR). Your data processing is based on one of the following legal bases: your consent; performance of a contract; compliance with legal obligations; protection of vital interests; performance of tasks in the public interest; or legitimate interests pursued by us or third parties. You have the right to lodge complaints with your local data protection authority. We have appointed a Data Protection Officer to oversee our GDPR compliance. International data transfers are conducted in compliance with GDPR requirements using Standard Contractual Clauses or Binding Corporate Rules."
    },
    {
      id: 14,
      title: "CCPA Rights (California Users)",
      description: "Privacy rights for California residents",
      content: "Under the California Consumer Privacy Act (CCPA), California residents have the right to: know what personal information we collect, use, and share; delete personal information collected from you; opt-out of the sale or sharing of your personal information; and receive non-discriminatory treatment for exercising CCPA rights. We do not sell personal information to third parties for their direct marketing purposes. However, sharing with service providers or for behavioral advertising may constitute a 'sale' under CCPA. To exercise your rights, submit a verifiable request through our Contact section. We will respond within 45 days. You may designate an authorized agent to make requests on your behalf."
    },
    {
      id: 15,
      title: "Do Not Track & Browser Signals",
      description: "Response to do not track requests",
      content: "Some browsers include a 'Do Not Track' (DNT) feature. Currently, there is no industry standard for recognizing DNT signals, and our Service does not respond to DNT browser signals. However, you can limit data collection through browser settings and cookie controls. If DNT becomes standardized, we will update our practices accordingly. You can disable cookies, clear your browser history, and use privacy-focused browser modes to limit tracking. Third-party analytics and advertising providers may have their own DNT policies. Contact us if you have questions about your privacy options."
    },
    {
      id: 16,
      title: "International Data Transfers",
      description: "How we handle cross-border data transfers",
      content: "Our Service may involve the transfer of your personal information to countries outside your country of residence, which may have different data protection laws. When we transfer information internationally, we implement safeguards such as Standard Contractual Clauses, adequacy decisions, or your explicit consent. By using our Service, you consent to the transfer of your information to countries outside your country of residence. We ensure that international transfers comply with applicable data protection laws, including GDPR and CCPA. Your information will be protected by the same security standards as described in this policy."
    },
    {
      id: 17,
      title: "Contact Information & Data Protection Officer",
      description: "How to reach us with privacy concerns",
      content: "If you have questions, concerns, or requests regarding this Privacy Policy or our privacy practices, please contact us. Our Data Protection Officer oversees our privacy compliance and can be reached using the contact information below. We take all privacy inquiries seriously and will respond to your request within 30 days. You can also file a complaint with your local data protection authority if you believe we have violated your privacy rights."
    }
  ];

  return (
    <section className="w-full min-h-screen py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-linear-to-br from-gray-950 via-gray-900 to-gray-950 text-gray-100 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-green-500/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="text-center mb-16 md:mb-24">
          <div className="inline-block mb-6 animate-fade-in">
            <span className="px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full text-green-300 text-sm font-medium">
              Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 bg-linear-to-r from-emerald-400 via-green-300 to-teal-400 text-transparent bg-clip-text leading-tight">
            Privacy Policy
          </h1>
          <p className="text-gray-400 max-w-4xl mx-auto text-base sm:text-lg md:text-xl leading-relaxed mb-8">
            We are committed to protecting your privacy. This comprehensive policy explains how we collect,
            use, disclose, and safeguard your information when you use our services.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <button className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium transition-colors">
              I Understand
            </button>
            <button className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors border border-gray-700">
              Download PDF
            </button>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6 text-gray-100">Quick Navigation</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                className="text-left p-4 bg-gray-800/30 hover:bg-gray-800/50 border border-gray-700/50 rounded-xl transition-all duration-300 group"
              >
                <div className="flex items-center gap-3">
                  <span className="shrink-0 w-8 h-8 bg-linear-to-br from-emerald-500 to-green-500 rounded-lg flex items-center justify-center text-white text-xs font-bold group-hover:scale-110 transition-transform">
                    {section.id}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-200 text-sm truncate group-hover:text-green-300 transition-colors">
                      {section.title}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-6 md:space-y-8">
          {sections.map((section, index) => {
            const gradients = [
              "from-emerald-500 to-green-500",
              "from-green-500 to-teal-500",
              "from-teal-500 to-cyan-500",
              "from-cyan-500 to-blue-500",
              "from-blue-500 to-emerald-500",
              "from-emerald-500 to-green-500",
              "from-green-500 to-teal-500",
              "from-teal-500 to-cyan-500",
              "from-cyan-500 to-blue-500",
              "from-blue-500 to-emerald-500",
              "from-emerald-500 to-green-500",
              "from-green-500 to-teal-500",
              "from-teal-500 to-cyan-500",
              "from-cyan-500 to-blue-500",
              "from-blue-500 to-emerald-500",
              "from-emerald-500 to-green-500",
              "from-green-500 to-teal-500"
            ];

            return (
              <div
                key={section.id}
                className="group bg-linear-to-br from-gray-800/30 to-gray-900/20 backdrop-blur-lg border border-gray-700/50 rounded-2xl overflow-hidden hover:border-gray-600/50 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/5"
              >
                <button
                  onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                  className="w-full text-left"
                >
                  <div className="p-6 sm:p-8 md:p-10 flex items-start justify-between gap-6 hover:bg-gray-800/20 transition-colors">
                    <div className="flex items-start gap-4 sm:gap-6 flex-1 min-w-0">
                      <div className={`shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-linear-to-br ${gradients[index]} rounded-xl flex items-center justify-center text-white font-bold text-lg sm:text-xl group-hover:scale-110 group-hover:shadow-lg transition-all duration-300 shadow-lg`}>
                        {section.id}
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-100 group-hover:text-green-300 transition-colors leading-tight">
                          {section.title}
                        </h2>
                        <p className="text-sm sm:text-base text-gray-400 mt-2">
                          {section.description}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 pt-2">
                      <ChevronDown
                        className={`w-6 h-6 text-gray-500 transition-transform duration-300 ${
                          expandedSection === section.id ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </div>
                </button>

                {/* Expanded Content */}
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    expandedSection === section.id ? "max-h-96" : "max-h-0"
                  }`}
                >
                  <div className="px-6 sm:px-8 md:px-10 pb-8 border-t border-gray-700/30 pt-6 bg-gray-900/30">
                    <p className="text-gray-300 leading-relaxed text-base sm:text-lg">
                      {section.content}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Contact Section */}
        <div className="mt-16 md:mt-24">
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-gray-100">Contact Our Privacy Team</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Email */}
            <div className="group bg-linear-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/30 hover:border-emerald-500/60 rounded-2xl p-8 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10">
              <div className="w-14 h-14 bg-linear-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-100 mb-2">Privacy Inquiries</h3>
              <p className="text-gray-400 mb-4">Questions about your privacy rights</p>
              <a href="mailto:privacy@example.com" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
                privacy@example.com
              </a>
            </div>

            {/* Data Protection Officer */}
            <div className="group bg-linear-to-br from-green-500/10 to-teal-500/10 border border-green-500/30 hover:border-green-500/60 rounded-2xl p-8 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10">
              <div className="w-14 h-14 bg-linear-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-100 mb-2">Data Protection Officer</h3>
              <p className="text-gray-400 mb-4">GDPR compliance and data requests</p>
              <a href="mailto:dpo@example.com" className="text-green-400 hover:text-green-300 font-semibold transition-colors">
                dpo@example.com
              </a>
            </div>

            {/* Support */}
            <div className="group bg-linear-to-br from-teal-500/10 to-cyan-500/10 border border-teal-500/30 hover:border-teal-500/60 rounded-2xl p-8 transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/10">
              <div className="w-14 h-14 bg-linear-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-100 mb-2">Support Center</h3>
              <p className="text-gray-400 mb-4">General privacy questions</p>
              <button className="text-teal-400 hover:text-teal-300 font-semibold transition-colors">
                Submit Request
              </button>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-16 md:mt-24 grid md:grid-cols-2 gap-8">
          {/* Your Rights */}
          <div className="bg-linear-to-br from-blue-500/10 to-emerald-500/10 border border-blue-500/30 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-100 mb-6">Your Privacy Rights</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-300">Right to access your personal data</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-300">Right to correct inaccurate data</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-300">Right to request data deletion</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-300">Right to opt-out of marketing</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-300">Right to data portability</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-300">Right to withdraw consent</span>
              </li>
            </ul>
          </div>

          {/* Security Measures */}
          <div className="bg-linear-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-100 mb-6">Our Security Measures</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-green-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-300">SSL/TLS encryption for data in transit</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-green-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-300">Secure servers with firewalls</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-green-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-300">Regular security audits</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-green-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-300">Access controls and monitoring</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-green-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-300">Secure password hashing</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-green-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-300">Data breach response plan</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Final Acknowledgment */}
        <div className="mt-16 md:mt-24">
          <div className="relative bg-linear-to-r from-emerald-500/20 via-green-500/20 to-teal-500/20 border border-emerald-500/30 rounded-3xl p-8 md:p-12 overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-r from-emerald-500/0 via-green-500/10 to-teal-500/0 pointer-events-none"></div>
            <div className="relative z-10">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-100 mb-4">Your Privacy Matters</h3>
              <p className="text-gray-300 leading-relaxed text-base md:text-lg mb-6">
                We are committed to maintaining the confidentiality, integrity, and security of your personal information.
                If you have any questions or concerns about our privacy practices, please don't hesitate to contact us.
                We will be happy to address any inquiries and assist you with exercising your privacy rights.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="px-8 py-3 bg-linear-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 rounded-lg font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/30">
                  I Acknowledge This Policy
                </button>
                <button className="px-8 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-all duration-300 border border-gray-700">
                  Request Data Access
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-16 text-center text-sm text-gray-500">
          <p>
            This Privacy Policy is subject to change. We will notify you of any significant updates.
          </p>
          <p className="mt-2">
            Copyright © {new Date().getFullYear()}. All rights reserved.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Privacy;
