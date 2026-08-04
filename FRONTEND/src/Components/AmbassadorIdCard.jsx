import React, { useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Download, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const AmbassadorIdCard = forwardRef(({ stats, inline = false }, ref) => {
  const cardRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      setDownloading(true);
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#0a0f1d',
      });
      const imgData = canvas.toDataURL("image/png");
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [560, 350]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, 560, 350);
      pdf.save(`CodeANova-Ambassador-${stats?.ambassadorName || "Card"}.pdf`);
    } catch (err) {
      console.error("Error generating ID card:", err);
      alert("Failed to download ID card. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    triggerDownload: handleDownload
  }));

  const name = stats?.ambassadorName || "Code A Nova Ambassador";
  const college = stats?.ambassadorCollege || "Campus Network";
  const idCode = stats?.ambassadorCode || "CAN-CA-PENDING";

  return (
    <div className={`flex flex-col items-center justify-center w-full ${inline ? 'my-4' : ''}`}>

      {/* ─── ACTUAL CARD TO BE DOWNLOADED ─── */}
      <div
        ref={cardRef}
        style={{
          width: '560px',
          height: '350px',
          backgroundColor: '#0a0f1d',
          backgroundImage: 'linear-gradient(135deg, #0a0f1d 0%, #111827 100%)',
          borderRadius: '1.5rem',
          position: 'relative',
          overflow: 'hidden',
          display: 'block', // use block with absolute children
          border: '1px solid #312e81',
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.7)',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif'
        }}
      >
        {/* Subtle glow elements */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: '250px', height: '250px', backgroundColor: 'rgba(99,102,241,0.15)', filter: 'blur(60px)', borderRadius: '50%', transform: 'translate(50%, -50%)', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '200px', height: '200px', backgroundColor: 'rgba(139,92,246,0.15)', filter: 'blur(60px)', borderRadius: '50%', transform: 'translate(-50%, 50%)', pointerEvents: 'none' }}></div>

        {/* TOP ROW */}
        <div style={{ position: 'absolute', top: '40px', left: '40px', right: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/LOGO.png" alt="Code-A-Nova" crossOrigin="anonymous" style={{ height: '70px', objectFit: 'contain', filter: 'brightness(0) invert(1)', mixBlendMode: 'screen' }} />
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#818cf8', fontWeight: 900, fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              Official
            </div>
            <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '14px', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '4px' }}>
              Ambassador
            </div>
          </div>
        </div>

        {/* MIDDLE ROW */}
        <div style={{ position: 'absolute', top: '150px', left: '40px', right: '40px', zIndex: 10 }}>
          <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>
            Campus Lead
          </div>
          <div style={{ color: '#ffffff', fontSize: '40px', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '8px', lineHeight: 1.2, paddingBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {name}
          </div>
          <div style={{ color: '#c7d2fe', fontSize: '14px', fontWeight: 500, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '90%' }}>
            {college}
          </div>
        </div>

        {/* BOTTOM ROW */}
        <div style={{ position: 'absolute', bottom: '40px', left: '40px', right: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 10, paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div>
            <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
              ID Number
            </div>
            <div style={{ color: '#cbd5e1', fontSize: '14px', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.05em' }}>
              {idCode}
            </div>
          </div>
          <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '6px 12px', backgroundColor: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: '8px', color: '#818cf8', fontSize: '11px', fontWeight: 800, letterSpacing: '0.1em', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
              CAN-VERIFIED
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
                Valid Thru
              </div>
              <div style={{ color: '#cbd5e1', fontSize: '14px', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.05em' }}>
                2026
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── DOWNLOAD BUTTON (Only if inline) ─── */}
      {inline && (
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="mt-6 flex items-center justify-center gap-2 w-full max-w-[550px] px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-70"
        >
          {downloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
          {downloading ? "Generating PNG..." : "Download Official ID Card"}
        </button>
      )}

    </div>
  );
});

export default AmbassadorIdCard;
