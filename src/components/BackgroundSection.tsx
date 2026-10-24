'use client';

import React, { useState, useEffect } from 'react';
import HandDrawnFrame from './HandDrawnFrame';
import type { AboutContent, ResearchDomain as CmsResearchDomain } from '@/lib/cms';
import InlineEditable from './admin/InlineEditable';

export interface ResearchDomain {
  id?: string | number;
  domain_num: string;
  domain_code: string;
  title: string;
  description: string;
  display_order?: number;
}

export interface BackgroundSectionProps {
  initialAbout?: AboutContent | null;
  initialDomains?: ResearchDomain[] | null;
  isEditingMode?: boolean;
  aboutOverride?: AboutContent | null;
  domainsOverride?: ResearchDomain[] | null;
  onAboutChange?: (field: keyof AboutContent, value: string) => void;
  onDomainChange?: (index: number, field: keyof ResearchDomain, value: string) => void;
  onAddDomain?: () => void;
  onDeleteDomain?: (index: number) => void;
  onMoveDomain?: (index: number, direction: 'up' | 'down') => void;
}

export default function BackgroundSection({
  initialAbout,
  initialDomains,
  isEditingMode = false,
  aboutOverride,
  domainsOverride,
  onAboutChange,
  onDomainChange,
  onAddDomain,
  onDeleteDomain,
  onMoveDomain,
}: BackgroundSectionProps = {}) {
  const [about, setAbout] = useState(() => ({
    status_badge: initialAbout?.status_badge || 'ACTIVE RESEARCHER',
    spec_text: initialAbout?.spec_text || 'OFFENSIVE SECURITY & PENTESTING',
    bio_paragraph_1:
      initialAbout?.bio_paragraph_1 ||
      'Aayan is an offensive security researcher, penetration tester, and bug bounty hunter specializing in deep-dive architectural vulnerability analysis, authentication bypasses, cloud infrastructure exploitation, and custom tooling development.',
    bio_paragraph_2:
      initialAbout?.bio_paragraph_2 ||
      'Approaching security research with an inquisitive, adversarial mindset, the primary focus lies in dissecting complex protocols, uncovering non-intuitive logic flaws, and converting theoretical threat models into validated proof-of-concept exploits.',
    motto_quote: initialAbout?.motto_quote || 'BREAKING TO REINFORCE • RESEARCHING TO SECURE',
  }));

  const [domains, setDomains] = useState<ResearchDomain[]>(() =>
    initialDomains !== undefined && initialDomains !== null
      ? initialDomains
      : [
          {
            domain_num: '01',
            domain_code: 'WEB ARCHITECTURE',
            title: 'AUTH & LOGIC FLAWS',
            description:
              'OAuth 2.0 / OIDC protocol state mismatches, session fixation, JWT signature exclusions, and IDOR chains across enterprise web applications.',
          },
          {
            domain_num: '02',
            domain_code: 'CLOUD ATTACK VECTORS',
            title: 'SERVERLESS & IAM',
            description:
              'Dangling DNS alias takeovers, IMDSv1/v2 metadata exfiltration, over-privileged IAM roles, and AWS/Cloudflare edge compute misconfigurations.',
          },
          {
            domain_num: '03',
            domain_code: 'ACTIVE RECONNAISSANCE',
            title: 'PERIMETER ENUMERATION',
            description:
              'Automated continuous surface mapping, TLS certificate stream monitoring, ASN expansion, and rapid vulnerability triage.',
          },
          {
            domain_num: '04',
            domain_code: 'REVERSE ENGINEERING',
            title: 'BINARY & FIRMWARE',
            description:
              'Disassembly and decompilation of proprietary network binaries using Ghidra, memory corruption triage, and protocol analysis.',
          },
        ]
  );

  const currentAbout = aboutOverride || about;
  const currentDomains = domainsOverride || domains;

  useEffect(() => {
    if (initialAbout || initialDomains) {
      if (initialAbout) {
        setAbout({
          status_badge: initialAbout.status_badge || 'ACTIVE RESEARCHER',
          spec_text: initialAbout.spec_text || 'OFFENSIVE SECURITY & PENTESTING',
          bio_paragraph_1: initialAbout.bio_paragraph_1 || '',
          bio_paragraph_2: initialAbout.bio_paragraph_2 || '',
          motto_quote: initialAbout.motto_quote || 'BREAKING TO REINFORCE • RESEARCHING TO SECURE',
        });
      }
      if (initialDomains !== undefined && initialDomains !== null) {
        setDomains(initialDomains);
      }
      return;
    }

    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (data.about) {
            setAbout({
              status_badge: data.about.status_badge || 'ACTIVE RESEARCHER',
              spec_text: data.about.spec_text || 'OFFENSIVE SECURITY & PENTESTING',
              bio_paragraph_1: data.about.bio_paragraph_1 || '',
              bio_paragraph_2: data.about.bio_paragraph_2 || '',
              motto_quote: data.about.motto_quote || 'BREAKING TO REINFORCE • RESEARCHING TO SECURE',
            });
          }
          if (Array.isArray(data.domains)) {
            setDomains(data.domains);
          }
        }
      })
      .catch((err) => console.error('Error fetching live about settings:', err));
  }, [initialAbout, initialDomains]);

  return (
    <section className="relative w-full min-h-screen bg-[#ECE8DF] text-[#171514] p-6 sm:p-10 lg:p-12 border-t-2 border-[#171514]">
      {/* Corner Registration Crosses */}
      <div className="absolute top-5 left-5 font-mono text-2xl font-light text-[#171514] select-none pointer-events-none">+</div>
      <div className="absolute top-5 right-5 font-mono text-2xl font-light text-[#171514] select-none pointer-events-none">+</div>

      {/* Section Header */}
      <div className="max-w-6xl mx-auto mb-10 sm:mb-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-2 border-[#171514] pb-4">
          <div>
            <div className="font-mono text-xs font-semibold tracking-widest text-[#DF491E] mb-1">
              // DOSSIER SECTION 02
            </div>
            <h2 className="font-display text-5xl sm:text-6xl font-extrabold tracking-tight text-[#171514]">
              BACKGROUND &amp; OPERATIVE PROFILE
            </h2>
          </div>
        </div>
      </div>

      {/* Main Content: Operative Biography and Research Domains */}
      <div className="max-w-6xl mx-auto space-y-8 sm:space-y-10">
        {/* 1. Operative Biography */}
        <HandDrawnFrame bgColor="#ECE8DF" padding="24px" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#171514]/20 pb-2">
            <div className="font-mono text-xs font-bold tracking-wider text-[#DF491E] uppercase">
              // OPERATIVE BIOGRAPHY
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-[#171514] text-[#ECE8DF] uppercase tracking-wider">
                <InlineEditable
                  value={currentAbout.status_badge}
                  onChange={(val) => onAboutChange?.('status_badge', val)}
                  isEditingMode={isEditingMode}
                  label="Status Badge"
                />
              </span>
              <span className="font-mono text-[10px] font-bold text-[#5A5650] uppercase tracking-wider">
                [
                <InlineEditable
                  value={currentAbout.spec_text}
                  onChange={(val) => onAboutChange?.('spec_text', val)}
                  isEditingMode={isEditingMode}
                  label="Specification Title"
                />
                ]
              </span>
            </div>
          </div>
          <p className="font-sans text-base sm:text-lg leading-relaxed text-[#171514]">
            <InlineEditable
              value={currentAbout.bio_paragraph_1}
              onChange={(val) => onAboutChange?.('bio_paragraph_1', val)}
              isEditingMode={isEditingMode}
              label="Primary Biography"
              multiline
              className="font-sans text-base sm:text-lg leading-relaxed text-[#171514]"
            />
          </p>
          <p className="font-sans text-sm sm:text-base leading-relaxed text-[#5A5650]">
            <InlineEditable
              value={currentAbout.bio_paragraph_2}
              onChange={(val) => onAboutChange?.('bio_paragraph_2', val)}
              isEditingMode={isEditingMode}
              label="Secondary Philosophy"
              multiline
              className="font-sans text-sm sm:text-base leading-relaxed text-[#5A5650]"
            />
          </p>
          <div className="pt-2 flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-[#DF491E] flex-shrink-0" />
            <span className="font-mono text-xs font-bold tracking-widest text-[#171514] uppercase">
              &ldquo;
              <InlineEditable
                value={currentAbout.motto_quote}
                onChange={(val) => onAboutChange?.('motto_quote', val)}
                isEditingMode={isEditingMode}
                label="Motto Banner"
                className="font-mono text-xs font-bold tracking-widest text-[#171514] uppercase"
              />
              &rdquo;
            </span>
          </div>
        </HandDrawnFrame>

        {/* 2. Research Domains Grid */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#171514]/20 pb-2">
            <div className="flex items-center gap-3">
              <div className="font-mono text-xs font-bold tracking-wider text-[#DF491E] uppercase">
                // RESEARCH DOMAINS
              </div>
              <span className="font-mono text-[11px] text-[#5A5650] uppercase tracking-wider">
                [ {currentDomains.length} ACTIVE DOMAINS ]
              </span>
            </div>
            {isEditingMode && onAddDomain && (
              <button
                type="button"
                onClick={onAddDomain}
                className="px-3 py-1 bg-[#DF491E] hover:bg-[#C73E16] text-[#171514] font-mono text-xs font-bold border border-[#171514] cursor-pointer transition-colors"
              >
                + ADD RESEARCH DOMAIN
              </button>
            )}
          </div>

          {currentDomains.length === 0 ? (
            <div className="p-8 border border-dashed border-[#171514]/40 text-center font-mono text-xs text-[#5A5650]">
              No research domains configured. Click &ldquo;+ ADD RESEARCH DOMAIN&rdquo; above to add one.
            </div>
          ) : (
            <div className={`grid gap-4 sm:gap-6 ${currentDomains.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
              {currentDomains.map((d, idx) => (
                <div key={d.id || idx} className="border border-[#171514] p-5 bg-[#F2EFE7] hover:border-[#DF491E] transition-colors relative group">
                  <div className="font-mono text-xs font-bold text-[#DF491E] mb-1.5 flex items-center justify-between">
                    <div>
                      <InlineEditable
                        value={d.domain_num}
                        onChange={(val) => onDomainChange?.(idx, 'domain_num', val)}
                        isEditingMode={isEditingMode}
                        label="Domain Order #"
                      />
                      {' / '}
                      <InlineEditable
                        value={d.domain_code}
                        onChange={(val) => onDomainChange?.(idx, 'domain_code', val)}
                        isEditingMode={isEditingMode}
                        label="Domain Code"
                      />
                    </div>
                    {isEditingMode && (
                      <div className="flex items-center gap-1 font-mono text-[10px]">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => onMoveDomain?.(idx, 'up')}
                          title="Move up"
                          className="px-1.5 py-0.5 border border-[#171514] bg-[#ECE8DF] hover:bg-[#171514] hover:text-[#ECE8DF] disabled:opacity-30 cursor-pointer"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          disabled={idx === currentDomains.length - 1}
                          onClick={() => onMoveDomain?.(idx, 'down')}
                          title="Move down"
                          className="px-1.5 py-0.5 border border-[#171514] bg-[#ECE8DF] hover:bg-[#171514] hover:text-[#ECE8DF] disabled:opacity-30 cursor-pointer"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteDomain?.(idx)}
                          title="Delete domain"
                          className="px-1.5 py-0.5 border border-[#DF491E] bg-[#DF491E]/10 text-[#DF491E] hover:bg-[#DF491E] hover:text-[#171514] cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                  <h3 className="font-display text-xl sm:text-2xl font-bold mb-2 text-[#171514]">
                    <InlineEditable
                      value={d.title}
                      onChange={(val) => onDomainChange?.(idx, 'title', val)}
                      isEditingMode={isEditingMode}
                      label="Domain Title"
                      className="font-display text-xl sm:text-2xl font-bold text-[#171514]"
                    />
                  </h3>
                  <p className="text-xs sm:text-sm text-[#5A5650] leading-relaxed font-sans">
                    <InlineEditable
                      value={d.description}
                      onChange={(val) => onDomainChange?.(idx, 'description', val)}
                      isEditingMode={isEditingMode}
                      label="Domain Description"
                      multiline
                      className="text-xs sm:text-sm text-[#5A5650] leading-relaxed font-sans"
                    />
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
