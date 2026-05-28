import React from 'react';
import MainLayout from '../layouts/MainLayout';
import { motion } from 'framer-motion';
import { fadeUp } from '../animations/variants';
import IndustriesServed from '../sections/IndustriesServed';
import CTA from '../sections/CTA';


const Industries = () => {
  return (
    <MainLayout>
      <div className="pt-16">
        <IndustriesServed />
      </div>

      {/* What we delivered */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">What We Delivered</h2>
          <p className="text-gray-300 max-w-2xl mx-auto mb-8">
            Our expertise across multiple industries has helped clients achieve remarkable growth.
          </p>
          <ul className="grid md:grid-cols-3 gap-6 text-left max-w-4xl mx-auto">
            <li className="bg-white/5 p-6 rounded-xl">
              <h3 className="text-xl font-semibold mb-2">Increased Revenue</h3>
              <p className="text-gray-300">Up to 250% revenue boost for e‑commerce partners.</p>
            </li>
            <li className="bg-white/5 p-6 rounded-xl">
              <h3 className="text-xl font-semibold mb-2">Operational Efficiency</h3>
              <p className="text-gray-300">Reduced manual workload by 70% with automation.</p>
            </li>
            <li className="bg-white/5 p-6 rounded-xl">
              <h3 className="text-xl font-semibold mb-2">Customer Satisfaction</h3>
              <p className="text-gray-300">Improved NPS scores by 40 points.</p>
            </li>
          </ul>
        </div>
      </section>
    </MainLayout>
  );
};

export default Industries;
