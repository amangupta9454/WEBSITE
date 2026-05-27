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
      <CTA />
    </MainLayout>
  );
};

export default Industries;
