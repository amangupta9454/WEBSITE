import React, { useState } from "react";
import axios from "axios";
import MainLayout from "../layouts/MainLayout";
import { motion } from "framer-motion";
import { fadeUp } from "../animations/variants";
import { Mail, MapPin, Linkedin, Instagram } from "lucide-react";

const Contact = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    projectDetails: "",
  });
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: "", message: "" });

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/contact`,
        formData,
      );
      setStatus({
        type: "success",
        message: res.data?.message || "Message sent successfully.",
      });
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        projectDetails: "",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error?.response?.data?.message ||
          "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="pt-32 pb-24 bg-[#FAFAFA] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16">
            <motion.div initial="hidden" animate="visible" variants={fadeUp}>
              <h1 className="text-4xl md:text-5xl font-black mb-6 text-gray-900">
                Let's Talk About Your Project
              </h1>
              <p className="text-gray-500 text-lg mb-12 font-medium">
                Whether you need a custom SaaS platform, an ERP system, or a
                modern website, our team is ready to deliver.
              </p>

              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Mail size={24} />
                  </div>
                  <div>
                    <h4 className="text-gray-900 font-bold">Email Us</h4>
                    <a
                      href="mailto:codeanova26@gmail.com"
                      className="text-gray-500 hover:text-blue-600 transition-colors"
                    >
                      codeanova26@gmail.com
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h4 className="text-gray-900 font-bold">Office</h4>
                    <p className="text-gray-500">Remote & Worldwide</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h4 className="text-gray-900 font-bold mb-3">Follow Us</h4>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href="https://www.linkedin.com/company/code-a-nova/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      <Linkedin size={16} /> LinkedIn
                    </a>
                    <a
                      href="https://www.instagram.com/codenova31/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-pink-200 hover:bg-pink-50 hover:text-pink-700 transition-colors"
                    >
                      <Instagram size={16} /> Instagram
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm"
            >
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-gray-700">
                      First Name
                    </label>
                    <input
                      required
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      type="text"
                      className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:border-blue-600 transition-colors"
                      placeholder="John"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-gray-700">
                      Last Name
                    </label>
                    <input
                      required
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      type="text"
                      className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:border-blue-600 transition-colors"
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-gray-700">
                    Email Address
                  </label>
                  <input
                    required
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    type="email"
                    className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:border-blue-600 transition-colors"
                    placeholder="john@company.com"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-gray-700">
                    Phone Number
                  </label>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    type="tel"
                    className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:border-blue-600 transition-colors"
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-gray-700">
                    Project Details
                  </label>
                  <textarea
                    required
                    name="projectDetails"
                    value={formData.projectDetails}
                    onChange={handleChange}
                    rows={4}
                    className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:border-blue-600 transition-colors"
                    placeholder="Tell us about your project..."
                  ></textarea>
                </div>
                {status.message ? (
                  <p
                    className={`text-sm rounded-lg px-4 py-3 ${status.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}
                  >
                    {status.message}
                  </p>
                ) : null}
                <button
                  disabled={isSubmitting}
                  className="w-full bg-gray-900 hover:bg-gray-800 disabled:opacity-70 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Contact;
