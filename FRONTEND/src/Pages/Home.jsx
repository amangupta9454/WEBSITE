// import { useState, useEffect } from 'react';
// import { Link } from "react-router-dom";
// import {
//   ArrowRight,
//   Users,
//   Target,
//   Award,
//   Briefcase,
//   Code,
//   Palette,
//   BarChart,
//   Megaphone,
//   DollarSign,
//   CheckCircle,
//   TrendingUp,
//   Clock,
//   Linkedin,
//   Instagram,
//   Mail,
//   MapPin,
//   Code2,
//   ArrowUp,
//   Sparkles,
//   X,
//   FileText,
// } from 'lucide-react';
// import logo from '../assets/LOGO.png';
// import LOGO from '../assets/about.png';

// function Home() {
//   const [visibleSections, setVisibleSections] = useState(new Set());
//   const [scrollDirection, setScrollDirection] = useState('down');
//   const [lastScrollY, setLastScrollY] = useState(0);
//   const [showScrollTop, setShowScrollTop] = useState(false);
//   const [scrambledText, setScrambledText] = useState('');
//   const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
//   const [activeInterns, setActiveInterns] = useState(0);
//   const [successRate, setSuccessRate] = useState(0);
//   const [animationStarted, setAnimationStarted] = useState(false);
//   const [showResumePopup, setShowResumePopup] = useState(false);

//   const targetText = 'Real-World Internships';
//   const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()';

//   useEffect(() => {
//     const savedStats = localStorage.getItem('internshipStats');
//     if (savedStats) {
//       const stats = JSON.parse(savedStats);
//       setActiveInterns(stats.interns);
//       setSuccessRate(stats.rate);
//       setAnimationStarted(true);
//     }
//   }, []);

//   useEffect(() => {
//     const hasSeenPopup = sessionStorage.getItem('hasSeenResumePopup');
//     if (!hasSeenPopup) {
//       setTimeout(() => {
//         setShowResumePopup(true);
//         sessionStorage.setItem('hasSeenResumePopup', 'true');
//       }, 1000);
//     }
//   }, []);

//   useEffect(() => {
//     const handleMouseMove = (e) => {
//       setMousePosition({ x: e.clientX, y: e.clientY });
//     };
//     window.addEventListener('mousemove', handleMouseMove);
//     return () => window.removeEventListener('mousemove', handleMouseMove);
//   }, []);

//   useEffect(() => {
//     const handleScroll = () => {
//       const currentScrollY = window.scrollY;
//       setScrollDirection(currentScrollY > lastScrollY ? 'down' : 'up');
//       setLastScrollY(currentScrollY);
//       setShowScrollTop(currentScrollY > 500);
//     };

//     window.addEventListener('scroll', handleScroll, { passive: true });
//     return () => window.removeEventListener('scroll', handleScroll);
//   }, [lastScrollY]);

//   useEffect(() => {
//     const observerCallback = (entries) => {
//       entries.forEach(entry => {
//         if (entry.isIntersecting) {
//           setVisibleSections(prev => new Set([...prev, entry.target.id]));
//           if (entry.target.id === 'hero') {
//             startScrambleAnimation();
//             if (!animationStarted) {
//               animateNumbers();
//             }
//           }
//         }
//       });
//     };

//     const observer = new IntersectionObserver(observerCallback, {
//       threshold: 0.1,
//       rootMargin: '0px 0px -50px 0px'
//     });

//     const sections = document.querySelectorAll('[data-scroll-reveal]');
//     sections.forEach(section => observer.observe(section));

//     return () => observer.disconnect();
//   }, [animationStarted]);

//   const animateNumbers = () => {
//     if (animationStarted) return;

//     const duration = 2000;
//     const steps = 60;
//     const internIncrement =300 / steps;
//     const rateIncrement = 95 / steps;
//     let currentStep = 0;

//     const interval = setInterval(() => {
//       currentStep++;
//       const newInterns = Math.floor(internIncrement * currentStep);
//       const newRate = Math.floor(rateIncrement * currentStep);
//       setActiveInterns(newInterns);
//       setSuccessRate(newRate);

//       if (currentStep >= steps) {
//         clearInterval(interval);
//         setActiveInterns(300);
//         setSuccessRate(95);
//         localStorage.setItem('internshipStats', JSON.stringify({ interns: 300, rate: 95 }));
//         setAnimationStarted(true);
//       }
//     }, duration / steps);
//   };

//   const startScrambleAnimation = () => {
//     let iteration = 0;
//     const maxIterations = targetText.length;

//     const interval = setInterval(() => {
//       setScrambledText(
//         targetText
//           .split('')
//           .map((char, index) => {
//             if (char === ' ' || char === '-') return char;
//             if (index < iteration) {
//               return targetText[index];
//             }
//             return chars[Math.floor(Math.random() * chars.length)];
//           })
//           .join('')
//       );

//       if (iteration >= maxIterations) {
//         clearInterval(interval);
//         setScrambledText(targetText);
//       }

//       iteration += 1 / 3;
//     }, 50);
//   };

//   const scrollToTop = () => {
//     window.scrollTo({ top: 0, behavior: 'smooth' });
//   };

//   const isVisible = (sectionId) => visibleSections.has(sectionId);

//   const domains = [
//     { icon: Code, name: 'Web Development', delay: 0 },
//     { icon: Palette, name: 'UI/UX Design', delay: 100 },
//     { icon: BarChart, name: 'Data Analytics', delay: 200 },
//     { icon: Megaphone, name: 'C Programming', delay: 300 },
//     { icon: DollarSign, name: 'Python Programming', delay: 400 },
//     { icon: Briefcase, name: 'AI & ML', delay: 500 },
//     { icon: Code, name: 'Programming', delay: 600 },
//   ];

//   const features = [
//     {
//       icon: Award,
//       title: 'Industry Certificates',
//       description: 'Earn certificates that add real value to your resume and LinkedIn profile.',
//       gradient: 'from-blue-500 to-cyan-500'
//     },
//     {
//       icon: Users,
//       title: 'Expert Mentorship',
//       description: 'Learn from industry professionals with years of real-world experience.',
//       gradient: 'from-cyan-500 to-teal-500'
//     },
//     {
//       icon: Target,
//       title: 'Real Projects',
//       description: 'Work on actual projects that solve real business problems.',
//       gradient: 'from-teal-500 to-emerald-500'
//     },
//     {
//       icon: Clock,
//       title: 'Flexible Duration',
//       description: 'Choose internship durations that fit your academic schedule.',
//       gradient: 'from-emerald-500 to-green-500'
//     }
//   ];

//   const benefits = [
//     'Hands-on experience with cutting-edge technologies',
//     'Build a professional portfolio that stands out',
//     'Network with industry leaders and fellow interns',
//     'Get placement assistance and career guidance',
//     'Work remotely from anywhere in the world',
//     'Receive performance-based incentives'
//   ];

//   const quickLinks = [
//     { to: '/', label: 'Home' },
//     { to: '/about', label: 'About' },
//     { to: '/resume-builder', label: 'Resume Builder' },
//     { to: '/service', label: 'Service' },
//     { to: '/contact', label: 'Contact' },
//     { to: '/registration', label: 'Registration' },
//   ];

//   const legalLinks = [
//     { to: '/terms', label: 'Terms & Conditions' },
//     { to: '/verify', label: 'Verify Certificate' },
//     { to: '/refund-policy', label: 'Refund Policy' },
//   ];

//   const socialLinks = [
//     { href: 'https://www.linkedin.com/company/code-a-nova/', icon: <Linkedin size={24} />, label: 'LinkedIn' },
//     { href: 'https://www.instagram.com/codenova31/', icon: <Instagram size={24} />, label: 'Instagram' },
//     { href: 'mailto:codeanova26@gmail.com', icon: <Mail size={24} />, label: 'Email' },
//   ];

//   return (
//     <div className="w-full bg-slate-950 overflow-x-hidden relative">
//       <div
//         className="fixed inset-0 pointer-events-none z-50 opacity-30"
//         style={{
//           background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.15), transparent 40%)`
//         }}
//       />

//       <button
//         onClick={scrollToTop}
//         className={`fixed bottom-6 right-6 z-50 p-4 bg-linear-to-r from-blue-600 to-cyan-600 text-white rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-110 hover:rotate-12 ${
//           showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20 pointer-events-none'
//         }`}
//         aria-label="Scroll to top"
//       >
//         <ArrowUp size={20} />
//       </button>

//       <div
//         className={`fixed bottom-6 right-6 z-50 max-w-sm transition-all duration-500 ${
//           showResumePopup ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20 pointer-events-none'
//         }`}
//       >
//         <div className="relative bg-linear-to-br from-slate-900 to-slate-800 border-2 border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/20 p-6 backdrop-blur-lg overflow-hidden">
//           <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl"></div>
//           <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl"></div>

//           <button
//             onClick={() => setShowResumePopup(false)}
//             className="absolute top-3 right-3 p-1 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all duration-200 z-10"
//             aria-label="Close popup"
//           >
//             <X size={18} />
//           </button>

//           <div className="relative z-10">
//             <div className="flex items-center gap-3 mb-4">
//               <div className="w-12 h-12 bg-linear-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/50">
//                 <FileText className="text-white" size={24} />
//               </div>
//               <div>
//                 <h3 className="text-lg font-bold text-white">Create Your Resume</h3>
//                 <p className="text-sm text-gray-400">ATS-Friendly Builder</p>
//               </div>
//             </div>

//             <p className="text-gray-300 text-sm mb-5 leading-relaxed">
//               Want to create an ATS-friendly resume that gets you noticed by recruiters?
//             </p>

