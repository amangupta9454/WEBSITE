import React, { useRef, useState } from 'react';
import { Download, GraduationCap, Shield, Users, Globe, User, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';

const AmbassadorIdCard = ({ stats }) => {
  const cardRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      setDownloading(true);
      const canvas = await html2canvas(cardRef.current, {
        scale: 3, // High resolution
        useCORS: true,
        backgroundColor: null,
      });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `CodeANova-Ambassador-${stats.ambassadorName || "Card"}.png`;
      link.click();
    } catch (err) {
      console.error("Error generating ID card:", err);
      alert("Failed to download ID card. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const name = stats?.ambassadorName || "Code A Nova Ambassador";
  const college = stats?.ambassadorCollege || "Campus Network";
  const idCode = stats?.ambassadorCode || "CAN-CA-PENDING";

  return (
    <div className="flex flex-col items-center justify-center w-full my-8 animate-fade-in">
      
      {/* ─── ACTUAL CARD TO BE DOWNLOADED ─── */}
      <div 
        ref={cardRef} 
        className="relative overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] w-full max-w-[550px] aspect-[1.6/1] shadow-2xl bg-gradient-to-br from-[#1c1c1e] to-[#0f0f11] flex flex-col justify-between p-6 sm:p-10 border border-slate-800/50"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 60px -15px rgba(249, 115, 22, 0.15)',
        }}
      >
        {/* Subtle orange glow in bottom right corner */}
        <div className="absolute -bottom-20 -right-20 w-48 h-48 sm:w-64 sm:h-64 bg-orange-500/20 blur-[60px] sm:blur-[80px] rounded-full pointer-events-none"></div>
        {/* Subtle top-left glare */}
        <div className="absolute -top-32 -left-32 w-64 h-64 sm:w-80 sm:h-80 bg-white/5 blur-[80px] sm:blur-[100px] rounded-full pointer-events-none"></div>

        {/* TOP ROW */}
        <div className="flex justify-between items-start w-full relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white flex items-center justify-center">
              <span className="text-black font-black text-[10px] sm:text-xs tracking-tighter">CN</span>
            </div>
            <span className="text-white font-black text-lg sm:text-xl tracking-wider uppercase font-sans" style={{ fontFamily: 'Impact, sans-serif' }}>CODE A NOVA</span>
          </div>
          <div className="text-orange-500 font-bold text-[10px] sm:text-sm tracking-[0.2em] sm:tracking-[0.25em] uppercase mt-1">
            AMBASSADOR
          </div>
        </div>

        {/* MIDDLE ROW */}
        <div className="relative z-10 mt-4 sm:mt-6">
          <div className="text-slate-500 text-[10px] sm:text-xs font-semibold tracking-[0.15em] sm:tracking-[0.2em] uppercase mb-1">
            CAMPUS LEAD
          </div>
          <div className="text-white text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-1 sm:mb-2 leading-none line-clamp-1">
            {name}
          </div>
          <div className="text-slate-400 text-xs sm:text-sm font-medium tracking-wide uppercase line-clamp-1">
            {college}
          </div>
        </div>

        {/* BOTTOM ROW */}
        <div className="flex justify-between items-end w-full relative z-10 mt-auto pt-4">
          <div>
            <div className="text-slate-500 text-[9px] sm:text-[10px] font-semibold tracking-[0.15em] sm:tracking-[0.2em] uppercase mb-0.5 sm:mb-1">
              ID NUMBER
            </div>
            <div className="text-slate-300 text-xs sm:text-sm font-mono tracking-widest">
              {idCode}
            </div>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl border border-orange-500/50 flex items-center justify-center bg-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.2)]">
            <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
          </div>
        </div>
      </div>

      {/* ─── DOWNLOAD BUTTON ─── */}
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="mt-8 flex items-center justify-center gap-2 w-full max-w-[550px] px-8 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/30 transition-all hover:-translate-y-1 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0"
      >
        {downloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
        {downloading ? "Generating High-Res Image..." : "Download Official ID Card"}
      </button>

      {/* ─── FOOTER FEATURES SECTION (Not included in download) ─── */}
      <div className="w-full max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mt-12 pt-8 border-t border-slate-200">
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
          <User className="w-6 h-6 text-orange-500 mb-2 sm:mb-3" />
          <h4 className="text-orange-500 text-[10px] sm:text-xs font-bold tracking-wider uppercase mb-1">CAMPUS LEAD</h4>
          <p className="text-slate-500 text-[10px] sm:text-xs leading-relaxed">Leading initiatives.<br/>Inspiring change.</p>
        </div>
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
          <Shield className="w-6 h-6 text-orange-500 mb-2 sm:mb-3" />
          <h4 className="text-orange-500 text-[10px] sm:text-xs font-bold tracking-wider uppercase mb-1">AMBASSADOR</h4>
          <p className="text-slate-500 text-[10px] sm:text-xs leading-relaxed">Representing Code-A-Nova<br/>with pride and purpose.</p>
        </div>
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
          <GraduationCap className="w-6 h-6 text-orange-500 mb-2 sm:mb-3" />
          <h4 className="text-orange-500 text-[10px] sm:text-xs font-bold tracking-wider uppercase mb-1">LEADERSHIP</h4>
          <p className="text-slate-500 text-[10px] sm:text-xs leading-relaxed">Empowering voices.<br/>Creating impact.</p>
        </div>
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
          <Globe className="w-6 h-6 text-orange-500 mb-2 sm:mb-3" />
          <h4 className="text-orange-500 text-[10px] sm:text-xs font-bold tracking-wider uppercase mb-1">COMMUNITY</h4>
          <p className="text-slate-500 text-[10px] sm:text-xs leading-relaxed">Building connections.<br/>Driving growth together.</p>
        </div>
      </div>
    </div>
  );
};

export default AmbassadorIdCard;
