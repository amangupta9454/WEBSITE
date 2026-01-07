import React, { useState } from "react";
import { ChevronDown, Shield, Lock, Eye, FileText, Users, Globe, Bell, Database } from "lucide-react";

const Privacy = () => {
  const [expandedSection, setExpandedSection] = useState(null);

  const sections = [
    {
      id: 1,
      title: "Information Collection",
      icon: Database,
      content: "We collect personal information you provide (name, email, phone), automatically gathered data (IP address, browser type, device info), and usage analytics to improve our services. Payment information is securely processed through third-party processors."
    },
    {
      id: 2,
      title: "How We Use Your Data",
      icon: FileText,
      content: "Your information helps us deliver and improve our services, process transactions, provide customer support, send relevant communications, personalize your experience, prevent fraud, and comply with legal obligations. We never sell your data to third parties."
    },
    {
      id: 3,
      title: "Data Sharing",
      icon: Users,
      content: "We share data only with trusted service providers (hosting, analytics, payments), when legally required, to protect our rights or safety, and in business transactions. All partners are contractually bound to protect your information."
    },
    {
      id: 4,
      title: "Security Measures",
      icon: Lock,
      content: "We implement SSL/TLS encryption, secure servers with firewalls, regular security audits, strict access controls, and industry-standard password hashing. While no system is completely secure, we maintain robust protections for your data."
    },
    {
      id: 5,
      title: "Your Privacy Rights",
      icon: Eye,
      content: "You can access, correct, or delete your personal data, opt-out of marketing, request data portability, and withdraw consent at any time. Contact us to exercise these rights, and we'll respond within 30 days."
    },
    {
      id: 6,
      title: "Cookies & Tracking",
      icon: Bell,
      content: "We use essential, performance, and marketing cookies to enhance functionality and personalize your experience. Manage preferences through your browser settings. Third-party cookies may be used for analytics and advertising."
    },
    {
      id: 7,
      title: "International Transfers",
      icon: Globe,
      content: "Your data may be transferred internationally with appropriate safeguards like Standard Contractual Clauses. We ensure all transfers comply with GDPR, CCPA, and other applicable data protection laws."
    },
    {
      id: 8,
      title: "Data Retention",
      icon: Shield,
      content: "We retain your information only as long as necessary for service provision and legal compliance. Account data persists while active, transaction records for 7 years, and marketing data until you opt-out or request deletion."
    }
  ];

  const iconGradients = [
    "from-emerald-500 to-teal-500",
    "from-green-500 to-emerald-500",
    "from-teal-500 to-cyan-500",
    "from-cyan-500 to-blue-500",
    "from-blue-500 to-indigo-500",
    "from-violet-500 to-purple-500",
    "from-purple-500 to-pink-500",
    "from-pink-500 to-rose-500"
  ];

  return (
    <section className="relative w-full min-h-screen py-20 md:py-32 px-4 sm:px-6 lg:px-8 bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-gray-100 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-green-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-5 py-2 mb-8 bg-linear-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-full backdrop-blur-sm">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-emerald-300 text-sm font-medium">
              Updated {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          
          <h1 className="text-6xl sm:text-7xl md:text-8xl font-bold mb-6 bg-linear-to-r from-emerald-400 via-teal-300 to-cyan-400 text-transparent bg-clip-text leading-tight tracking-tight">
            Privacy Policy
          </h1>
          
          <p className="text-gray-400 max-w-3xl mx-auto text-lg md:text-xl leading-relaxed">
            Your privacy is our priority. Learn how we protect and manage your data with transparency and care.
          </p>
        </div>

        {/* Quick Navigation Grid */}
        <div className="mb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {sections.map((section, index) => {
              const IconComponent = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                  className="group relative p-6 bg-linear-to-br from-slate-800/40 to-slate-900/40 hover:from-slate-800/60 hover:to-slate-900/60 border border-slate-700/50 hover:border-emerald-500/30 rounded-2xl transition-all duration-300 backdrop-blur-sm"
                >
                  <div className={`w-12 h-12 mx-auto mb-3 bg-linear-to-br ${iconGradients[index]} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <p className="font-semibold text-gray-200 text-sm group-hover:text-emerald-300 transition-colors">
                    {section.title}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-4">
          {sections.map((section, index) => {
            const IconComponent = section.icon;
            const isExpanded = expandedSection === section.id;
            
            return (
              <div
                key={section.id}
                className={`group relative bg-linear-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-xl border transition-all duration-500 rounded-2xl overflow-hidden ${
                  isExpanded 
                    ? 'border-emerald-500/50 shadow-2xl shadow-emerald-500/10' 
                    : 'border-slate-700/50 hover:border-slate-600/50'
                }`}
              >
                <button
                  onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                  className="w-full text-left p-6 md:p-8 flex items-center justify-between gap-6 hover:bg-slate-800/20 transition-colors"
                >
                  <div className="flex items-center gap-5 flex-1">
                    <div className={`shrink-0 w-14 h-14 bg-linear-to-br ${iconGradients[index]} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:shadow-2xl transition-all duration-300`}>
                      <IconComponent className="w-7 h-7 text-white" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-100 group-hover:text-emerald-300 transition-colors">
                      {section.title}
                    </h2>
                  </div>
                  <div className="shrink-0">
                    <ChevronDown
                      className={`w-7 h-7 text-gray-400 transition-all duration-300 ${
                        isExpanded ? "rotate-180 text-emerald-400" : "group-hover:text-gray-300"
                      }`}
                    />
                  </div>
                </button>

                <div
                  className={`transition-all duration-500 ease-in-out ${
                    isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="px-6 md:px-8 pb-8 border-t border-slate-700/30">
                    <div className="pt-6 pl-19">
                      <p className="text-gray-300 leading-relaxed text-base md:text-lg">
                        {section.content}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Rights & Security Cards */}
        <div className="mt-20 grid md:grid-cols-2 gap-8">
          <div className="relative group bg-linear-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/20 hover:border-emerald-500/40 rounded-3xl p-8 md:p-10 transition-all duration-300 backdrop-blur-sm overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-br from-emerald-500/0 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-emerald-500 to-teal-500 rounded-2xl mb-6 shadow-xl">
                <Eye className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-100 mb-6">Your Rights</h3>
              <ul className="space-y-4">
                {["Access & review your data", "Correct inaccurate information", "Request data deletion", "Opt-out of marketing", "Data portability", "Withdraw consent anytime"].map((right, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-emerald-500/20 rounded-lg flex items-center justify-center shrink-0">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    </div>
                    <span className="text-gray-300">{right}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="relative group bg-linear-to-br from-blue-500/10 via-cyan-500/10 to-teal-500/10 border border-blue-500/20 hover:border-blue-500/40 rounded-3xl p-8 md:p-10 transition-all duration-300 backdrop-blur-sm overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-br from-blue-500/0 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-blue-500 to-cyan-500 rounded-2xl mb-6 shadow-xl">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-100 mb-6">Protection</h3>
              <ul className="space-y-4">
                {["SSL/TLS encryption", "Secure infrastructure", "Regular security audits", "Access monitoring", "Secure password storage", "Incident response plan"].map((measure, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-500/20 rounded-lg flex items-center justify-center shrink-0">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    </div>
                    <span className="text-gray-300">{measure}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-20 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800/40 border border-slate-700/50 rounded-full backdrop-blur-sm">
            <Shield className="w-5 h-5 text-emerald-400" />
            <span className="text-gray-400 text-sm">
              © {new Date().getFullYear()} - Your privacy is protected
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Privacy;
