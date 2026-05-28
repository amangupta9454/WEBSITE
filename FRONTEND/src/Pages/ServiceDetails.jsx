import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Monitor, ShoppingCart, CalendarCheck, LayoutDashboard, Cpu, Database, 
  CheckCircle, ArrowLeft, Zap, Target, BarChart, ShieldCheck, 
  Trophy, Users, Clock, ChevronDown, ChevronUp
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import CTA from '../sections/CTA';

// Enhanced Data for each service
const serviceDetailsData = {
  'business-websites': {
    title: 'Business Websites',
    subtitle: 'Premium, fast, and modern websites that convert visitors into customers.',
    icon: <Monitor className="w-12 h-12 md:w-16 md:h-16 text-brand-emerald" />,
    gradient: 'from-brand-emerald to-brand-mint',
    description: 'We build high-performance business websites tailored for your specific industry. Whether you run a restaurant, clinic, gym, or local shop, our websites are designed to instantly build trust and establish a premium online presence.',
    features: [
      'Responsive Mobile-First Design',
      'High-Speed Loading & SEO Optimized',
      'Premium Custom UI/UX',
      'Integration with Google Analytics & Maps',
      'Secure Hosting & SSL Certificate',
      'Ongoing Maintenance & Support'
    ],
    benefits: [
      { title: 'Increased Credibility', desc: 'A professional website builds instant trust with your potential customers.' },
      { title: '24/7 Online Presence', desc: 'Your business never sleeps. Customers can find you at any time.' },
      { title: 'Better Lead Generation', desc: 'Optimized call-to-actions to capture visitor information effectively.' }
    ],
    process: [
      { title: 'Discovery', desc: 'Understanding your brand, target audience, and website goals.' },
      { title: 'Wireframing', desc: 'Creating the structural layout and user flow of the site.' },
      { title: 'Design & Build', desc: 'Developing a responsive, high-performing website.' },
      { title: 'Launch', desc: 'Final testing, SEO setup, and going live.' }
    ],
    results: [
      { metric: '200%', label: 'Increase in Online Traffic' },
      { metric: '3x', label: 'More Customer Inquiries' },
      { metric: '< 2s', label: 'Average Page Load Time' }
    ],
    faqs: [
      { q: 'How long does it take to build a website?', a: 'Typically, a standard business website takes 2-4 weeks from discovery to launch, depending on the complexity.' },
      { q: 'Will my website be mobile-friendly?', a: 'Absolutely. We use a mobile-first approach ensuring your website looks stunning on all devices.' },
      { q: 'Do you provide website maintenance?', a: 'Yes! We offer monthly maintenance packages to ensure your site is always updated, secure, and running smoothly.' }
    ]
  },
  'ecommerce-stores': {
    title: 'E-commerce Stores',
    subtitle: 'Powerful online stores with seamless checkout and beautiful product displays.',
    icon: <ShoppingCart className="w-12 h-12 md:w-16 md:h-16 text-brand-mint" />,
    gradient: 'from-brand-mint to-brand-emerald',
    description: 'Start selling your products online with a robust e-commerce platform. We create customized online stores with seamless checkout, inventory management, and stunning product showcases that drive sales.',
    features: [
      'Secure Payment Gateway Integration',
      'Inventory & Order Management',
      'Customer Account Management',
      'Discount & Coupon Code Engine',
      'Mobile-Optimized Shopping Experience',
      'Abandoned Cart Recovery'
    ],
    benefits: [
      { title: 'Global Reach', desc: 'Sell your products to anyone, anywhere in the world.' },
      { title: 'Higher Conversions', desc: 'Frictionless checkout processes designed to maximize sales.' },
      { title: 'Scalability', desc: 'Easily add thousands of products as your business grows.' }
    ],
    process: [
      { title: 'Strategy', desc: 'Defining your product categories, shipping, and payment methods.' },
      { title: 'Store Setup', desc: 'Configuring the e-commerce engine and adding products.' },
      { title: 'Custom Design', desc: 'Designing a beautiful storefront optimized for sales.' },
      { title: 'Testing & Launch', desc: 'End-to-end testing of the checkout process before going live.' }
    ],
    results: [
      { metric: '150%', label: 'Boost in Online Sales' },
      { metric: '45%', label: 'Reduction in Cart Abandonment' },
      { metric: '10k+', label: 'Products Handled Seamlessly' }
    ],
    faqs: [
      { q: 'Which payment gateways do you integrate?', a: 'We integrate with all major payment gateways including Stripe, PayPal, Razorpay, and more.' },
      { q: 'Can I manage my own inventory?', a: 'Yes, we provide a user-friendly dashboard where you can easily add, edit, or remove products and track inventory.' },
      { q: 'Are the stores SEO optimized?', a: 'Yes, every product page and category is structured to rank well on search engines.' }
    ]
  },
  'booking-systems': {
    title: 'Booking Systems',
    subtitle: 'Automated scheduling and appointment systems for seamless operations.',
    icon: <CalendarCheck className="w-12 h-12 md:w-16 md:h-16 text-brand-emerald" />,
    gradient: 'from-brand-emerald to-brand-mint',
    description: 'Perfect for salons, schools, colleges, and consultants. Eliminate back-and-forth emails and phone calls with our automated scheduling and appointment booking systems.',
    features: [
      'Real-Time Availability Calendar',
      'Automated SMS & Email Reminders',
      'Online Payment Collection',
      'Staff Scheduling & Management',
      'Custom Booking Forms',
      'Integration with Google Calendar'
    ],
    benefits: [
      { title: 'Reduce No-shows', desc: 'Automated reminders ensure your clients show up on time.' },
      { title: 'Save Time', desc: 'Free up your staff from managing phone bookings and manual entries.' },
      { title: 'Better Customer Experience', desc: 'Clients can book appointments 24/7 at their convenience.' }
    ],
    process: [
      { title: 'Workflow Analysis', desc: 'Understanding your scheduling rules and staff availability.' },
      { title: 'System Configuration', desc: 'Setting up services, calendars, and automated notifications.' },
      { title: 'Integration', desc: 'Connecting the system to your existing website and payment portals.' },
      { title: 'Onboarding', desc: 'Training your team on how to use the new dashboard.' }
    ],
    results: [
      { metric: '80%', label: 'Reduction in No-shows' },
      { metric: '500+', label: 'Hours Saved Monthly' },
      { metric: '24/7', label: 'Booking Availability' }
    ],
    faqs: [
      { q: 'Can clients pay when they book?', a: 'Yes, we can integrate secure payment processing so clients pay deposits or full amounts upfront.' },
      { q: 'Does it sync with my personal calendar?', a: 'Absolutely, we support 2-way sync with Google Calendar, Outlook, and iCal.' },
      { q: 'Can multiple staff members have their own schedules?', a: 'Yes, the system supports multi-staff management with individual availability settings.' }
    ]
  },
  'admin-dashboards': {
    title: 'Admin Dashboards',
    subtitle: 'Custom internal tools to track sales, manage customers, and monitor growth.',
    icon: <LayoutDashboard className="w-12 h-12 md:w-16 md:h-16 text-brand-mint" />,
    gradient: 'from-brand-mint to-brand-emerald',
    description: 'Bring all your business data into one centralized location. We develop custom internal tools and admin dashboards to help you track performance, manage your team, and make data-driven decisions.',
    features: [
      'Real-Time Analytics & Charts',
      'User Role & Permission Management',
      'Data Export (CSV/PDF)',
      'Custom Reporting Modules',
      'Third-party API Integrations',
      'High Security & Data Encryption'
    ],
    benefits: [
      { title: 'Data-Driven Decisions', desc: 'Get actionable insights from real-time data visualizations.' },
      { title: 'Streamlined Operations', desc: 'Manage your entire business workflow from a single screen.' },
      { title: 'Improved Accountability', desc: 'Track team performance and operational metrics accurately.' }
    ],
    process: [
      { title: 'Data Mapping', desc: 'Identifying the key metrics and data sources your business needs.' },
      { title: 'UI/UX Design', desc: 'Designing an intuitive dashboard layout for easy navigation.' },
      { title: 'Backend Development', desc: 'Building secure APIs to fetch and process your business data.' },
      { title: 'Deployment', desc: 'Launching the dashboard with strict role-based access control.' }
    ],
    results: [
      { metric: '10x', label: 'Faster Reporting' },
      { metric: '100%', label: 'Data Centralization' },
      { metric: 'Enterprise', label: 'Grade Security' }
    ],
    faqs: [
      { q: 'Is my business data secure?', a: 'We implement industry-standard encryption, secure authentication, and role-based access control to ensure your data is completely safe.' },
      { q: 'Can you integrate data from other software I use?', a: 'Yes, we can connect to most third-party tools via their APIs to pull data into your central dashboard.' },
      { q: 'Is the dashboard accessible on mobile?', a: 'Yes, all our dashboards are responsive, so you can monitor your business on the go.' }
    ]
  },
  'ai-automation': {
    title: 'AI Automation',
    subtitle: 'Save hundreds of hours by automating repetitive manual tasks.',
    icon: <Cpu className="w-12 h-12 md:w-16 md:h-16 text-brand-emerald" />,
    gradient: 'from-brand-emerald to-brand-mint',
    description: 'Leverage the power of Artificial Intelligence to automate your customer support, invoicing, lead generation, and other repetitive tasks. Work smarter, not harder.',
    features: [
      'AI Chatbots for Customer Support',
      'Automated Lead Qualification',
      'Smart Invoicing & Billing',
      'Workflow Automation (Zapier/Make)',
      'Natural Language Processing Tools',
      'Predictive Analytics'
    ],
    benefits: [
      { title: 'Massive Time Savings', desc: 'Automate repetitive tasks and focus on what truly matters.' },
      { title: 'Cost Reduction', desc: 'Reduce operational costs by replacing manual labor with intelligent software.' },
      { title: '24/7 Operations', desc: 'AI doesn\'t sleep. Keep your business running around the clock.' }
    ],
    process: [
      { title: 'Audit', desc: 'We identify bottlenecks and repetitive tasks in your current operations.' },
      { title: 'Tool Selection', desc: 'Choosing the right AI models and automation platforms.' },
      { title: 'Implementation', desc: 'Building custom workflows, bots, and AI agents.' },
      { title: 'Optimization', desc: 'Monitoring the AI performance and refining responses over time.' }
    ],
    results: [
      { metric: '40+', label: 'Hours Saved Weekly' },
      { metric: '95%', label: 'Faster Response Times' },
      { metric: '30%', label: 'Cost Reduction' }
    ],
    faqs: [
      { q: 'Will AI replace my team?', a: 'No, AI is designed to augment your team by handling repetitive tasks, allowing them to focus on high-value, creative work.' },
      { q: 'Can the chatbot understand my specific business?', a: 'Yes, we train the AI on your specific business data, FAQs, and documentation so it responds accurately.' },
      { q: 'What happens if the AI cannot answer a question?', a: 'The system can be configured to automatically hand over the conversation to a human agent seamlessly.' }
    ]
  },
  'erp-systems': {
    title: 'ERP Systems',
    subtitle: 'Comprehensive business management systems tailored to your workflow.',
    icon: <Database className="w-12 h-12 md:w-16 md:h-16 text-brand-mint" />,
    gradient: 'from-brand-mint to-brand-emerald',
    description: 'Enterprise Resource Planning systems designed specifically for your organizational needs. Connect your finance, HR, supply chain, and operations in one unified system.',
    features: [
      'Financial Management & Accounting',
      'Human Resources (HRMS) Module',
      'Supply Chain & Inventory Tracking',
      'Customer Relationship Management (CRM)',
      'Project Management Tools',
      'Cloud-Based Secure Infrastructure'
    ],
    benefits: [
      { title: 'Unified Operations', desc: 'Break down data silos and connect all departments seamlessly.' },
      { title: 'Enhanced Productivity', desc: 'Streamline complex processes and reduce administrative overhead.' },
      { title: 'Scalable Architecture', desc: 'A system that grows alongside your enterprise.' }
    ],
    process: [
      { title: 'Requirements Gathering', desc: 'Deep dive into every department to map out enterprise requirements.' },
      { title: 'Architecture Design', desc: 'Designing the database schemas and system integrations.' },
      { title: 'Iterative Development', desc: 'Building and releasing modules in phases for smooth transition.' },
      { title: 'Training & Rollout', desc: 'Comprehensive staff training and full enterprise deployment.' }
    ],
    results: [
      { metric: '360°', label: 'Business Visibility' },
      { metric: '40%', label: 'Efficiency Boost' },
      { metric: 'Seamless', label: 'Cross-Department Sync' }
    ],
    faqs: [
      { q: 'Is a custom ERP better than off-the-shelf software?', a: 'Custom ERPs are built around your exact workflow, meaning you don\'t have to change your business processes to fit the software.' },
      { q: 'How long does an ERP implementation take?', a: 'Depending on the modules required, an ERP system can take anywhere from 3 to 9 months to fully implement.' },
      { q: 'Can it be integrated with our old legacy systems?', a: 'Yes, we can build custom API bridges to migrate data from or sync with your existing legacy systems.' }
    ]
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const FAQItem = ({ faq }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-zinc-150 rounded-2xl mb-4 bg-white overflow-hidden hover:border-brand-emerald/20 transition-all shadow-sm">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-5 text-left font-bold text-zinc-900 focus:outline-none"
      >
        <span>{faq.q}</span>
        {isOpen ? <ChevronUp className="w-5 h-5 text-brand-emerald" /> : <ChevronDown className="w-5 h-5 text-zinc-400" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-5 pb-5 text-zinc-500 font-medium text-sm md:text-base leading-relaxed"
          >
            {faq.a}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ServiceDetails = () => {
  const { id } = useParams();
  const service = serviceDetailsData[id];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (!service) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-4xl font-bold text-zinc-900 mb-4 tracking-tight">Service Not Found</h1>
          <p className="text-zinc-500 mb-8 font-medium">The service you are looking for does not exist or has been removed.</p>
          <Link to="/services" className="px-6 py-3 bg-brand-emerald text-zinc-950 font-black rounded-full hover:bg-brand-mint transition shadow-lg shadow-brand-emerald/10 cursor-pointer">
            View All Services
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-[#F9FBF9]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-50/40 via-[#F9FBF9] to-[#F9FBF9] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <Link to="/services" className="inline-flex items-center gap-2 text-xs font-bold text-brand-emerald hover:text-brand-mint mb-8 transition-colors uppercase font-mono tracking-widest">
            <ArrowLeft className="w-4 h-4" /> Back to Services
          </Link>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
              <motion.div variants={fadeUp} className={`inline-flex p-4 rounded-2xl bg-emerald-50 border border-emerald-100/50 mb-6`}>
                <div className="p-3 bg-white rounded-xl shadow-sm">
                  {service.icon}
                </div>
              </motion.div>
              <motion.h1 variants={fadeUp} className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 tracking-tight text-zinc-950 leading-tight">
                {service.title}
              </motion.h1>
              <motion.p variants={fadeUp} className="text-xl text-zinc-500 mb-8 leading-relaxed font-medium">
                {service.subtitle}
              </motion.p>
              <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
                <Link to="/contact" className={`px-8 py-4 rounded-full text-zinc-950 font-black text-lg bg-gradient-to-r ${service.gradient} shadow-lg shadow-brand-emerald/10 hover:-translate-y-0.5 transition-all cursor-pointer`}>
                  Get Started Today
                </Link>
              </motion.div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-50 to-brand-emerald/5 rounded-[3rem] transform rotate-3 scale-105 -z-10"></div>
              <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl shadow-zinc-200/30 border border-zinc-150 relative z-10">
                <h3 className="text-2xl font-bold mb-6 text-zinc-900 tracking-tight">About this service</h3>
                <p className="text-zinc-500 leading-relaxed text-lg mb-8 font-medium">
                  {service.description}
                </p>
                
                <div className="space-y-4">
                  {service.features.slice(0, 3).map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                        <CheckCircle className="w-5 h-5 text-brand-emerald" />
                      </div>
                      <span className="font-bold text-zinc-800">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Results / Impact Section */}
      <section className="py-16 bg-[#F9FBF9] border-t border-zinc-100 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-zinc-950 tracking-tight">Results We Delivered</h2>
            <p className="text-zinc-500 max-w-2xl mx-auto font-medium">Real numbers and real impact we have generated for businesses through our {service.title.toLowerCase()}.</p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8 text-center"
          >
            {service.results.map((result, idx) => (
              <motion.div key={idx} variants={fadeUp} className="p-8 rounded-3xl bg-white border border-zinc-100 shadow-sm shadow-zinc-200/20">
                <Trophy className="w-10 h-10 text-brand-gold mx-auto mb-4" />
                <h3 className="text-5xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-brand-emerald to-brand-mint">
                  {result.metric}
                </h3>
                <p className="text-zinc-500 font-bold uppercase tracking-widest font-mono text-xs md:text-sm">{result.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features & Benefits */}
      <section className="py-20 bg-white border-t border-zinc-100">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-zinc-950 tracking-tight">Everything You Need</h2>
            <p className="text-zinc-500 max-w-2xl mx-auto text-lg font-medium">A comprehensive suite of features designed to maximize your business potential and streamline your operations.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
            {/* Features List */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <h3 className="text-2xl font-bold mb-8 flex items-center gap-2 text-zinc-900 tracking-tight">
                <Zap className="text-brand-gold" /> Core Features
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {service.features.map((feature, index) => (
                  <motion.div key={index} variants={fadeUp} className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 hover:border-brand-emerald/20 transition-all duration-300">
                    <CheckCircle className="w-5 h-5 text-brand-emerald mb-2" />
                    <h4 className="font-bold text-zinc-800 text-sm md:text-base">{feature}</h4>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Benefits List */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <h3 className="text-2xl font-bold mb-8 flex items-center gap-2 text-zinc-900 tracking-tight">
                <Target className="text-brand-emerald" /> Key Benefits
              </h3>
              <div className="space-y-6">
                {service.benefits.map((benefit, index) => (
                  <motion.div key={index} variants={fadeUp} className="flex gap-4 p-5 rounded-2xl bg-white border border-zinc-100 shadow-sm hover:shadow-md hover:border-brand-emerald/10 transition-all duration-300">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100/50 flex items-center justify-center shrink-0">
                      {index === 0 && <BarChart className="w-6 h-6 text-brand-emerald" />}
                      {index === 1 && <Zap className="w-6 h-6 text-brand-emerald" />}
                      {index === 2 && <ShieldCheck className="w-6 h-6 text-brand-emerald" />}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-zinc-900 mb-1 tracking-tight">{benefit.title}</h4>
                      <p className="text-zinc-500 text-sm md:text-base font-medium">{benefit.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Process Section */}
      <section className="py-20 bg-[#F9FBF9] border-t border-zinc-100">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-zinc-950 tracking-tight">Our Process</h2>
            <p className="text-zinc-500 max-w-2xl mx-auto text-lg font-medium">A simple, transparent, and proven workflow to ensure your project's success from day one.</p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            {service.process.map((step, idx) => (
              <motion.div 
                key={idx} 
                initial="hidden" 
                whileInView="visible" 
                viewport={{ once: true }} 
                variants={fadeUp}
                className="relative"
              >
                <div className="bg-white p-8 rounded-3xl border border-zinc-105 shadow-sm hover:shadow-xl hover:border-brand-emerald/20 transition-all duration-300 relative z-10 h-full flex flex-col items-center text-center">
                  <div className={`w-14 h-14 rounded-full bg-brand-emerald text-zinc-950 font-black text-xl flex items-center justify-center mb-6 shadow-md`}>
                    {idx + 1}
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 mb-3 tracking-tight">{step.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed font-medium">{step.desc}</p>
                </div>
                {idx < service.process.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 border-t-2 border-dashed border-zinc-300 z-0"></div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="py-20 bg-white border-t border-zinc-100">
        <div className="max-w-3xl mx-auto px-6 md:px-12">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-zinc-950 tracking-tight">Frequently Asked Questions</h2>
            <p className="text-zinc-500 text-lg font-medium">Got questions? We've got answers.</p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {service.faqs.map((faq, index) => (
              <motion.div key={index} variants={fadeUp}>
                <FAQItem faq={faq} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
      <CTA />
    </MainLayout>
  );
};

export default ServiceDetails;
export { serviceDetailsData };
