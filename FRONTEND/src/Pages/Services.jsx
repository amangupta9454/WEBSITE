import { Code, Server, Layers, FileCode, Terminal, Figma, Zap, ArrowRight, Clock, BarChart3, Users, Award, Sparkles, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import data from "../assets/1.png";
import figma from "../assets/2.png";
import python from "../assets/3.png";
import c from "../assets/4.png";
import ai from "../assets/5.png";
import backend from "../assets/6.png";
import front from "../assets/7.png";
import fullstack from "../assets/8.png";

const Services = () => {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);

  const domains = [
    {
      id: 1,
      name: 'Frontend Development',
      description: 'Master modern UI/UX with React, Vue, and responsive design.',
      icon: Code,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-500/10 to-cyan-500/10',
      image: front,
      difficulty: 'Intermediate',
      duration: '8 weeks',
      enrolled: 20,
      rating: 4.8,
      skills: ['React', 'Tailwind', 'JavaScript']
    },
    {
      id: 2,
      name: 'Backend',
      description: 'Develop robust server-side applications with Node.js and databases.',
      icon: Server,
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-500/10 to-emerald-500/10',
      image: backend,
      difficulty: 'Intermediate',
      duration: '10 weeks',
      enrolled: 18,
      rating: 4.7,
      skills: ['Node.js', 'MongoDB', 'APIs']
    },
    {
      id: 3,
      name: 'Fullstack',
      description: 'Build complete applications combining frontend and backend expertise.',
      icon: Layers,
      gradient: 'from-orange-500 to-red-500',
      bgGradient: 'from-orange-500/10 to-red-500/10',
      image: fullstack,
      difficulty: 'Advanced',
      duration: '12 weeks',
      enrolled: 15,
      rating: 4.9,
      skills: ['React', 'Node.js', 'MongoDB']
    },
    {
      id: 4,
      name: 'Python',
      description: 'Learn versatile Python for automation, data science, and web development.',
      icon: FileCode,
      gradient: 'from-yellow-500 to-amber-500',
      bgGradient: 'from-yellow-500/10 to-amber-500/10',
      image: python,
      difficulty: 'Beginner',
      duration: '6 weeks',
      enrolled: 30,
      rating: 4.8,
      skills: ['Python', 'Django', 'Data Science']
    },
    {
      id: 5,
      name: 'C Programming',
      description: 'Master fundamental programming concepts with C and system-level programming.',
      icon: Terminal,
      gradient: 'from-slate-500 to-gray-600',
      bgGradient: 'from-slate-500/10 to-gray-600/10',
      image: c,
      difficulty: 'Beginner',
      duration: '8 weeks',
      enrolled: 15,
      rating: 4.6,
      skills: ['C', 'Pointers', 'Algorithms']
    },
    {
      id: 6,
      name: 'Figma Design',
      description: 'Create stunning UI/UX designs using Figma and design systems.',
      icon: Figma,
      gradient: 'from-pink-500 to-rose-500',
      bgGradient: 'from-pink-500/10 to-rose-500/10',
      image: figma,
      difficulty: 'Intermediate',
      duration: '7 weeks',
      enrolled: 20,
      rating: 4.9,
      skills: ['Figma', 'UI/UX', 'Prototyping']
    },
    {
      id: 7,
      name: 'AI & ML',
      description: 'Explore artificial intelligence and machine learning with neural networks.',
      icon: Zap,
      gradient: 'from-teal-500 to-cyan-600',
      bgGradient: 'from-teal-500/10 to-cyan-600/10',
      image: ai,
      difficulty: 'Advanced',
      duration: '12 weeks',
      enrolled: 12,
      rating: 4.9,
      skills: ['Python', 'TensorFlow', 'Neural Networks']
    },
    {
      id: 8,
      name: 'Data Analytics',
      description: 'Dive into data analytics with Python, R, and SQL for insights.',
      icon: BarChart3,
      gradient: 'from-blue-600 to-sky-500',
      bgGradient: 'from-blue-600/10 to-sky-500/10',
      image: data,
      difficulty: 'Intermediate',
      duration: '9 weeks',
      enrolled: 16,
      rating: 4.7,
      skills: ['SQL', 'Python', 'Tableau']
    }
  ];

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 pt-16 sm:pt-20 md:pt-24 pb-12 sm:pb-16 md:pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-375 mx-auto w-full">
        {/* Header Section */}
        <div className="text-center mb-10 sm:mb-12 md:mb-14">
          <div className="inline-block mb-3 sm:mb-4 mt-10">
            <span className="px-5 sm:px-6 py-2 rounded-full bg-linear-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 text-blue-400 text-xs sm:text-sm font-semibold tracking-wide shadow-lg shadow-blue-500/10">
              EXPLORE OPPORTUNITIES
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 sm:mb-4 leading-tight tracking-tight">
            Internship{' '}
            <span className="bg-linear-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Domains
            </span>
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm md:text-base lg:text-lg max-w-3xl mx-auto leading-relaxed">
            Choose your path and gain hands-on experience in cutting-edge technologies.
          </p>
        </div>

        {/* Stats Banner */}
        <div className="grid grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 mb-10 sm:mb-12 md:mb-14">
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center hover:bg-slate-800/60 transition-all duration-300">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-400">8+</div>
            <div className="text-xs sm:text-sm text-gray-400">Domains</div>
          </div>
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center hover:bg-slate-800/60 transition-all duration-300">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-400">100+</div>
            <div className="text-xs sm:text-sm text-gray-400">Enrolled</div>
          </div>
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center hover:bg-slate-800/60 transition-all duration-300">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-purple-400">4.8★</div>
            <div className="text-xs sm:text-sm text-gray-400">Rating</div>
          </div>
          <div className="hidden md:block bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 text-center hover:bg-slate-800/60 transition-all duration-300">
            <div className="text-xl md:text-2xl font-bold text-pink-400">95%</div>
            <div className="text-sm text-gray-400">Support</div>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-7">
          {domains.map((domain) => {
            const Icon = domain.icon;
            const isHovered = hoveredCard === domain.id;

            return (
              <div
                key={domain.id}
                onMouseEnter={() => setHoveredCard(domain.id)}
                onMouseLeave={() => setHoveredCard(null)}
                className="group relative flex flex-col bg-slate-800/40 backdrop-blur-xl rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-700/50 hover:border-slate-600 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-900/50"
              >
                {/* Background Gradient Overlay */}
                <div className={`absolute inset-0 bg-linear-to-br ${domain.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

                {/* Badge Section */}
                <div className="relative z-20 p-3 sm:p-4 flex items-center justify-between gap-2">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30`}>
                    {domain.difficulty}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {domain.duration}
                  </span>
                </div>

                {/* Image Container */}
                <div className="relative h-32 sm:h-40 overflow-hidden bg-linear-to-b from-slate-700 to-slate-800">
                  <img
                    src={domain.image}
                    alt={domain.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <div className={`absolute inset-0 bg-linear-to-br ${domain.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-500`}></div>
                  <div className={`absolute top-3 right-3 w-12 h-12 sm:w-14 sm:h-14 bg-linear-to-br ${domain.gradient} rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg`}>
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2} />
                  </div>
                </div>

                {/* Content Section */}
                <div className="relative z-10 flex flex-col grow p-4 sm:p-5">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-linear-to-r group-hover:bg-clip-text group-hover:from-white group-hover:to-gray-300 transition-all duration-500">
                    {domain.name}
                  </h3>

                  <p className="text-gray-300 text-xs sm:text-sm leading-relaxed mb-3 group-hover:text-gray-100 transition-colors duration-500">
                    {domain.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-4 pb-4 border-b border-slate-700/50">
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                      <span>{domain.enrolled}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-yellow-400" />
                      <span>{domain.rating}</span>
                    </div>
                  </div>

                  {/* Skills Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {domain.skills.map((skill, idx) => (
                      <span key={idx} className="text-xs px-2 py-1 rounded-lg bg-slate-700/50 text-gray-300 border border-slate-600/50 hover:bg-slate-700 transition-colors duration-300">
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* Apply Button */}
                  <button
                    onClick={() => navigate('/registration')}
                    className={`relative w-full bg-linear-to-r ${domain.gradient} text-white font-bold py-2.5 sm:py-3 px-4 sm:px-5 rounded-lg sm:rounded-xl hover:shadow-2xl transition-all duration-300 text-xs sm:text-sm flex items-center justify-center gap-2 overflow-hidden group/button`}
                    style={{
                      boxShadow: isHovered ? `0 15px 40px -10px currentColor` : 'none'
                    }}
                  >
                    <span className="relative z-10">Apply Now</span>
                    <ArrowRight 
                      className={`w-4 h-4 relative z-10 transition-transform duration-300 ${isHovered ? 'translate-x-0.5' : ''}`} 
                    />
                    <div className="absolute inset-0 bg-linear-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover/button:translate-x-full transition-transform duration-700"></div>
                  </button>
                </div>

                {/* Corner Accent */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-linear-to-br from-slate-600/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 sm:mt-14 md:mt-16 text-center">
          <p className="text-gray-400 text-xs sm:text-sm mb-4">
            Can't decide? Start exploring our domains today!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <button 
              onClick={() => navigate('/registration')}
              className="px-6 sm:px-8 py-2.5 sm:py-3 bg-linear-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg sm:rounded-xl text-xs sm:text-sm hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 hover:-translate-y-0.5"
            >
              Get Started
            </button>
           
          </div>
        </div>
      </div>
    </div>
  );
};

export default Services;
