import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Layout, BarChart3 } from "lucide-react";
import { fadeUp, staggerContainer } from "../animations/variants";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-24 overflow-hidden bg-[#FAFAFA]">
      {/* Background gradients for light theme */}
      <div className="absolute top-0 right-0 w-1/2 h-[600px] bg-gradient-to-bl from-blue-100 via-transparent to-transparent opacity-70 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/2 h-[600px] bg-gradient-to-tr from-purple-100 via-transparent to-transparent opacity-70 rounded-full blur-3xl pointer-events-none" />

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="text-left"
          >
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm mb-8"
            >
              <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span className="text-sm text-gray-600 font-bold tracking-wide uppercase">
                Premium Business Solutions
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-5xl md:text-7xl lg:text-[5rem] font-black leading-[1.05] mb-6 tracking-tight text-gray-900"
            >
              Build a{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Website
              </span>{" "}
              That <br className="hidden md:block" />
              Grows Your Business.
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-lg md:text-xl text-gray-500 mb-10 max-w-xl leading-relaxed font-medium"
            >
              Websites instantly increase customer trust. Whether you own a restaurant, a clinic, or a retail shop, a modern digital presence turns visitors into paying customers.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row gap-4"
            >
              <button
                onClick={() => navigate("/contact")}
                className="px-8 py-4 bg-gray-900 text-white rounded-full font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-all shadow-xl shadow-gray-900/20 hover:-translate-y-0.5"
              >
                Build My Work <ArrowRight size={18} />
              </button>
              <button
                onClick={() => navigate("/industries")}
                className="px-8 py-4 bg-white text-gray-900 border border-gray-200 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-all shadow-sm hover:shadow-md"
              >
                Industries
              </button>
            </motion.div>
          </motion.div>

          {/* Right Floating Elements / Light Dashboard Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative hidden lg:block h-full min-h-[600px]"
          >
            {/* Main glass card */}
            <motion.div
              animate={{ y: [-15, 15, -15] }}
              transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
              className="absolute top-10 right-0 w-[480px] bg-white/90 border border-gray-100 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden backdrop-blur-2xl z-10"
            >
              <div className="h-12 border-b border-gray-100 flex items-center px-6 gap-2 bg-gray-50/80">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <div className="ml-4 text-xs text-gray-400 font-bold flex-1 text-center pr-12 tracking-wider">
                  RESTAURANT_ORDERS_DASHBOARD
                </div>
              </div>
              <div className="p-8">
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <p className="text-gray-400 text-sm font-bold mb-1 uppercase tracking-wider">
                      Online Sales
                    </p>
                    <h3 className="text-5xl font-black text-gray-900">$124k</h3>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full text-sm font-bold">
                    <ArrowRight size={14} className="-rotate-45" /> +24%
                  </div>
                </div>

                {/* Activity chart mock */}
                <div className="flex items-end gap-3 h-32 mb-6 border-b border-gray-100 pb-2">
                  {[20, 40, 30, 80, 50, 100, 60].map((h, i) => (
                    <div
                      key={i}
                      className="w-full bg-gray-50 rounded-t-md relative group"
                    >
                      <div
                        className={`absolute bottom-0 w-full rounded-t-md transition-all duration-500 ${i === 5 ? "bg-blue-600 shadow-lg shadow-blue-500/30" : "bg-gray-200 group-hover:bg-purple-300"}`}
                        style={{ height: `${h}%` }}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex gap-4">
                  <div className="flex-1 bg-gray-50 p-5 rounded-2xl border border-gray-100 hover:border-purple-200 transition-colors group">
                    <Layout
                      className="text-purple-600 mb-3 group-hover:scale-110 transition-transform"
                      size={24}
                    />
                    <p className="text-gray-900 font-bold">Menu Views</p>
                    <p className="text-sm text-gray-500">12k+ today</p>
                  </div>
                  <div className="flex-1 bg-gray-50 p-5 rounded-2xl border border-gray-100 hover:border-blue-200 transition-colors group">
                    <BarChart3
                      className="text-blue-600 mb-3 group-hover:scale-110 transition-transform"
                      size={24}
                    />
                    <p className="text-gray-900 font-bold">Bookings</p>
                    <p className="text-sm text-gray-500">Fully Booked</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Floating element 2 */}
            <motion.div
              animate={{ y: [10, -10, 10] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="absolute bottom-10 -left-10 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-4 z-20"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-xl">
                🚀
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">
                  Business Scaled
                </p>
                <p className="text-xs font-medium text-emerald-500">
                  Growth Unlocked
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
