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
    <div className="relative w-full h-full overflow-hidden bg-slate-100 flex items-center justify-center">
      <div className="absolute inset-0 w-full h-full">
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

      {/* Speaking Glow Effect - Subtle ring for visual feedback */}
      {isSpeaking && (
        <div className="absolute inset-0 pointer-events-none ring-[6px] ring-inset ring-indigo-500/20 transition-all duration-300"></div>
      )}
    </div>
  );
}

export default AiAvatar;
