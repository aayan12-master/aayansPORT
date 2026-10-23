'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import HandDrawnButton from './HandDrawnButton';
import HandDrawnFrame from './HandDrawnFrame';

import type { HeroContent } from '@/lib/cms';

interface HeroMasterpieceProps {
  onViewResearch: () => void;
  onCollaborate: () => void;
  initialHero?: HeroContent | null;
  projectsCount?: number;
  writeupsCount?: number;
}

export default function HeroMasterpiece({
  onViewResearch,
  onCollaborate,
  initialHero,
  projectsCount,
  writeupsCount,
}: HeroMasterpieceProps) {
  const [liveProjectsCount, setLiveProjectsCount] = useState<number>(() =>
    typeof projectsCount === 'number' ? projectsCount : 0
  );
  const [liveWriteupsCount, setLiveWriteupsCount] = useState<number>(() =>
    typeof writeupsCount === 'number' ? writeupsCount : 0
  );

  const [hero, setHero] = useState(() => ({
    brand_name: initialHero?.brand_name || 'AAYAN.',
    headline: initialHero?.headline || 'SECURITY RESEARCHER & PENTESTER',
    manifesto_line_1: initialHero?.manifesto_line_1 || 'EXPLORING SYSTEMS.',
    manifesto_line_2: initialHero?.manifesto_line_2 || 'FINDING FLAWS.',
    manifesto_line_3: initialHero?.manifesto_line_3 || 'CREATING IMPACT.',
    status_label: initialHero?.status_label || 'OPEN FOR COLLABORATION',
    status_subtext: initialHero?.status_subtext || 'Research • Bug Bounty • Projects',
    stat_curiosity: initialHero?.stat_curiosity || '∞',
    quote: initialHero?.quote || 'CURIOSITY ALWAYS FINDS A WAY IN.',
    cta_text: initialHero?.cta_text || 'VIEW MY RESEARCH',
  }));

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
        brand_name: initialHero.brand_name || 'AAYAN.',
        headline: initialHero.headline || 'SECURITY RESEARCHER & PENTESTER',
        manifesto_line_1: initialHero.manifesto_line_1 || 'EXPLORING SYSTEMS.',
        manifesto_line_2: initialHero.manifesto_line_2 || 'FINDING FLAWS.',
        manifesto_line_3: initialHero.manifesto_line_3 || 'CREATING IMPACT.',
        status_label: initialHero.status_label || 'OPEN FOR COLLABORATION',
        status_subtext: initialHero.status_subtext || 'Research • Bug Bounty • Projects',
        stat_curiosity: initialHero.stat_curiosity || '∞',
        quote: initialHero.quote || 'CURIOSITY ALWAYS FINDS A WAY IN.',
        cta_text: initialHero.cta_text || 'VIEW MY RESEARCH',
      });
      return;
    }

    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (data.hero) {
            setHero({
              brand_name: data.hero.brand_name || 'AAYAN.',
              headline: data.hero.headline || 'SECURITY RESEARCHER & PENTESTER',
              manifesto_line_1: data.hero.manifesto_line_1 || 'EXPLORING SYSTEMS.',
              manifesto_line_2: data.hero.manifesto_line_2 || 'FINDING FLAWS.',
              manifesto_line_3: data.hero.manifesto_line_3 || 'CREATING IMPACT.',
              status_label: data.hero.status_label || 'OPEN FOR COLLABORATION',
              status_subtext: data.hero.status_subtext || 'Research • Bug Bounty • Projects',
              stat_curiosity: data.hero.stat_curiosity || '∞',
              quote: data.hero.quote || 'CURIOSITY ALWAYS FINDS A WAY IN.',
              cta_text: data.hero.cta_text || 'VIEW MY RESEARCH',
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
            <div className="font-sans text-2xl sm:text-3xl font-black tracking-wider leading-none">
              AAYAN<span className="text-[#DF491E] font-bold">.Sec</span>
            </div>
            <div className="font-mono text-[10px] sm:text-[11px] font-bold tracking-widest text-[#171514] uppercase mt-1">
              SECURITY RESEARCHER
            </div>
            <div className="font-mono text-[10px] sm:text-[11px] font-bold tracking-widest text-[#171514] uppercase">
              / PENTESTER
            </div>
          </HandDrawnFrame>

          {/* Bracketed Scope Labels */}
          <div className="font-mono text-[11px] sm:text-xs text-[#171514] space-y-1 font-medium tracking-wide">
            <div>[ OFFENSIVE SECURITY ]</div>
            <div>[ WEB / MOBILE / CLOUD ]</div>
            <div>[ RESEARCH • EXPLOIT • BUILD ]</div>
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
          <div className="my-1 select-none">
            <h1 className="relative block" aria-label="AAYAN.">
              <Image
                src="/assets/aayan_headline_clean.png"
                alt="AAYAN."
                width={413}
                height={112}
                className="w-[280px] sm:w-[330px] md:w-[360px] lg:w-[330px] xl:w-[385px] 2xl:w-[413px] max-w-full h-auto object-contain block drop-shadow-[0px_1px_1px_rgba(23,21,20,0.08)]"
                priority
              />
            </h1>
          </div>

          {/* Professional Subheading: Supporting Condensed font (Oswald) with controlled weight & tracking */}
          <h2 className="font-condensed font-medium text-lg sm:text-xl lg:text-xl xl:text-[1.48rem] 2xl:text-[1.58rem] tracking-[0.08em] text-[#171514] leading-[1.2] uppercase whitespace-pre-line">
            {hero.headline}
          </h2>

          {/* Thin Hand-drawn Style Divider Line */}
          <div className="w-full relative h-[2px] my-1 opacity-80">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 2">
              <line x1="0" y1="1" x2="100" y2="1" stroke="#171514" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>

          {/* 3-line Editorial Manifesto */}
          <div className="font-mono text-xs sm:text-sm font-semibold text-[#171514] space-y-1 tracking-[0.12em] leading-relaxed">
            <div>{hero.manifesto_line_1}</div>
            <div>{hero.manifesto_line_2}</div>
            <div>{hero.manifesto_line_3}</div>
          </div>

          {/* Signature Hand-Drawn Primary CTA */}
          <div className="pt-2">
            <HandDrawnButton onClick={onViewResearch} variant="primary">
              {hero.cta_text}
            </HandDrawnButton>
          </div>

          {/* // CURRENTLY Collaboration Status */}
          <div className="space-y-1 pt-1">
            <div className="font-mono text-[11px] font-semibold tracking-widest text-[#5A5650]">
              // CURRENTLY
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#DF491E] animate-pulse-dot flex-shrink-0" />
              <span className="font-mono text-xs sm:text-sm font-bold tracking-wider text-[#171514] uppercase">
                {hero.status_label}
              </span>
            </div>
            <div className="font-mono text-[11px] text-[#5A5650] pl-5 tracking-wide">
              {hero.status_subtext}
            </div>
          </div>

          {/* Stats Bar with sketchy subtle borders */}
          <div className="relative border border-[#171514]/60 p-3 sm:p-4 bg-[#ECE8DF]/90 flex items-center justify-between font-mono max-w-md">
            {/* Subtle double sketch line */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
              <rect x="0" y="0" width="100" height="100" fill="none" stroke="#171514" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" vectorEffect="non-scaling-stroke" />
            </svg>
            <div className="text-center">
              <div className="font-display text-2xl sm:text-3xl font-extrabold text-[#171514] leading-none">
                {liveProjectsCount}
              </div>
              <div className="text-[9px] sm:text-[10px] tracking-widest text-[#5A5650] uppercase mt-0.5">
                PROJECTS
              </div>
            </div>
            <div className="text-[#BCB8B1] font-mono text-lg font-light">—</div>
            <div className="text-center">
              <div className="font-display text-2xl sm:text-3xl font-extrabold text-[#171514] leading-none">
                {liveWriteupsCount}
              </div>
              <div className="text-[9px] sm:text-[10px] tracking-widest text-[#5A5650] uppercase mt-0.5">
                WRITE-UPS
              </div>
            </div>
            <div className="text-[#BCB8B1] font-mono text-lg font-light">—</div>
            <div className="text-center">
              <div className="font-display text-2xl sm:text-3xl font-extrabold text-[#171514] leading-none">
                {hero.stat_curiosity}
              </div>
              <div className="text-[9px] sm:text-[10px] tracking-widest text-[#5A5650] uppercase mt-0.5">
                CURIOSITY
              </div>
            </div>
          </div>

          {/* Quote Block with Orange Accent Bar */}
          <div className="flex items-center gap-3 pt-1 border-l-4 border-[#DF491E] pl-3">
            <p className="font-mono text-xs sm:text-sm font-bold tracking-wider text-[#171514] uppercase leading-snug">
              &ldquo;{hero.quote}&rdquo;
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
