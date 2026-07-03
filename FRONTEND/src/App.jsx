import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
} from "react-router-dom";
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
import ResumeEmbed from "./Pages/ResumeEmbed";
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
import FeatureBanner from "./Components/FeatureBanner";

const UnifiedLayout = () => (
  <MainLayout>
    <Outlet />
  </MainLayout>
);

function App() {
  return (
    <Router>
      <FeatureBanner />
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
        <Route path="/privacy-policy" element={<Privacy />} />
        <Route path="/refund-policy" element={<Refund />} />
        <Route path="/terms" element={<Term />} />

        {/* Admin Pages (No site navbar/footer — they have their own header) */}
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />

        {/* InterviewActive needs full screen, so it doesn't get UnifiedLayout */}
        <Route path="/interview-active/:sessionId" element={<InterviewActive />} />

        {/* Old Legacy Functional Pages and Interview Portal */}
        <Route element={<UnifiedLayout />}>
          {/* Interview Portal Routes */}
          <Route path="/student-login" element={<InterviewLogin />} />
          <Route path="/dashboard" element={<UnifiedDashboard />} />
          <Route path="/interview-setup" element={<InterviewSetup />} />
          <Route path="/setup-password" element={<SetupPassword />} />
          <Route path="/project-submission" element={<Project />} />
          <Route path="/resume-builder" element={<ResumeEmbed />} />
          <Route path="/verify" element={<Verify />} />
        </Route>
      </Routes>
    </Router>
  );
}
export default App;
