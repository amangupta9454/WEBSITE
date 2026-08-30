import React from 'react';
import MainLayout from '../layouts/MainLayout';
import SEO from '../Components/SEO';
import PortfolioPreview from '../sections/PortfolioPreview';
import CTA from '../sections/CTA';

const Projects = () => {
  return (
    <MainLayout>
      <SEO 
        title="Our Projects & Portfolio | Code-A-Nova"
        description="Explore websites, software platforms and digital solutions developed by Code-A-Nova."
        canonicalUrl="https://code-a-nova.online/projects"
      />
      <div className="pt-16">
        <PortfolioPreview />
      </div>
      <CTA />
    </MainLayout>
  );
};

export default Projects;
