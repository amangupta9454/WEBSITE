import React, { useState, useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';

const BACKEND = import.meta.env.VITE_BACKEND_URL;

const isVideo = (url) => {
  if (!url) return false;
  const ext = url.split('?')[0].split('.').pop().toLowerCase();
  return ['mp4', 'webm', 'ogg', 'mov'].includes(ext) || url.includes('/video/');
};

const FeatureBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [bannerInfo, setBannerInfo] = useState({
    mediaUrl: null,
    targetUrl: '',
    buttonText: 'Click Here',
  });

  useEffect(() => {
    // Hide banner if user is referred, so they don't get distracted by the ambassador popup
    const params = new URLSearchParams(window.location.search);
    const hasRef = params.get("ref") || params.get("referralCode") || params.get("referredByCode");
    const hasStoredRef = sessionStorage.getItem("referralCode") || localStorage.getItem("referralCode");
    if (hasRef || hasStoredRef) return;

    const dismissed = sessionStorage.getItem('featureBannerDismissed');
    if (dismissed) return;

    fetch(`${BACKEND}/api/admin/banner`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.banner?.enabled && data.banner?.imageUrl) {
          setBannerInfo({
            mediaUrl: data.banner.imageUrl,
            targetUrl: data.banner.targetUrl || '',
            buttonText: data.banner.buttonText || 'Click Here',
          });
          setTimeout(() => setIsVisible(true), 600);
        }
      })
      .catch(() => {});
  }, []);

  const handleClose = () => {
    sessionStorage.getItem('featureBannerDismissed', 'true');
    setIsVisible(false);
  };

  const handleRedirect = (e) => {
    if (!bannerInfo.targetUrl) return;
    handleClose();
    if (bannerInfo.targetUrl.startsWith('http://') || bannerInfo.targetUrl.startsWith('https://')) {
      window.open(bannerInfo.targetUrl, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = bannerInfo.targetUrl;
    }
  };

  if (!isVisible || !bannerInfo.mediaUrl) return null;

  const video = isVideo(bannerInfo.mediaUrl);

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
          padding: '16px',
        }}
      >
        {/* Card — 10px white padding, fits media size */}
        <div
          style={{
            position: 'relative',
            pointerEvents: 'auto',
            background: '#ffffff',
            padding: '12px',
            borderRadius: '20px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
            maxWidth: '92vw',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
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

          {/* Clickable Media */}
          <div
            onClick={bannerInfo.targetUrl ? handleRedirect : undefined}
            style={{
              cursor: bannerInfo.targetUrl ? 'pointer' : 'default',
              overflow: 'hidden',
              borderRadius: '12px',
              maxHeight: bannerInfo.targetUrl ? '70vh' : '78vh',
            }}
          >
            {video ? (
              <video
                src={bannerInfo.mediaUrl}
                autoPlay
                loop
                muted
                playsInline
                controls
                style={{
                  display: 'block',
                  maxWidth: '80vw',
                  maxHeight: '70vh',
                  borderRadius: '12px',
                  objectFit: 'contain',
                }}
              />
            ) : (
              <img
                src={bannerInfo.mediaUrl}
                alt="Promotional Banner"
                style={{
                  display: 'block',
                  maxWidth: '80vw',
                  maxHeight: '70vh',
                  borderRadius: '12px',
                  objectFit: 'contain',
                }}
              />
            )}
          </div>

          {/* Action Button (Click Here / Custom Label) */}
          {bannerInfo.targetUrl && (
            <button
              onClick={handleRedirect}
              style={{
                marginTop: '12px',
                width: '100%',
                padding: '12px 20px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                color: '#ffffff',
                fontWeight: '900',
                fontSize: '14px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(99, 102, 241, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'transform 0.15s, background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <span>{bannerInfo.buttonText || 'Click Here'}</span>
              <ExternalLink size={16} />
            </button>
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
