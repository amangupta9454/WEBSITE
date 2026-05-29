import React from 'react';
import MainLayout from '../layouts/MainLayout';
import Hero from '../sections/Hero';
import Stats from '../sections/Stats';
import ServicesOverview from '../sections/ServicesOverview';
import ProblemSolution from '../sections/ProblemSolution';
import IndustriesServed from '../sections/IndustriesServed';
import PortfolioPreview from '../sections/PortfolioPreview';
import WhyWebsite from '../sections/WhyWebsite';
import Process from '../sections/Process';
import Testimonials from '../sections/Testimonials';
import CTA, { InternshipCTA } from '../sections/CTA';
import MagicBento from '../Components/MagicBento';
import GlitchTitle from '../Components/GlitchTitle';

const Home = () => {
  return (
    <MainLayout>
      <Hero />
      <Stats />
      <ProblemSolution />
      <ServicesOverview />
      <IndustriesServed />
      <PortfolioPreview />
      <WhyWebsite />
      
      {/* Premium Engineering Bento Section */}
      <section className="py-16 md:py-28 relative overflow-hidden bg-white/80 backdrop-blur-[2px] border-t border-b border-zinc-100">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-96 bg-brand-emerald/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <span className="inline-block py-1.5 px-4 rounded-full bg-emerald-50 border border-emerald-100 text-brand-emerald text-xs font-mono font-bold tracking-widest uppercase mb-4 shadow-sm">
              Engineering Core
            </span>
            <GlitchTitle
              text="Engineered for Exponential Scale"
              highlight="Scale"
              className="text-3xl md:text-5xl font-black text-zinc-950 tracking-tight leading-tight"
              tag="h2"
            />
            <p className="text-zinc-500 font-medium text-lg mt-4 leading-relaxed">
              Our backend architectures, secure routing protocols, and custom caching systems are built to withstand high-volume demand with absolute trust.
            </p>
          </div>
          <MagicBento 
            textAutoHide={true}
            enableStars={true}
            enableSpotlight={true}
            enableBorderGlow={true}
            enableTilt={true}
            enableMagnetism={true}
            clickEffect={true}
            spotlightRadius={320}
            particleCount={10}
            glowColor="16, 185, 129"
          />
        </div>
      </section>

      <Process />
      <Testimonials />
      <CTA />
      <InternshipCTA />
    </MainLayout>
  );
};

export default Home;
