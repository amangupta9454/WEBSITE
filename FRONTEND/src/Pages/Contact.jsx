import React, { useState } from "react";
import MainLayout from "../layouts/MainLayout";
import SEO from '../Components/SEO';
import { motion } from "framer-motion";
import { fadeUp } from "../animations/variants";
import { Mail, MessageSquare, Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    issueType: "Technical Support",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5006"}/api/contact/support`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
        toast.success("Support ticket submitted successfully!");
      } else {
        toast.error(data.message || "Failed to submit ticket.");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <SEO 
        title="Contact Code-A-Nova | Get a Project Proposal"
        description="Contact Code-A-Nova for web development, AI automation, e-commerce, ERP and custom software solutions."
        canonicalUrl="https://code-a-nova.online/contact"
      />
      <Toaster position="top-right" />
      <div className="pt-32 pb-24 bg-[#FAFAFA] min-h-screen relative overflow-hidden transition-colors duration-300">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-50 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl mb-6 shadow-sm border border-blue-100">
              <MessageSquare size={32} />
            </div>
            <h1 className="text-4xl md:text-6xl font-black mb-6 text-gray-900 tracking-tight">Support Portal</h1>
            <p className="text-gray-500 text-lg font-medium max-w-2xl mx-auto">
              Having trouble with an interview? Need billing support? Our team is here to help.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Left Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <Clock size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Response Time</h3>
                    <p className="text-gray-500 font-medium">Within 24 hours</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                    <Mail size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Email Us</h3>
                    <p className="text-gray-500 font-medium">codeanova26@gmail.com</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-4">FAQ</h3>
                <ul className="space-y-4 text-gray-600 font-medium text-sm">
                  <li className="flex items-start space-x-2">
                    <AlertCircle size={16} className="text-blue-500 mt-1 flex-shrink-0" />
                    <span>My interview crashed. Do I lose my credit? <br/><span className="text-gray-400 block mt-1">No. If an interview isn't completed, the credit isn't deducted.</span></span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <AlertCircle size={16} className="text-blue-500 mt-1 flex-shrink-0" />
                    <span>Can I delete my account? <br/><span className="text-gray-400 block mt-1">Yes. Submit a request using the form.</span></span>
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* Right Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="md:col-span-2 bg-white border border-gray-100 rounded-3xl p-8 md:p-12 shadow-sm"
            >
              {submitted ? (
                <div className="text-center py-16">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="inline-flex justify-center items-center w-20 h-20 bg-green-100 text-green-500 rounded-full mb-6">
                    <CheckCircle2 size={40} />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Ticket Submitted Successfully</h2>
                  <p className="text-gray-500 font-medium mb-8">We've received your request and sent a confirmation to your email. Our team will review it shortly.</p>
                  <button onClick={() => setSubmitted(false)} className="px-6 py-3 bg-gray-100 text-gray-900 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                    Submit Another Ticket
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Name</label>
                      <input
                        required
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                      <input
                        required
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 transition-all"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Issue Type</label>
                      <select
                        name="issueType"
                        value={formData.issueType}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 transition-all"
                      >
                        <option>Technical Support</option>
                        <option>Billing / Refund Request</option>
                        <option>Data Deletion Request</option>
                        <option>Bug Report</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Subject</label>
                      <input
                        required
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 transition-all"
                        placeholder="Brief summary of issue"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                    <textarea
                      required
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows="6"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 transition-all resize-none"
                      placeholder="Please provide as much detail as possible..."
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin mr-2" size={20} />
                        Sending...
                      </>
                    ) : (
                      "Submit Ticket"
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Contact;
