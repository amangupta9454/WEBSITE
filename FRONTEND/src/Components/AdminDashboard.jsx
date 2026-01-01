// // frontend/src/components/AdminDashboard.jsx

// import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import { toast, ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import * as XLSX from 'xlsx';
// import { LogOut, Loader2, Filter, Download, CheckCircle, Clock } from 'lucide-react';

// const AdminDashboard = () => {
//   const [applications, setApplications] = useState([]);
//   const [filteredApplications, setFilteredApplications] = useState([]);
//   const [domains, setDomains] = useState([]);
//   const [selectedDomain, setSelectedDomain] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [exporting, setExporting] = useState(false);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const token = localStorage.getItem('adminToken');
//     if (!token) {
//       toast.error('Admin login required');
//       navigate('/admin-login');
//       return;
//     }

//     fetchApplications(token);

//     // Auto-logout after 5 minutes
//     const logoutTimer = setTimeout(() => {
//       handleLogout();
//       toast.info('Session timed out due to inactivity');
//     }, 5 * 60 * 1000);

//     return () => clearTimeout(logoutTimer);
//   }, []);

//   const fetchApplications = async (token) => {
//     try {
//       const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/internships`, {
//         headers: { Authorization: `Bearer ${token}` }
//       });

//       const allApps = res.data;
//       setApplications(allApps);
//       setFilteredApplications(allApps);

//       const uniqueDomains = [...new Set(allApps.map(app => app.domain))];
//       setDomains(uniqueDomains);
//     } catch (err) {
//       toast.error('Failed to load applications');
//       localStorage.removeItem('adminToken');
//       navigate('/admin-login');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleFilter = (e) => {
//     const domain = e.target.value;
//     setSelectedDomain(domain);

//     if (domain === '') {
//       setFilteredApplications(applications);
//     } else {
//       setFilteredApplications(applications.filter(app => app.domain === domain));
//     }
//   };

//  const handleExport = async () => {
//   setExporting(true);
//   const token = localStorage.getItem('adminToken');

//   try {
//     // Only export NEW applications
//     const newApps = filteredApplications.filter(app => !app.downloadedAt);
    
//     if (newApps.length === 0) {
//       toast.info('No new applications to export');
//       setExporting(false);
//       return;
//     }

//     // Clean and ordered data for Excel
//     const data = newApps.map(app => ({
//       StudentID: app.studentId || 'N/A',
//       Name: app.name,
//       Email: app.email,
//       Domain: app.domain,
//       Duration: app.duration,
//       Mobile: app.mobile,
//       WhatsApp: app.whatsapp || app.mobile,
//       Course: app.course,
//       Branch: app.branch,
//       Year: app.year,
//       College: app.college,
//       State: app.state,
//       PassingYear: app.passingYear,
//       Portfolio: app.portfolio || 'N/A',
//       GitHub: app.github || 'N/A',
//       LinkedIn: app.linkedin || 'N/A',
//       WhyHire: app.whyHire,
//       HearAbout: app.hearAbout,
//       ResumeURL: app.resumeUrl,
//       AppliedAt: new Date(app.appliedAt).toLocaleString('en-IN'),
//     }));

//     // Create worksheet
//     const ws = XLSX.utils.json_to_sheet(data, {
//       header: [
//         'StudentID', 'Name', 'Email', 'Domain', 'Duration',
//         'Mobile', 'WhatsApp', 'Course', 'Branch', 'Year',
//         'College', 'State', 'PassingYear', 'Portfolio', 'GitHub',
//         'LinkedIn', 'WhyHire', 'HearAbout', 'ResumeURL', 'AppliedAt'
//       ]
//     });

