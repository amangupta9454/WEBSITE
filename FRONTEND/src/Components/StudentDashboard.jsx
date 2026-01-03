// import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import { toast, ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import { LogOut, Calendar, Briefcase, Badge } from 'lucide-react';

// const StudentDashboard = () => {
//   const [user, setUser] = useState(null);
//   const [internships, setInternships] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();

//   const fetchData = async () => {
//     const token = localStorage.getItem('token');
//     if (!token) {
//       toast.error('Session expired. Please login again.');
//       navigate('/login');
//       return;
//     }

//     try {
//       const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/me`, {
//         headers: { Authorization: `Bearer ${token}` }
//       });
//       setUser(res.data);
//       setInternships(res.data.internships || []);
//     } catch (err) {
//       toast.error('Failed to load dashboard');
//       localStorage.clear();
//       navigate('/login');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//     const interval = setInterval(fetchData, 15000); // Auto-refresh every 15 sec
//     return () => clearInterval(interval);
//   }, []);

//   const handleLogout = () => {
//     localStorage.clear();
//     toast.success('Logged out successfully!');
//     navigate('/');
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-linear-to-br from-slate-900 to-slate-800 flex items-center justify-center">
//         <div className="text-white text-3xl">Loading your dashboard...</div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 pt-24 px-4 pb-20">
//       <div className="max-w-6xl mx-auto space-y-12">

//         {/* Profile Section */}
//         <div className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-10 border border-white/20">
//           <div className="flex flex-col md:flex-row items-center gap-12">
//             <img
//               src={user?.profileImage || '/default-avatar.png'}
//               alt="Profile"
//               className="w-48 h-48 rounded-full object-cover border-8 border-cyan-500/60 shadow-2xl"
//             />
//             <div className="text-center md:text-left">
//               <h1 className="text-5xl font-bold text-white mb-4">{user?.name}</h1>
//               <p className="text-2xl text-cyan-300 mb-3">{user?.email}</p>
//               <p className="text-xl text-slate-300 flex items-center gap-3 justify-center md:justify-start mb-8">
//                 <Briefcase size={26} /> {user?.mobile}
//               </p>
//               <button
//                 onClick={handleLogout}
//                 className="px-10 py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-full transition-all shadow-lg flex items-center gap-3"
//               >
//                 <LogOut size={22} /> Logout
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Internship Applications */}
//         <div className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-10 border border-white/20">
//           <h2 className="text-4xl font-bold text-white mb-10 text-center">Your Internship Applications</h2>

//           {internships.length === 0 ? (
//             <div className="text-center py-20">
//               <Briefcase size={90} className="mx-auto text-slate-500 mb-8" />
//               <p className="text-3xl text-slate-300">No applications yet</p>
//               <p className="text-xl text-slate-500 mt-4">Apply for an internship to see your Student ID here!</p>
//             </div>
//           ) : (
//             <div className="overflow-x-auto">
//               <table className="w-full text-white text-left">
//                 <thead className="border-b-2 border-cyan-500/60">
//                   <tr>
//                     <th className="py-6 px-8 text-lg">S.No</th>
//                     <th className="py-6 px-8 text-lg">Student ID</th>
//                     <th className="py-6 px-8 text-lg">Domain</th>
//                     <th className="py-6 px-8 text-lg">Duration</th>
//                     <th className="py-6 px-8 text-lg">Applied On</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {internships.map((app, index) => (
//                     <tr key={index} className="border-b border-white/10 hover:bg-white/5 transition">
//                       <td className="py-8 px-8 text-2xl font-medium">{index + 1}</td>
//                       <td className="py-8 px-8 text-2xl font-bold text-cyan-300 flex items-center gap-3">
//                         <Badge size={28} />
//                         {app.studentId || 'Generating...'}
//                       </td>
//                       <td className="py-8 px-8 text-xl">{app.domain}</td>
//                       <td className="py-8 px-8 text-xl">{app.duration}</td>
//                       <td className="py-8 px-8 text-xl flex items-center gap-3">
//                         <Calendar size={24} />
//                         {new Date(app.appliedAt).toLocaleDateString('en-IN', {
//                           day: '2-digit',
//                           month: 'long',
//                           year: 'numeric'
//                         })}
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>
//       </div>

//       <ToastContainer position="top-center" theme="dark" autoClose={5000} />
//     </div>
//   );
// };

// export default StudentDashboard;



// // before 3 jan
// import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import { toast, ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import { LogOut, Calendar, Briefcase, Badge, User, Mail, Phone, ChevronRight, Clock, Loader2 } from 'lucide-react';

// const StudentDashboard = () => {
//   const [user, setUser] = useState(null);
//   const [internships, setInternships] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();

