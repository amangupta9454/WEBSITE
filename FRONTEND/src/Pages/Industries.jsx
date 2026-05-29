import React from 'react';
import MainLayout from '../layouts/MainLayout';
import { motion } from 'framer-motion';
import { fadeUp } from '../animations/variants';
import IndustriesServed from '../sections/IndustriesServed';
import CTA from '../sections/CTA';
import ScrollStack, { ScrollStackItem } from '../Components/ScrollStack';
import GlitchTitle from '../Components/GlitchTitle';

const Industries = () => {
  return (
    <MainLayout>
      <div className="pt-16">
        <IndustriesServed />
      </div>

      {/* Stacking Industry Insights */}
      <section className="py-20 bg-[#F9FBF9] border-t border-zinc-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-[400px] bg-brand-emerald/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <GlitchTitle 
              text="Our Growth Framework"
              highlight="Framework"
              className="text-3xl md:text-5xl font-black text-zinc-950 mb-4 tracking-tight"
              tag="h2"
            />
            <p className="text-zinc-500 font-medium text-lg max-w-xl mx-auto mt-4">
              See how we engineer scalability, automation, and trust across our stacking delivery modules.
            </p>
          </div>

          <ScrollStack useWindowScroll={true} itemDistance={40} itemScale={0.02} itemStackDistance={20}>
            <ScrollStackItem>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 h-full">
                <div className="space-y-3 max-w-lg">
                  <span className="text-xs uppercase tracking-widest font-mono font-bold text-brand-emerald">Module 01</span>
                  <h3 className="text-2xl font-bold text-zinc-950 tracking-tight">Hospitality & Retail Growth</h3>
                  <p className="text-zinc-500 text-sm font-medium leading-relaxed">
                    We build premium online menu systems, ordering funnels, and local discovery sheets that have boosted footfall and online ordering revenue by up to 250% for restaurants, cafes, and boutiques.
                  </p>
                </div>
                <div className="rounded-2xl bg-emerald-50 border border-emerald-100/50 p-6 flex flex-col items-center justify-center text-center shrink-0 w-full md:w-44 shadow-sm">
                  <span className="text-3xl font-black text-brand-emerald">+250%</span>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono mt-1">Revenue Boost</span>
                </div>
              </div>
            </ScrollStackItem>

            <ScrollStackItem>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 h-full">
                <div className="space-y-3 max-w-lg">
                  <span className="text-xs uppercase tracking-widest font-mono font-bold text-brand-emerald">Module 02</span>
                  <h3 className="text-2xl font-bold text-zinc-950 tracking-tight">Wellness & Gym Memberships</h3>
                  <p className="text-zinc-500 text-sm font-medium leading-relaxed">
                    Converting local trial session inquiries into high-ticket memberships through streamlined class booking flows, customized trainer bios, and automated SMS reminders.
                  </p>
                </div>
                <div className="rounded-2xl bg-emerald-50 border border-emerald-100/50 p-6 flex flex-col items-center justify-center text-center shrink-0 w-full md:w-44 shadow-sm">
                  <span className="text-3xl font-black text-brand-emerald">70%</span>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono mt-1">Less Manual Work</span>
                </div>
              </div>
            </ScrollStackItem>

            <ScrollStackItem>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 h-full">
                <div className="space-y-3 max-w-lg">
                  <span className="text-xs uppercase tracking-widest font-mono font-bold text-brand-emerald">Module 03</span>
                  <h3 className="text-2xl font-bold text-zinc-950 tracking-tight">Healthcare & Clinic Trust</h3>
                  <p className="text-zinc-500 text-sm font-medium leading-relaxed">
                    Creating professional patient onboarding, online appointment schedulers, and evolution charts that build profound local authority and simplify medical workflows.
                  </p>
                </div>
                <div className="rounded-2xl bg-emerald-50 border border-emerald-100/50 p-6 flex flex-col items-center justify-center text-center shrink-0 w-full md:w-44 shadow-sm">
                  <span className="text-3xl font-black text-brand-emerald">99%</span>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono mt-1">Satisfaction Rate</span>
                </div>
              </div>
            </ScrollStackItem>

            <ScrollStackItem>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 h-full">
                <div className="space-y-3 max-w-lg">
                  <span className="text-xs uppercase tracking-widest font-mono font-bold text-brand-emerald">Module 04</span>
                  <h3 className="text-2xl font-bold text-zinc-950 tracking-tight">Colleges & Schools Funnels</h3>
                  <p className="text-zinc-500 text-sm font-medium leading-relaxed">
                    Designing interactive placements dashboards, online admissions inquiries, and alumni showcase sections that attract quality students and elevate regional prestige.
                  </p>
                </div>
                <div className="rounded-2xl bg-emerald-50 border border-emerald-100/50 p-6 flex flex-col items-center justify-center text-center shrink-0 w-full md:w-44 shadow-sm">
                  <span className="text-3xl font-black text-brand-emerald">5X</span>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono mt-1">Enrollment Leads</span>
                </div>
              </div>
            </ScrollStackItem>
          </ScrollStack>
        </div>
      </section>
      
      <CTA />
    </MainLayout>
  );
};

export default Industries;
