import React, { useRef, useState, useEffect, useCallback } from 'react';
import { gsap } from 'gsap';
import './MagicBento.css'; // Leverage standard theme bento styles for border glows

const DEFAULT_PARTICLE_COUNT = 8;
const DEFAULT_GLOW_COLOR = '16, 185, 129'; // emerald

const createParticleElement = (x, y, color = DEFAULT_GLOW_COLOR) => {
  const el = document.createElement('div');
  el.className = 'particle';
  el.style.cssText = `
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgba(${color}, 0.8);
    box-shadow: 0 0 6px rgba(${color}, 0.5);
    pointer-events: none;
    z-index: 5;
    left: ${x}px;
    top: ${y}px;
  `;
  return el;
};

const TiltSpotlightCard = ({
  children,
  className = '',
  enableStars = true,
  enableTilt = true,
  enableMagnetism = true,
  clickEffect = true,
  particleCount = DEFAULT_PARTICLE_COUNT,
  glowColor = DEFAULT_GLOW_COLOR
}) => {
  const cardRef = useRef(null);
  const particlesRef = useRef([]);
  const timeoutsRef = useRef([]);
  const isHoveredRef = useRef(false);
  const memoizedParticles = useRef([]);
  const particlesInitialized = useRef(false);
  const magnetismAnimationRef = useRef(null);

  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const initializeParticles = useCallback(() => {
    if (particlesInitialized.current || !cardRef.current) return;
    const { width, height } = cardRef.current.getBoundingClientRect();
    memoizedParticles.current = Array.from({ length: particleCount }, () =>
      createParticleElement(Math.random() * width, Math.random() * height, glowColor)
    );
    particlesInitialized.current = true;
  }, [particleCount, glowColor]);

  const clearAllParticles = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    magnetismAnimationRef.current?.kill();

    particlesRef.current.forEach(particle => {
      gsap.to(particle, {
        scale: 0,
        opacity: 0,
        duration: 0.3,
        ease: 'back.in(1.7)',
        onComplete: () => {
          particle.parentNode?.removeChild(particle);
        }
      });
    });
    particlesRef.current = [];
  }, []);

  const animateParticles = useCallback(() => {
    if (!cardRef.current || !isHoveredRef.current) return;
    if (!particlesInitialized.current) {
      initializeParticles();
    }

    memoizedParticles.current.forEach((particle, index) => {
      const timeoutId = setTimeout(() => {
        if (!isHoveredRef.current || !cardRef.current) return;

        const clone = particle.cloneNode(true);
        cardRef.current.appendChild(clone);
        particlesRef.current.push(clone);

        gsap.fromTo(clone, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' });

        gsap.to(clone, {
          x: (Math.random() - 0.5) * 50,
          y: (Math.random() - 0.5) * 50,
          rotation: Math.random() * 360,
          duration: 2 + Math.random() * 2,
          ease: 'none',
          repeat: -1,
          yoyo: true
        });

        gsap.to(clone, {
          opacity: 0.25,
          duration: 1.5,
          ease: 'power2.inOut',
          repeat: -1,
          yoyo: true
        });
      }, index * 120);

      timeoutsRef.current.push(timeoutId);
    });
  }, [initializeParticles]);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCoords({ x, y });

    // CSS Custom Properties for border glow
    cardRef.current.style.setProperty('--glow-x', `${(x / rect.width) * 100}%`);
    cardRef.current.style.setProperty('--glow-y', `${(y / rect.height) * 100}%`);
    cardRef.current.style.setProperty('--glow-intensity', '1');
    cardRef.current.style.setProperty('--glow-radius', '280px');

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    if (enableTilt) {
      const rotateX = ((y - centerY) / centerY) * -6;
      const rotateY = ((x - centerX) / centerX) * 6;
      gsap.to(cardRef.current, {
        rotateX,
        rotateY,
        duration: 0.1,
        ease: 'power2.out',
        transformPerspective: 1000
      });
    }

    if (enableMagnetism) {
      const magnetX = (x - centerX) * 0.03;
      const magnetY = (y - centerY) * 0.03;
      magnetismAnimationRef.current = gsap.to(cardRef.current, {
        x: magnetX,
        y: magnetY,
        duration: 0.3,
        ease: 'power2.out'
      });
    }
  };

  const handleMouseEnter = () => {
    isHoveredRef.current = true;
    setOpacity(1);
    if (enableStars) {
      animateParticles();
    }
  };

  const handleMouseLeave = () => {
    isHoveredRef.current = false;
    setOpacity(0);
    clearAllParticles();

    if (cardRef.current) {
      cardRef.current.style.setProperty('--glow-intensity', '0');
      
      if (enableTilt) {
        gsap.to(cardRef.current, {
          rotateX: 0,
          rotateY: 0,
          duration: 0.3,
          ease: 'power2.out'
        });
      }

      if (enableMagnetism) {
        gsap.to(cardRef.current, {
          x: 0,
          y: 0,
          duration: 0.3,
          ease: 'power2.out'
        });
      }
    }
  };

  const handleClick = (e) => {
    if (!clickEffect || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const maxDistance = Math.max(
      Math.hypot(x, y),
      Math.hypot(x - rect.width, y),
      Math.hypot(x, y - rect.height),
      Math.hypot(x - rect.width, y - rect.height)
    );

    const ripple = document.createElement('div');
    ripple.style.cssText = `
      position: absolute;
      width: ${maxDistance * 2}px;
      height: ${maxDistance * 2}px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(${glowColor}, 0.2) 0%, rgba(${glowColor}, 0.08) 35%, transparent 70%);
      left: ${x - maxDistance}px;
      top: ${y - maxDistance}px;
      pointer-events: none;
      z-index: 10;
    `;

    cardRef.current.appendChild(ripple);

    gsap.fromTo(
      ripple,
      { scale: 0, opacity: 1 },
      {
        scale: 1,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
        onComplete: () => ripple.remove()
      }
    );
  };

  useEffect(() => {
    return () => {
      isHoveredRef.current = false;
      clearAllParticles();
    };
  }, [clearAllParticles]);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className={`magic-bento-card magic-bento-card--border-glow relative overflow-hidden rounded-3xl bg-white border border-zinc-150 transition-colors duration-300 shadow-sm shadow-zinc-200/30 ${className}`}
      style={{
        '--glow-color': glowColor,
        willChange: 'transform, filter',
        position: 'relative'
      }}
    >
      {/* Background Spotlight Glow (Light-adapted soft glow) */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300 ease-in-out z-0"
        style={{
          opacity,
          background: `radial-gradient(280px circle at ${coords.x}px ${coords.y}px, rgba(${glowColor}, 0.05), transparent 60%)`,
        }}
      />
      <div className="relative z-10 h-full w-full flex flex-col">{children}</div>
    </div>
  );
};

export default TiltSpotlightCard;