//             <Link
//               to="/resume-builder"
//               onClick={() => setShowResumePopup(false)}
//               className="group relative w-full px-6 py-3 bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2 shadow-xl hover:shadow-cyan-500/50 hover:scale-105 overflow-hidden"
//             >
//               <span className="absolute inset-0 bg-linear-to-r from-blue-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
//               <span className="relative">Create Now</span>
//               <ArrowRight className="relative group-hover:translate-x-1 transition-transform" size={18} />
//             </Link>
//           </div>
//         </div>
//       </div>

//       <section
//         id="hero"
//         data-scroll-reveal
//         className={`relative w-full min-h-screen flex items-center justify-center text-white px-4 sm:px-6 lg:px-8 transition-all duration-1000 ${
//           isVisible('hero') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
//         }`}
//       >
//         <div className="absolute inset-0 bg-linear-to-b from-blue-900/20 via-slate-950 to-slate-950"></div>
//         <div className="absolute top-20 right-20 w-125 h-125 bg-blue-500/20 rounded-full blur-[120px] animate-pulse"></div>
//         <div className="absolute bottom-20 left-20 w-125 h-125 bg-cyan-500/20 rounded-full blur-[120px] animate-pulse animation-delay-1000"></div>

//         <div className="absolute inset-0 overflow-hidden">
//           <div className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-float" style={{ top: '20%', left: '10%', animationDelay: '0s' }}></div>
//           <div className="absolute w-1 h-1 bg-blue-400 rounded-full animate-float" style={{ top: '60%', left: '80%', animationDelay: '1s' }}></div>
//           <div className="absolute w-1 h-1 bg-cyan-300 rounded-full animate-float" style={{ top: '40%', right: '15%', animationDelay: '2s' }}></div>
//         </div>

//         <div className="relative z-10 w-full max-w-7xl mx-auto py-32 text-center">
//           <div className="inline-block mb-6 px-6 py-3 bg-linear-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 rounded-full backdrop-blur-sm animate-fade-in shadow-lg shadow-blue-500/20 hover:shadow-cyan-500/30 transition-all duration-300 cursor-pointer group hover:scale-105">
//             <span className="text-blue-300 text-sm font-medium flex items-center gap-2">
//               <Sparkles size={16} className="animate-spin-slow" />
//               Launch Your Career Today
//             </span>
//           </div>

//           <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight px-4 animate-fade-in-up animation-delay-200">
//             Transform Your Future with
//             <span className="block bg-linear-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent mt-3 font-serif tracking-tight min-h-[1.2em] animate-gradient-x">
//               {scrambledText || targetText}
//             </span>
//           </h1>

//           <p className="text-lg md:text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed px-4 animate-fade-in-up animation-delay-400">
//             Bridge the gap between academic learning and industry requirements.
//             Join thousands of students gaining practical experience with top companies.
//           </p>

//           <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20 px-4 animate-fade-in-up animation-delay-600">
//             <Link to="/registration" className="group relative w-full sm:w-auto px-8 py-4 bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-lg font-semibold text-lg text-white transition-all duration-300 flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl hover:shadow-blue-500/50 hover:scale-105 overflow-hidden">
//               <span className="absolute inset-0 bg-linear-to-r from-cyan-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
//               <span className="relative">Get Started Now</span>
//               <ArrowRight className="relative group-hover:translate-x-1 transition-transform" size={20} />
//             </Link>
//             <Link to="/service" className="group w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 border-2 border-slate-700 hover:border-blue-400/50 rounded-lg font-semibold text-lg text-white transition-all duration-300 shadow-lg hover:scale-105 relative overflow-hidden">
//               <span className="absolute inset-0 bg-linear-to-r from-blue-600/10 to-cyan-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
//               <span className="relative">Explore Opportunities</span>
//             </Link>
//           </div>

//           <div className="grid grid-cols-2 md:grid-cols-3 gap-8 max-w-4xl mx-auto px-4">
//             {[
//               { number: activeInterns, suffix: '+', label: 'Active Interns' },
//               { number: successRate, suffix: '%', label: 'Success Rate' },
//               { number: 1, suffix: '+', label: 'Countries' }
//             ].map((stat, index) => (
//               <div
//                 key={index}
//                 className="group relative p-6 bg-linear-to-br from-slate-900/80 to-slate-800/80 rounded-2xl backdrop-blur-sm border border-slate-700 hover:border-cyan-400/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/20 animate-fade-in-up cursor-pointer overflow-hidden"
//                 style={{ animationDelay: `${900 + index * 100}ms` }}
//               >
//                 <div className="absolute inset-0 bg-linear-to-br from-blue-500/0 to-cyan-500/0 group-hover:from-blue-500/10 group-hover:to-cyan-500/10 rounded-2xl transition-all duration-500"></div>
//                 <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
//                 <div className="relative z-10">
//                   <div className="text-4xl font-bold bg-linear-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300 origin-left">
//                     {stat.number}{stat.suffix}
//                   </div>
//                   <div className="text-gray-400 text-sm">{stat.label}</div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       <section
//         id="what-we-do"
//         data-scroll-reveal
//         className={`w-full py-24 bg-slate-900 transition-all duration-1000 ${
//           isVisible('what-we-do') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
//         }`}
//       >
//         <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-16">
//             <span className="text-blue-400 font-semibold text-sm uppercase tracking-wider animate-fade-in">Our Mission</span>
//             <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-6 animate-fade-in-up animation-delay-100">
//               What We <span className="bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-x">Do</span>
//             </h2>
//             <p className="text-lg text-gray-300 max-w-3xl mx-auto px-4 animate-fade-in-up animation-delay-200">
//               We connect ambitious students with leading companies, providing structured internship
//               programs that build skills, confidence, and career readiness.
//             </p>
//           </div>

//           <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
//             {[
//               {
//                 icon: Target,
//                 title: 'Match & Connect',
//                 description: 'We match your skills and interests with the perfect internship opportunities from our network of partner companies.',
//                 color: 'blue'
//               },
//               {
//                 icon: Award,
//                 title: 'Train & Develop',
//                 description: 'Comprehensive training programs ensure you have the skills needed to excel in your chosen field.',
//                 color: 'cyan'
//               },
//               {
//                 icon: TrendingUp,
//                 title: 'Guide & Support',
//                 description: 'Continuous mentorship and support throughout your journey, from application to completion.',
//                 color: 'teal'
//               }
//             ].map((item, index) => (
//               <div
//                 key={index}
//                 className="group relative p-8 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 hover:border-blue-400/50 transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl hover:shadow-blue-500/20 animate-fade-in-up cursor-pointer overflow-hidden"
//                 style={{ animationDelay: `${index * 150}ms` }}
//               >
//                 <div className="absolute inset-0 bg-linear-to-br from-blue-500/0 to-cyan-500/0 group-hover:from-blue-500/10 group-hover:to-cyan-500/10 rounded-2xl transition-all duration-500"></div>
//                 <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
//                 <div className="relative z-10">
//                   <div className={`w-16 h-16 bg-linear-to-br from-${item.color}-500/20 to-${item.color}-400/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg`}>
//                     <item.icon className={`text-${item.color}-400`} size={32} />
//                   </div>
//                   <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-cyan-400 transition-colors duration-300">
//                     {item.title}
//                   </h3>
//                   <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors duration-300">{item.description}</p>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       <section
//         id="what-we-are"
//         data-scroll-reveal
//         className={`relative w-full py-24 bg-slate-950 transition-all duration-1000 ${
//           isVisible('what-we-are') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
//         }`}
//       >
//         <div className="w-full px-6 sm:px-8 lg:px-16 relative z-10">
//           <div className="grid md:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
//             <div className="animate-fade-in-left">
//               <span className="text-blue-400 font-semibold text-sm uppercase tracking-wider inline-block mb-4 animate-fade-in">About Us</span>
//               <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-6 animate-fade-in-up animation-delay-100">
//                 What We <span className="bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Are</span>
//               </h2>
//               <p className="text-lg text-gray-300 mb-6 leading-relaxed animate-fade-in-up animation-delay-200">
//                 We are a premier internship platform dedicated to empowering the next generation
//                 of professionals. Founded by industry veterans who understand the challenges students
//                 face in transitioning from education to employment.
//               </p>
//               <p className="text-lg text-gray-300 mb-8 leading-relaxed animate-fade-in-up animation-delay-300">
//                 Our platform serves as a bridge, connecting talented students with innovative companies
//                 seeking fresh perspectives. We believe in practical learning, skill development, and
//                 creating opportunities that shape successful careers.
//               </p>
//               <div className="space-y-4">
//                 {[
//                   'Student-centric approach',
//                   'Industry-aligned curriculum',
//                   'Verified company partnerships',
//                   'Career growth focus'
//                 ].map((item, index) => (
//                   <div
//                     key={index}
//                     className="flex items-center gap-3 group animate-fade-in-up cursor-pointer"
//                     style={{ animationDelay: `${400 + index * 100}ms` }}
//                   >
//                     <div className="w-8 h-8 bg-linear-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shadow-lg shadow-cyan-500/50">
//                       <CheckCircle size={16} className="text-white" />
//                     </div>
//                     <span className="text-gray-200 font-medium group-hover:text-cyan-400 transition-colors duration-300">{item}</span>
//                   </div>
//                 ))}
//               </div>
//             </div>
//             <div className="relative h-full animate-fade-in-right">
//               <div className="relative  rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center  transition-all duration-700 group">
//                 <img
//                   src={LOGO}
//                   alt="Logo"
//                   className="relative w-full h-full object-contain p-12 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
//                 />
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       <section
//         id="domains"
//         data-scroll-reveal
//         className={`w-full py-24 bg-slate-900 transition-all duration-1000 ${
//           isVisible('domains') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
//         }`}
//       >
//         <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-16">
//             <span className="text-blue-400 font-semibold text-sm uppercase tracking-wider inline-block mb-4 animate-fade-in">Specializations</span>
//             <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-6 animate-fade-in-up animation-delay-100">
//               Our <span className="bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-x">Domains</span>
//             </h2>
//             <p className="text-lg text-gray-300 max-w-3xl mx-auto px-4 animate-fade-in-up animation-delay-200">
//               Choose from a wide range of domains and kickstart your career in the field you're passionate about.
//             </p>
//           </div>

