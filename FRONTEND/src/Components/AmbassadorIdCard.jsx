import React, { useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Download, Loader2, Printer } from 'lucide-react';

const AmbassadorIdCard = forwardRef(({ stats, inline = false }, ref) => {
  const cardRef = useRef(null);

  const handleDownload = () => {
    window.print();
  };

  useImperativeHandle(ref, () => ({
    triggerDownload: handleDownload
  }));

  const name = stats?.ambassadorName || "Code A Nova Ambassador";
  const college = stats?.ambassadorCollege || "Campus Network";
  const idCode = stats?.ambassadorCode || "CAN-CA-PENDING";

  return (
    <div className={`flex flex-col items-center justify-center w-full ${inline ? 'my-4' : ''}`}>
      <style>
        {`
          @media print {
            @page {
              size: auto;
              margin: 0mm;
            }
            html, body, #root {
              height: 100vh !important;
              overflow: hidden !important;
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
            }
            body * {
              visibility: hidden;
            }
            #printable-id-card, #printable-id-card * {
              visibility: visible;
            }
            #printable-id-card {
              position: absolute;
              left: 50%;
              top: 50%;
              transform: translate(-50%, -50%) !important;
              width: 550px !important;
              aspect-ratio: 1.6 / 1 !important;
              margin: 0;
              padding: 0;
              box-shadow: none !important;
              border: none !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            button {
              display: none !important;
            }
          }
        `}
      </style>

      {/* ─── ACTUAL CARD TO BE DOWNLOADED ─── */}
      <div
        id="printable-id-card"
        ref={cardRef}
        style={{
          width: '100%',
          maxWidth: '550px',
          aspectRatio: '1.6 / 1',
          backgroundColor: '#0a0f1d',
          backgroundImage: 'linear-gradient(135deg, #0a0f1d 0%, #111827 100%)',
          borderRadius: '1.5rem',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '2.5rem',
          border: '1px solid #312e81',
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.7)',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif'
        }}
      >
        {/* Subtle glow elements */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: '250px', height: '250px', backgroundColor: 'rgba(99,102,241,0.15)', filter: 'blur(60px)', borderRadius: '50%', transform: 'translate(50%, -50%)', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '200px', height: '200px', backgroundColor: 'rgba(139,92,246,0.15)', filter: 'blur(60px)', borderRadius: '50%', transform: 'translate(-50%, 50%)', pointerEvents: 'none' }}></div>

        {/* TOP ROW */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img src="/LOGO.png" alt="Code-A-Nova" crossOrigin="anonymous" style={{ height: '6.5rem', objectFit: 'contain', filter: 'brightness(0) invert(1)', mixBlendMode: 'screen' }} />
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#818cf8', fontWeight: 900, fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              Official
            </div>
            <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.875rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '0.25rem' }}>
              Ambassador
            </div>
          </div>
        </div>

        {/* MIDDLE ROW */}
        <div style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Campus Lead
          </div>
          <div style={{ color: '#ffffff', fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '0.5rem', lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {name}
          </div>
          <div style={{ color: '#c7d2fe', fontSize: '0.875rem', fontWeight: 500, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '90%' }}>
            {college}
          </div>
        </div>

        {/* BOTTOM ROW */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', position: 'relative', zIndex: 10, marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div>
            <div style={{ color: '#64748b', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              ID Number
            </div>
            <div style={{ color: '#cbd5e1', fontSize: '0.875rem', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.05em' }}>
              {idCode}
            </div>
          </div>
          <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: '0.5rem', color: '#818cf8', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em' }}>
              CAN-VERIFIED
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                Valid Thru
              </div>
              <div style={{ color: '#cbd5e1', fontSize: '0.875rem', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.05em' }}>
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
          className="mt-6 flex items-center justify-center gap-2 w-full max-w-[550px] px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all hover:-translate-y-0.5"
        >
          <Printer className="w-5 h-5" />
          Print ID Card (Save as PDF)
        </button>
      )}

    </div>
  );
});

export default AmbassadorIdCard;
