import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Download, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';

// Custom hook to convert a dark logo with white background into a transparent white logo
const useTransparentWhiteLogo = (src) => {
  const [dataUrl, setDataUrl] = useState(src);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = src;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // Make light backgrounds transparent, make dark colors white
        if (r > 200 && g > 200 && b > 200) {
          data[i + 3] = 0;
        } else {
          data[i] = 255;
          data[i + 1] = 255;
          data[i + 2] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);
      setDataUrl(canvas.toDataURL('image/png'));
    };
    img.onerror = () => setDataUrl(src);
  }, [src]);

  return dataUrl;
};

const AmbassadorIdCard = forwardRef(({ stats, inline = false }, ref) => {
  const cardRef = useRef(null);
  const containerRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [scale, setScale] = useState(1);
  const logoSrc = useTransparentWhiteLogo("/LOGO.png");

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width } = entry.contentRect;
        if (width < 550) {
          setScale(width / 550);
        } else {
          setScale(1);
        }
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      setDownloading(true);
      
      // Temporarily remove scaling so html2canvas captures the exact 550x350 element
      const originalTransform = cardRef.current.style.transform;
      cardRef.current.style.transform = 'none';
      
      const canvas = await html2canvas(cardRef.current, {
        scale: window.innerWidth < 768 ? 2 : 4,
        useCORS: true,
        backgroundColor: '#0a0f1d',
        logging: false,
        width: 550,
        height: 350,
        windowWidth: 550,
        windowHeight: 350
      });
      
      cardRef.current.style.transform = originalTransform;
      
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, "JPEG", 0, 0, canvas.width, canvas.height, undefined, 'FAST');
      
      const blob = pdf.output('blob');
      const fileName = `CodeANova-Ambassador-${(stats?.ambassadorName || "Card").replace(/\s+/g, '_')}.pdf`;

      // Try Native Web Share API first (highly reliable on mobile iOS/Android)
      const isMobile = window.innerWidth < 1024 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
      if (isMobile && navigator.canShare && navigator.share) {
        const file = new File([blob], fileName, { type: 'application/pdf' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Code-A-Nova Ambassador ID',
            text: 'Here is my Official Code-A-Nova Campus Ambassador ID Card!',
          });
          setDownloading(false);
          return;
        }
      }

      // Fallback for Desktop / browsers without share support
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 150);
    } catch (err) {
      console.error("Error generating ID card PDF:", err);
      alert(`Failed to download ID card. Reason: ${err.message || "Unknown Error"}`);
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
      
      <div ref={containerRef} style={{ width: '100%', maxWidth: '550px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '550px', height: `${350 * scale}px`, position: 'relative' }}>
          
          {/* ─── ACTUAL CARD TO BE DOWNLOADED ─── */}
          <div
            id="printable-id-card"
            ref={cardRef}
            style={{
              width: '550px',
              height: '350px',
              backgroundColor: '#0a0f1d',
              backgroundImage: 'linear-gradient(135deg, #0a0f1d 0%, #111827 100%)',
              borderRadius: '24px',
              position: 'absolute',
              top: 0,
              left: 0,
              overflow: 'hidden',
              border: '1px solid #312e81',
              boxShadow: '0 20px 40px -10px rgba(0,0,0,0.7)',
              fontFamily: 'ui-sans-serif, system-ui, sans-serif',
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          >
            {/* Subtle glow elements */}
            <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '250px', height: '250px', backgroundColor: 'rgba(99,102,241,0.15)', borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none' }}></div>
            <div style={{ position: 'absolute', bottom: '-100px', left: '-100px', width: '200px', height: '200px', backgroundColor: 'rgba(139,92,246,0.15)', borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none' }}></div>

            {/* TOP ROW - Absolutely Positioned */}
            <div style={{ position: 'absolute', top: '25px', left: '30px', right: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <img src={logoSrc} alt="Code-A-Nova" crossOrigin="anonymous" style={{ height: '80px', objectFit: 'contain' }} />
              </div>
              <div style={{ textAlign: 'right', paddingTop: '10px' }}>
                <div style={{ color: '#818cf8', fontWeight: 900, fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                  Official
                </div>
                <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '14px', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '4px' }}>
                  Ambassador
                </div>
              </div>
            </div>

            {/* MIDDLE ROW - Absolutely Positioned */}
            <div style={{ position: 'absolute', top: '125px', left: '30px', right: '30px', zIndex: 10 }}>
              <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>
                Campus Lead
              </div>
              <div style={{ color: '#ffffff', fontSize: '40px', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '8px', lineHeight: 1.2 }}>
                {name}
              </div>
              <div style={{ color: '#c7d2fe', fontSize: '14px', fontWeight: 500, textTransform: 'uppercase', maxWidth: '90%', lineHeight: 1.4 }}>
                {college}
              </div>
            </div>

            {/* BOTTOM ROW - Absolutely Positioned */}
            <div style={{ position: 'absolute', bottom: '25px', left: '30px', right: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 10, paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div>
                <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
                  ID Number
                </div>
                <div style={{ color: '#cbd5e1', fontSize: '14px', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.05em' }}>
                  {idCode}
                </div>
              </div>
              <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ padding: '8px 12px', backgroundColor: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: '8px', color: '#818cf8', fontSize: '12px', fontWeight: 800, letterSpacing: '0.1em' }}>
                  VERIFIED
                </div>
                <div>
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
        </div>
      </div>

      {/* ─── DOWNLOAD BUTTON ─── */}
      {inline && (
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="mt-6 flex items-center justify-center gap-2 w-full max-w-[550px] px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-70"
        >
          {downloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
          {downloading ? "Generating PDF..." : "Download Official ID Card (PDF)"}
        </button>
      )}

    </div>
  );
});

export default AmbassadorIdCard;
