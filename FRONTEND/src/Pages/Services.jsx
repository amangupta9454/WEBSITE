import React from 'react';
import MainLayout from '../layouts/MainLayout';
import SEO from '../Components/SEO';
import ServicesOverview from '../sections/ServicesOverview';
import CTA from '../sections/CTA';

const Services = () => {
  return (
    <MainLayout>
      <SEO 
        title="Web Development & AI Solutions | Code-A-Nova"
        description="Explore Code-A-Nova's web development, e-commerce, AI automation, ERP and custom software solutions for modern businesses."
        canonicalUrl="https://code-a-nova.online/services"
      />
      <div className="pt-16">
        <ServicesOverview />
      </div>
      <CTA />
    </MainLayout>
  );
};

export default Services;
