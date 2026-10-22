'use client';

import React, { useState, useEffect } from 'react';
import HandDrawnFrame from './HandDrawnFrame';

interface ResearchPost {
  id: number;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  severity: string;
  cve_id?: string;
  published_date: string;
  tags: string;
  external_url?: string;
}

export default function ResearchSection() {
  const [posts, setPosts] = useState<ResearchPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [activePost, setActivePost] = useState<ResearchPost | null>(null);

  useEffect(() => {
    fetch('/api/research')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.research) {
          setPosts(data.research);
        }
      })
      .catch((err) => console.error('Error fetching research:', err))
      .finally(() => setLoading(false));
  }, []);

  const categories = ['ALL', 'Web Security', 'Cloud & Recon', 'Cloud Infrastructure', 'Binary & Firmware', 'API Security'];

  const filteredPosts = selectedCategory === 'ALL'
    ? posts
    : posts.filter((p) => p.category.toLowerCase().includes(selectedCategory.toLowerCase()));

  const getSeverityBadge = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return <span className="px-2 py-0.5 bg-[#DF491E] text-[#171514] font-bold text-[10px] tracking-wider uppercase">CRITICAL</span>;
      case 'high':
        return <span className="px-2 py-0.5 bg-[#171514] text-[#ECE8DF] font-bold text-[10px] tracking-wider uppercase">HIGH</span>;
      case 'medium':
        return <span className="px-2 py-0.5 border border-[#171514] text-[#171514] font-bold text-[10px] tracking-wider uppercase">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 border border-[#5A5650] text-[#5A5650] text-[10px] tracking-wider uppercase">{severity}</span>;
    }
  };

  return (
    <section className="relative w-full min-h-screen bg-[#ECE8DF] text-[#171514] p-6 sm:p-10 lg:p-12 border-t-2 border-[#171514]">
      {/* Corner Registration Crosses */}
      <div className="absolute top-5 left-5 font-mono text-2xl font-light text-[#171514] select-none pointer-events-none">+</div>
      <div className="absolute top-5 right-5 font-mono text-2xl font-light text-[#171514] select-none pointer-events-none">+</div>

      {/* Section Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-2 border-[#171514] pb-4">
          <div>
            <div className="font-mono text-xs font-semibold tracking-widest text-[#DF491E] mb-1">
              // DOSSIER SECTION 03
            </div>
            <h2 className="font-display text-5xl sm:text-6xl font-extrabold tracking-tight text-[#171514]">
              SECURITY RESEARCH &amp; ADVISORIES
            </h2>
          </div>
          <div className="font-mono text-xs text-[#5A5650]">
            <div>DISCLOSED FINDINGS &amp; PROTOCOL ANALYSES</div>
            <div>VERIFIED ARCHIVE // v1.0</div>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-6 font-mono text-xs">
          <span className="text-[#5A5650] mr-2">// FILTER:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 border transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#171514] text-[#ECE8DF] border-[#171514] font-bold'
                  : 'bg-[#ECE8DF] text-[#171514] border-[#171514]/40 hover:border-[#171514]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Research Posts Grid */}
      <div className="max-w-6xl mx-auto">
        {loading ? (
          <div className="font-mono text-sm text-[#5A5650] py-12 flex items-center gap-2">
            <span className="animate-spin text-[#DF491E]">⟳</span> RETRIEVING DOSSIER ADVISORIES...
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="font-mono text-sm text-[#5A5650] py-12 border border-dashed border-[#171514] p-8 text-center">
            No research advisories matched current filter criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => setActivePost(post)}
                className="relative border-2 border-[#171514] bg-[#ECE8DF] p-6 cursor-pointer group hover:-translate-y-1 transition-transform duration-200 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 font-mono text-xs">
                      {getSeverityBadge(post.severity)}
                      {post.cve_id && (
                        <span className="px-2 py-0.5 bg-[#D7D3CB] text-[#171514] font-bold text-[10px] tracking-wider border border-[#171514]">
                          {post.cve_id}
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-xs text-[#5A5650]">{post.published_date}</span>
                  </div>

                  <h3 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#171514] group-hover:text-[#DF491E] transition-colors mb-3 leading-snug">
                    {post.title}
                  </h3>

                  <p className="font-sans text-xs sm:text-sm text-[#5A5650] leading-relaxed mb-4">
                    {post.summary}
                  </p>
                </div>

                <div>
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-4 border-t border-[#171514]/20 mb-4 font-mono text-[10px]">
                    {post.tags.split(',').map((tag) => (
                      <span key={tag} className="px-2 py-0.5 bg-[#D7D3CB]/60 text-[#171514]">
                        #{tag.trim()}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between font-mono text-xs font-bold text-[#171514] group-hover:text-[#DF491E]">
                    <span>[ READ FULL ADVISORY ]</span>
                    <span className="text-sm">→</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reading Modal for Selected Post */}
      {activePost && (
        <div className="fixed inset-0 z-50 bg-[#171514]/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-[#ECE8DF] border-3 border-[#171514] p-6 sm:p-8 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b-2 border-[#171514] pb-4 mb-6">
              <div>
                <div className="flex items-center gap-2 font-mono text-xs mb-2">
                  {getSeverityBadge(activePost.severity)}
                  {activePost.cve_id && (
                    <span className="px-2 py-0.5 bg-[#D7D3CB] text-[#171514] font-bold text-[10px] tracking-wider border border-[#171514]">
                      {activePost.cve_id}
                    </span>
                  )}
                  <span className="text-[#5A5650]">// {activePost.category}</span>
                </div>
                <h3 className="font-display text-3xl sm:text-4xl font-extrabold text-[#171514] leading-tight">
                  {activePost.title}
                </h3>
              </div>
              <button
                onClick={() => setActivePost(null)}
                className="font-mono text-base font-bold px-3 py-1 bg-[#171514] text-[#ECE8DF] hover:bg-[#DF491E] transition-colors ml-4"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-6 font-sans text-sm sm:text-base text-[#171514] leading-relaxed">
              <div className="border-l-3 border-[#DF491E] pl-4 italic text-[#5A5650] bg-[#F2EFE7] p-3">
                {activePost.summary}
              </div>

              <div>
                <h4 className="font-mono text-xs font-bold tracking-widest text-[#DF491E] uppercase mb-2">
                  // TECHNICAL BREAKDOWN &amp; VULNERABILITY CONTEXT
                </h4>
                <p className="whitespace-pre-line leading-relaxed text-[#171514]">
                  {activePost.content}
                </p>
              </div>

              {/* Tags */}
              <div className="pt-4 border-t border-[#171514]/20">
                <div className="font-mono text-xs text-[#5A5650] mb-2">// ADVISORY TAGS</div>
                <div className="flex flex-wrap gap-2 font-mono text-xs">
                  {activePost.tags.split(',').map((tag) => (
                    <span key={tag} className="px-2.5 py-1 bg-[#D7D3CB] border border-[#171514] text-[#171514]">
                      #{tag.trim()}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t-2 border-[#171514]">
                <div className="font-mono text-xs text-[#5A5650]">
                  PUBLISHED: {activePost.published_date}
                </div>
                {activePost.external_url && (
                  <a
                    href={activePost.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs font-bold px-4 py-2 bg-[#DF491E] text-[#171514] border border-[#171514] hover:bg-[#c73e16] transition-colors flex items-center gap-2"
                  >
                    <span>EXTERNAL REPOSITORY</span>
                    <span>↗</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
