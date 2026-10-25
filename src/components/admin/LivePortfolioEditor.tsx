'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PortfolioClient from '@/components/PortfolioClient';
import { normalizeToolFromProject, type GitHubTool } from '@/lib/github';
import type {
  SiteSettings,
  HeroContent,
  AboutContent,
  ResearchDomain,
  SkillCategory,
  ResearchPost,
} from '@/lib/cms';

export interface LivePortfolioEditorProps {
  initialSettings: SiteSettings | null;
  initialHero: HeroContent | null;
  initialAbout: AboutContent | null;
  initialDomains: ResearchDomain[];
  initialSkills?: SkillCategory[];
  projects?: any[];
  researchList?: any[];
  onDataSaved?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export default function LivePortfolioEditor({
  initialSettings,
  initialHero,
  initialAbout,
  initialDomains,
  initialSkills = [],
  projects = [],
  researchList = [],
  onDataSaved,
  isSidebarCollapsed = false,
  onToggleSidebar,
}: LivePortfolioEditorProps) {
  // Device Viewport Modes
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Editing Mode Toggle
  const [isEditingMode, setIsEditingMode] = useState<boolean>(true);

  // Active Layer Indicator
  const [activeLayer, setActiveLayer] = useState<'all' | 'hero' | 'profile' | 'background'>('all');

  // Profile & SEO Quick Drawer State
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);

  // Working drafts
  const [hero, setHero] = useState<HeroContent>(() => initialHero || {
    id: 'hero-default',
    brand_name: 'AAYAN.',
    headline: 'SECURITY RESEARCHER & PENTESTER',
    manifesto_line_1: 'EXPLORING SYSTEMS.',
    manifesto_line_2: 'FINDING FLAWS.',
    manifesto_line_3: 'CREATING IMPACT.',
    status_label: 'OPEN FOR COLLABORATION',
    status_subtext: 'AVAILABLE FOR SECURITY AUDITS & RESEARCH',
    stat_projects: '12+',
    stat_writeups: '18+',
    stat_curiosity: '100%',
    quote: '"Security is not an absolute state, but a continuous process of adversarial exploration."',
    cta_text: 'EXPLORE DOSSIER',
    cta_target: '#research',
    descriptor_1: '[ OFFENSIVE SECURITY ]',
    descriptor_2: '[ WEB / MOBILE / CLOUD ]',
    descriptor_3: '[ RESEARCH • EXPLOIT • BUILD ]',
  });

  const [settings, setSettings] = useState<SiteSettings>(() => initialSettings || {
    id: 'settings-default',
    site_title: 'AAYAN.Sec | Cybersecurity Researcher & Pentester Portfolio',
    site_description: 'Offensive security researcher and pentester specializing in web applications and low-level vulnerability research.',
    footer_brand: 'AAYAN.SEC',
    footer_text: 'SECURITY RESEARCH DOSSIER // 2025',
    footer_subtext: 'BUILT WITH PRECISION & DISCIPLINE',
    status_text: 'OPEN FOR COLLABORATION',
    open_for_collaboration: true,
    contact_email: 'contact@aayan-sec.com',
    github_url: 'https://github.com/aayan-sec',
    linkedin_url: 'https://linkedin.com/in/aayan-sec',
    twitter_url: 'https://twitter.com/aayan_sec',
    pgp_key: '',
  });

  const [about, setAbout] = useState<AboutContent>(() => initialAbout || {
    id: 'about-default',
    status_badge: 'ACTIVE RESEARCHER',
    spec_text: 'OFFENSIVE SECURITY & PENTESTING',
    bio_paragraph_1: 'Cybersecurity researcher focused on offensive security, penetration testing, and vulnerability assessment.',
    bio_paragraph_2: 'Combining adversarial curiosity with systematic methodologies to identify systemic flaws before malicious actors do.',
    motto_quote: '"The quieter you become, the more you are able to hear."',
  });

  const [domains, setDomains] = useState<ResearchDomain[]>(() => initialDomains || []);
  const [deletedDomainIds, setDeletedDomainIds] = useState<string[]>([]);

