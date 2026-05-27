import React from 'react';
import MainLayout from '../layouts/MainLayout';
import { motion } from 'framer-motion';
import { fadeUp } from '../animations/variants';
import { Mail, MapPin, Phone } from 'lucide-react';
import Button from '../components/Button';

const Contact = () => {
  return (
    <MainLayout>
      <div className="pt-32 pb-24 bg-[#FAFAFA] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16">
            
            <motion.div initial="hidden" animate="visible" variants={fadeUp}>
              <h1 className="text-4xl md:text-5xl font-black mb-6 text-gray-900">Let's Talk About Your Project</h1>
              <p className="text-gray-500 text-lg mb-12 font-medium">Whether you need a custom SaaS platform, an ERP system, or a modern website, our team is ready to deliver.</p>
              
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Mail size={24} />
                  </div>
                  <div>
                    <h4 className="text-gray-900 font-bold">Email Us</h4>
                    <p className="text-gray-500">codeanova26@gmail.com</p>
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
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm"
            >
              <form className="flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-gray-700">First Name</label>
                    <input type="text" className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:border-blue-600 transition-colors" placeholder="John" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-gray-700">Last Name</label>
                    <input type="text" className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:border-blue-600 transition-colors" placeholder="Doe" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-gray-700">Email Address</label>
                  <input type="email" className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:border-blue-600 transition-colors" placeholder="john@company.com" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-gray-700">Project Details</label>
                  <textarea rows={4} className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:border-blue-600 transition-colors" placeholder="Tell us about your project..."></textarea>
                </div>
                <button className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                  Send Message
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