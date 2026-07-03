import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as XLSX from "xlsx";
import {
  LogOut,
  Loader2,
  Filter,
  Download,
  CheckCircle,
  Clock,
  User,
  Mail,
  Briefcase,
  Calendar,
  Phone,
  GraduationCap,
  MapPin,
  FileText,
  UploadCloud,
  Save,
  FileInput,
  Search,
  ChevronDown,
  ExternalLink,
  UserPlus,
  TrendingUp,
  Users,
  AlertCircle,
  X,
  CreditCard,
  LayoutDashboard,
  Activity,
  Plus,
  Trash2,
  ListTodo,
  BookOpen,
  Trophy,
} from "lucide-react";
import SummerProjectsAdmin from "./SummerProjectsAdmin";
import NormalTasksAdmin from "./NormalTasksAdmin";
import NotificationsAdmin from "./NotificationsAdmin";
import SubmissionsAdmin from "./SubmissionsAdmin";
import InterviewAdminPage from "./InterviewAdminPage";
import TokenAdminPage from "./TokenAdminPage";
import { Bell, Settings, Zap, Database } from "lucide-react";

const AdminDashboard = () => {
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [domains, setDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("new");
  const [activeMainTab, setActiveMainTab] = useState("features");
  const [activeSidebarTab, setActiveSidebarTab] = useState("interns");
  const [activeFeatureTab, setActiveFeatureTab] = useState("interview");
  const [leaderboardSubTab, setLeaderboardSubTab] = useState("active");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [updating, setUpdating] = useState({});
  const [forms, setForms] = useState({});
  const [recentPayments, setRecentPayments] = useState([]);
  const [uploadingExcel, setUploadingExcel] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);
  const [selectedSubmissionsApp, setSelectedSubmissionsApp] = useState(null);
  const [exportDuration, setExportDuration] = useState("1");
  const [paymentEnabled, setPaymentEnabled] = useState(true);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [leaderboardEnabled, setLeaderboardEnabled] = useState(false);
  const [assignTasksModal, setAssignTasksModal] = useState({
    isOpen: false,
    appId: null,
    duration: 1,
    tasks: [],
  });
  const [selectedApplications, setSelectedApplications] = useState([]);
  const [showBulkActionModal, setShowBulkActionModal] = useState(false);
  const [bulkActionForm, setBulkActionForm] = useState({
    internshipType: "",
    startDate: "",
    offerLetterStatus: "",
    hasPaid: "",
    isCertificateSent: ""
  });
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [syncingRefunds, setSyncingRefunds] = useState(false);
  const navigate = useNavigate();

  const getUpcomingDates = () => {
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 3; i++) {
      const year = today.getFullYear();
      const month = today.getMonth() + i;
      [5, 15, 25].forEach((day) => {
        const d = new Date(year, month, day);
        if (d >= today) {
          dates.push({
            value: d.toISOString(),
            label: d.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
          });
        }
      });
    }
    return dates
      .sort((a, b) => new Date(a.value) - new Date(b.value))
      .slice(0, 6);
  };
  const upcomingDateOptions = getUpcomingDates();

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      toast.error("Admin login required");
      navigate("/admin-login");
      return;
    }
    fetchApplications(token);
    fetchPaymentSetting(token);
    fetchRegistrationSetting(token);
    fetchLeaderboardSetting(token);
    fetchRecentPayments(token);
  }, []);

  useEffect(() => {
    let result = applications;
    if (selectedDomain)
      result = result.filter((app) => app.domain === selectedDomain);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (app) =>
          app.name?.toLowerCase().includes(q) ||
          app.email?.toLowerCase().includes(q) ||
          app.studentId?.toLowerCase().includes(q) ||
          app.domain?.toLowerCase().includes(q),
      );
    }
    setFilteredApplications(result);
  }, [selectedDomain, searchQuery, applications]);

  const fetchApplications = async (token) => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/internships`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const allApps = res.data;
      setApplications(allApps);
      setFilteredApplications(allApps);

      const baseDomains = [
        "Frontend Development",
        "Backend Development",
        "Full Stack Development",
        "C Programming",
        "Python Development",
        "Artificial Intelligence",
        "Figma or UI/UX",
        "Data Science",
        "Machine Learning",
        "App Development",
        "Marketing",
      ];
      const uniqueDynamicDomains = [
        ...new Set(allApps.map((app) => app.domain)),
      ].filter(Boolean);
      const allDomains = [
        ...new Set([...baseDomains, ...uniqueDynamicDomains]),
      ].sort();

      setDomains(allDomains);
    } catch (err) {
      toast.error("Failed to load applications");
      localStorage.removeItem("adminToken");
      navigate("/admin-login");
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentSetting = async (token) => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/settings/payment`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setPaymentEnabled(res.data.paymentEnabled);
    } catch (err) {
      console.error("Failed to load payment setting:", err);
    }
  };

  const fetchRecentPayments = async (token) => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/recent-payments`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setRecentPayments(res.data);
    } catch (err) {
      console.error("Failed to fetch recent payments:", err);
    }
  };

  const fetchRegistrationSetting = async (token) => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/settings/registration`,
      );
      setRegistrationEnabled(res.data.registrationEnabled);
    } catch (err) {
      console.error("Failed to load registration setting:", err);
    }
  };

  const handleToggleRegistration = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/settings/registration`,
        { registrationEnabled: !registrationEnabled },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setRegistrationEnabled(res.data.registrationEnabled);
      toast.success(res.data.message);
    } catch (err) {
      toast.error("Failed to toggle registration setting");
    }
  };

  const fetchLeaderboardSetting = async (token) => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/settings/leaderboard`
      );
      setLeaderboardEnabled(res.data.showLeaderboard);
    } catch (err) {
      console.error("Failed to load leaderboard setting:", err);
    }
  };

  const handleToggleLeaderboard = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/settings/leaderboard`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setLeaderboardEnabled(res.data.showLeaderboard);
      toast.success(res.data.message);
    } catch (err) {
      toast.error("Failed to toggle leaderboard setting");
    }
  };

  const openAssignTasksModal = (appId, durationStr, existingTasks = []) => {
    const totalMonths = parseInt(durationStr.split(" ")[0], 10) || 1;
    const initialTasks = Array.from({ length: totalMonths }).map(
      (_, i) => existingTasks[i] || "",
    );
    setAssignTasksModal({
      isOpen: true,
      appId,
      duration: totalMonths,
      tasks: initialTasks,
    });
  };

  const handleAssignTasksSubmit = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const { appId, tasks } = assignTasksModal;
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/assign-normal-tasks`,
        {
          applicationId: appId,
          tasks,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      toast.success("Tasks assigned successfully");
      setAssignTasksModal({
        isOpen: false,
        appId: null,
        duration: 1,
        tasks: [],
      });
      fetchApplications(token);
    } catch (err) {
      toast.error("Failed to assign tasks");
    }
  };

  const handleTogglePayment = async () => {
    const token = localStorage.getItem("adminToken");
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/settings/payment`,
        { paymentEnabled: !paymentEnabled },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setPaymentEnabled(res.data.paymentEnabled);
      toast.success(res.data.message);
    } catch (err) {
      toast.error("Failed to toggle payment setting");
    }
  };

  const handleSyncRefunds = async () => {
    const token = localStorage.getItem("adminToken");
    setSyncingRefunds(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/sync-refunds`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(res.data.message);
      fetchApplications(token);
    } catch (err) {
      toast.error("Failed to sync refunds");
    } finally {
      setSyncingRefunds(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    const token = localStorage.getItem("adminToken");
    try {
      const newApps = filteredApplications.filter((app) => !app.downloadedAt);
      if (newApps.length === 0) {
        toast.info("No new applications to export");
        setExporting(false);
        return;
      }
      const data = newApps.map((app) => ({
        StudentID: app.studentId || "N/A",
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
        Portfolio: app.portfolio || "N/A",
        GitHub: app.github || "N/A",
        LinkedIn: app.linkedin || "N/A",
        Batch: app.batch || "N/A",
        WhyHire: app.whyHire,
        HearAbout: app.hearAbout,
        ResumeURL: app.resumeUrl,
        AppliedAt: new Date(app.appliedAt).toLocaleString("en-IN"),
      }));
      const ws = XLSX.utils.json_to_sheet(data, {
        header: [
          "StudentID",
          "Name",
          "Email",
          "Domain",
          "Duration",
          "Batch",
          "Mobile",
          "WhatsApp",
          "Course",
          "Branch",
          "Year",
          "College",
          "State",
          "PassingYear",
          "Portfolio",
          "GitHub",
          "LinkedIn",
          "WhyHire",
          "HearAbout",
          "ResumeURL",
          "AppliedAt",
        ],
      });
      const colWidths = [
        { wch: 15 },
        { wch: 20 },
        { wch: 30 },
        { wch: 18 },
        { wch: 18 },
        { wch: 12 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 10 },
        { wch: 30 },
        { wch: 15 },
        { wch: 12 },
        { wch: 35 },
        { wch: 35 },
        { wch: 35 },
        { wch: 60 },
        { wch: 20 },
        { wch: 50 },
        { wch: 22 },
      ];
      ws["!cols"] = colWidths;
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Internship Applications");
      const fileName = `CodeNova_New_Internships_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fileName);
      const applicationIds = newApps.map((app) => app._id);
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/mark-downloaded`,
        { applicationIds },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success(`${newApps.length} new applications exported!`);
      await fetchApplications(token);
      setActiveTab("downloaded");
    } catch (err) {
      toast.error("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const handleExportPaid = async () => {
    try {
      const paidApps = applications.filter(
        (app) => app.hasPaid && !app.paidExported,
      );
      if (paidApps.length === 0) {
        toast.info("No newly paid applications found to export.");
        return;
      }
      const data = paidApps.map((app) => ({
        StudentID: app.studentId || "N/A",
        Name: app.name,
        Email: app.email,
        Domain: app.domain,
        Duration: app.duration,
        Mobile: app.mobile,
        AppliedAt: new Date(app.appliedAt).toLocaleString("en-IN"),
        StartDate: app.startDate
          ? new Date(app.startDate).toLocaleDateString("en-IN")
          : "N/A",
        EndDate: app.endDate
          ? new Date(app.endDate).toLocaleDateString("en-IN")
          : "N/A",
        TotalSubmissions: app.submissions ? app.submissions.length : 0,
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Paid Interns");
      XLSX.writeFile(
        wb,
        `CodeNova_Paid_Interns_${new Date().toISOString().slice(0, 10)}.xlsx`,
      );

      const token = localStorage.getItem("adminToken");
      const applicationIds = paidApps.map((app) => app._id);
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/mark-paid-exported`,
        { applicationIds },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      toast.success(
        `${paidApps.length} newly paid applications exported and marked!`,
      );
      fetchApplications(token);
    } catch (err) {
      toast.error("Failed to export paid applications");
      console.error(err);
    }
  };

  const handleExportSelected = () => {
    try {
      if (selectedApplications.length === 0) {
        toast.info("Please select applications to export.");
        return;
      }

      const selectedAppsData = applications.filter((app) =>
        selectedApplications.includes(app._id)
      );

      const data = selectedAppsData.map((app) => ({
        "Student Name": app.name,
        "Email ID": app.email,
        "Student ID": app.studentId || "N/A",
        "Domain": app.domain,
        "Mobile Number": app.mobile,
        "Internship Type": app.internshipType || "Normal Intern",
        "Internship Start Date": app.startDate
          ? new Date(app.startDate).toLocaleDateString("en-IN")
          : "N/A",
        "End Date": app.endDate
          ? new Date(app.endDate).toLocaleDateString("en-IN")
          : "N/A",
        "Duration": app.duration || "N/A",
        "Offer Letter Status": app.offerLetterStatus || "Pending",
        "Paid Status": app.hasPaid ? "Yes" : "No",
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const colWidths = [
        { wch: 25 },
        { wch: 30 },
        { wch: 15 },
        { wch: 25 },
        { wch: 15 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 15 },
        { wch: 20 },
        { wch: 15 },
      ];
      ws["!cols"] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Selected Interns");
      XLSX.writeFile(wb, "Selected_Interns_Export.xlsx");
      toast.success("Selected rows exported successfully!");
    } catch (err) {
      toast.error("Failed to export selected rows");
      console.error(err);
    }
  };

  const handleExportProjectSubmitted = async (durationVal) => {
    try {
      if (!durationVal) {
        toast.info("Please select an internship duration to export.");
        return;
      }

      const targetDurationStr = `${durationVal} Month${parseInt(durationVal) > 1 ? "s" : ""}`;

      const completedApps = applications.filter((app) => {
        const regDuration = parseInt(app.duration?.split(" ")[0], 10) || 1;
        const subCount = app.submissions ? app.submissions.length : 0;
        const isTargetDuration = regDuration === parseInt(durationVal, 10);
        return (
          isTargetDuration && subCount >= regDuration && !app.projectExported
        );
      });

      if (completedApps.length === 0) {
        toast.info(
          `No newly completed project submissions found for ${targetDurationStr}.`,
        );
        return;
      }

      const data = completedApps.map((app) => ({
        "Student Name": app.name,
        "Email ID": app.email,
        "Student ID": app.studentId || "N/A",
        "Project Submitted": app.submissions ? app.submissions.length : 0,
        "Mobile Number": app.mobile,
        "Internship Start Date": app.startDate
          ? new Date(app.startDate).toLocaleDateString("en-IN")
          : "N/A",
        "End Date": app.endDate
          ? new Date(app.endDate).toLocaleDateString("en-IN")
          : "N/A",
        "Project Submission Duration": app.duration || targetDurationStr,
      }));

      const ws = XLSX.utils.json_to_sheet(data, {
        header: [
          "Student Name",
          "Email ID",
          "Student ID",
          "Project Submitted",
          "Mobile Number",
          "Internship Start Date",
          "End Date",
          "Project Submission Duration",
        ],
      });
      const colWidths = [
        { wch: 25 },
        { wch: 30 },
        { wch: 15 },
        { wch: 18 },
        { wch: 15 },
        { wch: 20 },
        { wch: 20 },
        { wch: 25 },
      ];
      ws["!cols"] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `Completed Interns ${durationVal}M`);
      XLSX.writeFile(
        wb,
        `CodeNova_Completed_${durationVal}Month_Interns_${new Date().toISOString().slice(0, 10)}.xlsx`,
      );

      const token = localStorage.getItem("adminToken");
      const applicationIds = completedApps.map((app) => app._id);
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/mark-project-exported`,
        { applicationIds },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      toast.success(
        `${completedApps.length} completed students (${targetDurationStr}) exported!`,
      );
      fetchApplications(token);
    } catch (err) {
      toast.error("Failed to export completed student projects");
      console.error(err);
    }
  };

  const handleTogglePaidStatus = async (appId, currentStatus) => {
    try {
      const token = localStorage.getItem("adminToken");
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/update-paid-status`,
        { applicationId: appId, hasPaid: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success(`Paid status updated to ${!currentStatus ? "Yes" : "No"}`);
      fetchApplications(token);
    } catch (err) {
      toast.error("Failed to update paid status");
      console.error(err);
    }
  };

  const handleToggleCertificateSent = async (appId, currentStatus) => {
    try {
      const token = localStorage.getItem("adminToken");
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/update-certificate-sent`,
        { applicationId: appId, isCertificateSent: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success(
        `Certificate Sent status updated to ${!currentStatus ? "Yes" : "No"}`,
      );
      fetchApplications(token);
    } catch (err) {
      toast.error("Failed to update Certificate Sent status");
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    toast.success("Admin logged out");
    navigate("/admin-login");
  };

  const handleOfferLetterChange = async (appId, newStatus) => {
    try {
      const token = localStorage.getItem("adminToken");
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/update-offer-status`,
        { applicationId: appId, status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success(`Offer Letter marked as ${newStatus}`);
      fetchApplications(token);
    } catch (err) {
      toast.error("Failed to update Offer Letter status");
    }
  };

  const handleInternshipTypeChange = async (appId, newType) => {
    try {
      const token = localStorage.getItem("adminToken");
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/update-internship-type`,
        { applicationId: appId, internshipType: newType },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success(`Internship type marked as ${newType}`);
      fetchApplications(token);
    } catch (err) {
      toast.error("Failed to update Internship Type");
    }
  };

  const handleStartDateAssignment = async (appId, dateValue) => {
    if (!dateValue) return;
    try {
      const token = localStorage.getItem("adminToken");
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/set-start-date`,
        { applicationId: appId, startDate: dateValue },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success("Timeline activated!");
      fetchApplications(token);
    } catch (err) {
      toast.error("Failed to set start date");
    }
  };

  const handleFormChange = (appId, field, value) => {
    setForms((prev) => ({
      ...prev,
      [appId]: { ...prev[appId], [field]: value },
    }));
  };

  const handleCertificateUpload = async (appId, file) => {
    if (!file || file.type !== "application/pdf") {
      toast.error("Only PDF files allowed");
      return;
    }
    if (file.size > 1024 * 1024) {
      toast.error("File too large, max 1MB");
      return;
    }
    setUpdating((prev) => ({ ...prev, [appId]: true }));
    const uploadData = new FormData();
    uploadData.append("file", file);
    uploadData.append(
      "upload_preset",
      import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
    );
    uploadData.append("folder", "internship-certificates");
    uploadData.append("resource_type", "raw");
    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/upload`,
        { method: "POST", body: uploadData },
      );
      const data = await res.json();
      if (data.secure_url) {
        handleFormChange(appId, "certificateUrl", data.secure_url);
        toast.success("Certificate uploaded!");
      }
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setUpdating((prev) => ({ ...prev, [appId]: false }));
    }
  };

  const handleStartDateChange = (appId, durationStr, val) => {
    const months = parseInt(durationStr, 10) || 1;
    let endVal = "";
    if (val) {
      const date = new Date(val);
      if (!isNaN(date.getTime())) {
        date.setMonth(date.getMonth() + months);
        endVal = date.toISOString().split("T")[0];
      }
    }
    setForms((prev) => ({
      ...prev,
      [appId]: {
        ...prev[appId],
        startDate: val,
        endDate: endVal,
      },
    }));
  };

  const handleUpdateInternship = async (appId) => {
    const token = localStorage.getItem("adminToken");
    const form = forms[appId] || {};
    if (!form.startDate || !form.endDate) {
      toast.error("Start date is required");
      return;
    }
    setUpdating((prev) => ({ ...prev, [appId]: true }));
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/update-internship`,
        {
          applicationId: appId,
          startDate: form.startDate,
          endDate: form.endDate,
          certificateUrl: form.certificateUrl || "",
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success("Updated successfully!");
      fetchApplications(token);
    } catch (err) {
      toast.error("Update failed");
    } finally {
      setUpdating((prev) => ({ ...prev, [appId]: false }));
    }
  };

  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (
      file.type !==
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      toast.error("Only Excel files (.xlsx) are allowed");
      return;
    }
    setUploadingExcel(true);
    const token = localStorage.getItem("adminToken");
    const formData = new FormData();
    formData.append("excelFile", file);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/upload-certificates`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );
      toast.success(res.data.message);
    } catch (err) {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploadingExcel(false);
    }
  };

  const handleSelectAll = (e, currentApps) => {
    if (e.target.checked) {
      const newSelections = [...selectedApplications];
      currentApps.forEach(app => {
        if (!newSelections.includes(app._id)) {
          newSelections.push(app._id);
        }
      });
      setSelectedApplications(newSelections);
    } else {
      const currentAppIds = currentApps.map(app => app._id);
      setSelectedApplications(selectedApplications.filter(id => !currentAppIds.includes(id)));
    }
  };

  const handleSelectToggle = (appId) => {
    if (selectedApplications.includes(appId)) {
      setSelectedApplications(selectedApplications.filter(id => id !== appId));
    } else {
      setSelectedApplications([...selectedApplications, appId]);
    }
  };
  const handleManualAcceptAssignment = async (submissionId, assignmentId) => {
    if (!window.confirm("Are you sure you want to manually accept this assignment? This will award 50 SP to the student.")) {
      return;
    }
    
    try {
      const token = localStorage.getItem("adminToken");
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/manual-accept-assignment`,
        { submissionId, assignmentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Assignment manually accepted! 50 SP awarded.");
      
      // Update the local state so the UI reflects the change immediately
      if (selectedSubmissionsApp) {
        const updatedSubmissions = selectedSubmissionsApp.submissions.map(sub => {
          if (sub._id === submissionId) {
            return {
              ...sub,
              assignments: sub.assignments.map(a => 
                a._id === assignmentId 
                  ? { ...a, aiStatus: 'Accepted', aiFeedback: 'Manually Accepted by Admin' } 
                  : a
              )
            };
          }
          return sub;
        });
        setSelectedSubmissionsApp({ ...selectedSubmissionsApp, submissions: updatedSubmissions });
      }
      fetchApplications(token);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to manually accept assignment.");
    }
  };
  const handleBulkUpdate = async () => {
    if (selectedApplications.length === 0) return;
    
    setBulkUpdating(true);
    const token = localStorage.getItem("adminToken");
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/bulk-update`,
        {
          applicationIds: selectedApplications,
          updates: bulkActionForm
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Successfully updated ${selectedApplications.length} applications`);
      setShowBulkActionModal(false);
      setSelectedApplications([]);
      setBulkActionForm({
        internshipType: "",
        startDate: "",
        offerLetterStatus: "",
        hasPaid: "",
        isCertificateSent: ""
      });
      fetchApplications(token);
    } catch (err) {
      toast.error("Bulk update failed");
    } finally {
      setBulkUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-slate-300 mx-auto" />
            <div className="w-20 h-20 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin absolute inset-0 mx-auto" />
          </div>
          <p className="text-slate-900 text-lg font-medium mt-6">
            Loading dashboard...
          </p>
          <p className="text-slate-500 text-sm mt-1">Fetching applications</p>
        </div>
      </div>
    );
  }

  const newApplications = filteredApplications.filter(
    (app) => !app.downloadedAt,
  );
  const downloadedApplications = filteredApplications.filter(
    (app) => app.downloadedAt,
  );
  const paidCount = applications.filter((app) => app.hasPaid).length;
  const realPayerCount = applications.filter((app) => (app.paymentAmount || 0) - (app.refundAmount || 0) > 0).length;
  const totalRevenue = applications.reduce((sum, app) => sum + (app.paymentAmount || 0) - (app.refundAmount || 0), 0);
  const displayedApps =
    activeTab === "new" ? newApplications : downloadedApplications;

  const StatCard = ({ label, value, icon: Icon, color, sub }) => (
    <div
      className={`relative overflow-hidden rounded-2xl p-6 border ${color.border} ${color.bg} backdrop-blur-sm`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm font-medium ${color.label} mb-1`}>{label}</p>
          <p className="text-4xl font-bold text-slate-900 tracking-tight">
            {value}
          </p>
          {sub && <p className={`text-xs mt-2 ${color.sub}`}>{sub}</p>}
        </div>
        <div
          className={`w-12 h-12 rounded-xl ${color.iconBg} flex items-center justify-center flex-shrink-0`}
        >
          <Icon className={`w-6 h-6 ${color.icon}`} />
        </div>
      </div>
      <div
        className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full ${color.glow} opacity-20`}
      />
    </div>
  );

  const Badge = ({ children, variant = "blue" }) => {
    const styles = {
      blue: "bg-blue-500/15 text-blue-600 border-blue-500/25 ring-1 ring-blue-500/20",
      green:
        "bg-green-500/15 text-green-600 border-green-500/25 ring-1 ring-green-500/20",
      amber:
        "bg-amber-500/15 text-amber-600 border-amber-500/25 ring-1 ring-amber-500/20",
      red: "bg-red-500/15 text-red-600 border-red-500/25 ring-1 ring-red-500/20",
      slate:
        "bg-slate-500/15 text-slate-500 border-slate-500/25 ring-1 ring-slate-300/50",
    };
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[variant]}`}
      >
        {children}
      </span>
    );
  };

  const SelectField = ({ value, onChange, options, className = "" }) => (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className={`appearance-none bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-1.5 text-xs pr-8 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer ${className}`}
      >
        {options.map((opt, i) => (
          <option key={i} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
    </div>
  );

  const MobileCard = ({ app, isDownloaded }) => {
    const isExpanded = expandedCard === app._id;
    const taskCount = app.submissions ? app.submissions.length : 0;
    const totalTasks = app.duration ? parseInt(app.duration) : 1;

    return (
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-slate-300 transition-all duration-200">
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
                <User className="w-5 h-5 text-slate-900" />
              </div>
              <div className="min-w-0">
                <h3 className="text-slate-900 font-semibold text-sm truncate">
                  {app.name}
                </h3>
                <p className="text-slate-500 text-xs">
                  {app.studentId || "No ID"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant={isDownloaded ? "green" : "amber"}>
                {isDownloaded ? "Processed" : "New"}
              </Badge>
              <button
                onClick={() => setExpandedCard(isExpanded ? null : app._id)}
                className="w-7 h-7 rounded-lg bg-slate-200/50 flex items-center justify-center hover:bg-slate-600/50 transition-colors"
              >
                <ChevronDown
                  className={`w-4 h-4 text-slate-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                />
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="blue">{app.domain}</Badge>
            <Badge variant="slate">{app.duration}</Badge>
            {app.hasPaid ? (
              <Badge variant="green">Paid</Badge>
            ) : (
              <Badge variant="amber">Pending</Badge>
            )}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1.5 text-slate-500 min-w-0">
              <Mail className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="text-xs truncate">{app.email}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500">
              <Phone className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="text-xs">{app.mobile}</span>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="border-t border-slate-200 p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-slate-500 mb-1">Course</p>
                <p className="text-slate-700">
                  {app.course} - {app.branch}
                </p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Year</p>
                <p className="text-slate-700">{app.year}</p>
              </div>
              <div className="col-span-2">
                <p className="text-slate-500 mb-1">College</p>
                <p className="text-slate-700">
                  {app.college}, {app.state}
                </p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Tasks Done</p>
                <p className="text-slate-700">
                  {taskCount} / {totalTasks}
                </p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Applied At</p>
                <p className="text-slate-700">
                  {new Date(app.appliedAt).toLocaleDateString("en-IN")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-slate-500 text-xs mb-1.5">Internship Type</p>
                <SelectField
                  value={app.internshipType || app.mode || "Normal Intern"}
                  onChange={(e) =>
                    handleInternshipTypeChange(app._id, e.target.value)
                  }
                  options={[
                    { value: "Normal Intern", label: "Normal Intern" },
                    { value: "Summer/Winter Intern", label: "Summer/Winter" },
                  ]}
                  className="w-full"
                />
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-1.5">Offer Letter</p>
                <SelectField
                  value={app.offerLetterStatus || "Not Sent"}
                  onChange={(e) =>
                    handleOfferLetterChange(app._id, e.target.value)
                  }
                  options={[
                    { value: "Not Sent", label: "Not Sent" },
                    { value: "Sent", label: "Sent" },
                  ]}
                  className="w-full"
                />
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-1.5">Timeline</p>
                {app.startDate ? (
                  <div>
                    <p className="text-xs text-green-600">
                      {new Date(app.startDate).toLocaleDateString("en-IN")}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(app.endDate).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                ) : (
                  <SelectField
                    value=""
                    onChange={(e) =>
                      handleStartDateAssignment(app._id, e.target.value)
                    }
                    options={[
                      { value: "", label: "Set date..." },
                      ...upcomingDateOptions,
                    ]}
                    className="w-full"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-slate-500 text-xs mb-1.5">Paid Status</p>
                <SelectField
                  value={app.hasPaid ? "Yes" : "No"}
                  onChange={() => handleTogglePaidStatus(app._id, app.hasPaid)}
                  options={[
                    { value: "No", label: "No" },
                    { value: "Yes", label: "Yes" },
                  ]}
                  className="w-full"
                />
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-1.5">
                  Certificate Sent
                </p>
                <SelectField
                  value={app.isCertificateSent ? "Yes" : "No"}
                  onChange={() =>
                    handleToggleCertificateSent(app._id, app.isCertificateSent)
                  }
                  options={[
                    { value: "No", label: "No" },
                    { value: "Yes", label: "Yes" },
                  ]}
                  className="w-full"
                />
              </div>
            </div>

            {isDownloaded && !app.certificateUrl && (
              <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-200">
                <p className="text-slate-900 text-xs font-medium mb-3">
                  Add Internship Details
                </p>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-500 text-xs block mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={forms[app._id]?.startDate || ""}
                        onChange={(e) =>
                          handleStartDateChange(
                            app._id,
                            app.duration,
                            e.target.value,
                          )
                        }
                        className="w-full bg-slate-100 border border-slate-300 text-slate-900 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 text-xs block mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={forms[app._id]?.endDate || ""}
                        disabled
                        readOnly
                        className="w-full bg-slate-50 border border-slate-300 text-slate-500 text-xs rounded-lg px-2 py-1.5 focus:outline-none cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 p-2.5 bg-white border border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-500/50 transition-colors">
                    <UploadCloud className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span className="text-xs text-slate-700">
                      {forms[app._id]?.certificateUrl
                        ? "Certificate uploaded"
                        : "Upload Certificate PDF"}
                    </span>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) =>
                        handleCertificateUpload(app._id, e.target.files[0])
                      }
                      className="hidden"
                    />
                  </label>
                  <button
                    onClick={() => handleUpdateInternship(app._id)}
                    disabled={updating[app._id]}
                    className="w-full py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    {updating[app._id] ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    Save Details
                  </button>
                </div>
              </div>
            )}

            {app.certificateUrl && (
              <div className="bg-green-500/10 rounded-xl p-3 border border-green-500/20">
                <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                  <div>
                    <p className="text-slate-500">Start</p>
                    <p className="text-slate-700">
                      {app.startDate
                        ? new Date(app.startDate).toLocaleDateString("en-IN")
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">End</p>
                    <p className="text-slate-700">
                      {app.endDate
                        ? new Date(app.endDate).toLocaleDateString("en-IN")
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Duration</p>
                    <p className="text-slate-700">{app.totalMonths || "N/A"}</p>
                  </div>
                </div>
                <a
                  href={app.certificateUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-300 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View Certificate
                </a>
              </div>
            )}

            {isDownloaded && (
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                <p className="text-slate-500 text-xs mb-1.5 flex items-center justify-between">
                  <span>Task Submissions</span>
                  <span className="font-bold text-slate-700">
                    {app.submissions?.length || 0}/
                    {app.duration ? parseInt(app.duration) : 1}
                  </span>
                </p>
                <button
                  onClick={() => setSelectedSubmissionsApp(app)}
                  className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition-colors border border-blue-200 flex items-center justify-center gap-2"
                >
                  <ExternalLink size={14} /> View GitHub Links
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const TasksTab = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-blue-600" /> Assign New Task
        </h2>
        <form
          onSubmit={handleCreateTask}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <input
            required
            type="text"
            placeholder="Task Title"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <input
            type="date"
            value={newTask.deadline}
            onChange={(e) =>
              setNewTask({ ...newTask, deadline: e.target.value })
            }
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <input
            type="text"
            placeholder="Student ID (Optional - target specific intern)"
            value={newTask.studentId}
            onChange={(e) =>
              setNewTask({ ...newTask, studentId: e.target.value })
            }
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <input
            type="text"
            placeholder="Domain (Optional - target specific domain)"
            value={newTask.domain}
            onChange={(e) => setNewTask({ ...newTask, domain: e.target.value })}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <textarea
            placeholder="Task Description"
            value={newTask.description}
            onChange={(e) =>
              setNewTask({ ...newTask, description: e.target.value })
            }
            className="md:col-span-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 h-24 resize-none"
          />
          <button
            type="submit"
            className="md:col-span-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-500/20"
          >
            Assign Task
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-slate-500" /> Active Tasks
          </h3>
        </div>
        <div className="divide-y divide-slate-100">
          {tasks.length === 0 ? (
            <p className="p-6 text-center text-slate-500 text-sm">
              No tasks assigned yet.
            </p>
          ) : (
            tasks.map((task) => (
              <div
                key={task._id}
                className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {task.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                    {task.description}
                  </p>
                  <div className="flex gap-2 mt-2">
                    {task.studentId && (
                      <Badge variant="blue">Student: {task.studentId}</Badge>
                    )}
                    {task.domain && (
                      <Badge variant="amber">Domain: {task.domain}</Badge>
                    )}
                    {task.deadline && (
                      <Badge variant="slate">
                        Due: {new Date(task.deadline).toLocaleDateString()}
                      </Badge>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteTask(task._id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {assignTasksModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Briefcase className="text-blue-600" size={20} /> Assign Monthly
                Tasks
              </h3>
              <button
                onClick={() =>
                  setAssignTasksModal({
                    isOpen: false,
                    appId: null,
                    duration: 1,
                    tasks: [],
                  })
                }
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <p className="text-sm text-slate-500 mb-4">
                Assign a specific task topic for each month of the internship.
                These will unlock automatically for the student.
              </p>

              {assignTasksModal.tasks.map((task, idx) => (
                <div key={idx}>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Month {idx + 1} Task
                  </label>
                  <input
                    type="text"
                    value={task}
                    onChange={(e) => {
                      const newTasks = [...assignTasksModal.tasks];
                      newTasks[idx] = e.target.value;
                      setAssignTasksModal({
                        ...assignTasksModal,
                        tasks: newTasks,
                      });
                    }}
                    placeholder="e.g. Build a Calculator"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
              ))}
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() =>
                  setAssignTasksModal({
                    isOpen: false,
                    appId: null,
                    duration: 1,
                    tasks: [],
                  })
                }
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignTasksSubmit}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm transition-colors"
              >
                Save Tasks
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const ImpersonateIntern = () => {
    const [impersonateForm, setImpersonateForm] = useState({ email: "" });
    const [impersonating, setImpersonating] = useState(false);

    const handleImpersonate = async (e) => {
      e.preventDefault();
      setImpersonating(true);
      try {
        const token = localStorage.getItem("adminToken");
        const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5004'}/api/admin/impersonate`, {
          email: impersonateForm.email
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data.token) {
          // Set standard student tokens
          localStorage.setItem('studentToken', res.data.token);
          localStorage.setItem('studentData', JSON.stringify(res.data.user));
          
          // Set interview portal fallback tokens
          localStorage.setItem('interviewToken', res.data.token);
          localStorage.setItem('interviewUser', JSON.stringify(res.data.user));
          localStorage.setItem('interviewUserRole', 'intern');
          
          toast.success(`Successfully logged in as ${res.data.user.name}`);
          window.open('/dashboard', '_blank'); // Open intern dashboard in new tab
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Login failed. Check credentials.");
      } finally {
        setImpersonating(false);
      }
    };

    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in max-w-2xl">
        <div className="p-5 border-b border-slate-200 bg-emerald-50/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <LogOut className="w-5 h-5 rotate-180" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Impersonate Intern</h3>
            <p className="text-sm text-slate-500">Login to the student dashboard as any intern using their credentials.</p>
          </div>
        </div>
        <form onSubmit={handleImpersonate} className="p-6 space-y-5 bg-slate-50/50">

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="student@example.com"
              value={impersonateForm.email}
              onChange={e => setImpersonateForm({ ...impersonateForm, email: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-sm"
            />
          </div>
          <button
            type="submit"
            disabled={impersonating || !impersonateForm.email}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all transform hover:-translate-y-0.5"
          >
            {impersonating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Logging in...
              </>
            ) : (
              <>
                <LogOut className="w-5 h-5 rotate-180" />
                Login as Intern
              </>
            )}
          </button>
        </form>
      </div>
    );
  };

  const ActivityTab = () => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-600" /> Real-time Activity Feed
        </h3>
        <button
          onClick={fetchTasksAndLogs}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          Refresh
        </button>
      </div>
      <div className="divide-y divide-slate-100 max-h-[800px] overflow-y-auto p-4">
        {activityLogs.length === 0 ? (
          <p className="text-center text-slate-500 text-sm py-8">
            No recent activity.
          </p>
        ) : (
          activityLogs.map((log) => (
            <div key={log._id} className="py-4 flex gap-4">
              <div
                className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${log.type === "SUBMISSION" ? "bg-green-500" : log.type === "REGISTRATION" ? "bg-blue-500" : log.type === "PAYMENT" ? "bg-amber-500" : "bg-purple-500"}`}
              />
              <div>
                <p className="text-sm text-slate-900">{log.message}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {new Date(log.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Top Navbar */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-slate-900 font-bold text-base leading-tight">Admin Dashboard</h1>
                <p className="text-slate-500 text-xs hidden sm:block">Code-A-Nova Management</p>
              </div>
            </div>
            {/* Main Tab Switcher */}
            <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1">
              <button
                onClick={() => setActiveMainTab("features")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeMainTab === "features"
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Zap className="w-4 h-4" /> Features
              </button>
              <button
                onClick={() => setActiveMainTab("interns")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeMainTab === "interns"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Users className="w-4 h-4" /> Interns
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-600 text-sm font-medium transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-6">
        {/* ─── FEATURES TAB ─── */}
        {activeMainTab === "features" && (
          <div className="w-full flex flex-col md:flex-row gap-6">
            {/* Feature Sidebar */}
            <div className="w-full md:w-64 flex-shrink-0">
              <div className="sticky top-24 bg-white border border-slate-200 rounded-2xl p-3 shadow-sm flex flex-row md:flex-col gap-2 overflow-x-auto">
                <button
                  onClick={() => setActiveFeatureTab("interview")}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all flex-shrink-0 ${activeFeatureTab === "interview" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                >
                  <Activity className="w-4 h-4" /> Interview
                </button>
                <button
                  onClick={() => setActiveFeatureTab("tokens")}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all flex-shrink-0 ${activeFeatureTab === "tokens" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                >
                  <Database className="w-4 h-4" /> Token Management
                </button>
              </div>
            </div>
            {/* Feature Content */}
            <div className="flex-1 min-w-0">
              {activeFeatureTab === "interview" && (
                <div className="animate-fade-in">
                  <div className="mb-6">
                    <h2 className="text-xl font-black text-slate-800">Interview Feature</h2>
                    <p className="text-sm text-slate-500 mt-1">All interview users, their credits, sessions, and feedback.</p>
                  </div>
                  <InterviewAdminPage />
                </div>
              )}
              {activeFeatureTab === "tokens" && (
                <div className="animate-fade-in">
                  <div className="mb-6">
                    <h2 className="text-xl font-black text-slate-800">Token Management</h2>
                    <p className="text-sm text-slate-500 mt-1">Manage global token settings and individual user token balances.</p>
                  </div>
                  <TokenAdminPage />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── INTERNS TAB ─── */}
        {activeMainTab === "interns" && (
          <div className="w-full flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="sticky top-24 bg-white border border-slate-200 rounded-2xl p-3 shadow-sm flex flex-row md:flex-col gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveSidebarTab("interns")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all flex-shrink-0 ${activeSidebarTab === "interns" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              <Users className="w-4 h-4" />
              Interns & Apps
            </button>
            <button
              onClick={() => setActiveSidebarTab("monthly_tasks")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all flex-shrink-0 ${activeSidebarTab === "monthly_tasks" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              <Calendar className="w-4 h-4" />
              Monthly Tasks
            </button>
            <button
              onClick={() => setActiveSidebarTab("summer_projects")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all flex-shrink-0 ${activeSidebarTab === "summer_projects" ? "bg-amber-50 text-amber-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              <BookOpen className="w-4 h-4" />
              Summer Projects
            </button>
            <button
              onClick={() => setActiveSidebarTab("notifications")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all flex-shrink-0 ${activeSidebarTab === "notifications" ? "bg-purple-50 text-purple-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              <Bell size={18} /> Notifications
            </button>
            <button
              onClick={() => setActiveSidebarTab("impersonate")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all flex-shrink-0 ${activeSidebarTab === "impersonate" ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              <LogOut size={18} className="rotate-180" /> Impersonate
            </button>
            <button
              onClick={() => setActiveSidebarTab("submissions")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all flex-shrink-0 ${activeSidebarTab === "submissions" ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              <FileText size={18} /> Submissions & SP
            </button>
            <button
              onClick={() => setActiveSidebarTab("leaderboard")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all flex-shrink-0 ${activeSidebarTab === "leaderboard" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              <Trophy className="w-4 h-4" />
              Leaderboard
            </button>
            <button
              onClick={() => setActiveSidebarTab("recent_paid")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all flex-shrink-0 ${activeSidebarTab === "recent_paid" ? "bg-teal-50 text-teal-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              <CreditCard className="w-4 h-4" />
              Recent Paid
            </button>
            <button
              onClick={() => setActiveSidebarTab("settings")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all flex-shrink-0 ${activeSidebarTab === "settings" ? "bg-rose-50 text-rose-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              <Settings className="w-4 h-4" /> Settings
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          {activeSidebarTab === "interns" && (
            <div className="animate-fade-in">
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <StatCard
                  label="Total Applications"
                  value={filteredApplications.length}
                  icon={FileText}
                  color={{
                    border: "border-blue-500/20",
                    bg: "bg-blue-500/5",
                    label: "text-slate-500",
                    sub: "text-blue-600",
                    iconBg: "bg-blue-500/20",
                    icon: "text-blue-600",
                    glow: "bg-blue-500",
                  }}
                  sub="Filtered results"
                />
                <StatCard
                  label="New Applications"
                  value={newApplications.length}
                  icon={Clock}
                  color={{
                    border: "border-amber-500/20",
                    bg: "bg-amber-500/5",
                    label: "text-slate-500",
                    sub: "text-amber-600",
                    iconBg: "bg-amber-500/20",
                    icon: "text-amber-600",
                    glow: "bg-amber-500",
                  }}
                  sub="Pending export"
                />
                <StatCard
                  label="Processed"
                  value={downloadedApplications.length}
                  icon={CheckCircle}
                  color={{
                    border: "border-green-500/20",
                    bg: "bg-green-500/5",
                    label: "text-slate-500",
                    sub: "text-green-600",
                    iconBg: "bg-green-500/20",
                    icon: "text-green-600",
                    glow: "bg-green-500",
                  }}
                  sub="Downloaded"
                />
                <StatCard
                  label="Paid Interns"
                  value={paidCount}
                  icon={TrendingUp}
                  color={{
                    border: "border-teal-500/20",
                    bg: "bg-teal-500/5",
                    label: "text-slate-500",
                    sub: "text-teal-600",
                    iconBg: "bg-teal-500/20",
                    icon: "text-teal-600",
                    glow: "bg-teal-500",
                  }}
                  sub="Confirmed"
                />
                <StatCard
                  label="Total Revenue"
                  value={`₹${totalRevenue}`}
                  icon={CreditCard}
                  color={{
                    border: "border-purple-500/20",
                    bg: "bg-purple-500/5",
                    label: "text-slate-500",
                    sub: "text-purple-600",
                    iconBg: "bg-purple-500/20",
                    icon: "text-purple-600",
                    glow: "bg-purple-500",
                  }}
                  sub={`Real Payments (${realPayerCount} applicants)`}
                />
              </div>

              <div className="sticky top-16 z-40 bg-white/90 backdrop-blur-xl rounded-2xl border border-slate-200 p-4 mb-6 shadow-sm shadow-slate-200/50">
                <div className="flex flex-col lg:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search by name, email, student ID, or domain..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 text-slate-900 placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="relative min-w-[180px]">
                    <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    <select
                      value={selectedDomain}
                      onChange={(e) => setSelectedDomain(e.target.value)}
                      className="w-full appearance-none pl-10 pr-10 py-2.5 bg-white border border-slate-200 text-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all cursor-pointer"
                    >
                      <option value="">All Domains</option>
                      {domains.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  </div>

                  <div className="flex gap-2 flex-wrap lg:flex-nowrap">
                    <button
                      onClick={handleExport}
                      disabled={exporting || newApplications.length === 0}
                      className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 disabled:from-green-800 disabled:to-green-700 disabled:opacity-40 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-lg shadow-green-500/20 whitespace-nowrap"
                    >
                      {exporting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      Export New
                    </button>
                    <button
                      onClick={handleExportPaid}
                      className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-lg shadow-teal-500/20 whitespace-nowrap"
                    >
                      <Download className="w-4 h-4" />
                      Export Paid
                    </button>
                    <div className="flex-1 lg:flex-none flex gap-1 bg-slate-50 border border-slate-300 rounded-xl p-1 items-center">
                      <select
                        value={exportDuration}
                        onChange={(e) => setExportDuration(e.target.value)}
                        className="bg-transparent text-slate-900 text-xs border-0 focus:ring-0 focus:outline-none px-2 cursor-pointer"
                      >
                        <option
                          value="1"
                          className="bg-slate-50 text-slate-900"
                        >
                          1 Month
                        </option>
                        <option
                          value="2"
                          className="bg-slate-50 text-slate-900"
                        >
                          2 Months
                        </option>
                        <option
                          value="3"
                          className="bg-slate-50 text-slate-900"
                        >
                          3 Months
                        </option>
                      </select>
                      <button
                        onClick={() =>
                          handleExportProjectSubmitted(exportDuration)
                        }
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Export Completed
                      </button>
                    </div>
                    {selectedApplications.length > 0 && (
                      <div className="flex items-center gap-3 w-full lg:w-auto">
                        <button
                          onClick={handleExportSelected}
                          className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-lg shadow-emerald-500/20 whitespace-nowrap animate-fade-in"
                        >
                          <Download className="w-4 h-4" />
                          Export Selected
                        </button>
                        <button
                          onClick={() => setShowBulkActionModal(true)}
                          className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-lg shadow-blue-500/20 whitespace-nowrap animate-fade-in"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Bulk Actions ({selectedApplications.length})
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-slate-900 font-semibold text-sm">
                      Bulk Certificate Upload
                    </h3>
                    <p className="text-slate-500 text-xs mt-0.5">
                      Upload Excel with columns: Certificate_Number,
                      Student_Name, Domain, Start_Date, End_Date, Duration,
                      Student_ID
                    </p>
                  </div>
                  <label
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-all text-sm font-medium whitespace-nowrap flex-shrink-0 ${uploadingExcel ? "border-blue-500/30 bg-blue-500/10 text-blue-600" : "border-slate-300 bg-slate-50/50 text-slate-700 hover:border-blue-500/50 hover:text-blue-600 hover:bg-blue-500/10"}`}
                  >
                    {uploadingExcel ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <FileInput className="w-4 h-4" />
                        <span>Choose Excel File</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept=".xlsx"
                      onChange={handleExcelUpload}
                      className="hidden"
                      disabled={uploadingExcel}
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 mb-6 w-fit">
                <button
                  onClick={() => setActiveTab("new")}
                  className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === "new" ? "bg-slate-200 text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  <Clock className="w-4 h-4" />
                  New Applications
                  {newApplications.length > 0 && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === "new" ? "bg-amber-500/20 text-amber-600" : "bg-slate-200 text-slate-500"}`}
                    >
                      {newApplications.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("downloaded")}
                  className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === "downloaded" ? "bg-slate-200 text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  <CheckCircle className="w-4 h-4" />
                  Processed
                  {downloadedApplications.length > 0 && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === "downloaded" ? "bg-green-500/20 text-green-600" : "bg-slate-200 text-slate-500"}`}
                    >
                      {downloadedApplications.length}
                    </span>
                  )}
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                {displayedApps.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 px-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                      {activeTab === "new" ? (
                        <Clock className="w-8 h-8 text-slate-600" />
                      ) : (
                        <CheckCircle className="w-8 h-8 text-slate-600" />
                      )}
                    </div>
                    <p className="text-slate-900 font-medium text-lg">
                      {activeTab === "new"
                        ? "No new applications"
                        : "No processed applications"}
                    </p>
                    <p className="text-slate-500 text-sm mt-1">
                      {activeTab === "new"
                        ? "All applications have been exported."
                        : "Export new applications to see them here."}
                    </p>
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-300 text-sm transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Clear search
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="hidden lg:block overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-slate-300/60 bg-slate-50">
                            {activeTab === "new" ? (
                              <>
                                <th className="text-left py-3.5 px-4 w-12">
                                  <input 
                                    type="checkbox" 
                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    onChange={(e) => handleSelectAll(e, displayedApps)}
                                    checked={displayedApps.length > 0 && selectedApplications.length === displayedApps.length}
                                  />
                                </th>
                                <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                                  Student ID
                                </th>
                                <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                  Name
                                </th>
                                <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                  Email
                                </th>
                                <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                  Domain
                                </th>
                                <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                  Duration
                                </th>
                                <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                                  Timeline
                                </th>
                                <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                                  Applied At
                                </th>
                                <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                                  Internship Type
                                </th>
                                <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                                  Offer Letter
                                </th>
                                <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                  Payment
                                </th>
                                <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                                  Certificate Sent
                                </th>
                                <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                  Tasks
                                </th>
                              </>
                            ) : (
                              <>
                                <th className="text-left py-3.5 px-4 w-12">
                                  <input 
                                    type="checkbox" 
                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    onChange={(e) => handleSelectAll(e, displayedApps)}
                                    checked={displayedApps.length > 0 && selectedApplications.length === displayedApps.length}
                                  />
                                </th>
                                <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                                  Student ID
                                </th>
                                <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                  Name
                                </th>
                                <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                  Email
                                </th>
                                <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                  Domain
                                </th>
                                <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                  Duration
                                </th>
                                <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                  Batch
                                </th>
                                <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                                  Downloaded At
                                </th>
                                <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                                  Start Date
                                </th>
                                <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                                  End Date
                                </th>
                                <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                  Total Months
                                </th>
                                <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                                  Internship Type
                                </th>
                                <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                                  Offer Letter
                                </th>
                                <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                  Payment
                                </th>
                                <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                                  Certificate Sent
                                </th>
                                <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                  Tasks
                                </th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/30">
                          {displayedApps.map((app, i) => (
                            <tr
                              key={app._id || i}
                              className="hover:bg-slate-200/20 transition-colors duration-150 group"
                            >
                              <td className="py-3.5 px-4 w-12">
                                <input 
                                  type="checkbox" 
                                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                  onChange={() => handleSelectToggle(app._id)}
                                  checked={selectedApplications.includes(app._id)}
                                />
                              </td>
                              <td className="py-3.5 px-4 text-slate-500 text-sm font-mono">
                                {app.studentId || "—"}
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="text-slate-900 font-medium text-sm group-hover:text-blue-300 transition-colors">
                                  {app.name}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-slate-500 text-sm">
                                {app.email}
                              </td>
                              <td className="py-3.5 px-4">
                                <Badge variant="blue">{app.domain}</Badge>
                              </td>
                              <td className="py-3.5 px-4 text-slate-500 text-sm whitespace-nowrap">
                                {app.duration}
                              </td>

                              {activeTab === "new" ? (
                                <>
                                  <td className="py-3.5 px-4">
                                    {app.startDate ? (
                                      <div className="space-y-0.5">
                                        <p className="text-xs text-green-600 whitespace-nowrap">
                                          {new Date(
                                            app.startDate,
                                          ).toLocaleDateString("en-IN")}
                                        </p>
                                        <p className="text-xs text-slate-500 whitespace-nowrap">
                                          {new Date(
                                            app.endDate,
                                          ).toLocaleDateString("en-IN")}
                                        </p>
                                      </div>
                                    ) : (
                                      <div className="relative min-w-[130px]">
                                        <select
                                          onChange={(e) =>
                                            handleStartDateAssignment(
                                              app._id,
                                              e.target.value,
                                            )
                                          }
                                          defaultValue=""
                                          className="w-full appearance-none bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-1.5 text-xs pr-7 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                        >
                                          <option value="" disabled>
                                            Set date...
                                          </option>
                                          {upcomingDateOptions.map(
                                            (opt, idx) => (
                                              <option
                                                key={idx}
                                                value={opt.value}
                                              >
                                                {opt.label}
                                              </option>
                                            ),
                                          )}
                                        </select>
                                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-3.5 px-4 text-slate-500 text-xs whitespace-nowrap">
                                    {new Date(app.appliedAt).toLocaleString(
                                      "en-IN",
                                    )}
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <div className="relative">
                                      <select
                                        value={
                                          app.internshipType ||
                                          app.mode ||
                                          "Normal Intern"
                                        }
                                        onChange={(e) =>
                                          handleInternshipTypeChange(
                                            app._id,
                                            e.target.value,
                                          )
                                        }
                                        className="appearance-none bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-1.5 text-xs pr-7 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                      >
                                        <option value="Normal Intern">
                                          Normal Intern
                                        </option>
                                        <option value="Summer/Winter Intern">
                                          Summer/Winter Intern
                                        </option>
                                      </select>
                                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <div className="relative">
                                      <select
                                        value={
                                          app.offerLetterStatus || "Not Sent"
                                        }
                                        onChange={(e) =>
                                          handleOfferLetterChange(
                                            app._id,
                                            e.target.value,
                                          )
                                        }
                                        className="appearance-none bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-1.5 text-xs pr-7 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                      >
                                        <option value="Not Sent">
                                          Not Sent
                                        </option>
                                        <option value="Sent">Sent</option>
                                      </select>
                                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <div className="relative">
                                      <select
                                        value={app.hasPaid ? "Yes" : "No"}
                                        onChange={() =>
                                          handleTogglePaidStatus(
                                            app._id,
                                            app.hasPaid,
                                          )
                                        }
                                        className="appearance-none bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-1.5 text-xs pr-7 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                      >
                                        <option value="No">No</option>
                                        <option value="Yes">Yes</option>
                                      </select>
                                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <div className="relative">
                                      <select
                                        value={
                                          app.isCertificateSent ? "Yes" : "No"
                                        }
                                        onChange={() =>
                                          handleToggleCertificateSent(
                                            app._id,
                                            app.isCertificateSent,
                                          )
                                        }
                                        className="appearance-none bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-1.5 text-xs pr-7 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                      >
                                        <option value="No">No</option>
                                        <option value="Yes">Yes</option>
                                      </select>
                                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <button
                                      onClick={() =>
                                        setSelectedSubmissionsApp(app)
                                      }
                                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors border border-blue-200"
                                    >
                                      View ({app.submissions?.length || 0}/
                                      {app.duration
                                        ? parseInt(app.duration)
                                        : 1}
                                      )
                                    </button>
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td className="py-3.5 px-4 text-slate-500 text-sm">
                                    {app.batch || "—"}
                                  </td>
                                  <td className="py-3.5 px-4 text-green-600 text-xs whitespace-nowrap">
                                    {new Date(app.downloadedAt).toLocaleString(
                                      "en-IN",
                                    )}
                                  </td>
                                  <td className="py-3.5 px-4">
                                    {app.startDate ? (
                                      <span className="text-slate-700 text-xs whitespace-nowrap">
                                        {new Date(
                                          app.startDate,
                                        ).toLocaleDateString("en-IN")}
                                      </span>
                                    ) : (
                                      <div className="relative min-w-[130px]">
                                        <select
                                          onChange={(e) =>
                                            handleStartDateAssignment(
                                              app._id,
                                              e.target.value,
                                            )
                                          }
                                          defaultValue=""
                                          className="w-full appearance-none bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-1.5 text-xs pr-7 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                        >
                                          <option value="" disabled>
                                            Set date...
                                          </option>
                                          {upcomingDateOptions.map(
                                            (opt, idx) => (
                                              <option
                                                key={idx}
                                                value={opt.value}
                                              >
                                                {opt.label}
                                              </option>
                                            ),
                                          )}
                                        </select>
                                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-3.5 px-4 text-slate-500 text-xs whitespace-nowrap">
                                    {app.endDate
                                      ? new Date(
                                          app.endDate,
                                        ).toLocaleDateString("en-IN")
                                      : "—"}
                                  </td>
                                  <td className="py-3.5 px-4 text-slate-500 text-sm">
                                    {app.totalMonths || "—"}
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <div className="relative">
                                      <select
                                        value={
                                          app.internshipType ||
                                          app.mode ||
                                          "Normal Intern"
                                        }
                                        onChange={(e) =>
                                          handleInternshipTypeChange(
                                            app._id,
                                            e.target.value,
                                          )
                                        }
                                        className="appearance-none bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-1.5 text-xs pr-7 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                      >
                                        <option value="Normal Intern">
                                          Normal Intern
                                        </option>
                                        <option value="Summer/Winter Intern">
                                          Summer/Winter Intern
                                        </option>
                                      </select>
                                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <div className="relative">
                                      <select
                                        value={
                                          app.offerLetterStatus || "Not Sent"
                                        }
                                        onChange={(e) =>
                                          handleOfferLetterChange(
                                            app._id,
                                            e.target.value,
                                          )
                                        }
                                        className="appearance-none bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-1.5 text-xs pr-7 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                      >
                                        <option value="Not Sent">
                                          Not Sent
                                        </option>
                                        <option value="Sent">Sent</option>
                                      </select>
                                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <div className="relative">
                                      <select
                                        value={app.hasPaid ? "Yes" : "No"}
                                        onChange={() =>
                                          handleTogglePaidStatus(
                                            app._id,
                                            app.hasPaid,
                                          )
                                        }
                                        className="appearance-none bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-1.5 text-xs pr-7 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                      >
                                        <option value="No">No</option>
                                        <option value="Yes">Yes</option>
                                      </select>
                                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <div className="relative">
                                      <select
                                        value={
                                          app.isCertificateSent ? "Yes" : "No"
                                        }
                                        onChange={() =>
                                          handleToggleCertificateSent(
                                            app._id,
                                            app.isCertificateSent,
                                          )
                                        }
                                        className="appearance-none bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-1.5 text-xs pr-7 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                      >
                                        <option value="No">No</option>
                                        <option value="Yes">Yes</option>
                                      </select>
                                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <button
                                      onClick={() =>
                                        setSelectedSubmissionsApp(app)
                                      }
                                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors border border-blue-200"
                                    >
                                      View ({app.submissions?.length || 0}/
                                      {app.duration
                                        ? parseInt(app.duration)
                                        : 1}
                                      )
                                    </button>
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
                        <MobileCard
                          key={app._id || i}
                          app={app}
                          isDownloaded={activeTab === "downloaded"}
                        />
                      ))}
                    </div>
                  </>
                )}

                {displayedApps.length > 0 && (
                  <div className="border-t border-slate-200 px-4 py-3 flex items-center justify-between bg-slate-50/20">
                    <p className="text-slate-500 text-xs">
                      Showing{" "}
                      <span className="text-slate-700 font-medium">
                        {displayedApps.length}
                      </span>{" "}
                      {activeTab === "new" ? "new" : "processed"} applications
                    </p>
                    {(searchQuery || selectedDomain) && (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedDomain("");
                        }}
                        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        Clear filters
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          {activeSidebarTab === "monthly_tasks" && (
            <NormalTasksAdmin domains={domains} />
          )}
          {activeSidebarTab === "summer_projects" && (
            <SummerProjectsAdmin applications={applications} refreshApplications={() => fetchApplications(localStorage.getItem("adminToken"))} />
          )}
          {activeSidebarTab === "notifications" && (
            <NotificationsAdmin />
          )}
          {activeSidebarTab === "submissions" && (
            <SubmissionsAdmin />
          )}

          {activeSidebarTab === "recent_paid" && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-teal-500" />
                Recent Payments (Last 7 Days)
              </h2>
              
              {recentPayments.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <CreditCard className="w-12 h-12 mx-auto mb-4 text-slate-300 opacity-50" />
                  <p>No recent payments found in the last 7 days.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="p-4 font-semibold text-slate-600">Student Details</th>
                        <th className="p-4 font-semibold text-slate-600">Amount Paid</th>
                        <th className="p-4 font-semibold text-slate-600">Date</th>
                        <th className="p-4 font-semibold text-slate-600">Payment ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentPayments.map((payment, index) => (
                        <tr key={index} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                          <td className="p-4">
                            <div className="font-medium text-slate-900">{payment.name}</div>
                            <div className="text-sm text-slate-500">{payment.email}</div>
                            <div className="text-xs text-slate-400 mt-1">ID: {payment.studentId} • {payment.internshipType}</div>
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700 border border-green-200">
                              ₹{payment.paymentAmount}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-slate-600">
                            {new Date(payment.paymentDate).toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short', year: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </td>
                          <td className="p-4">
                            <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                              {payment.razorpayPaymentId || 'N/A'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          {activeSidebarTab === "leaderboard" && (() => {
            const isActive = (app) => {
              if (!app.startDate || !app.endDate) return false;
              const now = new Date();
              now.setHours(0, 0, 0, 0);
              const end = new Date(app.endDate);
              return end >= now;
            };
            
            let displayList = applications.filter(app => app.synergyPoints > 0);
            if (leaderboardSubTab === "active") {
              displayList = displayList.filter(isActive);
            }
            displayList.sort((a, b) => (b.synergyPoints || 0) - (a.synergyPoints || 0));

            return (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden m-6">
                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Trophy className="text-indigo-600" /> Synergy Points Leaderboard
                  </h2>
                  <div className="flex bg-slate-200/60 p-1 rounded-xl">
                    <button
                      onClick={() => setLeaderboardSubTab("active")}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                        leaderboardSubTab === "active"
                          ? "bg-white text-indigo-700 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Active Interns
                    </button>
                    <button
                      onClick={() => setLeaderboardSubTab("all")}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                        leaderboardSubTab === "all"
                          ? "bg-white text-indigo-700 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      All Interns
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <th className="p-4 pl-6">Rank</th>
                        <th className="p-4">Intern Details</th>
                        <th className="p-4">Domain</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 pr-6 text-right">Synergy Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {displayList.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="p-12 text-center">
                            <Trophy className="mx-auto text-slate-300 mb-3" size={32} />
                            <p className="text-slate-500 font-medium">No leaderboard data found for this category.</p>
                          </td>
                        </tr>
                      ) : (
                        displayList.map((app, idx) => (
                          <tr key={app._id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 pl-6 font-bold text-slate-700">#{idx + 1}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-sm shadow-sm">
                                  {app.name?.charAt(0) || "U"}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-800">{app.name}</div>
                                  <div className="text-xs font-medium text-slate-500">{app.studentId}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-sm font-semibold text-slate-600">
                              {app.domain}
                            </td>
                            <td className="p-4">
                              {isActive(app) ? (
                                <span className="px-2.5 py-1 rounded-full text-[10px] uppercase font-bold bg-green-100 text-green-700 border border-green-200 tracking-wider">Active</span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-[10px] uppercase font-bold bg-slate-100 text-slate-600 border border-slate-200 tracking-wider">Completed</span>
                              )}
                            </td>
                            <td className="p-4 pr-6 text-right font-black text-indigo-600 text-lg">
                              {app.synergyPoints} <span className="text-xs font-bold text-slate-400">SP</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>

          {/* Settings Tab */}
          {activeSidebarTab === "impersonate" && (
            <div className="w-full">
              <ImpersonateIntern />
            </div>
          )}
          {activeSidebarTab === "settings" && (
            <div className="flex-1 min-w-0 animate-fade-in">
              <div className="mb-6">
                <h2 className="text-xl font-black text-slate-800">Settings</h2>
                <p className="text-sm text-slate-500 mt-1">Manage global site toggles and sync operations.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Registration</p>
                  <p className="text-sm text-slate-600 mb-4">Enable or disable new intern registrations.</p>
                  <button
                    onClick={handleToggleRegistration}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-bold transition-all ${
                      registrationEnabled
                        ? "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 text-emerald-600"
                        : "bg-slate-500/10 hover:bg-slate-500/20 border-slate-500/20 text-slate-500"
                    }`}
                  >
                    <UserPlus className="w-4 h-4" /> Registration: {registrationEnabled ? "ON" : "OFF"}
                  </button>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Leaderboard</p>
                  <p className="text-sm text-slate-600 mb-4">Show or hide the public leaderboard page.</p>
                  <button
                    onClick={handleToggleLeaderboard}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-bold transition-all ${
                      leaderboardEnabled
                        ? "bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20 text-purple-600"
                        : "bg-slate-500/10 hover:bg-slate-500/20 border-slate-500/20 text-slate-500"
                    }`}
                  >
                    <Trophy className="w-4 h-4" /> Leaderboard: {leaderboardEnabled ? "ON" : "OFF"}
                  </button>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Payments</p>
                  <p className="text-sm text-slate-600 mb-4">Enable or disable the payment gateway.</p>
                  <button
                    onClick={handleTogglePayment}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-bold transition-all ${
                      paymentEnabled
                        ? "bg-green-500/10 hover:bg-green-500/20 border-green-500/20 text-green-600"
                        : "bg-slate-500/10 hover:bg-slate-500/20 border-slate-500/20 text-slate-500"
                    }`}
                  >
                    <CreditCard className="w-4 h-4" /> Payments: {paymentEnabled ? "ON" : "OFF"}
                  </button>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sync Refunds</p>
                  <p className="text-sm text-slate-600 mb-4">Sync pending refund statuses from the payment gateway.</p>
                  <button
                    onClick={handleSyncRefunds}
                    disabled={syncingRefunds}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-bold bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20 text-blue-600 transition-all disabled:opacity-50"
                  >
                    {syncingRefunds ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                    Sync Refunds
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        )}
      </div>

      {showBulkActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">
                  Bulk Actions ({selectedApplications.length} Selected)
                </h3>
                <p className="text-sm text-slate-500">
                  Update multiple applications at once
                </p>
              </div>
              <button
                onClick={() => setShowBulkActionModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Internship Type
                </label>
                <select
                  value={bulkActionForm.internshipType}
                  onChange={(e) => setBulkActionForm({...bulkActionForm, internshipType: e.target.value})}
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Leave Unchanged</option>
                  <option value="Normal Intern">Normal Intern</option>
                  <option value="Summer/Winter Intern">Summer/Winter Intern</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Start Date
                </label>
                <select
                  value={bulkActionForm.startDate}
                  onChange={(e) => setBulkActionForm({...bulkActionForm, startDate: e.target.value})}
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Leave Unchanged</option>
                  {upcomingDateOptions.map((opt, idx) => (
                    <option key={idx} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">End date will be calculated automatically based on duration.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Offer Letter Status
                </label>
                <select
                  value={bulkActionForm.offerLetterStatus}
                  onChange={(e) => setBulkActionForm({...bulkActionForm, offerLetterStatus: e.target.value})}
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Leave Unchanged</option>
                  <option value="Not Sent">Not Sent</option>
                  <option value="Sent">Sent</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Payment Status
                </label>
                <select
                  value={bulkActionForm.hasPaid}
                  onChange={(e) => setBulkActionForm({...bulkActionForm, hasPaid: e.target.value})}
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Leave Unchanged</option>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Certificate Sent Status
                </label>
                <select
                  value={bulkActionForm.isCertificateSent}
                  onChange={(e) => setBulkActionForm({...bulkActionForm, isCertificateSent: e.target.value})}
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Leave Unchanged</option>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => setShowBulkActionModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                disabled={bulkUpdating}
              >
                Cancel
              </button>
              <button
                onClick={handleBulkUpdate}
                disabled={bulkUpdating}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {bulkUpdating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Apply Updates
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedSubmissionsApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">
                  Project Submissions
                </h3>
                <p className="text-sm text-slate-500">
                  {selectedSubmissionsApp.name}
                </p>
              </div>
              <button
                onClick={() => setSelectedSubmissionsApp(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {!selectedSubmissionsApp.submissions ||
              selectedSubmissionsApp.submissions.length === 0 ? (
                <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No projects submitted yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedSubmissionsApp.submissions.map((sub, idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-md">
                          Submission Month {sub.month}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(sub.submittedAt).toLocaleDateString(
                            "en-IN",
                          )}
                        </span>
                      </div>
                      
                      {sub.assignments && sub.assignments.length > 0 ? (
                        <div className="space-y-3 mt-3">
                          {sub.assignments.map((assignment, aIdx) => (
                            <div key={aIdx} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                              <div className="flex justify-between items-start mb-1">
                                <h4 className="font-semibold text-sm text-slate-800">{assignment.projectName}</h4>
                                {assignment.aiStatus === 'Accepted' && (
                                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold">AI Accepted (+{assignment.spAwarded || 50} SP)</span>
                                )}
                                {assignment.aiStatus === 'Rejected' && (
                                  <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-bold">AI Rejected</span>
                                )}
                                {(!assignment.aiStatus || assignment.aiStatus === 'Pending') && (
                                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold">Pending</span>
                                )}
                              </div>
                              <a
                                href={assignment.github}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-800 break-all flex items-center gap-1 mb-2"
                              >
                                <ExternalLink size={12} /> {assignment.github}
                              </a>
                              {assignment.aiStatus === 'Rejected' && (
                                <div className="mt-2 text-xs">
                                  <p className="text-red-600 mb-2"><strong>Reason:</strong> {assignment.aiFeedback}</p>
                                  <button 
                                    onClick={() => handleManualAcceptAssignment(sub._id, assignment._id)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors"
                                  >
                                    Manually Accept
                                  </button>
                                </div>
                              )}
                              {assignment.aiStatus === 'Accepted' && assignment.aiFeedback && assignment.aiFeedback !== 'Accepted' && (
                                <p className="text-xs text-emerald-700 mt-1"><strong>Note:</strong> {assignment.aiFeedback}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 italic mt-2">No assignments found in this submission.</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ToastContainer
        theme="dark"
        position="top-right"
        autoClose={3000}
        toastClassName="!bg-slate-100 !border !border-slate-300 !text-slate-900"
        progressClassName="!bg-blue-500"
      />
    </div>
  );
};

export default AdminDashboard;
