// import { useState } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import { toast, ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import { Eye, EyeOff, Loader2 } from 'lucide-react';

// const Login = () => {
//   const [formData, setFormData] = useState({ email: '', password: '' });
//   const [showPassword, setShowPassword] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//     console.log(`[Login] Input changed: ${name} =`, value);
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     console.log('[Login] Login attempt started with:', { email: formData.email });

//     setLoading(true);

//     try {
//       console.log('[Login] Sending login request to backend...');
//       const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/login`, formData);

//       console.log('[Login] Login successful:', res.data);

//       localStorage.setItem('token', res.data.token);
//       localStorage.setItem('user', JSON.stringify(res.data.user));
//       console.log('[Login] Credentials saved to localStorage');

//       toast.success('🎉 You are logged in successfully!', {
//         position: 'top-center',
//         autoClose: 3000,
//       });

//       console.log('[Login] Redirecting to dashboard...');
//       setTimeout(() => navigate('/dashboard'), 1500);
//     } catch (err) {
//       const errorMsg = err.response?.data?.message || 'Login failed';
//       console.error('[Login] Login failed:', err.response || err);
//       toast.error(errorMsg);
//     } finally {
//       setLoading(false);
//       console.log('[Login] Login attempt finished');
//     }
//   };

//   return (
//     <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center py-12 px-4">
//       <div className="w-full max-w-md">
//         <div className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 border border-white/20">
//           <h2 className="text-3xl font-bold text-center text-white mb-8">Welcome Back</h2>

//           <form onSubmit={handleSubmit} className="space-y-6">
//             <input
//               type="email"
//               name="email"
//               value={formData.email}
//               onChange={handleChange}
//               placeholder="Email Address"
//               required
//               className="w-full px-5 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 transition"
//             />

//             <div className="relative">
//               <input
//                 type={showPassword ? 'text' : 'password'}
//                 name="password"
//                 value={formData.password}
//                 onChange={handleChange}
//                 placeholder="Password"
//                 required
//                 className="w-full px-5 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 transition pr-12"
//               />
//               <button
//                 type="button"
//                 onClick={() => setShowPassword(!showPassword)}
//                 className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
//               >
//                 {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
//               </button>
//             </div>

//             <button
//               type="submit"
//               disabled={loading}
//               className="w-full py-4 bg-linear-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold rounded-xl transition-all duration-300 shadow-xl hover:shadow-cyan-500/50 disabled:opacity-70 flex items-center justify-center"
//             >
//               {loading ? (
//                 <>
//                   <Loader2 className="animate-spin mr-2" size={20} />
//                   Logging in...
//                 </>
//               ) : (
//                 'Login'
//               )}
//             </button>
//           </form>

//           <p className="text-center text-slate-300 mt-8">
//             Don't have an account?{' '}
//             <Link to="/register" className="text-cyan-400 font-medium hover:underline">
//               Register here
//             </Link>
//           </p>
//         </div>
//       </div>

//       <ToastContainer theme="dark" position="top-center" />
//     </div>
//   );
// };

// export default Login;

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Eye, EyeOff, Loader2, Mail, Lock, LogIn, ArrowRight } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/login`, formData);

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      toast.success('You are logged in successfully!', {
        position: 'top-center',
        autoClose: 3000,
      });

      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Login failed';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -right-4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute bottom-0 -left-4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8 sm:mb-10 pt-14">
          <div className="inline-block p-4 bg-linear-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-2xl mb-4 transform hover:scale-105 transition-transform duration-300">
            <LogIn className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight">Welcome Back</h2>
          <p className="text-slate-400 text-sm sm:text-base">Sign in to continue to your account</p>
        </div>

        <div className="bg-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/10 hover:border-white/20 transition-all duration-300">
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            <div className="relative group">
              <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${focusedField === 'email' ? 'text-cyan-400' : 'text-slate-500'}`}>
                <Mail size={20} />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                placeholder="Email Address"
                required
                className="w-full pl-12 pr-5 py-3.5 sm:py-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 focus:bg-white/10 transition-all duration-200 outline-none text-sm sm:text-base"
              />
            </div>

            <div className="relative group">
              <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${focusedField === 'password' ? 'text-cyan-400' : 'text-slate-500'}`}>
                <Lock size={20} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                placeholder="Password"
                required
                className="w-full pl-12 pr-14 py-3.5 sm:py-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 focus:bg-white/10 transition-all duration-200 outline-none text-sm sm:text-base"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400 transition-colors duration-200 focus:outline-none"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-white/20 bg-white/5 accent-cyan-500 cursor-pointer transition-all duration-200"
                />
                <span className="text-slate-400 text-xs sm:text-sm group-hover:text-slate-300 transition-colors duration-200">Remember me</span>
              </label>
              {/* <Link to="/forgot-password" className="text-cyan-400 hover:text-cyan-300 text-xs sm:text-sm font-medium transition-colors duration-200">
                Forgot password?
              </Link> */}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 sm:py-5 bg-linear-to-r from-cyan-500 via-blue-500 to-blue-600 hover:from-cyan-400 hover:via-blue-400 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-600 disabled:cursor-not-allowed text-white text-base sm:text-lg font-bold rounded-xl sm:rounded-2xl transition-all duration-300 shadow-lg hover:shadow-cyan-500/50 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 group"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform duration-200" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-center text-slate-400 text-sm sm:text-base">
              Don't have an account?{' '}
              <Link to="/register" className="text-cyan-400 font-semibold hover:text-cyan-300 hover:underline transition-colors duration-200">
                Create one here
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-slate-500 text-xs sm:text-sm mt-6 sm:mt-8">
          Protected by industry-standard security
        </p>
      </div>

      <ToastContainer
        theme="dark"
        position="top-center"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        className="mt-16 sm:mt-0"
      />

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default Login;
