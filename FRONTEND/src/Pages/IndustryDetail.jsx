import React, { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import SEO from "../Components/SEO";
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
          <h1 className="text-4xl font-black text-gray-900 mb-4">
            Industry Not Found
          </h1>
          <p className="text-gray-500 mb-8">
            This industry page is not available right now.
          </p>
          <Link
            to="/industries"
            className="px-6 py-3 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
          >
            Back to Industries
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <SEO 
        title={`${industry.title} Solutions | Code-A-Nova`}
        description={industry.description}
        canonicalUrl={`https://code-a-nova.online/industries/${slug}`}
      />
      <section className="pt-24 pb-16 bg-white">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <Link
            to="/industries"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 mb-8 transition-colors"
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
              <p className="text-sm uppercase tracking-[0.25em] text-blue-600 font-semibold">
                {industry.eyebrow}
              </p>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight">
                How we help {industry.name.toLowerCase()} grow
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed">
                {industry.intro}
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="rounded-full bg-blue-50 text-blue-700 px-4 py-2 text-sm font-semibold">
                  Growth-focused
                </span>
                <span className="rounded-full bg-emerald-50 text-emerald-700 px-4 py-2 text-sm font-semibold">
                  Custom website + automation
                </span>
                <span className="rounded-full bg-purple-50 text-purple-700 px-4 py-2 text-sm font-semibold">
                  Local + online leads
                </span>
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="rounded-3xl border border-gray-200 bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6 shadow-xl"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                What we can build for your business
              </h2>
              <ul className="space-y-4 text-gray-700">
                {industry.whatWeDo.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <BadgeCheck className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
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
              className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-5">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Growth ideas we can implement
                </h2>
              </div>
              <ul className="space-y-4 text-gray-700">
                {industry.growthIdeas.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
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
              className="rounded-3xl border border-gray-200 bg-gray-900 text-white p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-5">
                <ShieldCheck className="w-6 h-6 text-blue-300" />
                <h2 className="text-2xl font-bold">Why this works</h2>
              </div>
              <p className="text-gray-200 leading-relaxed mb-5">
                We combine beautiful design, smart automation, and
                lead-generation systems so your business gets more enquiries,
                better trust, and smoother operations.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/8 p-4 border border-white/10">
                  <Globe className="w-5 h-5 text-cyan-300 mb-2" />
                  <h3 className="font-semibold mb-1">Online visibility</h3>
                  <p className="text-sm text-gray-300">
                    Better search presence and stronger local discovery.
                  </p>
                </div>
                <div className="rounded-2xl bg-white/8 p-4 border border-white/10">
                  <CalendarCheck className="w-5 h-5 text-cyan-300 mb-2" />
                  <h3 className="font-semibold mb-1">Automated bookings</h3>
                  <p className="text-sm text-gray-300">
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
            className="mt-10 rounded-3xl bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 shadow-xl"
          >
            <h2 className="text-2xl md:text-3xl font-black mb-3">
              Ready to grow your {industry.name.toLowerCase()} business?
            </h2>
            <p className="text-blue-100 max-w-2xl mb-6">
              Let us turn your industry-specific opportunities into a modern
              website, smart workflow, and growth engine that brings real
              customers.
            </p>
            <Link
              to="/contact"
              className="inline-flex rounded-full bg-white text-blue-700 px-6 py-3 font-semibold hover:bg-blue-50 transition"
            >
              Start your growth plan
            </Link>
          </motion.div>
        </div>
      </section>

    </MainLayout>
  );
};

export default IndustryDetail;
