import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import SEO from '../Components/SEO';
import { resourcesArticles } from '../data/resourcesData';
import { Clock, Calendar, ArrowLeft, User, Share2, Sparkles, BookOpen } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const ResourceDetail = () => {
  const { slug } = useParams();
  const article = resourcesArticles.find((a) => a.slug === slug);

  if (!article) {
    return <Navigate to="/resources" replace />;
  }

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Article link copied to clipboard!");
    }
  };

  const otherArticles = resourcesArticles.filter((a) => a.slug !== slug).slice(0, 2);

  return (
    <MainLayout>
      <SEO 
        title={`${article.title} | Code-A-Nova Resources`}
        description={article.summary}
        canonicalUrl={`https://code-a-nova.online/resources/${article.slug}`}
        schema={{
          "@context": "https://schema.org",
          "@type": "TechArticle",
          "headline": article.title,
          "description": article.summary,
          "author": {
            "@type": "Organization",
            "name": "Code-A-Nova"
          },
          "publisher": {
            "@type": "Organization",
            "name": "Code-A-Nova",
            "logo": {
              "@type": "ImageObject",
              "url": "https://code-a-nova.online/LOGO.png"
            }
          },
          "datePublished": "2026-09-01",
          "dateModified": "2026-09-03"
        }}
      />
      <Toaster position="top-right" />

      <article className="pt-32 pb-24 md:pt-40 md:pb-32 bg-[#FAFAFA] min-h-screen relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-blue-100/40 to-indigo-100/30 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 relative z-10">
          
          {/* Back Navigation */}
          <div className="mb-8">
            <Link
              to="/resources"
              className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Back to Knowledge Hub</span>
            </Link>
          </div>

          {/* Article Header Card */}
          <div className="bg-white border border-gray-100 rounded-3xl p-7 sm:p-12 shadow-sm mb-10">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <span className="text-xs font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-100">
                {article.category}
              </span>
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                title="Share Article"
              >
                <Share2 size={13} />
                <span>Share</span>
              </button>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-[1.2] mb-6">
              {article.title}
            </h1>

            <p className="text-gray-600 text-base sm:text-lg leading-relaxed font-medium mb-8 pb-8 border-b border-gray-100">
              {article.summary}
            </p>

            {/* Metadata Bar */}
            <div className="flex flex-wrap items-center gap-6 text-xs text-gray-500 font-semibold">
              <div className="flex items-center gap-2">
                <User size={15} className="text-blue-600" />
                <span>{article.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={15} className="text-purple-600" />
                <span>{article.readTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={15} className="text-emerald-600" />
                <span>Updated {article.lastUpdated}</span>
              </div>
            </div>
          </div>

          {/* Article Main Content */}
          <div className="bg-white border border-gray-100 rounded-3xl p-7 sm:p-12 shadow-sm space-y-10 mb-12">
            {article.content.map((sec, idx) => (
              <section key={idx} className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  {sec.heading}
                </h2>
                <div className="text-gray-700 text-sm sm:text-base leading-relaxed font-normal whitespace-pre-line space-y-3">
                  {sec.body}
                </div>
              </section>
            ))}

            {/* Editorial Footer Note */}
            <div className="pt-8 border-t border-gray-100 bg-slate-50/70 p-6 rounded-2xl border border-slate-100 text-xs text-gray-600 leading-relaxed font-medium">
              <strong className="text-gray-900 font-bold block mb-1">About this guide:</strong>
              This resource was authored by Code-A-Nova engineers and mentors to provide practical technical insights. We continually review and update our technical publications to align with current industry standards.
            </div>
          </div>

          {/* Related Articles */}
          {otherArticles.length > 0 && (
            <div className="pt-6">
              <h3 className="text-xl font-black text-gray-900 mb-6">Related Technical Guides</h3>
              <div className="grid sm:grid-cols-2 gap-6">
                {otherArticles.map((rel) => (
                  <Link
                    key={rel.slug}
                    to={`/resources/${rel.slug}`}
                    className="p-6 bg-white border border-gray-100 rounded-2xl shadow-2xs hover:shadow-md hover:border-blue-200 transition-all block group"
                  >
                    <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full inline-block mb-3">
                      {rel.category}
                    </span>
                    <h4 className="text-base font-black text-gray-900 group-hover:text-blue-600 transition-colors mb-2 leading-snug">
                      {rel.title}
                    </h4>
                    <span className="text-xs text-gray-500 font-medium">{rel.readTime}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
      </article>
    </MainLayout>
  );
};

export default ResourceDetail;
