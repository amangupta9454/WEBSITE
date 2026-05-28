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

const industries = [
  {
    name: "Restaurants",
    slug: "restaurants",
    icon: <Utensils size={24} className="text-orange-500" />,
  },
  {
    name: "Cafés",
    slug: "cafes",
    icon: <Coffee size={24} className="text-amber-600" />,
  },
  {
    name: "Gyms",
    slug: "gyms",
    icon: <Dumbbell size={24} className="text-blue-500" />,
  },
  {
    name: "Salons",
    slug: "salons",
    icon: <Scissors size={24} className="text-pink-500" />,
  },
  {
    name: "Clinics",
    slug: "clinics",
    icon: <Stethoscope size={24} className="text-teal-500" />,
  },
  {
    name: "Schools",
    slug: "schools",
    icon: <GraduationCap size={24} className="text-indigo-500" />,
  },
  {
    name: "Colleges",
    slug: "colleges",
    icon: <Library size={24} className="text-blue-600" />,
  },
  {
    name: "Startups",
    slug: "startups",
    icon: <Rocket size={24} className="text-purple-500" />,
  },
  {
    name: "Retail Shops",
    slug: "retail",
    icon: <ShoppingBag size={24} className="text-red-500" />,
  },
  {
    name: "Real Estate",
    slug: "realestate",
    icon: <Building2 size={24} className="text-blue-700" />,
  },
  {
    name: "Personal Brands",
    slug: "personalbrands",
    icon: <User size={24} className="text-gray-700" />,
  },
];

const IndustriesServed = () => {
  return (
    <section className="py-12 md:py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <motion.h2
            variants={fadeUp}
            className="text-3xl md:text-5xl font-black text-gray-900 mb-6"
          >
            Industries We Transform
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-lg text-gray-500 max-w-2xl mx-auto font-medium"
          >
            No matter your niche, a premium online presence elevates your brand.
            We build tailored digital solutions for every local business.
          </motion.p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-3 md:gap-5 max-w-5xl mx-auto"
        >
          {industries.map((ind, i) => (
            <motion.div key={i} variants={fadeUp}>
              <Link
                to={`/industries/${ind.slug}`}
                className="group flex items-center gap-3 md:gap-4 bg-white border border-gray-100 rounded-full py-2.5 px-5 md:py-4 md:px-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 hover:border-blue-100 transition-all duration-300 cursor-pointer"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-50 group-hover:bg-blue-50 rounded-full flex items-center justify-center transition-colors">
                  {ind.icon}
                </div>
                <h3 className="font-bold text-gray-900 text-sm md:text-lg tracking-wide">
                  {ind.name}
                </h3>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default IndustriesServed;
