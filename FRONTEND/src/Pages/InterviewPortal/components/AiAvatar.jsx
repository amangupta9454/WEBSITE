import React, { useEffect, useRef } from "react";

/**
 * AiAvatar - Real Video Implementation
 *
 * Uses high-quality professional AI avatar video loops from a global CDN.
 * The video naturally plays/loops. When the AI speaks, we slightly zoom in to simulate
 * engagement and attentiveness.
 */
function AiAvatar({ gender, isSpeaking, isListening }) {
  const videoRef = useRef(null);

  // If user selected "male", interviewer should be "female" and vice-versa
  const isFemaleInterviewer = gender === "male";
  
  // High-quality professional avatar videos (Synthesia public demo CDNs)
  // These are robust, fast, and feature actual human-like AI presenters.
  const videoSrc = isFemaleInterviewer
    ? "https://webcdn.synthesia.io/homepage/bento-cards/expressive-avatarV2-desktop.mp4"
    : "https://webcdn.synthesia.io/book-demo-cta/talking-avatar-en-pricing-with-freemium.mp4";

  // Ensure video plays automatically
  useEffect(() => {
    if (videoRef.current) {
      // Force reload when source changes
      videoRef.current.load();
      videoRef.current.play().catch(e => console.warn("Auto-play prevented:", e));
    }
  }, [videoSrc]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-900 flex items-center justify-center">
      {/* 
        The video container scales up slightly when the AI is speaking 
        to simulate leaning in / talking engagement.
      */}
      <div 
        className={`absolute inset-0 w-full h-full transition-transform duration-700 ease-in-out ${
          isSpeaking ? 'scale-[1.08]' : 'scale-[1.04]'
        }`}
        style={{ transformOrigin: 'center center' }}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-cover pointer-events-none"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      </div>

      {/* Simulated camera grain/noise overlay for realism */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />

      {/* Subtle vignette for realistic webcam depth */}
      <div className="absolute inset-0 pointer-events-none rounded-2xl" style={{ boxShadow: 'inset 0 0 80px rgba(0,0,0,0.3)' }}></div>
      
      {/* Speaking Glow Effect */}
      {isSpeaking && (
        <div className="absolute inset-0 pointer-events-none ring-4 ring-inset ring-blue-500/30 transition-all duration-300"></div>
      )}
    </div>
  );
}

export default AiAvatar;