//           <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
//             {domains.map((domain, index) => (
//               <div
//                 key={index}
//                 className="group relative p-8 bg-linear-to-br from-slate-800/80 to-slate-800/40 backdrop-blur-sm rounded-2xl border border-slate-700 hover:border-cyan-400/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-cyan-500/20 cursor-pointer overflow-hidden animate-fade-in-up"
//                 style={{ animationDelay: `${domain.delay}ms` }}
//               >
//                 <div className="absolute inset-0 bg-linear-to-br from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/10 group-hover:to-blue-500/10 transition-all duration-500"></div>
//                 <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-blue-500/20 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
//                 <div className="relative z-10">
//                   <div className="w-14 h-14 bg-linear-to-br from-blue-500/30 to-cyan-500/30 group-hover:from-cyan-500/40 group-hover:to-teal-500/40 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg">
//                     <domain.icon className="text-cyan-400 group-hover:text-teal-300 transition-colors duration-300" size={28} />
//                   </div>
//                   <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors duration-300">
//                     {domain.name}
//                   </h3>
//                   <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
//                     Gain hands-on experience and master the latest tools and technologies.
//                   </p>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       <section
//         id="features"
//         data-scroll-reveal
//         className={`relative w-full py-24 bg-slate-950 transition-all duration-1000 ${
//           isVisible('features') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
//         }`}
//       >
//         <div className="absolute inset-0 bg-linear-to-b from-cyan-900/5 via-transparent to-transparent pointer-events-none"></div>
//         <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
//           <div className="text-center mb-16">
//             <span className="text-cyan-400 font-semibold text-sm uppercase tracking-wider inline-block mb-4 animate-fade-in">What You Get</span>
//             <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-6 animate-fade-in-up animation-delay-100">
//               Our <span className="bg-linear-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent animate-gradient-x">Features</span>
//             </h2>
//             <p className="text-lg text-gray-300 max-w-3xl mx-auto px-4 animate-fade-in-up animation-delay-200">
//               Everything you need to launch a successful career, all in one platform.
//             </p>
//           </div>

//           <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
//             {features.map((feature, index) => (
//               <div
//                 key={index}
//                 className="group relative p-6 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 hover:border-cyan-400/50 transition-all duration-500 hover:scale-105 hover:-translate-y-2 hover:shadow-2xl hover:shadow-cyan-500/20 cursor-pointer overflow-hidden animate-fade-in-up"
//                 style={{ animationDelay: `${index * 100}ms` }}
//               >
//                 <div className={`absolute inset-0 bg-linear-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-500`}></div>
//                 <div className="absolute top-0 right-0 w-24 h-24 bg-linear-to-bl from-cyan-500/30 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
//                 <div className="relative z-10">
//                   <div className={`w-12 h-12   rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg`}>
//                     <feature.icon className="text-blue-400 group-hover:text-cyan-300 transition-colors duration-300" size={24} />
//                   </div>
//                   <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors duration-300">
//                     {feature.title}
//                   </h3>
//                   <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
//                     {feature.description}
//                   </p>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       <section
//         id="why-choose-us"
//         data-scroll-reveal
//         className={`w-full py-24 bg-slate-900 transition-all duration-1000 ${
//           isVisible('why-choose-us') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
//         }`}
//       >
//         <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-16">
//             <span className="text-cyan-400 font-semibold text-sm uppercase tracking-wider inline-block mb-4 animate-fade-in">Our Advantage</span>
//             <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-6 animate-fade-in-up animation-delay-100">
//               Why <span className="bg-linear-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent animate-gradient-x">Choose Us</span>
//             </h2>
//             <p className="text-lg text-gray-300 max-w-3xl mx-auto px-4 animate-fade-in-up animation-delay-200">
//               We're not just another internship platform. We're your partner in building a successful career.
//             </p>
//           </div>

//           <div className="grid sm:grid-cols-2 gap-6 max-w-5xl mx-auto">
//             {benefits.map((benefit, index) => (
//               <div
//                 key={index}
//                 className="group flex items-start gap-4 p-6 bg-linear-to-br from-slate-800/80 to-slate-800/40 backdrop-blur-sm rounded-2xl border border-slate-700 hover:border-cyan-400/50 transition-all duration-500 hover:scale-102 hover:shadow-xl hover:shadow-cyan-500/10 cursor-pointer overflow-hidden animate-fade-in-up"
//                 style={{ animationDelay: `${index * 80}ms` }}
//               >
//                 <div className="absolute inset-0 bg-linear-to-br from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/10 group-hover:to-blue-500/10 transition-all duration-500"></div>
//                 <div className="w-8 h-8 bg-linear-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center shrink-0 mt-1 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shadow-lg shadow-cyan-500/50 relative z-10">
//                   <CheckCircle size={18} className="text-white" />
//                 </div>
//                 <p className="text-lg text-gray-200 font-medium group-hover:text-cyan-300 transition-colors duration-300 relative z-10">
//                   {benefit}
//                 </p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       <section
//         id="resume-builder-cta"
//         data-scroll-reveal
//         className={`relative w-full py-24 bg-slate-950 overflow-hidden transition-all duration-1000 ${
//           isVisible('resume-builder-cta') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
//         }`}
//       >
//         <div className="absolute inset-0 bg-linear-to-br from-cyan-500/5 via-transparent to-blue-500/5"></div>
//         <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] animate-pulse"></div>
//         <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] animate-pulse animation-delay-1000"></div>

//         <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
//           <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 border border-cyan-500/20 shadow-2xl shadow-cyan-500/10">
//             <div className="absolute top-0 right-0 w-1/2 h-full bg-linear-to-bl from-cyan-500/10 via-transparent to-transparent"></div>
//             <div className="absolute bottom-0 left-0 w-1/2 h-full bg-linear-to-tr from-blue-500/10 via-transparent to-transparent"></div>
            
//             <div className="absolute top-10 right-20 w-40 h-40 border border-cyan-500/20 rounded-full animate-pulse"></div>
//             <div className="absolute bottom-10 right-40 w-20 h-20 border border-blue-500/20 rounded-full animate-pulse animation-delay-1000"></div>
            
//             <div className="grid md:grid-cols-2 gap-12 items-center p-8 md:p-16 relative z-10">
//               <div className="space-y-6 animate-fade-in-left">
//                 <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full backdrop-blur-sm">
//                   <Sparkles size={16} className="text-cyan-400 animate-spin-slow" />
//                   <span className="text-cyan-400 text-sm font-semibold">Free Tool</span>
//                 </div>
                
//                 <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
//                   Build Your Perfect
//                   <span className="block bg-linear-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent mt-2 animate-gradient-x">
//                     ATS-Friendly Resume
//                   </span>
//                 </h2>
                
//                 <p className="text-lg text-gray-300 leading-relaxed">
//                   Create a professional resume that gets past Applicant Tracking Systems and lands you interviews. 
//                   Our AI-powered builder ensures your resume is optimized for both robots and recruiters.
//                 </p>
                
//                 <div className="space-y-3 pt-4">
//                   {[
//                     'ATS-Optimized Templates',
//                     'Smart Keyword Suggestions',
//                     'Instant PDF Download',
//                     'Completely Free Forever'
//                   ].map((feature, index) => (
//                     <div
//                       key={index}
//                       className="flex items-center gap-3 group animate-fade-in-up"
//                       style={{ animationDelay: `${index * 100}ms` }}
//                     >
//                       <div className="w-6 h-6 bg-linear-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shadow-lg shadow-cyan-500/50">
//                         <CheckCircle size={14} className="text-white" />
//                       </div>
//                       <span className="text-gray-200 font-medium group-hover:text-cyan-400 transition-colors duration-300">
//                         {feature}
//                       </span>
//                     </div>
//                   ))}
//                 </div>
                
//                 <div className="pt-6">
//                   <Link
//                     to="/resume-builder"
//                     className="group inline-flex items-center gap-3 px-8 py-4 bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl font-bold text-lg text-white transition-all duration-300 shadow-2xl shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105 overflow-hidden relative"
//                   >
//                     <span className="absolute inset-0 bg-linear-to-r from-blue-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
//                     <FileText className="relative" size={24} />
//                     <span className="relative">Create Resume Now</span>
//                     <ArrowRight className="relative group-hover:translate-x-1 transition-transform" size={24} />
//                   </Link>
//                   <p className="mt-4 text-sm text-gray-400">
//                     No credit card required • No hidden fees • Start in seconds
//                   </p>
//                 </div>
//               </div>
              
//               <div className="relative h-full min-h-100 hidden md:block animate-fade-in-right">
//                 <div className="absolute inset-0 flex items-center justify-center">
//                   <div className="relative w-full max-w-md">
//                     <div className="absolute -top-4 -right-4 w-72 h-72 bg-linear-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
                    
//                     <div className="relative space-y-4">
//                       <div className="group p-6 bg-slate-800/80 backdrop-blur-sm border border-cyan-500/30 rounded-2xl shadow-xl hover:shadow-cyan-500/30 transition-all duration-500 hover:-translate-y-1 cursor-pointer">
//                         <div className="flex items-start gap-4">
//                           <div className="w-12 h-12 bg-linear-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
//                             <FileText size={24} className="text-white" />
//                           </div>
//                           <div className="flex-1">
//                             <div className="h-3 bg-cyan-500/30 rounded-full w-3/4 mb-2"></div>
//                             <div className="h-2 bg-slate-600/50 rounded-full w-full mb-2"></div>
//                             <div className="h-2 bg-slate-600/50 rounded-full w-5/6"></div>
//                           </div>
//                         </div>
//                       </div>
                      
