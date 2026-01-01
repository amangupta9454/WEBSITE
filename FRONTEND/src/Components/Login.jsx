import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    console.log(`[Login] Input changed: ${name} =`, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[Login] Login attempt started with:', { email: formData.email });

    setLoading(true);

    try {
      console.log('[Login] Sending login request to backend...');
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/login`, formData);

      console.log('[Login] Login successful:', res.data);

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      console.log('[Login] Credentials saved to localStorage');

      toast.success('🎉 You are logged in successfully!', {
        position: 'top-center',
        autoClose: 3000,
      });

      console.log('[Login] Redirecting to dashboard...');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Login failed';
      console.error('[Login] Login failed:', err.response || err);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
      console.log('[Login] Login attempt finished');
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 border border-white/20">
          <h2 className="text-3xl font-bold text-center text-white mb-8">Welcome Back</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email Address"
              required
              className="w-full px-5 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 transition"
            />

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                required
                className="w-full px-5 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 transition pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-linear-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold rounded-xl transition-all duration-300 shadow-xl hover:shadow-cyan-500/50 disabled:opacity-70 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={20} />
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>

          <p className="text-center text-slate-300 mt-8">
            Don't have an account?{' '}
            <Link to="/register" className="text-cyan-400 font-medium hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </div>

      <ToastContainer theme="dark" position="top-center" />
    </div>
  );
};

export default Login;