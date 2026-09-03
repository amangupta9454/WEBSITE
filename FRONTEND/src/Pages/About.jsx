import React, { useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import SEO from '../Components/SEO';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from '../animations/variants';
import WhyChooseUs from '../sections/WhyChooseUs';
import { Link } from 'react-router-dom';
import { 
  Target, 
  Lightbulb, 
  Shield, 
  Zap, 
  CheckCircle2, 
  Code2, 
  Cpu, 
  Layers, 
  Users, 
  Award, 
  ArrowRight, 
  Sparkles, 
  Compass, 
  Rocket,
  ChevronRight
} from 'lucide-react';

const stats = [
  { number: "50+", label: "Enterprise Projects", desc: "Delivered on schedule" },
  { number: "10,000+", label: "Talent Ecosystem", desc: "Students & Interns impacted" },
  { number: "99.9%", label: "System Uptime SLA", desc: "Enterprise cloud hosting" },
  { number: "5X", label: "Average ROI Growth", desc: "For partnering businesses" },
];

const pillars = [
  {
    icon: <Code2 className="text-blue-600" size={26} />,
    title: "Full-Stack Web & Cloud Architecture",
    description: "Architecting high-concurrency web apps, microservices, and mobile platforms using React, Node.js, Next.js, and modern cloud infrastructures.",
    tags: ["React & Next.js", "Node.js & MongoDB", "Docker & Cloud", "REST & GraphQL"],
    badge: "Engineering"
  },
  {
    icon: <Cpu className="text-purple-600" size={26} />,
    title: "AI Workflows & Automation",
    description: "Integrating intelligent LLM agents, workflow automations, predictive analytics, and conversational intelligence directly into core business operations.",
    tags: ["Custom LLM Agents", "Process Automation", "NLP & Vision", "Data Pipelines"],
    badge: "Artificial Intelligence"
  },
  {
    icon: <Layers className="text-pink-600" size={26} />,
    title: "Custom Enterprise ERPs & SaaS",
    description: "Building end-to-end bespoke software—from dynamic inventory trackers to CRM portals and billing engines tailored specifically to your business rules.",
    tags: ["Modular ERPs", "Multi-Tenant SaaS", "Role-Based Access", "Payment Gateways"],
    badge: "Enterprise Software"
  },
  {
    icon: <Users className="text-emerald-600" size={26} />,
    title: "Talent Incubation & Mentorship",
    description: "Nurturing top-tier student developers, designers, and campus ambassadors through rigorous industry-grade projects and structured mentorship.",
    tags: ["Hands-On Projects", "Verified Certificates", "Skill Assessments", "Career Acceleration"],
    badge: "Ecosystem"
  }
];

const processSteps = [
  {
    step: "01",
    title: "Strategic Discovery & Blueprint",
    desc: "We analyze your operational bottlenecks, business objectives, and target audience to design a comprehensive technical roadmap with zero ambiguity.",
    icon: <Compass className="text-blue-600" size={24} />
  },
  {
    step: "02",
    title: "High-Fidelity Architecture & UX",
    desc: "We prototype conversion-driven, pixel-perfect user experiences in Figma while designing resilient, scalable database schemas and API specifications.",
    icon: <Lightbulb className="text-purple-600" size={24} />
  },
  {
    step: "03",
    title: "Agile Sprints & Test-Driven Code",
    desc: "Our engineering squad develops modular, maintainable code through rapid sprints, automated security checks, code reviews, and end-to-end testing.",
    icon: <Zap className="text-amber-600" size={24} />
  },
  {
    step: "04",
    title: "Production Launch & 24/7 Scaling",
    desc: "We deploy to optimized cloud environments with CI/CD automation, speed optimizations, real-time analytics, and ongoing technical support.",
    icon: <Rocket className="text-emerald-600" size={24} />
  }
];

const values = [
  {
    icon: <Target className="text-blue-600" size={28} />,
    title: "Outcome-Driven Execution",
    desc: "Code is a tool; real business growth is the objective. We measure success strictly by operational speed, engagement, and revenue ROI.",
    bg: "bg-blue-50",
    border: "border-blue-100",
    hoverShadow: "hover:shadow-blue-500/10"
  },
  {
    icon: <Lightbulb className="text-purple-600" size={28} />,
    title: "Innovation Without Bloat",
    desc: "We leverage modern frameworks and AI thoughtfully—engineering clean, lightweight, future-proof systems rather than bloated templates.",
    bg: "bg-purple-50",
    border: "border-purple-100",
    hoverShadow: "hover:shadow-purple-500/10"
  },
  {
    icon: <Shield className="text-emerald-600" size={28} />,
    title: "Ironclad Security & Quality",
    desc: "Data privacy and stability come first. From bank-grade encryption to automated testing, we guard your data with strict standards.",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    hoverShadow: "hover:shadow-emerald-500/10"
  },
  {
    icon: <Award className="text-orange-600" size={28} />,
    title: "Radical Transparency",
    desc: "Clear timelines, predictable milestone delivery, and constant communication. No hidden fees, no ghosting, and no surprises.",
    bg: "bg-orange-50",
    border: "border-orange-100",
    hoverShadow: "hover:shadow-orange-500/10"
  }
];

const milestones = [
  {
    period: "Jan 2026",
    badge: "Foundation",
    title: "Genesis & Company Inception",
    desc: "Code-A-Nova was officially established with a mission to deliver high-performance enterprise software while bridging the academia-industry gap through practical, hands-on developer training."
  },
  {
    period: "Mar 2026",
    badge: "Delivery",
    title: "First Enterprise Deployments & Incubation Cohort",
    desc: "Delivered our initial suite of custom web apps and bespoke portals. Successfully onboarded our inaugural incubation cohort of student developers across Full-Stack, Backend, and UI/UX."
  },
  {
    period: "May 2026",
    badge: "Product",
    title: "Automated Task & Evaluation Architecture",
    desc: "Engineered proprietary task distribution pipelines, synergy point grading engines, and real-time review systems to streamline project management and skill attribution at scale."
  },
  {
    period: "Jul 2026",
    badge: "Scale",
    title: "MSME Recognition & National Campus Network",
    desc: "Formally registered under the MSME initiative. Scaled our digital community to 10,000+ participating students, verified certificate holders, and active campus ambassadors across India."
  },
  {
    period: "Sep 2026 & Beyond",
    badge: "Innovation",
    title: "AI Ecosystem & Next-Gen Enterprise Platforms",
    desc: "Rolling out cutting-edge AI assessment terminals, automated code evaluators, and custom cloud ERP systems to power the next wave of high-growth digital businesses."
  }
];

const About = () => {
  const [activeMilestone, setActiveMilestone] = useState(0);

  return (
    <MainLayout>
      <SEO 
        title="About Code-A-Nova | Technology, AI Solutions & Enterprise Engineering"
        description="Discover Code-A-Nova: our mission, core values, full-stack software capabilities, and our dual-model empowering modern businesses and tech talent."
        canonicalUrl="https://code-a-nova.online/about"
      />

      {/* Hero Section */}
      <div className="pt-32 pb-20 md:pt-40 md:pb-28 bg-[#FAFAFA] relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-gradient-to-r from-blue-100/60 via-indigo-100/40 to-purple-100/60 blur-[130px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 text-center">
          <motion.div 
            initial="hidden" 
            animate="visible" 
            variants={fadeUp} 
            className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 font-black text-xs uppercase tracking-wider shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Empowering Modern Businesses & Tech Talent
          </motion.div>

          <motion.h1 
            initial="hidden" 
            animate="visible" 
            variants={fadeUp}
            className="text-4xl sm:text-5xl md:text-7xl font-black mb-6 text-gray-900 tracking-tight leading-[1.1]"
          >
            Engineering the Digital Future <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
              With Precision & Passion
            </span>
          </motion.h1>

          <motion.p 
            initial="hidden" 
            animate="visible" 
            variants={fadeUp} 
            transition={{ delay: 0.1 }}
            className="text-gray-600 max-w-3xl mx-auto text-base sm:text-lg md:text-xl mb-12 font-medium leading-relaxed"
          >
            Code-A-Nova is a high-growth technology company built to solve complex software problems. We craft cutting-edge web platforms, enterprise ERP systems, and AI automations, while nurturing the next generation of engineers through verified hands-on incubation.
          </motion.p>

          {/* Stats Bar */}
          <motion.div 
            initial="hidden" 
            animate="visible" 
            variants={staggerContainer}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40"
          >
            {stats.map((stat, i) => (
              <motion.div key={i} variants={fadeUp} className="text-center p-2">
                <h3 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-1 tracking-tight">
                  {stat.number}
                </h3>
                <p className="text-xs sm:text-sm font-bold text-gray-800">{stat.label}</p>
                <span className="text-[11px] text-gray-400 font-medium block mt-0.5">{stat.desc}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Our Story & Dual Mission */}
      <section className="py-20 md:py-28 bg-white relative">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Narrative */}
            <motion.div 
              initial="hidden" 
              whileInView="visible" 
              viewport={{ once: true }} 
              variants={staggerContainer}
              className="lg:col-span-7"
            >
              <motion.div variants={fadeUp} className="inline-block mb-3 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-xs uppercase tracking-wider">
                Our Story & Vision
              </motion.div>
              <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-6 leading-tight">
                We bridge the divide between <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  ambitious ideas and scalable reality.
                </span>
              </motion.h2>
              <motion.p variants={fadeUp} className="text-gray-600 font-medium text-base sm:text-lg leading-relaxed mb-6">
                Most agencies simply deliver static templates, hand over credentials, and disappear. At Code-A-Nova, we recognized that businesses don’t need more code—they need <strong className="text-gray-900 font-bold">growth engines</strong> that work flawlessly under load.
              </motion.p>
              <motion.p variants={fadeUp} className="text-gray-600 font-medium text-base sm:text-lg leading-relaxed mb-8">
                Simultaneously, we founded our talent development program to give ambitious tech students what traditional degrees lack: <strong className="text-gray-900 font-bold">real accountability, production deployments, and direct mentorship</strong> on real client projects.
              </motion.p>

              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  'Enterprise-grade code quality',
                  'Strict NDA & IP security',
                  'Dedicated project managers',
                  'Rapid agile turnaround',
                  'Transparent milestone pricing',
                  '24/7 post-launch support'
                ].map((item, i) => (
                  <motion.div key={i} variants={fadeUp} className="flex items-center gap-2.5">
                    <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />
                    <span className="text-gray-800 font-bold text-sm">{item}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right Card / Visual Showcase */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }} 
              whileInView={{ opacity: 1, x: 0 }} 
              viewport={{ once: true }}
              className="lg:col-span-5"
            >
              <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-950 p-8 sm:p-10 text-white shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
                
                <div className="relative z-10 space-y-6">
                  <div className="inline-flex p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                    <Shield className="w-8 h-8 text-blue-400" />
                  </div>

                  <div>
                    <h3 className="text-2xl font-black mb-2">The Code-A-Nova Pledge</h3>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      We never compromise on speed, clean architecture, or confidentiality. Every project is built as if our own company's reputation depended on it.
                    </p>
                  </div>

                  <div className="border-t border-white/10 pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-bold uppercase">Government Compliance</span>
                      <span className="text-xs font-black bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full border border-blue-400/20">MSME Registered</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-bold uppercase">Standard Operating Model</span>
                      <span className="text-xs font-black bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full border border-purple-400/20">Agile CI/CD Sprints</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-bold uppercase">Talent Pool Evaluation</span>
                      <span className="text-xs font-black bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-400/20">Skill-Vetted Engineers</span>
                    </div>
                  </div>

                  <Link 
                    to="/contact"
                    className="mt-4 w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-all cursor-pointer"
                  >
                    <span>Talk to Our Solutions Architect</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Core Capabilities / Pillars */}
      <section className="py-20 md:py-28 bg-[#FAFAFA] border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <span className="inline-block mb-3 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 font-bold text-xs uppercase tracking-wider">
              What We Do
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
              Our Core Technical Pillars
            </h2>
            <p className="text-gray-500 font-medium text-base sm:text-lg">
              End-to-end technical expertise designed to take your venture from concept to market dominance.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {pillars.map((pillar, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:border-gray-200 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="p-3.5 bg-slate-50 group-hover:bg-blue-50 rounded-2xl transition-colors border border-gray-100">
                      {pillar.icon}
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                      {pillar.badge}
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                    {pillar.title}
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-6 font-normal">
                    {pillar.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-50 flex flex-wrap gap-2">
                  {pillar.tags.map((tag, tIdx) => (
                    <span key={tIdx} className="text-xs font-semibold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Engineering Process */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <span className="inline-block mb-3 px-3.5 py-1 rounded-full bg-purple-50 border border-purple-100 text-purple-700 font-bold text-xs uppercase tracking-wider">
              The Code-A-Nova Lifecycle
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
              How We Deliver Excellence
            </h2>
            <p className="text-gray-500 font-medium text-base sm:text-lg">
              A battle-tested 4-step pipeline ensuring transparent execution, zero bloat, and timely milestones.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {processSteps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-slate-50/70 p-6 sm:p-7 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-lg transition-all relative overflow-hidden group"
              >
                <div className="text-5xl font-black text-slate-200 group-hover:text-blue-100 transition-colors mb-4">
                  {step.step}
                </div>
                <div className="mb-4 inline-flex p-3 bg-white rounded-2xl shadow-2xs border border-slate-100">
                  {step.icon}
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 font-medium leading-relaxed">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Journey & Milestones */}
      <section className="py-20 md:py-28 bg-[#FAFAFA] border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="inline-block mb-3 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold text-xs uppercase tracking-wider">
              Our Journey
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
              Milestones Along the Way
            </h2>
            <p className="text-gray-500 font-medium text-base sm:text-lg">
              From a vision to build better software to powering businesses nationwide.
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-4">
            {milestones.map((m, idx) => (
              <div 
                key={idx}
                onClick={() => setActiveMilestone(idx)}
                className={`p-6 sm:p-8 rounded-3xl border transition-all cursor-pointer ${
                  activeMilestone === idx 
                    ? 'bg-white border-blue-200 shadow-xl shadow-blue-500/5 ring-2 ring-blue-100' 
                    : 'bg-white/60 hover:bg-white border-gray-100'
                }`}
              >
                <div className="flex items-start sm:items-center justify-between gap-4 mb-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`px-3 py-1 rounded-xl text-xs font-black ${
                      activeMilestone === idx ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {m.period}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-md">
                      {m.badge}
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-gray-900">{m.title}</h3>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${activeMilestone === idx ? 'rotate-90 text-blue-600' : ''}`} />
                </div>
                <p className="text-sm text-gray-600 font-medium leading-relaxed mt-2 pl-0 sm:pl-20">
                  {m.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 md:py-28 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4">Our Core Values</h2>
            <p className="text-gray-500 font-medium text-lg">The non-negotiable principles that guide every single line of code and partnership.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {values.map((val, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`group bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-2xl ${val.hoverShadow} hover:-translate-y-2 transition-all duration-500 relative overflow-hidden`}
              >
                <div className={`absolute -top-12 -right-12 w-32 h-32 ${val.bg} rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                <div className={`relative z-10 w-12 h-12 md:w-14 md:h-14 ${val.bg} rounded-2xl flex items-center justify-center mb-6 border ${val.border} shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                  {val.icon}
                </div>
                <h3 className="relative z-10 text-lg md:text-xl font-bold text-gray-900 mb-2">{val.title}</h3>
                <p className="relative z-10 text-gray-500 font-medium text-xs sm:text-sm leading-relaxed">{val.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <WhyChooseUs />

      {/* Bottom CTA Banner */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl sm:text-5xl font-black mb-6 tracking-tight">
            Ready to Build Your Next Breakthrough?
          </h2>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto mb-8 font-medium">
            Whether you need an enterprise web application, custom AI agents, or an end-to-end ERP system, our engineering squad is ready.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/contact"
              className="w-full sm:w-auto px-8 py-4 bg-white text-gray-950 font-black rounded-full hover:bg-blue-50 transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Get Your Free Project Proposal</span>
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/services"
              className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-full transition-all flex items-center justify-center cursor-pointer"
            >
              Explore Our Services
            </Link>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default About;
