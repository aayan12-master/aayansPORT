'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { GitHubTool } from '@/lib/github';

interface ToolsTerminalProps {
  className?: string;
}

export default function ToolsTerminal({ className = '' }: ToolsTerminalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tools, setTools] = useState<GitHubTool[]>([]);
  const [githubUser, setGithubUser] = useState<string>('aayan12-master');
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    'Type "help" for available security diagnostic commands.',
  ]);
  const [mounted, setMounted] = useState(false);

  const launcherRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const outputEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch tools from the Supabase-backed API to match existing terminal arsenal data
  useEffect(() => {
    let isMounted = true;
    fetch('/api/tools')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && Array.isArray(data.tools)) {
          setTools(data.tools);
          if (data.username) setGithubUser(data.username);
        }
      })
      .catch((err) => {
        console.error('Failed to load arsenal tools for terminal:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Lock background scroll, handle Escape key, and autofocus input
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = setTimeout(() => {
      inputRef.current?.focus();
    }, 60);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        launcherRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Keep terminal output scrolled to the bottom on new output
  useEffect(() => {
    if (isOpen) {
      outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalOutput, isOpen]);

  // Terminal command execution logic matching existing ToolsSection implementation
  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = terminalInput.trim().toLowerCase();
    if (!cmd) return;

    let res = '';
    switch (cmd) {
      case 'help':
        res = 'Available commands: tools, scan, whoami, clear, contact, date, github';
        break;
      case 'tools':
        if (tools.length > 0) {
          res = `Active GitHub Arsenal (${tools.length}): ${tools.map((t) => `${t.name} [${t.language}]`).join(', ')}`;
        } else {
          res = 'Arsenal: ipCHv5 (Shell - Tor IP Rotation & Trace Wiper)';
        }
        break;
      case 'github':
        res = `Target Profile: https://github.com/${githubUser} | Repos Loaded: ${tools.length}`;
        break;
      case 'scan':
        res =
          '[*] Scanning target surface...\n[+] 3 open ports: 80 (HTTP), 443 (HTTPS), 8080 (Admin Portal)\n[!] Potential misconfigured OAuth redirect discovered on /oauth/callback';
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

  const handleClose = () => {
    setIsOpen(false);
    launcherRef.current?.focus();
  };

  return (
    <>
      {/* Compact Terminal Launcher Button for Sidebar Slot */}
      <button
        ref={launcherRef}
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open Interactive Security Terminal"
        aria-expanded={isOpen}
        className={`w-full group text-left p-2.5 bg-[#ECE8DF] border-2 border-[#171514] shadow-[3px_3px_0px_#171514] hover:shadow-[3px_3px_0px_#DF491E] hover:bg-[#F2EFE7] focus:outline-none focus:ring-2 focus:ring-[#DF491E] transition-all cursor-pointer select-none ${className}`}
      >
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Terminal Icon Badge */}
            <div className="w-8 h-8 bg-[#171514] text-[#DF491E] flex items-center justify-center border border-[#171514] flex-shrink-0 group-hover:bg-[#DF491E] group-hover:text-[#171514] transition-colors">
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="4 17 10 12 4 7" />
                <line x1="12" y1="19" x2="20" y2="19" />
              </svg>
            </div>
            {/* Terminal Name & Status Indicator */}
            <div className="min-w-0">
              <div className="font-mono text-[11px] font-bold tracking-wider text-[#171514] flex items-center gap-1.5 leading-none">
                <span>TERMINAL</span>
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"
                  title="Live and operational"
                />
              </div>
              <div className="font-mono text-[9px] tracking-widest text-[#5A5650] uppercase mt-1 leading-none">
                [ LIVE SHELL ]
              </div>
            </div>
          </div>

          {/* Right Action Prompt */}
          <div className="font-mono text-[11px] font-bold text-[#171514] group-hover:text-[#DF491E] flex items-center gap-1 flex-shrink-0 transition-colors">
            <span>&gt;_</span>
            <span className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              ↗
            </span>
          </div>
        </div>
      </button>

      {/* Floating macOS Expanded Interactive Terminal Window */}
      {mounted &&
        isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] bg-[#171514]/75 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-6 lg:p-8 animate-terminal-backdrop"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleClose();
              }
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Interactive Security Terminal"
          >
            <div
              className="relative w-full max-w-3xl h-[520px] max-h-[85vh] flex flex-col bg-[#171514] text-[#ECE8DF] border-2 border-[#171514] shadow-[8px_8px_0px_#DF491E] animate-terminal-expand font-mono overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* macOS-style Title Bar */}
              <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 bg-[#1F1C1B] border-b border-[#BCB8B1]/20 select-none">
                {/* Traffic Light Dots */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    aria-label="Close terminal window"
                    title="Close"
                    className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E] flex items-center justify-center text-[#4A0002] text-[8px] font-bold group cursor-pointer hover:opacity-90 focus:outline-none"
                  >
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity leading-none">
                      ✕
                    </span>
                  </button>
                  <span
                    className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123] inline-block cursor-default"
                    title="Minimize"
                  />
                  <span
                    className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29] inline-block cursor-default"
                    title="Live Shell Ready"
                  />
                </div>

                {/* Shell Title in Center */}
                <div className="text-[11px] font-mono tracking-wider text-[#BCB8B1] flex items-center gap-2 truncate px-2">
                  <span className="text-[#DF491E] font-bold">aayan@sec-arsenal:</span>
                  <span>~ (bash)</span>
                </div>

                {/* Accessible Close / ESC Button */}
                <button
                  type="button"
                  onClick={handleClose}
                  aria-label="Close terminal"
                  className="font-mono text-[10px] font-bold px-2 py-0.5 bg-[#ECE8DF] text-[#171514] border border-[#171514] hover:bg-[#DF491E] hover:text-[#ECE8DF] transition-colors flex items-center gap-1.5 cursor-pointer shadow-[1px_1px_0px_#171514]"
                >
                  <span>ESC / CLOSE</span>
                  <span>✕</span>
                </button>
              </div>

              {/* Status & Subheader Strip */}
              <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-[#171514] border-b border-[#BCB8B1]/20 text-[10px] sm:text-[11px] text-[#BCB8B1]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                  <span className="tracking-wider">
                    SOURCE: SUPABASE ARSENAL ({tools.length} TOOLS)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline text-[#BCB8B1]/70">
                    HELP / TOOLS / SCAN / GITHUB
                  </span>
                  <span className="text-[10px] font-bold text-[#DF491E] px-1.5 py-0.5 bg-[#DF491E]/10 border border-[#DF491E]/30">
                    LIVE SHELL
                  </span>
                </div>
              </div>

              {/* Scrollable Terminal Output Area */}
              <div className="flex-1 p-3 sm:p-5 overflow-y-auto space-y-2 text-xs sm:text-[13px] font-mono leading-relaxed bg-[#121110]">
                {terminalOutput.map((line, idx) => (
                  <div
                    key={idx}
                    className={
                      line.startsWith('>')
                        ? 'text-[#DF491E] font-bold'
                        : 'text-[#ECE8DF] whitespace-pre-wrap'
                    }
                  >
                    {line}
                  </div>
                ))}
                <div ref={outputEndRef} />
              </div>

              {/* Interactive Command Input Form */}
              <form
                onSubmit={handleCommand}
                className="flex items-center gap-2 sm:gap-3 p-3 sm:p-3.5 bg-[#171514] border-t-2 border-[#171514]"
              >
                <span className="text-[#DF491E] font-bold text-sm sm:text-base select-none">&gt;</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  placeholder="type 'help', 'tools', or 'scan'..."
                  className="flex-1 bg-transparent border-none outline-none text-[#ECE8DF] text-xs sm:text-sm font-mono placeholder-[#BCB8B1]/40"
                />
                <button
                  type="submit"
                  className="text-[11px] uppercase font-bold px-3 py-1.5 bg-[#DF491E] text-[#171514] border border-[#ECE8DF] hover:bg-[#c73e16] transition-colors cursor-pointer shadow-[2px_2px_0px_#ECE8DF] active:translate-x-[1px] active:translate-y-[1px]"
                >
                  EXEC
                </button>
              </form>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
