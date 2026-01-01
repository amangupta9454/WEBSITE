import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { LogOut, Calendar, Briefcase, Badge } from 'lucide-react';

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
    const interval = setInterval(fetchData, 15000); // Auto-refresh every 15 sec
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    toast.success('Logged out successfully!');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-3xl">Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 pt-24 px-4 pb-20">
      <div className="max-w-6xl mx-auto space-y-12">

        {/* Profile Section */}
        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-10 border border-white/20">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <img
              src={user?.profileImage || '/default-avatar.png'}
              alt="Profile"
              className="w-48 h-48 rounded-full object-cover border-8 border-cyan-500/60 shadow-2xl"
            />
            <div className="text-center md:text-left">
              <h1 className="text-5xl font-bold text-white mb-4">{user?.name}</h1>
              <p className="text-2xl text-cyan-300 mb-3">{user?.email}</p>
              <p className="text-xl text-slate-300 flex items-center gap-3 justify-center md:justify-start mb-8">
                <Briefcase size={26} /> {user?.mobile}
              </p>
              <button
                onClick={handleLogout}
                className="px-10 py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-full transition-all shadow-lg flex items-center gap-3"
              >
                <LogOut size={22} /> Logout
              </button>
            </div>
          </div>
        </div>

        {/* Internship Applications */}
        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-10 border border-white/20">
          <h2 className="text-4xl font-bold text-white mb-10 text-center">Your Internship Applications</h2>

          {internships.length === 0 ? (
            <div className="text-center py-20">
              <Briefcase size={90} className="mx-auto text-slate-500 mb-8" />
              <p className="text-3xl text-slate-300">No applications yet</p>
              <p className="text-xl text-slate-500 mt-4">Apply for an internship to see your Student ID here!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-white text-left">
                <thead className="border-b-2 border-cyan-500/60">
                  <tr>
                    <th className="py-6 px-8 text-lg">S.No</th>
                    <th className="py-6 px-8 text-lg">Student ID</th>
                    <th className="py-6 px-8 text-lg">Domain</th>
                    <th className="py-6 px-8 text-lg">Duration</th>
                    <th className="py-6 px-8 text-lg">Applied On</th>
                  </tr>
                </thead>
                <tbody>
                  {internships.map((app, index) => (
                    <tr key={index} className="border-b border-white/10 hover:bg-white/5 transition">
                      <td className="py-8 px-8 text-2xl font-medium">{index + 1}</td>
                      <td className="py-8 px-8 text-2xl font-bold text-cyan-300 flex items-center gap-3">
                        <Badge size={28} />
                        {app.studentId || 'Generating...'}
                      </td>
                      <td className="py-8 px-8 text-xl">{app.domain}</td>
                      <td className="py-8 px-8 text-xl">{app.duration}</td>
                      <td className="py-8 px-8 text-xl flex items-center gap-3">
                        <Calendar size={24} />
                        {new Date(app.appliedAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ToastContainer position="top-center" theme="dark" autoClose={5000} />
    </div>
  );
};

export default StudentDashboard;