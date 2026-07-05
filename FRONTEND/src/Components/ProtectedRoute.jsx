import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FileText, Lock, Sparkles } from 'lucide-react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy-client-id.apps.googleusercontent.com';

/* ---------- Google Button (reusable inside this file) ---------- */
const GoogleSignInButton = ({ onSuccess }) => {
  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => onSuccess(tokenResponse),
    onError: () => alert('Sign in failed. Please try again.'),
  });

  return (
    <button
      onClick={() => login()}
      className="flex items-center justify-center gap-3 w-full bg-blue-600 text-white px-6 py-3.5 rounded-2xl shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all transform hover:-translate-y-0.5 font-bold"
    >
      <div className="bg-white p-1 rounded-full shrink-0">
        <svg viewBox="0 0 48 48" className="w-5 h-5">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.7 17.74 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
      </div>
      <span className="text-base">Sign in with Google</span>
    </button>
  );
};

/* ---------- Inline "Sign In Required" wall ---------- */
const LoginWall = ({ redirectTo }) => {
  const navigate = useNavigate();

  const handleSuccess = async (credentialResponse) => {
    try {
      const { access_token } = credentialResponse;
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/interview-auth/google`,
        { accessToken: access_token }
      );

      if (res.data.success) {
        localStorage.setItem('interviewToken', res.data.token);
        localStorage.setItem('interviewUser', JSON.stringify(res.data.user));

        if (res.data.role === 'intern') {
          localStorage.setItem('studentToken', res.data.token);
          localStorage.setItem('interviewUserRole', 'intern');
        } else {
          localStorage.removeItem('interviewUserRole');
        }

        // After sign-in, go to the originally requested page
        navigate(redirectTo, { replace: true });
      }
    } catch (error) {
      const msg = error.response?.data?.error || error.response?.data?.message || error.message;
      alert(`Sign in failed: ${msg}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-violet-300/50 rotate-3">
              <FileText className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center shadow-lg">
              <Lock className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-50 text-violet-700 rounded-full text-xs font-bold border border-violet-100 mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            Sign In Required
          </div>

          <h1 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
            Access Your Resume Builder
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed mb-8">
            Please sign in with your Google account to access and manage your resumes. Your first resume is completely free!
          </p>

          <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <GoogleSignInButton onSuccess={handleSuccess} />
          </GoogleOAuthProvider>

          <p className="text-xs text-slate-400 mt-6 leading-relaxed">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>

        {/* Back link */}
        <button
          onClick={() => navigate('/')}
          className="mt-6 w-full text-center text-sm text-slate-400 hover:text-slate-600 transition-colors font-medium"
        >
          ← Go back to Home
        </button>
      </motion.div>
    </div>
  );
};

/* ---------- ProtectedRoute wrapper ---------- */
const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(null); // null = checking

  useEffect(() => {
    const token = localStorage.getItem('studentToken');
    setIsLoggedIn(!!token);
  }, []);

  // Still checking — show nothing (or a tiny spinner)
  if (isLoggedIn === null) return null;

  if (!isLoggedIn) {
    return <LoginWall redirectTo={location.pathname} />;
  }

  return children;
};

export default ProtectedRoute;
