import React from 'react';
import MainLayout from '../layouts/MainLayout';
import PortfolioPreview from '../sections/PortfolioPreview';
import CTA from '../sections/CTA';

const Projects = () => {
  return (
    <MainLayout>
      <div className="pt-16">
        <PortfolioPreview />
      </div>
      <CTA />
    </MainLayout>
  );
};

export default Projects;
