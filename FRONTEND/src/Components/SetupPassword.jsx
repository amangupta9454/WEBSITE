import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Loader2, ShieldCheck, KeyRound } from 'lucide-react';

const SetupPassword = () => {
  const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('studentToken');
    const userStr = localStorage.getItem('studentData');
    if (!token || !userStr) {
      navigate('/student-login');
      return;
    }
    const user = JSON.parse(userStr);
    if (!user.isFirstLogin) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (formData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('studentToken');
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/setup-password`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const user = JSON.parse(localStorage.getItem('studentData'));
      user.isFirstLogin = false;
      localStorage.setItem('studentData', JSON.stringify(user));

      toast.success('Password setup successfully!');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black py-20 px-4 relative flex items-center justify-center">
      <div className="absolute inset-0 bg-linear-to-bl from-slate-900 to-black opacity-50"></div>
      <div className="max-w-md w-full relative z-10 bg-slate-950 p-8 rounded-3xl shadow-2xl border border-gray-800">
        <div className="text-center mb-8">
          <ShieldCheck className="mx-auto text-emerald-400 mb-4" size={48} />
          <h2 className="text-2xl font-bold text-white">Setup New Password</h2>
          <p className="text-gray-400 mt-2 text-sm">Please change the default password to continue.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-300 mb-2 text-sm">New Password</label>
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input name="newPassword" type="password" value={formData.newPassword} onChange={handleChange} required className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white" />
            </div>
          </div>
          <div>
            <label className="block text-gray-300 mb-2 text-sm">Confirm Password</label>
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white" />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-lg transition-all flex justify-center items-center gap-2">
            {loading ? <Loader2 className="animate-spin" /> : 'Save Password'}
          </button>
        </form>
      </div>
      <ToastContainer theme="dark" autoClose={3000} />
    </div>
  );
};
export default SetupPassword;
