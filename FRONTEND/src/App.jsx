import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Pages/Home';
import Contact from './Pages/Contact';
import About from './Pages/About';
import Service from './Pages/Services';
import Navbar from './Pages/Navbar';
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
function App() {
  return (
    <Router>
        <Navbar />
          <Routes>
            <Route path="/" element={ <Home /> }/>
            <Route path="/about" element={  <>  <About /> <Footer />  </>  } />
            <Route  path="/contact" element={ <>  <Contact /> <Footer />  </> } />
            <Route path="/service"element={<> <Service /> <Footer /></>}/>
            <Route path="/registration" element={<Registration />}/>
            <Route path="/student-login" element={<StudentLogin />}/>
            <Route path="/setup-password" element={<SetupPassword />}/>
            <Route path="/student-dashboard" element={<StudentDashboard />}/>
            <Route path='/project-submission' element={<Project/>}/>
            <Route path="/resume-builder" element={<><ResumeEmbed /></>} />
            <Route path="/privacy-policy" element={<Privacy />} />
            <Route path="/refund-policy" element={<Refund />} />
            <Route path="/terms" element={<Term />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/verify" element={<Verify />} />
          </Routes>
    </Router>
  );
}
export default App;