import { useEffect, useRef, useState } from 'react';
import { Code2, Target, Users, Rocket, Award, TrendingUp, Globe, Briefcase, Link } from 'lucide-react';

function About() {
  const [visibleSections, setVisibleSections] = useState(new Set());
  const observerRef = useRef(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -100px 0px' }
    );

    const sections = document.querySelectorAll('.reveal-section');
    sections.forEach((section) => {
      if (observerRef.current) {
        observerRef.current.observe(section);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const isVisible = (id) => visibleSections.has(id);

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-900 via-gray-800 to-gray-900 text-gray-100">
      <div
        id="hero"
        className={`reveal-section transition-all duration-1000 ${
          isVisible('hero') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 mb-6">
              <Code2 className="w-12 h-12 text-cyan-400" />
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Code-A-Nova
              </h1>
            </div>
            <p className="text-xl sm:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Bridging the gap between academic knowledge and industry expertise through transformative internship experiences.
            </p>
          </div>
        </div>
      </div>

      <div
        id="mission"
        className={`reveal-section transition-all duration-1000 delay-200 ${
          isVisible('mission') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            <div className="bg-linear-to-br from-gray-800 to-gray-900 p-8 rounded-2xl border border-cyan-500/20 shadow-xl hover:shadow-cyan-500/10 transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-8 h-8 text-cyan-400" />
                <h2 className="text-3xl font-bold text-white">Our Mission</h2>
              </div>
              <p className="text-gray-300 leading-relaxed text-lg">
                To empower students and young professionals with real-world industry experience,
                cutting-edge technical skills, and mentorship that transforms them into job-ready
                professionals capable of driving innovation in the tech industry.
              </p>
            </div>

            <div className="bg-linear-to-br from-gray-800 to-gray-900 p-8 rounded-2xl border border-blue-500/20 shadow-xl hover:shadow-blue-500/10 transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-4">
                <Rocket className="w-8 h-8 text-blue-400" />
                <h2 className="text-3xl font-bold text-white">Our Vision</h2>
              </div>
              <p className="text-gray-300 leading-relaxed text-lg">
                To become the leading internship platform that revolutionizes how students transition
                into the workforce, creating a future where every graduate has the practical skills
                and confidence to excel in their chosen field from day one.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        id="about"
        className={`reveal-section transition-all duration-1000 delay-300 ${
          isVisible('about') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">About Code-A-Nova</h2>
            <div className="w-24 h-1 bg-linear-to-r from-cyan-400 to-blue-500 mx-auto rounded-full"></div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm p-8 lg:p-12 rounded-2xl border border-gray-700">
            <p className="text-gray-300 text-lg leading-relaxed mb-6">
              Code-A-Nova is a forward-thinking internship provider platform dedicated to connecting
              ambitious students with meaningful opportunities in technology and software development.
              Founded on the belief that practical experience is just as crucial as theoretical knowledge,
              we've built a comprehensive ecosystem that nurtures talent and accelerates career growth.
            </p>
            <p className="text-gray-300 text-lg leading-relaxed">
              We partner with industry-leading companies to offer internships that aren't just resume
              fillers but transformative learning experiences. Our programs combine hands-on projects,
              expert mentorship, and structured learning paths to ensure every intern walks away with
              tangible skills and industry connections.
            </p>
          </div>
        </div>
      </div>

      <div
        id="audience"
        className={`reveal-section transition-all duration-1000 delay-400 ${
          isVisible('audience') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Who We Serve</h2>
            <div className="w-24 h-1 bg-linear-to-r from-cyan-400 to-blue-500 mx-auto rounded-full"></div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-linear-to-b from-gray-800 to-gray-900 p-6 rounded-xl border border-gray-700 hover:border-cyan-500/50 transition-all duration-300 hover:transform hover:scale-105">
              <Users className="w-12 h-12 text-cyan-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Computer Science Students</h3>
              <p className="text-gray-400">
                Looking to apply their academic knowledge in real-world projects and build impressive portfolios.
              </p>
            </div>

            <div className="bg-linear-to-b from-gray-800 to-gray-900 p-6 rounded-xl border border-gray-700 hover:border-blue-500/50 transition-all duration-300 hover:transform hover:scale-105">
              <TrendingUp className="w-12 h-12 text-blue-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Career Switchers</h3>
              <p className="text-gray-400">
                Professionals transitioning into tech who need hands-on experience to complement their learning.
              </p>
            </div>

            <div className="bg-linear-to-b from-gray-800 to-gray-900 p-6 rounded-xl border border-gray-700 hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-105">
              <Award className="w-12 h-12 text-purple-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Recent Graduates</h3>
              <p className="text-gray-400">
                New graduates seeking to gain industry experience and stand out in the competitive job market.
              </p>
            </div>

            <div className="bg-linear-to-b from-gray-800 to-gray-900 p-6 rounded-xl border border-gray-700 hover:border-green-500/50 transition-all duration-300 hover:transform hover:scale-105">
              <Briefcase className="w-12 h-12 text-green-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Self-Taught Developers</h3>
              <p className="text-gray-400">
                Autodidacts who want to validate their skills and gain professional work experience.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        id="values"
        className={`reveal-section transition-all duration-1000 delay-500 ${
          isVisible('values') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Our Core Values</h2>
            <div className="w-24 h-1 bg-linear-to-r from-cyan-400 to-blue-500 mx-auto rounded-full"></div>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-cyan-500/30">
                <Globe className="w-10 h-10 text-cyan-400" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-3">Innovation</h3>
              <p className="text-gray-400">
                We constantly evolve our programs to match the latest industry trends and technologies.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-blue-500/30">
                <Users className="w-10 h-10 text-blue-400" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-3">Mentorship</h3>
              <p className="text-gray-400">
                Every intern receives personalized guidance from experienced industry professionals.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-purple-500/30">
                <Award className="w-10 h-10 text-purple-400" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-3">Excellence</h3>
              <p className="text-gray-400">
                We maintain high standards in everything we do, from program quality to partner selection.
              </p>
            </div>
          </div>
        </div>
      </div>

      

      <div
        id="cta"
        className={`reveal-section transition-all duration-1000 delay-700 ${
          isVisible('cta') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
        }`}
      >
        
      </div>
    </div>
  );
}

export default About;
