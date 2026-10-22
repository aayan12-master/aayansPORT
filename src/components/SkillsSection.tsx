'use client';

import React, { useState, useEffect } from 'react';

interface SkillItem {
  num: string;
  title: string;
  desc: string;
  skills: string[];
  tools: string[];
}

export default function SkillsSection() {
  const [skillCategories, setSkillCategories] = useState<SkillItem[]>([
    {
      num: '01',
      title: 'WEB APPLICATION SECURITY',
      desc: 'Deep inspection and exploitation of modern web architectures and APIs.',
      skills: [
        'OAuth 2.0 & OpenID Connect Bypass',
        'Authentication State Fixation',
        'Insecure Direct Object References (IDOR)',
        'Server-Side Request Forgery (SSRF)',
        'GraphQL Query Depth & Mass Assignment',
        'Cross-Site Scripting (Contextual XSS)',
        'SQL Injection & Blind Extraction',
        'Race Conditions & Concurrency Flaws',
      ],
      tools: ['Burp Suite Professional', 'OWASP ZAP', 'Caido', 'Postman', 'ffuf'],
    },
    {
      num: '02',
      title: 'ACTIVE RECONNAISSANCE & OSINT',
      desc: 'Automated perimeter discovery, ASN enumeration, and asset footprinting.',
      skills: [
        'Subdomain Permutation & Resolution',
        'Dangling DNS & Takeover Identification',
        'TLS Certificate Transparency Monitoring',
        'Autonomous Surface Differential Scanning',
        'GitHub Secret & Leak Scrapes',
        'Cloud S3 & Storage Bucket Enumeration',
      ],
      tools: ['Amass', 'Subfinder', 'httpx', 'Nuclei', 'Masscan', 'naabu'],
    },
    {
      num: '03',
      title: 'CLOUD & INFRASTRUCTURE SECURITY',
      desc: 'Assessing resilience of AWS, GCP, and Kubernetes cloud perimeters.',
      skills: [
        'AWS IMDSv1 / v2 SSRF Extraction',
        'IAM Least-Privilege & Escalation Paths',
        'Serverless Lambda / Cloudflare Edge Audits',
        'Container Escape & Misconfiguration Analysis',
        'VPC Peering & Network Exposure Probing',
      ],
      tools: ['AWS CLI', 'ScoutSuite', 'Pacu', 'Prowler', 'Docker', 'Kubectl'],
    },
    {
      num: '04',
      title: 'BINARY & REVERSE ENGINEERING',
      desc: 'Dissecting binaries, proprietary daemons, and firmware protocols.',
      skills: [
        'Static & Dynamic Binary Disassembly',
        'Memory Corruption & Heap Underflow Triage',
        'MIPS & ARM Architecture Analysis',
        'Custom Protocol Reverse Engineering',
        'Binary Hardening Checks (ASLR, DEP, Canary)',
      ],
      tools: ['Ghidra', 'GDB / PEDA / GEF', 'IDA Free', 'Radare2', 'Binwalk'],
    },
    {
      num: '05',
      title: 'OFFENSIVE SCRIPTING & TOOLING',
      desc: 'Developing specialized high-performance exploit automation tools.',
      skills: [
        'High-Throughput Concurrent Scanners (Go)',
        'Exploit PoC Automation (Python)',
        'Burp Suite Extension Development (Java/Python)',
        'AST-Based Payload Synthesizers (Node.js)',
        'Adversarial Shell Scripting (Bash)',
      ],
      tools: ['Go (Golang)', 'Python 3', 'TypeScript', 'Bash', 'Rust', 'Java'],
    },
    {
      num: '06',
      title: 'SECURITY REPORTING & REMEDIATION',
      desc: 'Communicating critical findings with actionable patch blueprints.',
      skills: [
        'CVSS v3.1 / v4.0 Risk Quantification',
        'Deterministic Proof-of-Concept Documentation',
        'Executive & Engineering Briefings',
        'Responsible Coordinated Vulnerability Disclosure',
      ],
      tools: ['Markdown Dossiers', 'Jira / GitHub Security', 'HackerOne / Bugcrowd'],
    },
  ]);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.skills) && data.skills.length > 0) {
          const mapped = data.skills.map((s: any) => ({
            num: s.category_num,
            title: s.category_title,
            desc: s.description,
            skills: s.skills || [],
            tools: s.tools || [],
          }));
          setSkillCategories(mapped);
        }
      })
      .catch((err) => console.error('Error fetching live skills:', err));
  }, []);

  return (
    <section className="relative w-full min-h-screen bg-[#ECE8DF] text-[#171514] p-6 sm:p-10 lg:p-12 border-t-2 border-[#171514]">
      {/* Corner Marks */}
      <div className="absolute top-5 left-5 font-mono text-2xl font-light text-[#171514] select-none pointer-events-none">+</div>
      <div className="absolute top-5 right-5 font-mono text-2xl font-light text-[#171514] select-none pointer-events-none">+</div>

      {/* Section Header */}
      <div className="max-w-6xl mx-auto mb-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-2 border-[#171514] pb-4">
          <div>
            <div className="font-mono text-xs font-semibold tracking-widest text-[#DF491E] mb-1">
              // DOSSIER SECTION 05
            </div>
            <h2 className="font-display text-5xl sm:text-6xl font-extrabold tracking-tight text-[#171514]">
              CAPABILITIES &amp; TECHNICAL MATRIX
            </h2>
          </div>
        </div>
      </div>

      {/* Grid of Skill Categories */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {skillCategories.map((cat) => (
          <div
            key={cat.num}
            className="border-2 border-[#171514] bg-[#ECE8DF] p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative"
          >
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-[#171514]/20 pb-2">
                <span className="font-mono text-xs font-bold text-[#DF491E]">SECTION // {cat.num}</span>
                <span className="font-mono text-xs text-[#5A5650]">[ VERIFIED ]</span>
              </div>

              <h3 className="font-display text-2xl font-bold tracking-tight text-[#171514] mb-2">
                {cat.title}
              </h3>

              <p className="font-sans text-xs text-[#5A5650] leading-relaxed mb-4">
                {cat.desc}
              </p>

              <div className="space-y-1.5 font-mono text-xs mb-6">
                {cat.skills.map((skill, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-[#DF491E] font-bold text-xs">▸</span>
                    <span className="text-[#171514] leading-snug">{skill}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[#171514]/20">
              <div className="font-mono text-[10px] text-[#5A5650] uppercase tracking-wider mb-2">
                PRIMARY TOOLKIT:
              </div>
              <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                {cat.tools.map((tool) => (
                  <span
                    key={tool}
                    className="px-2 py-0.5 bg-[#D7D3CB] border border-[#171514]/40 text-[#171514] font-medium"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
