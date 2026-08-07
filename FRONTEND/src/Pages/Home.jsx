import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MainLayout from '../layouts/MainLayout';
import Hero from '../sections/Hero';
import Stats from '../sections/Stats';
import RecentJobs from '../sections/RecentJobs';
import MockInterviewCTA from '../sections/MockInterviewCTA';
import ResumeBuilderCTA from '../sections/ResumeBuilderCTA';
import JobPortalCTA from '../sections/JobPortalCTA';
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
      <Stats />
      {showJobPortal && <RecentJobs />}
      <MockInterviewCTA />
      <ResumeBuilderCTA />
      {showJobPortal && <JobPortalCTA />}
      <Testimonials />
      <InternshipCTA />
    </MainLayout>
  );
};

export default Home;