  // Baseline copies for dirty detection & reverting
  const [baselineHero, setBaselineHero] = useState<HeroContent>(() => hero);
  const [baselineSettings, setBaselineSettings] = useState<SiteSettings>(() => settings);
  const [baselineAbout, setBaselineAbout] = useState<AboutContent>(() => about);
  const [baselineDomains, setBaselineDomains] = useState<ResearchDomain[]>(() => domains);

  // Sync with prop updates if initial props change
  useEffect(() => {
    if (initialHero) {
      setHero(initialHero);
      setBaselineHero(initialHero);
    }
  }, [initialHero]);

  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
      setBaselineSettings(initialSettings);
    }
  }, [initialSettings]);

  useEffect(() => {
    if (initialAbout) {
      setAbout(initialAbout);
      setBaselineAbout(initialAbout);
    }
  }, [initialAbout]);

  useEffect(() => {
    if (initialDomains) {
      setDomains(initialDomains);
      setBaselineDomains(initialDomains);
    }
  }, [initialDomains]);

  // Saving states & honest feedback
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState<string>('');

  // Dirty detection
  const isHeroDirty = useMemo(() => {
    return JSON.stringify(hero) !== JSON.stringify(baselineHero);
  }, [hero, baselineHero]);

  const isSettingsDirty = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(baselineSettings);
  }, [settings, baselineSettings]);

  const isAboutDirty = useMemo(() => {
    return (
      JSON.stringify(about) !== JSON.stringify(baselineAbout) ||
      JSON.stringify(domains) !== JSON.stringify(baselineDomains) ||
      deletedDomainIds.length > 0
    );
  }, [about, baselineAbout, domains, baselineDomains, deletedDomainIds]);

  const totalUnsavedChanges = useMemo(() => {
    let count = 0;
    if (isHeroDirty) count += 1;
    if (isSettingsDirty) count += 1;
    if (isAboutDirty) count += 1;
    return count;
  }, [isHeroDirty, isSettingsDirty, isAboutDirty]);

  // Warn before closing tab with unsaved edits
  useEffect(() => {
    if (totalUnsavedChanges > 0) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = '';
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [totalUnsavedChanges]);

  // Change handlers
  const handleHeroChange = useCallback((field: keyof HeroContent, value: string) => {
    setHero((prev) => ({ ...prev, [field]: value }));
    setSaveStatus('idle');
  }, []);

  const handleSettingsChange = useCallback((field: keyof SiteSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setSaveStatus('idle');
  }, []);

  const handleAboutChange = useCallback((field: keyof AboutContent, value: string) => {
    setAbout((prev) => ({ ...prev, [field]: value }));
    setSaveStatus('idle');
  }, []);

  const handleDomainChange = useCallback((index: number, field: keyof ResearchDomain, value: string) => {
    setDomains((prev) => {
      const copy = [...prev];
      if (copy[index]) {
        copy[index] = { ...copy[index], [field]: value };
      }
      return copy;
    });
    setSaveStatus('idle');
  }, []);

  const handleAddDomain = useCallback(() => {
    setDomains((prev) => {
      const newNum = String(prev.length + 1).padStart(2, '0');
      const newDomain: ResearchDomain = {
        id: `new-${Date.now()}`,
        domain_num: newNum,
        domain_code: 'NEW FOCUS',
        title: 'New Research Domain',
        description: 'Provide an operative summary of your expertise in this focus area.',
        display_order: prev.length + 1,
      };
      return [...prev, newDomain];
    });
    setSaveStatus('idle');
  }, []);

  const handleDeleteDomain = useCallback((index: number) => {
    setDomains((prev) => {
      const item = prev[index];
      if (item && item.id && !String(item.id).startsWith('new-')) {
        setDeletedDomainIds((old) => [...old, String(item.id)]);
      }
      const filtered = prev.filter((_, i) => i !== index);
      // Renumber
      return filtered.map((d, i) => ({
        ...d,
        domain_num: String(i + 1).padStart(2, '0'),
        display_order: i + 1,
      }));
    });
    setSaveStatus('idle');
  }, []);

  const handleMoveDomain = useCallback((index: number, direction: 'up' | 'down') => {
    setDomains((prev) => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy.map((d, i) => ({
        ...d,
        domain_num: String(i + 1).padStart(2, '0'),
        display_order: i + 1,
      }));
    });
    setSaveStatus('idle');
  }, []);

  // Revert / Cancel all unsaved changes
  const handleRevert = () => {
    if (totalUnsavedChanges === 0) return;
    if (window.confirm('Are you sure you want to discard all unsaved edits and restore current published content?')) {
      setHero(baselineHero);
      setSettings(baselineSettings);
      setAbout(baselineAbout);
      setDomains(baselineDomains);
      setDeletedDomainIds([]);
      setSaveStatus('idle');
      setSaveMessage('Edits reverted to saved state.');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  // Honest Supabase Persistence Save handler
  const handleSave = async () => {
    if (totalUnsavedChanges === 0) return;

    // Input Validation
    if (settings.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.contact_email)) {
      setSaveStatus('error');
      setSaveMessage('Validation Error: Contact email address format is invalid.');
      return;
    }

    const urlCheckList = [
      { name: 'GitHub URL', val: settings.github_url },
      { name: 'LinkedIn URL', val: settings.linkedin_url },
      { name: 'Twitter URL', val: settings.twitter_url },
    ];
    for (const item of urlCheckList) {
      if (item.val && !/^https?:\/\/.+/.test(item.val)) {
        setSaveStatus('error');
        setSaveMessage(`Validation Error: ${item.name} must start with http:// or https://`);
        return;
      }
    }

    setIsSaving(true);
    setSaveStatus('saving');
    setSaveMessage('Persisting changes directly to Supabase...');

    try {
      const savePromises: Promise<Response>[] = [];

      // 1. Hero Content
      if (isHeroDirty) {
        savePromises.push(
          fetch('/api/admin/hero', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(hero),
          })
        );
      }

      // 2. Site Settings
      if (isSettingsDirty) {
        savePromises.push(
          fetch('/api/admin/site-settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings),
          })
        );
      }

      // 3. About & Research Domains
      if (isAboutDirty) {
        // Handle deletions first
        for (const delId of deletedDomainIds) {
          await fetch(`/api/admin/about?type=domain&id=${encodeURIComponent(delId)}`, {
            method: 'DELETE',
          });
        }

        savePromises.push(
          fetch('/api/admin/about', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              about,
              domains: domains.map((d, idx) => ({ ...d, display_order: idx + 1 })),
            }),
          })
        );
      }

      const results = await Promise.all(savePromises);
      const parsedResults = await Promise.all(results.map((r) => r.json()));

      const hasError = parsedResults.some((res, idx) => !results[idx].ok || !res.success);

      if (hasError) {
        const errorDetail = parsedResults.find((p) => p.error)?.error || 'One or more sections failed to persist.';
        setSaveStatus('error');
        setSaveMessage(`Save Failed: ${errorDetail}`);
      } else {
        // Update Baselines
        setBaselineHero(hero);
        setBaselineSettings(settings);
        setBaselineAbout(about);
        setBaselineDomains(domains);
        setDeletedDomainIds([]);

        setSaveStatus('saved');
        setSaveMessage('✓ All portfolio edits successfully synchronized with Supabase.');
        setTimeout(() => {
          setSaveStatus('idle');
          setSaveMessage('');
        }, 4000);

        if (onDataSaved) {
          onDataSaved();
        }
      }
    } catch (err: any) {
      console.error('Save error:', err);
      setSaveStatus('error');
      setSaveMessage(`Network/Server error: ${err.message || 'Failed to communicate with API.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Smooth scroll helper for layer jumps
  const jumpToLayer = (layer: 'hero' | 'profile' | 'background' | 'all') => {
    setActiveLayer(layer);
    let targetId = 'overview';
    if (layer === 'hero') targetId = 'overview';
    else if (layer === 'profile') targetId = 'collaborate';
    else if (layer === 'background') targetId = 'background';
    else if (layer === 'all') targetId = 'overview';

    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Convert projects to initialTools
  const initialTools: GitHubTool[] = useMemo(() => {
    return projects.map(normalizeToolFromProject);
  }, [projects]);

  const projectsCount = projects.length;
  const writeupsCount = researchList.length;

  return (
    <div className="relative w-full flex flex-col bg-[#ECE8DF] min-h-screen">
      {/* ------------------------------------------------------------- */}
      {/* TOP STICKY COMPACT TOOLBAR                                    */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-50 w-full bg-[#F2EFE7] border-b-2 border-[#171514] shadow-md select-none">
        {/* Main Toolbar Row */}
        <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-[#171514]/20">
          {/* Left: Branding & Mode Switcher */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#DF491E] animate-pulse" />
              <span className="font-display font-black text-sm tracking-wider text-[#171514]">
                LIVE PORTFOLIO EDITOR
              </span>
            </div>

            <div className="h-4 w-[1px] bg-[#171514]/30" />

            {/* Sidebar Toggle Button to Expand Horizontal Canvas */}
            {onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className={`px-2.5 py-1 font-mono text-xs font-bold border border-[#171514] transition-colors flex items-center gap-1.5 cursor-pointer ${
                  isSidebarCollapsed
                    ? 'bg-[#171514] text-[#ECE8DF] hover:bg-[#DF491E] hover:text-[#171514]'
                    : 'bg-[#ECE8DF] text-[#171514] hover:bg-[#D7D3CB]'
                }`}
                title={isSidebarCollapsed ? 'Show admin sidebar navigation' : 'Hide admin sidebar navigation to give editor full screen width'}
              >
                <span>{isSidebarCollapsed ? '▶' : '◀'}</span>
                <span className="hidden sm:inline">{isSidebarCollapsed ? 'SHOW ADMIN MENU' : 'EXPAND CANVAS'}</span>
              </button>
            )}

            {/* Mode Toggle Button */}
            <div className="flex items-center border border-[#171514] bg-[#ECE8DF] p-0.5 font-mono text-xs">
              <button
                type="button"
                onClick={() => setIsEditingMode(true)}
                className={`px-3 py-1 font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isEditingMode
                    ? 'bg-[#DF491E] text-[#171514]'
                    : 'text-[#5A5650] hover:text-[#171514]'
                }`}
                title="Enable clickable inline text editing directly on the page"
              >
                <span>✏️</span>
                <span>EDITING MODE</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditingMode(false)}
                className={`px-3 py-1 font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  !isEditingMode
                    ? 'bg-[#171514] text-[#ECE8DF]'
                    : 'text-[#5A5650] hover:text-[#171514]'
                }`}
                title="Preview the exact public presentation without outlines or toolbars"
              >
                <span>👁️</span>
                <span>PREVIEW MODE</span>
              </button>
            </div>
          </div>

          {/* Center: Responsive Viewport Switcher */}
          <div className="flex items-center border border-[#171514] bg-[#ECE8DF] p-0.5 font-mono text-xs">
            <button
              type="button"
              onClick={() => setViewport('desktop')}
              className={`px-3 py-1 font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewport === 'desktop'
                  ? 'bg-[#171514] text-[#ECE8DF]'
                  : 'text-[#5A5650] hover:text-[#171514]'
              }`}
              title="Full Desktop Screen (Natural 100% width)"
            >
              <span>🖥️</span>
              <span className="hidden sm:inline">DESKTOP</span>
            </button>
            <button
              type="button"
              onClick={() => setViewport('tablet')}
              className={`px-3 py-1 font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewport === 'tablet'
                  ? 'bg-[#171514] text-[#ECE8DF]'
                  : 'text-[#5A5650] hover:text-[#171514]'
              }`}
              title="Tablet View (768px frame)"
            >
              <span>📱</span>
              <span className="hidden sm:inline">TABLET</span>
              <span className="text-[10px] text-[#5A5650] hidden md:inline">(768px)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewport('mobile')}
              className={`px-3 py-1 font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewport === 'mobile'
                  ? 'bg-[#171514] text-[#ECE8DF]'
                  : 'text-[#5A5650] hover:text-[#171514]'
              }`}
              title="Mobile View (375px frame)"
            >
              <span>📲</span>
              <span className="hidden sm:inline">MOBILE</span>
              <span className="text-[10px] text-[#5A5650] hidden md:inline">(375px)</span>
            </button>
          </div>

          {/* Right: Unsaved Badge & Action Buttons */}
          <div className="flex items-center gap-2 font-mono text-xs">
            {/* Status indicator */}
            {totalUnsavedChanges > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#DF491E]/10 border border-[#DF491E] text-[#DF491E] font-bold">
                <span className="w-2 h-2 rounded-full bg-[#DF491E] animate-pulse" />
                <span>{totalUnsavedChanges} UNSAVED</span>
              </div>
            )}

            {saveStatus === 'saved' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#10B981]/10 border border-[#10B981] text-[#10B981] font-bold">
                <span>✓ SAVED</span>
              </div>
            )}

            {saveStatus === 'error' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#DF491E] text-[#ECE8DF] font-bold">
                <span>✕ FAILED</span>
              </div>
            )}

            {/* Revert / Cancel Button */}
            <button
              type="button"
              onClick={handleRevert}
              disabled={totalUnsavedChanges === 0 || isSaving}
              className="px-3 py-1.5 border border-[#171514] bg-[#ECE8DF] hover:bg-[#D7D3CB] text-[#171514] font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Discard unsaved changes and restore to published version"
            >
              REVERT
            </button>

            {/* Save Changes Action */}
            <button
              type="button"
              onClick={handleSave}
              disabled={totalUnsavedChanges === 0 || isSaving}
              className={`px-4 py-1.5 font-bold border border-[#171514] tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                totalUnsavedChanges > 0
                  ? 'bg-[#DF491E] text-[#171514] hover:bg-[#C73E16] shadow-sm'
                  : 'bg-[#ECE8DF] text-[#5A5650] opacity-50 cursor-not-allowed'
              }`}
            >
              {isSaving ? (
                <>
                  <span className="w-2.5 h-2.5 bg-[#171514] animate-spin" />
                  <span>SAVING...</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>SAVE CHANGES</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sub-Bar: Layer Switcher & Quick Navigation */}
        <div className="px-4 py-1.5 bg-[#ECE8DF] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[#5A5650] text-[11px] mr-2">// WORKSPACE LAYERS:</span>

            <button
              type="button"
              onClick={() => jumpToLayer('hero')}
              className={`px-2.5 py-0.5 border transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeLayer === 'hero'
                  ? 'bg-[#171514] text-[#ECE8DF] border-[#171514]'
                  : 'bg-[#F2EFE7] text-[#171514] border-[#171514]/30 hover:border-[#171514]'
              }`}
            >
              <span>A. HERO &amp; OVERVIEW</span>
              {isHeroDirty && <span className="w-1.5 h-1.5 rounded-full bg-[#DF491E]" />}
            </button>

            <button
              type="button"
              onClick={() => jumpToLayer('profile')}
              className={`px-2.5 py-0.5 border transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeLayer === 'profile'
                  ? 'bg-[#171514] text-[#ECE8DF] border-[#171514]'
                  : 'bg-[#F2EFE7] text-[#171514] border-[#171514]/30 hover:border-[#171514]'
              }`}
            >
              <span>B. GLOBAL PROFILE &amp; SOCIAL</span>
              {isSettingsDirty && <span className="w-1.5 h-1.5 rounded-full bg-[#DF491E]" />}
            </button>

            <button
              type="button"
              onClick={() => jumpToLayer('background')}
              className={`px-2.5 py-0.5 border transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeLayer === 'background'
                  ? 'bg-[#171514] text-[#ECE8DF] border-[#171514]'
                  : 'bg-[#F2EFE7] text-[#171514] border-[#171514]/30 hover:border-[#171514]'
              }`}
            >
              <span>C. BACKGROUND &amp; RESEARCH DOMAINS</span>
              {isAboutDirty && <span className="w-1.5 h-1.5 rounded-full bg-[#DF491E]" />}
            </button>

            <button
              type="button"
              onClick={() => jumpToLayer('all')}
              className={`px-2.5 py-0.5 border transition-colors cursor-pointer ${
                activeLayer === 'all'
                  ? 'bg-[#171514] text-[#ECE8DF] border-[#171514]'
                  : 'bg-[#F2EFE7] text-[#171514] border-[#171514]/30 hover:border-[#171514]'
              }`}
            >
              FULL DOSSIER
            </button>
          </div>

          {/* Quick Drawer Button & Instruction */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-[#5A5650] hidden xl:inline">
              {isEditingMode ? '💡 Click highlighted text directly on canvas to edit in place' : '👁️ Public preview mode active'}
            </span>
            <button
              type="button"
              onClick={() => setIsProfileDrawerOpen(!isProfileDrawerOpen)}
              className="px-2.5 py-0.5 border border-[#171514] bg-[#F2EFE7] hover:bg-[#171514] hover:text-[#ECE8DF] font-bold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>⚙️</span>
              <span>PROFILE &amp; SEO DRAWER</span>
            </button>
          </div>
        </div>

        {/* Status notification toast under bar */}
        {saveMessage && (
          <div
            className={`px-4 py-1.5 font-mono text-xs flex items-center justify-between border-t border-[#171514] ${
              saveStatus === 'error'
                ? 'bg-[#DF491E] text-[#ECE8DF] font-bold'
                : saveStatus === 'saved'
                ? 'bg-[#10B981] text-[#171514] font-bold'
                : 'bg-[#171514] text-[#ECE8DF]'
            }`}
          >
            <span>{saveMessage}</span>
            <button
              onClick={() => setSaveMessage('')}
              className="font-bold hover:underline cursor-pointer text-xs"
            >
              ✕
            </button>
          </div>
        )}
      </header>

      {/* ------------------------------------------------------------- */}
      {/* GLOBAL PROFILE & SEO SLIDE-OVER DRAWER                        */}
      {/* ------------------------------------------------------------- */}
      {isProfileDrawerOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[500px] bg-[#F2EFE7] border-l-2 border-[#171514] shadow-2xl flex flex-col font-mono text-xs">
          <div className="p-4 border-b-2 border-[#171514] flex items-center justify-between bg-[#ECE8DF]">
            <div>
              <div className="text-[10px] text-[#DF491E] font-bold">// GLOBAL SETTINGS</div>
              <h3 className="font-display font-black text-lg text-[#171514]">
                PROFILE, SOCIAL &amp; SEO
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsProfileDrawerOpen(false)}
              className="p-1.5 border border-[#171514] hover:bg-[#DF491E] hover:text-[#171514] transition-colors cursor-pointer"
            >
              ✕ CLOSE
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div className="p-3 bg-[#DF491E]/10 border border-[#DF491E] text-[#171514] text-[11px] leading-relaxed">
              <strong>Unified Synchronization:</strong> Edits made here immediately propagate across the Live Canvas Navigation Rail, Connect Channels, and Footer in real time.
            </div>

            {/* Hero Descriptors Section in Drawer */}
            <div className="border border-[#171514] p-4 bg-[#ECE8DF] space-y-3">
              <div className="font-bold text-[#171514] uppercase tracking-wider text-[11px]">
                // HERO BRACKETED DESCRIPTORS
              </div>
              <div>
                <label className="block text-[11px] text-[#5A5650] mb-1">Descriptor 1</label>
                <input
                  type="text"
                  value={hero.descriptor_1 || ''}
                  onChange={(e) => handleHeroChange('descriptor_1', e.target.value)}
                  className="w-full bg-[#F2EFE7] border border-[#171514] p-2 text-[#171514] focus:outline-none focus:border-[#DF491E]"
                  placeholder="[ OFFENSIVE SECURITY ]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#5A5650] mb-1">Descriptor 2</label>
                <input
                  type="text"
                  value={hero.descriptor_2 || ''}
                  onChange={(e) => handleHeroChange('descriptor_2', e.target.value)}
                  className="w-full bg-[#F2EFE7] border border-[#171514] p-2 text-[#171514] focus:outline-none focus:border-[#DF491E]"
                  placeholder="[ WEB / MOBILE / CLOUD ]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#5A5650] mb-1">Descriptor 3</label>
                <input
                  type="text"
                  value={hero.descriptor_3 || ''}
                  onChange={(e) => handleHeroChange('descriptor_3', e.target.value)}
                  className="w-full bg-[#F2EFE7] border border-[#171514] p-2 text-[#171514] focus:outline-none focus:border-[#DF491E]"
                  placeholder="[ RESEARCH • EXPLOIT • BUILD ]"
                />
              </div>
            </div>

            {/* SEO Section */}
            <div className="border border-[#171514] p-4 bg-[#ECE8DF] space-y-3">
              <div className="font-bold text-[#171514] uppercase tracking-wider text-[11px]">
                // SEO METADATA
              </div>
              <div>
                <label className="block text-[11px] text-[#5A5650] mb-1">Portfolio Page Title</label>
                <input
                  type="text"
                  value={settings.site_title || ''}
                  onChange={(e) => handleSettingsChange('site_title', e.target.value)}
                  className="w-full bg-[#F2EFE7] border border-[#171514] p-2 text-[#171514] focus:outline-none focus:border-[#DF491E]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#5A5650] mb-1">Meta Description</label>
                <textarea
                  rows={3}
                  value={settings.site_description || ''}
                  onChange={(e) => handleSettingsChange('site_description', e.target.value)}
                  className="w-full bg-[#F2EFE7] border border-[#171514] p-2 text-[#171514] focus:outline-none focus:border-[#DF491E]"
                />
              </div>
            </div>

            {/* Contact & Social Links */}
            <div className="border border-[#171514] p-4 bg-[#ECE8DF] space-y-3">
              <div className="font-bold text-[#171514] uppercase tracking-wider text-[11px]">
                // CHANNELS &amp; SOCIAL
              </div>
              <div>
                <label className="block text-[11px] text-[#5A5650] mb-1">Primary Contact Email</label>
                <input
                  type="email"
                  value={settings.contact_email || ''}
                  onChange={(e) => handleSettingsChange('contact_email', e.target.value)}
                  className="w-full bg-[#F2EFE7] border border-[#171514] p-2 text-[#171514] focus:outline-none focus:border-[#DF491E]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#5A5650] mb-1">GitHub Profile URL</label>
                <input
                  type="url"
                  value={settings.github_url || ''}
                  onChange={(e) => handleSettingsChange('github_url', e.target.value)}
                  className="w-full bg-[#F2EFE7] border border-[#171514] p-2 text-[#171514] focus:outline-none focus:border-[#DF491E]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#5A5650] mb-1">LinkedIn Profile URL</label>
                <input
                  type="url"
                  value={settings.linkedin_url || ''}
                  onChange={(e) => handleSettingsChange('linkedin_url', e.target.value)}
                  className="w-full bg-[#F2EFE7] border border-[#171514] p-2 text-[#171514] focus:outline-none focus:border-[#DF491E]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#5A5650] mb-1">Twitter / X URL</label>
                <input
                  type="url"
                  value={settings.twitter_url || ''}
                  onChange={(e) => handleSettingsChange('twitter_url', e.target.value)}
                  className="w-full bg-[#F2EFE7] border border-[#171514] p-2 text-[#171514] focus:outline-none focus:border-[#DF491E]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#5A5650] mb-1">PGP Public Fingerprint / Key</label>
                <input
                  type="text"
                  value={settings.pgp_key || ''}
                  onChange={(e) => handleSettingsChange('pgp_key', e.target.value)}
                  className="w-full bg-[#F2EFE7] border border-[#171514] p-2 text-[#171514] focus:outline-none focus:border-[#DF491E]"
                  placeholder="e.g. 4A8B 9C1D 2E3F 4G5H..."
                />
              </div>
            </div>

            {/* Direct Collaboration Switch */}
            <div className="border border-[#171514] p-4 bg-[#ECE8DF] space-y-3">
              <div className="font-bold text-[#171514] uppercase tracking-wider text-[11px]">
                // COLLABORATION AVAILABILITY
              </div>
              <div>
                <label className="block text-[11px] text-[#5A5650] mb-1">Status Banner Text</label>
                <input
                  type="text"
                  value={settings.status_text || ''}
                  onChange={(e) => handleSettingsChange('status_text', e.target.value)}
                  className="w-full bg-[#F2EFE7] border border-[#171514] p-2 text-[#171514] focus:outline-none focus:border-[#DF491E]"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={settings.open_for_collaboration}
                  onChange={(e) => handleSettingsChange('open_for_collaboration', e.target.checked)}
                  className="w-4 h-4 text-[#DF491E] rounded-none border border-[#171514] accent-[#DF491E]"
                />
                <span className="font-bold text-[#171514]">Open for direct security inquiries &amp; engagements</span>
              </label>
            </div>
          </div>

          <div className="p-4 border-t-2 border-[#171514] bg-[#ECE8DF] flex items-center justify-between">
            <span className="text-[11px] text-[#5A5650]">
              {isSettingsDirty ? '● Unsaved edits in profile' : 'Profile up to date'}
            </span>
            <button
              type="button"
              onClick={() => setIsProfileDrawerOpen(false)}
              className="px-4 py-2 border border-[#171514] bg-[#171514] text-[#ECE8DF] font-bold hover:bg-[#DF491E] hover:text-[#171514] transition-colors cursor-pointer"
            >
              DONE / PREVIEW ON CANVAS
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MAIN VISUAL EDITING CANVAS                                    */}
      {/* ------------------------------------------------------------- */}
      <div
        className={`flex-1 w-full transition-colors duration-200 ${
          viewport === 'desktop'
            ? 'bg-[#ECE8DF] p-0'
            : 'bg-[#171514] py-8 px-4 flex justify-center items-start min-h-[calc(100vh-100px)] overflow-x-auto'
        }`}
      >
        <div
          className={`transition-all duration-300 w-full ${
            viewport === 'desktop'
              ? 'max-w-none shadow-none'
              : viewport === 'tablet'
              ? 'max-w-[768px] my-2 shadow-2xl border-4 border-[#171514] rounded-sm overflow-hidden ring-8 ring-black/40'
              : 'max-w-[375px] my-2 shadow-2xl border-4 border-[#171514] rounded-sm overflow-hidden ring-8 ring-black/40'
          }`}
        >
          {/* Simulated Device Frame Top Header for Tablet/Mobile */}
          {viewport !== 'desktop' && (
            <div className="bg-[#171514] text-[#ECE8DF] font-mono text-[10px] px-3 py-1.5 flex items-center justify-between border-b border-[#ECE8DF]/20 select-none">
              <span className="text-[#DF491E] font-bold">
                [{viewport.toUpperCase()} EMULATION — {viewport === 'tablet' ? '768px' : '375px'}]
              </span>
              <span className="text-[#BCB8B1]">INTERACTIVE PORTFOLIO CANVAS</span>
            </div>
          )}

          {/* Actual Public Portfolio Website rendered live with editor bindings */}
          <div className="bg-[#ECE8DF]">
            <PortfolioClient
              initialSettings={settings}
              initialHero={hero}
              initialAbout={about}
              initialDomains={domains}
              initialSkills={initialSkills}
              initialTools={initialTools}
              initialResearch={researchList}
              projectsCount={projectsCount}
              writeupsCount={writeupsCount}
              isEditingMode={isEditingMode}
              settingsOverride={settings}
              heroOverride={hero}
              aboutOverride={about}
              domainsOverride={domains}
              onSettingsChange={handleSettingsChange}
              onHeroChange={handleHeroChange}
              onAboutChange={handleAboutChange}
              onDomainChange={handleDomainChange}
              onAddDomain={handleAddDomain}
              onDeleteDomain={handleDeleteDomain}
              onMoveDomain={handleMoveDomain}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
