// import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import { toast, ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import * as XLSX from 'xlsx';
// import { 
//   LogOut, Loader2, Filter, Download, CheckCircle, Clock, User, Mail, 
//   Briefcase, Calendar, Phone, GraduationCap, MapPin, FileText, 
//   UploadCloud, Save, FileInput 
// } from 'lucide-react';

// const AdminDashboard = () => {
//   const [applications, setApplications] = useState([]);
//   const [filteredApplications, setFilteredApplications] = useState([]);
//   const [domains, setDomains] = useState([]);
//   const [selectedDomain, setSelectedDomain] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [exporting, setExporting] = useState(false);
//   const [updating, setUpdating] = useState({});
//   const [forms, setForms] = useState({});
//   const [uploadingExcel, setUploadingExcel] = useState(false);
//   const navigate = useNavigate();

//   const getUpcomingDates = () => {
//     const dates = [];
//     const today = new Date();
//     today.setHours(0,0,0,0);
//     // Gen options for rolling 3 months
//     for (let i = 0; i < 3; i++) {
//       const year = today.getFullYear();
//       const month = today.getMonth() + i;
//       [5, 15, 25].forEach(day => {
//         const d = new Date(year, month, day);
//         if (d >= today) {
//            dates.push({
//               value: d.toISOString(),
//               label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
//            });
//         }
//       });
//     }
//     return dates.sort((a,b) => new Date(a.value) - new Date(b.value)).slice(0, 6); // Up to next 6 dates
//   };
//   const upcomingDateOptions = getUpcomingDates();

//   useEffect(() => {
//     const token = localStorage.getItem('adminToken');
//     if (!token) {
//       toast.error('Admin login required');
//       navigate('/admin-login');
//       return;
//     }

//     fetchApplications(token);

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

//   const handleExport = async () => {
//     setExporting(true);
//     const token = localStorage.getItem('adminToken');

//     try {
//       const newApps = filteredApplications.filter(app => !app.downloadedAt);
      
//       if (newApps.length === 0) {
//         toast.info('No new applications to export');
//         setExporting(false);
//         return;
//       }

//       const data = newApps.map(app => ({
//         StudentID: app.studentId || 'N/A',
//         Name: app.name,
//         Email: app.email,
//         Domain: app.domain,
//         Duration: app.duration,
//         Mobile: app.mobile,
//         WhatsApp: app.whatsapp || app.mobile,
//         Course: app.course,
//         Branch: app.branch,
//         Year: app.year,
//         College: app.college,
//         State: app.state,
//         PassingYear: app.passingYear,
//         Portfolio: app.portfolio || 'N/A',
//         GitHub: app.github || 'N/A',
//         LinkedIn: app.linkedin || 'N/A',
//         Batch: app.batch || 'N/A',
//         WhyHire: app.whyHire,
//         HearAbout: app.hearAbout,
//         ResumeURL: app.resumeUrl,
//         AppliedAt: new Date(app.appliedAt).toLocaleString('en-IN'),
//       }));

//       const ws = XLSX.utils.json_to_sheet(data, {
//         header: [
//           'StudentID', 'Name', 'Email', 'Domain', 'Duration','Batch',
//           'Mobile', 'WhatsApp', 'Course', 'Branch', 'Year',
//           'College', 'State', 'PassingYear', 'Portfolio', 'GitHub',
//           'LinkedIn', 'WhyHire', 'HearAbout', 'ResumeURL', 'AppliedAt'
//         ]
//       });

//       const colWidths = [
//         { wch: 15 }, { wch: 20 }, { wch: 30 }, { wch: 18 },{ wch: 18 }, { wch: 12 },
//         { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 },
//         { wch: 30 }, { wch: 15 }, { wch: 12 }, { wch: 35 }, { wch: 35 },
//         { wch: 35 }, { wch: 60 }, { wch: 20 }, { wch: 50 }, { wch: 22 },
//       ];
//       ws['!cols'] = colWidths;

//       const wb = XLSX.utils.book_new();
//       XLSX.utils.book_append_sheet(wb, ws, 'Internship Applications');

//       const fileName = `CodeNova_New_Internships_${new Date().toISOString().slice(0,10)}.xlsx`;
//       XLSX.writeFile(wb, fileName);

//       const applicationIds = newApps.map(app => app._id);
//       await axios.post(
//         `${import.meta.env.VITE_BACKEND_URL}/api/admin/mark-downloaded`,
//         { applicationIds },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );

//       toast.success(`${newApps.length} new applications exported successfully!`);
      
//       fetchApplications(token);
//     } catch (err) {
//       console.error('Export error:', err);
//       toast.error('Export failed. Please try again.');
//     } finally {
//       setExporting(false);
//     }
//   };

//   const handleExportPaid = () => {
//     try {
//       const paidApps = applications.filter(app => app.hasPaid);
//       if (paidApps.length === 0) {
//         toast.info('No paid applications found.');
//         return;
//       }
//       const data = paidApps.map(app => ({
//         StudentID: app.studentId || 'N/A',
//         Name: app.name,
//         Email: app.email,
//         Domain: app.domain,
//         Duration: app.duration,
//         Mobile: app.mobile,
//         AppliedAt: new Date(app.appliedAt).toLocaleString('en-IN'),
//         StartDate: app.startDate ? new Date(app.startDate).toLocaleDateString('en-IN') : 'N/A',
//         EndDate: app.endDate ? new Date(app.endDate).toLocaleDateString('en-IN') : 'N/A',
//         TotalSubmissions: app.submissions ? app.submissions.length : 0
//       }));

//       const ws = XLSX.utils.json_to_sheet(data);
//       const wb = XLSX.utils.book_new();
//       XLSX.utils.book_append_sheet(wb, ws, 'Paid Interns');
//       XLSX.writeFile(wb, `CodeNova_Paid_Interns_${new Date().toISOString().slice(0,10)}.xlsx`);
//       toast.success(`${paidApps.length} paid applications exported successfully!`);
//     } catch (err) {
//       console.error(err);
//       toast.error('Failed to export paid applications');
//     }
//   };

//   const handleLogout = () => {
//     localStorage.removeItem('adminToken');
//     toast.success('Admin logged out');
//     navigate('/admin-login');
//   };

//   const handleOfferLetterChange = async (appId, newStatus) => {
//     try {
//       const token = localStorage.getItem('adminToken');
//       await axios.post(
//         `${import.meta.env.VITE_BACKEND_URL}/api/admin/update-offer-status`,
//         { applicationId: appId, status: newStatus },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       toast.success(`Offer Letter marked as ${newStatus}`);
//       fetchApplications(token);
//     } catch (err) {
//       toast.error('Failed to update Offer Letter status');
//     }
//   };

//   const handleStartDateAssignment = async (appId, dateValue) => {
//     if (!dateValue) return;
//     try {
//       const token = localStorage.getItem('adminToken');
//       await axios.post(
//         `${import.meta.env.VITE_BACKEND_URL}/api/admin/set-start-date`,
//         { applicationId: appId, startDate: dateValue },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       toast.success('Timeline successfully activated!');
//       fetchApplications(token);
//     } catch (err) {
//       toast.error('Failed to set start date');
//     }
//   };

//   const handleFormChange = (appId, field, value) => {
//     setForms(prev => ({
//       ...prev,
//       [appId]: {
//         ...prev[appId],
//         [field]: value
//       }
//     }));
//   };

//   const handleCertificateUpload = async (appId, file) => {
//     if (!file || file.type !== 'application/pdf') {
//       toast.error('Only PDF files allowed');
//       return;
//     }
//     if (file.size > 1024 * 1024) { // 1MB limit
//       toast.error('File too large, max 1MB');
//       return;
//     }

