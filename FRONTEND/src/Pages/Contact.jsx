import React, { useState } from "react";
import axios from "axios";
import MainLayout from "../layouts/MainLayout";
import { motion } from "framer-motion";
import { fadeUp } from "../animations/variants";
import { Mail, MapPin, Linkedin, Instagram } from "lucide-react";
import GlitchTitle from "../Components/GlitchTitle";
import TiltSpotlightCard from '../Components/TiltSpotlightCard';
import GlassSurface from "../Components/GlassSurface";

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
      <div className="pt-32 pb-24 bg-[#F9FBF9] relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-1/2 h-[500px] bg-brand-emerald/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-1/2 h-[500px] bg-brand-mint/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <motion.div initial="hidden" animate="visible" variants={fadeUp}>
              <GlitchTitle
                text="Let's Talk About Your Project"
                highlight="Project"
                className="text-4xl md:text-5xl font-black mb-6 text-zinc-950 tracking-tight leading-tight"
                tag="h1"
              />
              <p className="text-zinc-500 text-lg mb-12 font-medium leading-relaxed">
                Whether you need a custom SaaS platform, an ERP system, or a
                modern website, our team is ready to deliver.
              </p>

              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 text-brand-emerald flex items-center justify-center shadow-sm">
                    <Mail size={24} />
                  </div>
                  <div>
                    <h4 className="text-zinc-950 font-bold tracking-tight">Email Us</h4>
                    <a
                      href="mailto:codeanova26@gmail.com"
                      className="text-zinc-555 hover:text-brand-emerald transition-colors font-mono font-bold"
                    >
                      codeanova26@gmail.com
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 text-brand-emerald flex items-center justify-center shadow-sm">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h4 className="text-zinc-950 font-bold tracking-tight">Office</h4>
                    <p className="text-zinc-500 font-medium">Remote & Worldwide</p>
                  </div>
                </div>

                <TiltSpotlightCard className="p-5 hover:shadow-xl hover:shadow-zinc-300/30 duration-500">
                  <h4 className="text-zinc-950 font-bold mb-3 tracking-tight">Follow Us</h4>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href="https://www.linkedin.com/company/code-a-nova/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-bold text-zinc-600 hover:border-brand-emerald/30 hover:bg-brand-emerald/5 hover:text-brand-emerald transition-colors font-mono"
                    >
                      <Linkedin size={16} /> LinkedIn
                    </a>
                    <a
                      href="https://www.instagram.com/codenova31/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-bold text-zinc-600 hover:border-brand-mint/30 hover:bg-brand-mint/5 hover:text-brand-mint transition-colors font-mono"
                    >
                      <Instagram size={16} /> Instagram
                    </a>
                  </div>
                </TiltSpotlightCard>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full h-full"
            >
              <GlassSurface
                borderRadius={28}
                backgroundOpacity={0.02}
                saturation={1.2}
                displace={0}
                distortionScale={-60}
                className="border border-zinc-150 shadow-2xl shadow-zinc-200/30 backdrop-blur-3xl w-full h-full"
              >
                <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-8 w-full">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-zinc-700">
                        First Name
                      </label>
                      <input
                        required
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        type="text"
                        className="bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 text-zinc-950 focus:outline-none focus:border-brand-emerald focus:bg-white transition-colors font-sans font-medium placeholder:text-zinc-400"
                        placeholder="John"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-zinc-700">
                        Last Name
                      </label>
                      <input
                        required
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        type="text"
                        className="bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 text-zinc-950 focus:outline-none focus:border-brand-emerald focus:bg-white transition-colors font-sans font-medium placeholder:text-zinc-400"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-zinc-700">
                      Email Address
                    </label>
                    <input
                      required
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      type="email"
                      className="bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 text-zinc-950 focus:outline-none focus:border-brand-emerald focus:bg-white transition-colors font-sans font-medium placeholder:text-zinc-400"
                      placeholder="john@company.com"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-zinc-700">
                      Phone Number
                    </label>
                    <input
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      type="tel"
                      className="bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 text-zinc-950 focus:outline-none focus:border-brand-emerald focus:bg-white transition-colors font-sans font-medium placeholder:text-zinc-400"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-zinc-700">
                      Project Details
                    </label>
                    <textarea
                      required
                      name="projectDetails"
                      value={formData.projectDetails}
                      onChange={handleChange}
                      rows={4}
                      className="bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 text-zinc-950 focus:outline-none focus:border-brand-emerald focus:bg-white transition-colors font-sans font-medium placeholder:text-zinc-400"
                      placeholder="Tell us about your project..."
                    ></textarea>
                  </div>
                  {status.message ? (
                    <p
                      className={`text-sm rounded-lg px-4 py-3 ${status.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-100" : "bg-rose-50/80 text-rose-800 border border-rose-100"}`}
                    >
                      {status.message}
                    </p>
                  ) : null}
                  <button
                    disabled={isSubmitting}
                    className="w-full bg-zinc-950 hover:bg-brand-emerald text-white hover:text-zinc-950 font-black py-4 px-6 rounded-full transition-all duration-300 hover:-translate-y-0.5 shadow-lg shadow-zinc-950/10 hover:shadow-brand-emerald/20 cursor-pointer disabled:opacity-70 disabled:hover:translate-y-0"
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </button>
                </form>
              </GlassSurface>
            </motion.div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Contact;
