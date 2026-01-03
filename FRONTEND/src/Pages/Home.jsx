import { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Users,
  Target,
  Award,
  Briefcase,
  Code,
  Palette,
  BarChart,
  Megaphone,
  DollarSign,
  CheckCircle,
  TrendingUp,
  Clock,
  Linkedin,
  Instagram,
  Mail,
  Phone,
  MapPin,
  Code2,
  ArrowUp,
} from 'lucide-react';
import logo from '../assets/LOGO.png';
import LOGO from '../assets/about.png';

function Home() {
  const [visibleSections, setVisibleSections] = useState(new Set());
  const [scrollDirection, setScrollDirection] = useState('down');
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollDirection(currentScrollY > lastScrollY ? 'down' : 'up');
      setLastScrollY(currentScrollY);
      setShowScrollTop(currentScrollY > 500);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    const observerCallback = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setVisibleSections(prev => new Set([...prev, entry.target.id]));
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    const sections = document.querySelectorAll('[data-scroll-reveal]');
    sections.forEach(section => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isVisible = (sectionId) => visibleSections.has(sectionId);

  const domains = [
    { icon: Code, name: 'Web Development' },
    { icon: Palette, name: 'UI/UX Design' },
    { icon: BarChart, name: 'Data Analytics' },
    { icon: Megaphone, name: 'C Programming' },
    { icon: DollarSign, name: 'Python Programming' },
    { icon: Briefcase, name: 'AI & ML' }
  ];

  const features = [
    {
      icon: Award,
      title: 'Industry Certificates',
      description: 'Earn certificates that add real value to your resume and LinkedIn profile.'
    },
    {
      icon: Users,
      title: 'Expert Mentorship',
      description: 'Learn from industry professionals with years of real-world experience.'
    },
    {
      icon: Target,
      title: 'Real Projects',
      description: 'Work on actual projects that solve real business problems.'
    },
    {
      icon: Clock,
      title: 'Flexible Duration',
      description: 'Choose internship durations that fit your academic schedule.'
    }
  ];

  const benefits = [
    'Hands-on experience with cutting-edge technologies',
    'Build a professional portfolio that stands out',
    'Network with industry leaders and fellow interns',
    'Get placement assistance and career guidance',
    'Work remotely from anywhere in the world',
    'Receive performance-based incentives'
  ];

  const quickLinks = [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'About' },
    { to: '/service', label: 'Service' },
    { to: '/contact', label: 'Contact' },
    { to: '/registration', label: 'Registration' },
  ];

  const legalLinks = [
    { to: '/terms', label: 'Terms & Conditions' },
    // { to: '/privacy', label: 'Privacy Policy' },
    { to: '/verify', label: 'Verify Certificate' },
  ];

  const socialLinks = [
    { href: 'https://www.linkedin.com/company/code-a-nova/', icon: <Linkedin size={24} />, label: 'LinkedIn' },
    { href: 'https://www.instagram.com/codenova31/', icon: <Instagram size={24} />, label: 'Instagram' },
    { href: 'mailto:codeanova26@gmail.com', icon: <Mail size={24} />, label: 'Email' },
  ];

  return (
    <div className="w-full bg-slate-950 overflow-x-hidden relative">
      {/* Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 z-50 p-3 sm:p-4 bg-linear-to-r from-blue-600 to-cyan-600 text-white rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-110 ${
          showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20 pointer-events-none'
        }`}
        aria-label="Scroll to top"
      >
        <ArrowUp size={20} />
      </button>

      {/* Hero Section */}
      <section
        id="hero"
        data-scroll-reveal
        className={`relative w-full min-h-screen flex items-center justify-center text-white px-4 sm:px-6 lg:px-8 transition-all duration-700 ${
          isVisible('hero')
            ? 'opacity-100 translate-y-0'
            : scrollDirection === 'down'
            ? 'opacity-0 translate-y-12'
            : 'opacity-0 -translate-y-12'
        }`}
      >
        <div className="absolute inset-0 bg-linear-to-b from-blue-900/20 via-slate-950 to-slate-950"></div>
        <div className="absolute top-10 sm:top-20 right-10 sm:right-20 w-48 h-48 sm:w-72 sm:h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 sm:bottom-20 left-10 sm:left-20 w-48 h-48 sm:w-72 sm:h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>

        <div className="relative z-10 w-full max-w-7xl mx-auto py-20 sm:py-32 text-center">
          <div className="inline-block mb-4 sm:mb-6 px-4 sm:px-6 py-2 sm:py-3 bg-blue-500/20 border border-blue-400/30 rounded-full backdrop-blur-sm">
            <span className="text-blue-300 text-xs sm:text-sm font-medium">🚀 Launch Your Career Today</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight px-4">
            Transform Your Future with
            <span className="block bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mt-2 sm:mt-3">
              Real-World Internships
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed px-4">
            Bridge the gap between academic learning and industry requirements.
            Join thousands of students gaining practical experience with top companies.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-12 sm:mb-20 px-4">
            <Link to="/registration"className="group w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-lg font-semibold text-base sm:text-lg text-white transition-all duration-300 flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl hover:scale-105">
              Get Started Now
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
            </Link>
            <Link to="/service" className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-blue-400/50 rounded-lg font-semibold text-base sm:text-lg text-white transition-all duration-300 shadow-lg hover:scale-105">
              Explore Opportunities
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8 max-w-4xl mx-auto px-4">
            {[
              { number: '50+', label: 'Active Interns' },
              { number: '95%', label: 'Success Rate' },
              { number: '1+', label: 'Countries' }
            ].map((stat, index) => (
              <div key={index} className="text-center p-4 bg-slate-900/50 rounded-xl backdrop-blur-sm border border-slate-800">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-cyan-400 mb-2">{stat.number}</div>
                <div className="text-gray-400 text-xs sm:text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section
        id="what-we-do"
        data-scroll-reveal
        className={`w-full py-16 sm:py-20 lg:py-24 bg-slate-900 transition-all duration-700 delay-75 ${
          isVisible('what-we-do')
            ? 'opacity-100 translate-y-0'
            : scrollDirection === 'down'
            ? 'opacity-0 translate-y-12'
            : 'opacity-0 -translate-y-12'
        }`}
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <span className="text-blue-400 font-semibold text-xs sm:text-sm uppercase tracking-wider">Our Mission</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mt-3 sm:mt-4 mb-4 sm:mb-6">What We Do</h2>
            <p className="text-base sm:text-lg text-gray-300 max-w-3xl mx-auto px-4">
              We connect ambitious students with leading companies, providing structured internship
              programs that build skills, confidence, and career readiness.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                icon: Target,
                title: 'Match & Connect',
                description: 'We match your skills and interests with the perfect internship opportunities from our network of partner companies.'
              },
              {
                icon: Award,
                title: 'Train & Develop',
                description: 'Comprehensive training programs ensure you have the skills needed to excel in your chosen field.'
              },
              {
                icon: TrendingUp,
                title: 'Guide & Support',
                description: 'Continuous mentorship and support throughout your journey, from application to completion.'
              }
            ].map((item, index) => (
              <div
                key={index}
                className="group p-6 sm:p-8 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 hover:border-blue-400/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-2"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-500/20 rounded-xl flex items-center justify-center mb-5 sm:mb-6 group-hover:bg-blue-500/40 group-hover:scale-110 transition-all duration-300">
                  <item.icon className="text-blue-400" size={28} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">{item.title}</h3>
                <p className="text-sm sm:text-base text-gray-300 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Are Section */}
      {/* What We Are Section */}
      <section
        id="what-we-are"
        data-scroll-reveal
        className={`w-full py-24 bg-slate-950 transition-all duration-500 delay-150 ${
          isVisible('what-we-are')
            ? 'opacity-100 translate-y-0'
            : scrollDirection === 'down'
            ? 'opacity-0 translate-y-12'
            : 'opacity-0 -translate-y-12'
        }`}
      >
        <div className="absolute inset-0 bg-linear-to-b from-blue-900/5 to-transparent pointer-events-none"></div>
        <div className="w-full px-6 sm:px-8 lg:px-16 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-blue-400 font-semibold text-sm uppercase tracking-wider">About Us</span>
              <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-6">What We Are</h2>
              <p className="text-lg text-gray-300 mb-6 leading-relaxed justify-center">
                We are a premier internship platform dedicated to empowering the next generation
                of professionals. Founded by industry veterans who understand the challenges students
                face in transitioning from education to employment.
              </p>
              <p className="text-lg text-gray-300 mb-8 leading-relaxed">
                Our platform serves as a bridge, connecting talented students with innovative companies
                seeking fresh perspectives. We believe in practical learning, skill development, and
                creating opportunities that shape successful careers.
              </p>
              <div className="space-y-4">
                {[
                  'Student-centric approach',
                  'Industry-aligned curriculum',
                  'Verified company partnerships',
                  'Career growth focus'
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center shrink-0">
                      <CheckCircle size={16} className="text-slate-950" />
                    </div>
                    <span className="text-gray-200 font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative h-96 md:h-full">
              <div className="aspect-square bg-linear-to-br from-blue-600/40 to-cyan-600/40 rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center backdrop-blur-sm border border-blue-400/20">
                 <img 
      src={LOGO} 
      alt="Logo" 
      className="w-7xl md:w-6xl opacity-80 hover:opacity-100 transition-all duration-300"
    />
              </div>
              
            </div>
          </div>
        </div>
      </section>

      {/* Our Domains Section */}
      <section
        id="domains"
        data-scroll-reveal
        className={`w-full py-16 sm:py-20 lg:py-24 bg-slate-900 transition-all duration-700 delay-225 ${
          isVisible('domains')
            ? 'opacity-100 translate-y-0'
            : scrollDirection === 'down'
            ? 'opacity-0 translate-y-12'
            : 'opacity-0 -translate-y-12'
        }`}
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <span className="text-blue-400 font-semibold text-xs sm:text-sm uppercase tracking-wider">Specializations</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mt-3 sm:mt-4 mb-4 sm:mb-6">Our Domains</h2>
            <p className="text-base sm:text-lg text-gray-300 max-w-3xl mx-auto px-4">
              Choose from a wide range of domains and kickstart your career in the field you're passionate about.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {domains.map((domain, index) => (
              <div
                key={index}
                className="group p-6 sm:p-8 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 hover:border-cyan-400/50 hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300 hover:-translate-y-2 cursor-pointer"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-500/30 group-hover:bg-cyan-500/30 rounded-xl flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-110 transition-all duration-300">
                  <domain.icon className="text-cyan-400" size={28} />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                  {domain.name}
                </h3>
                <p className="text-sm sm:text-base text-gray-400">
                  Gain hands-on experience and master the latest tools and technologies.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        data-scroll-reveal
        className={`relative w-full py-16 sm:py-20 lg:py-24 bg-slate-950 transition-all duration-700 delay-300 ${
          isVisible('features')
            ? 'opacity-100 translate-y-0'
            : scrollDirection === 'down'
            ? 'opacity-0 translate-y-12'
            : 'opacity-0 -translate-y-12'
        }`}
      >
        <div className="absolute inset-0 bg-linear-to-b from-cyan-900/5 via-transparent to-transparent pointer-events-none"></div>
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12 sm:mb-16">
            <span className="text-cyan-400 font-semibold text-xs sm:text-sm uppercase tracking-wider">What You Get</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mt-3 sm:mt-4 mb-4 sm:mb-6">Our Features</h2>
            <p className="text-base sm:text-lg text-gray-300 max-w-3xl mx-auto px-4">
              Everything you need to launch a successful career, all in one platform.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-5 sm:p-6 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 hover:border-cyan-400/50 hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 hover:scale-105"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                  <feature.icon className="text-blue-400" size={24} />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">{feature.title}</h3>
                <p className="text-sm sm:text-base text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section id="why-choose-us" data-scroll-reveal  className={`w-full py-16 sm:py-20 lg:py-24 bg-slate-900 transition-all duration-700 delay-375 ${  isVisible('why-choose-us')  ? 'opacity-100 translate-y-0' : scrollDirection === 'down'  ? 'opacity-0 translate-y-12'  : 'opacity-0 -translate-y-12'  }`}  >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <span className="text-cyan-400 font-semibold text-xs sm:text-sm uppercase tracking-wider">Our Advantage</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mt-3 sm:mt-4 mb-4 sm:mb-6">Why Choose Us</h2>
            <p className="text-base sm:text-lg text-gray-300 max-w-3xl mx-auto px-4">
              We're not just another internship platform. We're your partner in building a successful career.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 max-w-5xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3 sm:gap-4 p-5 sm:p-6 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300 hover:scale-102" >
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-cyan-500 rounded-full flex items-center justify-center shrink-0 mt-0.5 sm:mt-1">
                  <CheckCircle size={18} className="text-slate-950" />
                </div>
                <p className="text-sm sm:text-base md:text-lg text-gray-200 font-medium">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section id="cta"  data-scroll-reveal  className={`relative w-full py-20 sm:py-28 lg:py-32 bg-slate-950 text-white overflow-hidden transition-all duration-700 delay-450 ${  isVisible('cta') ? 'opacity-100 translate-y-0' : scrollDirection === 'down'  ? 'opacity-0 translate-y-12' : 'opacity-0 -translate-y-12'  }`} >
        <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-blue-500/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 sm:w-96 sm:h-96 bg-cyan-500/10 rounded-full blur-3xl -z-10 animate-pulse"></div>

        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
            Ready to Start Your
            <span className="block bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mt-2 sm:mt-3">
              Professional Journey?
            </span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-8 sm:mb-12 max-w-2xl mx-auto px-4">
            Don't wait for opportunities to come to you. Take charge of your future and apply for internships that match your passion and skills.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <Link to="/registration" className="group w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-xl font-bold text-base sm:text-lg text-white transition-all duration-300 flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl hover:scale-105">
              Apply Now
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={24} />
            </Link>
            <Link to="/contact" className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-400/50 rounded-xl font-bold text-base sm:text-lg text-white transition-all duration-300 shadow-lg hover:scale-105">
              Contact Us
            </Link>
          </div>
          <p className="mt-6 sm:mt-8 text-sm sm:text-base text-gray-400 px-4">
            Join 50+ students who have already started their journey
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-black text-gray-300 pt-16 sm:pt-20 lg:pt-24 pb-0 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute w-96 h-96 -top-20 -left-20 bg-linear-to-br from-cyan-500/20 to-blue-600/20 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute w-96 h-96 -bottom-20 -right-20 bg-linear-to-tr from-blue-500/20 to-cyan-400/20 blur-[100px] rounded-full animate-pulse" />
        </div>

        {/* Main Grid */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 px-4 sm:px-6 lg:px-8 relative z-10 mb-12 sm:mb-16">
          
          {/* Column 1: Brand & Info */}
          <div className="relative p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md transition-all hover:scale-105 hover:border-cyan-500/30 hover:shadow-[0_0_30px_rgba(6,182,212,0.1)] duration-500">
            <Link to="/" className="flex items-center space-x-3 mb-6">
              <img src={logo} alt="CodeNova Logo" className="h-10 w-10 sm:h-12 sm:w-12 object-contain drop-shadow-md" />
              <span className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-cyan-400 to-blue-300 tracking-tight">
                Code-A-Nova
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-gray-400 mb-4">
              Empowering students with real-world tech internships and expert mentorship.
            </p>
            <div className="space-y-2 text-xs sm:text-sm text-gray-500">
              <div className="flex items-center gap-2 hover:text-cyan-400 transition-colors">
                <Mail size={16} className="shrink-0" />
                <span className="break-all">codeanova26@gmail.com</span>
              </div>
              <div className="flex items-center gap-2 hover:text-cyan-400 transition-colors">
                <Phone size={16} className="shrink-0" />
                <span>+91 7880533908</span>
              </div>
              <div className="flex items-center gap-2 hover:text-cyan-400 transition-colors">
                <MapPin size={16} className="shrink-0" />
                <span>India</span>
              </div>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="relative p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md transition-all hover:scale-105 duration-500">
            <h4 className="text-lg sm:text-xl font-semibold text-cyan-300 mb-6">Quick Links</h4>
            <ul className="space-y-3 text-sm">
              {quickLinks.map((link) => (
                <li key={link.to} className="group">
                  <Link to={link.to} className="flex items-center gap-2 hover:text-cyan-400 hover:translate-x-1 transition-all duration-300" >
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-cyan-400 transition-colors"></span>
                    {link.label}
                  </Link>
                </li>  ))}
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div className="relative p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md transition-all hover:scale-105 duration-500">
            <h4 className="text-lg sm:text-xl font-semibold text-blue-400 mb-6">Legal</h4>
            <ul className="space-y-3 text-sm">
              {legalLinks.map((link) => (
                <li key={link.to} className="group">
                  <Link to={link.to} className="flex items-center gap-2 hover:text-blue-400 hover:translate-x-1 transition-all duration-300" >
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-blue-400 transition-colors"></span>
                    {link.label}
                  </Link>
                </li> ))}
            </ul>
          </div>

          {/* Column 4: Follow Us */}
          <div className="relative p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md transition-all hover:scale-105 duration-500">
            <h4 className="text-lg sm:text-xl font-semibold text-cyan-400 mb-6">Follow Us</h4>
            <div className="flex gap-4 sm:gap-5 mb-6">
              {socialLinks.map((social, i) => (
                <a  key={i} href={social.href} target="_blank" rel="noopener noreferrer" className="group relative p-3 rounded-xl border border-white/10 bg-white/5 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/20" aria-label={social.label} >
                  <span className="text-gray-400 group-hover:text-cyan-400 transition-colors">
                    {social.icon} </span>  </a>))}</div>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
              Connect with us on social media for updates, opportunities, and insights.
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />

        {/* Bottom Bar */}
        <div className="bg-black py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 text-xs sm:text-sm">
            <p className="text-gray-500 text-center md:text-left">
              © {new Date().getFullYear()} <span className="text-white font-bold">Code-A-Nova</span>. All rights reserved.
            </p>

            <button className="group flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-500/50 transition-all duration-300">
              <span className="text-gray-400 group-hover:text-white transition-colors text-xs sm:text-sm">Created by</span>
              <span className="font-bold bg-linear-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent tracking-wide group-hover:brightness-125 transition-all text-xs sm:text-sm">
                CODE-A-NOVA
              </span>
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-linear-to-tr from-cyan-500 to-blue-500 flex items-center justify-center group-hover:rotate-12 transition-transform">
                <Code2 size={16} className="text-white" />
              </div>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;

