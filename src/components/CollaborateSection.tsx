'use client';

import React, { useState, useEffect } from 'react';
import HandDrawnFrame from './HandDrawnFrame';
import HandDrawnButton from './HandDrawnButton';

import type { SiteSettings } from '@/lib/cms';
import InlineEditable from './admin/InlineEditable';

export interface CollaborateSectionProps {
  initialSettings?: SiteSettings | null;
  isEditingMode?: boolean;
  settingsOverride?: SiteSettings | null;
  onSettingsChange?: (field: keyof SiteSettings, value: any) => void;
}

export default function CollaborateSection({
  initialSettings,
  isEditingMode = false,
  settingsOverride,
  onSettingsChange,
}: CollaborateSectionProps = {}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    honeypot: '',
  });

  const [settings, setSettings] = useState(() => ({
    contact_email: initialSettings?.contact_email || 'contact@aayan-sec.com',
    github_url: initialSettings?.github_url || 'https://github.com/aayan-sec',
    linkedin_url: initialSettings?.linkedin_url || 'https://linkedin.com/in/aayan-sec',
    twitter_url: initialSettings?.twitter_url || 'https://twitter.com/aayan_sec',
    status_text: initialSettings?.status_text || 'OPEN FOR COLLABORATION',
    open_for_collaboration: initialSettings?.open_for_collaboration ?? true,
  }));

  const currentSettings = settingsOverride || settings;

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (initialSettings) {
      setSettings({
        contact_email: initialSettings.contact_email || 'contact@aayan-sec.com',
        github_url: initialSettings.github_url || 'https://github.com/aayan-sec',
        linkedin_url: initialSettings.linkedin_url || 'https://linkedin.com/in/aayan-sec',
        twitter_url: initialSettings.twitter_url || 'https://twitter.com/aayan_sec',
        status_text: initialSettings.status_text || 'OPEN FOR COLLABORATION',
        open_for_collaboration: initialSettings.open_for_collaboration ?? true,
      });
      return;
    }

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
            open_for_collaboration: data.settings.open_for_collaboration ?? true,
          });
        }
      })
      .catch((err) => console.error('Error fetching collaborate settings:', err));
  }, [initialSettings]);

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
              <span className={`w-3 h-3 rounded-full flex-shrink-0 ${currentSettings.open_for_collaboration !== false ? 'bg-[#DF491E] animate-pulse-dot' : 'bg-[#5A5650]'}`} />
              <span className="font-mono text-xs font-bold uppercase text-[#171514]">
                <InlineEditable
                  value={currentSettings.status_text || 'OPEN FOR COLLABORATION'}
                  onChange={(val) => onSettingsChange?.('status_text', val)}
                  isEditingMode={isEditingMode}
                  label="Collaboration Status"
                />
              </span>
              {isEditingMode && onSettingsChange && (
                <button
                  type="button"
                  onClick={() => onSettingsChange('open_for_collaboration', !currentSettings.open_for_collaboration)}
                  className={`ml-auto font-mono text-[9px] font-bold px-1.5 py-0.5 border border-[#171514] cursor-pointer ${
                    currentSettings.open_for_collaboration !== false ? 'bg-[#DF491E] text-[#171514]' : 'bg-[#ECE8DF] text-[#5A5650]'
                  }`}
                  title="Toggle active status indicator"
                >
                  {currentSettings.open_for_collaboration !== false ? 'ACTIVE' : 'INACTIVE'}
                </button>
              )}
            </div>
          </HandDrawnFrame>

          {/* Direct channels */}
          <div className="border border-[#171514] p-5 bg-[#F2EFE7] space-y-3 font-mono text-xs">
            <div className="font-bold text-[#DF491E] text-xs tracking-wider mb-2">
              // VERIFIED DIRECT CHANNELS
            </div>
            <div className="flex items-center justify-between border-b border-[#171514]/20 pb-2">
              <span className="text-[#5A5650]">EMAIL:</span>
              <div className="font-bold text-[#171514]">
                <InlineEditable
                  value={currentSettings.contact_email}
                  onChange={(val) => onSettingsChange?.('contact_email', val)}
                  isEditingMode={isEditingMode}
                  label="Contact Email"
                />
                {!isEditingMode && ' ↗'}
              </div>
            </div>
            <div className="flex items-center justify-between border-b border-[#171514]/20 pb-2">
              <span className="text-[#5A5650]">GITHUB:</span>
              <div className="font-bold text-[#171514]">
                <InlineEditable
                  value={currentSettings.github_url}
                  onChange={(val) => onSettingsChange?.('github_url', val)}
                  isEditingMode={isEditingMode}
                  label="GitHub URL"
                />
                {!isEditingMode && ' ↗'}
              </div>
            </div>
            <div className="flex items-center justify-between border-b border-[#171514]/20 pb-2">
              <span className="text-[#5A5650]">LINKEDIN:</span>
              <div className="font-bold text-[#171514]">
                <InlineEditable
                  value={currentSettings.linkedin_url}
                  onChange={(val) => onSettingsChange?.('linkedin_url', val)}
                  isEditingMode={isEditingMode}
                  label="LinkedIn URL"
                />
                {!isEditingMode && ' ↗'}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#5A5650]">TWITTER (X):</span>
              <div className="font-bold text-[#171514]">
                <InlineEditable
                  value={currentSettings.twitter_url}
                  onChange={(val) => onSettingsChange?.('twitter_url', val)}
                  isEditingMode={isEditingMode}
                  label="Twitter (X) URL"
                />
                {!isEditingMode && ' ↗'}
              </div>
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