//     // Auto-size columns
//     const colWidths = [
//       { wch: 15 }, // StudentID
//       { wch: 20 }, // Name
//       { wch: 30 }, // Email
//       { wch: 18 }, // Domain
//       { wch: 12 }, // Duration
//       { wch: 15 }, // Mobile
//       { wch: 15 }, // WhatsApp
//       { wch: 15 }, // Course
//       { wch: 15 }, // Branch
//       { wch: 10 }, // Year
//       { wch: 30 }, // College
//       { wch: 15 }, // State
//       { wch: 12 }, // PassingYear
//       { wch: 35 }, // Portfolio
//       { wch: 35 }, // GitHub
//       { wch: 35 }, // LinkedIn
//       { wch: 60 }, // WhyHire
//       { wch: 20 }, // HearAbout
//       { wch: 50 }, // ResumeURL
//       { wch: 22 }, // AppliedAt
//     ];
//     ws['!cols'] = colWidths;

//     // Create workbook
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, 'Internship Applications');

//     // Download file with nice name
//     const fileName = `CodeNova_New_Internships_${new Date().toISOString().slice(0,10)}.xlsx`;
//     XLSX.writeFile(wb, fileName);

//     // Mark as downloaded on backend
//     const applicationIds = newApps.map(app => app._id);
//     await axios.post(
//       `${import.meta.env.VITE_BACKEND_URL}/api/admin/mark-downloaded`,
//       { applicationIds },
//       { headers: { Authorization: `Bearer ${token}` } }
//     );

//     toast.success(`✅ ${newApps.length} new applications exported successfully!`);
    
//     // Refresh to update sections
//     fetchApplications(token);
//   } catch (err) {
//     console.error('Export error:', err);
//     toast.error('Export failed. Please try again.');
//   } finally {
//     setExporting(false);
//   }
// };

//   const handleLogout = () => {
//     localStorage.removeItem('adminToken');
//     toast.success('Admin logged out');
//     navigate('/admin-login');
//   };

//   if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;

//   const newApplications = filteredApplications.filter(app => !app.downloadedAt);
//   const downloadedApplications = filteredApplications.filter(app => app.downloadedAt);

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 pt-24 px-4">
//       <div className="max-w-7xl mx-auto">
//         <div className="flex justify-between items-center mb-8">
//           <h1 className="text-4xl font-bold text-white">Admin Dashboard - Internship Applications</h1>
//           <button onClick={handleLogout} className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center gap-2">
//             <LogOut size={20} /> Logout
//           </button>
//         </div>

//         <div className="space-y-12">
//           {/* Filter & Export */}
//           <div className="flex items-center gap-6">
//             <Filter size={28} className="text-white" />
//             <select value={selectedDomain} onChange={handleFilter} className="px-6 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-lg">
//               <option value="">All Domains</option>
//               {domains.map(d => <option key={d} value={d}>{d}</option>)}
//             </select>
//             <button 
//               onClick={handleExport} 
//               disabled={exporting || newApplications.length === 0} 
//               className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white rounded-full flex items-center gap-3 disabled:opacity-50"
//             >
//               {exporting ? <Loader2 className="animate-spin" size={24} /> : <Download size={24} />}
//               {exporting ? 'Exporting...' : 'Export New to Excel'}
//             </button>
//           </div>

//           {/* New Applications */}
//           <div className="bg-white/10 rounded-3xl p-10 border border-white/20">
//             <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
//               <Clock size={28} /> New Applications ({newApplications.length})
//             </h2>
//             {newApplications.length === 0 ? (
//               <p className="text-center text-slate-400 py-12 text-xl">No new applications available</p>
//             ) : (
//               <table className="w-full text-left text-white">
//                 <thead>
//                   <tr>
//                     <th>Student ID</th>
//                     <th>Name</th>
//                     <th>Email</th>
//                     <th>Domain</th>
//                     <th>Duration</th>
//                     <th>Applied At</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {newApplications.map((app, i) => (
//                     <tr key={i} className="border-b border-white/20">
//                       <td>{app.studentId}</td>
//                       <td>{app.name}</td>
//                       <td>{app.email}</td>
//                       <td>{app.domain}</td>
//                       <td>{app.duration}</td>
//                       <td>{new Date(app.appliedAt).toLocaleString()}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             )}
//           </div>

