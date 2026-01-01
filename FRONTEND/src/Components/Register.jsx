import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Eye, EyeOff, Loader2, User } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [profileUrl, setProfileUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      toast.error('Profile image must be under 500 KB');
      return;
    }

    setProfileImage(URL.createObjectURL(file));
    uploadToCloudinary(file);
  };

  const uploadToCloudinary = async (file) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'profiles');

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.secure_url) {
        setProfileUrl(data.secure_url);
        toast.success('Profile image uploaded successfully!');
      }
    } catch (error) {
      toast.error('Image upload failed');
      setProfileImage(null);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!profileUrl) {
      toast.error('Please upload a profile image');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/register`, {
        ...formData,
        profileImage: profileUrl
      });

      toast.success('🎉 Registration successful! Redirecting to login...', {
        position: 'top-center',
        autoClose: 3000,
      });

      setTimeout(() => {
        navigate('/login');
      }, 3500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 border border-white/20">
          <h2 className="text-3xl font-bold text-center text-white mb-8">Create Your Account</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Image */}
            <div className="flex flex-col items-center">
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-cyan-500/50 shadow-xl">
                {profileImage ? (
                  <img src={profileImage} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-linear-to-br from-cyan-600 to-blue-600 flex items-center justify-center">
                    <User size={48} className="text-white/80" />
                  </div>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <Loader2 className="animate-spin text-white" size={32} />
                  </div>
                )}
              </div>

              <label className="mt-6 cursor-pointer">
                <span className="px-8 py-3 bg-linear-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold rounded-full transition shadow-lg">
                  {uploading ? 'Uploading...' : 'Upload Profile Photo'}
                </span>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" disabled={uploading} />
              </label>
              <p className="text-xs text-slate-400 mt-2">Max 500 KB</p>
            </div>

            {/* Name */}
            <div>
              <label className="block text-white mb-2">Full Name *</label>
              <input name="name" value={formData.name} onChange={handleChange} required placeholder="Enter your name" className="w-full px-5 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20" />
            </div>

            {/* Email */}
            <div>
              <label className="block text-white mb-2">Email Address *</label>
              <input name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="you@example.com" className="w-full px-5 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20" />
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-white mb-2">Mobile Number *</label>
              <input name="mobile" value={formData.mobile} onChange={handleChange} required maxLength="10" pattern="\d{10}" placeholder="10-digit number" className="w-full px-5 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20" />
            </div>

            {/* Password */}
            <div className="relative">
              <label className="block text-white mb-2">Password *</label>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="6"
                placeholder="Minimum 6 characters"
                className="w-full px-5 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 pr-12"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-12 text-slate-400 hover:text-white">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || uploading}
              className="w-full py-5 bg-linear-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white text-xl font-bold rounded-2xl transition-all duration-300 shadow-2xl flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-3" size={28} />
                  Creating Account...
                </>
              ) : (
                'Register Now'
              )}
            </button>
          </form>

          <p className="text-center text-slate-300 mt-8">
            Already have an account?{' '}
            <Link to="/login" className="text-cyan-400 font-semibold hover:underline">
              Login here
            </Link>
          </p>
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer position="top-center" theme="dark" autoClose={4000} />
    </div>
  );
};

export default Register;