import React from 'react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Brain, MessageSquare, Target, Sparkles } from 'lucide-react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy-client-id.apps.googleusercontent.com';

const CustomGoogleLoginButton = ({ onSuccess, onError }) => {
  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => onSuccess(tokenResponse),
    onError: () => onError(),
  });

  return (
    <button
      onClick={() => login()}
      className="flex items-center justify-center gap-3 w-[80%] mx-auto bg-blue-600 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all transform hover:-translate-y-0.5"
    >
      <div className="bg-white p-1 rounded-full">
        <svg viewBox="0 0 48 48" className="w-5 h-5">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.7 17.74 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
      </div>
      <span className="font-extrabold text-lg">Sign in with Google</span>
    </button>
  );
};

const InterviewLogin = () => {
  const navigate = useNavigate();

  const handleSuccess = async (credentialResponse) => {
    try {
      // Custom button returns access_token
      const { access_token } = credentialResponse;
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/interview-auth/google`, {
        accessToken: access_token
      });

      if (res.data.success) {
        localStorage.setItem('interviewToken', res.data.token);
        localStorage.setItem('interviewUser', JSON.stringify(res.data.user));
        
        if (res.data.role === 'intern') {
          localStorage.setItem('studentToken', res.data.token);
          localStorage.setItem('interviewUserRole', 'intern');
        } else {
          localStorage.removeItem('interviewUserRole');
        }
        
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login failed:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
      alert(`Login failed: ${errorMessage}`);
    }
  };

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
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="min-h-screen bg-white flex pt-20">
        {/* Left Side - Visual & Features */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-50 via-white to-purple-50 flex-col justify-center px-16 relative overflow-hidden border-r border-blue-100">
          
          {/* Background Decorative Elements */}
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
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center bg-white px-4 sm:px-6 py-8 lg:py-16 relative min-h-[calc(100vh-5rem)] lg:min-h-0">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-md w-full relative z-10 flex flex-col"
          >
            <div className="text-center mb-8 sm:mb-10 mt-auto lg:mt-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-2xl sm:rounded-3xl mx-auto flex items-center justify-center mb-5 sm:mb-6 shadow-xl shadow-purple-600/30 transform rotate-3 hover:rotate-6 transition-transform">
                <Brain className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2 sm:mb-3 tracking-tight">
                Welcome Back
              </h2>
              <p className="text-sm sm:text-base text-gray-500 font-medium px-4">
                Sign in to explore your Code-A-Nova dashboard.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100/80 w-full">
              <div className="text-center mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-3xl font-black tracking-tight text-gray-900">
                  Code<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">-A-</span>Nova
                </h2>
              </div>
              <div className="flex justify-center mt-4">
                <CustomGoogleLoginButton
                  onSuccess={handleSuccess}
                  onError={() => {
                    console.log('Login Failed');
                    alert('Login failed. Please try again.');
                  }}
                />
              </div>
              
              <div className="mt-6 sm:mt-8 flex items-center justify-center gap-3">
                <div className="h-px bg-gray-200 flex-1"></div>
                <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest">Code-A-Nova</span>
                <div className="h-px bg-gray-200 flex-1"></div>
              </div>
            </div>
            
            <p className="text-center text-xs sm:text-sm text-gray-400 mt-6 sm:mt-8 px-4 mb-8 lg:mb-0 mt-auto lg:mt-8">
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </motion.div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default InterviewLogin;