//     setUpdating(prev => ({ ...prev, [appId]: true }));

//     const uploadData = new FormData();
//     uploadData.append('file', file);
//     uploadData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
//     uploadData.append('folder', 'internship-certificates');
//     uploadData.append('resource_type', 'raw');

//     try {
//       const res = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/upload`, {
//         method: 'POST',
//         body: uploadData
//       });
//       const data = await res.json();
//       if (data.secure_url) {
//         handleFormChange(appId, 'certificateUrl', data.secure_url);
//         toast.success('Certificate uploaded!');
//       }
//     } catch (err) {
//       toast.error('Upload failed');
//     } finally {
//       setUpdating(prev => ({ ...prev, [appId]: false }));
//     }
//   };

//   const handleUpdateInternship = async (appId) => {
//     const token = localStorage.getItem('adminToken');
//     const form = forms[appId] || {};
//     if (!form.startDate || !form.endDate || !form.certificateUrl) {
//       toast.error('All fields required');
//       return;
//     }

//     setUpdating(prev => ({ ...prev, [appId]: true }));

//     try {
//       await axios.post(
//         `${import.meta.env.VITE_BACKEND_URL}/api/admin/update-internship`,
//         {
//           applicationId: appId,
//           startDate: form.startDate,
//           endDate: form.endDate,
//           certificateUrl: form.certificateUrl
//         },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       toast.success('Updated successfully!');
//       fetchApplications(token);
//     } catch (err) {
//       toast.error('Update failed');
//     } finally {
//       setUpdating(prev => ({ ...prev, [appId]: false }));
//     }
//   };

//   const handleExcelUpload = async (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     if (file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
//       toast.error('Only Excel files (.xlsx) are allowed');
//       return;
//     }

//     setUploadingExcel(true);
//     const token = localStorage.getItem('adminToken');

//     const formData = new FormData();
//     formData.append('excelFile', file);

//     try {
//       const res = await axios.post(
//         `${import.meta.env.VITE_BACKEND_URL}/api/admin/upload-certificates`,
//         formData,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             'Content-Type': 'multipart/form-data'
//           }
//         }
//       );
//       toast.success(res.data.message);
//     } catch (err) {
//       toast.error('Upload failed. Please try again.');
//     } finally {
//       setUploadingExcel(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
//         <div className="text-center">
//           <Loader2 className="w-16 h-16 animate-spin text-blue-500 mx-auto mb-4" />
//           <p className="text-white text-xl font-medium">Loading applications...</p>
//         </div>
//       </div>
//     );
//   }

//   const newApplications = filteredApplications.filter(app => !app.downloadedAt);
//   const downloadedApplications = filteredApplications.filter(app => app.downloadedAt);

//   const ApplicationCard = ({ app, isDownloaded }) => (
//     <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
//       <div className="flex items-start justify-between mb-4">
//         <div className="flex items-center gap-3">
//           <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center">
//             <User className="w-6 h-6 text-white" />
//           </div>
//           <div>
//             <h3 className="text-lg font-semibold text-white">{app.name}</h3>
//             <p className="text-sm text-slate-400">{app.studentId || 'N/A'}</p>
//           </div>
//         </div>
//         <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
//           isDownloaded 
//             ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
//             : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
//         }`}>
//           {isDownloaded ? 'Downloaded' : 'New'}
//         </span>
//       </div>

//       <div className="space-y-3">
//         <div className="flex items-center gap-2 text-slate-300">
//           <Mail className="w-4 h-4 text-slate-500" />
//           <span className="text-sm break-all">{app.email}</span>
//         </div>
//         <div className="flex items-center gap-2 text-slate-300">
//           <Briefcase className="w-4 h-4 text-slate-500" />
//           <span className="text-sm">{app.domain} - {app.duration}</span>
//         </div>
//         <div className="flex items-center gap-2 text-slate-300">
//           <Phone className="w-4 h-4 text-slate-500" />
//           <span className="text-sm">{app.mobile}</span>
//         </div>
//         <div className="flex items-center gap-2 text-slate-300">
//           <GraduationCap className="w-4 h-4 text-slate-500" />
//           <span className="text-sm">{app.course} - {app.branch} ({app.year})</span>
//         </div>
//         <div className="flex items-center gap-2 text-slate-300">
//           <MapPin className="w-4 h-4 text-slate-500" />
//           <span className="text-sm">{app.college}, {app.state}</span>
//         </div>
//         <div className="flex items-center gap-2 text-slate-300">
//           <Calendar className="w-4 h-4 text-slate-500" />
//           <span className="text-sm">Applied: {new Date(app.appliedAt).toLocaleString('en-IN')}</span>
//         </div>
//         {isDownloaded && app.downloadedAt && (
//           <div className="flex items-center gap-2 text-slate-300">
//             <CheckCircle className="w-4 h-4 text-green-500" />
//             <span className="text-sm">Downloaded: {new Date(app.downloadedAt).toLocaleString('en-IN')}</span>
//           </div>
//         )}
//       </div>

//       {isDownloaded && !app.certificateUrl && (
//         <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
//           <h4 className="text-white font-medium mb-4">Add Internship Details</h4>
//           <div className="space-y-4">
//             <input
//               type="date"
//               value={forms[app._id]?.startDate || ''}
//               onChange={(e) => handleFormChange(app._id, 'startDate', e.target.value)}
//               className="w-full p-2 bg-slate-800 border border-slate-600 rounded"
//             />
//             <input
//               type="date"
//               value={forms[app._id]?.endDate || ''}
//               onChange={(e) => handleFormChange(app._id, 'endDate', e.target.value)}
//               className="w-full p-2 bg-slate-800 border border-slate-600 rounded"
//             />
//             <label className="flex items-center gap-2 p-2 bg-slate-800 border border-dashed border-slate-600 rounded cursor-pointer">
//               <UploadCloud className="w-5 h-5" />
//               <span>Upload Certificate PDF</span>
//               <input
//                 type="file"
//                 accept="application/pdf"
//                 onChange={(e) => handleCertificateUpload(app._id, e.target.files[0])}
//                 className="hidden"
//               />
//             </label>
//             <button
//               onClick={() => handleUpdateInternship(app._id)}
//               disabled={updating[app._id]}
//               className="w-full p-2 bg-green-600 text-white rounded flex items-center justify-center gap-2"
//             >
//               {updating[app._id] ? <Loader2 className="animate-spin" /> : <Save />}
//               Save
//             </button>
//           </div>
//         </div>
//       )}

//       {app.certificateUrl && (
//         <div className="mt-4 p-4 bg-green-800/20 rounded-lg">
//           <p>Start: {app.startDate ? new Date(app.startDate).toLocaleDateString() : 'N/A'}</p>
//           <p>End: {app.endDate ? new Date(app.endDate).toLocaleDateString() : 'N/A'}</p>
//           <p>Months: {app.totalMonths || 'N/A'}</p>
//           <a href={app.certificateUrl} target="_blank" className="text-blue-400">View Certificate</a>
//         </div>
//       )}
//     </div>
//   );

//   return (
//     <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
//         <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-0 mb-8 pt-20">
//           <div>
//             <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2">
//               Admin Dashboard
//             </h1>
//             <p className="text-slate-400 text-sm sm:text-base">Manage internship applications</p>
//           </div>
//           <button 
//             onClick={handleLogout} 
//             className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 hover:scale-105 font-medium"
//           >
//             <LogOut size={20} /> 
//             <span>Logout</span>
//           </button>
//         </div>

//         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
//           <div className="bg-linear-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-slate-400 text-sm font-medium mb-1">Total Applications</p>
//                 <p className="text-3xl font-bold text-white">{filteredApplications.length}</p>
//               </div>
//               <FileText className="w-12 h-12 text-blue-400 opacity-80" />
//             </div>
//           </div>