//           {/* Already Downloaded */}
//           <div className="bg-white/10 rounded-3xl p-10 border border-white/20">
//             <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
//               <CheckCircle size={28} /> Already Downloaded ({downloadedApplications.length})
//             </h2>
//             {downloadedApplications.length === 0 ? (
//               <p className="text-center text-slate-400 py-12 text-xl">No downloaded applications</p>
//             ) : (
//               <table className="w-full text-left text-white">
//                 <thead>
//                   <tr>
//                     <th>Student ID</th>
//                     <th>Name</th>
//                     <th>Email</th>
//                     <th>Domain</th>
//                     <th>Duration</th>
//                     <th>Applied At</th>
//                     <th>Downloaded At</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {downloadedApplications.map((app, i) => (
//                     <tr key={i} className="border-b border-white/20">
//                       <td>{app.studentId}</td>
//                       <td>{app.name}</td>
//                       <td>{app.email}</td>
//                       <td>{app.domain}</td>
//                       <td>{app.duration}</td>
//                       <td>{new Date(app.appliedAt).toLocaleString()}</td>
//                       <td>{new Date(app.downloadedAt).toLocaleString()}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             )}
//           </div>
//         </div>
//       </div>

//       <ToastContainer theme="dark" position="top-center" />
//     </div>
//   );
// };

// export default AdminDashboard;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import * as XLSX from 'xlsx';
import { LogOut, Loader2, Filter, Download, CheckCircle, Clock, User, Mail, Briefcase, Calendar, Phone, GraduationCap, MapPin, FileText } from 'lucide-react';

