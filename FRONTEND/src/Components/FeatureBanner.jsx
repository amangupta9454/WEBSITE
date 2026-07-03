import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const BACKEND = import.meta.env.VITE_BACKEND_URL;

const isVideo = (url) => {
  if (!url) return false;
  const ext = url.split('?')[0].split('.').pop().toLowerCase();
  return ['mp4', 'webm', 'ogg', 'mov'].includes(ext) || url.includes('/video/');
};

const FeatureBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [mediaUrl, setMediaUrl] = useState(null);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('featureBannerDismissed');
    if (dismissed) return;

    fetch(`${BACKEND}/api/admin/banner`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.banner?.enabled && data.banner?.imageUrl) {
          setMediaUrl(data.banner.imageUrl);
          setTimeout(() => setIsVisible(true), 600);
        }
      })
      .catch(() => {});
  }, []);

  const handleClose = () => {
    sessionStorage.setItem('featureBannerDismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible || !mediaUrl) return null;

  const video = isVideo(mediaUrl);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99998,
          background: 'rgba(0,0,0,0.72)',
          backdropFilter: 'blur(3px)',
        }}
      />

      {/* Centered container */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        {/* Card — 10px white padding, fits media size */}
        <div
          style={{
            position: 'relative',
            pointerEvents: 'auto',
            background: '#ffffff',
            padding: '10px',
            borderRadius: '16px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
            maxWidth: '92vw',
            maxHeight: '90vh',
            animation: 'bannerPop 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
          }}
        >
          {/* X close button — top right */}
          <button
            onClick={handleClose}
            style={{
              position: 'absolute',
              top: '-14px',
              right: '-14px',
              zIndex: 10,
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#1e293b',
              border: '2px solid #ffffff',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#ffffff',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#dc2626'}
            onMouseLeave={e => e.currentTarget.style.background = '#1e293b'}
            aria-label="Close"
          >
            <X size={15} strokeWidth={2.5} />
          </button>

          {/* Media */}
          {video ? (
            <video
              src={mediaUrl}
              autoPlay
              loop
              muted
              playsInline
              controls
              style={{
                display: 'block',
                maxWidth: '80vw',
                maxHeight: '80vh',
                borderRadius: '8px',
                objectFit: 'contain',
              }}
            />
          ) : (
            <img
              src={mediaUrl}
              alt="Promotional Banner"
              style={{
                display: 'block',
                maxWidth: '80vw',
                maxHeight: '80vh',
                borderRadius: '8px',
                objectFit: 'contain',
              }}
            />
          )}
        </div>
      </div>

      <style>{`
        @keyframes bannerPop {
          0%   { opacity: 0; transform: scale(0.84) translateY(28px); }
          100% { opacity: 1; transform: scale(1)    translateY(0);    }
        }
      `}</style>
    </>
  );
};

export default FeatureBanner;
