'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { GitHubTool } from '@/lib/github';

export default function ToolsSection() {
  const [tools, setTools] = useState<GitHubTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [githubUser, setGithubUser] = useState<string>('aayan12-master');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTool, setActiveTool] = useState<GitHubTool | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTools = async (forceRefresh = false) => {
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const url = `/api/tools${forceRefresh ? '?refresh=true' : ''}`;
      const res = await fetch(url);
      const data = await res.json();

      if (res.ok && data.success && Array.isArray(data.tools)) {
        setTools(data.tools);
        if (data.username) setGithubUser(data.username);
      } else {
        setError(data.error || 'Failed to fetch arsenal tools from Supabase.');
      }
    } catch (err: any) {
      console.error('Error fetching tools from /api/tools:', err);
      setError('Network communication failure connecting to portfolio database.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTools();
  }, []);

  // 1. Calculate dynamic category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const tool of tools) {
      const cat = tool.category?.trim() || 'Security Tooling';
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [tools]);

  // 2. Data-driven categories list with ALL
  const availableCategories = useMemo(() => {
    const cats = Object.keys(categoryCounts).sort();
    return ['ALL', ...cats];
  }, [categoryCounts]);

  // Horizontal filter scrolling state & ref
  const filterScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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

  // Reset selected category to ALL if selected category is no longer present
  useEffect(() => {
    if (selectedCategory !== 'ALL' && !availableCategories.includes(selectedCategory)) {
      setSelectedCategory('ALL');
    }
  }, [availableCategories, selectedCategory]);

  // 3. Search & Filter logic
  const filteredTools = useMemo(() => {
    let result = tools;

    if (selectedCategory !== 'ALL') {
      result = result.filter(
        (t) => (t.category || '').toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter((t) => {
        const nameMatch = (t.name || '').toLowerCase().includes(query);
        const descMatch = (t.description || '').toLowerCase().includes(query);
        const excerptMatch = (t.readme_excerpt || '').toLowerCase().includes(query);
        const langMatch = (t.language || '').toLowerCase().includes(query);
        const topicMatch = (t.topics || []).some((topic) => topic.toLowerCase().includes(query));
        return nameMatch || descMatch || excerptMatch || langMatch || topicMatch;
      });
    }

    return result;
  }, [tools, selectedCategory, searchQuery]);

  const getLanguageColor = (lang: string) => {
    switch (lang.toLowerCase()) {
      case 'shell':
      case 'bash':
        return 'bg-[#10B981]';
      case 'python':
        return 'bg-[#3B82F6]';
      case 'go':
      case 'golang':
        return 'bg-[#06B6D4]';
      case 'rust':
        return 'bg-[#DF491E]';
      case 'typescript':
      case 'javascript':
        return 'bg-[#F59E0B]';
      case 'c':
      case 'c++':
        return 'bg-[#8B5CF6]';
      default:
        return 'bg-[#6B7280]';
    }
  };

  return (
    <section className="relative w-full min-h-screen bg-[#ECE8DF] text-[#171514] p-6 sm:p-10 lg:p-12 border-t-2 border-[#171514]">
      {/* Corner Registration Crosses */}
      <div className="absolute top-5 left-5 font-mono text-2xl font-light text-[#171514] select-none pointer-events-none">
        +
      </div>
      <div className="absolute top-5 right-5 font-mono text-2xl font-light text-[#171514] select-none pointer-events-none">
        +
      </div>

      {/* Section Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="border-b-2 border-[#171514] pb-4">
          <div className="font-mono text-xs font-semibold tracking-widest text-[#DF491E] mb-1">
            // DOSSIER SECTION 04
          </div>
          <h2 className="font-display text-5xl sm:text-6xl font-extrabold tracking-tight text-[#171514]">
            OFFENSIVE TOOLING &amp; ARSENAL
          </h2>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-8">

        {/* Search & Category Filter Controls */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Real-time Search Input */}
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#5A5650] font-mono text-xs">
                //
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tools by name, description, language..."
                className="w-full pl-8 pr-8 py-2 bg-[#F2EFE7] border-2 border-[#171514] text-[#171514] placeholder-[#5A5650] font-mono text-xs outline-none focus:border-[#DF491E] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#5A5650] hover:text-[#171514] cursor-pointer font-mono text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Accurate Count Status */}
            <div className="font-mono text-xs text-[#5A5650] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10B981]" />
              <span>
                SHOWING {filteredTools.length} OF {tools.length} ARSENAL TOOLS
              </span>
            </div>
          </div>

          {/* Category Filter Tabs - Single Row Horizontal Scroll with Navigation Chevrons */}
          <div className="relative flex items-center gap-2 pt-1 font-mono text-xs w-full max-w-full">
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
                const count = cat === 'ALL' ? tools.length : categoryCounts[cat] || 0;
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

        {/* Main Tools View (Loading / Error / Empty / Grid) */}
        {loading ? (
          <div className="font-mono text-sm text-[#5A5650] py-16 flex items-center justify-center gap-2 border-2 border-dashed border-[#171514]/30 bg-[#F2EFE7]/50">
            <span className="animate-spin text-[#DF491E]">⟳</span> RETRIEVING PUBLISHED ARSENAL FROM SUPABASE...
          </div>
        ) : error ? (
          <div className="border-2 border-[#DF491E] bg-[#F2EFE7] p-6 sm:p-8 font-mono text-xs space-y-4 shadow-sm">
            <div className="flex items-center gap-2 text-[#DF491E] font-bold text-sm tracking-wider uppercase">
              <span>[!] ARSENAL DATABASE DIAGNOSTIC</span>
            </div>
            <p className="text-[#171514] leading-relaxed font-sans text-sm">{error}</p>
            <div className="text-[#5A5650] text-[11px] leading-relaxed">
              Diagnostic: Tool records and README previews are queried directly from Supabase. Ensure your database connection is active and published tools are available.
            </div>
            <div>
              <button
                onClick={() => fetchTools(true)}
                className="px-4 py-2 bg-[#171514] text-[#ECE8DF] font-bold text-xs uppercase hover:bg-[#DF491E] hover:text-[#171514] transition-colors cursor-pointer"
              >
                RETRY CONNECTION
              </button>
            </div>
          </div>
        ) : filteredTools.length === 0 ? (
          <div className="font-mono text-sm text-[#5A5650] py-16 border-2 border-dashed border-[#171514]/30 bg-[#F2EFE7]/50 p-8 text-center space-y-4">
            <div>No offensive security tools matched current filter or search criteria.</div>
            {(selectedCategory !== 'ALL' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedCategory('ALL');
                  setSearchQuery('');
                }}
                className="font-mono text-xs font-bold px-3 py-1.5 bg-[#171514] text-[#ECE8DF] hover:bg-[#DF491E] transition-colors cursor-pointer"
              >
                CLEAR FILTERS
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredTools.map((tool) => (
              <div
                key={tool.id}
                onClick={() => setActiveTool(tool)}
                className="relative border-2 border-[#171514] bg-[#ECE8DF] p-6 cursor-pointer group hover:-translate-y-1 transition-transform duration-200 shadow-sm flex flex-col justify-between"
              >
                <div>
                  {/* Card Meta Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-[#DF491E] text-[#171514] font-mono text-[10px] font-bold uppercase tracking-wider">
                        {tool.category}
                      </span>
                      {tool.language && (
                        <span className="px-2 py-0.5 bg-[#171514] text-[#ECE8DF] font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${getLanguageColor(tool.language)}`} />
                          {tool.language}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 font-mono text-xs text-[#5A5650]">
                      {tool.stars > 0 && (
                        <span title="GitHub Stars" className="flex items-center gap-0.5">
                          <span className="text-[#DF491E]">★</span> {tool.stars}
                        </span>
                      )}
                      {tool.forks > 0 && (
                        <span title="Forks" className="flex items-center gap-0.5">
                          <span>⑂</span> {tool.forks}
                        </span>
                      )}
                      <span className="px-1.5 py-0.5 bg-[#D7D3CB] text-[#171514] text-[10px] font-bold">
                        {tool.default_branch || 'main'}
                      </span>
                      <span>•</span>
                      <span>{tool.updated_at}</span>
                    </div>
                  </div>

                  {/* Tool Title */}
                  <h3 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#171514] group-hover:text-[#DF491E] transition-colors mb-2 leading-snug">
                    {tool.name}
                  </h3>

                  {/* Summary / Excerpt */}
                  <p className="font-sans text-xs sm:text-sm text-[#5A5650] leading-relaxed mb-4">
                    {tool.readme_excerpt || tool.description}
                  </p>

                  {/* Technical Spec Box */}
                  <div className="text-xs text-[#171514] bg-[#F2EFE7] p-3 border-l-2 border-[#171514] mb-4 font-mono leading-relaxed space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-[#5A5650]">REPOSITORY:</span>
                      <span className="font-bold text-[#171514]">{tool.full_name}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-[#5A5650]">DEFAULT BRANCH:</span>
                      <span>{tool.default_branch}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-[#5A5650]">README STATUS:</span>
                      <span className={tool.readme_status === 'missing' ? 'text-amber-800 font-bold' : 'text-green-800 font-bold'}>
                        {tool.readme_status === 'missing' ? 'NO README (LINK PROVIDED)' : 'SNAPSHOT SAVED'}
                      </span>
                    </div>
                    {tool.license && (
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-[#5A5650]">LICENSE:</span>
                        <span className="text-[#DF491E] font-semibold">{tool.license}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  {/* Topics / Tags */}
                  {tool.topics && tool.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-3 border-t border-[#171514]/20 mb-4 font-mono text-[10px]">
                      {tool.topics.map((topic) => (
                        <span
                          key={topic}
                          className="px-2 py-0.5 bg-[#D7D3CB] text-[#171514] border border-[#171514]/30 font-semibold"
                        >
                          #{topic}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Action Link Row */}
                  <div className="flex items-center justify-between font-mono text-xs font-bold pt-2 border-t border-[#171514]/20">
                    <span className="text-[#171514] group-hover:text-[#DF491E] transition-colors flex items-center gap-1">
                      <span>[ INSPECT TOOL SPEC ]</span>
                      <span>→</span>
                    </span>

                    <a
                      href={tool.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[#DF491E] hover:underline flex items-center gap-1"
                    >
                      <span>[ GITHUB REPO ]</span>
                      <span>↗</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dedicated Tool Details Modal (matches ResearchSection modal styling) */}
      {activeTool && (
        <div className="fixed inset-0 z-50 bg-[#171514]/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-[#ECE8DF] border-3 border-[#171514] p-6 sm:p-8 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b-2 border-[#171514] pb-4 mb-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 font-mono text-xs mb-2">
                  <span className="px-2 py-0.5 bg-[#DF491E] text-[#171514] font-bold text-[10px] tracking-wider uppercase">
                    {activeTool.category}
                  </span>
                  <span className="px-2 py-0.5 bg-[#171514] text-[#ECE8DF] font-bold text-[10px] tracking-wider uppercase flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${getLanguageColor(activeTool.language)}`} />
                    {activeTool.language}
                  </span>
                  {activeTool.license && (
                    <span className="px-2 py-0.5 bg-[#D7D3CB] text-[#171514] font-bold text-[10px] tracking-wider border border-[#171514]">
                      {activeTool.license}
                    </span>
                  )}
                  <span className="text-[#5A5650]">// @{activeTool.full_name}</span>
                </div>

                <h3 className="font-display text-3xl sm:text-4xl font-extrabold text-[#171514] leading-tight">
                  {activeTool.name}
                </h3>
              </div>

              <button
                onClick={() => setActiveTool(null)}
                className="font-mono text-base font-bold px-3 py-1 bg-[#171514] text-[#ECE8DF] hover:bg-[#DF491E] transition-colors ml-4 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-6 font-sans text-sm sm:text-base text-[#171514] leading-relaxed">
              {/* Highlight callout box */}
              <div className="border-l-3 border-[#DF491E] pl-4 italic text-[#5A5650] bg-[#F2EFE7] p-4 text-sm sm:text-base leading-relaxed">
                {activeTool.description || activeTool.readme_excerpt}
              </div>

              {/* Technical Overview & Capabilities Box */}
              <div>
                <h4 className="font-mono text-xs font-bold tracking-widest text-[#DF491E] uppercase mb-2">
                  // REPOSITORY OVERVIEW &amp; CAPABILITIES
                </h4>
                <div className="bg-[#F2EFE7] p-4 border border-[#171514]/30 font-sans text-xs sm:text-sm text-[#171514] leading-relaxed">
                  {activeTool.readme_status === 'missing' ? (
                    <div className="space-y-2 text-[#5A5650] italic">
                      <p>
                        No README document was provided in the source repository.
                      </p>
                      <p className="not-italic text-xs font-mono text-[#171514]">
                        Full source code, branch files, and commit logs remain accessible directly via the repository link below.
                      </p>
                    </div>
                  ) : (
                    <p className="whitespace-pre-line">
                      {activeTool.readme_excerpt || activeTool.description}
                    </p>
                  )}
                </div>
              </div>

              {/* GitHub Publication Box (matches Research Medium box design) */}
              <div className="border-2 border-dashed border-[#171514]/30 bg-[#F2EFE7]/80 p-5 font-mono text-xs space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-[#DF491E] uppercase tracking-wider">
                    // OPEN-SOURCE REPOSITORY ON GITHUB
                  </span>
                  <span className="text-[10px] text-[#5A5650]">PUBLIC SOURCE</span>
                </div>

                <p className="font-sans text-xs sm:text-sm text-[#171514] leading-relaxed">
                  Full codebase, installation guides, automated execution scripts, and release packages are hosted on
                  GitHub. Inspect the complete source code, audit commits, and fork the repository directly.
                </p>

                <div className="pt-1">
                  <a
                    href={activeTool.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 font-mono text-xs font-bold px-4 py-2.5 bg-[#DF491E] text-[#171514] border-2 border-[#171514] hover:bg-[#c73e16] transition-colors cursor-pointer"
                  >
                    <span>VIEW REPOSITORY ON GITHUB</span>
                    <span>↗</span>
                  </a>
                </div>
              </div>

              {/* Topics / Tags */}
              {activeTool.topics && activeTool.topics.length > 0 && (
                <div className="pt-4 border-t border-[#171514]/20">
                  <div className="font-mono text-xs text-[#5A5650] mb-2">// TOOL TOPICS &amp; TAGS</div>
                  <div className="flex flex-wrap gap-2 font-mono text-xs">
                    {activeTool.topics.map((tag) => (
                      <span key={tag} className="px-2.5 py-1 bg-[#D7D3CB] border border-[#171514] text-[#171514]">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t-2 border-[#171514] font-mono text-xs text-[#5A5650]">
                <div>SAVED IN ARSENAL: {activeTool.updated_at}</div>
                <div className="flex items-center gap-3">
                  {activeTool.stars > 0 && (
                    <>
                      <span>★ {activeTool.stars} STARS</span>
                      <span>•</span>
                    </>
                  )}
                  {activeTool.forks > 0 && (
                    <>
                      <span>⑂ {activeTool.forks} FORKS</span>
                      <span>•</span>
                    </>
                  )}
                  <span>DEFAULT BRANCH: {activeTool.default_branch || 'main'}</span>
                  <span>•</span>
                  <span>
                    {activeTool.readme_status === 'missing' ? 'NO README' : 'VERIFIED IN SUPABASE'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