//           <div className="bg-linear-to-br from-amber-500/20 to-amber-600/20 backdrop-blur-sm rounded-xl p-6 border border-amber-500/30">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-slate-400 text-sm font-medium mb-1">New Applications</p>
//                 <p className="text-3xl font-bold text-white">{newApplications.length}</p>
//               </div>
//               <Clock className="w-12 h-12 text-amber-400 opacity-80" />
//             </div>
//           </div>

//           <div className="bg-linear-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm rounded-xl p-6 border border-green-500/30">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-slate-400 text-sm font-medium mb-1">Downloaded</p>
//                 <p className="text-3xl font-bold text-white">{downloadedApplications.length}</p>
//               </div>
//               <CheckCircle className="w-12 h-12 text-green-400 opacity-80" />
//             </div>
//           </div>
//         </div>

//         <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 mb-8">
//           <div className="flex flex-col sm:flex-row gap-4">
//             <div className="flex-1">
//               <label className="block text-sm font-medium text-slate-400 mb-2">Filter by Domain</label>
//               <div className="relative">
//                 <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
//                 <select 
//                   value={selectedDomain} 
//                   onChange={handleFilter} 
//                   className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
//                 >
//                   <option value="">All Domains</option>
//                   {domains.map(d => <option key={d} value={d}>{d}</option>)}
//                 </select>
//               </div>
//             </div>

//             <div className="flex items-end gap-3 flex-wrap sm:flex-nowrap">
//               <button 
//                 onClick={handleExport} 
//                 disabled={exporting || newApplications.length === 0} 
//                 className="w-full sm:w-auto px-6 py-3 bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-500/30 font-medium whitespace-nowrap"
//               >
//                 {exporting ? (
//                   <>
//                     <Loader2 className="animate-spin" size={20} />
//                     <span>Exporting...</span>
//                   </>
//                 ) : (
//                   <>
//                     <Download size={20} />
//                     <span>Export New To Excel</span>
//                   </>
//                 )}
//               </button>

//               <button 
//                 onClick={handleExportPaid} 
//                 className="w-full sm:w-auto px-6 py-3 bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg flex items-center justify-center gap-2 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/30 font-medium whitespace-nowrap"
//               >
//                  <Download size={20} />
//                  <span>Export Paid Logs</span>
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* New: Excel Upload Section */}
//         <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 mb-8">
//           <h3 className="text-xl font-semibold text-white mb-4">Upload Certificates Excel</h3>
//           <div className="flex items-center gap-4">
//             <label className="flex-1 flex items-center gap-2 p-3 bg-slate-900/50 border border-slate-700 rounded-lg cursor-pointer hover:border-blue-500 transition-all">
//               <FileInput className="w-5 h-5 text-blue-400" />
//               <span className="text-slate-300">Choose Excel File (.xlsx)</span>
//               <input
//                 type="file"
//                 accept=".xlsx"
//                 onChange={handleExcelUpload}
//                 className="hidden"
//                 disabled={uploadingExcel}
//               />
//             </label>
//             {uploadingExcel && (
//               <Loader2 className="animate-spin text-blue-500" size={24} />
//             )}
//           </div>
//           <p className="text-sm text-slate-500 mt-2">Expected columns: Certificate_Number, Student_Name, Domain, Start_Date, End_Date, Duration, Student_ID</p>
//         </div>

//         <div className="space-y-8">
//           <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl p-6 lg:p-8 border border-slate-700/50">
//             <div className="flex items-center gap-3 mb-6">
//               <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
//                 <Clock size={24} className="text-amber-400" />
//               </div>
//               <div>
//                 <h2 className="text-2xl lg:text-3xl font-bold text-white">New Applications</h2>
//                 <p className="text-slate-400 text-sm">{newApplications.length} pending review</p>
//               </div>
//             </div>

//             {newApplications.length === 0 ? (
//               <div className="text-center py-16">
//                 <Clock className="w-16 h-16 text-slate-600 mx-auto mb-4" />
//                 <p className="text-slate-400 text-lg">No new applications available</p>
//                 <p className="text-slate-500 text-sm mt-2">All applications have been downloaded</p>
//               </div>
//             ) : (
//               <>
//                 <div className="hidden lg:block overflow-x-auto">
//                   <table className="w-full">
//                     <thead>
//                       <tr className="border-b border-slate-700">
//                         <th className="text-left py-4 px-4 text-sm font-semibold text-slate-400">Student ID</th>
//                         <th className="text-left py-4 px-4 text-sm font-semibold text-slate-400">Name</th>
//                         <th className="text-left py-4 px-4 text-sm font-semibold text-slate-400">Email</th>
//                         <th className="text-left py-4 px-4 text-sm font-semibold text-slate-400">Domain</th>
//                         <th className="text-left py-4 px-4 text-sm font-semibold text-slate-400">Duration</th>
//                         <th className="text-left py-4 px-4 text-sm font-semibold text-slate-400">Timeline / Start</th>
//                         <th className="text-left py-4 px-4 text-sm font-semibold text-slate-400">Applied At</th>
//                         <th className="text-left py-4 px-4 text-sm font-semibold text-slate-400">Offer Letter</th>
//                         <th className="text-left py-4 px-4 text-sm font-semibold text-slate-400">Payment</th>
//                         <th className="text-left py-4 px-4 text-sm font-semibold text-slate-400">Tasks Done</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {newApplications.map((app, i) => (
//                         <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
//                           <td className="py-4 px-4 text-slate-300">{app.studentId || 'N/A'}</td>
//                           <td className="py-4 px-4 text-white font-medium">{app.name}</td>
//                           <td className="py-4 px-4 text-slate-300">{app.email}</td>
//                           <td className="py-4 px-4">
//                             <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
//                               {app.domain}
//                             </span>
//                           </td>
//                           <td className="py-4 px-4 text-slate-300">{app.duration}</td>
//                           <td className="py-4 px-4">
//                             {app.startDate ? (
//                               <div className="text-xs">
//                                 <span className="text-green-400 block pb-1">Start: {new Date(app.startDate).toLocaleDateString('en-IN')}</span>
//                                 <span className="text-amber-400 block">End: {new Date(app.endDate).toLocaleDateString('en-IN')}</span>
//                               </div>
//                             ) : (
//                               <select
//                                 onChange={(e) => handleStartDateAssignment(app._id, e.target.value)}
//                                 className="bg-slate-800 border border-slate-600 rounded p-1 text-xs text-white cursor-pointer w-full"
//                                 defaultValue=""
//                               >
//                                 <option value="" disabled>Select Date...</option>
//                                 {upcomingDateOptions.map((opt, idx) => (
//                                   <option key={idx} value={opt.value}>{opt.label}</option>
//                                 ))}
//                               </select>
//                             )}
//                           </td>
//                           <td className="py-4 px-4 text-slate-300">{new Date(app.appliedAt).toLocaleString('en-IN')}</td>
//                           <td className="py-4 px-4">
//                             <select
//                               value={app.offerLetterStatus || 'Not Sent'}
//                               onChange={(e) => handleOfferLetterChange(app._id, e.target.value)}
//                               className="bg-slate-800 border border-slate-600 rounded p-1 text-xs text-white"
//                             >
//                               <option value="Not Sent">Not Sent</option>
//                               <option value="Sent">Sent</option>
//                             </select>
//                           </td>
//                           <td className="py-4 px-4">
//                             {app.hasPaid ? <span className="text-green-400 text-xs font-bold">Paid</span> : <span className="text-amber-400 text-xs font-bold">Pending</span>}
//                           </td>
//                           <td className="py-4 px-4">
//                              <div className="flex items-center gap-1">
//                                 <span className="text-white font-medium text-xs">{app.submissions ? app.submissions.length : 0}</span>
//                                 <span className="text-slate-500 text-xs">/</span>
//                                 <span className="text-slate-400 text-xs">{app.duration ? parseInt(app.duration) : 1}</span>
//                              </div>
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
//                   {newApplications.map((app, i) => (
//                     <ApplicationCard key={i} app={app} isDownloaded={false} />
//                   ))}
//                 </div>
//               </>
//             )}
//           </div>