//   const fetchData = async () => {
//     const token = localStorage.getItem('token');
//     if (!token) {
//       toast.error('Session expired. Please login again.');
//       navigate('/login');
//       return;
//     }

//     try {
//       const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/me`, {
//         headers: { Authorization: `Bearer ${token}` }
//       });
//       setUser(res.data);
//       setInternships(res.data.internships || []);
//     } catch (err) {
//       toast.error('Failed to load dashboard');
//       localStorage.clear();
//       navigate('/login');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//     const interval = setInterval(fetchData, 15000);
//     return () => clearInterval(interval);
//   }, []);

//   const handleLogout = () => {
//     localStorage.clear();
//     toast.success('Logged out successfully!');
//     navigate('/');
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center px-4">
//         <div className="text-center">
//           <Loader2 className="w-16 h-16 text-cyan-500 animate-spin mx-auto mb-4" />
//           <p className="text-white text-xl font-semibold">Loading your dashboard...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-800 pt-8 sm:pt-12 px-4 sm:px-6 lg:px-8 pb-12 relative overflow-hidden">
//       <div className="absolute inset-0 overflow-hidden pointer-events-none">
//         <div className="absolute top-20 -right-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
//         <div className="absolute top-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
//       </div>

//       <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 relative z-10 pt-14">
        
//         {/* Profile Section */}
//         <div className="bg-white/5 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/10 hover:border-white/20 transition-all duration-300">
//           <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
//             <div className="relative group shrink-0">
//               <div className="absolute -inset-1 bg-linear-to-r from-cyan-500 to-blue-500 rounded-full blur opacity-40 group-hover:opacity-60 transition duration-300"></div>
//               <img
//                 src={user?.profileImage || '/default-avatar.png'}
//                 alt="Profile"
//                 className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-slate-900 shadow-2xl"
//               />
//             </div>

//             <div className="flex-1 text-center sm:text-left w-full">
//               <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 tracking-tight">{user?.name}</h1>
              
//               <div className="space-y-2 mb-5">
//                 <p className="text-cyan-400 text-sm sm:text-base font-medium flex items-center gap-2 justify-center sm:justify-start">
//                   <Mail size={18} />
//                   {user?.email}
//                 </p>
//                 <p className="text-slate-300 text-sm sm:text-base flex items-center gap-2 justify-center sm:justify-start">
//                   <Phone size={18} />
//                   {user?.mobile}
//                 </p>
//               </div>

//               <button
//                 onClick={handleLogout}
//                 className="inline-flex items-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 bg-linear-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-sm sm:text-base font-semibold rounded-full transition-all duration-300 shadow-lg hover:shadow-red-500/50 hover:scale-105 active:scale-95"
//               >
//                 <LogOut size={18} />
//                 Logout
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Internship Applications */}
//         <div className="bg-white/5 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/10 hover:border-white/20 transition-all duration-300 overflow-hidden">
//           <div className="p-6 sm:p-8 border-b border-white/10">
//             <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
//               <Briefcase className="text-cyan-400" size={28} />
//               Your Applications
//             </h2>
//           </div>

//           {internships.length === 0 ? (
//             <div className="p-8 sm:p-12 text-center">
//               <div className="bg-white/5 rounded-2xl p-8 sm:p-12 border border-white/10 inline-block">
//                 <Briefcase size={60} className="mx-auto text-slate-500 mb-4" />
//                 <p className="text-lg sm:text-xl text-slate-300 font-medium">No applications yet</p>
//                 <p className="text-sm text-slate-500 mt-2">Apply for an internship to see your applications here</p>
//               </div>
//             </div>
//           ) : (
//             <div className="overflow-x-auto">
//               <div className="inline-block min-w-full">
//                 <table className="w-full text-white text-left text-sm sm:text-base">
//                   <thead className="bg-white/5 border-b border-white/10">
//                     <tr>
//                       <th className="py-4 px-4 sm:px-6 font-semibold text-slate-300">#</th>
//                       <th className="py-4 px-4 sm:px-6 font-semibold text-slate-300">Student ID</th>
//                       <th className="py-4 px-4 sm:px-6 font-semibold text-slate-300">Domain</th>
//                       <th className="py-4 px-4 sm:px-6 font-semibold text-slate-300">Duration</th>
//                       <th className="py-4 px-4 sm:px-6 font-semibold text-slate-300">Applied</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-white/10">
//                     {internships.map((app, index) => (
//                       <tr key={index} className="hover:bg-white/5 transition-colors duration-200">
//                         <td className="py-4 px-4 sm:px-6 font-medium text-cyan-400">{index + 1}</td>
//                         <td className="py-4 px-4 sm:px-6">
//                           <div className="flex items-center gap-2">
//                             <Badge size={18} className="text-cyan-400 shrink-0" />
//                             <span className="font-medium text-cyan-300">{app.studentId || 'Generating...'}</span>
//                           </div>
//                         </td>
//                         <td className="py-4 px-4 sm:px-6 text-slate-200">{app.domain}</td>
//                         <td className="py-4 px-4 sm:px-6 text-slate-200">{app.duration}</td>
//                         <td className="py-4 px-4 sm:px-6">
//                           <div className="flex items-center gap-2 text-slate-300">
//                             <Calendar size={16} />
//                             {new Date(app.appliedAt).toLocaleDateString('en-IN', {
//                               day: '2-digit',
//                               month: 'short',
//                               year: 'numeric'
//                             })}
//                           </div>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           )}

