'use client';

import React, { useState, useEffect } from 'react';
import ToolsTerminal from './ToolsTerminal';
import type { SiteSettings } from '@/lib/cms';

interface NavigationRailProps {
  activeSection: string;
  onSelectSection: (sectionId: string) => void;
  settings?: SiteSettings | null;
}

export const navItems = [
  {
    id: 'overview',
    num: '01',
    label: 'OVERVIEW',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="7" />
        <circle cx="12" cy="12" r="3" />
        <line x1="12" y1="1" x2="12" y2="5" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="1" y1="12" x2="5" y2="12" />
        <line x1="19" y1="12" x2="23" y2="12" />
      </svg>
    ),
  },
  {
    id: 'background',
    num: '02',
    label: 'BACKGROUND',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    id: 'research',
    num: '03',
    label: 'RESEARCH',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="7" y="8" width="10" height="12" rx="5" />
        <path d="M12 8V4" />
        <path d="M8 4h8" />
        <path d="M6 13H2" />
        <path d="M22 13h-4" />
        <path d="M7 17l-3 3" />
        <path d="M20 20l-3-3" />
        <path d="M7 9L4 6" />
        <path d="M20 6l-3 3" />
      </svg>
    ),
  },
  {
    id: 'tools',
    num: '04',
    label: 'TOOLS',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="M6 10l3 3-3 3" />
        <line x1="12" y1="16" x2="16" y2="16" />
      </svg>
    ),
  },
  {
    id: 'skills',
    num: '05',
    label: 'SKILLS',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 12 12 17 22 12" />
        <polyline points="2 17 12 22 22 17" />
      </svg>
    ),
  },
  {
    id: 'collaborate',
    num: '06',
    label: 'COLLABORATE',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

export default function NavigationRail({ activeSection, onSelectSection, settings }: NavigationRailProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentSettings, setCurrentSettings] = useState<SiteSettings | null>(settings || null);

  useEffect(() => {
    if (settings) {
      setCurrentSettings(settings);
      return;
    }

    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          setCurrentSettings(data.settings);
        }
      })
      .catch((err) => console.error('Error fetching settings for NavigationRail:', err));
  }, [settings]);

  const githubUrl = currentSettings?.github_url || 'https://github.com/aayan-sec';
  const linkedinUrl = currentSettings?.linkedin_url || 'https://linkedin.com/in/aayan-sec';
  const twitterUrl = currentSettings?.twitter_url || 'https://x.com/aayan_sec';
  const contactEmail = currentSettings?.contact_email || 'contact@aayan-sec.com';

  return (
    <>
      {/* Mobile Sticky Dossier Quick Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#ECE8DF] border-b-2 border-[#171514] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold tracking-widest">[ DOSSIER ]</span>
          <span className="font-bold text-sm tracking-wider">AAYAN<span className="text-[#DF491E]">.Sec</span></span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="font-mono text-xs font-bold tracking-wider px-3 py-1.5 border border-[#171514] bg-[#DF491E] text-[#171514] flex items-center gap-2"
        >
          <span>[ NAV ]</span>
          <span>{mobileMenuOpen ? '✕' : '☰'}</span>
        </button>
      </div>

      {/* Mobile Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-[#ECE8DF]/95 pt-16 p-6 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-3">
            <div className="font-mono text-xs tracking-widest text-[#5A5650] mb-4">// SELECT DOSSIER SECTION</div>
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectSection(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left p-3 flex items-center justify-between border-2 transition-colors ${
                    isActive
                      ? 'bg-[#DF491E] border-[#171514] text-[#171514]'
                      : 'bg-[#ECE8DF] border-[#171514] text-[#171514] hover:bg-[#D7D3CB]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-display text-2xl font-normal leading-none">{item.num}</span>
                    <span className="font-condensed text-xl tracking-wider font-bold">{item.label}</span>
                  </div>
                  <div>{item.icon}</div>
                </button>
              );
            })}
          </div>

          <div className="pt-6 border-t-2 border-[#171514] mt-6">
            <div className="font-mono text-xs mb-3">// CONNECT</div>
            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[#DF491E]">GITHUB ↗</a>
              <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[#DF491E]">LINKEDIN ↗</a>
              <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[#DF491E]">TWITTER (X) ↗</a>
              <a href={`mailto:${contactEmail}`} className="hover:text-[#DF491E]">EMAIL ↗</a>
            </div>
            <div className="mt-4">
              <ToolsTerminal contactEmail={contactEmail} githubUrl={githubUrl} />
            </div>
          </div>
        </div>
      )}

      {/* Desktop Persistent Vertical Navigation Rail */}
      <aside className="hidden lg:flex flex-col w-[280px] xl:w-[295px] flex-shrink-0 min-h-screen bg-[#ECE8DF] relative select-none">
        {/* Hand-drawn organic vertical divider separating rail from content matching ref_right_nav */}
        <div className="absolute top-0 bottom-0 left-0 w-[6px] pointer-events-none overflow-hidden">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 6 1000">
            {/* Primary organic ink stroke */}
            <path
              d="M 2.5,0 Q 4,200 2.2,400 T 3.2,700 T 2.5,1000"
              fill="none"
              stroke="#171514"
              strokeWidth="2.8"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            {/* Secondary subtle parallel stroke */}
            <path
              d="M 4,20 Q 5.2,220 3.8,450 T 4.5,750 T 3.8,980"
              fill="none"
              stroke="#171514"
              strokeWidth="0.8"
              opacity="0.5"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        {/* Top Cross Marker */}
        <div className="absolute top-4 right-6 font-mono text-2xl font-light text-[#171514] select-none pointer-events-none">
          +
        </div>

        <div className="pt-10 px-5 flex flex-col flex-1 justify-between">
          <div>
            {/* [ NAV ] Title Box with authentic hand-drawn sketch border */}
            <div className="relative inline-block mb-8 ml-1">
              <div
                className="relative px-6 py-1.5 bg-[#ECE8DF]"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  letterSpacing: '0.12em',
                }}
              >
                {/* Hand-drawn SVG frame for [ NAV ] with overshooting lines */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
                  preserveAspectRatio="none"
                  viewBox="0 0 100 100"
                >
                  <line x1="-5" y1="0" x2="105" y2="-0.5" stroke="#171514" strokeWidth="1.8" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                  <line x1="-3" y1="1.5" x2="102" y2="1" stroke="#171514" strokeWidth="0.8" opacity="0.6" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                  <line x1="-5" y1="100" x2="106" y2="100.5" stroke="#171514" strokeWidth="1.8" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                  <line x1="-0.5" y1="-5" x2="-0.5" y2="105" stroke="#171514" strokeWidth="1.8" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                  <line x1="100.5" y1="-5" x2="100.5" y2="105" stroke="#171514" strokeWidth="1.8" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                </svg>

                {/* Bracketed NAV text */}
                <span className="text-[#DF491E] relative z-10">[</span>
                <span className="text-[#171514] mx-1 relative z-10">NAV</span>
                <span className="text-[#DF491E] relative z-10">]</span>
              </div>
            </div>

            {/* 6 Numbered Section Navigation Entries Container */}
            <div className="relative bg-[#ECE8DF]">
              {/* Outer sketched frame for the 6 items */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-20"
                preserveAspectRatio="none"
                viewBox="0 0 100 100"
              >
                <line x1="-4" y1="0" x2="104" y2="0" stroke="#171514" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                <line x1="-4" y1="100" x2="104" y2="100" stroke="#171514" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                <line x1="0" y1="-5" x2="0" y2="105" stroke="#171514" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                <line x1="100" y1="-5" x2="100" y2="105" stroke="#171514" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              </svg>

              <div className="flex flex-col relative z-10">
                {navItems.map((item, index) => {
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectSection(item.id)}
                      className={`relative w-full text-left px-5 py-5 flex items-center justify-between cursor-pointer transition-all duration-150 group ${
                        index !== navItems.length - 1 ? 'border-b border-[#171514]' : ''
                      } ${
                        isActive
                          ? 'bg-[#DF491E] text-[#171514] font-bold shadow-inner'
                          : 'bg-[#ECE8DF] text-[#171514] hover:bg-[#D7D3CB]/60'
                      }`}
                    >
                      {/* Signature Hand-drawn Sketch outline overlay for active item matching ref_right_nav */}
                      {isActive && (
                        <svg
                          className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-20"
                          preserveAspectRatio="none"
                          viewBox="0 0 100 100"
                        >
                          {/* Outer stroke with corner ticks */}
                          <line x1="-4" y1="0.5" x2="104" y2="-0.5" stroke="#171514" strokeWidth="2.4" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                          <line x1="-4" y1="99.5" x2="105" y2="100.5" stroke="#171514" strokeWidth="2.4" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                          <line x1="0" y1="-5" x2="0" y2="105" stroke="#171514" strokeWidth="2.4" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                          <line x1="100" y1="-5" x2="100" y2="105" stroke="#171514" strokeWidth="2.4" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                          
                          {/* Secondary offset sketched line */}
                          <line x1="-2" y1="2" x2="102" y2="1.5" stroke="#171514" strokeWidth="1" opacity="0.7" vectorEffect="non-scaling-stroke" />
                          <line x1="-2" y1="98" x2="102" y2="98.5" stroke="#171514" strokeWidth="1" opacity="0.7" vectorEffect="non-scaling-stroke" />
                        </svg>
                      )}

                      <div className="flex items-center gap-4 relative z-10">
                        <span
                          className="font-display text-4xl font-normal tracking-tight"
                          style={{ lineHeight: 1 }}
                        >
                          {item.num}
                        </span>
                        <span
                          className="font-condensed text-lg tracking-[0.08em] font-bold uppercase"
                          style={{ lineHeight: 1.1 }}
                        >
                          {item.label}
                        </span>
                      </div>

                      <div
                        className={`relative z-10 transition-transform duration-150 ${
                          isActive ? 'scale-110' : 'group-hover:scale-110'
                        }`}
                      >
                        {item.icon}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Lower Rail: / CONNECT Box, Barcode, Details */}
          <div className="mt-8 mb-6 space-y-6">
            {/* / CONNECT Box with hand-drawn blueprint frame */}
            <div className="relative p-3.5 bg-[#ECE8DF]">
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
                preserveAspectRatio="none"
                viewBox="0 0 100 100"
              >
                <line x1="-3" y1="0" x2="103" y2="0" stroke="#171514" strokeWidth="1.2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                <line x1="-3" y1="100" x2="103" y2="100" stroke="#171514" strokeWidth="1.2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                <line x1="0" y1="-3" x2="0" y2="103" stroke="#171514" strokeWidth="1.2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                <line x1="100" y1="-3" x2="100" y2="103" stroke="#171514" strokeWidth="1.2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              </svg>

              <div className="font-mono text-xs font-semibold tracking-wider text-[#171514] mb-2.5 relative z-10">
                / CONNECT
              </div>
              <div className="flex flex-col space-y-1.5 font-mono text-[11px] font-medium tracking-wide relative z-10">
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between hover:text-[#DF491E] transition-colors"
                >
                  <span>GITHUB</span>
                  <span>↗</span>
                </a>
                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between hover:text-[#DF491E] transition-colors"
                >
                  <span>LINKEDIN</span>
                  <span>↗</span>
                </a>
                <a
                  href={twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between hover:text-[#DF491E] transition-colors"
                >
                  <span>TWITTER (X)</span>
                  <span>↗</span>
                </a>
                <a
                  href={`mailto:${contactEmail}`}
                  className="flex items-center justify-between hover:text-[#DF491E] transition-colors"
                >
                  <span>EMAIL</span>
                  <span>↗</span>
                </a>
              </div>
            </div>

            {/* Interactive Terminal Launcher in Barcode Slot */}
            <ToolsTerminal contactEmail={contactEmail} githubUrl={githubUrl} />

            {/* Bottom Cross Marker */}
            <div className="flex justify-end pr-2">
              <span className="font-mono text-xl font-light text-[#171514]">+</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
