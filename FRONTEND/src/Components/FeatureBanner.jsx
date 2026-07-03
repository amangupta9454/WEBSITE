import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const BACKEND = import.meta.env.VITE_BACKEND_URL;

const FeatureBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [bannerImageUrl, setBannerImageUrl] = useState(null);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('featureBannerDismissed');
    if (dismissed) return;

    fetch(`${BACKEND}/api/admin/banner`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.banner?.enabled && data.banner?.imageUrl) {
          setBannerImageUrl(data.banner.imageUrl);
          setTimeout(() => setIsVisible(true), 700);
        }
      })
      .catch(() => {});
  }, []);

  const handleClose = () => {
    sessionStorage.setItem('featureBannerDismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible || !bannerImageUrl) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[99998] bg-black/70 backdrop-blur-[3px]"
        onClick={handleClose}
        style={{ touchAction: 'none' }}
      />

      {/* Banner Popup — centered on all screen sizes */}
      <div className="fixed inset-0 z-[99999] flex items-center justify-center pointer-events-none"
        style={{ padding: 'clamp(12px, 4vw, 40px)' }}
      >
        <div
          className="relative pointer-events-auto w-full"
          style={{
            maxWidth: 'min(640px, 92vw)',
            animation: 'bannerPop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both',
          }}
        >
          {/* Glow ring behind card */}
          <div
            style={{
              position: 'absolute',
              inset: '-4px',
              borderRadius: '24px',
              background: 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)',
              filter: 'blur(10px)',
              opacity: 0.45,
              zIndex: 0,
            }}
          />

          {/* Card */}
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              background: '#ffffff',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
            }}
          >
            {/* Top colour bar */}
            <div style={{
              height: '4px',
              background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899)',
            }} />

            {/* Image wrapper — keeps image centred with nice padding */}
            <div style={{
              padding: 'clamp(12px, 3vw, 24px)',
              background: '#f8fafc',
            }}>
              <img
                src={bannerImageUrl}
                alt="Promotional Banner"
                style={{
                  display: 'block',
                  width: '100%',
                  height: 'auto',
                  maxHeight: 'clamp(200px, 55vh, 480px)',
                  objectFit: 'contain',
                  borderRadius: '12px',
                }}
              />
            </div>

            {/* Footer strip */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 20px',
              background: '#ffffff',
              borderTop: '1px solid #e2e8f0',
            }}>
              <span style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#94a3b8',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}>
                Code-A-Nova
              </span>
              <button
                onClick={handleClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  background: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#64748b',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#334155'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
              >
                <X size={13} /> Close
              </button>
            </div>
          </div>

          {/* Floating close X top-right */}
          <button
            onClick={handleClose}
            style={{
              position: 'absolute',
              top: '-14px',
              right: '-14px',
              zIndex: 10,
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: '#ffffff',
              border: '2px solid #e2e8f0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#1e293b'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#64748b'; }}
            aria-label="Close banner"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bannerPop {
          0%   { opacity: 0; transform: scale(0.82) translateY(30px); }
          100% { opacity: 1; transform: scale(1)    translateY(0);    }
        }
        @media (max-width: 480px) {
          /* ensure banner never overflows on small phones */
          ._banner-img { max-height: 42vh !important; }
        }
      `}</style>
    </>
  );
};

export default FeatureBanner;