//           <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl p-6 lg:p-8 border border-slate-700/50">
//             <div className="flex items-center gap-3 mb-6">
//               <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
//                 <CheckCircle size={24} className="text-green-400" />
//               </div>
//               <div>
//                 <h2 className="text-2xl lg:text-3xl font-bold text-white">Already Downloaded</h2>
//                 <p className="text-slate-400 text-sm">{downloadedApplications.length} applications processed</p>
//               </div>
//             </div>

//             {downloadedApplications.length === 0 ? (
//               <div className="text-center py-16">
//                 <CheckCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
//                 <p className="text-slate-400 text-lg">No downloaded applications</p>
//                 <p className="text-slate-500 text-sm mt-2">Export new applications to see them here</p>
//               </div>
//             ) : (
//               <>
//                 <div className="hidden lg:block overflow-x-auto">
//                   <table className="w-full">
//                     <thead>
//                       <tr className="border-b border-slate-700">
//                         <th className="text-left py-4 px-4 text-sm font-semibold text-slate-400">Student ID</th>
//                         <th className="text-left py-4 px-4 text-sm font-semibold text-slate-400">Name</th>
//                         <th className="text-left py-4 px-4 text-sm font-semibold text-slate-400">Email</th>
//                         <th className="text-left py-4 px-4 text-sm font-semibold text-slate-400">Domain</th>
//                         <th className="text-left py-4 px-4 text-sm font-semibold text-slate-400">Duration</th>
//                         <th className="text-left py-4 px-4 text-sm font-semibold text-slate-400">Applied At</th>
//                         <th className="text-left py-4 px-4 text-sm font-semibold text-slate-400">Batch</th>
//                         <th className="text-left py-4 px-4 text-sm font-semibold text-slate-400">Downloaded At</th>
//                         <th className="text-left py-4 px-4 text-sm font-semibold text-slate-400">Start Date</th>
//                         <th className="text-left py-4 px-4 text-sm font-semibold text-slate-400">End Date</th>
//                         <th className="text-left py-4 px-4 text-sm font-semibold text-slate-400">Months</th>
//                         <th className="text-left py-4 px-4 text-sm font-semibold text-slate-400">Certificate</th>
//                         <th className="text-left py-4 px-4 text-sm font-semibold text-slate-400">Offer Letter</th>
//                         <th className="text-left py-4 px-4 text-sm font-semibold text-slate-400">Payment</th>
//                         <th className="text-left py-4 px-4 text-sm font-semibold text-slate-400">Tasks Done</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {downloadedApplications.map((app, i) => (
//                         <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
//                           <td className="py-4 px-4 text-slate-300">{app.studentId || 'N/A'}</td>
//                           <td className="py-4 px-4 text-white font-medium">{app.name}</td>
//                           <td className="py-4 px-4 text-slate-300">{app.email}</td>
//                           <td className="py-4 px-4">
//                             <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
//                               {app.domain}
//                             </span>
//                           </td>
//                           <td className="py-4 px-4 text-slate-300">{app.duration}</td>
//                           <td className="py-4 px-4 text-slate-300">{new Date(app.appliedAt).toLocaleString('en-IN')}</td>
//                           <td className="py-4 px-4 text-slate-300">{app.batch || 'N/A'}</td>
//                           <td className="py-4 px-4 text-green-400">{new Date(app.downloadedAt).toLocaleString('en-IN')}</td>
//                           <td className="py-4 px-4 text-slate-300">
//                             {app.startDate ? new Date(app.startDate).toLocaleDateString('en-IN') : (
//                               <select
//                                 onChange={(e) => handleStartDateAssignment(app._id, e.target.value)}
//                                 className="bg-slate-800 border border-slate-600 rounded p-1 text-xs text-white cursor-pointer w-full"
//                                 defaultValue=""
//                               >
//                                 <option value="" disabled>Select Date...</option>
//                                 {upcomingDateOptions.map((opt, idx) => (
//                                   <option key={idx} value={opt.value}>{opt.label}</option>
//                                 ))}
//                               </select>
//                             )}
//                           </td>
//                           <td className="py-4 px-4 text-slate-300">{app.endDate ? new Date(app.endDate).toLocaleDateString('en-IN') : 'N/A'}</td>
//                           <td className="py-4 px-4 text-slate-300">{app.totalMonths || 'N/A'}</td>
//                           <td className="py-4 px-4">
//                             {app.certificateUrl ? (
//                               <a href={app.certificateUrl} target="_blank" className="text-blue-400">View</a>
//                             ) : 'N/A'}
//                           </td>
//                           <td className="py-4 px-4">
//                             <select
//                               value={app.offerLetterStatus || 'Not Sent'}
//                               onChange={(e) => handleOfferLetterChange(app._id, e.target.value)}
//                               className="bg-slate-800 border border-slate-600 rounded p-1 text-xs text-white"
//                             >
//                               <option value="Not Sent">Not Sent</option>
//                               <option value="Sent">Sent</option>
//                             </select>
//                           </td>
//                           <td className="py-4 px-4">
//                             {app.hasPaid ? <span className="text-green-400 text-xs font-bold">Paid</span> : <span className="text-amber-400 text-xs font-bold">Pending</span>}
//                           </td>
//                           <td className="py-4 px-4">
//                              <div className="flex items-center gap-1">
//                                 <span className="text-white font-medium text-xs">{app.submissions ? app.submissions.length : 0}</span>
//                                 <span className="text-slate-500 text-xs">/</span>
//                                 <span className="text-slate-400 text-xs">{app.duration ? parseInt(app.duration) : 1}</span>
//                              </div>
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
//                   {downloadedApplications.map((app, i) => (
//                     <ApplicationCard key={i} app={app} isDownloaded={true} />
//                   ))}
//                 </div>
//               </>
//             )}
//           </div>
//         </div>
//       </div>

//       <ToastContainer theme="dark" position="top-center" autoClose={3000} />
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
import {
  LogOut, Loader2, Filter, Download, CheckCircle, Clock, User, Mail,
  Briefcase, Calendar, Phone, GraduationCap, MapPin, FileText,
  UploadCloud, Save, FileInput, Search, ChevronDown, ExternalLink,
  TrendingUp, Users, AlertCircle, X
} from 'lucide-react';

