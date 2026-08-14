import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import html2canvas from 'html2canvas';
import logo from '../assets/logo.png';
import founderSign from '../assets/founder-sign.png';
import amanSign from '../assets/aman-sign.png';
import msmeLogo from '../assets/msme-logo.png';
import certificateBg from '../assets/certificate-bg.png';
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

const useTransparentSignature = (src) => {
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
        // Make grey/white background transparent
        if (r > 130 && g > 130 && b > 130) {
          data[i + 3] = 0;
        } else {
          // Make the signature ink dark blue
          data[i] = 15;
          data[i + 1] = 23;
          data[i + 2] = 42;
        }
      }
      ctx.putImageData(imgData, 0, 0);
      setDataUrl(canvas.toDataURL('image/png'));
    };
    img.onerror = () => setDataUrl(src);
  }, [src]);

  return dataUrl;
};

const QuizCertificate = forwardRef(({ applicant, quizData, issueDateOverride }, ref) => {
  const cardRef = useRef(null);
  const logoSrc = useTransparentWhiteLogo("/LOGO.png");
  const processedAmanSign = useTransparentSignature(amanSign);

  const generateCanvas = async () => {
    if (!cardRef.current) return null;

    // Temporarily remove scaling if any
    const originalTransform = cardRef.current.style.transform;
    cardRef.current.style.transform = 'none';

    const canvas = await html2canvas(cardRef.current, {
      scale: 3.5, // Ultra-high DPI (2800x2100 resolution for crystal crisp text & logos)
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: 800,
      height: 600,
      windowWidth: 800,
      windowHeight: 600,
      imageTimeout: 0
    });

    cardRef.current.style.transform = originalTransform;
    return canvas;
  };

  const handleDownload = async () => {
    try {
      const canvas = await generateCanvas();
      if (!canvas) return;

      const imgData = canvas.toDataURL("image/png", 1.0);
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [800, 600],
        compress: true
      });

      pdf.addImage(imgData, "PNG", 0, 0, 800, 600, undefined, 'SLOW');

      const blob = pdf.output('blob');
      const fileName = `Certificate_${(applicant?.name || "Participant").replace(/\s+/g, '_')}_${(quizData?.quizName || "Quiz").replace(/\s+/g, '_')}.pdf`;

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
      const imgData = canvas.toDataURL("image/jpeg", 0.98);
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [800, 600],
        compress: true
      });

      pdf.addImage(imgData, "JPEG", 0, 0, 800, 600, undefined, 'MEDIUM');
      return pdf.output('datauristring');
    } catch (err) {
      console.error("Error generating certificate PDF base64:", err);
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
  let isAssessmentPassed = false;
  if (result.match(/1st|2nd|3rd|winner/i)) {
    isWinner = true;
  } else if (result === "Assessment Passed") {
    isAssessmentPassed = true;
  }

  const certificateTitle = (isWinner || isAssessmentPassed) ? "Certificate of Excellence" : "Certificate of Participation";
  const sponsorName = quizData?.sponsorName || applicant?.sponsorName || "";
  const sponsorLogoUrl = quizData?.sponsorLogo || applicant?.sponsorLogo || "";
  const sponsorSignatureUrl = quizData?.sponsorSignature || applicant?.sponsorSignature || "";
  const sponsorSignatoryName = quizData?.sponsorSignatoryName || applicant?.sponsorSignatoryName || "";

  const quizDateStr = quizData?.quizDate;
  const parsedQuizDate = quizDateStr ? new Date(quizDateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : null;

  const issueDate = issueDateOverride ? new Date(issueDateOverride).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  }) : (parsedQuizDate || new Date(quizData?.importedAt || new Date()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }));
  const idCode = quizData?.registrationId || applicant?.registrationId || applicant?._id || "N/A";

  return (
    <div style={{ position: 'fixed', top: '0', left: '0', opacity: 0, zIndex: -9999, pointerEvents: 'none' }}>
      <div
        ref={cardRef}
        style={{
          width: '800px',
          height: '600px',
          backgroundColor: '#ffffff',
          backgroundImage: `url(${certificateBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: '"Inter", "Segoe UI", sans-serif',
          boxSizing: 'border-box'
        }}
      >
        {/* MSME Watermark */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.05, zIndex: 0, pointerEvents: 'none' }}>
          <img src={msmeLogo} alt="MSME Logo Watermark" style={{ width: '400px', objectFit: 'contain' }} crossOrigin="anonymous" />
        </div>

        <div style={{ position: 'relative', zIndex: 10, padding: '8px 50px 25px 50px', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          
          {/* Top logos container */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '40px', 
            width: '100%', 
            marginBottom: '-30px' 
          }}>
            <img 
              src={logo} 
              alt="Code-A-Nova Logo" 
              style={{ 
                height: '135px', 
                objectFit: 'contain', 
                transform: 'translateY(-16px)' 
              }} 
              crossOrigin="anonymous" 
            />
            
            {sponsorLogoUrl && (
              <img 
                src={sponsorLogoUrl} 
                alt="Sponsor Logo" 
                style={{ 
                  height: '85px', 
                  maxWidth: '180px', 
                  objectFit: 'contain', 
                  transform: 'translateY(-16px)' 
                }} 
                crossOrigin="anonymous" 
              />
            )}
          </div>

          <h1 style={{
            fontSize: '34px',
            fontWeight: 900,
            color: isWinner ? '#1e40af' : '#1e3a8a', // Blue shades
            margin: '-4px 0 4px 0',
            letterSpacing: '-1px',
            textTransform: 'uppercase'
          }}>
            {certificateTitle}
          </h1>

          <p style={{ fontSize: '15px', color: '#4b5563', margin: '2px 0 4px 0', fontWeight: 500 }}>
            This is proudly presented to
          </p>

          <h2 style={{
            fontSize: '32px',
            fontWeight: 800,
            color: '#2563eb', // Blue-600
            margin: '2px 0 8px 0',
            borderBottom: '2px solid #bfdbfe',
            paddingBottom: '8px',
            width: '80%',
            fontFamily: '"Playfair Display", serif'
          }}>
            {name}
          </h2>

          <p style={{ fontSize: '13px', color: '#4b5563', margin: '4px 0 6px 0' }}>
            for successfully completing the assessment:
          </p>

          <h3 style={{ fontSize: '19px', fontWeight: 700, color: '#1f2937', margin: '0 0 4px 0' }}>
            {quizName}
          </h3>

          {parsedQuizDate && (
            <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 8px 0', fontWeight: 600 }}>
              Held on {parsedQuizDate}
            </p>
          )}

          {/* Appreciating lines */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', margin: '6px 0 0 0', maxWidth: '640px' }}>
            {result !== "N/A" && isWinner && (
              <p style={{ fontSize: '16px', color: '#1e40af', margin: '0 0 2px 0', fontWeight: 700, fontStyle: 'italic' }}>
                Awarded {result} Position
              </p>
            )}
            <p style={{
              fontSize: '12px',
              color: '#4b5563',
              margin: 0,
              fontStyle: 'italic',
              lineHeight: 1.4,
              fontWeight: 500,
              textAlign: 'center'
            }}>
              {(isWinner || isAssessmentPassed) 
                ? "In recognition of exceptional technical proficiency, outstanding performance, and exemplary problem-solving skills demonstrated throughout the assessment."
                : "In appreciation of active participation, valuable effort, and dedicated commitment towards technical excellence and continuous learning."}
            </p>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            marginTop: 'auto',
            marginBottom: '40px',
            alignItems: 'flex-end'
          }}>
            {/* Left side: Code-A-Nova Signature */}
            <div style={{ textAlign: 'center', width: '200px' }}>
              <div style={{ height: '60px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: '4px' }}>
                <img src={founderSign} alt="Himanshu Gupta Signature" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', transform: 'translateY(48px) scale(2.0)', transformOrigin: 'bottom' }} crossOrigin="anonymous" />
              </div>
              <div style={{ width: '100%', height: '1px', backgroundColor: '#9ca3af', margin: '0 auto 4px auto' }}></div>
              <p style={{ fontSize: '13px', color: '#111827', margin: 0, fontWeight: 700 }}>Himanshu Gupta</p>
              <p style={{ fontSize: '11px', color: '#6b7280', margin: 0, fontWeight: 500 }}>Founder, Code-A-Nova</p>
            </div>

            {/* Middle: Details */}
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px', transform: 'translateY(30px)' }}>
              <div>
                <p style={{ fontSize: '10px', color: '#6b7280', margin: '0 0 2px 0', fontWeight: 600, textTransform: 'uppercase' }}>Date Issued</p>
                <p style={{ fontSize: '12px', color: '#111827', margin: 0, fontWeight: 700 }}>{issueDate}</p>
              </div>
              <div>
                <p style={{ fontSize: '10px', color: '#6b7280', margin: '0 0 2px 0', fontWeight: 600, textTransform: 'uppercase' }}>Certificate ID</p>
                <p style={{ fontSize: '12px', color: '#111827', margin: 0, fontWeight: 700, fontFamily: 'monospace' }}>{idCode}</p>
              </div>
              <div>
                <p style={{ fontSize: '11px', color: '#1e40af', margin: '2px 0 0 0', fontWeight: 700 }}>www.code-a-nova.online</p>
              </div>
            </div>

            {/* Right side: Sponsor Signature / Co-Founder */}
            <div style={{ textAlign: 'center', width: '200px' }}>
              {sponsorSignatureUrl ? (
                <>
                  <div style={{ height: '60px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: '4px' }}>
                    <img src={sponsorSignatureUrl} alt="Sponsor Signature" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', transform: 'translateY(15px)' }} crossOrigin="anonymous" />
                  </div>
                  <div style={{ width: '100%', height: '1px', backgroundColor: '#9ca3af', margin: '0 auto 4px auto' }}></div>
                  <p style={{ fontSize: '13px', color: '#111827', margin: 0, fontWeight: 700 }}>
                    {sponsorSignatoryName || "Authorized Signatory"}
                  </p>
                  {sponsorName && (
                    <p style={{ fontSize: '11px', color: '#6b7280', margin: 0, fontWeight: 500 }}>
                      {sponsorName}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <div style={{ height: '60px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: '4px' }}>
                    <img src={processedAmanSign} alt="Aman Gupta Signature" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', transform: 'translateY(24px) scale(1.25)', transformOrigin: 'bottom' }} crossOrigin="anonymous" />
                  </div>
                  <div style={{ width: '100%', height: '1px', backgroundColor: '#9ca3af', margin: '0 auto 4px auto' }}></div>
                  <p style={{ fontSize: '13px', color: '#111827', margin: 0, fontWeight: 700 }}>Aman Gupta</p>
                  <p style={{ fontSize: '11px', color: '#6b7280', margin: 0, fontWeight: 500 }}>Co-Founder, Code-A-Nova</p>
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
