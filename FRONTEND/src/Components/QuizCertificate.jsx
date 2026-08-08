import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import html2canvas from 'html2canvas';
import logo from '../assets/logo.png';
import jsPDF from 'jspdf';

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

const QuizCertificate = forwardRef(({ applicant, quizData }, ref) => {
  const cardRef = useRef(null);
  const logoSrc = useTransparentWhiteLogo("/LOGO.png");

  const generateCanvas = async () => {
    if (!cardRef.current) return null;
    
    // Temporarily remove scaling if any
    const originalTransform = cardRef.current.style.transform;
    cardRef.current.style.transform = 'none';
    
    const canvas = await html2canvas(cardRef.current, {
      scale: 3,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: 800,
      height: 600,
      windowWidth: 800,
      windowHeight: 600
    });
    
    cardRef.current.style.transform = originalTransform;
    return canvas;
  };

  const handleDownload = async () => {
    try {
      const canvas = await generateCanvas();
      if (!canvas) return;

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [800, 600]
      });
      
      pdf.addImage(imgData, "JPEG", 0, 0, 800, 600, undefined, 'FAST');
      
      const blob = pdf.output('blob');
      const fileName = `Certificate_${(applicant?.name || "Participant").replace(/\\s+/g, '_')}_${(quizData?.quizName || "Quiz").replace(/\\s+/g, '_')}.pdf`;

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
      console.error("Error generating certificate PDF:", err);
      alert(`Failed to download certificate. Reason: ${err.message}`);
    }
  };

  const getBase64 = async () => {
    try {
      const canvas = await generateCanvas();
      if (!canvas) return null;
      // return as jpeg data URL
      return canvas.toDataURL("image/jpeg", 0.9);
    } catch (err) {
      console.error("Error generating certificate base64:", err);
      return null;
    }
  };

  useImperativeHandle(ref, () => ({
    triggerDownload: handleDownload,
    getBase64: getBase64
  }));

  const name = applicant?.name || "Participant Name";
  const quizName = quizData?.quizName || "Quiz Name";
  const score = quizData?.score !== "N/A" ? quizData?.score : null;
  const totalScore = quizData?.totalScore !== "N/A" ? quizData?.totalScore : null;
  const percentage = quizData?.percentage !== "N/A" ? quizData?.percentage : null;
  const result = quizData?.result || "N/A";
  
  let isWinner = false;
  if (result.match(/1st|2nd|3rd|winner/i)) {
    isWinner = true;
  }
  
  const certificateTitle = isWinner ? "Certificate of Excellence" : "Certificate of Participation";
  const sponsorName = quizData?.sponsorName || "";
  const sponsorLogoUrl = quizData?.sponsorLogo || "";
  const sponsorSignatureUrl = quizData?.sponsorSignature || "";

  const quizDateStr = quizData?.quizDate;
  const parsedQuizDate = quizDateStr ? new Date(quizDateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : null;

  const issueDate = parsedQuizDate || new Date(quizData?.importedAt || new Date()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const idCode = quizData?.registrationId || applicant?.registrationId || applicant?._id || "N/A";

  return (
    <div style={{ position: 'fixed', top: '0', left: '0', opacity: 0, zIndex: -9999, pointerEvents: 'none' }}>
      <div 
        ref={cardRef}
        style={{
          width: '800px',
          height: '600px',
          backgroundColor: '#ffffff',
          backgroundImage: 'radial-gradient(circle at 50% 50%, #ffffff 0%, #eff6ff 100%)', // Light blue gradient
          position: 'relative',
          overflow: 'hidden',
          fontFamily: '"Inter", "Segoe UI", sans-serif',
          border: '16px solid #1e40af', // Blue border
          boxSizing: 'border-box'
        }}
      >
        {/* Decorative elements */}
        <div style={{ position: 'absolute', top: '-150px', left: '-150px', width: '300px', height: '300px', backgroundColor: 'rgba(37, 99, 235, 0.1)', borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', bottom: '-150px', right: '-150px', width: '300px', height: '300px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%' }}></div>
        
        {/* Inner border */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          right: '10px',
          bottom: '10px',
          border: '2px solid #e5e7eb',
          zIndex: 1
        }}></div>

        <div style={{ position: 'relative', zIndex: 10, padding: '25px 40px', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          
          {/* Top logos container */}
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '10px', alignItems: 'flex-start' }}>
            <img src={logo} alt="Code-A-Nova Logo" style={{ height: '90px', objectFit: 'contain', objectPosition: 'left' }} crossOrigin="anonymous" />
            
            {sponsorLogoUrl && (
              <img src={sponsorLogoUrl} alt="Sponsor Logo" style={{ height: '60px', maxWidth: '150px', objectFit: 'contain', objectPosition: 'right' }} crossOrigin="anonymous" />
            )}
          </div>

          <h1 style={{ 
            fontSize: '38px', 
            fontWeight: 900, 
            color: isWinner ? '#1e40af' : '#1e3a8a', // Blue shades
            margin: '0 0 5px 0',
            letterSpacing: '-1px',
            textTransform: 'uppercase'
          }}>
            {certificateTitle}
          </h1>

          <p style={{ fontSize: '16px', color: '#4b5563', margin: '0 0 10px 0', fontWeight: 500 }}>
            This is proudly presented to
          </p>

          <h2 style={{ 
            fontSize: '36px', 
            fontWeight: 800, 
            color: '#2563eb', // Blue-600
            margin: '0 0 10px 0',
            borderBottom: '2px solid #bfdbfe',
            paddingBottom: '5px',
            width: '80%',
            fontFamily: '"Playfair Display", serif'
          }}>
            {name}
          </h2>

          <p style={{ fontSize: '14px', color: '#4b5563', margin: '0 0 5px 0' }}>
            for successfully completing the assessment:
          </p>

          <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#1f2937', margin: parsedQuizDate ? '0 0 2px 0' : '0 0 10px 0' }}>
            {quizName}
          </h3>

          {parsedQuizDate && (
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 10px 0', fontWeight: 600 }}>
              Held on {parsedQuizDate}
            </p>
          )}

          <div style={{ display: 'flex', gap: '20px', marginBottom: 'auto' }}>
            {result !== "N/A" && isWinner && (
              <div style={{ padding: '6px 14px', backgroundColor: '#eff6ff', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                <div style={{ fontSize: '10px', color: '#2563eb', textTransform: 'uppercase', fontWeight: 700, marginBottom: '2px' }}>Position</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#1e3a8a' }}>
                  {result}
                </div>
              </div>
            )}

            {(score || percentage) && (
              <div style={{ padding: '6px 14px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '2px' }}>Score</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                  {score && totalScore ? `${score} / ${totalScore}` : (score || `${percentage}`)}
                </div>
              </div>
            )}
            
            {percentage && !score && (
              <div style={{ padding: '6px 14px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '2px' }}>Percentage</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                  {percentage}
                </div>
              </div>
            )}
          </div>

          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            width: '100%', 
            marginTop: '15px',
            marginBottom: '15px',
            alignItems: 'flex-end'
          }}>
            {/* Left side: Code-A-Nova Signature */}
            <div style={{ textAlign: 'center', width: '200px' }}>
              <div style={{ height: '60px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: '4px' }}>
                 {/* Placeholder for Code-A-Nova founder signature until provided */}
                 <span style={{ fontFamily: '"Brush Script MT", cursive', fontSize: '32px', color: '#1e3a8a' }}>Himanshu Gupta</span>
              </div>
              <div style={{ width: '100%', height: '1px', backgroundColor: '#9ca3af', margin: '0 auto 4px auto' }}></div>
              <p style={{ fontSize: '13px', color: '#111827', margin: 0, fontWeight: 700 }}>Himanshu Gupta</p>
              <p style={{ fontSize: '11px', color: '#6b7280', margin: 0, fontWeight: 500 }}>Founder, Code-A-Nova</p>
            </div>

            {/* Middle: Details */}
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
               <div>
                  <p style={{ fontSize: '10px', color: '#6b7280', margin: '0 0 2px 0', fontWeight: 600, textTransform: 'uppercase' }}>Date Issued</p>
                  <p style={{ fontSize: '12px', color: '#111827', margin: 0, fontWeight: 700 }}>{issueDate}</p>
               </div>
               <div>
                  <p style={{ fontSize: '10px', color: '#6b7280', margin: '0 0 2px 0', fontWeight: 600, textTransform: 'uppercase' }}>Certificate ID</p>
                  <p style={{ fontSize: '12px', color: '#111827', margin: 0, fontWeight: 700, fontFamily: 'monospace' }}>{idCode}</p>
               </div>
               <div>
                  <p style={{ fontSize: '11px', color: '#1e40af', margin: '5px 0 0 0', fontWeight: 700 }}>www.code-a-nova.online</p>
               </div>
            </div>

            {/* Right side: Sponsor Signature */}
            <div style={{ textAlign: 'center', width: '200px' }}>
              {sponsorSignatureUrl ? (
                <>
                  <div style={{ height: '60px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: '4px' }}>
                    <img src={sponsorSignatureUrl} alt="Sponsor Signature" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} crossOrigin="anonymous" />
                  </div>
                  <div style={{ width: '100%', height: '1px', backgroundColor: '#9ca3af', margin: '0 auto 4px auto' }}></div>
                  <p style={{ fontSize: '13px', color: '#111827', margin: 0, fontWeight: 700 }}>Authorized Signatory</p>
                  {sponsorName && <p style={{ fontSize: '11px', color: '#6b7280', margin: 0, fontWeight: 500 }}>{sponsorName}</p>}
                </>
              ) : (
                <>
                  <div style={{ height: '60px' }}></div>
                  <div style={{ width: '100%', height: '1px', backgroundColor: 'transparent', margin: '0 auto 4px auto' }}></div>
                  <p style={{ fontSize: '13px', color: 'transparent', margin: 0, fontWeight: 700 }}>.</p>
                  <p style={{ fontSize: '11px', color: 'transparent', margin: 0, fontWeight: 500 }}>.</p>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
});

export default QuizCertificate;
