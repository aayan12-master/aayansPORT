'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import HandDrawnFrame from './HandDrawnFrame';
import ResponsiveImage from './ResponsiveImage';
import { RESEARCH_CATEGORIES } from '@/lib/categories';

interface ResearchPost {
  id: number | string;
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
  image_url?: string;
}

/**
 * Detects if a research post links to an external publication (e.g. Medium)
 */
function isMediumArticle(post?: ResearchPost | null): boolean {
  if (!post?.external_url) return false;
  const url = post.external_url.toLowerCase();
  return (
    url.includes('medium.com') ||
    url.includes('towardsdatascience') ||
    url.includes('infosecwriteups') ||
    url.includes('plainenglish.io') ||
    url.includes('betterprogramming.pub') ||
    url.includes('itnext.io') ||
    url.includes('uxdesign.cc') ||
    url.includes('levelup.gitconnected.com')
  );
}

/**
 * Extracts a clean, sanitized plain-text excerpt (approx 2-4 sentences, max 300 characters).
 * Strips raw markdown images, code blocks, headings, lists, HTML tags, and trailing ellipses.
 */
function getCleanExcerpt(content?: string, summary?: string, maxChars: number = 300): string {
  let raw = '';
  if (content && content.trim().length > 0) {
    raw = content;
  } else if (summary && summary.trim().length > 0) {
    raw = summary;
  }

  if (!raw) return '';

  // 1. Strip Markdown images: ![alt](url)
  raw = raw.replace(/!\[.*?\]\([^)]*\)/g, '');
  // 2. Strip raw image URLs
  raw = raw.replace(/https?:\/\/\S+\.(?:png|jpg|jpeg|gif|webp|svg)(?:\?\S*)?/gi, '');
  // 3. Strip code blocks: ```code```
  raw = raw.replace(/```[\s\S]*?```/g, '');
  // 4. Strip inline code: `code`
  raw = raw.replace(/`([^`]+)`/g, '$1');
  // 5. Strip HTML tags
  raw = raw.replace(/<[^>]+>/g, '');
  // 6. Strip Markdown headings
  raw = raw.replace(/^#{1,6}\s+.*$/gm, '');
  // 7. Strip Markdown blockquotes (> text)
  raw = raw.replace(/^>\s*/gm, '');
  // 8. Strip Markdown links: [text](url) -> text
  raw = raw.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
  // 9. Strip bold / italics formatting
  raw = raw.replace(/(\*\*|__)(.*?)\1/g, '$2');
  raw = raw.replace(/(\*|_)(.*?)\1/g, '$2');
  // 10. Strip bullet / numbering lists
  raw = raw.replace(/^[\s*•\-–]+\s*/gm, '');
  raw = raw.replace(/^\d+\.\s+/gm, '');
  // 11. Decode HTML entities
  raw = raw
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');

  // 12. Split into meaningful paragraphs, take opening paragraph(s)
  const paragraphs = raw
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 25);

  let cleaned = '';
  if (paragraphs.length > 0) {
    cleaned = paragraphs.slice(0, 2).join(' ');
  } else {
    cleaned = summary || raw;
  }

  // Collapse multiple whitespaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  // Strip trailing incomplete ellipsis or dots from Medium
  cleaned = cleaned.replace(/[\s.…]+$/, '');

  // If still empty or too short, fallback to cleaned summary
  if (!cleaned && summary) {
    cleaned = summary
      .replace(/!\[.*?\]\([^)]*\)/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/[\s.…]+$/, '');
  }

  if (!cleaned) return '';

  if (cleaned.length <= maxChars) {
    return /[.!?]$/.test(cleaned) ? cleaned : `${cleaned}.`;
  }

  // Find a clean sentence break before maxChars
  const truncated = cleaned.slice(0, maxChars);
  const sentenceEnd = truncated.lastIndexOf('. ');
  if (sentenceEnd > 140) {
    return truncated.slice(0, sentenceEnd + 1);
  }

  // Otherwise break at word boundary and append ellipsis
  const wordEnd = truncated.lastIndexOf(' ');
  if (wordEnd > 100) {
    return `${truncated.slice(0, wordEnd).replace(/[,;:\s]+$/, '')}...`;
  }

  return `${truncated.replace(/[,;:\s]+$/, '')}...`;
}

export interface ResearchSectionProps {
  initialPosts?: any[] | null;
}

export default function ResearchSection({ initialPosts }: ResearchSectionProps = {}) {
  const [posts, setPosts] = useState<ResearchPost[]>(() => (initialPosts as ResearchPost[]) || []);
  const [loading, setLoading] = useState(!initialPosts);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [activePost, setActivePost] = useState<ResearchPost | null>(null);

  // Horizontal filter scrolling state & ref
  const filterScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    if (initialPosts) {
      setPosts(initialPosts as ResearchPost[]);
      setLoading(false);
      return;
    }

    fetch('/api/research')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.research) {
          setPosts(data.research);
        }
      })
      .catch((err) => console.error('Error fetching research:', err))
      .finally(() => setLoading(false));
  }, [initialPosts]);

  // 1. Calculate article count per category dynamically from published posts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const post of posts) {
      const cat = post.category?.trim();
      if (cat) {
        counts[cat] = (counts[cat] || 0) + 1;
      }
    }
    return counts;
  }, [posts]);

  // 2. Data-driven categories: only categories that have at least 1 published article
  // ALL filter is permanently visible
  const availableCategories = useMemo(() => {
    const activeCats = Object.keys(categoryCounts);
    activeCats.sort((a, b) => {
      const idxA = (RESEARCH_CATEGORIES as readonly string[]).indexOf(a);
      const idxB = (RESEARCH_CATEGORIES as readonly string[]).indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
    return ['ALL', ...activeCats];
  }, [categoryCounts]);

  // Update horizontal filter scroll controls state
  const updateScrollState = useCallback(() => {
    const el = filterScrollRef.current;
    if (!el) return;
    const hasOverflow = el.scrollWidth > el.clientWidth + 2;
    const isAtStart = el.scrollLeft <= 2;
    const isAtEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;

    setCanScrollLeft(hasOverflow && !isAtStart);
    setCanScrollRight(hasOverflow && !isAtEnd);
  }, []);

  useEffect(() => {
    const el = filterScrollRef.current;
    if (!el) return;

    updateScrollState();

    const handleResize = () => updateScrollState();
    window.addEventListener('resize', handleResize);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        updateScrollState();
      });
      observer.observe(el);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (observer) observer.disconnect();
    };
  }, [updateScrollState, availableCategories]);

  const handleScrollLeft = () => {
    const el = filterScrollRef.current;
    if (!el) return;
    const distance = Math.max(el.clientWidth * 0.6, 200);
    el.scrollBy({ left: -distance, behavior: 'smooth' });
  };

  const handleScrollRight = () => {
    const el = filterScrollRef.current;
    if (!el) return;
    const distance = Math.max(el.clientWidth * 0.6, 200);
    el.scrollBy({ left: distance, behavior: 'smooth' });
  };

  // Reset selected category to ALL if selected category is no longer available
  useEffect(() => {
    if (selectedCategory !== 'ALL' && !availableCategories.includes(selectedCategory)) {
      setSelectedCategory('ALL');
    }
  }, [availableCategories, selectedCategory]);

  const filteredPosts = selectedCategory === 'ALL'
    ? posts
    : posts.filter((p) => p.category?.trim().toLowerCase() === selectedCategory.toLowerCase());

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
        </div>

        {/* Category Filter Tabs - Single Row Horizontal Scroll with Navigation Chevrons */}
        <div className="relative flex items-center gap-2 mt-6 font-mono text-xs w-full max-w-full">
          {/* Static Filter Label */}
          <span className="text-[#5A5650] shrink-0 select-none mr-1">
            // FILTER:
          </span>

          {/* Left Navigation Chevron (<<) */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={handleScrollLeft}
              aria-label="Scroll filters left"
              title="Scroll filters left"
              className="shrink-0 h-[31px] px-2.5 flex items-center justify-center border border-[#171514] bg-[#171514] text-[#ECE8DF] hover:bg-[#DF491E] hover:text-[#171514] font-mono text-xs font-bold transition-colors cursor-pointer select-none focus:outline-hidden focus:ring-1 focus:ring-[#DF491E]"
            >
              &lt;&lt;
            </button>
          )}

          {/* Single-row horizontal scroll container */}
          <div
            ref={filterScrollRef}
            onScroll={updateScrollState}
            className="flex-1 min-w-0 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {availableCategories.map((cat) => {
              const isSelected = selectedCategory === cat;
              const count = cat === 'ALL' ? posts.length : categoryCounts[cat] || 0;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={(e) => {
                    setSelectedCategory(cat);
                    e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
                  }}
                  className={`shrink-0 px-3 py-1.5 border transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#171514] text-[#ECE8DF] border-[#171514] font-bold'
                      : 'bg-[#ECE8DF] text-[#171514] border-[#171514]/40 hover:border-[#171514]'
                  }`}
                >
                  <span>{cat}</span>{' '}
                  <span className={`text-[11px] font-normal ${isSelected ? 'text-[#ECE8DF]/80' : 'text-[#5A5650]'}`}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Navigation Chevron (>>) */}
          {canScrollRight && (
            <button
              type="button"
              onClick={handleScrollRight}
              aria-label="Scroll filters right"
              title="Scroll filters right"
              className="shrink-0 h-[31px] px-2.5 flex items-center justify-center border border-[#171514] bg-[#171514] text-[#ECE8DF] hover:bg-[#DF491E] hover:text-[#171514] font-mono text-xs font-bold transition-colors cursor-pointer select-none focus:outline-hidden focus:ring-1 focus:ring-[#DF491E]"
            >
              &gt;&gt;
            </button>
          )}
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

                  {post.image_url && (
                    <div className="mb-4 border border-[#171514] overflow-hidden">
                      <ResponsiveImage
                        src={post.image_url}
                        alt={post.title}
                        aspectRatio="16/9"
                        fit="cover"
                        focalPoint="center"
                      />
                    </div>
                  )}

                  <h3 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#171514] group-hover:text-[#DF491E] transition-colors mb-3 leading-snug">
                    {post.title}
                  </h3>

                  <p className="font-sans text-xs sm:text-sm text-[#5A5650] leading-relaxed mb-4">
                    {getCleanExcerpt(post.content, post.summary, 300)}
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
                className="font-mono text-base font-bold px-3 py-1 bg-[#171514] text-[#ECE8DF] hover:bg-[#DF491E] transition-colors ml-4 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-6 font-sans text-sm sm:text-base text-[#171514] leading-relaxed">
              {activePost.image_url && (
                <div className="border-2 border-[#171514] overflow-hidden">
                  <ResponsiveImage
                    src={activePost.image_url}
                    alt={activePost.title}
                    aspectRatio="21/9"
                    fit="cover"
                    focalPoint="center"
                  />
                </div>
              )}

              {isMediumArticle(activePost) ? (
                <div className="space-y-5">
                  <div className="border-l-3 border-[#DF491E] pl-4 italic text-[#5A5650] bg-[#F2EFE7] p-4 text-sm sm:text-base leading-relaxed">
                    {getCleanExcerpt(activePost.content, activePost.summary, 300)}
                  </div>

                  <div className="border-2 border-dashed border-[#171514]/30 bg-[#F2EFE7]/80 p-5 font-mono text-xs space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-[#DF491E] uppercase tracking-wider">
                        // FULL TECHNICAL ARTICLE ON MEDIUM
                      </span>
                      <span className="text-[10px] text-[#5A5650]">EXTERNAL PUBLICATION</span>
                    </div>
                    <p className="font-sans text-xs sm:text-sm text-[#171514] leading-relaxed">
                      This complete research advisory and practical tutorial is published externally on Medium. Read the full step-by-step breakdown, commands, configuration files, and deep-dive methodology directly on the publication.
                    </p>
                    <div className="pt-1">
                      <a
                        href={activePost.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 font-mono text-xs font-bold px-4 py-2.5 bg-[#DF491E] text-[#171514] border-2 border-[#171514] hover:bg-[#c73e16] transition-colors cursor-pointer"
                      >
                        <span>READ FULL ARTICLE ON MEDIUM</span>
                        <span>↗</span>
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <>
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
                </>
              )}

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
                {activePost.external_url && !isMediumArticle(activePost) && (
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
