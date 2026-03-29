import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Loader2, LogIn, Mail, Lock } from 'lucide-react';

const StudentLogin = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/login`, formData);
      
      localStorage.setItem('studentToken', response.data.token);
      localStorage.setItem('studentData', JSON.stringify(response.data.user));
      
      toast.success('Login Successful!');

      setTimeout(() => {
        if (response.data.user.isFirstLogin) {
          navigate('/setup-password');
        } else {
          navigate('/student-dashboard');
        }
      }, 1500);

    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black py-20 px-4 sm:px-6 relative overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 bg-linear-to-br from-slate-950 via-black to-slate-950 opacity-40"></div>

      <div className="max-w-md w-full relative z-10 bg-slate-950 p-8 rounded-3xl shadow-2xl border border-gray-800">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white tracking-tight">Student Login</h2>
          <p className="text-gray-400 mt-2 text-sm">Access your internship dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="group">
            <label className="block text-gray-300 mb-2 font-medium text-sm">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input 
                name="email" type="email" value={formData.email} onChange={handleChange} required 
                className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all" 
                placeholder="your@email.com" 
              />
            </div>
          </div>
          
          <div className="group">
            <label className="block text-gray-300 mb-2 font-medium text-sm">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input 
                name="password" type="password" value={formData.password} onChange={handleChange} required 
                className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all" 
                placeholder="••••••••" 
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">Default is Welcome@123</p>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full py-4 bg-white hover:bg-gray-100 text-black text-lg font-bold rounded-lg transition-all shadow-lg flex items-center justify-center gap-3 mt-8"
          >
            {loading ? <><Loader2 className="animate-spin" size={24} /> Authenticating...</> : <><LogIn size={24} /> Log In</>}
          </button>
        </form>
      </div>
      <ToastContainer position="top-center" theme="dark" autoClose={3000} />
    </div>
  );
};

export default StudentLogin;
