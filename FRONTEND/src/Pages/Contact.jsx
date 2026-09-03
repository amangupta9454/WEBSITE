import React, { useState } from "react";
import MainLayout from "../layouts/MainLayout";
import SEO from '../Components/SEO';
import { motion, AnimatePresence } from "framer-motion";
import { fadeUp } from "../animations/variants";
import { 
  Mail, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Phone, 
  Send, 
  Sparkles, 
  Building, 
  ShieldCheck, 
  HelpCircle, 
  ChevronDown, 
  Copy, 
  Check, 
  Calendar,
  Layers,
  GraduationCap,
  Wrench,
  Handshake
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const INQUIRY_TYPES = [
  { id: "project", label: "Start a Project", icon: <Layers size={18} />, desc: "Web, AI, ERP, SaaS or Custom App" },
  { id: "student", label: "Internship & Student", icon: <GraduationCap size={18} />, desc: "Certificates, Tasks, Domain Queries" },
  { id: "support", label: "Technical Support", icon: <Wrench size={18} />, desc: "Bug reports, Account, Portal Help" },
  { id: "partnership", label: "Partnership / Other", icon: <Handshake size={18} />, desc: "Business, Media, or Collaboration" }
];

const FAQS = [
  {
    q: "How quickly can we kick off a new project?",
    a: "Following our initial discovery call and project scope agreement, we typically begin sprint planning and Figma design architecture within 48 to 72 hours."
  },
  {
    q: "Do you sign a Non-Disclosure Agreement (NDA) before discussions?",
    a: "Absolutely. We treat your intellectual property with paramount security. We are happy to execute an NDA before you share sensitive business workflows or proprietary data."
  },
  {
    q: "What tech stack do you specialize in?",
    a: "We specialize in modern, high-performance stacks including React, Next.js, Node.js, Express, MongoDB, PostgreSQL, Python (FastAPI/LangChain for AI pipelines), Tailwind CSS, Docker, and AWS/Cloudflare edge deployments."
  },
  {
    q: "What is your pricing and milestone model?",
    a: "We work on transparent, milestone-based pricing. Projects are broken down into measurable deliverables with clearly defined acceptance criteria, ensuring you only pay for verified progress."
  },
  {
    q: "How can students verify Code-A-Nova internship certificates?",
    a: "All Code-A-Nova certificates come with unique alphanumeric verification IDs and QR codes that can be authenticated instantly via our public certificate portal at any time."
  },
  {
    q: "Do you provide post-launch maintenance and continuous support?",
    a: "Yes. Every custom build includes a complimentary 30-day post-launch warranty period, followed by flexible SLA-backed maintenance packages for server health, backups, and feature iterations."
  }
];

const Contact = () => {
  const [selectedType, setSelectedType] = useState("project");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    serviceNeeded: "Full-Stack Web Application",
    budget: "$1,000 - $3,000",
    timeline: "Within 1 Month",
    studentId: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [activeFaq, setActiveFaq] = useState(0);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("codeanova26@gmail.com");
    setCopiedEmail(true);
    toast.success("Email copied to clipboard!");
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Build comprehensive description containing all structured details
    let combinedDescription = formData.description.trim();
    if (selectedType === "project") {
      combinedDescription = `
[PROJECT INQUIRY SPECIFICATION]
• Requested Service: ${formData.serviceNeeded}
• Estimated Budget: ${formData.budget}
• Target Timeline: ${formData.timeline}
• Contact Phone/WhatsApp: ${formData.phone || "Not provided"}

[CLIENT DETAILS / REQUIREMENTS]
${formData.description.trim()}
      `.trim();
    } else if (selectedType === "student") {
      combinedDescription = `
[STUDENT / INTERNSHIP INQUIRY]
• Student ID: ${formData.studentId || "Not specified"}
• Contact Mobile: ${formData.phone || "Not provided"}

[INQUIRY DETAILS]
${formData.description.trim()}
      `.trim();
    } else {
      if (formData.phone) {
        combinedDescription = `• Contact Mobile: ${formData.phone}\n\n${combinedDescription}`;
      }
    }

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      subject: formData.subject.trim() || `${INQUIRY_TYPES.find(t => t.id === selectedType)?.label || "General"} Inquiry from ${formData.name}`,
      issueType: selectedType === "project" 
        ? "New Project Proposal" 
        : selectedType === "student" 
        ? "Internship & Academic Support" 
        : selectedType === "support" 
        ? "Technical Support" 
        : "Partnership Inquiry",
      description: combinedDescription,
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5006"}/api/contact/support`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
        toast.success("Inquiry sent successfully! Our team will get back to you shortly.");
      } else {
        toast.error(data.message || "Failed to submit request.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Network error. Please try again or contact us directly via email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <SEO 
        title="Contact Code-A-Nova | Start a Project, Internship & Tech Support"
        description="Get in touch with Code-A-Nova. Request a project proposal for web development, AI solutions, ERP software, or connect with our student support team."
        canonicalUrl="https://code-a-nova.online/contact"
      />
      <Toaster position="top-right" />

      <div className="pt-32 pb-24 md:pt-40 md:pb-32 bg-[#FAFAFA] min-h-screen relative overflow-hidden">
        {/* Soft background glows */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-blue-100/50 to-indigo-100/40 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 left-10 w-96 h-96 bg-purple-100/40 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          
          {/* Header */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200/70 text-blue-700 font-bold text-xs uppercase tracking-wider mb-4 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Direct Solutions Desk
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight mb-5">
              Let’s Build Something <br className="hidden sm:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                Extraordinary Together
              </span>
            </h1>
            <p className="text-gray-600 text-base sm:text-lg font-medium leading-relaxed">
              Have a digital product to build, an operational workflow to automate, or need support with our internship ecosystem? Send us your brief or reach out directly.
            </p>
          </motion.div>

          {/* Main Grid: Info Sidebar & Interactive Form */}
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-24">
            
            {/* Left Sidebar: Contact Channels & Credentials (5 cols) */}
            <motion.div
              initial={{ opacity: 0, x: -25 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="lg:col-span-5 space-y-6"
            >
              {/* Direct Email Card */}
              <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
                    <Mail size={24} />
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Copy Email Address"
                  >
                    {copiedEmail ? (
                      <>
                        <Check size={14} className="text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-1">Official Communications Desk</h3>
                <p className="text-xs text-gray-500 mb-3 font-medium">For proposals, partnerships & general inquiries:</p>
                <a 
                  href="mailto:codeanova26@gmail.com" 
                  className="text-blue-600 font-bold text-base hover:underline break-all"
                >
                  codeanova26@gmail.com
                </a>
              </div>

              {/* SLA Response Time Card */}
              <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                    <Clock size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900">Guaranteed Response SLA</h3>
                    <p className="text-xs text-indigo-600 font-bold">Fast & Dedicated Turnaround</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="text-xl font-black text-slate-800">&lt; 2 Hours</div>
                    <div className="text-[11px] text-slate-500 font-medium">Project Proposals</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="text-xl font-black text-slate-800">&lt; 24 Hours</div>
                    <div className="text-[11px] text-slate-500 font-medium">Support Tickets</div>
                  </div>
                </div>
              </div>

              {/* Trust & Verification Badges */}
              <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
                    <ShieldCheck className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-black text-base">Verified & Compliant</h4>
                    <p className="text-xs text-slate-300">Registered Tech Enterprise</p>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-normal mb-4">
                  Code-A-Nova operates under strict data privacy protocols and government compliance standards. All project contracts are governed by binding Non-Disclosure Agreements (NDAs).
                </p>
                <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                  <span className="bg-white/10 px-3 py-1 rounded-full border border-white/10 text-slate-200">MSME Registered</span>
                  <span className="bg-white/10 px-3 py-1 rounded-full border border-white/10 text-slate-200">Strict IP Protection</span>
                  <span className="bg-white/10 px-3 py-1 rounded-full border border-white/10 text-slate-200">Pan-India Reach</span>
                </div>
              </div>

            </motion.div>

            {/* Right Main Form Area (7 cols) */}
            <motion.div
              initial={{ opacity: 0, x: 25 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-7 bg-white border border-gray-100 rounded-3xl p-6 sm:p-10 shadow-lg shadow-gray-200/30"
            >
              {submitted ? (
                <div className="text-center py-16 animate-fade-in">
                  <motion.div 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }} 
                    className="inline-flex justify-center items-center w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full mb-6 shadow-md"
                  >
                    <CheckCircle2 size={42} />
                  </motion.div>
                  <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3 tracking-tight">
                    Inquiry Received Successfully!
                  </h2>
                  <p className="text-gray-500 font-medium text-sm sm:text-base max-w-md mx-auto mb-8 leading-relaxed">
                    Thank you for reaching out to Code-A-Nova. A confirmation has been recorded, and our engineering solutions team will review your brief within 2 to 24 hours.
                  </p>
                  <button 
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({
                        name: "",
                        email: "",
                        phone: "",
                        subject: "",
                        serviceNeeded: "Full-Stack Web Application",
                        budget: "$1,000 - $3,000",
                        timeline: "Within 1 Month",
                        studentId: "",
                        description: "",
                      });
                    }} 
                    className="px-8 py-3.5 bg-gray-900 hover:bg-blue-600 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer text-sm"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <div>
                  {/* Category Selector Tabs */}
                  <div className="mb-8">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-3">
                      Select Inquiry Type
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {INQUIRY_TYPES.map((type) => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setSelectedType(type.id)}
                          className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                            selectedType === type.id
                              ? "bg-blue-50/80 border-blue-500 text-blue-900 ring-2 ring-blue-200 shadow-2xs"
                              : "bg-slate-50/60 border-slate-200/80 text-slate-600 hover:bg-slate-100/60"
                          }`}
                        >
                          <div className={`p-1.5 rounded-lg w-fit mb-2 ${
                            selectedType === type.id ? "bg-blue-600 text-white" : "bg-white text-slate-600 border border-slate-200"
                          }`}>
                            {type.icon}
                          </div>
                          <span className="text-xs font-bold leading-tight">{type.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* The Form */}
                  <form onSubmit={handleSubmit} className="space-y-5">
                    
                    {/* Basic Info: Name & Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                          Your Full Name *
                        </label>
                        <input
                          required
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 transition-all text-sm font-medium placeholder:text-slate-400"
                          placeholder="e.g. Alex Morgan"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                          Email Address *
                        </label>
                        <input
                          required
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 transition-all text-sm font-medium placeholder:text-slate-400"
                          placeholder="alex@company.com"
                        />
                      </div>
                    </div>

                    {/* Phone / WhatsApp */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                          Phone / WhatsApp (Optional)
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 transition-all text-sm font-medium placeholder:text-slate-400"
                          placeholder="+91 98765 43210"
                        />
                      </div>

                      {/* Dynamic Field: Subject / Student ID */}
                      {selectedType === "student" ? (
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                            Student ID / Roll No. (If applicable)
                          </label>
                          <input
                            type="text"
                            name="studentId"
                            value={formData.studentId}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 transition-all text-sm font-medium placeholder:text-slate-400"
                            placeholder="e.g. CN/INT/2026/857"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                            Subject / Topic *
                          </label>
                          <input
                            required
                            type="text"
                            name="subject"
                            value={formData.subject}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 transition-all text-sm font-medium placeholder:text-slate-400"
                            placeholder={selectedType === "project" ? "e.g. E-Commerce Platform Redesign" : "Brief summary"}
                          />
                        </div>
                      )}
                    </div>

                    {/* Specific Project Fields */}
                    {selectedType === "project" && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 animate-fade-in">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                            Service Needed
                          </label>
                          <select
                            name="serviceNeeded"
                            value={formData.serviceNeeded}
                            onChange={handleChange}
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option>Full-Stack Web App</option>
                            <option>Custom AI / LLM Agent</option>
                            <option>Bespoke SaaS / ERP</option>
                            <option>High-Converting Landing Page</option>
                            <option>Mobile App (React Native)</option>
                            <option>UI/UX Prototyping</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                            Budget Range
                          </label>
                          <select
                            name="budget"
                            value={formData.budget}
                            onChange={handleChange}
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option>&lt; ₹30,000 ($350)</option>
                            <option>₹30,000 - ₹80,000 ($1,000)</option>
                            <option>₹80,000 - ₹2,00,000 ($2,500)</option>
                            <option>₹2,00,000+ ($3,000+)</option>
                            <option>Flexible / To be discussed</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                            Target Launch
                          </label>
                          <select
                            name="timeline"
                            value={formData.timeline}
                            onChange={handleChange}
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option>Urgent (&lt; 2 Weeks)</option>
                            <option>Within 1 Month</option>
                            <option>2 - 3 Months</option>
                            <option>Flexible Exploration</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Detailed Message / Description */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        {selectedType === "project" 
                          ? "Project Scope & Description *" 
                          : selectedType === "student" 
                          ? "Describe Your Query / Issue *" 
                          : "Details / Message *"}
                      </label>
                      <textarea
                        required
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="5"
                        className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 transition-all resize-none text-sm font-medium placeholder:text-slate-400 leading-relaxed"
                        placeholder={
                          selectedType === "project" 
                            ? "Tell us about your product goals, must-have features, target audience, and any reference websites..."
                            : selectedType === "student" 
                            ? "Mention your internship domain, batch, certificate query, or task feedback issue..."
                            : "Please provide detailed information so our team can resolve it efficiently..."
                        }
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-black rounded-xl shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-sm tracking-wide uppercase"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="animate-spin" size={18} />
                          <span>Transmitting Your Brief...</span>
                        </>
                      ) : (
                        <>
                          <Send size={18} />
                          <span>{selectedType === "project" ? "Request Project Proposal" : "Submit Inquiry"}</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium pt-1">
                      <ShieldCheck size={14} className="text-emerald-500" />
                      <span>Zero spam guarantee. Your details are secured under strict NDA protocols.</span>
                    </div>

                  </form>
                </div>
              )}
            </motion.div>

          </div>

          {/* Detailed FAQ Accordion Section */}
          <div className="pt-12 border-t border-gray-200/70">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-xs uppercase tracking-wider mb-3">
                <HelpCircle size={14} className="text-blue-600" />
                Frequently Asked Questions
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
                Everything You Need to Know
              </h2>
              <p className="text-slate-500 text-sm sm:text-base font-medium mt-2">
                Quick answers to common questions about working with Code-A-Nova.
              </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-3">
              {FAQS.map((faq, idx) => (
                <div 
                  key={idx}
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="bg-white border border-gray-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs hover:border-blue-300 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900">
                      {faq.q}
                    </h3>
                    <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 ${activeFaq === idx ? 'rotate-180 text-blue-600' : ''}`} />
                  </div>
                  {activeFaq === idx && (
                    <p className="mt-3 text-sm text-slate-600 font-normal leading-relaxed pt-2 border-t border-slate-100 animate-fade-in">
                      {faq.a}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </MainLayout>
  );
};

export default Contact;