//           {internships.length > 0 && (
//             <div className="px-6 sm:px-8 py-4 bg-white/5 border-t border-white/10 flex items-center justify-between">
//               <p className="text-sm text-slate-400">Total applications: <span className="text-cyan-400 font-semibold">{internships.length}</span></p>
//             </div>
//           )}
//         </div>

//         {/* Quick Stats */}
//         {internships.length > 0 && (
//           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
//             <div className="bg-white/5 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 hover:border-cyan-500/30 transition-all duration-300">
//               <div className="flex items-center gap-4">
//                 <div className="p-3 bg-cyan-500/20 rounded-lg">
//                   <Badge className="text-cyan-400" size={24} />
//                 </div>
//                 <div>
//                   <p className="text-slate-400 text-sm">Total Applications</p>
//                   <p className="text-2xl font-bold text-white">{internships.length}</p>
//                 </div>
//               </div>
//             </div>

//             <div className="bg-white/5 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 hover:border-blue-500/30 transition-all duration-300">
//               <div className="flex items-center gap-4">
//                 <div className="p-3 bg-blue-500/20 rounded-lg">
//                   <Clock className="text-blue-400" size={24} />
//                 </div>
//                 <div>
//                   <p className="text-slate-400 text-sm">Member Since</p>
//                   <p className="text-lg font-bold text-white">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Recent'}</p>
//                 </div>
//               </div>
//             </div>

//             <div className="bg-white/5 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 hover:border-teal-500/30 transition-all duration-300">
//               <div className="flex items-center gap-4">
//                 <div className="p-3 bg-teal-500/20 rounded-lg">
//                   <User className="text-teal-400" size={24} />
//                 </div>
//                 <div>
//                   <p className="text-slate-400 text-sm">Account Status</p>
//                   <p className="text-lg font-bold text-emerald-400">Active</p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>

//       <ToastContainer
//         position="top-center"
//         theme="dark"
//         autoClose={5000}
//         hideProgressBar={false}
//         newestOnTop
//         closeOnClick
//         rtl={false}
//         pauseOnFocusLoss
//         draggable
//         pauseOnHover
//         className="mt-16 sm:mt-0"
//       />

//       <style>{`
//         @keyframes blob {
//           0% { transform: translate(0px, 0px) scale(1); }
//           33% { transform: translate(30px, -50px) scale(1.1); }
//           66% { transform: translate(-20px, 20px) scale(0.9); }
//           100% { transform: translate(0px, 0px) scale(1); }
//         }
//         .animate-blob {
//           animation: blob 7s infinite;
//         }
//         .animation-delay-2000 {
//           animation-delay: 2s;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default StudentDashboard;


// certificate download fields 3 jan
// frontend/src/components/StudentDashboard.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { LogOut, Calendar, Briefcase, Badge, User, Mail, Phone, ChevronRight, Clock, Loader2, DownloadCloud } from 'lucide-react';

