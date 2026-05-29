import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Loader2, LogIn, Mail, BadgeCheck } from 'lucide-react';

const StudentLogin = () => {
  const [formData, setFormData] = useState({ email: '', internId: '' });
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
        navigate('/student-dashboard');
      }, 1500);

    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden font-sans flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-100/50 to-transparent"></div>
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute top-48 -left-24 w-72 h-72 bg-purple-400/20 rounded-full blur-3xl opacity-50"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 sm:p-10 border border-slate-200">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Student Login
            </h2>
            <p className="text-slate-500 mt-2 text-sm font-medium">
              Access your internship dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="group">
              <label className="block text-slate-700 mb-2 text-sm font-semibold">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                <input 
                  name="email" type="email" value={formData.email} onChange={handleChange} required 
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" 
                  placeholder="your@email.com" 
                />
              </div>
            </div>
            
            <div className="group">
              <label className="block text-slate-700 mb-2 text-sm font-semibold">Intern ID</label>
              <div className="relative">
                <BadgeCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                <input 
                  name="internId" type="text" value={formData.internId} onChange={handleChange} required 
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" 
                  placeholder="e.g. CAN-XXXX" 
                />
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full mt-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-blue-600/20 disabled:opacity-70 flex items-center justify-center gap-2 text-lg"
            >
              {loading ? <><Loader2 className="animate-spin" size={24} /> Authenticating...</> : <><LogIn size={24} /> Log In</>}
            </button>
          </form>
        </div>
      </div>
      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
};

export default StudentLogin;
