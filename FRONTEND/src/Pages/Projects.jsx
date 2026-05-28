import React from 'react';
import MainLayout from '../layouts/MainLayout';
import CTA from '../sections/CTA';
import ScrollStack, { ScrollStackItem } from '../Components/ScrollStack';
import GlitchTitle from '../Components/GlitchTitle';
import GlassSurface from '../Components/GlassSurface';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const projects = [
  {
    title: 'The Golden Spoon',
    category: 'Restaurant & Ordering',
    tech: ['Menu Sync', 'Reservations'],
    borderColor: 'border-amber-100/60',
    titleColor: 'text-zinc-900',
    categoryColor: 'text-brand-amber',
    tagColor: 'text-amber-700 bg-amber-50 border border-amber-100/30',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800',
    results: '+45% Online Orders',
    desc: 'Crafting a premium dining storefront with smart menu synchronizations, reservation dashboards, and local SEO which delivered a 45% increase in high-intent customer orders.'
  },
  {
    title: 'Luxe Aesthetics Clinic',
    category: 'Healthcare & Wellness',
    tech: ['Patient Portal', 'SEO'],
    borderColor: 'border-emerald-100/60',
    titleColor: 'text-zinc-900',
    categoryColor: 'text-brand-emerald',
    tagColor: 'text-brand-emerald bg-emerald-50 border border-emerald-100/30',
    image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=800',
    results: 'Fully Booked Calendar',
    desc: 'Engineered a high-fidelity patient consultation portal, fully compliance-ready schemas, and local discovery funnels resulting in a fully booked appointment catalog.'
  },
  {
    title: 'Iron Core Fitness',
    category: 'Gym & Subscriptions',
    tech: ['Member Portal', 'Payments'],
    borderColor: 'border-zinc-200/60',
    titleColor: 'text-zinc-900',
    categoryColor: 'text-zinc-500',
    tagColor: 'text-zinc-600 bg-zinc-100 border border-zinc-200/30',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800',
    results: '3x Member Signups',
    desc: 'Built a customized member billing dashboard, subscription cycles manager, and customized trainer showcase systems which achieved a 3x lift in member conversions.'
  }
];

const Projects = () => {
  return (
    <MainLayout>
      {/* Scroll Stacking Showcase */}
      <section className="pt-32 pb-20 bg-[#F9FBF9] relative overflow-hidden">
        {/* Soft background glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] bg-brand-emerald/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <GlitchTitle
              text="Stunning Digital Assets"
              highlight="Assets"
              className="text-3xl md:text-5xl font-black text-zinc-950 mb-4 tracking-tight"
              tag="h1"
            />
            <p className="text-zinc-500 font-medium text-lg max-w-xl mx-auto mt-4">
              Explore some of the award-winning websites and SaaS tools we've engineered for our growth-focused partners.
            </p>
          </div>

          <ScrollStack useWindowScroll={true} itemDistance={50} itemScale={0.02} itemStackDistance={25}>
            {projects.map((proj, idx) => (
              <ScrollStackItem key={idx}>
                <GlassSurface
                  borderRadius={32}
                  backgroundOpacity={0.02}
                  saturation={1.2}
                  displace={0}
                  distortionScale={-70}
                  className="w-full h-full border border-zinc-150 shadow-xl shadow-zinc-200/30 p-8 md:p-12 backdrop-blur-3xl"
                >
                  <div className="flex flex-col md:flex-row justify-between items-stretch gap-8 h-full w-full">
                    {/* Left Metadata */}
                    <div className="flex flex-col justify-between py-2 max-w-md">
                      <div>
                        <div className="flex flex-col items-start gap-1.5 mb-4">
                          <span className={`${proj.categoryColor} text-xs font-bold tracking-widest uppercase font-mono`}>
                            {proj.category}
                          </span>
                          <div className="inline-flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100/50 text-brand-emerald font-mono shadow-sm">
                            🔥 {proj.results}
                          </div>
                        </div>
                        <h3 className="text-2xl md:text-3xl font-black text-zinc-950 mb-3 tracking-tight leading-tight">
                          {proj.title}
                        </h3>
                        <p className="text-zinc-500 text-sm font-medium leading-relaxed mb-4">
                          {proj.desc}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-auto">
                        {proj.tech.map((t, i) => (
                          <span key={i} className={`text-[10px] md:text-[11px] font-bold ${proj.tagColor} px-2.5 py-1 rounded-lg font-mono shadow-sm`}>
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Right Image */}
                    <div className="rounded-[1.5rem] overflow-hidden shadow-[0_15px_30px_rgba(0,0,0,0.04)] border border-zinc-150 relative shrink-0 w-full md:w-80 h-48 md:h-64 self-center group">
                      <img 
                        src={proj.image} 
                        alt={proj.title} 
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                  </div>
                </GlassSurface>
              </ScrollStackItem>
            ))}
          </ScrollStack>
        </div>
      </section>

      <CTA />
    </MainLayout>
  );
};

export default Projects;
