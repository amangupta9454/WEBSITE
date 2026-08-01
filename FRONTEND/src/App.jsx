import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
} from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import Home from "./Pages/Home";
import Contact from "./Pages/Contact";
import About from "./Pages/About";
import Service from "./Pages/Services";
import ServiceDetails from "./Pages/ServiceDetails";
import Projects from "./Pages/Projects";
import Industries from "./Pages/Industries";
import IndustryDetail from "./Pages/IndustryDetail";
import Privacy from "./Pages/Privacy";
import Term from "./Pages/Term";
import Refund from "./Pages/Refund";
import UnifiedDashboard from "./Pages/UnifiedDashboard";
import MyResumes from "./Pages/MyResumes";
import MyInterviews from "./Pages/MyInterviews";
import MyProfile from "./Pages/MyProfile";
import ResumeBuilder from "./Pages/ResumeBuilder/ResumeBuilder";
import Jobs from "./Pages/Jobs";
import JobDetail from "./Pages/JobDetail";
import SavedJobs from "./Pages/SavedJobs";
import Registration from "./Components/Registration";
import SetupPassword from "./Components/SetupPassword";
import StudentDashboard from "./Components/StudentDashboard";
import AdminLogin from "./Components/AdminLogin";
import AdminDashboard from "./Components/AdminDashboard";
import Verify from "./Components/Verify";
import Project from "./Components/Project";
import Leaderboard from "./Components/Leaderboard";
import MainLayout from "./layouts/MainLayout";
import InterviewLogin from "./Pages/InterviewPortal/InterviewLogin";
import InterviewDashboard from "./Pages/InterviewPortal/InterviewDashboard";
import InterviewSetup from "./Pages/InterviewPortal/InterviewSetup";
import InterviewActive from "./Pages/InterviewPortal/InterviewActive";
import PanelInterviewActive from "./Pages/InterviewPortal/PanelInterviewActive";
import FeatureBanner from "./Components/FeatureBanner";
import ProtectedRoute from "./Components/ProtectedRoute";
import { InterviewConfigProvider } from "./context/InterviewConfigContext";
import CampusAmbassadorApply from "./Pages/CampusAmbassadorApply";
import StudentExperiencePlatform from "./Pages/AssessmentPortal/StudentExperiencePlatform";
import PublicVerificationPage from "./Admin/Assessment/PublicVerificationPage";

import ReferralTracker from "./Components/ReferralTracker";

const UnifiedLayout = () => (
  <MainLayout>
    <Outlet />
  </MainLayout>
);

function App() {
  return (
    <Router>
      <ReferralTracker />
      <Toaster position="top-right" containerStyle={{ top: 80 }} />
      <FeatureBanner />
      <InterviewConfigProvider>
        <Routes>
          {/* New Marketing Pages (Navbar & Footer handled by MainLayout internally) */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/services" element={<Service />} />
          <Route path="/service/:id" element={<ServiceDetails />} />
          <Route path="/industries" element={<Industries />} />
          <Route path="/industries/:slug" element={<IndustryDetail />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/saved-jobs" element={
            <ProtectedRoute>
              <SavedJobs />
            </ProtectedRoute>
          } />
          <Route
            path="/registration"
            element={
              <MainLayout>
                <Registration />
              </MainLayout>
            }
          />
          <Route
            path="/internship"
            element={
              <MainLayout>
                <Registration />
              </MainLayout>
            }
          />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route
            path="/campus-ambassador"
            element={
              <MainLayout>
                <CampusAmbassadorApply />
              </MainLayout>
            }
          />
          <Route path="/privacy-policy" element={<Privacy />} />
          <Route path="/refund-policy" element={<Refund />} />
          <Route path="/terms" element={<Term />} />

          {/* Admin Pages (No site navbar/footer — they have their own header) */}
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />

          {/* InterviewActive needs full screen, so it doesn't get UnifiedLayout */}
          <Route path="/interview-active/:sessionId" element={<InterviewActive />} />
          <Route path="/panel-interview-active/:sessionId" element={<PanelInterviewActive />} />
          
          {/* Standalone full-screen pages without standard website navbar */}
          <Route path="/resume-builder/:id" element={<ResumeBuilder />} />
          <Route path="/verify/:certificateId" element={<PublicVerificationPage />} />

          {/* Old Legacy Functional Pages, Interview Portal, and Assessment Module */}
          <Route element={<UnifiedLayout />}>
            {/* Phase 12 Student Assessment Platform (Integrated natively) */}
            <Route path="/student-assessment" element={<StudentExperiencePlatform />} />
            <Route path="/student-portal" element={<StudentExperiencePlatform />} />
            <Route path="/student/dashboard/assessment" element={<StudentExperiencePlatform />} />

            {/* Interview Portal Routes */}
            <Route path="/student-login" element={<InterviewLogin />} />
            <Route path="/dashboard" element={<UnifiedDashboard />} />
            <Route path="/profile" element={<MyProfile />} />
            <Route path="/interview-setup" element={<InterviewSetup />} />
            <Route path="/setup-password" element={<SetupPassword />} />
            <Route path="/project-submission" element={<Project />} />
            <Route path="/my-resumes" element={<ProtectedRoute><MyResumes /></ProtectedRoute>} />
            <Route path="/my-interviews" element={<ProtectedRoute><MyInterviews /></ProtectedRoute>} />
            <Route path="/verify" element={<Verify />} />
          </Route>
        </Routes>
      </InterviewConfigProvider>
    </Router>
  );
}
export default App;