const AdminDashboard = () => {
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [domains, setDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('new');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [updating, setUpdating] = useState({});
  const [forms, setForms] = useState({});
  const [uploadingExcel, setUploadingExcel] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);
  const [exportDuration, setExportDuration] = useState('1');
  const navigate = useNavigate();

  const getUpcomingDates = () => {
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 3; i++) {
      const year = today.getFullYear();
      const month = today.getMonth() + i;
      [5, 15, 25].forEach(day => {
        const d = new Date(year, month, day);
        if (d >= today) {
          dates.push({
            value: d.toISOString(),
            label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
          });
        }
      });
    }
    return dates.sort((a, b) => new Date(a.value) - new Date(b.value)).slice(0, 6);
  };
  const upcomingDateOptions = getUpcomingDates();

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

  useEffect(() => {
    let result = applications;
    if (selectedDomain) result = result.filter(app => app.domain === selectedDomain);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(app =>
        app.name?.toLowerCase().includes(q) ||
        app.email?.toLowerCase().includes(q) ||
        app.studentId?.toLowerCase().includes(q) ||
        app.domain?.toLowerCase().includes(q)
      );
    }
    setFilteredApplications(result);
  }, [selectedDomain, searchQuery, applications]);

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
        Batch: app.batch || 'N/A',
        WhyHire: app.whyHire,
        HearAbout: app.hearAbout,
        ResumeURL: app.resumeUrl,
        AppliedAt: new Date(app.appliedAt).toLocaleString('en-IN'),
      }));
      const ws = XLSX.utils.json_to_sheet(data, {
        header: ['StudentID', 'Name', 'Email', 'Domain', 'Duration', 'Batch', 'Mobile', 'WhatsApp', 'Course', 'Branch', 'Year', 'College', 'State', 'PassingYear', 'Portfolio', 'GitHub', 'LinkedIn', 'WhyHire', 'HearAbout', 'ResumeURL', 'AppliedAt']
      });
      const colWidths = [{ wch: 15 }, { wch: 20 }, { wch: 30 }, { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 30 }, { wch: 15 }, { wch: 12 }, { wch: 35 }, { wch: 35 }, { wch: 35 }, { wch: 60 }, { wch: 20 }, { wch: 50 }, { wch: 22 }];
      ws['!cols'] = colWidths;
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Internship Applications');
      const fileName = `CodeNova_New_Internships_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fileName);
      const applicationIds = newApps.map(app => app._id);
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/admin/mark-downloaded`, { applicationIds }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`${newApps.length} new applications exported!`);
      fetchApplications(token);
    } catch (err) {
      toast.error('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPaid = async () => {
    try {
      const paidApps = applications.filter(app => app.hasPaid && !app.paidExported);
      if (paidApps.length === 0) {
        toast.info('No newly paid applications found to export.');
        return;
      }
      const data = paidApps.map(app => ({
        StudentID: app.studentId || 'N/A', Name: app.name, Email: app.email,
        Domain: app.domain, Duration: app.duration, Mobile: app.mobile,
        AppliedAt: new Date(app.appliedAt).toLocaleString('en-IN'),
        StartDate: app.startDate ? new Date(app.startDate).toLocaleDateString('en-IN') : 'N/A',
        EndDate: app.endDate ? new Date(app.endDate).toLocaleDateString('en-IN') : 'N/A',
        TotalSubmissions: app.submissions ? app.submissions.length : 0
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Paid Interns');
      XLSX.writeFile(wb, `CodeNova_Paid_Interns_${new Date().toISOString().slice(0, 10)}.xlsx`);

      const token = localStorage.getItem('adminToken');
      const applicationIds = paidApps.map(app => app._id);
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/admin/mark-paid-exported`, { applicationIds }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(`${paidApps.length} newly paid applications exported and marked!`);
      fetchApplications(token);
    } catch (err) {
      toast.error('Failed to export paid applications');
      console.error(err);
    }
  };

  const handleExportProjectSubmitted = async (durationVal) => {
    try {
      if (!durationVal) {
        toast.info('Please select an internship duration to export.');
        return;
      }

      const targetDurationStr = `${durationVal} Month${parseInt(durationVal) > 1 ? 's' : ''}`;
      
      const completedApps = applications.filter(app => {
        const regDuration = parseInt(app.duration?.split(' ')[0], 10) || 1;
        const subCount = app.submissions ? app.submissions.length : 0;
        const isTargetDuration = regDuration === parseInt(durationVal, 10);
        return isTargetDuration && subCount >= regDuration && !app.projectExported;
      });

      if (completedApps.length === 0) {
        toast.info(`No newly completed project submissions found for ${targetDurationStr}.`);
        return;
      }

      const data = completedApps.map(app => ({
        'Student Name': app.name,
        'Email ID': app.email,
        'Student ID': app.studentId || 'N/A',
        'Project Submitted': app.submissions ? app.submissions.length : 0,
        'Mobile Number': app.mobile,
        'Internship Start Date': app.startDate ? new Date(app.startDate).toLocaleDateString('en-IN') : 'N/A',
        'End Date': app.endDate ? new Date(app.endDate).toLocaleDateString('en-IN') : 'N/A',
        'Project Submission Duration': app.duration || targetDurationStr
      }));

      const ws = XLSX.utils.json_to_sheet(data, {
        header: ['Student Name', 'Email ID', 'Student ID', 'Project Submitted', 'Mobile Number', 'Internship Start Date', 'End Date', 'Project Submission Duration']
      });
      const colWidths = [{ wch: 25 }, { wch: 30 }, { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 25 }];
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `Completed Interns ${durationVal}M`);
      XLSX.writeFile(wb, `CodeNova_Completed_${durationVal}Month_Interns_${new Date().toISOString().slice(0, 10)}.xlsx`);

      const token = localStorage.getItem('adminToken');
      const applicationIds = completedApps.map(app => app._id);
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/admin/mark-project-exported`, { applicationIds }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(`${completedApps.length} completed students (${targetDurationStr}) exported!`);
      fetchApplications(token);
    } catch (err) {
      toast.error('Failed to export completed student projects');
      console.error(err);
    }
  };

  const handleTogglePaidStatus = async (appId, currentStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/update-paid-status`,
        { applicationId: appId, hasPaid: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Paid status updated to ${!currentStatus ? 'Yes' : 'No'}`);
      fetchApplications(token);
    } catch (err) {
      toast.error('Failed to update paid status');
      console.error(err);
    }
  };

  const handleToggleBypassBlock = async (appId, currentStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/update-bypass-block`,
        { applicationId: appId, bypassBlock: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Bypass block status updated to ${!currentStatus ? 'Yes' : 'No'}`);
      fetchApplications(token);
    } catch (err) {
      toast.error('Failed to update bypass block status');
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    toast.success('Admin logged out');
    navigate('/admin-login');
  };

  const handleOfferLetterChange = async (appId, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/admin/update-offer-status`, { applicationId: appId, status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`Offer Letter marked as ${newStatus}`);
      fetchApplications(token);
    } catch (err) {
      toast.error('Failed to update Offer Letter status');
    }
  };

  const handleStartDateAssignment = async (appId, dateValue) => {
    if (!dateValue) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/admin/set-start-date`, { applicationId: appId, startDate: dateValue }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Timeline activated!');
      fetchApplications(token);
    } catch (err) {
      toast.error('Failed to set start date');
    }
  };

  const handleFormChange = (appId, field, value) => {
    setForms(prev => ({ ...prev, [appId]: { ...prev[appId], [field]: value } }));
  };

  const handleCertificateUpload = async (appId, file) => {
    if (!file || file.type !== 'application/pdf') { toast.error('Only PDF files allowed'); return; }
    if (file.size > 1024 * 1024) { toast.error('File too large, max 1MB'); return; }
    setUpdating(prev => ({ ...prev, [appId]: true }));
    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
    uploadData.append('folder', 'internship-certificates');
    uploadData.append('resource_type', 'raw');
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/upload`, { method: 'POST', body: uploadData });
      const data = await res.json();
      if (data.secure_url) { handleFormChange(appId, 'certificateUrl', data.secure_url); toast.success('Certificate uploaded!'); }
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUpdating(prev => ({ ...prev, [appId]: false }));
    }
  };

  const handleStartDateChange = (appId, durationStr, val) => {
    const months = parseInt(durationStr, 10) || 1;
    let endVal = '';
    if (val) {
      const date = new Date(val);
      if (!isNaN(date.getTime())) {
        date.setMonth(date.getMonth() + months);
        endVal = date.toISOString().split('T')[0];
      }
    }
    setForms(prev => ({
      ...prev,
      [appId]: {
        ...prev[appId],
        startDate: val,
        endDate: endVal
      }
    }));
  };

  const handleUpdateInternship = async (appId) => {
    const token = localStorage.getItem('adminToken');
    const form = forms[appId] || {};
    if (!form.startDate || !form.endDate) { toast.error('Start date is required'); return; }
    setUpdating(prev => ({ ...prev, [appId]: true }));
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/update-internship`,
        { 
          applicationId: appId, 
          startDate: form.startDate, 
          endDate: form.endDate, 
          certificateUrl: form.certificateUrl || '' 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Updated successfully!');
      fetchApplications(token);
    } catch (err) {
      toast.error('Update failed');
    } finally {
      setUpdating(prev => ({ ...prev, [appId]: false }));
    }
  };

  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') { toast.error('Only Excel files (.xlsx) are allowed'); return; }
    setUploadingExcel(true);
    const token = localStorage.getItem('adminToken');
    const formData = new FormData();
    formData.append('excelFile', file);
    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/admin/upload-certificates`, formData, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
      toast.success(res.data.message);
    } catch (err) {
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploadingExcel(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-slate-700 mx-auto" />
            <div className="w-20 h-20 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin absolute inset-0 mx-auto" />
          </div>
          <p className="text-white text-lg font-medium mt-6">Loading dashboard...</p>
          <p className="text-slate-500 text-sm mt-1">Fetching applications</p>
        </div>
      </div>
    );
  }

  const newApplications = filteredApplications.filter(app => !app.downloadedAt);
  const downloadedApplications = filteredApplications.filter(app => app.downloadedAt);
  const paidCount = applications.filter(app => app.hasPaid).length;
  const displayedApps = activeTab === 'new' ? newApplications : downloadedApplications;

  const StatCard = ({ label, value, icon: Icon, color, sub }) => (
    <div className={`relative overflow-hidden rounded-2xl p-6 border ${color.border} ${color.bg} backdrop-blur-sm`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm font-medium ${color.label} mb-1`}>{label}</p>
          <p className="text-4xl font-bold text-white tracking-tight">{value}</p>
          {sub && <p className={`text-xs mt-2 ${color.sub}`}>{sub}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl ${color.iconBg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-6 h-6 ${color.icon}`} />
        </div>
      </div>
      <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full ${color.glow} opacity-20`} />
    </div>
  );

  const Badge = ({ children, variant = 'blue' }) => {
    const styles = {
      blue: 'bg-blue-500/15 text-blue-400 border-blue-500/25 ring-1 ring-blue-500/20',
      green: 'bg-green-500/15 text-green-400 border-green-500/25 ring-1 ring-green-500/20',
      amber: 'bg-amber-500/15 text-amber-400 border-amber-500/25 ring-1 ring-amber-500/20',
      red: 'bg-red-500/15 text-red-400 border-red-500/25 ring-1 ring-red-500/20',
      slate: 'bg-slate-500/15 text-slate-400 border-slate-500/25 ring-1 ring-slate-500/20',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[variant]}`}>
        {children}
      </span>
    );
  };

  const SelectField = ({ value, onChange, options, className = '' }) => (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className={`appearance-none bg-slate-800/80 border border-slate-600/50 text-white rounded-lg px-3 py-1.5 text-xs pr-8 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer ${className}`}
      >
        {options.map((opt, i) => (
          <option key={i} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
    </div>
  );

  const MobileCard = ({ app, isDownloaded }) => {
    const isExpanded = expandedCard === app._id;
    const taskCount = app.submissions ? app.submissions.length : 0;
    const totalTasks = app.duration ? parseInt(app.duration) : 1;

    return (
      <div className="bg-slate-800/40 rounded-2xl border border-slate-700/40 overflow-hidden hover:border-slate-600/60 transition-all duration-200">
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-white font-semibold text-sm truncate">{app.name}</h3>
                <p className="text-slate-500 text-xs">{app.studentId || 'No ID'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant={isDownloaded ? 'green' : 'amber'}>{isDownloaded ? 'Processed' : 'New'}</Badge>
              <button
                onClick={() => setExpandedCard(isExpanded ? null : app._id)}
                className="w-7 h-7 rounded-lg bg-slate-700/50 flex items-center justify-center hover:bg-slate-600/50 transition-colors"
              >
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="blue">{app.domain}</Badge>
            <Badge variant="slate">{app.duration}</Badge>
            {app.hasPaid ? <Badge variant="green">Paid</Badge> : <Badge variant="amber">Pending</Badge>}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1.5 text-slate-400 min-w-0">
              <Mail className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="text-xs truncate">{app.email}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Phone className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="text-xs">{app.mobile}</span>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="border-t border-slate-700/40 p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-slate-500 mb-1">Course</p>
                <p className="text-slate-300">{app.course} - {app.branch}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Year</p>
                <p className="text-slate-300">{app.year}</p>
              </div>
              <div className="col-span-2">
                <p className="text-slate-500 mb-1">College</p>
                <p className="text-slate-300">{app.college}, {app.state}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Tasks Done</p>
                <p className="text-slate-300">{taskCount} / {totalTasks}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Applied At</p>
                <p className="text-slate-300">{new Date(app.appliedAt).toLocaleDateString('en-IN')}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-slate-500 text-xs mb-1.5">Offer Letter</p>
                <SelectField
                  value={app.offerLetterStatus || 'Not Sent'}
                  onChange={(e) => handleOfferLetterChange(app._id, e.target.value)}
                  options={[{ value: 'Not Sent', label: 'Not Sent' }, { value: 'Sent', label: 'Sent' }]}
                  className="w-full"
                />
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-1.5">Timeline</p>
                {app.startDate ? (
                  <div>
                    <p className="text-xs text-green-400">{new Date(app.startDate).toLocaleDateString('en-IN')}</p>
                    <p className="text-xs text-slate-400">{new Date(app.endDate).toLocaleDateString('en-IN')}</p>
                  </div>
                ) : (
                  <SelectField
                    value=""
                    onChange={(e) => handleStartDateAssignment(app._id, e.target.value)}
                    options={[{ value: '', label: 'Set date...' }, ...upcomingDateOptions]}
                    className="w-full"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-slate-500 text-xs mb-1.5">Paid Status</p>
                <SelectField
                  value={app.hasPaid ? 'Yes' : 'No'}
                  onChange={() => handleTogglePaidStatus(app._id, app.hasPaid)}
                  options={[{ value: 'No', label: 'No' }, { value: 'Yes', label: 'Yes' }]}
                  className="w-full"
                />
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-1.5">Dashboard Access</p>
                <SelectField
                  value={app.bypassBlock ? 'Give Access' : 'Strict'}
                  onChange={() => handleToggleBypassBlock(app._id, app.bypassBlock)}
                  options={[{ value: 'Strict', label: 'Strict' }, { value: 'Give Access', label: 'Give Access' }]}
                  className="w-full"
                />
              </div>
            </div>

            {isDownloaded && !app.certificateUrl && (
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/40">
                <p className="text-white text-xs font-medium mb-3">Add Internship Details</p>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-500 text-xs block mb-1">Start Date</label>
                      <input type="date" value={forms[app._id]?.startDate || ''} onChange={(e) => handleStartDateChange(app._id, app.duration, e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600/50 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="text-slate-500 text-xs block mb-1">End Date</label>
                      <input type="date" value={forms[app._id]?.endDate || ''} disabled readOnly
                        className="w-full bg-slate-900 border border-slate-700 text-slate-400 text-xs rounded-lg px-2 py-1.5 focus:outline-none cursor-not-allowed" />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 p-2.5 bg-slate-800/80 border border-dashed border-slate-600/50 rounded-lg cursor-pointer hover:border-blue-500/50 transition-colors">
                    <UploadCloud className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <span className="text-xs text-slate-300">{forms[app._id]?.certificateUrl ? 'Certificate uploaded' : 'Upload Certificate PDF'}</span>
                    <input type="file" accept="application/pdf" onChange={(e) => handleCertificateUpload(app._id, e.target.files[0])} className="hidden" />
                  </label>
                  <button onClick={() => handleUpdateInternship(app._id)} disabled={updating[app._id]}
                    className="w-full py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-colors">
                    {updating[app._id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save Details
                  </button>
                </div>
              </div>
            )}

            {app.certificateUrl && (
              <div className="bg-green-500/10 rounded-xl p-3 border border-green-500/20">
                <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                  <div><p className="text-slate-500">Start</p><p className="text-slate-300">{app.startDate ? new Date(app.startDate).toLocaleDateString('en-IN') : 'N/A'}</p></div>
                  <div><p className="text-slate-500">End</p><p className="text-slate-300">{app.endDate ? new Date(app.endDate).toLocaleDateString('en-IN') : 'N/A'}</p></div>
                  <div><p className="text-slate-500">Duration</p><p className="text-slate-300">{app.totalMonths || 'N/A'}</p></div>
                </div>
                <a href={app.certificateUrl} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" />View Certificate
                </a>
              </div>
            )}

            {isDownloaded && (
              <div className="bg-slate-900/40 rounded-xl p-3 border border-slate-700/40 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Verify Certificate Status:</span>
                {app.isCertificateVerified ? (
                  <Badge variant="green">True</Badge>
                ) : (
                  <Badge variant="red">False</Badge>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/60">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-white font-bold text-base leading-tight">Admin Dashboard</h1>
                <p className="text-slate-500 text-xs hidden sm:block">Internship Management</p>
              </div>
            </div>
            <button onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 text-sm font-medium transition-all duration-200">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Applications" value={filteredApplications.length} icon={FileText}
            color={{ border: 'border-blue-500/20', bg: 'bg-blue-500/5', label: 'text-slate-400', sub: 'text-blue-400', iconBg: 'bg-blue-500/20', icon: 'text-blue-400', glow: 'bg-blue-500' }}
            sub="Filtered results" />
          <StatCard label="New Applications" value={newApplications.length} icon={Clock}
            color={{ border: 'border-amber-500/20', bg: 'bg-amber-500/5', label: 'text-slate-400', sub: 'text-amber-400', iconBg: 'bg-amber-500/20', icon: 'text-amber-400', glow: 'bg-amber-500' }}
            sub="Pending export" />
          <StatCard label="Processed" value={downloadedApplications.length} icon={CheckCircle}
            color={{ border: 'border-green-500/20', bg: 'bg-green-500/5', label: 'text-slate-400', sub: 'text-green-400', iconBg: 'bg-green-500/20', icon: 'text-green-400', glow: 'bg-green-500' }}
            sub="Downloaded" />
          <StatCard label="Paid Interns" value={paidCount} icon={TrendingUp}
            color={{ border: 'border-teal-500/20', bg: 'bg-teal-500/5', label: 'text-slate-400', sub: 'text-teal-400', iconBg: 'bg-teal-500/20', icon: 'text-teal-400', glow: 'bg-teal-500' }}
            sub="Confirmed" />
        </div>

        <div className="bg-slate-800/30 rounded-2xl border border-slate-700/40 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by name, email, student ID, or domain..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-900/60 border border-slate-700/50 text-white placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="relative min-w-[180px]">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <select value={selectedDomain} onChange={(e) => setSelectedDomain(e.target.value)}
                className="w-full appearance-none pl-10 pr-10 py-2.5 bg-slate-900/60 border border-slate-700/50 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all cursor-pointer">
                <option value="">All Domains</option>
                {domains.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>

            <div className="flex gap-2 flex-wrap lg:flex-nowrap">
              <button onClick={handleExport} disabled={exporting || newApplications.length === 0}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 disabled:from-green-800 disabled:to-green-700 disabled:opacity-40 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-lg shadow-green-500/20 whitespace-nowrap">
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Export New
              </button>
              <button onClick={handleExportPaid}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-lg shadow-teal-500/20 whitespace-nowrap">
                <Download className="w-4 h-4" />
                Export Paid
              </button>
              <div className="flex-1 lg:flex-none flex gap-1 bg-slate-900/60 border border-slate-700/50 rounded-xl p-1 items-center">
                <select 
                  value={exportDuration} 
                  onChange={(e) => setExportDuration(e.target.value)}
                  className="bg-transparent text-white text-xs border-0 focus:ring-0 focus:outline-none px-2 cursor-pointer"
                >
                  <option value="1" className="bg-slate-900 text-white">1 Month</option>
                  <option value="2" className="bg-slate-900 text-white">2 Months</option>
                  <option value="3" className="bg-slate-900 text-white">3 Months</option>
                </select>
                <button 
                  onClick={() => handleExportProjectSubmitted(exportDuration)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export Completed
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/30 rounded-2xl border border-slate-700/40 p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-white font-semibold text-sm">Bulk Certificate Upload</h3>
              <p className="text-slate-500 text-xs mt-0.5">Upload Excel with columns: Certificate_Number, Student_Name, Domain, Start_Date, End_Date, Duration, Student_ID</p>
            </div>
            <label className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-all text-sm font-medium whitespace-nowrap flex-shrink-0 ${uploadingExcel ? 'border-blue-500/30 bg-blue-500/10 text-blue-400' : 'border-slate-600/50 bg-slate-900/50 text-slate-300 hover:border-blue-500/50 hover:text-blue-400 hover:bg-blue-500/10'}`}>
              {uploadingExcel ? (
                <><Loader2 className="w-4 h-4 animate-spin" /><span>Uploading...</span></>
              ) : (
                <><FileInput className="w-4 h-4" /><span>Choose Excel File</span></>
              )}
              <input type="file" accept=".xlsx" onChange={handleExcelUpload} className="hidden" disabled={uploadingExcel} />
            </label>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-800/40 p-1 rounded-xl border border-slate-700/40 mb-6 w-fit">
          <button
            onClick={() => setActiveTab('new')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'new' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-300'}`}
          >
            <Clock className="w-4 h-4" />
            New Applications
            {newApplications.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'new' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-400'}`}>
                {newApplications.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('downloaded')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'downloaded' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-300'}`}
          >
            <CheckCircle className="w-4 h-4" />
            Processed
            {downloadedApplications.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'downloaded' ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                {downloadedApplications.length}
              </span>
            )}
          </button>
        </div>

        <div className="bg-slate-800/30 rounded-2xl border border-slate-700/40 overflow-hidden">
          {displayedApps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 px-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
                {activeTab === 'new' ? <Clock className="w-8 h-8 text-slate-600" /> : <CheckCircle className="w-8 h-8 text-slate-600" />}
              </div>
              <p className="text-white font-medium text-lg">
                {activeTab === 'new' ? 'No new applications' : 'No processed applications'}
              </p>
              <p className="text-slate-500 text-sm mt-1">
                {activeTab === 'new' ? 'All applications have been exported.' : 'Export new applications to see them here.'}
              </p>
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="mt-4 flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm transition-colors">
                  <X className="w-4 h-4" />Clear search
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-700/60 bg-slate-900/40">
                      {activeTab === 'new' ? (
                        <>
                          <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">Student ID</th>
                          <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                          <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                          <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Domain</th>
                          <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Duration</th>
                          <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">Timeline</th>
                          <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">Applied At</th>
                          <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">Offer Letter</th>
                          <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Payment</th>
                          <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">Dashboard Access</th>
                          <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tasks</th>
                        </>
                      ) : (
                        <>
                          <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">Student ID</th>
                          <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                          <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                          <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Domain</th>
                          <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Duration</th>
                          <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Batch</th>
                          <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">Downloaded At</th>
                          <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">Start Date</th>
                          <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">End Date</th>
                          <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Months</th>
                          <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Certificate</th>
                          <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">Offer Letter</th>
                          <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Payment</th>
                          <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">Dashboard Access</th>
                          <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tasks</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/30">
                    {displayedApps.map((app, i) => (
                      <tr key={app._id || i} className="hover:bg-slate-700/20 transition-colors duration-150 group">
                        <td className="py-3.5 px-4 text-slate-400 text-sm font-mono">{app.studentId || '—'}</td>
                        <td className="py-3.5 px-4">
                          <span className="text-white font-medium text-sm group-hover:text-blue-300 transition-colors">{app.name}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 text-sm">{app.email}</td>
                        <td className="py-3.5 px-4">
                          <Badge variant="blue">{app.domain}</Badge>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 text-sm whitespace-nowrap">{app.duration}</td>

                        {activeTab === 'new' ? (
                          <>
                            <td className="py-3.5 px-4">
                              {app.startDate ? (
                                <div className="space-y-0.5">
                                  <p className="text-xs text-green-400 whitespace-nowrap">{new Date(app.startDate).toLocaleDateString('en-IN')}</p>
                                  <p className="text-xs text-slate-500 whitespace-nowrap">{new Date(app.endDate).toLocaleDateString('en-IN')}</p>
                                </div>
                              ) : (
                                <div className="relative min-w-[130px]">
                                  <select onChange={(e) => handleStartDateAssignment(app._id, e.target.value)} defaultValue=""
                                    className="w-full appearance-none bg-slate-800/80 border border-slate-600/50 text-white rounded-lg px-3 py-1.5 text-xs pr-7 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer">
                                    <option value="" disabled>Set date...</option>
                                    {upcomingDateOptions.map((opt, idx) => <option key={idx} value={opt.value}>{opt.label}</option>)}
                                  </select>
                                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-slate-400 text-xs whitespace-nowrap">{new Date(app.appliedAt).toLocaleString('en-IN')}</td>
                            <td className="py-3.5 px-4">
                              <div className="relative">
                                <select value={app.offerLetterStatus || 'Not Sent'} onChange={(e) => handleOfferLetterChange(app._id, e.target.value)}
                                  className="appearance-none bg-slate-800/80 border border-slate-600/50 text-white rounded-lg px-3 py-1.5 text-xs pr-7 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer">
                                  <option value="Not Sent">Not Sent</option>
                                  <option value="Sent">Sent</option>
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="relative">
                                <select value={app.hasPaid ? 'Yes' : 'No'} onChange={() => handleTogglePaidStatus(app._id, app.hasPaid)}
                                  className="appearance-none bg-slate-800/80 border border-slate-600/50 text-white rounded-lg px-3 py-1.5 text-xs pr-7 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer">
                                  <option value="No">No</option>
                                  <option value="Yes">Yes</option>
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="relative">
                                <select value={app.bypassBlock ? 'Give Access' : 'Strict'} onChange={() => handleToggleBypassBlock(app._id, app.bypassBlock)}
                                  className="appearance-none bg-slate-800/80 border border-slate-600/50 text-white rounded-lg px-3 py-1.5 text-xs pr-7 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer">
                                  <option value="Strict">Strict</option>
                                  <option value="Give Access">Give Access</option>
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1">
                                <span className="text-white text-xs font-medium">{app.submissions?.length || 0}</span>
                                <span className="text-slate-600 text-xs">/</span>
                                <span className="text-slate-500 text-xs">{app.duration ? parseInt(app.duration) : 1}</span>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-3.5 px-4 text-slate-400 text-sm">{app.batch || '—'}</td>
                            <td className="py-3.5 px-4 text-green-400 text-xs whitespace-nowrap">{new Date(app.downloadedAt).toLocaleString('en-IN')}</td>
                            <td className="py-3.5 px-4">
                              {app.startDate ? (
                                <span className="text-slate-300 text-xs whitespace-nowrap">{new Date(app.startDate).toLocaleDateString('en-IN')}</span>
                              ) : (
                                <div className="relative min-w-[130px]">
                                  <select onChange={(e) => handleStartDateAssignment(app._id, e.target.value)} defaultValue=""
                                    className="w-full appearance-none bg-slate-800/80 border border-slate-600/50 text-white rounded-lg px-3 py-1.5 text-xs pr-7 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer">
                                    <option value="" disabled>Set date...</option>
                                    {upcomingDateOptions.map((opt, idx) => <option key={idx} value={opt.value}>{opt.label}</option>)}
                                  </select>
                                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-slate-400 text-xs whitespace-nowrap">{app.endDate ? new Date(app.endDate).toLocaleDateString('en-IN') : '—'}</td>
                            <td className="py-3.5 px-4 text-slate-400 text-sm">{app.totalMonths || '—'}</td>
                            <td className="py-3.5 px-4">
                              {app.isCertificateVerified ? (
                                <Badge variant="green">True</Badge>
                              ) : (
                                <Badge variant="red">False</Badge>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="relative">
                                <select value={app.offerLetterStatus || 'Not Sent'} onChange={(e) => handleOfferLetterChange(app._id, e.target.value)}
                                  className="appearance-none bg-slate-800/80 border border-slate-600/50 text-white rounded-lg px-3 py-1.5 text-xs pr-7 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer">
                                  <option value="Not Sent">Not Sent</option>
                                  <option value="Sent">Sent</option>
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="relative">
                                <select value={app.hasPaid ? 'Yes' : 'No'} onChange={() => handleTogglePaidStatus(app._id, app.hasPaid)}
                                  className="appearance-none bg-slate-800/80 border border-slate-600/50 text-white rounded-lg px-3 py-1.5 text-xs pr-7 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer">
                                  <option value="No">No</option>
                                  <option value="Yes">Yes</option>
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="relative">
                                <select value={app.bypassBlock ? 'Give Access' : 'Strict'} onChange={() => handleToggleBypassBlock(app._id, app.bypassBlock)}
                                  className="appearance-none bg-slate-800/80 border border-slate-600/50 text-white rounded-lg px-3 py-1.5 text-xs pr-7 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer">
                                  <option value="Strict">Strict</option>
                                  <option value="Give Access">Give Access</option>
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1">
                                <span className="text-white text-xs font-medium">{app.submissions?.length || 0}</span>
                                <span className="text-slate-600 text-xs">/</span>
                                <span className="text-slate-500 text-xs">{app.duration ? parseInt(app.duration) : 1}</span>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="lg:hidden p-4 space-y-3">
                {displayedApps.map((app, i) => (
                  <MobileCard key={app._id || i} app={app} isDownloaded={activeTab === 'downloaded'} />
                ))}
              </div>
            </>
          )}

          {displayedApps.length > 0 && (
            <div className="border-t border-slate-700/40 px-4 py-3 flex items-center justify-between bg-slate-900/20">
              <p className="text-slate-500 text-xs">Showing <span className="text-slate-300 font-medium">{displayedApps.length}</span> {activeTab === 'new' ? 'new' : 'processed'} applications</p>
              {(searchQuery || selectedDomain) && (
                <button onClick={() => { setSearchQuery(''); setSelectedDomain(''); }} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors">
                  <X className="w-3.5 h-3.5" />Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <ToastContainer
        theme="dark"
        position="top-right"
        autoClose={3000}
        toastClassName="!bg-slate-800 !border !border-slate-700 !text-white"
        progressClassName="!bg-blue-500"
      />
    </div>
  );
};

export default AdminDashboard;
