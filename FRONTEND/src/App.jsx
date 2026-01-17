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
// import Register from './Components/Register';
// import StudentDashboard from './Components/StudentDashboard';
// import ProtectedRoute from './Components/ProtectedRoute';
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
            <Route path='/project-submission' element={<Project/>}/>
            {/* <Route path="/register" element={<><Register /> <Footer /></>} /> */}
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