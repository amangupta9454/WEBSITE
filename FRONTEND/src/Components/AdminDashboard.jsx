// frontend/src/components/AdminDashboard.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import * as XLSX from 'xlsx';
import { LogOut, Loader2, Filter, Download, CheckCircle, Clock } from 'lucide-react';

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

    // Auto-logout after 5 minutes
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
    // Only export NEW applications
    const newApps = filteredApplications.filter(app => !app.downloadedAt);
    
    if (newApps.length === 0) {
      toast.info('No new applications to export');
      setExporting(false);
      return;
    }

    // Clean and ordered data for Excel
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

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(data, {
      header: [
        'StudentID', 'Name', 'Email', 'Domain', 'Duration',
        'Mobile', 'WhatsApp', 'Course', 'Branch', 'Year',
        'College', 'State', 'PassingYear', 'Portfolio', 'GitHub',
        'LinkedIn', 'WhyHire', 'HearAbout', 'ResumeURL', 'AppliedAt'
      ]
    });

    // Auto-size columns
    const colWidths = [
      { wch: 15 }, // StudentID
      { wch: 20 }, // Name
      { wch: 30 }, // Email
      { wch: 18 }, // Domain
      { wch: 12 }, // Duration
      { wch: 15 }, // Mobile
      { wch: 15 }, // WhatsApp
      { wch: 15 }, // Course
      { wch: 15 }, // Branch
      { wch: 10 }, // Year
      { wch: 30 }, // College
      { wch: 15 }, // State
      { wch: 12 }, // PassingYear
      { wch: 35 }, // Portfolio
      { wch: 35 }, // GitHub
      { wch: 35 }, // LinkedIn
      { wch: 60 }, // WhyHire
      { wch: 20 }, // HearAbout
      { wch: 50 }, // ResumeURL
      { wch: 22 }, // AppliedAt
    ];
    ws['!cols'] = colWidths;

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Internship Applications');

    // Download file with nice name
    const fileName = `CodeNova_New_Internships_${new Date().toISOString().slice(0,10)}.xlsx`;
    XLSX.writeFile(wb, fileName);

    // Mark as downloaded on backend
    const applicationIds = newApps.map(app => app._id);
    await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/api/admin/mark-downloaded`,
      { applicationIds },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    toast.success(`✅ ${newApps.length} new applications exported successfully!`);
    
    // Refresh to update sections
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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;

  const newApplications = filteredApplications.filter(app => !app.downloadedAt);
  const downloadedApplications = filteredApplications.filter(app => app.downloadedAt);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 pt-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Admin Dashboard - Internship Applications</h1>
          <button onClick={handleLogout} className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center gap-2">
            <LogOut size={20} /> Logout
          </button>
        </div>

        <div className="space-y-12">
          {/* Filter & Export */}
          <div className="flex items-center gap-6">
            <Filter size={28} className="text-white" />
            <select value={selectedDomain} onChange={handleFilter} className="px-6 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-lg">
              <option value="">All Domains</option>
              {domains.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <button 
              onClick={handleExport} 
              disabled={exporting || newApplications.length === 0} 
              className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white rounded-full flex items-center gap-3 disabled:opacity-50"
            >
              {exporting ? <Loader2 className="animate-spin" size={24} /> : <Download size={24} />}
              {exporting ? 'Exporting...' : 'Export New to Excel'}
            </button>
          </div>

          {/* New Applications */}
          <div className="bg-white/10 rounded-3xl p-10 border border-white/20">
            <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
              <Clock size={28} /> New Applications ({newApplications.length})
            </h2>
            {newApplications.length === 0 ? (
              <p className="text-center text-slate-400 py-12 text-xl">No new applications available</p>
            ) : (
              <table className="w-full text-left text-white">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Domain</th>
                    <th>Duration</th>
                    <th>Applied At</th>
                  </tr>
                </thead>
                <tbody>
                  {newApplications.map((app, i) => (
                    <tr key={i} className="border-b border-white/20">
                      <td>{app.studentId}</td>
                      <td>{app.name}</td>
                      <td>{app.email}</td>
                      <td>{app.domain}</td>
                      <td>{app.duration}</td>
                      <td>{new Date(app.appliedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Already Downloaded */}
          <div className="bg-white/10 rounded-3xl p-10 border border-white/20">
            <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
              <CheckCircle size={28} /> Already Downloaded ({downloadedApplications.length})
            </h2>
            {downloadedApplications.length === 0 ? (
              <p className="text-center text-slate-400 py-12 text-xl">No downloaded applications</p>
            ) : (
              <table className="w-full text-left text-white">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Domain</th>
                    <th>Duration</th>
                    <th>Applied At</th>
                    <th>Downloaded At</th>
                  </tr>
                </thead>
                <tbody>
                  {downloadedApplications.map((app, i) => (
                    <tr key={i} className="border-b border-white/20">
                      <td>{app.studentId}</td>
                      <td>{app.name}</td>
                      <td>{app.email}</td>
                      <td>{app.domain}</td>
                      <td>{app.duration}</td>
                      <td>{new Date(app.appliedAt).toLocaleString()}</td>
                      <td>{new Date(app.downloadedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <ToastContainer theme="dark" position="top-center" />
    </div>
  );
};

export default AdminDashboard;