//                       <div className="group p-6 bg-slate-800/80 backdrop-blur-sm border border-blue-500/30 rounded-2xl shadow-xl hover:shadow-blue-500/30 transition-all duration-500 hover:-translate-y-1 cursor-pointer animation-delay-200">
//                         <div className="flex items-start gap-4">
//                           <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
//                             <Award size={24} className="text-white" />
//                           </div>
//                           <div className="flex-1">
//                             <div className="h-3 bg-blue-500/30 rounded-full w-2/3 mb-2"></div>
//                             <div className="h-2 bg-slate-600/50 rounded-full w-full mb-2"></div>
//                             <div className="h-2 bg-slate-600/50 rounded-full w-4/5"></div>
//                           </div>
//                         </div>
//                       </div>
                      
//                       <div className="group p-6 bg-slate-800/80 backdrop-blur-sm border border-cyan-500/30 rounded-2xl shadow-xl hover:shadow-cyan-500/30 transition-all duration-500 hover:-translate-y-1 cursor-pointer animation-delay-400">
//                         <div className="flex items-start gap-4">
//                           <div className="w-12 h-12 bg-linear-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
//                             <Briefcase size={24} className="text-white" />
//                           </div>
//                           <div className="flex-1">
//                             <div className="h-3 bg-cyan-500/30 rounded-full w-4/5 mb-2"></div>
//                             <div className="h-2 bg-slate-600/50 rounded-full w-full mb-2"></div>
//                             <div className="h-2 bg-slate-600/50 rounded-full w-3/4"></div>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
                    
//                     <div className="absolute -bottom-2 -right-2 px-4 py-2 bg-linear-to-r from-green-500 to-emerald-500 rounded-full shadow-lg shadow-green-500/50 animate-bounce">
//                       <span className="text-white text-sm font-bold flex items-center gap-1">
//                         <CheckCircle size={16} />
//                         ATS Ready
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       <section
//         id="cta"
//         data-scroll-reveal
//         className={`relative w-full py-32 bg-slate-950 text-white overflow-hidden transition-all duration-1000 ${
//           isVisible('cta') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
//         }`}
//       >
//         <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] animate-pulse"></div>
//         <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px] animate-pulse animation-delay-1000"></div>

//         <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
//           <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in-up">
//             Ready to Start Your
//             <span className="block bg-linear-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent mt-3 animate-gradient-x">
//               Professional Journey?
//             </span>
//           </h2>
//           <p className="text-lg md:text-xl text-gray-300 mb-12 max-w-2xl mx-auto px-4 animate-fade-in-up animation-delay-200">
//             Don't wait for opportunities to come to you. Take charge of your future and apply for internships that match your passion and skills.
//           </p>
//           <div className="flex flex-col sm:flex-row gap-4 justify-center px-4 animate-fade-in-up animation-delay-400">
//             <Link to="/registration" className="group relative w-full sm:w-auto px-10 py-5 bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-xl font-bold text-lg text-white transition-all duration-300 flex items-center justify-center gap-2 shadow-2xl hover:shadow-blue-500/50 hover:scale-105 overflow-hidden">
//               <span className="absolute inset-0 bg-linear-to-r from-cyan-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
//               <span className="relative">Apply Now</span>
//               <ArrowRight className="relative group-hover:translate-x-1 transition-transform" size={24} />
//             </Link>
//             <Link to="/contact" className="group w-full sm:w-auto px-10 py-5 bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 hover:border-cyan-400/50 rounded-xl font-bold text-lg text-white transition-all duration-300 shadow-lg hover:scale-105 relative overflow-hidden">
//               <span className="absolute inset-0 bg-linear-to-r from-blue-600/10 to-cyan-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
//               <span className="relative">Contact Us</span>
//             </Link>
//           </div>
//           <p className="mt-8 text-gray-400 px-4 animate-fade-in-up animation-delay-600">
//             Join 300+ students who have already started their journey
//           </p>
//         </div>
//       </section>

//       <footer className="relative bg-black text-gray-300 pt-24 pb-0 overflow-hidden">
//         <div className="absolute inset-0 -z-10">
//           <div className="absolute w-96 h-96 -top-20 -left-20 bg-linear-to-br from-cyan-500/20 to-blue-600/20 blur-[120px] rounded-full animate-pulse" />
//           <div className="absolute w-96 h-96 -bottom-20 -right-20 bg-linear-to-tr from-blue-500/20 to-cyan-400/20 blur-[100px] rounded-full animate-pulse animation-delay-1000" />
//         </div>

//         <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 px-4 sm:px-6 lg:px-8 relative z-10 mb-16">

//           <div className="relative p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md transition-all duration-500 hover:scale-105 hover:border-cyan-500/30 hover:shadow-[0_0_30px_rgba(6,182,212,0.1)] animate-fade-in-up">
//             <Link to="/" className="flex items-center space-x-3 mb-6 group">
//               <img src={logo} alt="CodeNova Logo" className="h-12 w-12 object-contain drop-shadow-md group-hover:scale-110 group-hover:rotate-6 transition-all duration-300" />
//               <span className="text-3xl font-bold bg-linear-to-r from-cyan-400 to-blue-300 bg-clip-text text-transparent tracking-tight group-hover:brightness-110 transition-all duration-300">
//                 Code-A-Nova
//               </span>
//             </Link>
//             <p className="text-sm leading-relaxed text-gray-400 mb-4">
//               Empowering students with real-world tech internships and expert mentorship.
//             </p>
//             <div className="space-y-2 text-sm text-gray-500">
//               <div className="flex items-center gap-2 hover:text-cyan-400 transition-colors duration-300 cursor-pointer group">
//                 <Mail size={16} className="shrink-0 group-hover:scale-110 transition-transform duration-300" />
//                 <span className="break-all">codeanova26@gmail.com</span>
//               </div>
//               <div className="flex items-center gap-2 hover:text-cyan-400 transition-colors duration-300 cursor-pointer group">
//                 <MapPin size={16} className="shrink-0 group-hover:scale-110 transition-transform duration-300" />
//                 <span>India</span>
//               </div>
//             </div>
//           </div>

//           <div className="relative p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md transition-all duration-500 hover:scale-105 animate-fade-in-up animation-delay-100">
//             <h4 className="text-xl font-semibold text-cyan-300 mb-6">Quick Links</h4>
//             <ul className="space-y-3 text-sm">
//               {quickLinks.map((link, i) => (
//                 <li key={link.to} className="group">
//                   <Link to={link.to} className="flex items-center gap-2 hover:text-cyan-400 hover:translate-x-1 transition-all duration-300">
//                     <span className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-cyan-400 group-hover:scale-110 transition-all"></span>
//                     {link.label}
//                   </Link>
//                 </li>
//               ))}
//             </ul>
//           </div>

//           <div className="relative p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md transition-all duration-500 hover:scale-105 animate-fade-in-up animation-delay-200">
//             <h4 className="text-xl font-semibold text-blue-400 mb-6">Legal</h4>
//             <ul className="space-y-3 text-sm">
//               {legalLinks.map((link) => (
//                 <li key={link.to} className="group">
//                   <Link to={link.to} className="flex items-center gap-2 hover:text-blue-400 hover:translate-x-1 transition-all duration-300">
//                     <span className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-blue-400 group-hover:scale-110 transition-all"></span>
//                     {link.label}
//                   </Link>
//                 </li>
//               ))}
//             </ul>
//           </div>

//           <div className="relative p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md transition-all duration-500 hover:scale-105 animate-fade-in-up animation-delay-300">
//             <h4 className="text-xl font-semibold text-cyan-400 mb-6">Follow Us</h4>
//             <div className="flex gap-5 mb-6">
//               {socialLinks.map((social, i) => (
//                 <a
//                   key={i}
//                   href={social.href}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="group relative p-3 rounded-xl border border-white/10 bg-white/5 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/20 hover:rotate-6"
//                   aria-label={social.label}
//                 >
//                   <span className="text-gray-400 group-hover:text-cyan-400 group-hover:scale-110 transition-all duration-300">
//                     {social.icon}
//                   </span>
//                 </a>
//               ))}
//             </div>
//             <p className="text-sm text-gray-500 leading-relaxed">
//               Connect with us on social media for updates, opportunities, and insights.
//             </p>
//           </div>
//         </div>

//         <div className="w-full h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />

//         <div className="bg-black py-8 px-4 sm:px-6 lg:px-8">
//           <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm">
//             <p className="text-gray-500 text-center md:text-left">
//               © {new Date().getFullYear()} <span className="text-white font-bold">Code-A-Nova</span>. All rights reserved.
//             </p>

//             <button className="group flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-500/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20">
//               <span className="text-gray-400 group-hover:text-white transition-colors">Created by</span>
//               <span className="font-bold bg-linear-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent tracking-wide group-hover:brightness-125 transition-all">
//                 CODE-A-NOVA
//               </span>
//               <div className="w-8 h-8 rounded-full bg-linear-to-tr from-cyan-500 to-blue-500 flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg shadow-cyan-500/50">
//                 <Code2 size={16} className="text-white" />
//               </div>
//             </button>
//           </div>
//         </div>
//       </footer>

//       <style>{`
//         @keyframes float {
//           0%, 100% { transform: translateY(0px); }
//           50% { transform: translateY(-20px); }
//         }

//         @keyframes gradient-x {
//           0%, 100% { background-position: 0% 50%; }
//           50% { background-position: 100% 50%; }
//         }

//         @keyframes fade-in {
//           from { opacity: 0; }
//           to { opacity: 1; }
//         }

//         @keyframes fade-in-up {
//           from { opacity: 0; transform: translateY(30px); }
//           to { opacity: 1; transform: translateY(0); }
//         }

