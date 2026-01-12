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
  MapPin,
  Code2,
  ArrowUp,
  Sparkles,
} from 'lucide-react';
import logo from '../assets/LOGO.png';
import LOGO from '../assets/about.png';

function Home() {
  const [visibleSections, setVisibleSections] = useState(new Set());
  const [scrollDirection, setScrollDirection] = useState('down');
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scrambledText, setScrambledText] = useState('');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [activeInterns, setActiveInterns] = useState(0);
  const [successRate, setSuccessRate] = useState(0);
  const [animationStarted, setAnimationStarted] = useState(false);

  const targetText = 'Real-World Internships';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()';

  useEffect(() => {
    const savedStats = localStorage.getItem('internshipStats');
    if (savedStats) {
      const stats = JSON.parse(savedStats);
      setActiveInterns(stats.interns);
      setSuccessRate(stats.rate);
      setAnimationStarted(true);
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

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
          if (entry.target.id === 'hero') {
            startScrambleAnimation();
            if (!animationStarted) {
              animateNumbers();
            }
          }
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
  }, [animationStarted]);

  const animateNumbers = () => {
    if (animationStarted) return;

    const duration = 2000;
    const steps = 60;
    const internIncrement =300 / steps;
    const rateIncrement = 95 / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const newInterns = Math.floor(internIncrement * currentStep);
      const newRate = Math.floor(rateIncrement * currentStep);
      setActiveInterns(newInterns);
      setSuccessRate(newRate);

      if (currentStep >= steps) {
        clearInterval(interval);
        setActiveInterns(300);
        setSuccessRate(95);
        localStorage.setItem('internshipStats', JSON.stringify({ interns: 300, rate: 95 }));
        setAnimationStarted(true);
      }
    }, duration / steps);
  };

  const startScrambleAnimation = () => {
    let iteration = 0;
    const maxIterations = targetText.length;

    const interval = setInterval(() => {
      setScrambledText(
        targetText
          .split('')
          .map((char, index) => {
            if (char === ' ' || char === '-') return char;
            if (index < iteration) {
              return targetText[index];
            }
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join('')
      );

      if (iteration >= maxIterations) {
        clearInterval(interval);
        setScrambledText(targetText);
      }

      iteration += 1 / 3;
    }, 50);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isVisible = (sectionId) => visibleSections.has(sectionId);

  const domains = [
    { icon: Code, name: 'Web Development', delay: 0 },
    { icon: Palette, name: 'UI/UX Design', delay: 100 },
    { icon: BarChart, name: 'Data Analytics', delay: 200 },
    { icon: Megaphone, name: 'C Programming', delay: 300 },
    { icon: DollarSign, name: 'Python Programming', delay: 400 },
    { icon: Briefcase, name: 'AI & ML', delay: 500 }
  ];

  const features = [
    {
      icon: Award,
      title: 'Industry Certificates',
      description: 'Earn certificates that add real value to your resume and LinkedIn profile.',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Users,
      title: 'Expert Mentorship',
      description: 'Learn from industry professionals with years of real-world experience.',
      gradient: 'from-cyan-500 to-teal-500'
    },
    {
      icon: Target,
      title: 'Real Projects',
      description: 'Work on actual projects that solve real business problems.',
      gradient: 'from-teal-500 to-emerald-500'
    },
    {
      icon: Clock,
      title: 'Flexible Duration',
      description: 'Choose internship durations that fit your academic schedule.',
      gradient: 'from-emerald-500 to-green-500'
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
    { to: '/verify', label: 'Verify Certificate' },
    { to: '/refund-policy', label: 'Refund Policy' },
  ];

  const socialLinks = [
    { href: 'https://www.linkedin.com/company/code-a-nova/', icon: <Linkedin size={24} />, label: 'LinkedIn' },
    { href: 'https://www.instagram.com/codenova31/', icon: <Instagram size={24} />, label: 'Instagram' },
    { href: 'mailto:codeanova26@gmail.com', icon: <Mail size={24} />, label: 'Email' },
  ];

  return (
    <div className="w-full bg-slate-950 overflow-x-hidden relative">
      <div
        className="fixed inset-0 pointer-events-none z-50 opacity-30"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.15), transparent 40%)`
        }}
      />

      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 z-50 p-4 bg-linear-to-r from-blue-600 to-cyan-600 text-white rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-110 hover:rotate-12 ${
          showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20 pointer-events-none'
        }`}
        aria-label="Scroll to top"
      >
        <ArrowUp size={20} />
      </button>

      <section
        id="hero"
        data-scroll-reveal
        className={`relative w-full min-h-screen flex items-center justify-center text-white px-4 sm:px-6 lg:px-8 transition-all duration-1000 ${
          isVisible('hero') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}
      >
        <div className="absolute inset-0 bg-linear-to-b from-blue-900/20 via-slate-950 to-slate-950"></div>
        <div className="absolute top-20 right-20 w-125 h-125 bg-blue-500/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-125 h-125 bg-cyan-500/20 rounded-full blur-[120px] animate-pulse animation-delay-1000"></div>

        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-float" style={{ top: '20%', left: '10%', animationDelay: '0s' }}></div>
          <div className="absolute w-1 h-1 bg-blue-400 rounded-full animate-float" style={{ top: '60%', left: '80%', animationDelay: '1s' }}></div>
          <div className="absolute w-1 h-1 bg-cyan-300 rounded-full animate-float" style={{ top: '40%', right: '15%', animationDelay: '2s' }}></div>
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto py-32 text-center">
          <div className="inline-block mb-6 px-6 py-3 bg-linear-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 rounded-full backdrop-blur-sm animate-fade-in shadow-lg shadow-blue-500/20 hover:shadow-cyan-500/30 transition-all duration-300 cursor-pointer group hover:scale-105">
            <span className="text-blue-300 text-sm font-medium flex items-center gap-2">
              <Sparkles size={16} className="animate-spin-slow" />
              Launch Your Career Today
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight px-4 animate-fade-in-up animation-delay-200">
            Transform Your Future with
            <span className="block bg-linear-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent mt-3 font-serif tracking-tight min-h-[1.2em] animate-gradient-x">
              {scrambledText || targetText}
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed px-4 animate-fade-in-up animation-delay-400">
            Bridge the gap between academic learning and industry requirements.
            Join thousands of students gaining practical experience with top companies.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20 px-4 animate-fade-in-up animation-delay-600">
            <Link to="/registration" className="group relative w-full sm:w-auto px-8 py-4 bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-lg font-semibold text-lg text-white transition-all duration-300 flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl hover:shadow-blue-500/50 hover:scale-105 overflow-hidden">
              <span className="absolute inset-0 bg-linear-to-r from-cyan-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <span className="relative">Get Started Now</span>
              <ArrowRight className="relative group-hover:translate-x-1 transition-transform" size={20} />
            </Link>
            <Link to="/service" className="group w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 border-2 border-slate-700 hover:border-blue-400/50 rounded-lg font-semibold text-lg text-white transition-all duration-300 shadow-lg hover:scale-105 relative overflow-hidden">
              <span className="absolute inset-0 bg-linear-to-r from-blue-600/10 to-cyan-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <span className="relative">Explore Opportunities</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 max-w-4xl mx-auto px-4">
            {[
              { number: activeInterns, suffix: '+', label: 'Active Interns' },
              { number: successRate, suffix: '%', label: 'Success Rate' },
              { number: 1, suffix: '+', label: 'Countries' }
            ].map((stat, index) => (
              <div
                key={index}
                className="group relative p-6 bg-linear-to-br from-slate-900/80 to-slate-800/80 rounded-2xl backdrop-blur-sm border border-slate-700 hover:border-cyan-400/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/20 animate-fade-in-up cursor-pointer overflow-hidden"
                style={{ animationDelay: `${900 + index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-linear-to-br from-blue-500/0 to-cyan-500/0 group-hover:from-blue-500/10 group-hover:to-cyan-500/10 rounded-2xl transition-all duration-500"></div>
                <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="text-4xl font-bold bg-linear-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300 origin-left">
                    {stat.number}{stat.suffix}
                  </div>
                  <div className="text-gray-400 text-sm">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="what-we-do"
        data-scroll-reveal
        className={`w-full py-24 bg-slate-900 transition-all duration-1000 ${
          isVisible('what-we-do') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-blue-400 font-semibold text-sm uppercase tracking-wider animate-fade-in">Our Mission</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-6 animate-fade-in-up animation-delay-100">
              What We <span className="bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-x">Do</span>
            </h2>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto px-4 animate-fade-in-up animation-delay-200">
              We connect ambitious students with leading companies, providing structured internship
              programs that build skills, confidence, and career readiness.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Target,
                title: 'Match & Connect',
                description: 'We match your skills and interests with the perfect internship opportunities from our network of partner companies.',
                color: 'blue'
              },
              {
                icon: Award,
                title: 'Train & Develop',
                description: 'Comprehensive training programs ensure you have the skills needed to excel in your chosen field.',
                color: 'cyan'
              },
              {
                icon: TrendingUp,
                title: 'Guide & Support',
                description: 'Continuous mentorship and support throughout your journey, from application to completion.',
                color: 'teal'
              }
            ].map((item, index) => (
              <div
                key={index}
                className="group relative p-8 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 hover:border-blue-400/50 transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl hover:shadow-blue-500/20 animate-fade-in-up cursor-pointer overflow-hidden"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="absolute inset-0 bg-linear-to-br from-blue-500/0 to-cyan-500/0 group-hover:from-blue-500/10 group-hover:to-cyan-500/10 rounded-2xl transition-all duration-500"></div>
                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className={`w-16 h-16 bg-linear-to-br from-${item.color}-500/20 to-${item.color}-400/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg`}>
                    <item.icon className={`text-${item.color}-400`} size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-cyan-400 transition-colors duration-300">
                    {item.title}
                  </h3>
                  <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors duration-300">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="what-we-are"
        data-scroll-reveal
        className={`relative w-full py-24 bg-slate-950 transition-all duration-1000 ${
          isVisible('what-we-are') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}
      >
        <div className="w-full px-6 sm:px-8 lg:px-16 relative z-10">
          <div className="grid md:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
            <div className="animate-fade-in-left">
              <span className="text-blue-400 font-semibold text-sm uppercase tracking-wider inline-block mb-4 animate-fade-in">About Us</span>
              <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-6 animate-fade-in-up animation-delay-100">
                What We <span className="bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Are</span>
              </h2>
              <p className="text-lg text-gray-300 mb-6 leading-relaxed animate-fade-in-up animation-delay-200">
                We are a premier internship platform dedicated to empowering the next generation
                of professionals. Founded by industry veterans who understand the challenges students
                face in transitioning from education to employment.
              </p>
              <p className="text-lg text-gray-300 mb-8 leading-relaxed animate-fade-in-up animation-delay-300">
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
                  <div
                    key={index}
                    className="flex items-center gap-3 group animate-fade-in-up cursor-pointer"
                    style={{ animationDelay: `${400 + index * 100}ms` }}
                  >
                    <div className="w-8 h-8 bg-linear-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shadow-lg shadow-cyan-500/50">
                      <CheckCircle size={16} className="text-white" />
                    </div>
                    <span className="text-gray-200 font-medium group-hover:text-cyan-400 transition-colors duration-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative h-full animate-fade-in-right">
              <div className="relative  rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center  transition-all duration-700 group">
                <img
                  src={LOGO}
                  alt="Logo"
                  className="relative w-full h-full object-contain p-12 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="domains"
        data-scroll-reveal
        className={`w-full py-24 bg-slate-900 transition-all duration-1000 ${
          isVisible('domains') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-blue-400 font-semibold text-sm uppercase tracking-wider inline-block mb-4 animate-fade-in">Specializations</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-6 animate-fade-in-up animation-delay-100">
              Our <span className="bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-x">Domains</span>
            </h2>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto px-4 animate-fade-in-up animation-delay-200">
              Choose from a wide range of domains and kickstart your career in the field you're passionate about.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {domains.map((domain, index) => (
              <div
                key={index}
                className="group relative p-8 bg-linear-to-br from-slate-800/80 to-slate-800/40 backdrop-blur-sm rounded-2xl border border-slate-700 hover:border-cyan-400/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-cyan-500/20 cursor-pointer overflow-hidden animate-fade-in-up"
                style={{ animationDelay: `${domain.delay}ms` }}
              >
                <div className="absolute inset-0 bg-linear-to-br from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/10 group-hover:to-blue-500/10 transition-all duration-500"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-blue-500/20 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-linear-to-br from-blue-500/30 to-cyan-500/30 group-hover:from-cyan-500/40 group-hover:to-teal-500/40 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg">
                    <domain.icon className="text-cyan-400 group-hover:text-teal-300 transition-colors duration-300" size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors duration-300">
                    {domain.name}
                  </h3>
                  <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                    Gain hands-on experience and master the latest tools and technologies.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="features"
        data-scroll-reveal
        className={`relative w-full py-24 bg-slate-950 transition-all duration-1000 ${
          isVisible('features') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}
      >
        <div className="absolute inset-0 bg-linear-to-b from-cyan-900/5 via-transparent to-transparent pointer-events-none"></div>
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <span className="text-cyan-400 font-semibold text-sm uppercase tracking-wider inline-block mb-4 animate-fade-in">What You Get</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-6 animate-fade-in-up animation-delay-100">
              Our <span className="bg-linear-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent animate-gradient-x">Features</span>
            </h2>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto px-4 animate-fade-in-up animation-delay-200">
              Everything you need to launch a successful career, all in one platform.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative p-6 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 hover:border-cyan-400/50 transition-all duration-500 hover:scale-105 hover:-translate-y-2 hover:shadow-2xl hover:shadow-cyan-500/20 cursor-pointer overflow-hidden animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`absolute inset-0 bg-linear-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-500`}></div>
                <div className="absolute top-0 right-0 w-24 h-24 bg-linear-to-bl from-cyan-500/30 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className={`w-12 h-12   rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg`}>
                    <feature.icon className="text-blue-400 group-hover:text-cyan-300 transition-colors duration-300" size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="why-choose-us"
        data-scroll-reveal
        className={`w-full py-24 bg-slate-900 transition-all duration-1000 ${
          isVisible('why-choose-us') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-cyan-400 font-semibold text-sm uppercase tracking-wider inline-block mb-4 animate-fade-in">Our Advantage</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-6 animate-fade-in-up animation-delay-100">
              Why <span className="bg-linear-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent animate-gradient-x">Choose Us</span>
            </h2>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto px-4 animate-fade-in-up animation-delay-200">
              We're not just another internship platform. We're your partner in building a successful career.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="group flex items-start gap-4 p-6 bg-linear-to-br from-slate-800/80 to-slate-800/40 backdrop-blur-sm rounded-2xl border border-slate-700 hover:border-cyan-400/50 transition-all duration-500 hover:scale-102 hover:shadow-xl hover:shadow-cyan-500/10 cursor-pointer overflow-hidden animate-fade-in-up"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="absolute inset-0 bg-linear-to-br from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/10 group-hover:to-blue-500/10 transition-all duration-500"></div>
                <div className="w-8 h-8 bg-linear-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center shrink-0 mt-1 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shadow-lg shadow-cyan-500/50 relative z-10">
                  <CheckCircle size={18} className="text-white" />
                </div>
                <p className="text-lg text-gray-200 font-medium group-hover:text-cyan-300 transition-colors duration-300 relative z-10">
                  {benefit}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="cta"
        data-scroll-reveal
        className={`relative w-full py-32 bg-slate-950 text-white overflow-hidden transition-all duration-1000 ${
          isVisible('cta') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px] animate-pulse animation-delay-1000"></div>

        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in-up">
            Ready to Start Your
            <span className="block bg-linear-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent mt-3 animate-gradient-x">
              Professional Journey?
            </span>
          </h2>
          <p className="text-lg md:text-xl text-gray-300 mb-12 max-w-2xl mx-auto px-4 animate-fade-in-up animation-delay-200">
            Don't wait for opportunities to come to you. Take charge of your future and apply for internships that match your passion and skills.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center px-4 animate-fade-in-up animation-delay-400">
            <Link to="/registration" className="group relative w-full sm:w-auto px-10 py-5 bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-xl font-bold text-lg text-white transition-all duration-300 flex items-center justify-center gap-2 shadow-2xl hover:shadow-blue-500/50 hover:scale-105 overflow-hidden">
              <span className="absolute inset-0 bg-linear-to-r from-cyan-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <span className="relative">Apply Now</span>
              <ArrowRight className="relative group-hover:translate-x-1 transition-transform" size={24} />
            </Link>
            <Link to="/contact" className="group w-full sm:w-auto px-10 py-5 bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 hover:border-cyan-400/50 rounded-xl font-bold text-lg text-white transition-all duration-300 shadow-lg hover:scale-105 relative overflow-hidden">
              <span className="absolute inset-0 bg-linear-to-r from-blue-600/10 to-cyan-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <span className="relative">Contact Us</span>
            </Link>
          </div>
          <p className="mt-8 text-gray-400 px-4 animate-fade-in-up animation-delay-600">
            Join 300+ students who have already started their journey
          </p>
        </div>
      </section>

      <footer className="relative bg-black text-gray-300 pt-24 pb-0 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute w-96 h-96 -top-20 -left-20 bg-linear-to-br from-cyan-500/20 to-blue-600/20 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute w-96 h-96 -bottom-20 -right-20 bg-linear-to-tr from-blue-500/20 to-cyan-400/20 blur-[100px] rounded-full animate-pulse animation-delay-1000" />
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 px-4 sm:px-6 lg:px-8 relative z-10 mb-16">

          <div className="relative p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md transition-all duration-500 hover:scale-105 hover:border-cyan-500/30 hover:shadow-[0_0_30px_rgba(6,182,212,0.1)] animate-fade-in-up">
            <Link to="/" className="flex items-center space-x-3 mb-6 group">
              <img src={logo} alt="CodeNova Logo" className="h-12 w-12 object-contain drop-shadow-md group-hover:scale-110 group-hover:rotate-6 transition-all duration-300" />
              <span className="text-3xl font-bold bg-linear-to-r from-cyan-400 to-blue-300 bg-clip-text text-transparent tracking-tight group-hover:brightness-110 transition-all duration-300">
                Code-A-Nova
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-gray-400 mb-4">
              Empowering students with real-world tech internships and expert mentorship.
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <div className="flex items-center gap-2 hover:text-cyan-400 transition-colors duration-300 cursor-pointer group">
                <Mail size={16} className="shrink-0 group-hover:scale-110 transition-transform duration-300" />
                <span className="break-all">codeanova26@gmail.com</span>
              </div>
              <div className="flex items-center gap-2 hover:text-cyan-400 transition-colors duration-300 cursor-pointer group">
                <MapPin size={16} className="shrink-0 group-hover:scale-110 transition-transform duration-300" />
                <span>India</span>
              </div>
            </div>
          </div>

          <div className="relative p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md transition-all duration-500 hover:scale-105 animate-fade-in-up animation-delay-100">
            <h4 className="text-xl font-semibold text-cyan-300 mb-6">Quick Links</h4>
            <ul className="space-y-3 text-sm">
              {quickLinks.map((link, i) => (
                <li key={link.to} className="group">
                  <Link to={link.to} className="flex items-center gap-2 hover:text-cyan-400 hover:translate-x-1 transition-all duration-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-cyan-400 group-hover:scale-110 transition-all"></span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md transition-all duration-500 hover:scale-105 animate-fade-in-up animation-delay-200">
            <h4 className="text-xl font-semibold text-blue-400 mb-6">Legal</h4>
            <ul className="space-y-3 text-sm">
              {legalLinks.map((link) => (
                <li key={link.to} className="group">
                  <Link to={link.to} className="flex items-center gap-2 hover:text-blue-400 hover:translate-x-1 transition-all duration-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-blue-400 group-hover:scale-110 transition-all"></span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md transition-all duration-500 hover:scale-105 animate-fade-in-up animation-delay-300">
            <h4 className="text-xl font-semibold text-cyan-400 mb-6">Follow Us</h4>
            <div className="flex gap-5 mb-6">
              {socialLinks.map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative p-3 rounded-xl border border-white/10 bg-white/5 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/20 hover:rotate-6"
                  aria-label={social.label}
                >
                  <span className="text-gray-400 group-hover:text-cyan-400 group-hover:scale-110 transition-all duration-300">
                    {social.icon}
                  </span>
                </a>
              ))}
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Connect with us on social media for updates, opportunities, and insights.
            </p>
          </div>
        </div>

        <div className="w-full h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />

        <div className="bg-black py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm">
            <p className="text-gray-500 text-center md:text-left">
              © {new Date().getFullYear()} <span className="text-white font-bold">Code-A-Nova</span>. All rights reserved.
            </p>

            <button className="group flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-500/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20">
              <span className="text-gray-400 group-hover:text-white transition-colors">Created by</span>
              <span className="font-bold bg-linear-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent tracking-wide group-hover:brightness-125 transition-all">
                CODE-A-NOVA
              </span>
              <div className="w-8 h-8 rounded-full bg-linear-to-tr from-cyan-500 to-blue-500 flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg shadow-cyan-500/50">
                <Code2 size={16} className="text-white" />
              </div>
            </button>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fade-in-left {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes fade-in-right {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-gradient-x { background-size: 200% 200%; animation: gradient-x 3s ease infinite; }
        .animate-fade-in { animation: fade-in 0.8s ease-out forwards; }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out forwards; opacity: 0; }
        .animate-fade-in-left { animation: fade-in-left 0.8s ease-out forwards; opacity: 0; }
        .animate-fade-in-right { animation: fade-in-right 0.8s ease-out forwards; opacity: 0; }
        .animate-spin-slow { animation: spin-slow 3s linear infinite; }

        .animation-delay-100 { animation-delay: 100ms; }
        .animation-delay-200 { animation-delay: 200ms; }
        .animation-delay-300 { animation-delay: 300ms; }
        .animation-delay-400 { animation-delay: 400ms; }
        .animation-delay-600 { animation-delay: 600ms; }
        .animation-delay-1000 { animation-delay: 1000ms; }

        .hover:scale-102:hover { transform: scale(1.02); }
      `}</style>
    </div>
  );
}

export default Home;
