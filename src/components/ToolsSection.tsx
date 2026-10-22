'use client';

import React, { useState, useEffect } from 'react';
import HandDrawnFrame from './HandDrawnFrame';
import ResponsiveImage from './ResponsiveImage';

interface Project {
  id: number;
  title: string;
  slug: string;
  summary: string;
  description: string;
  tech_stack: string;
  category: string;
  repo_url: string;
  demo_url?: string;
  image_url?: string;
  status: string;
  featured: number;
}

export default function ToolsSection() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Terminal state
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    'Type "help" for available security diagnostic commands.',
  ]);

  useEffect(() => {
    fetch('/api/projects')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.projects) {
          setProjects(data.projects);
        }
      })
      .catch((err) => console.error('Error fetching projects:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = terminalInput.trim().toLowerCase();
    if (!cmd) return;

    let res = '';
    switch (cmd) {
      case 'help':
        res = 'Available commands: tools, scan, whoami, clear, contact, date';
        break;
      case 'tools':
        res = 'Arsenal: ReconPulse (Go), JWT-Tamperer (Java), PayloadForge (Rust/TS), CloudAudit-CLI (Python)';
        break;
      case 'scan':
        res = '[*] Scanning target surface...\n[+] 3 open ports: 80 (HTTP), 443 (HTTPS), 8080 (Admin Portal)\n[!] Potential misconfigured OAuth redirect discovered on /oauth/callback';
        break;
      case 'whoami':
        res = 'operative: aayan.sec | clearance: pentester | status: ready';
        break;
      case 'clear':
        setTerminalOutput(['Terminal cleared.']);
        setTerminalInput('');
        return;
      case 'contact':
        res = 'Direct comms: contact@aayan-sec.com';
        break;
      case 'date':
        res = new Date().toUTCString();
        break;
      default:
        res = `command not recognized: ${cmd}. Type "help" for command list.`;
    }

    setTerminalOutput((prev) => [...prev, `> ${cmd}`, res]);
    setTerminalInput('');
  };

  return (
    <section className="relative w-full min-h-screen bg-[#ECE8DF] text-[#171514] p-6 sm:p-10 lg:p-12 border-t-2 border-[#171514]">
      {/* Registration Crosses */}
      <div className="absolute top-5 left-5 font-mono text-2xl font-light text-[#171514] select-none pointer-events-none">+</div>
      <div className="absolute top-5 right-5 font-mono text-2xl font-light text-[#171514] select-none pointer-events-none">+</div>

      {/* Section Header */}
      <div className="max-w-6xl mx-auto mb-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-2 border-[#171514] pb-4">
          <div>
            <div className="font-mono text-xs font-semibold tracking-widest text-[#DF491E] mb-1">
              // DOSSIER SECTION 04
            </div>
            <h2 className="font-display text-5xl sm:text-6xl font-extrabold tracking-tight text-[#171514]">
              OFFENSIVE TOOLING &amp; ARSENAL
            </h2>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-10">
        {/* Interactive Terminal Sandbox */}
        <div className="border-2 border-[#171514] bg-[#171514] text-[#ECE8DF] p-4 sm:p-5 font-mono shadow-md">
          <div className="flex items-center justify-between border-b border-[#BCB8B1]/30 pb-2 mb-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#DF491E]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#BCB8B1]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#ECE8DF]" />
            </div>
            <span className="text-[10px] text-[#DF491E]">LIVE SHELL</span>
          </div>

          <div className="space-y-1 text-xs max-h-40 overflow-y-auto pr-2 mb-3">
            {terminalOutput.map((line, idx) => (
              <div key={idx} className={line.startsWith('>') ? 'text-[#DF491E] font-bold' : 'text-[#ECE8DF]'}>
                {line}
              </div>
            ))}
          </div>

          <form onSubmit={handleCommand} className="flex items-center gap-2 border-t border-[#BCB8B1]/30 pt-2">
            <span className="text-[#DF491E] font-bold text-sm">&gt;</span>
            <input
              type="text"
              value={terminalInput}
              onChange={(e) => setTerminalInput(e.target.value)}
              placeholder="type 'help' or 'scan'..."
              className="w-full bg-transparent border-none outline-none text-[#ECE8DF] text-xs font-mono placeholder-[#BCB8B1]/50"
            />
            <button
              type="submit"
              className="text-[10px] uppercase font-bold px-2 py-1 bg-[#DF491E] text-[#171514] border border-[#ECE8DF]"
            >
              EXEC
            </button>
          </form>
        </div>

        {/* Projects / Tools Grid */}
        {loading ? (
          <div className="font-mono text-sm text-[#5A5650] py-10 flex items-center gap-2">
            <span className="animate-spin text-[#DF491E]">⟳</span> RETRIEVING TOOLS ARSENAL...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="border-2 border-[#171514] bg-[#ECE8DF] p-6 flex flex-col justify-between hover:shadow-lg transition-shadow relative"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2 py-0.5 bg-[#DF491E] text-[#171514] font-mono text-[10px] font-bold uppercase tracking-wider">
                      {proj.category}
                    </span>
                    <span className="font-mono text-xs text-[#5A5650] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-600 inline-block" />
                      {proj.status.toUpperCase()}
                    </span>
                  </div>

                  {proj.image_url && (
                    <div className="mb-4 border border-[#171514] overflow-hidden">
                      <ResponsiveImage
                        src={proj.image_url}
                        alt={proj.title}
                        aspectRatio="16/9"
                        fit="cover"
                        focalPoint="center"
                      />
                    </div>
                  )}

                  <h3 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#171514] mb-2">
                    {proj.title}
                  </h3>

                  <p className="font-sans text-xs sm:text-sm text-[#5A5650] leading-relaxed mb-4">
                    {proj.summary}
                  </p>

                  <div className="text-xs text-[#171514] bg-[#F2EFE7] p-3 border-l-2 border-[#171514] mb-4 font-mono leading-relaxed">
                    {proj.description}
                  </div>
                </div>

                <div>
                  {/* Tech stack */}
                  <div className="flex flex-wrap gap-1.5 pt-3 border-t border-[#171514]/20 mb-4 font-mono text-[10px]">
                    {proj.tech_stack.split(',').map((tech) => (
                      <span key={tech} className="px-2 py-0.5 bg-[#D7D3CB] text-[#171514] border border-[#171514]/40 font-semibold">
                        {tech.trim()}
                      </span>
                    ))}
                  </div>

                  {/* Links */}
                  <div className="flex items-center justify-between font-mono text-xs font-bold pt-2">
                    {proj.repo_url && (
                      <a
                        href={proj.repo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#171514] hover:text-[#DF491E] flex items-center gap-1"
                      >
                        <span>[ SOURCE CODE ]</span>
                        <span>↗</span>
                      </a>
                    )}
                    {proj.demo_url && (
                      <a
                        href={proj.demo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#DF491E] hover:underline flex items-center gap-1"
                      >
                        <span>[ LIVE DEMO ]</span>
                        <span>↗</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
