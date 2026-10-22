'use client';

import React, { useState, useEffect } from 'react';
import HandDrawnFrame from './HandDrawnFrame';
import HandDrawnButton from './HandDrawnButton';

export default function CollaborateSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    honeypot: '',
  });

  const [settings, setSettings] = useState({
    contact_email: 'contact@aayan-sec.com',
    github_url: 'https://github.com/aayan-sec',
    linkedin_url: 'https://linkedin.com/in/aayan-sec',
    twitter_url: 'https://twitter.com/aayan_sec',
    status_text: 'OPEN FOR COLLABORATION',
  });

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [copiedPgp, setCopiedPgp] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          setSettings({
            contact_email: data.settings.contact_email || 'contact@aayan-sec.com',
            github_url: data.settings.github_url || 'https://github.com/aayan-sec',
            linkedin_url: data.settings.linkedin_url || 'https://linkedin.com/in/aayan-sec',
            twitter_url: data.settings.twitter_url || 'https://twitter.com/aayan_sec',
            status_text: data.settings.status_text || 'OPEN FOR COLLABORATION',
          });
        }
      })
      .catch((err) => console.error('Error fetching collaborate settings:', err));
  }, []);

  const pgpKey = `-----BEGIN PGP PUBLIC KEY BLOCK-----
Version: OpenPGP.js v4.10.10
Comment: AAYAN.Sec Public Key

mQENBF+1e7EBCADK1rW9j8V1L2Vp... [TRUNCATED]
Key ID: 0x9B42F1EA
Fingerprint: 4C2F 9E81 3B07 D4A2 88C1  77F3 9B42 F1EA 2025 AAYN
-----END PGP PUBLIC KEY BLOCK-----`;

  const handleCopyPgp = () => {
    navigator.clipboard.writeText(pgpKey);
    setCopiedPgp(true);
    setTimeout(() => setCopiedPgp(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setStatusMessage('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus('success');
        setStatusMessage(data.message || 'Transmission received successfully.');
        setFormData({ name: '', email: '', subject: '', message: '', honeypot: '' });
      } else {
        setStatus('error');
        setStatusMessage(data.error || 'Failed to send transmission. Check inputs.');
      }
    } catch {
      setStatus('error');
      setStatusMessage('Network error occurred. Please verify your connection.');
    }
  };

  return (
    <section className="relative w-full min-h-screen bg-[#ECE8DF] text-[#171514] p-6 sm:p-10 lg:p-12 border-t-2 border-[#171514]">
      {/* Registration Marks */}
      <div className="absolute top-5 left-5 font-mono text-2xl font-light text-[#171514] select-none pointer-events-none">+</div>
      <div className="absolute top-5 right-5 font-mono text-2xl font-light text-[#171514] select-none pointer-events-none">+</div>

      {/* Section Header */}
      <div className="max-w-6xl mx-auto mb-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-2 border-[#171514] pb-4">
          <div>
            <div className="font-mono text-xs font-semibold tracking-widest text-[#DF491E] mb-1">
              // DOSSIER SECTION 06
            </div>
            <h2 className="font-display text-5xl sm:text-6xl font-extrabold tracking-tight text-[#171514]">
              SECURE COLLABORATION &amp; INQUIRY
            </h2>
          </div>
          <div className="font-mono text-xs text-[#5A5650] text-right">
            <div>STATUS: AVAILABLE FOR SELECT ENGAGEMENTS</div>
            <div>RESPONSE WINDOW: &lt; 24 HOURS</div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Direct Contact & PGP Security */}
        <div className="lg:col-span-5 space-y-6">
          <HandDrawnFrame bgColor="#ECE8DF" padding="24px" className="space-y-4">
            <div className="font-mono text-xs font-bold tracking-wider text-[#DF491E]">
              // ENGAGEMENT NOTICE
            </div>
            <p className="font-sans text-sm sm:text-base leading-relaxed text-[#171514]">
              Available for external penetration testing, web application architecture reviews, coordinated vulnerability disclosures, and red team adversary simulations.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className="w-3 h-3 rounded-full bg-[#DF491E] animate-pulse-dot" />
              <span className="font-mono text-xs font-bold uppercase text-[#171514]">
                CURRENTLY OPEN TO SELECT PROJECTS
              </span>
            </div>
          </HandDrawnFrame>

          {/* Direct channels */}
          <div className="border border-[#171514] p-5 bg-[#F2EFE7] space-y-3 font-mono text-xs">
            <div className="font-bold text-[#DF491E] text-xs tracking-wider mb-2">
              // VERIFIED DIRECT CHANNELS
            </div>
            <div className="flex items-center justify-between border-b border-[#171514]/20 pb-2">
              <span className="text-[#5A5650]">EMAIL:</span>
              <a href={`mailto:${settings.contact_email}`} className="font-bold text-[#171514] hover:text-[#DF491E]">
                {settings.contact_email} ↗
              </a>
            </div>
            <div className="flex items-center justify-between border-b border-[#171514]/20 pb-2">
              <span className="text-[#5A5650]">GITHUB:</span>
              <a href={settings.github_url} target="_blank" rel="noopener noreferrer" className="font-bold text-[#171514] hover:text-[#DF491E]">
                {settings.github_url.replace('https://', '')} ↗
              </a>
            </div>
            <div className="flex items-center justify-between border-b border-[#171514]/20 pb-2">
              <span className="text-[#5A5650]">LINKEDIN:</span>
              <a href={settings.linkedin_url} target="_blank" rel="noopener noreferrer" className="font-bold text-[#171514] hover:text-[#DF491E]">
                {settings.linkedin_url.replace('https://', '')} ↗
              </a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#5A5650]">TWITTER (X):</span>
              <a href={settings.twitter_url} target="_blank" rel="noopener noreferrer" className="font-bold text-[#171514] hover:text-[#DF491E]">
                {settings.twitter_url.replace('https://twitter.com/', '@').replace('https://x.com/', '@')} ↗
              </a>
            </div>
          </div>

          {/* PGP Public Key Block */}
          <div className="border-2 border-[#171514] p-4 bg-[#171514] text-[#ECE8DF] font-mono text-xs space-y-2">
            <div className="flex items-center justify-between border-b border-[#BCB8B1]/30 pb-1.5">
              <span className="text-[#DF491E] font-bold">[ PGP ENCRYPTION KEY ]</span>
              <button
                type="button"
                onClick={handleCopyPgp}
                className="px-2 py-0.5 bg-[#DF491E] text-[#171514] font-bold text-[10px] uppercase hover:bg-[#c73e16] transition-colors"
              >
                {copiedPgp ? 'COPIED ✓' : 'COPY KEY'}
              </button>
            </div>
            <div className="text-[10px] text-[#BCB8B1] break-all leading-tight">
              KEY ID: 0x9B42F1EA | RSA 4096-bit<br />
              FP: 4C2F 9E81 3B07 D4A2 88C1 77F3 9B42 F1EA 2025
            </div>
          </div>
        </div>

        {/* Right Column: Hand-drawn Transmission Form */}
        <div className="lg:col-span-7">
          <div className="border-2 border-[#171514] bg-[#ECE8DF] p-6 sm:p-8 shadow-md relative">
            <div className="font-mono text-xs font-bold text-[#DF491E] mb-2">
              // DISPATCH TRANSMISSION
            </div>
            <h3 className="font-display text-3xl font-bold tracking-tight text-[#171514] mb-6">
              SEND SECURE TRANSMISSION
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Spam Honeypot */}
              <input
                type="text"
                name="honeypot"
                value={formData.honeypot}
                onChange={(e) => setFormData({ ...formData, honeypot: e.target.value })}
                className="hidden"
                autoComplete="off"
                tabIndex={-1}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-xs font-bold text-[#171514] mb-1">
                    SENDER NAME *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. John Doe / Security Lead"
                    className="w-full bg-[#F2EFE7] border border-[#171514] p-3 font-mono text-xs text-[#171514] focus:outline-none focus:border-[#DF491E]"
                  />
                </div>

                <div>
                  <label className="block font-mono text-xs font-bold text-[#171514] mb-1">
                    RETURN EMAIL *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. jdoe@enterprise.sec"
                    className="w-full bg-[#F2EFE7] border border-[#171514] p-3 font-mono text-xs text-[#171514] focus:outline-none focus:border-[#DF491E]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-xs font-bold text-[#171514] mb-1">
                  TRANSMISSION SUBJECT *
                </label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g. Web App Penetration Testing Engagement / Vulnerability Inquiry"
                  className="w-full bg-[#F2EFE7] border border-[#171514] p-3 font-mono text-xs text-[#171514] focus:outline-none focus:border-[#DF491E]"
                />
              </div>

              <div>
                <label className="block font-mono text-xs font-bold text-[#171514] mb-1">
                  BRIEFING / MESSAGE *
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Describe testing scope, target systems, timeline, or research collaboration goals..."
                  className="w-full bg-[#F2EFE7] border border-[#171514] p-3 font-mono text-xs text-[#171514] focus:outline-none focus:border-[#DF491E]"
                />
              </div>

              {/* Status Display */}
              {status === 'success' && (
                <div className="p-3 bg-green-100 border border-green-800 text-green-900 font-mono text-xs flex items-center gap-2">
                  <span>✓</span>
                  <span>{statusMessage}</span>
                </div>
              )}
              {status === 'error' && (
                <div className="p-3 bg-red-100 border border-red-800 text-red-900 font-mono text-xs flex items-center gap-2">
                  <span>⚠</span>
                  <span>{statusMessage}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="btn-sketch-primary"
                >
                  {status === 'loading' ? 'TRANSMITTING...' : 'DISPATCH TRANSMISSION →'}
                </button>
                <span className="font-mono text-[10px] text-[#5A5650]">
                  ENCRYPTED IN TRANSIT
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
