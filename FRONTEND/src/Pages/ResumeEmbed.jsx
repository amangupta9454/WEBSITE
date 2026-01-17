import React, { useState } from 'react';

const ResumeEmbed = () => {
  const [loading, setLoading] = useState(true);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [error, setError] = useState('');

  const handleIframeLoad = () => {
    setIframeLoaded(true);
    setLoading(false);
  };

  const handleIframeError = () => {
    console.error('Iframe failed to load');
    setError('Failed to load the resume builder. Please try again later.');
    setIframeLoaded(true);
    setLoading(false);
  };

  if (loading || !iframeLoaded) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-black">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-gray-500"></div>
          <div className="absolute inset-0 animate-pulse rounded-full h-16 w-16 bg-gray-500/20"></div>
        </div>
        {/* Preload iframe in the background */}
        <iframe
          src="https://resumebuild.lovable.app/"
          title="Resume Builder"
          width="100%"
          height="100%"
          style={{ border: 'none', position: 'absolute', top: 0, left: 0, opacity: 0 }}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
        ></iframe>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-black">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gray-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gray-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        <div className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl shadow-gray-500/25 text-center transform animate-formEntrance">
          <p className="text-red-400 text-lg font-medium mb-6 animate-fadeInUp">{error}</p>
          <a
            href="/"
            className="group relative inline-block px-6 py-3 bg-linear-to-r from-gray-600 to-gray-400 text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl hover:shadow-gray-500/50 transition-all duration-300 hover:scale-105 overflow-hidden"
          >
            <div className="absolute inset-0 bg-linear-to-r from-gray-600 to-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">Go to Home</div>
          </a>
        </div>
      </div>
    );
  }

  return (
    <section className="relative min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-black overflow-hidden pt-16">
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gray-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gray-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      <div className="relative z-10 w-full h-screen animate-iframeFadeIn">
        <iframe
          src="https://resumebuild.lovable.app/"
          title="Resume Builder"
          width="100%"
          height="100%"
          style={{ border: 'none' }}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
        ></iframe>
      </div>
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes formEntrance {
          0% {
            opacity: 0;
            transform: scale(0.9) translateY(50px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes iframeFadeIn {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out forwards;
        }

        .animate-formEntrance {
          animation: formEntrance 0.8s ease-out forwards;
        }

        .animate-iframeFadeIn {
          animation: iframeFadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </section>
  );
};

export default ResumeEmbed;