import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Home from './Pages/Home';
import Contact from './Pages/Contact';
import About from './Pages/About';
import Service from './Pages/Services';
import Projects from './Pages/Projects';
import Industries from './Pages/Industries';
import OldNavbar from './Pages/Navbar';
import Privacy from './Pages/Privacy';
import Term from './Pages/Term';
import Footer from './Pages/Footer';
import Refund from './Pages/Refund';
import ResumeEmbed from './Pages/ResumeEmbed';
import Registration from './Components/Registration';
import StudentLogin from './Components/StudentLogin';
import SetupPassword from './Components/SetupPassword';
import StudentDashboard from './Components/StudentDashboard';
import AdminLogin from './Components/AdminLogin';
import AdminDashboard from './Components/AdminDashboard';
import Verify from './Components/Verify';
import Project from './Components/Project';
import MainLayout from './layouts/MainLayout';

const UnifiedLayout = () => (
  <MainLayout>
    <Outlet />
  </MainLayout>
);

function App() {
  return (
    <Router>
      <Routes>
        {/* New Marketing Pages (Navbar & Footer handled by MainLayout internally) */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/services" element={<Service />} />
        <Route path="/industries" element={<Industries />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/registration" element={<MainLayout><Registration /></MainLayout>} />
        <Route path="/internship" element={<MainLayout><Registration /></MainLayout>} />
        <Route path="/privacy-policy" element={<Privacy />} />
        <Route path="/refund-policy" element={<Refund />} />
        <Route path="/terms" element={<Term />} />

        {/* Admin Pages (No site navbar/footer — they have their own header) */}
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />

        {/* Old Legacy Functional Pages */}
        <Route element={<UnifiedLayout />}>
          <Route path="/student-login" element={<StudentLogin />} />
          <Route path="/setup-password" element={<SetupPassword />} />
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          <Route path="/project-submission" element={<Project />} />
          <Route path="/resume-builder" element={<ResumeEmbed />} />
          <Route path="/verify" element={<Verify />} />
        </Route>
      </Routes>
    </Router>
  );
}
export default App;