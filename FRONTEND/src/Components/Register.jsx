// import { useState } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import { toast, ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import { Eye, EyeOff, Loader2, User } from 'lucide-react';

// const Register = () => {
//   const [formData, setFormData] = useState({
//     name: '',
//     email: '',
//     mobile: '',
//     password: ''
//   });
//   const [showPassword, setShowPassword] = useState(false);
//   const [profileImage, setProfileImage] = useState(null);
//   const [profileUrl, setProfileUrl] = useState('');
//   const [uploading, setUploading] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleImageChange = (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     if (file.size > 500 * 1024) {
//       toast.error('Profile image must be under 500 KB');
//       return;
//     }

//     setProfileImage(URL.createObjectURL(file));
//     uploadToCloudinary(file);
//   };

//   const uploadToCloudinary = async (file) => {
//     setUploading(true);
//     const formData = new FormData();
//     formData.append('file', file);
//     formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
//     formData.append('folder', 'profiles');

//     try {
//       const res = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/upload`, {
//         method: 'POST',
//         body: formData
//       });
//       const data = await res.json();
//       if (data.secure_url) {
//         setProfileUrl(data.secure_url);
//         toast.success('Profile image uploaded successfully!');
//       }
//     } catch (error) {
//       toast.error('Image upload failed');
//       setProfileImage(null);
//     } finally {
//       setUploading(false);
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!profileUrl) {
//       toast.error('Please upload a profile image');
//       return;
//     }

//     setLoading(true);
//     try {
//       await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/register`, {
//         ...formData,
//         profileImage: profileUrl
//       });

//       toast.success('🎉 Registration successful! Redirecting to login...', {
//         position: 'top-center',
//         autoClose: 3000,
//       });

//       setTimeout(() => {
//         navigate('/login');
//       }, 3500);
//     } catch (err) {
//       toast.error(err.response?.data?.message || 'Registration failed');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center py-12 px-4">
//       <div className="w-full max-w-md">
//         <div className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 border border-white/20">
//           <h2 className="text-3xl font-bold text-center text-white mb-8">Create Your Account</h2>

//           <form onSubmit={handleSubmit} className="space-y-6">
//             {/* Profile Image */}
//             <div className="flex flex-col items-center">
//               <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-cyan-500/50 shadow-xl">
//                 {profileImage ? (
//                   <img src={profileImage} alt="Preview" className="w-full h-full object-cover" />
//                 ) : (
//                   <div className="w-full h-full bg-linear-to-br from-cyan-600 to-blue-600 flex items-center justify-center">
//                     <User size={48} className="text-white/80" />
//                   </div>
//                 )}
//                 {uploading && (
//                   <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
//                     <Loader2 className="animate-spin text-white" size={32} />
//                   </div>
//                 )}
//               </div>

//               <label className="mt-6 cursor-pointer">
//                 <span className="px-8 py-3 bg-linear-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold rounded-full transition shadow-lg">
//                   {uploading ? 'Uploading...' : 'Upload Profile Photo'}
//                 </span>
//                 <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" disabled={uploading} />
//               </label>
//               <p className="text-xs text-slate-400 mt-2">Max 500 KB</p>
//             </div>

//             {/* Name */}
//             <div>
//               <label className="block text-white mb-2">Full Name *</label>
//               <input name="name" value={formData.name} onChange={handleChange} required placeholder="Enter your name" className="w-full px-5 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20" />
//             </div>

//             {/* Email */}
//             <div>
//               <label className="block text-white mb-2">Email Address *</label>
//               <input name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="you@example.com" className="w-full px-5 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20" />
//             </div>

//             {/* Mobile */}
//             <div>
//               <label className="block text-white mb-2">Mobile Number *</label>
//               <input name="mobile" value={formData.mobile} onChange={handleChange} required maxLength="10" pattern="\d{10}" placeholder="10-digit number" className="w-full px-5 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20" />
//             </div>

//             {/* Password */}
//             <div className="relative">
//               <label className="block text-white mb-2">Password *</label>
//               <input
//                 type={showPassword ? 'text' : 'password'}
//                 name="password"
//                 value={formData.password}
//                 onChange={handleChange}
//                 required
//                 minLength="6"
//                 placeholder="Minimum 6 characters"
//                 className="w-full px-5 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 pr-12"
//               />
//               <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-12 text-slate-400 hover:text-white">
//                 {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
//               </button>
//             </div>

//             {/* Submit */}
//             <button
//               type="submit"
//               disabled={loading || uploading}
//               className="w-full py-5 bg-linear-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white text-xl font-bold rounded-2xl transition-all duration-300 shadow-2xl flex items-center justify-center"
//             >
//               {loading ? (
//                 <>
//                   <Loader2 className="animate-spin mr-3" size={28} />
//                   Creating Account...
//                 </>
//               ) : (
//                 'Register Now'
//               )}
//             </button>
//           </form>

//           <p className="text-center text-slate-300 mt-8">
//             Already have an account?{' '}
//             <Link to="/login" className="text-cyan-400 font-semibold hover:underline">
//               Login here
//             </Link>
//           </p>
//         </div>
//       </div>

//       {/* Toast Container */}
//       <ToastContainer position="top-center" theme="dark" autoClose={4000} />
//     </div>
//   );
// };

// export default Register;
// new
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Eye, EyeOff, Loader2, User, Mail, Phone, Lock, UserPlus, Upload, CheckCircle } from 'lucide-react';

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
  const [focusedField, setFocusedField] = useState(null);
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

      toast.success('Registration successful! Redirecting to login...', {
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
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8 sm:mb-10 pt-14">
          <div className="inline-block p-4 bg-linear-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-2xl mb-4 transform hover:scale-105 transition-transform duration-300">
            <UserPlus className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight">Create Account</h2>
          <p className="text-slate-400 text-sm sm:text-base">Join us and start your journey today</p>
        </div>

        <div className="bg-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/10 hover:border-white/20 transition-all duration-300">
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            <div className="flex flex-col items-center">
              <div className="relative group">
                <div className="absolute -inset-1 bg-linear-to-r from-cyan-500 via-blue-500 to-teal-500 rounded-full blur opacity-40 group-hover:opacity-60 transition duration-300"></div>
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-slate-800 shadow-2xl bg-linear-to-br from-slate-800 to-slate-900">
                  {profileImage ? (
                    <img src={profileImage} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-linear-to-br from-cyan-600 to-blue-600 flex items-center justify-center">
                      <User size={48} className="text-white/70" />
                    </div>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
                      <Loader2 className="animate-spin text-cyan-400" size={32} />
                    </div>
                  )}
                  {profileUrl && !uploading && (
                    <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1 shadow-lg">
                      <CheckCircle size={16} className="text-white" />
                    </div>
                  )}
                </div>
              </div>

              <label className="mt-5 sm:mt-6 cursor-pointer group">
                <span className="inline-flex items-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm sm:text-base font-semibold rounded-full transition-all duration-300 shadow-lg hover:shadow-cyan-500/50 hover:scale-105 active:scale-95">
                  <Upload size={18} />
                  {uploading ? 'Uploading...' : 'Upload Photo'}
                </span>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" disabled={uploading} />
              </label>
              <p className="text-xs text-slate-500 mt-2">Maximum file size: 500 KB</p>
            </div>

            <div className="relative">
              <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${focusedField === 'name' ? 'text-cyan-400' : 'text-slate-500'}`}>
                <User size={20} />
              </div>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                required
                placeholder="Full Name"
                className="w-full pl-12 pr-5 py-3.5 sm:py-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 focus:bg-white/10 transition-all duration-200 outline-none text-sm sm:text-base"
              />
            </div>

            <div className="relative">
              <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${focusedField === 'email' ? 'text-cyan-400' : 'text-slate-500'}`}>
                <Mail size={20} />
              </div>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                required
                placeholder="Email Address"
                className="w-full pl-12 pr-5 py-3.5 sm:py-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 focus:bg-white/10 transition-all duration-200 outline-none text-sm sm:text-base"
              />
            </div>

            <div className="relative">
              <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${focusedField === 'mobile' ? 'text-cyan-400' : 'text-slate-500'}`}>
                <Phone size={20} />
              </div>
              <input
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                onFocus={() => setFocusedField('mobile')}
                onBlur={() => setFocusedField(null)}
                required
                maxLength="10"
                pattern="\d{10}"
                placeholder="Mobile Number (10 digits)"
                className="w-full pl-12 pr-5 py-3.5 sm:py-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 focus:bg-white/10 transition-all duration-200 outline-none text-sm sm:text-base"
              />
            </div>

            <div className="relative">
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
                required
                minLength="6"
                placeholder="Password (min. 6 characters)"
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

            <button
              type="submit"
              disabled={loading || uploading}
              className="w-full py-4 sm:py-5 bg-linear-to-r from-cyan-500 via-blue-500 to-blue-600 hover:from-cyan-400 hover:via-blue-400 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-600 disabled:cursor-not-allowed text-white text-base sm:text-lg font-bold rounded-xl sm:rounded-2xl transition-all duration-300 shadow-lg hover:shadow-cyan-500/50 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 group"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <UserPlus size={22} className="group-hover:translate-x-1 transition-transform duration-200" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-center text-slate-400 text-sm sm:text-base">
              Already have an account?{' '}
              <Link to="/login" className="text-cyan-400 font-semibold hover:text-cyan-300 hover:underline transition-colors duration-200">
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-slate-500 text-xs sm:text-sm mt-6 sm:mt-8">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>

      <ToastContainer
        position="top-center"
        theme="dark"
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

export default Register;
