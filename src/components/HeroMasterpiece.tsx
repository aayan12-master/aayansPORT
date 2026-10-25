'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Image from 'next/image';
import HandDrawnButton from './HandDrawnButton';
import HandDrawnFrame from './HandDrawnFrame';

import type { HeroContent, HeroSpotlightMessage } from '@/lib/cms';
import InlineEditable from './admin/InlineEditable';

export interface HeroMasterpieceProps {
  onViewResearch: () => void;
  onCollaborate: () => void;
  initialHero?: HeroContent | null;
  projectsCount?: number;
  writeupsCount?: number;
  isEditingMode?: boolean;
  heroOverride?: HeroContent | null;
  onHeroChange?: (field: keyof HeroContent, value: any) => void;
  onOpenHeroDrawer?: () => void;
}

export default function HeroMasterpiece({
  onViewResearch,
  onCollaborate,
  initialHero,
  projectsCount,
  writeupsCount,
  isEditingMode = false,
  heroOverride,
  onHeroChange,
  onOpenHeroDrawer,
}: HeroMasterpieceProps) {
  const [liveProjectsCount, setLiveProjectsCount] = useState<number>(() =>
    typeof projectsCount === 'number' ? projectsCount : 0
  );
  const [liveWriteupsCount, setLiveWriteupsCount] = useState<number>(() =>
    typeof writeupsCount === 'number' ? writeupsCount : 0
  );

  const [hero, setHero] = useState<HeroContent>(() => ({
    id: initialHero?.id || 'current',
    brand_name: initialHero?.brand_name || 'AAYAN.',
    headline: initialHero?.headline || 'SECURITY RESEARCHER & PENTESTER',
    manifesto_line_1: initialHero?.manifesto_line_1 || 'EXPLORING SYSTEMS.',
    manifesto_line_2: initialHero?.manifesto_line_2 || 'FINDING FLAWS.',
    manifesto_line_3: initialHero?.manifesto_line_3 || 'CREATING IMPACT.',
    status_label: initialHero?.status_label || 'OPEN FOR COLLABORATION',
    status_subtext: initialHero?.status_subtext || 'Research • Bug Bounty • Projects',
    stat_projects: initialHero?.stat_projects || '10+',
    stat_writeups: initialHero?.stat_writeups || '5+',
    stat_curiosity: initialHero?.stat_curiosity || '∞',
    quote: initialHero?.quote || 'CURIOSITY ALWAYS FINDS A WAY IN.',
    cta_text: initialHero?.cta_text || 'VIEW MY RESEARCH',
    cta_target: initialHero?.cta_target || 'research',
    descriptor_1: initialHero?.descriptor_1 || '[ OFFENSIVE SECURITY ]',
    descriptor_2: initialHero?.descriptor_2 || '[ WEB / MOBILE / CLOUD ]',
    descriptor_3: initialHero?.descriptor_3 || '[ RESEARCH • EXPLOIT • BUILD ]',
    wordmark_prefix: initialHero?.wordmark_prefix || 'AAYAN',
    wordmark_suffix: initialHero?.wordmark_suffix || '.Sec',
    role_title: initialHero?.role_title || 'SECURITY RESEARCHER / PENTESTER',
    stat_1_label: initialHero?.stat_1_label || 'PROJECTS',
    stat_2_label: initialHero?.stat_2_label || 'WRITE-UPS',
    stat_3_label: initialHero?.stat_3_label || 'CURIOSITY',
    stat_1_override: initialHero?.stat_1_override || '',
    stat_2_override: initialHero?.stat_2_override || '',
    stat_1_enabled: initialHero?.stat_1_enabled !== false,
    stat_2_enabled: initialHero?.stat_2_enabled !== false,
    stat_3_enabled: initialHero?.stat_3_enabled !== false,
    spotlight_enabled: Boolean(initialHero?.spotlight_enabled),
    spotlight_mode: initialHero?.spotlight_mode || 'alternate',
    spotlight_auto_rotate: initialHero?.spotlight_auto_rotate !== false,
    spotlight_title: initialHero?.spotlight_title || 'OPEN FOR COLLABORATION',
    spotlight_subtitle: initialHero?.spotlight_subtitle || 'Web Security • Authorized Penetration Testing',
    spotlight_cta_text: initialHero?.spotlight_cta_text || 'INITIATE CONTACT →',
    spotlight_cta_url: initialHero?.spotlight_cta_url || '#collaborate',
    spotlight_messages: initialHero?.spotlight_messages || [],
  }));

  const currentHero = heroOverride || hero;

  // Accessibility: detect reduced motion preference
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  const isSpotlightEnabled = Boolean(currentHero.spotlight_enabled);
  const spotlightMode = currentHero.spotlight_mode || 'alternate';
  const autoRotate = currentHero.spotlight_auto_rotate !== false && !prefersReducedMotion;

  const [activeView, setActiveView] = useState<'stats' | 'spotlight'>(() => {
    if (currentHero.spotlight_enabled && currentHero.spotlight_mode === 'spotlight_only') {
      return 'spotlight';
    }
    return 'stats';
  });
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const enabledMessages: HeroSpotlightMessage[] = useMemo(() => {
    const list = Array.isArray(currentHero.spotlight_messages) ? currentHero.spotlight_messages : [];
    return list.filter((m) => m && m.enabled !== false);
  }, [currentHero.spotlight_messages]);

  useEffect(() => {
    if (!isSpotlightEnabled || spotlightMode === 'stats_only') {
      setActiveView('stats');
    } else if (spotlightMode === 'spotlight_only') {
      setActiveView('spotlight');
    }
  }, [isSpotlightEnabled, spotlightMode]);

  const [rotationTrigger, setRotationTrigger] = useState(0);

  const resetAutoRotateTimer = useCallback(() => {
    setRotationTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!isSpotlightEnabled || spotlightMode !== 'alternate' || !autoRotate || isPaused) {
      return;
    }

    const interval = setInterval(() => {
      setActiveView((prev) => {
        if (prev === 'stats') {
          return 'spotlight';
        } else {
          if (enabledMessages.length > 1) {
            setCurrentMessageIndex((idx) => (idx + 1) % enabledMessages.length);
          }
          return 'stats';
        }
      });
    }, 7000);

    return () => clearInterval(interval);
  }, [isSpotlightEnabled, spotlightMode, autoRotate, isPaused, enabledMessages.length, rotationTrigger]);

  const activeMessage = enabledMessages[currentMessageIndex] || null;
  const spotlightTitle = activeMessage?.title || currentHero.spotlight_title || 'OPEN FOR COLLABORATION';
  const spotlightSubtitle = activeMessage?.subtitle || currentHero.spotlight_subtitle || 'Web Security • Authorized Penetration Testing';
  const spotlightBadge = activeMessage?.badge || '// SPOTLIGHT';
  const spotlightCtaText = activeMessage?.cta_text ?? (currentHero.spotlight_cta_text || 'INITIATE CONTACT →');
  const spotlightCtaUrl = activeMessage?.cta_url || currentHero.spotlight_cta_url || '#collaborate';

  const stat1Enabled = currentHero.stat_1_enabled !== false;
  const stat2Enabled = currentHero.stat_2_enabled !== false;
  const stat3Enabled = currentHero.stat_3_enabled !== false;

  interface PromoContentSnapshot {
    key: string;
    view: 'stats' | 'spotlight';
    messageIndex: number;
    spotlightTitle: string;
    spotlightSubtitle: string;
    spotlightCtaText?: string;
    spotlightCtaUrl?: string;
  }

  const currentContentKey = activeView === 'stats' ? 'stats' : `spotlight-${currentMessageIndex}`;

  const initialSnapshot: PromoContentSnapshot = {
    key: currentContentKey,
    view: activeView,
    messageIndex: currentMessageIndex,
    spotlightTitle,
    spotlightSubtitle,
    spotlightCtaText,
    spotlightCtaUrl,
  };

  const [displayContent, setDisplayContent] = useState<PromoContentSnapshot>(() => initialSnapshot);
  const [outgoingContent, setOutgoingContent] = useState<PromoContentSnapshot | null>(null);
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentSnapshotRef = useRef<PromoContentSnapshot>(initialSnapshot);

  // Clean up any pending transition timer when component unmounts
  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const isReduced =
      prefersReducedMotion ||
      (typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    const nextSnapshot: PromoContentSnapshot = {
      key: currentContentKey,
      view: activeView,
      messageIndex: currentMessageIndex,
      spotlightTitle,
      spotlightSubtitle,
      spotlightCtaText,
      spotlightCtaUrl,
    };

    if (currentSnapshotRef.current.key === currentContentKey) {
      currentSnapshotRef.current = nextSnapshot;
      setDisplayContent(nextSnapshot);
      return;
    }

    if (isReduced) {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }
      currentSnapshotRef.current = nextSnapshot;
      setDisplayContent(nextSnapshot);
      setOutgoingContent(null);
      return;
    }

    const outgoing = currentSnapshotRef.current;
    currentSnapshotRef.current = nextSnapshot;

    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }

    setOutgoingContent(outgoing);
    setDisplayContent(nextSnapshot);

    transitionTimerRef.current = setTimeout(() => {
      setOutgoingContent(null);
      transitionTimerRef.current = null;
    }, 380);
  }, [
    currentContentKey,
    activeView,
    currentMessageIndex,
    spotlightTitle,
    spotlightSubtitle,
    spotlightCtaText,
    spotlightCtaUrl,
    prefersReducedMotion,
  ]);

  useEffect(() => {
    if (typeof projectsCount === 'number') {
      setLiveProjectsCount(projectsCount);
    }
    if (typeof writeupsCount === 'number') {
      setLiveWriteupsCount(writeupsCount);
    }
  }, [projectsCount, writeupsCount]);

  useEffect(() => {
    if (initialHero) {
      setHero({
        id: initialHero.id || 'current',
        brand_name: initialHero.brand_name || 'AAYAN.',
        headline: initialHero.headline || 'SECURITY RESEARCHER & PENTESTER',
        manifesto_line_1: initialHero.manifesto_line_1 || 'EXPLORING SYSTEMS.',
        manifesto_line_2: initialHero.manifesto_line_2 || 'FINDING FLAWS.',
        manifesto_line_3: initialHero.manifesto_line_3 || 'CREATING IMPACT.',
        status_label: initialHero.status_label || 'OPEN FOR COLLABORATION',
        status_subtext: initialHero.status_subtext || 'Research • Bug Bounty • Projects',
        stat_projects: initialHero.stat_projects || '10+',
        stat_writeups: initialHero.stat_writeups || '5+',
        stat_curiosity: initialHero.stat_curiosity || '∞',
        quote: initialHero.quote || 'CURIOSITY ALWAYS FINDS A WAY IN.',
        cta_text: initialHero.cta_text || 'VIEW MY RESEARCH',
        cta_target: initialHero.cta_target || 'research',
        descriptor_1: initialHero.descriptor_1 || '[ OFFENSIVE SECURITY ]',
        descriptor_2: initialHero.descriptor_2 || '[ WEB / MOBILE / CLOUD ]',
        descriptor_3: initialHero.descriptor_3 || '[ RESEARCH • EXPLOIT • BUILD ]',
        wordmark_prefix: initialHero.wordmark_prefix || 'AAYAN',
        wordmark_suffix: initialHero.wordmark_suffix || '.Sec',
        role_title: initialHero.role_title || 'SECURITY RESEARCHER / PENTESTER',
        stat_1_label: initialHero.stat_1_label || 'PROJECTS',
        stat_2_label: initialHero.stat_2_label || 'WRITE-UPS',
        stat_3_label: initialHero.stat_3_label || 'CURIOSITY',
        stat_1_override: initialHero.stat_1_override || '',
        stat_2_override: initialHero.stat_2_override || '',
        stat_1_enabled: initialHero.stat_1_enabled !== false,
        stat_2_enabled: initialHero.stat_2_enabled !== false,
        stat_3_enabled: initialHero.stat_3_enabled !== false,
        spotlight_enabled: Boolean(initialHero.spotlight_enabled),
        spotlight_mode: initialHero.spotlight_mode || 'alternate',
        spotlight_auto_rotate: initialHero.spotlight_auto_rotate !== false,
        spotlight_title: initialHero.spotlight_title || 'OPEN FOR COLLABORATION',
        spotlight_subtitle: initialHero.spotlight_subtitle || 'Web Security • Authorized Penetration Testing',
        spotlight_cta_text: initialHero.spotlight_cta_text || 'INITIATE CONTACT →',
        spotlight_cta_url: initialHero.spotlight_cta_url || '#collaborate',
        spotlight_messages: initialHero.spotlight_messages || [],
      });
      return;
    }

    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (data.hero) {
            setHero({
              id: data.hero.id || 'current',
              brand_name: data.hero.brand_name || 'AAYAN.',
              headline: data.hero.headline || 'SECURITY RESEARCHER & PENTESTER',
              manifesto_line_1: data.hero.manifesto_line_1 || 'EXPLORING SYSTEMS.',
              manifesto_line_2: data.hero.manifesto_line_2 || 'FINDING FLAWS.',
              manifesto_line_3: data.hero.manifesto_line_3 || 'CREATING IMPACT.',
              status_label: data.hero.status_label || 'OPEN FOR COLLABORATION',
              status_subtext: data.hero.status_subtext || 'Research • Bug Bounty • Projects',
              stat_projects: data.hero.stat_projects || '10+',
              stat_writeups: data.hero.stat_writeups || '5+',
              stat_curiosity: data.hero.stat_curiosity || '∞',
              quote: data.hero.quote || 'CURIOSITY ALWAYS FINDS A WAY IN.',
              cta_text: data.hero.cta_text || 'VIEW MY RESEARCH',
              cta_target: data.hero.cta_target || 'research',
              descriptor_1: data.hero.descriptor_1 || '[ OFFENSIVE SECURITY ]',
              descriptor_2: data.hero.descriptor_2 || '[ WEB / MOBILE / CLOUD ]',
              descriptor_3: data.hero.descriptor_3 || '[ RESEARCH • EXPLOIT • BUILD ]',
              wordmark_prefix: data.hero.wordmark_prefix || 'AAYAN',
              wordmark_suffix: data.hero.wordmark_suffix || '.Sec',
              role_title: data.hero.role_title || 'SECURITY RESEARCHER / PENTESTER',
              stat_1_label: data.hero.stat_1_label || 'PROJECTS',
              stat_2_label: data.hero.stat_2_label || 'WRITE-UPS',
              stat_3_label: data.hero.stat_3_label || 'CURIOSITY',
              stat_1_override: data.hero.stat_1_override || '',
              stat_2_override: data.hero.stat_2_override || '',
              stat_1_enabled: data.hero.stat_1_enabled !== false,
              stat_2_enabled: data.hero.stat_2_enabled !== false,
              stat_3_enabled: data.hero.stat_3_enabled !== false,
              spotlight_enabled: Boolean(data.hero.spotlight_enabled),
              spotlight_mode: data.hero.spotlight_mode || 'alternate',
              spotlight_auto_rotate: data.hero.spotlight_auto_rotate !== false,
              spotlight_title: data.hero.spotlight_title || 'OPEN FOR COLLABORATION',
              spotlight_subtitle: data.hero.spotlight_subtitle || 'Web Security • Authorized Penetration Testing',
              spotlight_cta_text: data.hero.spotlight_cta_text || 'INITIATE CONTACT →',
              spotlight_cta_url: data.hero.spotlight_cta_url || '#collaborate',
              spotlight_messages: data.hero.spotlight_messages || [],
            });
          }
          if (typeof data.projectsCount === 'number') {
            setLiveProjectsCount(data.projectsCount);
          }
          if (typeof data.writeupsCount === 'number') {
            setLiveWriteupsCount(data.writeupsCount);
          }
        }
      })
      .catch((err) => console.error('Error fetching live hero settings:', err));
  }, [initialHero]);

  const renderPromoSlot = (content: PromoContentSnapshot, isInteractive: boolean) => {
    if (content.view === 'stats') {
      return (
        <div className="flex items-center justify-between w-full min-h-[44px] sm:min-h-[53px]">
          {stat1Enabled && (
            <div className="text-center flex-1 min-w-0">
              <div className="font-display text-2xl sm:text-3xl font-extrabold text-[#171514] leading-none">
                {isInteractive ? (
                  <InlineEditable
                    value={currentHero.stat_1_override || String(liveProjectsCount)}
                    onChange={(val) => onHeroChange?.('stat_1_override', val)}
                    isEditingMode={isEditingMode}
                    label="Projects Count"
                    className="font-display text-2xl sm:text-3xl font-extrabold text-[#171514] leading-none"
                  />
                ) : (
                  <span>{currentHero.stat_1_override || String(liveProjectsCount)}</span>
                )}
              </div>
              <div className="text-[9px] sm:text-[10px] tracking-widest text-[#5A5650] uppercase mt-0.5 truncate">
                {isInteractive ? (
                  <InlineEditable
                    value={currentHero.stat_1_label || 'PROJECTS'}
                    onChange={(val) => onHeroChange?.('stat_1_label', val)}
                    isEditingMode={isEditingMode}
                    label="Stat 1 Label"
                    className="text-[9px] sm:text-[10px] tracking-widest text-[#5A5650] uppercase"
                  />
                ) : (
                  <span>{currentHero.stat_1_label || 'PROJECTS'}</span>
                )}
              </div>
            </div>
          )}

          {stat1Enabled && (stat2Enabled || stat3Enabled) && (
            <div className="text-[#BCB8B1] font-mono text-lg font-light select-none px-1 flex-shrink-0">—</div>
          )}

          {stat2Enabled && (
            <div className="text-center flex-1 min-w-0">
              <div className="font-display text-2xl sm:text-3xl font-extrabold text-[#171514] leading-none">
                {isInteractive ? (
                  <InlineEditable
                    value={currentHero.stat_2_override || String(liveWriteupsCount)}
                    onChange={(val) => onHeroChange?.('stat_2_override', val)}
                    isEditingMode={isEditingMode}
                    label="Writeups Count"
                    className="font-display text-2xl sm:text-3xl font-extrabold text-[#171514] leading-none"
                  />
                ) : (
                  <span>{currentHero.stat_2_override || String(liveWriteupsCount)}</span>
                )}
              </div>
              <div className="text-[9px] sm:text-[10px] tracking-widest text-[#5A5650] uppercase mt-0.5 truncate">
                {isInteractive ? (
                  <InlineEditable
                    value={currentHero.stat_2_label || 'WRITE-UPS'}
                    onChange={(val) => onHeroChange?.('stat_2_label', val)}
                    isEditingMode={isEditingMode}
                    label="Stat 2 Label"
                    className="text-[9px] sm:text-[10px] tracking-widest text-[#5A5650] uppercase"
                  />
                ) : (
                  <span>{currentHero.stat_2_label || 'WRITE-UPS'}</span>
                )}
              </div>
            </div>
          )}

          {stat2Enabled && stat3Enabled && (
            <div className="text-[#BCB8B1] font-mono text-lg font-light select-none px-1 flex-shrink-0">—</div>
          )}

          {stat3Enabled && (
            <div className="text-center flex-1 min-w-0">
              <div className="font-display text-2xl sm:text-3xl font-extrabold text-[#171514] leading-none">
                {isInteractive ? (
                  <InlineEditable
                    value={currentHero.stat_curiosity || '∞'}
                    onChange={(val) => onHeroChange?.('stat_curiosity', val)}
                    isEditingMode={isEditingMode}
                    label="Curiosity Symbol"
                    className="font-display text-2xl sm:text-3xl font-extrabold text-[#171514] leading-none"
                  />
                ) : (
                  <span>{currentHero.stat_curiosity || '∞'}</span>
                )}
              </div>
              <div className="text-[9px] sm:text-[10px] tracking-widest text-[#5A5650] uppercase mt-0.5 truncate">
                {isInteractive ? (
                  <InlineEditable
                    value={currentHero.stat_3_label || 'CURIOSITY'}
                    onChange={(val) => onHeroChange?.('stat_3_label', val)}
                    isEditingMode={isEditingMode}
                    label="Stat 3 Label"
                    className="text-[9px] sm:text-[10px] tracking-widest text-[#5A5650] uppercase"
                  />
                ) : (
                  <span>{currentHero.stat_3_label || 'CURIOSITY'}</span>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col justify-center min-w-0 py-0.5 min-h-[44px] sm:min-h-[53px]">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="font-display text-sm sm:text-base font-black text-[#171514] leading-tight truncate uppercase tracking-wider min-w-0">
            {isInteractive ? (
              <InlineEditable
                value={content.spotlightTitle}
                onChange={(val) => onHeroChange?.('spotlight_title', val)}
                isEditingMode={isEditingMode}
                label="Spotlight Title"
                className="font-display text-sm sm:text-base font-black text-[#171514] leading-tight truncate uppercase tracking-wider"
              />
            ) : (
              <span>{content.spotlightTitle}</span>
            )}
          </div>
          {content.spotlightCtaText && (
            <a
              href={content.spotlightCtaUrl || '#collaborate'}
              onClick={(e) => {
                const url = content.spotlightCtaUrl || '#collaborate';
                if (url.startsWith('#')) {
                  e.preventDefault();
                  const el = document.querySelector(url);
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="font-mono text-[10px] sm:text-[11px] font-bold text-[#DF491E] hover:text-[#171514] hover:underline flex-shrink-0 flex items-center gap-0.5 transition-colors"
              title={content.spotlightCtaText}
            >
              {isInteractive ? (
                <InlineEditable
                  value={content.spotlightCtaText}
                  onChange={(val) => onHeroChange?.('spotlight_cta_text', val)}
                  isEditingMode={isEditingMode}
                  label="Spotlight CTA Text"
                  className="font-mono text-[10px] sm:text-[11px] font-bold text-[#DF491E]"
                />
              ) : (
                <span>{content.spotlightCtaText}</span>
              )}
            </a>
          )}
        </div>
        <div className="text-[10px] sm:text-[11px] tracking-tight text-[#5A5650] font-mono truncate mt-0.5">
          {isInteractive ? (
            <InlineEditable
              value={content.spotlightSubtitle}
              onChange={(val) => onHeroChange?.('spotlight_subtitle', val)}
              isEditingMode={isEditingMode}
              label="Spotlight Subtitle"
              className="text-[10px] sm:text-[11px] tracking-tight text-[#5A5650] font-mono truncate"
            />
          ) : (
            <span>{content.spotlightSubtitle}</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <section className="relative w-full min-h-screen bg-[#ECE8DF] text-[#171514] overflow-hidden flex flex-col justify-between p-6 sm:p-8 lg:p-10 xl:p-12">
      {/* Corner Registration Crosses */}
      <div className="absolute top-5 left-5 font-mono text-2xl font-light select-none pointer-events-none text-[#171514]">
        +
      </div>
      <div className="absolute bottom-5 left-5 font-mono text-2xl font-light select-none pointer-events-none text-[#171514]">
        +
      </div>

      {/* TOP HEADER ROW: Identity Box + Scope Badges + World Map & Handwritten Note */}
      <div className="w-full flex flex-col md:flex-row items-start justify-between gap-6 mb-2 z-20">
        {/* Left: Identity Box and Technical Labels */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Identity Box matching reference with signature sketch borders */}
          <HandDrawnFrame bgColor="#ECE8DF" padding="8px 18px" className="flex-shrink-0">
            <div className="font-sans text-2xl sm:text-3xl font-black tracking-wider leading-none flex items-baseline flex-wrap">
              <InlineEditable
                value={currentHero.wordmark_prefix || 'AAYAN'}
                onChange={(val) => onHeroChange?.('wordmark_prefix', val)}
                isEditingMode={isEditingMode}
                label="Brand Wordmark"
                className="font-sans font-black tracking-wider leading-none"
              />
              <InlineEditable
                value={currentHero.wordmark_suffix || '.Sec'}
                onChange={(val) => onHeroChange?.('wordmark_suffix', val)}
                isEditingMode={isEditingMode}
                label="Brand Suffix"
                className="text-[#DF491E] font-bold font-sans tracking-wider leading-none"
              />
            </div>
            <div className="font-mono text-[10px] sm:text-[11px] font-bold tracking-widest text-[#171514] uppercase mt-1 leading-tight">
              <InlineEditable
                value={currentHero.role_title || 'SECURITY RESEARCHER / PENTESTER'}
                onChange={(val) => onHeroChange?.('role_title', val)}
                isEditingMode={isEditingMode}
                label="Role Title"
                className="font-mono text-[10px] sm:text-[11px] font-bold tracking-widest text-[#171514] uppercase block leading-tight"
              >
                {currentHero.role_title && currentHero.role_title.includes('/') ? (
                  <>
                    <div>{currentHero.role_title.split('/')[0].trim()}</div>
                    <div>/ {currentHero.role_title.split('/').slice(1).join('/').trim()}</div>
                  </>
                ) : (
                  currentHero.role_title || 'SECURITY RESEARCHER / PENTESTER'
                )}
              </InlineEditable>
            </div>
          </HandDrawnFrame>

          {/* Bracketed Scope Labels */}
          <div className="font-mono text-[11px] sm:text-xs text-[#171514] space-y-1 font-medium tracking-wide">
            <div>
              <InlineEditable
                value={currentHero.descriptor_1 || '[ OFFENSIVE SECURITY ]'}
                onChange={(val) => onHeroChange?.('descriptor_1', val)}
                isEditingMode={isEditingMode}
                label="Descriptor 1"
              />
            </div>
            <div>
              <InlineEditable
                value={currentHero.descriptor_2 || '[ WEB / MOBILE / CLOUD ]'}
                onChange={(val) => onHeroChange?.('descriptor_2', val)}
                isEditingMode={isEditingMode}
                label="Descriptor 2"
              />
            </div>
            <div>
              <InlineEditable
                value={currentHero.descriptor_3 || '[ RESEARCH • EXPLOIT • BUILD ]'}
                onChange={(val) => onHeroChange?.('descriptor_3', val)}
                isEditingMode={isEditingMode}
                label="Descriptor 3"
              />
            </div>
          </div>
        </div>

        {/* Right (over collage on desktop): Dotted World Map & Handwritten Note (Location tag removed per PRD) */}
        <div className="hidden xl:flex items-center gap-6 self-start mr-8">
          {/* Dotted World Map with Target Crosshair */}
          <div className="relative w-44 h-16 flex-shrink-0">
            <Image
              src="/assets/world_map_transparent.png"
              alt="World Map Target"
              width={295}
              height={180}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              priority
            />
          </div>

          {/* Handwritten Annotation with Arrow */}
          <div className="flex flex-col items-center">
            <span className="font-hand text-xl text-[#171514] font-bold -rotate-6 whitespace-nowrap leading-tight">
              Same Systems<br />New Questions.
            </span>
            <span className="text-xl font-mono text-[#171514] -rotate-45">↓</span>
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN BODY: Left Identity/Manifesto & Center Artwork Collage */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12 items-center flex-1 my-auto z-10">
        {/* LEFT COLUMN: Hero Introduction, Manifesto, Button, Stats */}
        <div className="lg:col-span-5 flex flex-col justify-center space-y-3.5 xl:space-y-4 max-w-[440px] xl:max-w-[470px]">
          {/* // HELLO, I'M */}
          <div className="font-mono text-xs sm:text-sm font-semibold tracking-widest text-[#171514]">
            // HELLO, I&apos;M
          </div>

          {/* Authentic Distressed Ink-Print Headline & Baseline Orange Accent */}
          <div className="my-1">
            <h1 className="relative block">
              <InlineEditable
                value={currentHero.brand_name || 'AAYAN.'}
                onChange={(val) => onHeroChange?.('brand_name', val)}
                isEditingMode={isEditingMode}
                label="Brand Headline"
                as="div"
                className="font-display font-black text-5xl sm:text-6xl md:text-7xl lg:text-6xl xl:text-7xl tracking-wider text-[#171514]"
              >
                {(!currentHero.brand_name || currentHero.brand_name === 'AAYAN.') ? (
                  <Image
                    src="/assets/aayan_headline_clean.png"
                    alt="AAYAN."
                    width={413}
                    height={112}
                    className="w-[280px] sm:w-[330px] md:w-[360px] lg:w-[330px] xl:w-[385px] 2xl:w-[413px] max-w-full h-auto object-contain block drop-shadow-[0px_1px_1px_rgba(23,21,20,0.08)] pointer-events-none"
                    priority
                  />
                ) : (
                  <span className="font-display font-black text-5xl sm:text-6xl md:text-7xl lg:text-6xl xl:text-7xl tracking-wider text-[#171514] block">
                    {currentHero.brand_name}
                  </span>
                )}
              </InlineEditable>
            </h1>
          </div>

          {/* Professional Subheading: Supporting Condensed font (Oswald) with controlled weight & tracking */}
          <h2 className="font-condensed font-medium text-lg sm:text-xl lg:text-xl xl:text-[1.48rem] 2xl:text-[1.58rem] tracking-[0.08em] text-[#171514] leading-[1.2] uppercase whitespace-pre-line">
            <InlineEditable
              value={currentHero.headline}
              onChange={(val) => onHeroChange?.('headline', val)}
              isEditingMode={isEditingMode}
              label="Professional Headline"
              multiline
              className="font-condensed font-medium text-lg sm:text-xl lg:text-xl xl:text-[1.48rem] 2xl:text-[1.58rem] tracking-[0.08em] text-[#171514] leading-[1.2] uppercase whitespace-pre-line"
            />
          </h2>

          {/* Thin Hand-drawn Style Divider Line */}
          <div className="w-full relative h-[2px] my-1 opacity-80">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 2">
              <line x1="0" y1="1" x2="100" y2="1" stroke="#171514" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>

          {/* 3-line Editorial Manifesto */}
          <div className="font-mono text-xs sm:text-sm font-semibold text-[#171514] space-y-1 tracking-[0.12em] leading-relaxed">
            <div>
              <InlineEditable
                value={currentHero.manifesto_line_1}
                onChange={(val) => onHeroChange?.('manifesto_line_1', val)}
                isEditingMode={isEditingMode}
                label="Manifesto 1"
              />
            </div>
            <div>
              <InlineEditable
                value={currentHero.manifesto_line_2}
                onChange={(val) => onHeroChange?.('manifesto_line_2', val)}
                isEditingMode={isEditingMode}
                label="Manifesto 2"
              />
            </div>
            <div>
              <InlineEditable
                value={currentHero.manifesto_line_3}
                onChange={(val) => onHeroChange?.('manifesto_line_3', val)}
                isEditingMode={isEditingMode}
                label="Manifesto 3"
              />
            </div>
          </div>

          {/* Signature Hand-Drawn Primary CTA */}
          <div className="pt-2">
            {isEditingMode ? (
              <div className="inline-block">
                <InlineEditable
                  value={currentHero.cta_text}
                  onChange={(val) => onHeroChange?.('cta_text', val)}
                  isEditingMode={isEditingMode}
                  label="Button CTA Text"
                  className="px-5 py-2.5 bg-[#DF491E] text-[#171514] font-bold border-2 border-[#171514] font-mono text-xs uppercase tracking-wider"
                />
              </div>
            ) : (
              <HandDrawnButton onClick={onViewResearch} variant="primary">
                {currentHero.cta_text}
              </HandDrawnButton>
            )}
          </div>

          {/* // CURRENTLY Collaboration Status */}
          <div className="space-y-1 pt-1">
            <div className="font-mono text-[11px] font-semibold tracking-widest text-[#5A5650]">
              // CURRENTLY
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#DF491E] animate-pulse-dot flex-shrink-0" />
              <span className="font-mono text-xs sm:text-sm font-bold tracking-wider text-[#171514] uppercase">
                <InlineEditable
                  value={currentHero.status_label}
                  onChange={(val) => onHeroChange?.('status_label', val)}
                  isEditingMode={isEditingMode}
                  label="Status Label"
                />
              </span>
            </div>
            <div className="font-mono text-[11px] text-[#5A5650] pl-5 tracking-wide">
              <InlineEditable
                value={currentHero.status_subtext}
                onChange={(val) => onHeroChange?.('status_subtext', val)}
                isEditingMode={isEditingMode}
                label="Status Subtext"
              />
            </div>
          </div>

          {/* Stats Bar with sketchy subtle borders & Promotional Spotlight */}
          <div
            id="hero-stats-promotional-bar"
            className="relative border border-[#171514]/60 p-3 sm:p-4 bg-[#ECE8DF]/90 font-mono max-w-md w-full min-h-[90px] sm:min-h-[105px] flex flex-col justify-center transition-all duration-200"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onFocus={() => setIsPaused(true)}
            onBlur={() => setIsPaused(false)}
            tabIndex={0}
            role="region"
            aria-label="Portfolio metrics and promotional spotlight"
          >
            {/* Subtle double sketch line */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
              preserveAspectRatio="none"
              viewBox="0 0 100 100"
            >
              <rect
                x="0"
                y="0"
                width="100"
                height="100"
                fill="none"
                stroke="#171514"
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.4"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            {/* Micro-header strip (visible only when promotional spotlight is enabled) */}
            {isSpotlightEnabled && (
              <div className="flex items-center justify-between text-[9px] text-[#5A5650] mb-1 font-mono select-none">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#DF491E] flex-shrink-0 animate-pulse" />
                  <span className="tracking-widest uppercase font-bold text-[#171514] truncate transition-opacity duration-200">
                    {displayContent.view === 'stats' ? '// METRICS' : spotlightBadge}
                  </span>
                  {displayContent.view === 'spotlight' && enabledMessages.length > 1 && (
                    <span className="text-[8px] text-[#5A5650] tracking-wider">
                      [{String(currentMessageIndex + 1).padStart(2, '0')}/{String(enabledMessages.length).padStart(2, '0')}]
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {spotlightMode === 'alternate' && (
                    <>
                      <button
                        type="button"
                        id="hero-toggle-stats"
                        onClick={() => {
                          setActiveView('stats');
                          resetAutoRotateTimer();
                        }}
                        className={`px-1 py-0.2 uppercase text-[8px] font-bold border transition-colors cursor-pointer ${
                          activeView === 'stats'
                            ? 'bg-[#171514] text-[#ECE8DF] border-[#171514]'
                            : 'bg-transparent text-[#5A5650] border-transparent hover:text-[#171514]'
                        }`}
                        title="Show Statistics"
                        aria-label="Show Statistics"
                      >
                        STATS
                      </button>
                      <span className="text-[#BCB8B1]">/</span>
                      <button
                        type="button"
                        id="hero-toggle-spotlight"
                        onClick={() => {
                          setActiveView('spotlight');
                          resetAutoRotateTimer();
                        }}
                        className={`px-1 py-0.2 uppercase text-[8px] font-bold border transition-colors cursor-pointer ${
                          activeView === 'spotlight'
                            ? 'bg-[#DF491E] text-[#171514] border-[#DF491E]'
                            : 'bg-transparent text-[#5A5650] border-transparent hover:text-[#171514]'
                        }`}
                        title="Show Promotional Spotlight"
                        aria-label="Show Promotional Spotlight"
                      >
                        SPOTLIGHT
                      </button>
                    </>
                  )}
                  {activeView === 'spotlight' && enabledMessages.length > 1 && (
                    <div className="flex items-center gap-0.5 ml-1">
                      <button
                        type="button"
                        id="hero-spotlight-prev"
                        onClick={() => {
                          setCurrentMessageIndex(
                            (prev) => (prev - 1 + enabledMessages.length) % enabledMessages.length
                          );
                          resetAutoRotateTimer();
                        }}
                        className="px-1 py-0.2 text-[8px] border border-[#171514]/40 hover:bg-[#171514] hover:text-[#ECE8DF] font-bold cursor-pointer"
                        title="Previous message"
                        aria-label="Previous promotional message"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        id="hero-spotlight-next"
                        onClick={() => {
                          setCurrentMessageIndex((prev) => (prev + 1) % enabledMessages.length);
                          resetAutoRotateTimer();
                        }}
                        className="px-1 py-0.2 text-[8px] border border-[#171514]/40 hover:bg-[#171514] hover:text-[#ECE8DF] font-bold cursor-pointer"
                        title="Next message"
                        aria-label="Next promotional message"
                      >
                        ›
                      </button>
                    </div>
                  )}
                  {isEditingMode && onOpenHeroDrawer && (
                    <button
                      type="button"
                      onClick={onOpenHeroDrawer}
                      className="ml-1 px-1 py-0.2 text-[8px] font-bold bg-[#DF491E]/20 text-[#171514] border border-[#DF491E] hover:bg-[#DF491E] cursor-pointer"
                      title="Configure Hero Stats & Spotlight in Drawer"
                    >
                      ⚙ EDIT
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Stable Content Slot with CSS Grid-Stacking for Zero Layout Shift */}
            <div className="grid grid-cols-1 grid-rows-1 w-full min-h-[44px] sm:min-h-[53px] items-center relative overflow-hidden">
              {outgoingContent && (
                <div
                  key={`outgoing-${outgoingContent.key}`}
                  className="col-start-1 row-start-1 w-full pointer-events-none animate-promo-exit select-none"
                  aria-hidden="true"
                >
                  {renderPromoSlot(outgoingContent, false)}
                </div>
              )}
              <div
                key={`current-${displayContent.key}`}
                className={`col-start-1 row-start-1 w-full ${
                  outgoingContent ? 'animate-promo-enter' : ''
                }`}
              >
                {renderPromoSlot(displayContent, true)}
              </div>
            </div>
          </div>

          {/* Quote Block with Orange Accent Bar */}
          <div className="flex items-center gap-3 pt-1 border-l-4 border-[#DF491E] pl-3">
            <p className="font-mono text-xs sm:text-sm font-bold tracking-wider text-[#171514] uppercase leading-snug">
              &ldquo;
              <InlineEditable
                value={currentHero.quote}
                onChange={(val) => onHeroChange?.('quote', val)}
                isEditingMode={isEditingMode}
                label="Editorial Quote"
                multiline
                className="font-mono text-xs sm:text-sm font-bold tracking-wider text-[#171514] uppercase leading-snug"
              />
              &rdquo;
            </p>
          </div>
        </div>

        {/* CENTER / RIGHT ARTWORK COLLAGE (Highest Visual Importance) */}
        <div className="lg:col-span-7 relative w-full h-[460px] min-[380px]:h-[520px] sm:h-[600px] md:h-[680px] lg:h-[700px] xl:h-[730px] 2xl:h-[760px] flex items-center justify-center transform scale-[0.72] min-[360px]:scale-[0.80] min-[400px]:scale-[0.88] sm:scale-[0.94] md:scale-100 lg:scale-[0.88] xl:scale-100 origin-center transition-transform">
          {/* Collage Composition Box with explicit width/height boundaries */}
          <div className="relative w-full h-full max-w-[700px] flex items-center justify-center">
            
            {/* 1. Glitch Skyscraper Architecture Background Layer */}
            <div className="absolute top-0 right-8 sm:right-14 md:right-18 w-[250px] sm:w-[290px] md:w-[330px] xl:w-[360px] h-[420px] sm:h-[480px] md:h-[540px] xl:h-[590px] pointer-events-none z-0">
              <Image
                src="/assets/skyscraper_transparent.png"
                alt="Glitch Skyscraper Architecture"
                width={330}
                height={580}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                priority
              />
            </div>

            {/* 2. Orange Circular Brush Ring behind Researcher's Head */}
            <div className="absolute top-4 left-6 sm:left-10 md:left-14 xl:left-16 w-[280px] sm:w-[320px] md:w-[360px] xl:w-[380px] h-[280px] sm:h-[320px] md:h-[360px] xl:h-[380px] pointer-events-none z-10">
              <Image
                src="/assets/orange_ring_transparent.png"
                alt="Orange Brush Circle"
                width={315}
                height={370}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                priority
              />
            </div>

            {/* 3. Central Researcher Silhouette Portrait (Behind Polaroids, in front of background) */}
            <div className="absolute top-8 left-2 sm:left-6 md:left-10 xl:left-12 w-[310px] sm:w-[350px] md:w-[390px] xl:w-[420px] h-[460px] sm:h-[520px] md:h-[570px] xl:h-[610px] pointer-events-none z-20">
              <Image
                src="/assets/researcher_transparent.png"
                alt="Security Researcher Silhouette"
                width={360}
                height={580}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                priority
              />
            </div>

            {/* (Nmap terminal card removed cleanly per PRD) */}

            {/* 4. [0] Label Badge on Researcher */}
            <div className="absolute top-[320px] sm:top-[350px] md:top-[370px] right-[130px] sm:right-[170px] md:right-[200px] z-40 font-mono text-base sm:text-lg font-bold text-[#171514] bg-[#ECE8DF]/90 px-1.5 border border-[#171514]">
              [0]
            </div>

            {/* 5. Top Polaroid: "Research.." (In front of researcher - paper border overlaps silhouette) */}
            <div className="absolute top-8 right-2 sm:right-6 md:right-8 w-[150px] sm:w-[185px] md:w-[200px] xl:w-[215px] h-[150px] sm:h-[185px] md:h-[200px] xl:h-[215px] z-30 transform rotate-[5deg] hover:rotate-[2deg] transition-transform duration-300 drop-shadow-xl cursor-pointer">
              <Image
                src="/assets/polaroid_research.png"
                alt="Research Polaroid"
                width={287}
                height={280}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                priority
              />
            </div>

            {/* 6. Bottom Polaroid: "Ideas.." (In front of researcher - paper border overlaps silhouette) */}
            <div className="absolute bottom-4 sm:bottom-6 left-6 sm:left-12 md:left-16 xl:left-18 w-[160px] sm:w-[195px] md:w-[210px] xl:w-[225px] h-[160px] sm:h-[195px] md:h-[210px] xl:h-[225px] z-30 transform -rotate-[7deg] hover:-rotate-[4deg] transition-transform duration-300 drop-shadow-xl cursor-pointer">
              <Image
                src="/assets/polaroid_ideas.png"
                alt="Ideas Notebook Polaroid"
                width={287}
                height={280}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                priority
              />
            </div>

            {/* 7. Torn Paper Scrap Note: "Same Systems. New Questions." - In front of lower Polaroid and collage */}
            <div className="absolute bottom-14 sm:bottom-18 right-6 sm:right-14 md:right-18 xl:right-20 w-[190px] sm:w-[230px] md:w-[250px] xl:w-[265px] h-[95px] sm:h-[115px] md:h-[125px] xl:h-[135px] z-40 transform -rotate-[2deg] hover:rotate-0 transition-transform duration-200">
              <Image
                src="/assets/torn_paper_note.png"
                alt="Torn Paper Note"
                width={370}
                height={180}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                priority
              />
            </div>

            {/* 8. Methodology Checklist Overlay: Recon, Exploit, Report, Repeat */}
            <div className="absolute bottom-28 sm:bottom-32 right-0 sm:right-2 z-40 font-hand text-lg sm:text-2xl text-[#171514] font-bold space-y-1 select-none">
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-normal">☐</span>
                <span>Recon</span>
              </div>
              <div className="flex items-center gap-2 text-[#DF491E]">
                <span className="font-mono text-base font-bold text-[#171514]">☑</span>
                <span className="underline decoration-2">Exploit</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-normal">☐</span>
                <span>Report</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-normal">☐</span>
                <span>Repeat</span>
              </div>
            </div>

            {/* 9. Diagonal Arrow pointing to and from checklist matching reference */}
            <div className="absolute bottom-20 right-14 sm:right-20 z-40 font-mono text-xl text-[#171514] transform rotate-45 select-none pointer-events-none">
              ←
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