//         @keyframes fade-in-left {
//           from { opacity: 0; transform: translateX(-30px); }
//           to { opacity: 1; transform: translateX(0); }
//         }

//         @keyframes fade-in-right {
//           from { opacity: 0; transform: translateX(30px); }
//           to { opacity: 1; transform: translateX(0); }
//         }

//         @keyframes spin-slow {
//           from { transform: rotate(0deg); }
//           to { transform: rotate(360deg); }
//         }

//         .animate-float { animation: float 3s ease-in-out infinite; }
//         .animate-gradient-x { background-size: 200% 200%; animation: gradient-x 3s ease infinite; }
//         .animate-fade-in { animation: fade-in 0.8s ease-out forwards; }
//         .animate-fade-in-up { animation: fade-in-up 0.8s ease-out forwards; opacity: 0; }
//         .animate-fade-in-left { animation: fade-in-left 0.8s ease-out forwards; opacity: 0; }
//         .animate-fade-in-right { animation: fade-in-right 0.8s ease-out forwards; opacity: 0; }
//         .animate-spin-slow { animation: spin-slow 3s linear infinite; }

//         .animation-delay-100 { animation-delay: 100ms; }
//         .animation-delay-200 { animation-delay: 200ms; }
//         .animation-delay-300 { animation-delay: 300ms; }
//         .animation-delay-400 { animation-delay: 400ms; }
//         .animation-delay-600 { animation-delay: 600ms; }
//         .animation-delay-1000 { animation-delay: 1000ms; }

//         .hover:scale-102:hover { transform: scale(1.02); }
//       `}</style>
//     </div>
//   );
// }

// export default Home;
import { useState, useEffect, useRef, useCallback } from 'react';
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
  X,
  FileText,
  Zap,
  Globe,
  Shield,
} from 'lucide-react';
import logo from '../assets/LOGO.png';
import LOGO from '../assets/about.png';

