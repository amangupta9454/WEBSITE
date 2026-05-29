import React from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Home, Cpu, FolderKanban, Info, MessageSquare } from 'lucide-react';
import Navbar from '../Components/Navbar';
import Footer from '../Components/Footer';
import Dock from '../Components/Dock';
import FloatingLines from '../Components/FloatingLines';

const MainLayout = ({ children, showNavbar = true }) => {
  const { scrollYProgress } = useScroll();
  const navigate = useNavigate();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const dockItems = [
    { icon: <Home size={20} />, label: 'Home', onClick: () => navigate('/') },
    { icon: <Cpu size={20} />, label: 'Services', onClick: () => navigate('/services') },
    { icon: <FolderKanban size={20} />, label: 'Projects', onClick: () => navigate('/projects') },
    { icon: <Info size={20} />, label: 'About', onClick: () => navigate('/about') },
    { icon: <MessageSquare size={20} />, label: 'Contact', onClick: () => navigate('/contact') }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FBF9] text-zinc-900 font-sans selection:bg-brand-emerald/10 overflow-x-hidden relative">
      {/* Global Interactive WebGL Background */}
      <div className="fixed inset-0 w-full h-full pointer-events-none z-[2] overflow-hidden opacity-[0.45]">
        <FloatingLines 
          enabledWaves={['top', 'middle', 'bottom']}
          lineCount={[8, 12, 16]}
          lineDistance={[6, 5, 4]}
          bendRadius={8.0}
          bendStrength={-0.4}
          interactive={true}
          parallax={true}
          parallaxStrength={0.12}
          linesGradient={['#A8DAB5', '#34D399', '#10B981']}
          mixBlendMode="normal"
        />
      </div>

      <motion.div
        className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand-emerald to-brand-mint origin-left z-50 animate-pulse"
        style={{ scaleX }}
      />
      {showNavbar && <Navbar />}
      <main className="flex-grow relative z-10">
        {children}
      </main>
      <Footer />
      <Dock items={dockItems} panelHeight={64} baseItemSize={48} magnification={64} />
    </div>
  );
};

export default MainLayout;
