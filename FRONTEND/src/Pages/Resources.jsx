import React, { useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import SEO from '../Components/SEO';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from '../animations/variants';
import { resourcesArticles } from '../data/resourcesData';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, Calendar, ArrowRight, Search, Sparkles } from 'lucide-react';

const categories = ["All", "Architecture", "Career & Learning", "Artificial Intelligence", "Performance"];

const Resources = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredArticles = resourcesArticles.filter(article => {
    const matchesCategory = selectedCategory === "All" || article.category === selectedCategory;
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          article.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <MainLayout>
      <SEO 
        title="Technical Resources & Engineering Insights | Code-A-Nova"
        description="Practical engineering guides, web architecture patterns, career roadmaps, and AI implementation best practices curated by the Code-A-Nova team."
        canonicalUrl="https://code-a-nova.online/resources"
      />

      <div className="pt-32 pb-24 md:pt-40 md:pb-32 bg-[#FAFAFA] min-h-screen relative overflow-hidden">
        {/* Subtle Background Glows */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-blue-100/50 to-indigo-100/40 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 left-10 w-96 h-96 bg-purple-100/40 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          
          {/* Header */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-center max-w-3xl mx-auto mb-14"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200/70 text-blue-700 font-bold text-xs uppercase tracking-wider mb-4 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Technical Knowledge Hub
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight mb-5">
              Engineering Insights & <br className="hidden sm:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                Practical Learning
              </span>
            </h1>
            <p className="text-gray-600 text-base sm:text-lg font-medium leading-relaxed">
              Curated technical blueprints, modern architectural patterns, and career preparation guides written by our engineers and mentors.
            </p>
          </motion.div>

          {/* Search & Category Filter Bar */}
          <div className="max-w-4xl mx-auto mb-12 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Category Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-gray-900 text-white shadow-md shadow-gray-900/10"
                      : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
              />
            </div>
          </div>

          {/* Articles Grid */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto"
          >
            {filteredArticles.map((article, idx) => (
              <motion.article
                key={article.slug}
                variants={fadeUp}
                className="bg-white border border-gray-100 rounded-3xl p-7 sm:p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                      {article.category}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                      <Clock size={14} />
                      <span>{article.readTime}</span>
                    </div>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-3 group-hover:text-blue-600 transition-colors leading-snug">
                    <Link to={`/resources/${article.slug}`}>
                      {article.title}
                    </Link>
                  </h2>

                  <p className="text-gray-600 text-sm leading-relaxed mb-6 font-medium">
                    {article.summary}
                  </p>
                </div>

                <div className="pt-5 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                    <Calendar size={14} />
                    <span>{article.lastUpdated}</span>
                  </div>

                  <Link
                    to={`/resources/${article.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 group-hover:text-blue-700 transition-colors"
                  >
                    <span>Read Guide</span>
                    <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </motion.article>
            ))}
          </motion.div>

          {filteredArticles.length === 0 && (
            <div className="text-center py-16">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium text-base">No articles found matching your criteria.</p>
            </div>
          )}

        </div>
      </div>
    </MainLayout>
  );
};

export default Resources;
