import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5004';

const FeatureBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [bannerImageUrl, setBannerImageUrl] = useState(null);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('featureBannerDismissed');
    if (dismissed) return;

    // Fetch banner config from backend
    fetch(`${BACKEND}/api/admin/banner`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.banner?.enabled && data.banner?.imageUrl) {
          setBannerImageUrl(data.banner.imageUrl);
          // Small delay so page loads first
          setTimeout(() => setIsVisible(true), 700);
        }
      })
      .catch(() => {}); // Silently fail - don't break the app
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
        className="fixed inset-0 z-[99998] bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Banner Popup */}
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="relative pointer-events-auto"
          style={{ animation: 'bannerPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both' }}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute -top-3 -right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all border border-slate-200"
          >
            <X size={16} />
          </button>

          {/* Image */}
          <img
            src={bannerImageUrl}
            alt="Promotional Banner"
            className="max-w-[90vw] max-h-[85vh] w-auto h-auto rounded-2xl shadow-2xl object-contain"
            onClick={handleClose}
          />
        </div>
      </div>

      <style>{`
        @keyframes bannerPop {
          0% { opacity: 0; transform: scale(0.85) translateY(24px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </>
  );
};

export default FeatureBanner;