const TiltCard = ({ children, className = '', style = {}, intensity = 12 }) => {
  const cardRef = useRef(null);
  const rafRef = useRef(null);
  const glowRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const rotX = ((y - cy) / cy) * -intensity;
      const rotY = ((x - cx) / cx) * intensity;
      const glowX = (x / rect.width) * 100;
      const glowY = (y / rect.height) * 100;

      cardRef.current.style.transform = `perspective(1200px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(12px)`;
      if (glowRef.current) {
        glowRef.current.style.background = `radial-gradient(circle at ${glowX}% ${glowY}%, rgba(6,182,212,0.18) 0%, transparent 60%)`;
        glowRef.current.style.opacity = '1';
      }
    });
  }, [intensity]);

  const handleMouseLeave = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (cardRef.current) {
      cardRef.current.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
    }
    if (glowRef.current) glowRef.current.style.opacity = '0';
  }, []);

  return (
    <div
      ref={cardRef}
      className={className}
      style={{ ...style, willChange: 'transform', transformStyle: 'preserve-3d', transition: 'transform 0.18s ease-out' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={glowRef}
        style={{
          position: 'absolute', inset: 0, borderRadius: 'inherit',
          opacity: 0, transition: 'opacity 0.3s ease', pointerEvents: 'none', zIndex: 1,
        }}
      />
      {children}
    </div>
  );
};

const useScrollReveal = (threshold = 0.12) => {
  const ref = useRef(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setRevealed(true); },
      { threshold, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, revealed];
};

const RevealBlock = ({ children, direction = 'up', delay = 0, className = '', threshold = 0.12 }) => {
  const [ref, revealed] = useScrollReveal(threshold);

  const initial = {
    up: 'opacity-0 translate-y-16',
    down: 'opacity-0 -translate-y-16',
    left: 'opacity-0 -translate-x-16',
    right: 'opacity-0 translate-x-16',
    scale: 'opacity-0 scale-75',
    fade: 'opacity-0',
    'scale-up': 'opacity-0 translate-y-8 scale-90',
  }[direction] || 'opacity-0 translate-y-16';

  return (
    <div
      ref={ref}
      className={`transition-all duration-900 ease-out ${revealed ? 'opacity-100 translate-y-0 translate-x-0 scale-100' : initial} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

function Home() {
  const [visibleSections, setVisibleSections] = useState(new Set());
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scrambledText, setScrambledText] = useState('');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [activeInterns, setActiveInterns] = useState(0);
  const [successRate, setSuccessRate] = useState(0);
  const [animationStarted, setAnimationStarted] = useState(false);
  const [showResumePopup, setShowResumePopup] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

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
    const hasSeenPopup = sessionStorage.getItem('hasSeenResumePopup');
    if (!hasSeenPopup) {
      setTimeout(() => {
        setShowResumePopup(true);
        sessionStorage.setItem('hasSeenResumePopup', 'true');
      }, 1000);
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => setMousePosition({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    let lastScrollY = 0;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);
      setShowScrollTop(currentScrollY > 500);
      lastScrollY = currentScrollY;

      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? (currentScrollY / docHeight) * 100 : 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observerCallback = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setVisibleSections(prev => new Set([...prev, entry.target.id]));
          if (entry.target.id === 'hero') {
            startScrambleAnimation();
            if (!animationStarted) animateNumbers();
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, { threshold: 0.1 });
    const sections = document.querySelectorAll('[data-scroll-reveal]');
    sections.forEach(s => observer.observe(s));
    return () => observer.disconnect();
  }, [animationStarted]);

  const animateNumbers = () => {
    if (animationStarted) return;
    const duration = 2000;
    const steps = 60;
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      setActiveInterns(Math.floor((300 / steps) * currentStep));
      setSuccessRate(Math.floor((95 / steps) * currentStep));
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
    const interval = setInterval(() => {
      setScrambledText(
        targetText.split('').map((char, index) => {
          if (char === ' ' || char === '-') return char;
          if (index < iteration) return targetText[index];
          return chars[Math.floor(Math.random() * chars.length)];
        }).join('')
      );
      if (iteration >= targetText.length) { clearInterval(interval); setScrambledText(targetText); }
      iteration += 1 / 3;
    }, 50);
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const isVisible = (id) => visibleSections.has(id);

  const domains = [
    { icon: Code, name: 'Web Development', desc: 'Build modern, scalable web applications with industry-standard tools.' },
    { icon: Palette, name: 'UI/UX Design', desc: 'Craft beautiful, intuitive experiences that delight users.' },
    { icon: BarChart, name: 'Data Analytics', desc: 'Transform raw data into actionable business insights.' },
    { icon: Megaphone, name: 'C Programming', desc: 'Master the language that powers operating systems and hardware.' },
    { icon: DollarSign, name: 'Python Programming', desc: 'Automate, analyze, and build with the most versatile language.' },
    { icon: Briefcase, name: 'AI & ML', desc: 'Build intelligent systems and shape the future of technology.' },
  ];

  const features = [
    { icon: Award, title: 'Industry Certificates', description: 'Earn certificates that add real value to your resume and LinkedIn profile.', gradient: 'from-blue-500 to-cyan-500' },
    { icon: Users, title: 'Expert Mentorship', description: 'Learn from industry professionals with years of real-world experience.', gradient: 'from-cyan-500 to-teal-500' },
    { icon: Target, title: 'Real Projects', description: 'Work on actual projects that solve real business problems.', gradient: 'from-teal-500 to-emerald-500' },
    { icon: Clock, title: 'Flexible Duration', description: 'Choose internship durations that fit your academic schedule.', gradient: 'from-emerald-500 to-blue-500' },
  ];

  const benefits = [
    'Hands-on experience with cutting-edge technologies',
    'Build a professional portfolio that stands out',
    'Network with industry leaders and fellow interns',
    'Get placement assistance and career guidance',
    'Work remotely from anywhere in the world',
    'Receive performance-based incentives',
  ];

  const quickLinks = [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'About' },
    { to: '/resume-builder', label: 'Resume Builder' },
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
    { href: 'https://www.linkedin.com/company/code-a-nova/', icon: <Linkedin size={22} />, label: 'LinkedIn' },
    { href: 'https://www.instagram.com/codenova31/', icon: <Instagram size={22} />, label: 'Instagram' },
    { href: 'mailto:codeanova26@gmail.com', icon: <Mail size={22} />, label: 'Email' },
  ];

  const heroParallaxY = scrollY * 0.35;
  const heroParallaxY2 = scrollY * 0.55;

  return (
    <div className="w-full bg-slate-950 overflow-x-hidden relative">

      {/* Scroll progress bar */}
      <div className="fixed top-0 left-0 z-[100] h-0.5 w-full bg-transparent">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 transition-all duration-100 shadow-sm shadow-cyan-400/60"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Cursor glow */}
      <div
        className="fixed inset-0 pointer-events-none z-50 opacity-40"
        style={{ background: `radial-gradient(700px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(6,182,212,0.12), transparent 40%)` }}
      />

      {/* Scroll to top */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 z-50 p-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-full shadow-2xl hover:shadow-cyan-500/50 transition-all duration-500 hover:scale-110 ${showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20 pointer-events-none'}`}
        aria-label="Scroll to top"
      >
        <ArrowUp size={20} />
      </button>

      {/* Resume popup */}
      <div className={`fixed bottom-8 right-8 z-50 max-w-sm transition-all duration-700 ${showResumePopup ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-20 scale-95 pointer-events-none'}`}>
        <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/20 p-6 backdrop-blur-xl overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl" />
          <button onClick={() => setShowResumePopup(false)} className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all duration-200 z-10" aria-label="Close">
            <X size={16} />
          </button>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/40">
                <FileText className="text-white" size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Create Your Resume</h3>
                <p className="text-xs text-cyan-400">ATS-Friendly Builder</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm mb-5 leading-relaxed">Want to create an ATS-friendly resume that gets you noticed by recruiters?</p>
            <Link to="/resume-builder" onClick={() => setShowResumePopup(false)}
              className="group w-full px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2 shadow-xl hover:shadow-cyan-500/40 hover:scale-105">
              <span>Create Now</span>
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={16} />
            </Link>
          </div>
        </div>
      </div>

      {/* ─── HERO ─── */}
      <section id="hero" data-scroll-reveal className="relative w-full min-h-screen flex items-center justify-center text-white px-4 sm:px-6 lg:px-8 overflow-hidden">

        {/* Animated grid */}
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(6,182,212,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.04) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
          transform: `translateY(${scrollY * 0.1}px)`,
        }} />

        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/30 via-slate-950/80 to-slate-950" />

        {/* Parallax orbs */}
        <div className="absolute top-16 right-16 w-[500px] h-[500px] bg-blue-500/15 rounded-full blur-[130px] animate-pulse"
          style={{ transform: `translateY(${-heroParallaxY}px)` }} />
        <div className="absolute bottom-16 left-16 w-[500px] h-[500px] bg-cyan-500/15 rounded-full blur-[130px] animate-pulse"
          style={{ transform: `translateY(${heroParallaxY}px)`, animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[200px]"
          style={{ transform: `translateY(${-heroParallaxY2 * 0.3}px) translateX(-50%)` }} />

        {/* Floating particles */}
        {[
          { top: '15%', left: '8%', delay: '0s', size: 'w-1.5 h-1.5', color: 'bg-cyan-400' },
          { top: '65%', left: '82%', delay: '1.2s', size: 'w-1 h-1', color: 'bg-blue-400' },
          { top: '35%', right: '12%', delay: '2.5s', size: 'w-1.5 h-1.5', color: 'bg-cyan-300' },
          { top: '80%', left: '25%', delay: '0.8s', size: 'w-1 h-1', color: 'bg-teal-400' },
          { top: '20%', left: '55%', delay: '1.8s', size: 'w-2 h-2', color: 'bg-blue-300' },
          { top: '50%', left: '3%', delay: '3s', size: 'w-1 h-1', color: 'bg-cyan-500' },
        ].map((p, i) => (
          <div key={i} className={`absolute ${p.size} ${p.color} rounded-full animate-float`}
            style={{ top: p.top, left: p.left, right: p.right, animationDelay: p.delay, opacity: 0.7 }} />
        ))}

        <div className="relative z-10 w-full max-w-7xl mx-auto py-40 text-center">

          <RevealBlock direction="scale" delay={0}>
            <div className="inline-flex items-center gap-2 mb-8 px-6 py-3 bg-gradient-to-r from-blue-500/15 to-cyan-500/15 border border-blue-400/25 rounded-full backdrop-blur-sm hover:scale-105 transition-transform duration-300 cursor-default">
              <Sparkles size={15} className="text-cyan-400 animate-spin-slow" />
              <span className="text-cyan-300 text-sm font-medium tracking-wide">Launch Your Career Today</span>
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
            </div>
          </RevealBlock>

          <RevealBlock direction="up" delay={150}>
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-6 leading-none tracking-tight px-4">
              Transform Your Future with
              <span className="block bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent mt-4 font-serif animate-gradient-x min-h-[1.2em]">
                {scrambledText || targetText}
              </span>
            </h1>
          </RevealBlock>

          <RevealBlock direction="up" delay={300}>
            <p className="text-lg md:text-xl text-gray-400 mb-14 max-w-3xl mx-auto leading-relaxed px-4">
              Bridge the gap between academic learning and industry requirements.
              Join thousands of students gaining practical experience with top companies.
            </p>
          </RevealBlock>

          <RevealBlock direction="up" delay={450}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-24 px-4">
              <Link to="/registration"
                className="group relative w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-xl font-bold text-lg text-white transition-all duration-300 flex items-center justify-center gap-2 shadow-2xl hover:shadow-cyan-500/50 hover:scale-105 overflow-hidden">
                <span className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative">Get Started Now</span>
                <ArrowRight className="relative group-hover:translate-x-1 transition-transform" size={20} />
              </Link>
              <Link to="/service"
                className="group w-full sm:w-auto px-10 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/40 rounded-xl font-bold text-lg text-white transition-all duration-300 hover:scale-105 relative overflow-hidden backdrop-blur-sm">
                <span className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-cyan-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative">Explore Opportunities</span>
              </Link>
            </div>
          </RevealBlock>

          <RevealBlock direction="up" delay={600}>
            <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto px-4">
              {[
                { number: activeInterns, suffix: '+', label: 'Active Interns', icon: Users },
                { number: successRate, suffix: '%', label: 'Success Rate', icon: TrendingUp },
                { number: 1, suffix: '+', label: 'Countries', icon: Globe },
              ].map((stat, i) => (
                <TiltCard
                  key={i}
                  intensity={8}
                  className="relative p-6 bg-white/5 backdrop-blur-sm border border-white/10 hover:border-cyan-400/40 rounded-2xl cursor-pointer overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-cyan-500/0 group-hover:from-blue-500/10 group-hover:to-cyan-500/10 rounded-2xl transition-all duration-500" />
                  <div className="relative z-10 text-center">
                    <stat.icon size={20} className="text-cyan-400/60 mx-auto mb-2" />
                    <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-1">
                      {stat.number}{stat.suffix}
                    </div>
                    <div className="text-gray-400 text-xs sm:text-sm">{stat.label}</div>
                  </div>
                </TiltCard>
              ))}
            </div>
          </RevealBlock>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce opacity-50">
          <div className="w-px h-12 bg-gradient-to-b from-transparent to-cyan-400" />
          <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
        </div>
      </section>

      {/* ─── WHAT WE DO ─── */}
      <section id="what-we-do" data-scroll-reveal className="relative w-full py-28 bg-slate-900 overflow-hidden">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(6,182,212,0.05) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(59,130,246,0.05) 0%, transparent 50%)`
        }} />

        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <RevealBlock direction="scale" delay={0}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 border border-blue-400/20 rounded-full text-blue-400 font-semibold text-xs uppercase tracking-widest mb-5">
                <Zap size={12} /> Our Mission
              </span>
            </RevealBlock>
            <RevealBlock direction="up" delay={100}>
              <h2 className="text-4xl md:text-5xl font-black text-white mt-2 mb-5">
                What We <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-x">Do</span>
              </h2>
            </RevealBlock>
            <RevealBlock direction="up" delay={200}>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
                We connect ambitious students with leading companies, providing structured internship programs that build skills, confidence, and career readiness.
              </p>
            </RevealBlock>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { icon: Target, title: 'Match & Connect', description: 'We match your skills and interests with the perfect internship opportunities from our network of partner companies.', color: 'from-blue-500/20 to-blue-600/10', border: 'hover:border-blue-400/50', glow: 'group-hover:shadow-blue-500/20', iconColor: 'text-blue-400' },
              { icon: Award, title: 'Train & Develop', description: 'Comprehensive training programs ensure you have the skills needed to excel in your chosen field.', color: 'from-cyan-500/20 to-cyan-600/10', border: 'hover:border-cyan-400/50', glow: 'group-hover:shadow-cyan-500/20', iconColor: 'text-cyan-400' },
              { icon: TrendingUp, title: 'Guide & Support', description: 'Continuous mentorship and support throughout your journey, from application to completion.', color: 'from-teal-500/20 to-teal-600/10', border: 'hover:border-teal-400/50', glow: 'group-hover:shadow-teal-500/20', iconColor: 'text-teal-400' },
            ].map((item, i) => (
              <RevealBlock key={i} direction="scale-up" delay={i * 150}>
                <TiltCard
                  intensity={10}
                  className={`group relative h-full p-8 bg-gradient-to-br ${item.color} backdrop-blur-sm rounded-2xl border border-white/10 ${item.border} transition-all duration-500 hover:shadow-2xl ${item.glow} cursor-pointer overflow-hidden`}
                >
                  <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                      <item.icon className={item.iconColor} size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-cyan-300 transition-colors duration-300">{item.title}</h3>
                    <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">{item.description}</p>
                  </div>
                </TiltCard>
              </RevealBlock>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHAT WE ARE ─── */}
      <section id="what-we-are" data-scroll-reveal className="relative w-full py-28 bg-slate-950 overflow-hidden">
        <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-blue-950/20 to-transparent pointer-events-none" />
        <div className="absolute left-0 bottom-0 w-80 h-80 bg-cyan-500/8 rounded-full blur-[100px]" />

        <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-16 relative z-10">
          <div className="grid md:grid-cols-2 gap-20 items-center">
            <div>
              <RevealBlock direction="left" delay={0}>
                <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-cyan-500/10 border border-cyan-400/20 rounded-full text-cyan-400 font-semibold text-xs uppercase tracking-widest mb-6">
                  <Shield size={12} /> About Us
                </span>
              </RevealBlock>
              <RevealBlock direction="left" delay={100}>
                <h2 className="text-4xl md:text-5xl font-black text-white mt-2 mb-6">
                  What We <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Are</span>
                </h2>
              </RevealBlock>
              <RevealBlock direction="left" delay={200}>
                <p className="text-lg text-gray-400 mb-6 leading-relaxed">
                  We are a premier internship platform dedicated to empowering the next generation of professionals. Founded by industry veterans who understand the challenges students face in transitioning from education to employment.
                </p>
              </RevealBlock>
              <RevealBlock direction="left" delay={300}>
                <p className="text-lg text-gray-400 mb-10 leading-relaxed">
                  Our platform serves as a bridge, connecting talented students with innovative companies seeking fresh perspectives. We believe in practical learning, skill development, and creating opportunities that shape successful careers.
                </p>
              </RevealBlock>
              <div className="space-y-3">
                {['Student-centric approach', 'Industry-aligned curriculum', 'Verified company partnerships', 'Career growth focus'].map((item, i) => (
                  <RevealBlock key={i} direction="left" delay={400 + i * 80}>
                    <div className="flex items-center gap-3 group cursor-default">
                      <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shadow-lg shadow-cyan-500/40">
                        <CheckCircle size={15} className="text-white" />
                      </div>
                      <span className="text-gray-300 font-medium group-hover:text-cyan-400 transition-colors duration-300">{item}</span>
                    </div>
                  </RevealBlock>
                ))}
              </div>
            </div>

            <RevealBlock direction="right" delay={200}>
              <TiltCard
                intensity={6}
                className="relative rounded-3xl overflow-hidden group cursor-pointer"
                style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.08), rgba(59,130,246,0.08))' }}
              >
                <div className="absolute inset-0 border border-white/10 rounded-3xl group-hover:border-cyan-400/30 transition-colors duration-500" />
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-cyan-500/15 rounded-full blur-3xl group-hover:bg-cyan-500/25 transition-all duration-700" />
                <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-blue-500/15 rounded-full blur-3xl group-hover:bg-blue-500/25 transition-all duration-700" />
                <img
                  src={LOGO}
                  alt="About Code-A-Nova"
                  className="relative w-full h-full object-contain p-12 opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                />
              </TiltCard>
            </RevealBlock>
          </div>
        </div>
      </section>

      {/* ─── DOMAINS ─── */}
      <section id="domains" data-scroll-reveal className="relative w-full py-28 bg-slate-900 overflow-hidden">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(6,182,212,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.03) 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
        }} />

        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <RevealBlock direction="scale" delay={0}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 border border-blue-400/20 rounded-full text-blue-400 font-semibold text-xs uppercase tracking-widest mb-5">
                <Code size={12} /> Specializations
              </span>
            </RevealBlock>
            <RevealBlock direction="up" delay={100}>
              <h2 className="text-4xl md:text-5xl font-black text-white mt-2 mb-5">
                Our <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-x">Domains</span>
              </h2>
            </RevealBlock>
            <RevealBlock direction="up" delay={200}>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
                Choose from a wide range of domains and kickstart your career in the field you're passionate about.
              </p>
            </RevealBlock>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {domains.map((domain, i) => (
              <RevealBlock key={i} direction={i % 3 === 0 ? 'left' : i % 3 === 2 ? 'right' : 'up'} delay={i * 100}>
                <TiltCard
                  intensity={14}
                  className="group relative h-full p-8 bg-gradient-to-br from-slate-800/70 to-slate-800/30 backdrop-blur-sm rounded-2xl border border-white/8 hover:border-cyan-400/40 transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/15 cursor-pointer overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/8 group-hover:to-blue-500/8 rounded-2xl transition-all duration-700" />
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                  {/* Corner accent */}
                  <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden rounded-tr-2xl">
                    <div className="absolute -top-8 -right-8 w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-transparent rotate-45 group-hover:from-cyan-500/40 transition-all duration-500" />
                  </div>

                  <div className="relative z-10">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-6 group-hover:from-cyan-500/30 group-hover:to-teal-500/30 transition-all duration-500 shadow-lg">
                      <domain.icon className="text-cyan-400 group-hover:text-teal-300 transition-colors duration-300" size={26} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors duration-300">{domain.name}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed group-hover:text-gray-300 transition-colors duration-400">{domain.desc}</p>

                    <div className="mt-5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                      <span className="text-xs text-cyan-400 font-medium">Explore</span>
                      <ArrowRight size={12} className="text-cyan-400" />
                    </div>
                  </div>
                </TiltCard>
              </RevealBlock>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" data-scroll-reveal className="relative w-full py-28 bg-slate-950 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[150px]" />

        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <RevealBlock direction="scale" delay={0}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-cyan-500/10 border border-cyan-400/20 rounded-full text-cyan-400 font-semibold text-xs uppercase tracking-widest mb-5">
                <Sparkles size={12} /> What You Get
              </span>
            </RevealBlock>
            <RevealBlock direction="up" delay={100}>
              <h2 className="text-4xl md:text-5xl font-black text-white mt-2 mb-5">
                Our <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent animate-gradient-x">Features</span>
              </h2>
            </RevealBlock>
            <RevealBlock direction="up" delay={200}>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">Everything you need to launch a successful career, all in one platform.</p>
            </RevealBlock>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <RevealBlock key={i} direction="scale-up" delay={i * 120}>
                <TiltCard
                  intensity={16}
                  className="group relative h-full p-7 bg-white/4 backdrop-blur-sm rounded-2xl border border-white/8 hover:border-cyan-400/40 transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/15 cursor-pointer overflow-hidden"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-8 rounded-2xl transition-opacity duration-700`} />
                  <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                    style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.3) 0%, transparent 70%)' }} />

                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 border border-white/10">
                      <feature.icon className="text-cyan-400 group-hover:text-cyan-300 transition-colors duration-300" size={22} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors duration-300">{feature.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed group-hover:text-gray-300 transition-colors duration-400">{feature.description}</p>
                  </div>
                </TiltCard>
              </RevealBlock>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHY CHOOSE US ─── */}
      <section id="why-choose-us" data-scroll-reveal className="relative w-full py-28 bg-slate-900 overflow-hidden">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/6 rounded-full blur-[120px]" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/6 rounded-full blur-[120px]" />

        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <RevealBlock direction="scale" delay={0}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-cyan-500/10 border border-cyan-400/20 rounded-full text-cyan-400 font-semibold text-xs uppercase tracking-widest mb-5">
                <Award size={12} /> Our Advantage
              </span>
            </RevealBlock>
            <RevealBlock direction="up" delay={100}>
              <h2 className="text-4xl md:text-5xl font-black text-white mt-2 mb-5">
                Why <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent animate-gradient-x">Choose Us</span>
              </h2>
            </RevealBlock>
            <RevealBlock direction="up" delay={200}>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
                We're not just another internship platform. We're your partner in building a successful career.
              </p>
            </RevealBlock>
          </div>

          <div className="grid sm:grid-cols-2 gap-5 max-w-5xl mx-auto">
            {benefits.map((benefit, i) => (
              <RevealBlock key={i} direction={i % 2 === 0 ? 'left' : 'right'} delay={i * 80}>
                <TiltCard
                  intensity={8}
                  className="group relative flex items-start gap-4 p-6 bg-gradient-to-br from-slate-800/70 to-slate-800/30 backdrop-blur-sm rounded-2xl border border-white/8 hover:border-cyan-400/40 transition-all duration-500 hover:shadow-xl hover:shadow-cyan-500/10 cursor-pointer overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/6 group-hover:to-blue-500/6 rounded-2xl transition-all duration-500" />
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shadow-lg shadow-cyan-500/40 relative z-10">
                    <CheckCircle size={16} className="text-white" />
                  </div>
                  <p className="text-gray-300 font-medium group-hover:text-cyan-300 transition-colors duration-300 relative z-10">{benefit}</p>
                </TiltCard>
              </RevealBlock>
            ))}
          </div>
        </div>
      </section>

      {/* ─── RESUME BUILDER CTA ─── */}
      <section id="resume-builder-cta" data-scroll-reveal className="relative w-full py-28 bg-slate-950 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/4 via-transparent to-blue-500/4" />
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-cyan-500/8 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-blue-500/8 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-cyan-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800/80 to-slate-900" />
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-cyan-500/8 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 w-1/2 h-full bg-gradient-to-tr from-blue-500/8 via-transparent to-transparent" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

            {/* Animated circles */}
            <div className="absolute top-10 right-20 w-48 h-48 border border-cyan-500/15 rounded-full animate-pulse" />
            <div className="absolute bottom-10 right-40 w-24 h-24 border border-blue-500/15 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 right-10 w-8 h-8 border border-cyan-400/30 rounded-full" />

            <div className="grid md:grid-cols-2 gap-16 items-center p-10 md:p-16 relative z-10">
              <div className="space-y-6">
                <RevealBlock direction="left" delay={0}>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full">
                    <Sparkles size={14} className="text-cyan-400 animate-spin-slow" />
                    <span className="text-cyan-400 text-sm font-semibold">Free Tool</span>
                  </div>
                </RevealBlock>
                <RevealBlock direction="left" delay={100}>
                  <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
                    Build Your Perfect
                    <span className="block bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent mt-2 animate-gradient-x">
                      ATS-Friendly Resume
                    </span>
                  </h2>
                </RevealBlock>
                <RevealBlock direction="left" delay={200}>
                  <p className="text-lg text-gray-400 leading-relaxed">
                    Create a professional resume that gets past Applicant Tracking Systems and lands you interviews. Our AI-powered builder ensures your resume is optimized for both robots and recruiters.
                  </p>
                </RevealBlock>
                <RevealBlock direction="left" delay={300}>
                  <div className="space-y-3 pt-2">
                    {['ATS-Optimized Templates', 'Smart Keyword Suggestions', 'Instant PDF Download', 'Completely Free Forever'].map((f, i) => (
                      <div key={i} className="flex items-center gap-3 group cursor-default">
                        <div className="w-6 h-6 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shadow-lg shadow-cyan-500/40">
                          <CheckCircle size={13} className="text-white" />
                        </div>
                        <span className="text-gray-300 font-medium group-hover:text-cyan-400 transition-colors duration-300">{f}</span>
                      </div>
                    ))}
                  </div>
                </RevealBlock>
                <RevealBlock direction="left" delay={400}>
                  <div className="pt-4">
                    <Link to="/resume-builder"
                      className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl font-bold text-lg text-white transition-all duration-300 shadow-2xl shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105 relative overflow-hidden">
                      <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <FileText className="relative" size={22} />
                      <span className="relative">Create Resume Now</span>
                      <ArrowRight className="relative group-hover:translate-x-1 transition-transform" size={22} />
                    </Link>
                    <p className="mt-4 text-sm text-gray-500">No credit card required · No hidden fees · Start in seconds</p>
                  </div>
                </RevealBlock>
              </div>

              <RevealBlock direction="right" delay={200} className="hidden md:block">
                <div className="relative flex items-center justify-center min-h-80">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-3xl blur-3xl animate-pulse" />
                  <div className="relative w-full max-w-sm space-y-4">
                    {[
                      { icon: FileText, label: 'Personal Info', color: 'from-cyan-500 to-blue-500', border: 'border-cyan-500/30', shadow: 'hover:shadow-cyan-500/20' },
                      { icon: Award, label: 'Skills & Experience', color: 'from-blue-500 to-cyan-500', border: 'border-blue-500/30', shadow: 'hover:shadow-blue-500/20' },
                      { icon: Briefcase, label: 'Work History', color: 'from-cyan-500 to-blue-500', border: 'border-cyan-500/30', shadow: 'hover:shadow-cyan-500/20' },
                    ].map((card, i) => (
                      <TiltCard
                        key={i}
                        intensity={8}
                        className={`group p-5 bg-slate-800/80 backdrop-blur-sm border ${card.border} rounded-2xl shadow-xl ${card.shadow} transition-all duration-500 hover:-translate-y-1 cursor-pointer`}
                        style={{ animationDelay: `${i * 0.2}s` }}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-11 h-11 bg-gradient-to-br ${card.color} rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg`}>
                            <card.icon size={20} className="text-white" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="h-2.5 bg-cyan-500/25 rounded-full w-3/4" />
                            <div className="h-1.5 bg-slate-600/60 rounded-full w-full" />
                            <div className="h-1.5 bg-slate-600/40 rounded-full w-5/6" />
                          </div>
                        </div>
                      </TiltCard>
                    ))}

                    <div className="absolute -bottom-4 -right-4 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full shadow-lg shadow-green-500/50 animate-bounce">
                      <span className="text-white text-sm font-bold flex items-center gap-1.5">
                        <CheckCircle size={14} /> ATS Ready
                      </span>
                    </div>
                  </div>
                </div>
              </RevealBlock>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section id="cta" data-scroll-reveal className="relative w-full py-36 bg-slate-950 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/12 rounded-full blur-[140px] animate-pulse"
          style={{ transform: `translateY(${(scrollY - 4000) * -0.15}px)` }} />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-500/12 rounded-full blur-[140px] animate-pulse"
          style={{ transform: `translateY(${(scrollY - 4000) * 0.15}px)`, animationDelay: '1s' }} />

        {/* Glowing grid lines */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute top-1/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
          <div className="absolute bottom-1/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent" />
          <div className="absolute top-0 bottom-0 left-1/4 w-px bg-gradient-to-b from-transparent via-cyan-400 to-transparent" />
          <div className="absolute top-0 bottom-0 right-1/4 w-px bg-gradient-to-b from-transparent via-blue-400 to-transparent" />
        </div>

        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <RevealBlock direction="scale" delay={0}>
            <div className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-500/15 to-cyan-500/15 border border-blue-400/25 rounded-full mb-8">
              <Zap size={14} className="text-cyan-400" />
              <span className="text-cyan-300 text-sm font-medium">Start Today</span>
            </div>
          </RevealBlock>
          <RevealBlock direction="up" delay={100}>
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-none">
              Ready to Start Your
              <span className="block bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent mt-4 animate-gradient-x">
                Professional Journey?
              </span>
            </h2>
          </RevealBlock>
          <RevealBlock direction="up" delay={250}>
            <p className="text-xl text-gray-400 mb-14 max-w-2xl mx-auto leading-relaxed">
              Don't wait for opportunities to come to you. Take charge of your future and apply for internships that match your passion and skills.
            </p>
          </RevealBlock>
          <RevealBlock direction="up" delay={400}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/registration"
                className="group relative w-full sm:w-auto px-12 py-5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-xl font-black text-lg text-white transition-all duration-300 flex items-center justify-center gap-2 shadow-2xl hover:shadow-cyan-500/50 hover:scale-105 overflow-hidden">
                <span className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative">Apply Now</span>
                <ArrowRight className="relative group-hover:translate-x-1 transition-transform" size={22} />
              </Link>
              <Link to="/contact"
                className="group w-full sm:w-auto px-12 py-5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/40 rounded-xl font-black text-lg text-white transition-all duration-300 hover:scale-105 relative overflow-hidden backdrop-blur-sm">
                <span className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-cyan-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative">Contact Us</span>
              </Link>
            </div>
          </RevealBlock>
          <RevealBlock direction="fade" delay={600}>
            <p className="mt-8 text-gray-500 text-sm">Join 300+ students who have already started their journey</p>
          </RevealBlock>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="relative bg-black text-gray-300 pt-24 pb-0 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute w-96 h-96 -top-20 -left-20 bg-gradient-to-br from-cyan-500/15 to-blue-600/15 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute w-96 h-96 -bottom-20 -right-20 bg-gradient-to-tr from-blue-500/15 to-cyan-400/15 blur-[100px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(6,182,212,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.02) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }} />
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 px-4 sm:px-6 lg:px-8 relative z-10 mb-16">
          {[
            {
              content: (
                <>
                  <Link to="/" className="flex items-center space-x-3 mb-6 group">
                    <img src={logo} alt="CodeNova Logo" className="h-11 w-11 object-contain group-hover:scale-110 group-hover:rotate-6 transition-all duration-300" />
                    <span className="text-2xl font-black bg-gradient-to-r from-cyan-400 to-blue-300 bg-clip-text text-transparent group-hover:brightness-110 transition-all duration-300">Code-A-Nova</span>
                  </Link>
                  <p className="text-sm leading-relaxed text-gray-500 mb-5">Empowering students with real-world tech internships and expert mentorship.</p>
                  <div className="space-y-2.5 text-sm text-gray-500">
                    <div className="flex items-center gap-2 hover:text-cyan-400 transition-colors duration-300 cursor-pointer group">
                      <Mail size={15} className="shrink-0 group-hover:scale-110 transition-transform" />
                      <span>codeanova26@gmail.com</span>
                    </div>
                    <div className="flex items-center gap-2 hover:text-cyan-400 transition-colors duration-300 cursor-pointer group">
                      <MapPin size={15} className="shrink-0 group-hover:scale-110 transition-transform" />
                      <span>India</span>
                    </div>
                  </div>
                </>
              )
            },
          ].map((_, i) => (
            <RevealBlock key={i} direction="up" delay={0}>
              <div className="relative p-6 rounded-2xl border border-white/8 bg-white/4 backdrop-blur-md hover:border-cyan-500/25 hover:bg-white/6 transition-all duration-500 hover:shadow-lg hover:shadow-cyan-500/8 h-full">
                {_.content}
              </div>
            </RevealBlock>
          ))}

          <RevealBlock direction="up" delay={100}>
            <div className="relative p-6 rounded-2xl border border-white/8 bg-white/4 backdrop-blur-md hover:border-cyan-500/25 transition-all duration-500 h-full">
              <h4 className="text-lg font-bold text-cyan-300 mb-6">Quick Links</h4>
              <ul className="space-y-3 text-sm">
                {quickLinks.map(link => (
                  <li key={link.to} className="group">
                    <Link to={link.to} className="flex items-center gap-2 text-gray-500 hover:text-cyan-400 hover:translate-x-1 transition-all duration-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-cyan-400 transition-all" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </RevealBlock>

          <RevealBlock direction="up" delay={200}>
            <div className="relative p-6 rounded-2xl border border-white/8 bg-white/4 backdrop-blur-md hover:border-blue-500/25 transition-all duration-500 h-full">
              <h4 className="text-lg font-bold text-blue-400 mb-6">Legal</h4>
              <ul className="space-y-3 text-sm">
                {legalLinks.map(link => (
                  <li key={link.to} className="group">
                    <Link to={link.to} className="flex items-center gap-2 text-gray-500 hover:text-blue-400 hover:translate-x-1 transition-all duration-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-blue-400 transition-all" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </RevealBlock>

          <RevealBlock direction="up" delay={300}>
            <div className="relative p-6 rounded-2xl border border-white/8 bg-white/4 backdrop-blur-md hover:border-cyan-500/25 transition-all duration-500 h-full">
              <h4 className="text-lg font-bold text-cyan-400 mb-6">Follow Us</h4>
              <div className="flex gap-3 mb-6">
                {socialLinks.map((social, i) => (
                  <a key={i} href={social.href} target="_blank" rel="noopener noreferrer"
                    className="group p-3 rounded-xl border border-white/8 bg-white/5 hover:border-cyan-500/40 hover:bg-cyan-500/10 hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300"
                    aria-label={social.label}>
                    <span className="text-gray-500 group-hover:text-cyan-400 transition-colors duration-300 block">{social.icon}</span>
                  </a>
                ))}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">Connect with us on social media for updates, opportunities, and insights.</p>
            </div>
          </RevealBlock>
        </div>

        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="bg-black py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm">
            <p className="text-gray-600 text-center md:text-left">
              © {new Date().getFullYear()} <span className="text-white font-bold">Code-A-Nova</span>. All rights reserved.
            </p>
            <button className="group flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-500/40 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/15">
              <span className="text-gray-500 group-hover:text-white transition-colors">Created by</span>
              <span className="font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-x">CODE-A-NOVA</span>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg shadow-cyan-500/40">
                <Code2 size={15} className="text-white" />
              </div>
            </button>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-18px) scale(1.1); }
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-float { animation: float 4s ease-in-out infinite; }
        .animate-gradient-x { background-size: 200% 200%; animation: gradient-x 4s ease infinite; }
        .animate-spin-slow { animation: spin-slow 4s linear infinite; }
        .duration-900 { transition-duration: 900ms; }
      `}</style>
    </div>
  );
}

export default Home;
