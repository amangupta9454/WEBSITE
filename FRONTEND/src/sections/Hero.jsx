import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Layout, BarChart3 } from "lucide-react";
import { fadeUp, staggerContainer } from "../animations/variants";
import { useNavigate } from "react-router-dom";
import GlitchTitle from "../Components/GlitchTitle";
import GlassSurface from "../Components/GlassSurface";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-28 pb-16 overflow-hidden bg-[#F9FBF9]/80 backdrop-blur-[2px]">
      {/* Background radial gradients for premium SaaS feel */}
      <div className="absolute top-0 right-0 w-3/4 h-[700px] bg-gradient-to-bl from-brand-emerald/10 via-transparent to-transparent opacity-60 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-3/4 h-[700px] bg-gradient-to-tr from-brand-amber/5 via-transparent to-transparent opacity-40 rounded-full blur-[150px] pointer-events-none" />

      {/* Subtle monospaced grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.015)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      {/* Elegant thin lines */}
      <div className="absolute top-1/3 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-zinc-200/40 to-transparent pointer-events-none" />

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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 shadow-sm mb-8"
            >
              <span className="flex h-2 w-2 rounded-full bg-brand-emerald animate-pulse"></span>
              <span className="text-sm text-brand-emerald font-bold tracking-wide uppercase font-mono">
                Premium Business Solutions
              </span>
            </motion.div>

            <GlitchTitle
              text="Build a Website That Grows Your Business."
              highlight="Website"
              className="text-5xl md:text-7xl lg:text-[4.8rem] font-black leading-[1.05] mb-6 tracking-tight text-zinc-950 font-sans"
              tag="h1"
            />

            <motion.p
              variants={fadeUp}
              className="text-lg md:text-xl text-zinc-500 mb-10 max-w-xl leading-relaxed font-medium"
            >
              Websites instantly increase customer trust. Whether you own a
              restaurant, a clinic, or a retail shop, a modern digital presence
              turns visitors into paying customers.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row gap-4"
            >
              <button
                onClick={() => navigate("/contact")}
                className="px-8 py-4 bg-zinc-950 text-white rounded-full font-black flex items-center justify-center gap-2 hover:bg-brand-emerald hover:text-zinc-950 transition-all shadow-xl shadow-zinc-950/10 hover:shadow-brand-emerald/20 hover:-translate-y-0.5 cursor-pointer"
              >
                Build My Work <ArrowRight size={18} />
              </button>
              <button
                onClick={() => navigate("/industries")}
                className="px-8 py-4 bg-white text-zinc-800 border border-zinc-200 rounded-full font-black flex items-center justify-center gap-2 hover:bg-zinc-50 transition-all shadow-sm hover:shadow-md cursor-pointer"
              >
                Industries
              </button>
            </motion.div>
          </motion.div>

          {/* Right Floating Elements / High-End Light Dashboard Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative hidden lg:block h-full min-h-[600px]"
          >
            {/* Ambient behind dashboard */}
            <div className="absolute top-20 right-10 w-[400px] h-[300px] bg-brand-emerald/5 rounded-full blur-[80px] pointer-events-none" />

            {/* Main light glass card */}
            <motion.div
              animate={{ y: [-15, 15, -15] }}
              transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
              className="absolute top-10 right-0 w-[480px]"
            >
              <GlassSurface
                borderRadius={32}
                backgroundOpacity={0.02}
                saturation={1.25}
                displace={0}
                distortionScale={-70}
                className="border border-zinc-100 shadow-[0_30px_80px_rgba(0,0,0,0.05)] w-full backdrop-blur-3xl"
              >
                <div className="w-full flex flex-col justify-stretch items-stretch">
                  {/* Window Header */}
                  <div className="h-12 border-b border-zinc-100 flex items-center px-6 gap-2 bg-zinc-50/80">
                    <div className="w-3 h-3 rounded-full bg-rose-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-brand-emerald" />
                    <div className="ml-4 text-xs text-zinc-400 font-bold flex-1 text-center pr-12 tracking-widest uppercase font-mono">
                      RESTAURANT_ORDERS_DASHBOARD
                    </div>
                  </div>
                  
                  {/* Dashboard Content */}
              <div className="p-8">
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <p className="text-zinc-400 text-sm font-bold mb-1 uppercase tracking-widest font-mono">
                      Online Sales
                    </p>
                    <h3 className="text-5xl font-black text-zinc-950">$124,450</h3>
                  </div>
                  <div className="flex items-center gap-1 text-brand-emerald bg-brand-emerald/10 px-3 py-1 rounded-full text-sm font-bold border border-brand-emerald/20 shadow-sm">
                    <ArrowRight size={14} className="-rotate-45" /> +24.8%
                  </div>
                </div>

                {/* Bar chart mock */}
                <div className="flex items-end gap-3 h-32 mb-6 border-b border-zinc-100 pb-2">
                  {[40, 70, 45, 90, 65, 100, 80].map((h, i) => (
                    <div
                      key={i}
                      className="w-full bg-zinc-50 rounded-t-md relative group h-full flex items-end"
                    >
                      <div
                        className={`w-full rounded-t-md transition-all duration-500 ${i === 5 ? "bg-gradient-to-t from-brand-emerald to-brand-mint shadow-[0_0_20px_rgba(16,185,129,0.3)]" : "bg-zinc-200 group-hover:bg-brand-emerald/30"}`}
                        style={{ height: `${h}%` }}
                      />
                    </div>
                  ))}
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-50/50 p-5 rounded-2xl border border-zinc-100 hover:border-brand-emerald/20 transition-all duration-300 group">
                    <Layout
                      className="text-brand-emerald mb-3 group-hover:scale-110 group-hover:rotate-3 transition-transform"
                      size={24}
                    />
                    <p className="text-zinc-900 font-bold">Menu Views</p>
                    <p className="text-sm text-zinc-500 font-medium">12k+ today</p>
                  </div>
                  <div className="bg-zinc-50/50 p-5 rounded-2xl border border-zinc-100 hover:border-brand-mint/20 transition-all duration-300 group">
                    <BarChart3
                      className="text-brand-mint mb-3 group-hover:scale-110 group-hover:-rotate-3 transition-transform"
                      size={24}
                    />
                    <p className="text-zinc-900 font-bold">Bookings</p>
                    <p className="text-sm text-zinc-500 font-medium">Fully Booked</p>
                  </div>
                </div>
              </div>
              </div>
            </GlassSurface>
          </motion.div>

            {/* Floating element 2 */}
            <motion.div
              animate={{ y: [10, -10, 10] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="absolute bottom-10 -left-10 bg-white p-4 rounded-2xl shadow-xl border border-zinc-100 flex items-center gap-4 backdrop-blur-md"
            >
              <div className="w-12 h-12 bg-brand-emerald/10 border border-brand-emerald/20 rounded-full flex items-center justify-center text-brand-emerald font-black">
                GYM
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900">
                  Gym Website Live
                </p>
                <p className="text-xs font-bold text-brand-emerald">
                  50+ New Members
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
