import React, { useState, useEffect } from 'react';
import { X, Sparkles, Mic, Star, ArrowRight } from 'lucide-react';

const FeatureBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // sessionStorage: clears on tab/browser close, persists on same-tab navigation
    // So it shows on fresh page load but not again once closed in same session
    const dismissed = sessionStorage.getItem('featureBannerDismissed');
    if (!dismissed) {
      // Small delay so the page loads first
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    sessionStorage.setItem('featureBannerDismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[99998] bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Banner / Popup */}
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="relative w-full max-w-lg pointer-events-auto animate-fade-in"
          style={{ animation: 'bannerPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both' }}
        >
          {/* Glow Ring */}
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl blur-md opacity-60" />

          <div className="relative bg-white rounded-2xl overflow-hidden shadow-2xl">
            {/* Top gradient bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-all z-10"
            >
              <X size={16} />
            </button>

            {/* Content */}
            <div className="p-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                <Sparkles size={12} className="text-indigo-500" />
                New Feature
              </div>

              {/* Heading */}
              <h2 className="text-2xl font-black text-slate-800 mb-2 leading-tight">
                AI Mock Interviews are{' '}
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Live!
                </span> 🎉
              </h2>

              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                Practice real-world technical interviews with our AI interviewer. Get instant 
                feedback on your answers, communication skills, and more. Level up before 
                your next interview!
              </p>

              {/* Feature highlights */}
              <div className="flex flex-col gap-2.5 mb-6">
                {[
                  { icon: Mic, text: 'Voice-based AI interview experience' },
                  { icon: Star, text: 'Instant detailed feedback & scoring' },
                  { icon: Sparkles, text: 'Face & attention tracking technology' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                      <Icon size={14} />
                    </div>
                    <span className="text-sm font-medium text-slate-600">{text}</span>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5"
                >
                  Try it Now <ArrowRight size={16} />
                </button>
                <button
                  onClick={handleClose}
                  className="px-5 py-3 text-slate-500 hover:text-slate-700 font-medium text-sm transition-colors"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bannerPop {
          0% { opacity: 0; transform: scale(0.88) translateY(20px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </>
  );
};

export default FeatureBanner;
