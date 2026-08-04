import React, { useRef, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';

const AmbassadorIdCard = ({ stats, inline = false }) => {
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
    <div className={`flex flex-col items-center justify-center w-full ${inline ? 'my-8 animate-fade-in' : ''}`}>
      
      {/* ─── ACTUAL CARD TO BE DOWNLOADED ─── */}
      <div 
        ref={cardRef} 
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl w-full max-w-[500px] aspect-[1.6/1] bg-[#0a0f1d] flex flex-col justify-between p-6 sm:p-8 border border-indigo-500/20"
        style={{
          boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.7), 0 0 40px -10px rgba(99, 102, 241, 0.2)',
          backgroundImage: 'linear-gradient(135deg, #0a0f1d 0%, #111827 100%)'
        }}
      >
        {/* Subtle glow elements using standard hex/rgba */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[rgba(99,102,241,0.1)] blur-[60px] rounded-full pointer-events-none transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[rgba(139,92,246,0.1)] blur-[60px] rounded-full pointer-events-none transform -translate-x-1/2 translate-y-1/2"></div>

        {/* TOP ROW */}
        <div className="flex justify-between items-start w-full relative z-10">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <img src="/LOGO.png" alt="Code-A-Nova Logo" className="h-6 sm:h-8 object-contain" style={{ filter: 'brightness(0) invert(1)' }} crossOrigin="anonymous" />
            </div>
          </div>
          <div className="text-right">
            <div className="text-indigo-400 font-black text-[10px] sm:text-xs tracking-[0.2em] uppercase">
              Official
            </div>
            <div className="text-white font-bold text-xs sm:text-sm tracking-[0.1em] uppercase mt-0.5">
              Ambassador
            </div>
          </div>
        </div>

        {/* MIDDLE ROW */}
        <div className="relative z-10 mt-6">
          <div className="text-slate-400 text-[10px] sm:text-xs font-semibold tracking-wider uppercase mb-1">
            Campus Lead
          </div>
          <div className="text-white text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-1 sm:mb-2 leading-none truncate">
            {name}
          </div>
          <div className="text-indigo-200/80 text-[10px] sm:text-xs font-medium uppercase truncate max-w-[90%]">
            {college}
          </div>
        </div>

        {/* BOTTOM ROW */}
        <div className="flex justify-between items-end w-full relative z-10 mt-auto pt-4 border-t border-white/5">
          <div>
            <div className="text-slate-500 text-[9px] sm:text-[10px] font-bold tracking-widest uppercase mb-0.5">
              ID Number
            </div>
            <div className="text-slate-300 text-xs sm:text-sm font-mono tracking-wider font-bold">
              {idCode}
            </div>
          </div>
          <div className="text-right">
            <div className="text-slate-500 text-[9px] sm:text-[10px] font-bold tracking-widest uppercase mb-0.5">
              Valid Thru
            </div>
            <div className="text-slate-300 text-xs sm:text-sm font-mono font-bold tracking-wider">
              2026
            </div>
          </div>
        </div>
      </div>

      {/* ─── DOWNLOAD BUTTON (Only if inline) ─── */}
      {inline && (
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="mt-6 flex items-center justify-center gap-2 w-full max-w-[500px] px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-70"
        >
          {downloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
          {downloading ? "Generating..." : "Download Official ID Card"}
        </button>
      )}
    </div>
  );
};

export default AmbassadorIdCard;