const StudentDashboard = () => {
  const [user, setUser] = useState(null);
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Session expired. Please login again.');
      navigate('/login');
      return;
    }

    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data);
      setInternships(res.data.internships || []);
    } catch (err) {
      toast.error('Failed to load dashboard');
      localStorage.clear();
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    toast.success('Logged out successfully!');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-cyan-500 animate-spin mx-auto mb-4" />
          <p className="text-white text-xl font-semibold">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-800 pt-8 sm:pt-12 px-4 sm:px-6 lg:px-8 pb-12 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -right-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute top-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 relative z-10 pt-14">
        
        {/* Profile Section */}
        <div className="bg-white/5 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/10 hover:border-white/20 transition-all duration-300">
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
            <div className="relative group shrink-0">
              <div className="absolute -inset-1 bg-linear-to-r from-cyan-500 to-blue-500 rounded-full blur opacity-40 group-hover:opacity-60 transition duration-300"></div>
              <img
                src={user?.profileImage || '/default-avatar.png'}
                alt="Profile"
                className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-slate-900 shadow-2xl"
              />
            </div>

            <div className="flex-1 text-center sm:text-left w-full">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 tracking-tight">{user?.name}</h1>
              
              <div className="space-y-2 mb-5">
                <p className="text-cyan-400 text-sm sm:text-base font-medium flex items-center gap-2 justify-center sm:justify-start">
                  <Mail size={18} />
                  {user?.email}
                </p>
                <p className="text-slate-300 text-sm sm:text-base flex items-center gap-2 justify-center sm:justify-start">
                  <Phone size={18} />
                  {user?.mobile}
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 bg-linear-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-sm sm:text-base font-semibold rounded-full transition-all duration-300 shadow-lg hover:shadow-red-500/50 hover:scale-105 active:scale-95"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Internship Applications */}
        <div className="bg-white/5 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/10 hover:border-white/20 transition-all duration-300 overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-white/10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
              <Briefcase className="text-cyan-400" size={28} />
              Your Applications
            </h2>
          </div>

          {internships.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <div className="bg-white/5 rounded-2xl p-8 sm:p-12 border border-white/10 inline-block">
                <Briefcase size={60} className="mx-auto text-slate-500 mb-4" />
                <p className="text-lg sm:text-xl text-slate-300 font-medium">No applications yet</p>
                <p className="text-sm text-slate-500 mt-2">Apply for an internship to see your applications here</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full">
                <table className="w-full text-white text-left text-sm sm:text-base">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="py-4 px-4 sm:px-6 font-semibold text-slate-300">#</th>
                      <th className="py-4 px-4 sm:px-6 font-semibold text-slate-300">Student ID</th>
                      <th className="py-4 px-4 sm:px-6 font-semibold text-slate-300">Domain</th>
                      <th className="py-4 px-4 sm:px-6 font-semibold text-slate-300">Duration</th>
                      <th className="py-4 px-4 sm:px-6 font-semibold text-slate-300">Applied</th>
                      <th className="py-4 px-4 sm:px-6 font-semibold text-slate-300">Start</th>
                      <th className="py-4 px-4 sm:px-6 font-semibold text-slate-300">End</th>
                      <th className="py-4 px-4 sm:px-6 font-semibold text-slate-300">Months</th>
                      <th className="py-4 px-4 sm:px-6 font-semibold text-slate-300">Certificate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {internships.map((app, index) => (
                      <tr key={index} className="hover:bg-white/5 transition-colors duration-200">
                        <td className="py-4 px-4 sm:px-6 font-medium text-cyan-400">{index + 1}</td>
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center gap-2">
                            <Badge size={18} className="text-cyan-400 shrink-0" />
                            <span className="font-medium text-cyan-300">{app.studentId || 'Generating...'}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-slate-200">{app.domain}</td>
                        <td className="py-4 px-4 sm:px-6 text-slate-200">{app.duration}</td>
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center gap-2 text-slate-300">
                            <Calendar size={16} />
                            {new Date(app.appliedAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-slate-200">
                          {app.startDate ? new Date(app.startDate).toLocaleDateString('en-IN') : 'N/A'}
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-slate-200">
                          {app.endDate ? new Date(app.endDate).toLocaleDateString('en-IN') : 'N/A'}
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-slate-200">{app.totalMonths || 'N/A'}</td>
                        <td className="py-4 px-4 sm:px-6">
                          {app.certificateUrl ? (
                            <a
                              href={app.certificateUrl}
                              download
                              className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
                            >
                              <DownloadCloud size={16} />
                              Download
                            </a>
                          ) : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {internships.length > 0 && (
            <div className="px-6 sm:px-8 py-4 bg-white/5 border-t border-white/10 flex items-center justify-between">
              <p className="text-sm text-slate-400">Total applications: <span className="text-cyan-400 font-semibold">{internships.length}</span></p>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        {internships.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-white/5 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 hover:border-cyan-500/30 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-cyan-500/20 rounded-lg">
                  <Badge className="text-cyan-400" size={24} />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Total Applications</p>
                  <p className="text-2xl font-bold text-white">{internships.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 hover:border-blue-500/30 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Clock className="text-blue-400" size={24} />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Member Since</p>
                  <p className="text-lg font-bold text-white">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Recent'}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 hover:border-teal-500/30 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-teal-500/20 rounded-lg">
                  <User className="text-teal-400" size={24} />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Account Status</p>
                  <p className="text-lg font-bold text-emerald-400">Active</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <ToastContainer
        position="top-center"
        theme="dark"
        autoClose={5000}
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
      `}</style>
    </div>
  );
};

export default StudentDashboard;