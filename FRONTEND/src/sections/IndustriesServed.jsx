import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Utensils,
  Coffee,
  Dumbbell,
  Scissors,
  Stethoscope,
  GraduationCap,
  Library,
  Rocket,
  ShoppingBag,
  Building2,
  User,
} from "lucide-react";
import { fadeUp, staggerContainer } from "../animations/variants";
import BorderGlow from "../Components/BorderGlow";

const industries = [
  {
    name: "Restaurants",
    slug: "restaurants",
    icon: <Utensils size={24} className="text-brand-amber" />,
    colors: ['#F59E0B', '#FBBF24', '#FDE047'] // Amber gradient
  },
  {
    name: "Cafés",
    slug: "cafes",
    icon: <Coffee size={24} className="text-brand-gold" />,
    colors: ['#FBBF24', '#FDE047', '#FEF08A'] // Gold gradient
  },
  {
    name: "Gyms",
    slug: "gyms",
    icon: <Dumbbell size={24} className="text-brand-emerald" />,
    colors: ['#10B981', '#34D399', '#6EE7B7'] // Emerald gradient
  },
  {
    name: "Salons",
    slug: "salons",
    icon: <Scissors size={24} className="text-zinc-500" />,
    colors: ['#71717A', '#A1A1AA', '#D4D4D8'] // Silver gradient
  },
  {
    name: "Clinics",
    slug: "clinics",
    icon: <Stethoscope size={24} className="text-brand-mint" />,
    colors: ['#34D399', '#06B6D4', '#22D3EE'] // Mint gradient
  },
  {
    name: "Schools",
    slug: "schools",
    icon: <GraduationCap size={24} className="text-brand-emerald" />,
    colors: ['#10B981', '#34D399', '#6EE7B7'] // Emerald gradient
  },
  {
    name: "Colleges",
    slug: "colleges",
    icon: <Library size={24} className="text-brand-mint" />,
    colors: ['#06B6D4', '#34D399', '#6EE7B7'] // Mint-emerald gradient
  },
  {
    name: "Startups",
    slug: "startups",
    icon: <Rocket size={24} className="text-brand-gold" />,
    colors: ['#FBBF24', '#F59E0B', '#FDE047'] // Gold-amber gradient
  },
  {
    name: "Retail Shops",
    slug: "retail",
    icon: <ShoppingBag size={24} className="text-brand-amber" />,
    colors: ['#F59E0B', '#FBBF24', '#FDE047'] // Amber gradient
  },
  {
    name: "Real Estate",
    slug: "realestate",
    icon: <Building2 size={24} className="text-zinc-600" />,
    colors: ['#52525B', '#71717A', '#A1A1AA'] // Zinc gradient
  },
  {
    name: "Personal Brands",
    slug: "personalbrands",
    icon: <User size={24} className="text-zinc-550" />,
    colors: ['#10B981', '#A1A1AA', '#34D399'] // Emerald-zinc gradient
  },
];

const IndustriesServed = () => {
  return (
    <section className="py-16 md:py-28 bg-[#F9FBF9]/80 backdrop-blur-[2px] relative overflow-hidden w-full">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] bg-brand-emerald/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 w-full">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <span className="inline-block py-1.5 px-4 rounded-full bg-emerald-50 border border-emerald-100 text-brand-emerald text-xs font-mono font-bold tracking-widest uppercase mb-4 shadow-sm">
            Industries We Serve
          </span>
          <motion.h2
            variants={fadeUp}
            className="text-3xl md:text-5xl font-black text-zinc-950 mb-6 font-sans tracking-tight"
          >
            Transforming Local Markets
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-lg text-zinc-500 max-w-2xl mx-auto font-medium leading-relaxed"
          >
            No matter your niche, a premium custom-built website elevates your client trust.
            Explore our custom engineering solutions optimized for your industry.
          </motion.p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl mx-auto w-full px-4"
        >
          {industries.map((ind, i) => (
            <motion.div key={i} variants={fadeUp} className="w-full h-full flex flex-col">
              <BorderGlow
                borderRadius={24}
                backgroundColor="#ffffff"
                glowRadius={24}
                glowIntensity={0.65}
                coneSpread={20}
                colors={ind.colors}
                className="w-full h-full flex flex-col items-stretch"
              >
                <Link
                  to={`/industries/${ind.slug}`}
                  className="group flex flex-col justify-between items-start p-6 md:p-8 h-full w-full bg-transparent transition-all duration-300 cursor-pointer"
                >
                  <div className="w-12 h-12 bg-zinc-50 group-hover:bg-emerald-50 border border-zinc-100 rounded-2xl flex items-center justify-center transition-all duration-300 mb-8 shrink-0 shadow-inner">
                    {ind.icon}
                  </div>
                  <div>
                    <h3 className="font-black text-zinc-800 group-hover:text-zinc-950 text-base md:text-lg tracking-tight mb-3 leading-tight">
                      {ind.name}
                    </h3>
                    <p className="text-xs font-bold text-zinc-400 font-mono tracking-widest uppercase flex items-center gap-1 group-hover:text-brand-emerald transition-colors">
                      Explore <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                    </p>
                  </div>
                </Link>
              </BorderGlow>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default IndustriesServed;
