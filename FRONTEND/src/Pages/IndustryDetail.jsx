import React, { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  TrendingUp,
  Globe,
  CalendarCheck,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import MainLayout from "../layouts/MainLayout";
import CTA from "../sections/CTA";
import { fadeUp, staggerContainer } from "../animations/variants";

const industryDetails = {
  restaurants: {
    name: "Restaurants",
    eyebrow: "Food & Hospitality",
    intro:
      "Turn visits into bookings, repeat orders, and stronger brand loyalty with a premium digital storefront.",
    whatWeDo: [
      "Online menus with smart ordering flow",
      "Reservation and table-booking systems",
      "Instagram-ready visuals and Google Business optimization",
    ],
    growthIdeas: [
      "Launch offers and seasonal menus online",
      "Collect reviews and automate follow-up messages",
      "Use WhatsApp/booking integrations to reduce missed orders",
    ],
  },
  cafes: {
    name: "Cafés",
    eyebrow: "Coffee & Lifestyle Brands",
    intro:
      "Attract morning traffic, promote new drinks, and make your café easy to discover and book.",
    whatWeDo: [
      "Premium café website and menu pages",
      "Online pre-order and pickup flow",
      "Local SEO and social-first landing pages",
    ],
    growthIdeas: [
      "Highlight loyalty offers and combo packs",
      "Use event pages for live music or workshops",
      "Run location-based promotions to bring in nearby customers",
    ],
  },
  gyms: {
    name: "Gyms",
    eyebrow: "Fitness & Wellness",
    intro:
      "Convert interest into memberships with a faster booking experience and stronger community trust.",
    whatWeDo: [
      "Membership and class booking pages",
      "Trainer lead-capture forms and CRM setup",
      "Performance dashboards and member engagement tools",
    ],
    growthIdeas: [
      "Show transformation stories and class schedules",
      "Automate follow-up for trial sessions",
      "Promote seasonal challenges and referral campaigns",
    ],
  },
  salons: {
    name: "Salons",
    eyebrow: "Beauty & Personal Care",
    intro:
      "Make appointments effortless and turn your salon into a premium brand clients trust online.",
    whatWeDo: [
      "Online booking and consultation forms",
      "Stylists portfolio and service catalog pages",
      "Review collection and reminders for repeat visits",
    ],
    growthIdeas: [
      "Create service bundles and package offers",
      "Launch seasonal beauty campaigns and promos",
      "Use before/after galleries to increase conversions",
    ],
  },
  clinics: {
    name: "Clinics",
    eyebrow: "Healthcare & Wellness",
    intro:
      "Improve trust, simplify appointments, and help patients find the right care faster.",
    whatWeDo: [
      "Doctor profile and service pages",
      "Online appointment booking and reminders",
      "Patient trust content, FAQs, and maps integration",
    ],
    growthIdeas: [
      "Publish testimonials and care packages",
      "Offer online consultation and follow-up workflows",
      "Strengthen local search visibility for high-intent keywords",
    ],
  },
  schools: {
    name: "Schools",
    eyebrow: "Education & Learning",
    intro:
      "Show case your programs, admissions process, and campus value in a polished digital experience.",
    whatWeDo: [
      "Admissions and inquiry forms",
      "Program pages, gallery, and event sections",
      "Parent communication and lead nurturing workflows",
    ],
    growthIdeas: [
      "Highlight achievements, campus life, and success stories",
      "Create open-house and admission campaign pages",
      "Use automated reminders for enrollment deadlines",
    ],
  },
  colleges: {
    name: "Colleges",
    eyebrow: "Higher Education",
    intro:
      "Build credibility for your institute and help students discover the right course path quickly.",
    whatWeDo: [
      "Course overview and admissions pages",
      "Scholarship and application forms",
      "Campus tour and alumni showcase sections",
    ],
    growthIdeas: [
      "Create course-specific landing pages for conversions",
      "Promote placements, internships, and alumni outcomes",
      "Automate follow-up for interested students and parents",
    ],
  },
  startups: {
    name: "Startups",
    eyebrow: "Innovation & Growth",
    intro:
      "Launch faster, communicate your value clearly, and convert early interest into real business momentum.",
    whatWeDo: [
      "Pitch-ready websites and landing pages",
      "Lead capture, CRM, and analytics setup",
      "Automation for demos, onboarding, and outreach",
    ],
    growthIdeas: [
      "Create founder-led content and product stories",
      "Turn product demos into conversion funnels",
      "Use AI support to qualify leads instantly",
    ],
  },
  retail: {
    name: "Retail Shops",
    eyebrow: "Retail & Local Commerce",
    intro:
      "Give your store a premium online presence that drives footfall and repeat purchases.",
    whatWeDo: [
      "Catalog and product showcase pages",
      "Store locator, offers, and promotions",
      "Easy contact and WhatsApp-based customer support",
    ],
    growthIdeas: [
      "Share new arrivals and seasonal sale pages",
      "Use review-driven trust content to boost conversions",
      "Run local promotions tied to nearby events and holidays",
    ],
  },
  realestate: {
    name: "Real Estate",
    eyebrow: "Property & Brokerage",
    intro:
      "Make property discovery simple and position your brand as a premium, trustworthy advisor.",
    whatWeDo: [
      "Property listing and brochure pages",
      "Lead capture and inquiry automation",
      "Map-based search and premium visual presentation",
    ],
    growthIdeas: [
      "Feature hot listings and neighborhood guides",
      "Create lead nurturing for buyers and investors",
      "Use testimonials and case studies to build trust",
    ],
  },
  personalbrands: {
    name: "Personal Brands",
    eyebrow: "Creators & Influencers",
    intro:
      "Build a digital identity that attracts opportunities, partnerships, and loyal followers.",
    whatWeDo: [
      "Portfolio and personal brand websites",
      "Service booking and consultation pages",
      "Content, testimonials, and lead generation systems",
    ],
    growthIdeas: [
      "Turn your story into a premium landing page",
      "Add booking and collaboration inquiry forms",
      "Use content-driven SEO to grow long-term visibility",
    ],
  },
};

const IndustryDetail = () => {
  const { slug } = useParams();
  const industry = industryDetails[slug];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!industry) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
          <h1 className="text-4xl font-black text-zinc-900 mb-4 tracking-tight">
            Industry Not Found
          </h1>
          <p className="text-zinc-500 mb-8 font-medium">
            This industry page is not available right now.
          </p>
          <Link
            to="/industries"
            className="px-6 py-3 rounded-full bg-brand-emerald text-zinc-950 font-black hover:bg-brand-mint transition duration-300 shadow-lg shadow-brand-emerald/10 cursor-pointer"
          >
            Back to Industries
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <section className="pt-24 pb-16 bg-white">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <Link
            to="/industries"
            className="inline-flex items-center gap-2 text-xs font-bold text-brand-emerald hover:text-brand-mint mb-8 transition-colors uppercase font-mono tracking-widest"
          >
            <ArrowLeft className="w-4 h-4" /> Back to industries
          </Link>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-start"
          >
            <motion.div variants={fadeUp} className="space-y-6">
              <p className="text-xs uppercase tracking-[0.25em] text-brand-emerald font-bold font-mono">
                {industry.eyebrow}
              </p>
              <h1 className="text-4xl md:text-5xl font-black text-zinc-950 leading-tight tracking-tight">
                How we help {industry.name.toLowerCase()} grow
              </h1>
              <p className="text-lg text-zinc-500 leading-relaxed font-medium">
                {industry.intro}
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="rounded-full bg-emerald-50 text-emerald-700 px-4 py-2 text-xs font-bold border border-emerald-100/50">
                  Growth-focused
                </span>
                <span className="rounded-full bg-emerald-50 text-emerald-700 px-4 py-2 text-xs font-bold border border-emerald-100/50">
                  Custom website + automation
                </span>
                <span className="rounded-full bg-amber-50 text-amber-700 px-4 py-2 text-xs font-bold border border-amber-100/50">
                  Local + online leads
                </span>
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="rounded-3xl border border-zinc-100 bg-white p-6 md:p-8 shadow-xl shadow-zinc-200/30"
            >
              <h2 className="text-xl font-bold text-zinc-900 mb-6 tracking-tight">
                What we can build for your business
              </h2>
              <ul className="space-y-4 text-zinc-700 font-medium">
                {industry.whatWeDo.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <BadgeCheck className="w-5 h-5 text-brand-emerald mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 mt-12">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-5">
                <TrendingUp className="w-6 h-6 text-brand-emerald animate-pulse" />
                <h2 className="text-2xl font-bold text-zinc-950 tracking-tight">
                  Growth ideas we can implement
                </h2>
              </div>
              <ul className="space-y-4 text-zinc-700 font-medium">
                {industry.growthIdeas.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-brand-gold mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="rounded-3xl border border-zinc-150 bg-white text-zinc-900 p-6 shadow-xl shadow-zinc-200/30 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-emerald/5 rounded-full blur-2xl" />
              
              <div className="flex items-center gap-3 mb-5 relative z-10">
                <ShieldCheck className="w-6 h-6 text-brand-emerald shrink-0" />
                <h2 className="text-2xl font-bold text-zinc-950 tracking-tight">Why this works</h2>
              </div>
              <p className="text-zinc-500 leading-relaxed mb-6 font-medium relative z-10">
                We combine beautiful design, smart automation, and
                lead-generation systems so your business gets more enquiries,
                better trust, and smoother operations.
              </p>
              <div className="grid gap-4 sm:grid-cols-2 relative z-10">
                <div className="rounded-2xl bg-zinc-50 p-4 border border-zinc-150 hover:border-brand-emerald/20 transition-colors">
                  <Globe className="w-5 h-5 text-brand-emerald mb-2" />
                  <h3 className="font-semibold text-zinc-900 mb-1">Online visibility</h3>
                  <p className="text-xs text-zinc-500 font-medium leading-normal">
                    Better search presence and stronger local discovery.
                  </p>
                </div>
                <div className="rounded-2xl bg-zinc-50 p-4 border border-zinc-150 hover:border-brand-mint/20 transition-colors">
                  <CalendarCheck className="w-5 h-5 text-brand-emerald mb-2" />
                  <h3 className="font-semibold text-zinc-900 mb-1">Automated bookings</h3>
                  <p className="text-xs text-zinc-500 font-medium leading-normal">
                    Reduce manual follow-up and convert faster.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="mt-10 rounded-3xl bg-gradient-to-br from-white to-[#F4F9F6] text-zinc-950 p-8 md:p-12 shadow-xl shadow-zinc-200/30 border border-zinc-150 relative overflow-hidden"
          >
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-brand-emerald/5 rounded-full blur-[80px]" />
            
            <div className="relative z-10">
              <h2 className="text-2xl md:text-3xl font-black mb-3 tracking-tight">
                Ready to grow your {industry.name.toLowerCase()} business?
              </h2>
              <p className="text-zinc-500 max-w-2xl mb-8 leading-relaxed font-medium">
                Let us turn your industry-specific opportunities into a modern
                website, smart workflow, and growth engine that brings real
                customers.
              </p>
              <Link
                to="/contact"
                className="inline-flex rounded-full bg-zinc-950 text-white px-8 py-3.5 font-black hover:bg-brand-emerald hover:text-zinc-950 transition shadow-lg shadow-zinc-950/10 cursor-pointer"
              >
                Start your growth plan
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

    </MainLayout>
  );
};

export default IndustryDetail;