const AdminDashboard = () => {
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [domains, setDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      toast.error('Admin login required');
      navigate('/admin-login');
      return;
    }

    fetchApplications(token);

    const logoutTimer = setTimeout(() => {
      handleLogout();
      toast.info('Session timed out due to inactivity');
    }, 5 * 60 * 1000);

    return () => clearTimeout(logoutTimer);
  }, []);

  const fetchApplications = async (token) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/internships`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const allApps = res.data;
      setApplications(allApps);
      setFilteredApplications(allApps);

      const uniqueDomains = [...new Set(allApps.map(app => app.domain))];
      setDomains(uniqueDomains);
    } catch (err) {
      toast.error('Failed to load applications');
      localStorage.removeItem('adminToken');
      navigate('/admin-login');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (e) => {
    const domain = e.target.value;
    setSelectedDomain(domain);

    if (domain === '') {
      setFilteredApplications(applications);
    } else {
      setFilteredApplications(applications.filter(app => app.domain === domain));
    }
  };

  const handleExport = async () => {
    setExporting(true);
    const token = localStorage.getItem('adminToken');

    try {
      const newApps = filteredApplications.filter(app => !app.downloadedAt);
      
      if (newApps.length === 0) {
        toast.info('No new applications to export');
        setExporting(false);
        return;
      }

      const data = newApps.map(app => ({
        StudentID: app.studentId || 'N/A',
        Name: app.name,
        Email: app.email,
        Domain: app.domain,
        Duration: app.duration,
        Mobile: app.mobile,
        WhatsApp: app.whatsapp || app.mobile,
        Course: app.course,
        Branch: app.branch,
        Year: app.year,
        College: app.college,
        State: app.state,
        PassingYear: app.passingYear,
        Portfolio: app.portfolio || 'N/A',
        GitHub: app.github || 'N/A',
        LinkedIn: app.linkedin || 'N/A',
        WhyHire: app.whyHire,
        HearAbout: app.hearAbout,
        ResumeURL: app.resumeUrl,
        AppliedAt: new Date(app.appliedAt).toLocaleString('en-IN'),
      }));

      const ws = XLSX.utils.json_to_sheet(data, {
        header: [
          'StudentID', 'Name', 'Email', 'Domain', 'Duration',
          'Mobile', 'WhatsApp', 'Course', 'Branch', 'Year',
          'College', 'State', 'PassingYear', 'Portfolio', 'GitHub',
          'LinkedIn', 'WhyHire', 'HearAbout', 'ResumeURL', 'AppliedAt'
        ]
      });

      const colWidths = [
        { wch: 15 }, { wch: 20 }, { wch: 30 }, { wch: 18 }, { wch: 12 },
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 },
        { wch: 30 }, { wch: 15 }, { wch: 12 }, { wch: 35 }, { wch: 35 },
        { wch: 35 }, { wch: 60 }, { wch: 20 }, { wch: 50 }, { wch: 22 },
      ];
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Internship Applications');

      const fileName = `CodeNova_New_Internships_${new Date().toISOString().slice(0,10)}.xlsx`;
      XLSX.writeFile(wb, fileName);

      const applicationIds = newApps.map(app => app._id);
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/mark-downloaded`,
        { applicationIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`${newApps.length} new applications exported successfully!`);
      
      fetchApplications(token);
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    toast.success('Admin logged out');
    navigate('/admin-login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-white text-xl font-medium">Loading applications...</p>
        </div>
      </div>
    );
  }

  const newApplications = filteredApplications.filter(app => !app.downloadedAt);
  const downloadedApplications = filteredApplications.filter(app => app.downloadedAt);

  const ApplicationCard = ({ app, isDownloaded }) => (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{app.name}</h3>
            <p className="text-sm text-slate-400">{app.studentId || 'N/A'}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          isDownloaded 
            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
        }`}>
          {isDownloaded ? 'Downloaded' : 'New'}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-slate-300">
          <Mail className="w-4 h-4 text-slate-500" />
          <span className="text-sm break-all">{app.email}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <Briefcase className="w-4 h-4 text-slate-500" />
          <span className="text-sm">{app.domain} - {app.duration}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <Phone className="w-4 h-4 text-slate-500" />
          <span className="text-sm">{app.mobile}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <GraduationCap className="w-4 h-4 text-slate-500" />
          <span className="text-sm">{app.course} - {app.branch} ({app.year})</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <MapPin className="w-4 h-4 text-slate-500" />
          <span className="text-sm">{app.college}, {app.state}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span className="text-sm">Applied: {new Date(app.appliedAt).toLocaleString('en-IN')}</span>
        </div>
        {isDownloaded && app.downloadedAt && (
          <div className="flex items-center gap-2 text-slate-300">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm">Downloaded: {new Date(app.downloadedAt).toLocaleString('en-IN')}</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-0 mb-8 pt-20">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2">
              Admin Dashboard
            </h1>
            <p className="text-slate-400 text-sm sm:text-base">Manage internship applications</p>
          </div>
          <button 
            onClick={handleLogout} 
            className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 hover:scale-105 font-medium"
          >
            <LogOut size={20} /> 
            <span>Logout</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-linear-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1">Total Applications</p>
                <p className="text-3xl font-bold text-white">{filteredApplications.length}</p>
              </div>
              <FileText className="w-12 h-12 text-blue-400 opacity-80" />
            </div>
          </div>

          <div className="bg-linear-to-br from-amber-500/20 to-amber-600/20 backdrop-blur-sm rounded-xl p-6 border border-amber-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1">New Applications</p>
                <p className="text-3xl font-bold text-white">{newApplications.length}</p>
              </div>
              <Clock className="w-12 h-12 text-amber-400 opacity-80" />
            </div>
          </div>

          <div className="bg-linear-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm rounded-xl p-6 border border-green-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1">Downloaded</p>
                <p className="text-3xl font-bold text-white">{downloadedApplications.length}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-400 opacity-80" />
            </div>
          </div>
        </div>

        <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-400 mb-2">Filter by Domain</label>
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                <select 
                  value={selectedDomain} 
                  onChange={handleFilter} 
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">All Domains</option>
                  {domains.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="flex items-end">
              <button 
                onClick={handleExport} 
                disabled={exporting || newApplications.length === 0} 
                className="w-full sm:w-auto px-8 py-3 bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-500/30 font-medium"
              >
                {exporting ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <Download size={20} />
                    <span className="hidden sm:inline">Export New to Excel</span>
                    <span className="sm:hidden">Export</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl p-6 lg:p-8 border border-slate-700/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Clock size={24} className="text-amber-400" />
              </div>
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold text-white">New Applications</h2>
                <p className="text-slate-400 text-sm">{newApplications.length} pending review</p>
              </div>
            </div>

            {newApplications.length === 0 ? (
              <div className="text-center py-16">
                <Clock className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">No new applications available</p>
                <p className="text-slate-500 text-sm mt-2">All applications have been downloaded</p>
              </div>
            ) : (
              <>
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-4 px-4 text-sm font-semibold text-slate-400">Student ID</th>
                        <th className="text-left py-4 px-4 text-sm font-semibold text-slate-400">Name</th>
                        <th className="text-left py-4 px-4 text-sm font-semibold text-slate-400">Email</th>
                        <th className="text-left py-4 px-4 text-sm font-semibold text-slate-400">Domain</th>
                        <th className="text-left py-4 px-4 text-sm font-semibold text-slate-400">Duration</th>
                        <th className="text-left py-4 px-4 text-sm font-semibold text-slate-400">Applied At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {newApplications.map((app, i) => (
                        <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                          <td className="py-4 px-4 text-slate-300">{app.studentId || 'N/A'}</td>
                          <td className="py-4 px-4 text-white font-medium">{app.name}</td>
                          <td className="py-4 px-4 text-slate-300">{app.email}</td>
                          <td className="py-4 px-4">
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                              {app.domain}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-slate-300">{app.duration}</td>
                          <td className="py-4 px-4 text-slate-300">{new Date(app.appliedAt).toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
                  {newApplications.map((app, i) => (
                    <ApplicationCard key={i} app={app} isDownloaded={false} />
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl p-6 lg:p-8 border border-slate-700/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <CheckCircle size={24} className="text-green-400" />
              </div>
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold text-white">Already Downloaded</h2>
                <p className="text-slate-400 text-sm">{downloadedApplications.length} applications processed</p>
              </div>
            </div>

            {downloadedApplications.length === 0 ? (
              <div className="text-center py-16">
                <CheckCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">No downloaded applications</p>
                <p className="text-slate-500 text-sm mt-2">Export new applications to see them here</p>
              </div>
            ) : (
              <>
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-4 px-4 text-sm font-semibold text-slate-400">Student ID</th>
                        <th className="text-left py-4 px-4 text-sm font-semibold text-slate-400">Name</th>
                        <th className="text-left py-4 px-4 text-sm font-semibold text-slate-400">Email</th>
                        <th className="text-left py-4 px-4 text-sm font-semibold text-slate-400">Domain</th>
                        <th className="text-left py-4 px-4 text-sm font-semibold text-slate-400">Duration</th>
                        <th className="text-left py-4 px-4 text-sm font-semibold text-slate-400">Applied At</th>
                        <th className="text-left py-4 px-4 text-sm font-semibold text-slate-400">Downloaded At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {downloadedApplications.map((app, i) => (
                        <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                          <td className="py-4 px-4 text-slate-300">{app.studentId || 'N/A'}</td>
                          <td className="py-4 px-4 text-white font-medium">{app.name}</td>
                          <td className="py-4 px-4 text-slate-300">{app.email}</td>
                          <td className="py-4 px-4">
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                              {app.domain}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-slate-300">{app.duration}</td>
                          <td className="py-4 px-4 text-slate-300">{new Date(app.appliedAt).toLocaleString('en-IN')}</td>
                          <td className="py-4 px-4 text-green-400">{new Date(app.downloadedAt).toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
                  {downloadedApplications.map((app, i) => (
                    <ApplicationCard key={i} app={app} isDownloaded={true} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <ToastContainer theme="dark" position="top-center" autoClose={3000} />
    </div>
  );
};

export default AdminDashboard;
