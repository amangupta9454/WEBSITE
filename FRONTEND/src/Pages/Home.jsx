import React from 'react';
import MainLayout from '../layouts/MainLayout';
import Hero from '../sections/Hero';
import Stats from '../sections/Stats';
import ServicesOverview from '../sections/ServicesOverview';
import MockInterviewCTA from '../sections/MockInterviewCTA';
import ProblemSolution from '../sections/ProblemSolution';
import IndustriesServed from '../sections/IndustriesServed';
import PortfolioPreview from '../sections/PortfolioPreview';
import WhyWebsite from '../sections/WhyWebsite';
import Process from '../sections/Process';
import Testimonials from '../sections/Testimonials';
import CTA, { InternshipCTA } from '../sections/CTA';

const Home = () => {
  return (
    <MainLayout>
      <Hero />
      <Stats />
      <ProblemSolution />
      <ServicesOverview />
      <MockInterviewCTA />
      <IndustriesServed />
      <PortfolioPreview />
      <WhyWebsite />
      <Process />
      <Testimonials />
      <CTA />
      <InternshipCTA />
    </MainLayout>
  );
};

export default Home;
