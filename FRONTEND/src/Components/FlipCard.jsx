import React, { useState } from 'react';
import { ParticleCard } from './MagicBento';

const FlipCard = ({ front, back, className = "", heightClass = "h-[320px]" }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative w-full ${heightClass} cursor-pointer group`}
      style={{ perspective: "1000px" }}
    >
      <div
        className="w-full h-full relative"
        style={{
          transformStyle: "preserve-3d",
          transition: "transform 0.85s cubic-bezier(0.25, 1, 0.5, 1)",
          transform: isHovered ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front Face */}
        <div
          className="absolute inset-0 w-full h-full rounded-3xl border border-zinc-100 bg-white shadow-sm shadow-zinc-200/30 overflow-hidden"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(0deg)",
          }}
        >
          <ParticleCard
            enableTilt={false}
            enableMagnetism={true}
            clickEffect={true}
            enableStars={true}
            particleCount={6}
            glowColor="16, 185, 129"
            className="w-full h-full flex flex-col justify-stretch items-stretch"
          >
            {/* Subtle light mesh background glow on front */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/20 to-transparent pointer-events-none" />
            <div className="relative z-10 h-full w-full flex flex-col justify-stretch items-stretch">{front}</div>
          </ParticleCard>
        </div>

        {/* Back Face */}
        <div
          className="absolute inset-0 w-full h-full rounded-3xl border border-zinc-150 bg-[#F4F9F6] shadow-xl shadow-zinc-200/40 overflow-hidden"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <ParticleCard
            enableTilt={false}
            enableMagnetism={true}
            clickEffect={true}
            enableStars={true}
            particleCount={6}
            glowColor="16, 185, 129"
            className="w-full h-full flex flex-col justify-stretch items-stretch"
          >
            {/* Ambient emerald backlight on back */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-brand-emerald/5 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10 h-full w-full flex flex-col justify-stretch items-stretch">{back}</div>
          </ParticleCard>
        </div>
      </div>
    </div>
  );
};

export default FlipCard;
