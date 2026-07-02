import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Target, Sparkles, LogIn } from 'lucide-react';

const InterviewLogin = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Brain className="w-6 h-6 text-blue-600" />,
      title: "AI Mock Interviews",
      desc: "Practice with our hyper-realistic AI to ace your next job interview."
    },
    {
      icon: <Target className="w-6 h-6 text-purple-600" />,
      title: "Exclusive Projects (Coming Soon)",
      desc: "Access premium challenges and build a portfolio that stands out."
    },
    {
      icon: <Sparkles className="w-6 h-6 text-pink-500" />,
      title: "Detailed Analytics & Growth",
      desc: "Track your progress, get instant feedback, and level up your skills."
    }
  ];

  return (
    <div className="min-h-screen bg-white flex pt-20">
      {/* Left Side - Visual & Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-50 via-white to-purple-50 flex-col justify-center px-16 relative overflow-hidden border-r border-blue-100">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-600/5 rounded-full blur-3xl" />
          <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-lg mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600/10 text-blue-700 font-bold text-sm mb-6 border border-blue-600/20">
            <Sparkles size={16} />
            <span>The Ultimate Platform</span>
          </div>
          
          <h1 className="text-5xl font-black text-gray-900 leading-tight mb-6 tracking-tight">
            Unlock your true <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Potential
            </span>
          </h1>
          
          <p className="text-lg text-gray-600 mb-12 leading-relaxed">
            Join Code-A-Nova to access premium features. From advanced AI mock interviews to upcoming exclusive projects, everything you need is right here.
          </p>

          <div className="space-y-8">
            {features.map((feat, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + (idx * 0.1), duration: 0.5 }}
                className="flex items-start gap-5"
              >
                <div className="w-12 h-12 rounded-2xl bg-white shadow-lg shadow-blue-100/50 flex items-center justify-center shrink-0 border border-blue-50">
                  {feat.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{feat.title}</h3>
                  <p className="text-gray-500 leading-relaxed text-sm">{feat.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Side - Login Box */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-6 py-16 relative">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full relative z-10"
        >
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-xl shadow-purple-600/30 transform rotate-3 hover:rotate-6 transition-transform">
              <Brain className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">
              Welcome Back
            </h2>
            <p className="text-gray-500 font-medium">
              Sign in with your intern credentials to access the dashboard.
            </p>
          </div>

          <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900">
                Code<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">-A-</span>Nova
              </h2>
            </div>

            <p className="text-center text-sm text-gray-500 mb-6">
              Mock Interviews is now part of your main intern dashboard. Please log in using your Email & Student ID.
            </p>

            <button
              onClick={() => navigate('/student-login')}
              className="flex items-center justify-center gap-3 w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all font-bold text-base"
            >
              <LogIn className="w-5 h-5" />
              Go to Student Login
            </button>
            
            <div className="mt-8 flex items-center justify-center gap-3">
              <div className="h-px bg-gray-200 flex-1"></div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Code-A-Nova</span>
              <div className="h-px bg-gray-200 flex-1"></div>
            </div>
          </div>
          
          <p className="text-center text-sm text-gray-400 mt-8">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default InterviewLogin;
