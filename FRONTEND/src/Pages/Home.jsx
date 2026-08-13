import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MainLayout from '../layouts/MainLayout';
import Hero from '../sections/Hero';
import Stats from '../sections/Stats';
import ServicesOverview from '../sections/ServicesOverview';
import MockInterviewCTA from '../sections/MockInterviewCTA';
import ResumeBuilderCTA from '../sections/ResumeBuilderCTA';
import JobPortalCTA from '../sections/JobPortalCTA';
import ProblemSolution from '../sections/ProblemSolution';
import IndustriesServed from '../sections/IndustriesServed';
import PortfolioPreview from '../sections/PortfolioPreview';
import WhyWebsite from '../sections/WhyWebsite';
import Process from '../sections/Process';
import Partners from '../sections/Partners';
import Testimonials from '../sections/Testimonials';
import CTA, { InternshipCTA } from '../sections/CTA';

const Home = () => {
  const [showJobPortal, setShowJobPortal] = useState(true);

  useEffect(() => {
    const fetchSetting = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/settings/job-portal`);
        setShowJobPortal(res.data.jobPortalEnabled);
      } catch (error) {
        console.error('Failed to fetch job portal setting', error);
      }
    };
    fetchSetting();
  }, []);

  return (
    <MainLayout>
      <Hero />
      <Partners />
      <ProblemSolution />
      <ServicesOverview />
      <Stats />
      <MockInterviewCTA />
      <ResumeBuilderCTA />
      {showJobPortal && <JobPortalCTA />}
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
