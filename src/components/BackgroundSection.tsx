'use client';

import React, { useState, useEffect } from 'react';
import HandDrawnFrame from './HandDrawnFrame';
import type { AboutContent, ResearchDomain as CmsResearchDomain } from '@/lib/cms';

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
}

export default function BackgroundSection({
  initialAbout,
  initialDomains,
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
              {about.status_badge && (
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-[#171514] text-[#ECE8DF] uppercase tracking-wider">
                  {about.status_badge}
                </span>
              )}
              {about.spec_text && (
                <span className="font-mono text-[10px] font-bold text-[#5A5650] uppercase tracking-wider">
                  [{about.spec_text}]
                </span>
              )}
            </div>
          </div>
          <p className="font-sans text-base sm:text-lg leading-relaxed text-[#171514]">
            {about.bio_paragraph_1}
          </p>
          <p className="font-sans text-sm sm:text-base leading-relaxed text-[#5A5650]">
            {about.bio_paragraph_2}
          </p>
          <div className="pt-2 flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-[#DF491E] flex-shrink-0" />
            <span className="font-mono text-xs font-bold tracking-widest text-[#171514] uppercase">
              &ldquo;{about.motto_quote}&rdquo;
            </span>
          </div>
        </HandDrawnFrame>

        {/* 2. Research Domains Grid */}
        {domains.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#171514]/20 pb-2">
              <div className="font-mono text-xs font-bold tracking-wider text-[#DF491E] uppercase">
                // RESEARCH DOMAINS
              </div>
              <span className="font-mono text-[11px] text-[#5A5650] uppercase tracking-wider">
                [ {domains.length} ACTIVE DOMAINS ]
              </span>
            </div>
            <div className={`grid gap-4 sm:gap-6 ${domains.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
              {domains.map((d, idx) => (
                <div key={d.id || idx} className="border border-[#171514] p-5 bg-[#F2EFE7] hover:border-[#DF491E] transition-colors">
                  <div className="font-mono text-xs font-bold text-[#DF491E] mb-1.5 flex items-center justify-between">
                    <span>{d.domain_num} / {d.domain_code}</span>
                  </div>
                  <h3 className="font-display text-xl sm:text-2xl font-bold mb-2 text-[#171514]">{d.title}</h3>
                  <p className="text-xs sm:text-sm text-[#5A5650] leading-relaxed font-sans">{d.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
