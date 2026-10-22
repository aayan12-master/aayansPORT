'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import HandDrawnFrame from './HandDrawnFrame';
import ResponsiveImage from './ResponsiveImage';

interface ResearchDomain {
  domain_num: string;
  domain_code: string;
  title: string;
  description: string;
}

interface MethodologyStep {
  step_num: string;
  title: string;
  description: string;
}

export default function BackgroundSection() {
  const [about, setAbout] = useState({
    bio_paragraph_1:
      'Aayan is an offensive security researcher, penetration tester, and bug bounty hunter specializing in deep-dive architectural vulnerability analysis, authentication bypasses, cloud infrastructure exploitation, and custom tooling development.',
    bio_paragraph_2:
      'Approaching security research with an inquisitive, adversarial mindset, the primary focus lies in dissecting complex protocols, uncovering non-intuitive logic flaws, and converting theoretical threat models into validated proof-of-concept exploits.',
    motto_quote: 'BREAKING TO REINFORCE • RESEARCHING TO SECURE',
  });

  const [domains, setDomains] = useState<ResearchDomain[]>([
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
  ]);

  const [methodology, setMethodology] = useState<MethodologyStep[]>([
    {
      step_num: '01',
      title: 'Target Scope Definition & Threat Modeling',
      description: 'Establishing testing boundaries, rules of engagement, and high-impact attack paths.',
    },
    {
      step_num: '02',
      title: 'Surface Enumeration & Passive OSINT',
      description: 'Non-intrusive metadata harvesting, DNS intelligence, and technology fingerprinting.',
    },
    {
      step_num: '03',
      title: 'Active Vulnerability Probing & Exploit PoC',
      description: 'Crafting targeted payloads, verifying business logic boundaries, and proving real security impact.',
    },
    {
      step_num: '04',
      title: 'Comprehensive Remediation Guidance',
      description: 'Delivering clear, actionable technical reports to empower engineering teams to patch securely.',
    },
  ]);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (data.about) {
            setAbout({
              bio_paragraph_1: data.about.bio_paragraph_1 || '',
              bio_paragraph_2: data.about.bio_paragraph_2 || '',
              motto_quote: data.about.motto_quote || 'BREAKING TO REINFORCE • RESEARCHING TO SECURE',
            });
          }
          if (Array.isArray(data.domains) && data.domains.length > 0) {
            setDomains(data.domains);
          }
          if (Array.isArray(data.methodology) && data.methodology.length > 0) {
            setMethodology(data.methodology);
          }
        }
      })
      .catch((err) => console.error('Error fetching live about settings:', err));
  }, []);

  return (
    <section className="relative w-full min-h-screen bg-[#ECE8DF] text-[#171514] p-6 sm:p-10 lg:p-12 border-t-2 border-[#171514]">
      {/* Corner Registration Crosses */}
      <div className="absolute top-5 left-5 font-mono text-2xl font-light text-[#171514] select-none pointer-events-none">+</div>
      <div className="absolute top-5 right-5 font-mono text-2xl font-light text-[#171514] select-none pointer-events-none">+</div>

      {/* Section Header */}
      <div className="max-w-6xl mx-auto mb-12">
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

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Dossier Biography & Philosophy */}
        <div className="lg:col-span-7 space-y-6">
          <HandDrawnFrame bgColor="#ECE8DF" padding="24px" className="space-y-4">
            <div className="font-mono text-xs font-bold tracking-wider text-[#DF491E] uppercase">
              // OPERATIVE BIOGRAPHY
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

          {/* Research Domains Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {domains.map((d, idx) => (
              <div key={idx} className="border border-[#171514] p-4 bg-[#F2EFE7]">
                <div className="font-mono text-xs font-bold text-[#DF491E] mb-1">
                  {d.domain_num} / {d.domain_code}
                </div>
                <h3 className="font-display text-xl font-bold mb-2">{d.title}</h3>
                <p className="text-xs text-[#5A5650] leading-relaxed">{d.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Workflow Diagram & Engagement Methodology */}
        <div className="lg:col-span-5 space-y-6">
          {/* Taped Diagram from Asset Sheet */}
          <div className="relative border-2 border-[#171514] p-4 bg-[#ECE8DF] shadow-md">
            <div className="font-mono text-xs font-bold text-[#171514] mb-2 flex items-center justify-between">
              <span>// RECON-TO-REPORT WORKFLOW</span>
              <span className="text-[#DF491E]">[ DIAGRAM 01 ]</span>
            </div>
            <div className="relative w-full max-w-[320px] mx-auto h-[220px] flex items-center justify-center">
              <ResponsiveImage
                src="/assets/taped_paper_diag.png"
                alt="Reconnaissance attack tree workflow"
                fit="contain"
                focalPoint="center"
                width={305}
                height={275}
                containerClassName="bg-transparent h-full flex items-center justify-center"
                className="mix-blend-multiply"
              />
            </div>
            <div className="font-hand text-lg text-center font-bold text-[#171514] mt-2">
              Iterative threat identification across attack surfaces.
            </div>
          </div>

          {/* Research Methodology Timeline */}
          <div className="border border-[#171514] p-5 bg-[#F2EFE7]">
            <div className="font-mono text-xs font-bold tracking-wider text-[#DF491E] mb-4">
              // ENGAGEMENT METHODOLOGY
            </div>
            <div className="space-y-4 font-mono text-xs">
              {methodology.map((m, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <span
                    className={`px-1.5 py-0.5 font-bold ${
                      idx === 2 ? 'bg-[#DF491E] text-[#171514]' : 'bg-[#171514] text-[#ECE8DF]'
                    }`}
                  >
                    {m.step_num}
                  </span>
                  <div>
                    <div className="font-bold text-[#171514] uppercase">{m.title}</div>
                    <div className="text-[#5A5650]">{m.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
