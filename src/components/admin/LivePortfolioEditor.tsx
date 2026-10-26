'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PortfolioClient from '@/components/PortfolioClient';
import { normalizeToolFromProject, type GitHubTool } from '@/lib/github';
import type {
  SiteSettings,
  HeroContent,
  HeroSpotlightMessage,
  AboutContent,
  ResearchDomain,
  SkillCategory,
  ResearchPost,
} from '@/lib/cms';
import {
  normalizeSocialAccounts,
  isValidSocialUrl,
  SocialIcon,
  PLATFORM_PRESETS,
  getPlatformPreset,
  formatSocialIdentity,
  type SocialAccount,
} from '@/lib/socials';

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
  // Editing Mode Toggle
  const [isEditingMode, setIsEditingMode] = useState<boolean>(true);

  // Configuration Drawer State (Tabs: 'spotlight' | 'profile' | 'socials')
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'spotlight' | 'profile' | 'socials'>('spotlight');

  // Working drafts
  const [hero, setHero] = useState<HeroContent>(() => initialHero || {
    id: 'hero-default',
    brand_name: 'AAYAN.',
    headline: 'SECURITY RESEARCHER & PENTESTER',
    manifesto_line_1: 'EXPLORING SYSTEMS.',
    manifesto_line_2: 'FINDING FLAWS.',
    manifesto_line_3: 'CREATING IMPACT.',
    status_label: 'OPEN FOR COLLABORATION',
    status_subtext: 'Research • Bug Bounty • Projects',
    stat_projects: '10+',
    stat_writeups: '5+',
    stat_curiosity: '∞',
    quote: 'CURIOSITY ALWAYS FINDS A WAY IN.',
    cta_text: 'VIEW MY RESEARCH',
    cta_target: 'research',
    descriptor_1: '[ OFFENSIVE SECURITY ]',
    descriptor_2: '[ WEB / MOBILE / CLOUD ]',
    descriptor_3: '[ RESEARCH • EXPLOIT • BUILD ]',
    wordmark_prefix: 'AAYAN',
    wordmark_suffix: '.Sec',
    role_title: 'SECURITY RESEARCHER / PENTESTER',
    stat_1_label: 'PROJECTS',
    stat_2_label: 'WRITE-UPS',
    stat_3_label: 'CURIOSITY',
    stat_1_override: '',
    stat_2_override: '',
    stat_1_enabled: true,
    stat_2_enabled: true,
    stat_3_enabled: true,
    spotlight_enabled: false,
    spotlight_mode: 'alternate',
    spotlight_auto_rotate: true,
    spotlight_title: 'OPEN FOR COLLABORATION',
    spotlight_subtitle: 'Web Security • Authorized Penetration Testing',
    spotlight_cta_text: 'INITIATE CONTACT →',
    spotlight_cta_url: '#collaborate',
    spotlight_messages: [],
  });

  // Local editor preference for portfolio navigation rail visibility (does not affect public site)
  const [showCanvasNav, setShowCanvasNav] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('aayan_admin_show_canvas_nav');
      if (stored !== null) return stored === 'true';
    }
    return true;
  });

  const handleToggleCanvasNav = () => {
    setShowCanvasNav((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('aayan_admin_show_canvas_nav', String(next));
      }
      return next;
    });
  };

  const [settings, setSettings] = useState<SiteSettings>(() => {
    if (initialSettings) {
      return {
        ...initialSettings,
        social_links: normalizeSocialAccounts(initialSettings),
      };
    }
    return {
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
      social_links: [
        { id: 'github', platform: 'github', label: 'GITHUB', url: 'https://github.com/aayan-sec', icon: 'github', display_order: 1, enabled: true },
        { id: 'linkedin', platform: 'linkedin', label: 'LINKEDIN', url: 'https://linkedin.com/in/aayan-sec', icon: 'linkedin', display_order: 2, enabled: true },
        { id: 'twitter', platform: 'twitter', label: 'TWITTER (X)', url: 'https://twitter.com/aayan_sec', icon: 'twitter', display_order: 3, enabled: true },
      ],
      og_title: '',
      og_description: '',
      og_image: '',
      canonical_url: '',
      pgp_key: '',
    };
  });

  // Social Account Manager State (inside drawer)
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [formPlatform, setFormPlatform] = useState<string>('github');
  const [formLabel, setFormLabel] = useState<string>('GITHUB');
  const [formUrl, setFormUrl] = useState<string>('');
  const [formDisplayName, setFormDisplayName] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  const currentSocialAccounts = useMemo(() => {
    return normalizeSocialAccounts(settings);
  }, [settings]);

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
      const normalized = {
        ...initialSettings,
        social_links: normalizeSocialAccounts(initialSettings),
      };
      setSettings(normalized);
      setBaselineSettings(normalized);
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
  const handleHeroChange = useCallback((field: keyof HeroContent, value: any) => {
    setHero((prev) => ({ ...prev, [field]: value }));
    setSaveStatus('idle');
  }, []);

  const handleSettingsChange = useCallback((field: keyof SiteSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setSaveStatus('idle');
  }, []);

  // Spotlight message management form state & handlers
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [msgTitle, setMsgTitle] = useState('');
  const [msgSubtitle, setMsgSubtitle] = useState('');
  const [msgBadge, setMsgBadge] = useState('// SPOTLIGHT');
  const [msgCtaText, setMsgCtaText] = useState('LEARN MORE →');
  const [msgCtaUrl, setMsgCtaUrl] = useState('#collaborate');

  const currentSpotlightMessages = useMemo(() => {
    return Array.isArray(hero.spotlight_messages) ? hero.spotlight_messages : [];
  }, [hero.spotlight_messages]);

  const handleStartAddMessage = (presetType?: string) => {
    setEditingMsgId('new');
    if (presetType === 'role') {
      setMsgTitle('SECURITY RESEARCHER & PENTESTER');
      setMsgSubtitle('Adversarial Emulation • Vulnerability Analysis');
      setMsgBadge('// ROLE');
      setMsgCtaText('EXPLORE DOSSIER →');
      setMsgCtaUrl('#overview');
    } else if (presetType === 'services') {
      setMsgTitle('AUTHORIZED SECURITY AUDITS');
      setMsgSubtitle('Web Apps • Cloud Infrastructures • API Reviews');
      setMsgBadge('// SERVICES');
      setMsgCtaText('INITIATE INQUIRY →');
      setMsgCtaUrl('#collaborate');
    } else if (presetType === 'research') {
      setMsgTitle('LATEST SECURITY ADVISORIES');
      setMsgSubtitle('Zero-days • Protocol Exploits • CVE Disclosures');
      setMsgBadge('// RESEARCH');
      setMsgCtaText('READ WRITE-UPS →');
      setMsgCtaUrl('#research');
    } else if (presetType === 'tools') {
      setMsgTitle('NEW OFFENSIVE ARSENAL TOOL');
      setMsgSubtitle('Open Source Security Tools & Frameworks');
      setMsgBadge('// ARSENAL');
      setMsgCtaText('VIEW SOURCE →');
      setMsgCtaUrl('#tools');
    } else {
      setMsgTitle('OPEN FOR COLLABORATION');
      setMsgSubtitle('Web Security • Authorized Penetration Testing');
      setMsgBadge('// SPOTLIGHT');
      setMsgCtaText('GET IN TOUCH →');
      setMsgCtaUrl('#collaborate');
    }
  };

  const handleStartEditMessage = (msg: HeroSpotlightMessage) => {
    setEditingMsgId(msg.id);
    setMsgTitle(msg.title);
    setMsgSubtitle(msg.subtitle);
    setMsgBadge(msg.badge || '// SPOTLIGHT');
    setMsgCtaText(msg.cta_text || '');
    setMsgCtaUrl(msg.cta_url || '');
  };

  const handleCancelMessageForm = () => {
    setEditingMsgId(null);
  };

  const handleSaveMessageForm = () => {
    if (!msgTitle.trim()) return;
    const currentList = [...currentSpotlightMessages];
    if (editingMsgId === 'new') {
      const newMsg: HeroSpotlightMessage = {
        id: `msg-${Date.now()}`,
        title: msgTitle.trim(),
        subtitle: msgSubtitle.trim(),
        badge: msgBadge.trim() || '// SPOTLIGHT',
        cta_text: msgCtaText.trim(),
        cta_url: msgCtaUrl.trim() || '#collaborate',
        enabled: true,
        order: currentList.length + 1,
      };
      handleHeroChange('spotlight_messages', [...currentList, newMsg]);
    } else {
      const updated = currentList.map((m) =>
        m.id === editingMsgId
          ? {
              ...m,
              title: msgTitle.trim(),
              subtitle: msgSubtitle.trim(),
              badge: msgBadge.trim() || '// SPOTLIGHT',
              cta_text: msgCtaText.trim(),
              cta_url: msgCtaUrl.trim() || '#collaborate',
            }
          : m
      );
      handleHeroChange('spotlight_messages', updated);
    }
    setEditingMsgId(null);
  };

  const handleToggleMessageEnabled = (id: string) => {
    const updated = currentSpotlightMessages.map((m) =>
      m.id === id ? { ...m, enabled: !m.enabled } : m
    );
    handleHeroChange('spotlight_messages', updated);
  };

  const handleRemoveMessage = (id: string) => {
    const updated = currentSpotlightMessages.filter((m) => m.id !== id);
    handleHeroChange('spotlight_messages', updated);
  };

  const handleMoveMessage = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentSpotlightMessages.length) return;
    const copy = [...currentSpotlightMessages];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    const reordered = copy.map((m, idx) => ({ ...m, order: idx + 1 }));
    handleHeroChange('spotlight_messages', reordered);
  };

  // Social accounts management handlers
  const handleStartAddAccount = () => {
    setEditingAccountId('new');
    setFormPlatform('github');
    setFormLabel('GITHUB');
    setFormUrl('');
    setFormDisplayName('');
    setFormError('');
  };

  const handleStartEditAccount = (acc: SocialAccount) => {
    setEditingAccountId(acc.id);
    setFormPlatform(acc.platform);
    setFormLabel(acc.label);
    setFormUrl(acc.url);
    setFormDisplayName(acc.display_name || '');
    setFormError('');
  };

  const handleCancelAccountForm = () => {
    setEditingAccountId(null);
    setFormDisplayName('');
    setFormError('');
  };

  const handlePlatformChange = (newPlatform: string) => {
    setFormPlatform(newPlatform);
    const preset = getPlatformPreset(newPlatform);
    if (newPlatform !== 'custom') {
      setFormLabel(preset.defaultLabel);
    }
  };

  const handleSaveAccountForm = () => {
    const trimmedUrl = formUrl.trim();
    const trimmedLabel = formLabel.trim();
    const trimmedDisplayName = formDisplayName.trim();

    if (!trimmedUrl) {
      setFormError('Profile URL is required.');
      return;
    }
    if (!isValidSocialUrl(trimmedUrl)) {
      setFormError('URL must start with https:// (e.g. https://github.com/yourname)');
      return;
    }
    if (!trimmedLabel) {
      setFormError('Display label is required.');
      return;
    }

    const currentList = currentSocialAccounts;
    let updatedList: SocialAccount[];

    if (editingAccountId === 'new') {
      const newAcc: SocialAccount = {
        id: `account-${Date.now()}`,
        platform: formPlatform,
        label: trimmedLabel.toUpperCase(),
        url: trimmedUrl,
        icon: formPlatform,
        display_order: currentList.length + 1,
        enabled: true,
        display_name: trimmedDisplayName || undefined,
      };
      updatedList = [...currentList, newAcc];
    } else {
      updatedList = currentList.map((acc) =>
        acc.id === editingAccountId
          ? {
              ...acc,
              platform: formPlatform,
              label: trimmedLabel.toUpperCase(),
              url: trimmedUrl,
              icon: formPlatform,
              display_name: trimmedDisplayName || undefined,
            }
          : acc
      );
    }

    handleSettingsChange('social_links', updatedList);
    setEditingAccountId(null);
    setFormDisplayName('');
    setFormError('');
  };

  const handleToggleAccountEnabled = (id: string) => {
    const updated = currentSocialAccounts.map((acc) =>
      acc.id === id ? { ...acc, enabled: !acc.enabled } : acc
    );
    handleSettingsChange('social_links', updated);
  };

  const handleRemoveAccount = (id: string, label: string) => {
    if (window.confirm(`Are you sure you want to remove the social account "${label}"?`)) {
      const filtered = currentSocialAccounts
        .filter((acc) => acc.id !== id)
        .map((acc, idx) => ({ ...acc, display_order: idx + 1 }));
      handleSettingsChange('social_links', filtered);
      if (editingAccountId === id) {
        setEditingAccountId(null);
      }
    }
  };

  const handleMoveAccount = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentSocialAccounts.length) return;
    const copy = [...currentSocialAccounts];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    const reordered = copy.map((acc, idx) => ({ ...acc, display_order: idx + 1 }));
    handleSettingsChange('social_links', reordered);
  };

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

    // Social accounts validation
    const accountsToValidate = currentSocialAccounts;
    for (const acc of accountsToValidate) {
      if (acc.enabled && acc.url && !isValidSocialUrl(acc.url)) {
        setSaveStatus('error');
        setSaveMessage(`Validation Error: ${acc.label} must be a valid https:// URL.`);
        return;
      }
    }

    if (settings.og_image && !isValidSocialUrl(settings.og_image)) {
      setSaveStatus('error');
      setSaveMessage('Validation Error: Open Graph Image must start with https://');
      return;
    }

    if (settings.canonical_url && !isValidSocialUrl(settings.canonical_url)) {
      setSaveStatus('error');
      setSaveMessage('Validation Error: Canonical URL must start with https://');
      return;
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
        const aboutResult = parsedResults.find((p) => p && Array.isArray(p.domains));
        if (aboutResult && Array.isArray(aboutResult.domains)) {
          setDomains(aboutResult.domains);
          setBaselineDomains(aboutResult.domains);
        } else {
          setBaselineDomains(domains);
        }
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

  // Convert projects to initialTools
  const initialTools: GitHubTool[] = useMemo(() => {
    return projects.map(normalizeToolFromProject);
  }, [projects]);

  const projectsCount = projects.length;
  const writeupsCount = researchList.length;

  return (
    <div className="relative w-full flex flex-col bg-[#ECE8DF] min-h-screen">
      {/* ------------------------------------------------------------- */}
      {/* TOP COMPACT TOOLBAR                                           */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-50 w-full bg-[#F2EFE7] border-b-2 border-[#171514] shadow-xs select-none font-mono">
        <div className="px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2.5">
          {/* Controls in Required Order (Left to Right) */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* 1. Portfolio Editor — small workspace title */}
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#DF491E]" />
              <span className="font-bold text-xs tracking-wider text-[#171514]">
                Portfolio Editor
              </span>
            </div>

            <div className="hidden sm:block h-3.5 w-[1px] bg-[#171514]/20" />

            {/* 2. Admin Menu — toggle admin sidebar */}
            {onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className={`px-2.5 py-1 text-xs font-semibold border border-[#171514] transition-colors flex items-center gap-1.5 cursor-pointer rounded-xs ${
                  isSidebarCollapsed
                    ? 'bg-[#171514] text-[#ECE8DF]'
                    : 'bg-[#ECE8DF] text-[#171514] hover:bg-[#D7D3CB]'
                }`}
                title={isSidebarCollapsed ? 'Show admin sidebar' : 'Hide admin sidebar to expand canvas'}
              >
                <span>{isSidebarCollapsed ? '▶' : '◀'}</span>
                <span>Admin Menu</span>
              </button>
            )}

            {/* 3. Navigation: Show/Hide — toggle navigation rail in canvas */}
            <button
              type="button"
              onClick={handleToggleCanvasNav}
              className={`px-2.5 py-1 text-xs font-semibold border border-[#171514] transition-colors flex items-center gap-1.5 cursor-pointer rounded-xs ${
                showCanvasNav
                  ? 'bg-[#171514] text-[#ECE8DF]'
                  : 'bg-[#ECE8DF] text-[#171514] hover:bg-[#D7D3CB]'
              }`}
              title={showCanvasNav ? 'Hide portfolio navigation rail in canvas' : 'Show portfolio navigation rail in canvas'}
            >
              <span>🧭</span>
              <span>{showCanvasNav ? 'Navigation: Show' : 'Navigation: Hide'}</span>
            </button>

            {/* 4. Edit / Preview — single clear two-state toggle */}
            <div className="inline-flex items-center border border-[#171514] bg-[#ECE8DF] p-0.5 rounded-xs text-xs">
              <button
                type="button"
                onClick={() => setIsEditingMode(true)}
                className={`px-2.5 py-0.5 font-bold transition-colors cursor-pointer rounded-xs flex items-center gap-1 ${
                  isEditingMode
                    ? 'bg-[#DF491E] text-[#171514]'
                    : 'text-[#5A5650] hover:text-[#171514]'
                }`}
              >
                <span>✎</span>
                <span>Edit Mode</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditingMode(false)}
                className={`px-2.5 py-0.5 font-bold transition-colors cursor-pointer rounded-xs flex items-center gap-1 ${
                  !isEditingMode
                    ? 'bg-[#171514] text-[#ECE8DF]'
                    : 'text-[#5A5650] hover:text-[#171514]'
                }`}
              >
                <span>👁</span>
                <span>Preview Mode</span>
              </button>
            </div>
          </div>

          {/* Right Action Group */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Hero Spotlight & Stats Drawer Toggle */}
            <button
              type="button"
              id="admin-hero-spotlight-btn"
              onClick={() => {
                setDrawerTab('spotlight');
                setIsProfileDrawerOpen(true);
              }}
              className={`px-2.5 py-1 border border-[#171514] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer rounded-xs ${
                isProfileDrawerOpen && drawerTab === 'spotlight'
                  ? 'bg-[#171514] text-[#ECE8DF]'
                  : 'bg-[#ECE8DF] hover:bg-[#171514] hover:text-[#ECE8DF]'
              }`}
              title="Configure Hero Statistics and Promotional Spotlight"
            >
              <span>⚡</span>
              <span>Hero Spotlight &amp; Stats</span>
            </button>

            {/* Profile & SEO Drawer Toggle */}
            <button
              type="button"
              id="admin-profile-seo-btn"
              onClick={() => {
                setDrawerTab('profile');
                setIsProfileDrawerOpen(true);
              }}
              className={`px-2.5 py-1 border border-[#171514] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer rounded-xs ${
                isProfileDrawerOpen && (drawerTab === 'profile' || drawerTab === 'socials')
                  ? 'bg-[#171514] text-[#ECE8DF]'
                  : 'bg-[#ECE8DF] hover:bg-[#171514] hover:text-[#ECE8DF]'
              }`}
              title="Open global profile, contact, and SEO drawer"
            >
              <span>⚙</span>
              <span>Profile &amp; SEO</span>
            </button>

            {/* 5. Unsaved Changes indicator — show ONLY when pending changes exist */}
            {totalUnsavedChanges > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#DF491E]/15 border border-[#DF491E] text-[#DF491E] font-bold rounded-xs animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-[#DF491E]" />
                <span>{totalUnsavedChanges} Unsaved</span>
              </div>
            )}

            {saveStatus === 'saved' && (
              <div className="flex items-center gap-1 px-2.5 py-1 bg-[#10B981]/15 border border-[#10B981] text-[#10B981] font-bold rounded-xs">
                <span>✓</span>
                <span>Saved</span>
              </div>
            )}

            {saveStatus === 'error' && (
              <div className="flex items-center gap-1 px-2.5 py-1 bg-[#DF491E] text-[#ECE8DF] font-bold rounded-xs">
                <span>✕</span>
                <span>Save Failed</span>
              </div>
            )}

            {/* 6. Revert — discard pending changes with confirmation */}
            {totalUnsavedChanges > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Discard all unsaved changes and restore published content?')) {
                    handleRevert();
                  }
                }}
                disabled={isSaving}
                className="px-2.5 py-1 border border-[#171514] bg-[#ECE8DF] hover:bg-[#D7D3CB] text-[#171514] font-semibold transition-colors cursor-pointer rounded-xs disabled:opacity-50"
                title="Discard pending changes and restore published version"
              >
                Revert
              </button>
            )}

            {/* 7. Save Changes — primary action */}
            <button
              type="button"
              id="admin-save-button"
              onClick={handleSave}
              disabled={totalUnsavedChanges === 0 || isSaving}
              className={`px-3 py-1 font-bold border border-[#171514] transition-all flex items-center gap-1.5 cursor-pointer rounded-xs ${
                totalUnsavedChanges > 0
                  ? 'bg-[#DF491E] text-[#171514] hover:bg-[#C73E16] shadow-xs'
                  : 'bg-[#ECE8DF] text-[#5A5650] opacity-50 cursor-not-allowed'
              }`}
            >
              {isSaving ? (
                <>
                  <span className="w-2.5 h-2.5 border-2 border-[#171514] border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Status notification toast (only when message present) */}
        {saveMessage && (
          <div
            className={`px-3 py-1 font-mono text-xs flex items-center justify-between border-t border-[#171514] ${
              saveStatus === 'error'
                ? 'bg-[#DF491E] text-[#ECE8DF] font-bold'
                : saveStatus === 'saved'
                ? 'bg-[#10B981] text-[#171514] font-bold'
                : 'bg-[#171514] text-[#ECE8DF]'
            }`}
          >
            <span>{saveMessage}</span>
            <button
              type="button"
              onClick={() => setSaveMessage('')}
              className="font-bold hover:underline cursor-pointer text-xs ml-3"
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
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[520px] bg-[#F2EFE7] border-l-2 border-[#171514] shadow-2xl flex flex-col font-mono text-xs">
          <div className="p-4 border-b-2 border-[#171514] flex items-center justify-between bg-[#ECE8DF]">
            <div>
              <div className="text-[10px] text-[#DF491E] font-bold">// Global Portfolio Configuration</div>
              <h3 className="font-display font-black text-lg text-[#171514]">
                {drawerTab === 'spotlight'
                  ? 'Hero Spotlight & Stats'
                  : drawerTab === 'socials'
                  ? 'Social Accounts'
                  : 'Profile & SEO'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsProfileDrawerOpen(false)}
              className="px-2.5 py-1 border border-[#171514] bg-[#ECE8DF] hover:bg-[#171514] hover:text-[#ECE8DF] font-bold transition-colors cursor-pointer rounded-xs"
            >
              ✕ Close
            </button>
          </div>

          {/* Drawer Navigation Tabs */}
          <div className="flex border-b border-[#171514] bg-[#ECE8DF] text-[11px] font-bold select-none">
            <button
              type="button"
              id="drawer-tab-spotlight"
              onClick={() => setDrawerTab('spotlight')}
              className={`flex-1 py-2 px-2 text-center border-r border-[#171514] transition-colors cursor-pointer ${
                drawerTab === 'spotlight'
                  ? 'bg-[#F2EFE7] text-[#DF491E] border-b-2 border-b-[#DF491E]'
                  : 'text-[#171514] hover:bg-[#FAF8F5]'
              }`}
            >
              ⚡ Spotlight &amp; Stats
            </button>
            <button
              type="button"
              id="drawer-tab-profile"
              onClick={() => setDrawerTab('profile')}
              className={`flex-1 py-2 px-2 text-center border-r border-[#171514] transition-colors cursor-pointer ${
                drawerTab === 'profile'
                  ? 'bg-[#F2EFE7] text-[#DF491E] border-b-2 border-b-[#DF491E]'
                  : 'text-[#171514] hover:bg-[#FAF8F5]'
              }`}
            >
              ⚙ Profile &amp; SEO
            </button>
            <button
              type="button"
              id="drawer-tab-socials"
              onClick={() => setDrawerTab('socials')}
              className={`flex-1 py-2 px-2 text-center transition-colors cursor-pointer ${
                drawerTab === 'socials'
                  ? 'bg-[#F2EFE7] text-[#DF491E] border-b-2 border-b-[#DF491E]'
                  : 'text-[#171514] hover:bg-[#FAF8F5]'
              }`}
            >
              🔗 Socials ({currentSocialAccounts.length})
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* ----------------------------------------------------------- */}
            {/* TAB 1: HERO PROMOTIONAL SPOTLIGHT & THREE-STATS BAR         */}
            {/* ----------------------------------------------------------- */}
            {drawerTab === 'spotlight' && (
              <div className="space-y-5">
                <div className="p-3 bg-[#DF491E]/10 border border-[#DF491E] text-[#171514] text-[11px] leading-relaxed">
                  <strong>Hero Promotional Spotlight:</strong> Enhance the three-statistics bar directly beneath <em>&ldquo;Research • Bug Bounty • Projects&rdquo;</em> into an admin-controlled spotlight for your professional role, services, write-up advisories, or releases. When spotlight is disabled, the three statistics remain the default presentation.
                </div>

                {/* Master Switch & Display Mode */}
                <div className="border border-[#171514] p-4 bg-[#ECE8DF] space-y-3">
                  <div className="font-bold text-[#171514] uppercase tracking-wider text-[11px] flex items-center justify-between border-b border-[#171514]/20 pb-2">
                    <span>// SPOTLIGHT MASTER CONTROL</span>
                    <button
                      type="button"
                      id="spotlight-master-toggle"
                      onClick={() => handleHeroChange('spotlight_enabled', !hero.spotlight_enabled)}
                      className={`px-2.5 py-1 text-[10px] font-bold border border-[#171514] rounded-xs cursor-pointer transition-colors ${
                        hero.spotlight_enabled
                          ? 'bg-[#10B981] text-[#171514]'
                          : 'bg-[#ECE8DF] text-[#5A5650]'
                      }`}
                      title={hero.spotlight_enabled ? 'Click to disable spotlight' : 'Click to enable spotlight'}
                    >
                      {hero.spotlight_enabled ? '● SPOTLIGHT ACTIVE' : '○ SPOTLIGHT DISABLED'}
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#5A5650] mb-1 font-bold">Display Mode</label>
                    <div className="grid grid-cols-3 gap-2 text-[10px]">
                      <button
                        type="button"
                        id="spotlight-mode-alternate"
                        onClick={() => handleHeroChange('spotlight_mode', 'alternate')}
                        className={`p-2 border border-[#171514] font-bold text-center cursor-pointer transition-colors ${
                          (hero.spotlight_mode || 'alternate') === 'alternate'
                            ? 'bg-[#171514] text-[#ECE8DF]'
                            : 'bg-[#F2EFE7] text-[#171514] hover:bg-[#D7D3CB]'
                        }`}
                      >
                        <div>ALTERNATE</div>
                        <div className="text-[8px] opacity-75 font-normal mt-0.5">Stats + Spotlight</div>
                      </button>
                      <button
                        type="button"
                        id="spotlight-mode-stats"
                        onClick={() => handleHeroChange('spotlight_mode', 'stats_only')}
                        className={`p-2 border border-[#171514] font-bold text-center cursor-pointer transition-colors ${
                          hero.spotlight_mode === 'stats_only'
                            ? 'bg-[#171514] text-[#ECE8DF]'
                            : 'bg-[#F2EFE7] text-[#171514] hover:bg-[#D7D3CB]'
                        }`}
                      >
                        <div>STATS ONLY</div>
                        <div className="text-[8px] opacity-75 font-normal mt-0.5">Always 3 Stats</div>
                      </button>
                      <button
                        type="button"
                        id="spotlight-mode-spotlight"
                        onClick={() => handleHeroChange('spotlight_mode', 'spotlight_only')}
                        className={`p-2 border border-[#171514] font-bold text-center cursor-pointer transition-colors ${
                          hero.spotlight_mode === 'spotlight_only'
                            ? 'bg-[#171514] text-[#ECE8DF]'
                            : 'bg-[#F2EFE7] text-[#171514] hover:bg-[#D7D3CB]'
                        }`}
                      >
                        <div>SPOTLIGHT ONLY</div>
                        <div className="text-[8px] opacity-75 font-normal mt-0.5">Always Promo</div>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-[#171514]/15">
                    <div>
                      <span className="font-bold text-[#171514] text-[11px] block">Auto-Rotation</span>
                      <span className="text-[10px] text-[#5A5650]">Cycles every 7 seconds; pauses on hover</span>
                    </div>
                    <button
                      type="button"
                      id="spotlight-autorotate-toggle"
                      onClick={() => handleHeroChange('spotlight_auto_rotate', hero.spotlight_auto_rotate === false ? true : false)}
                      className={`px-2 py-0.5 text-[10px] font-bold border border-[#171514] rounded-xs cursor-pointer ${
                        hero.spotlight_auto_rotate !== false
                          ? 'bg-[#10B981] text-[#171514]'
                          : 'bg-[#ECE8DF] text-[#5A5650]'
                      }`}
                    >
                      {hero.spotlight_auto_rotate !== false ? 'ENABLED' : 'PAUSED'}
                    </button>
                  </div>
                </div>

                {/* Primary Active Spotlight Content */}
                <div className="border border-[#171514] p-4 bg-[#ECE8DF] space-y-3">
                  <div className="font-bold text-[#171514] uppercase tracking-wider text-[11px] flex items-center justify-between">
                    <span>// ACTIVE SPOTLIGHT CONTENT</span>
                    <span className="text-[10px] text-[#5A5650] font-normal">Displayed on Homepage</span>
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#5A5650] mb-1 font-bold">Spotlight Title</label>
                    <input
                      type="text"
                      id="input-spotlight-title"
                      value={hero.spotlight_title || ''}
                      onChange={(e) => handleHeroChange('spotlight_title', e.target.value)}
                      placeholder="e.g. OPEN FOR COLLABORATION, SECURITY ASSESSMENT SERVICES"
                      className="w-full bg-[#F2EFE7] border border-[#171514] p-2 text-[#171514] focus:outline-none focus:border-[#DF491E] font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#5A5650] mb-1 font-bold">Short Subtitle / Description</label>
                    <input
                      type="text"
                      id="input-spotlight-subtitle"
                      value={hero.spotlight_subtitle || ''}
                      onChange={(e) => handleHeroChange('spotlight_subtitle', e.target.value)}
                      placeholder="e.g. Web Security • Authorized Pentesting • Vulnerability Research"
                      className="w-full bg-[#F2EFE7] border border-[#171514] p-2 text-[#171514] focus:outline-none focus:border-[#DF491E]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] text-[#5A5650] mb-1 font-bold">Call to Action Label</label>
                      <input
                        type="text"
                        id="input-spotlight-cta-text"
                        value={hero.spotlight_cta_text || ''}
                        onChange={(e) => handleHeroChange('spotlight_cta_text', e.target.value)}
                        placeholder="e.g. INITIATE CONTACT →, VIEW WRITE-UP →"
                        className="w-full bg-[#F2EFE7] border border-[#171514] p-2 text-[#171514] focus:outline-none focus:border-[#DF491E]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#5A5650] mb-1 font-bold">CTA Destination URL / Anchor</label>
                      <input
                        type="text"
                        id="input-spotlight-cta-url"
                        value={hero.spotlight_cta_url || ''}
                        onChange={(e) => handleHeroChange('spotlight_cta_url', e.target.value)}
                        placeholder="#collaborate, #research, or https://..."
                        className="w-full bg-[#F2EFE7] border border-[#171514] p-2 text-[#171514] focus:outline-none focus:border-[#DF491E]"
                      />
                    </div>
                  </div>
                </div>

                {/* Rotating Promotional Messages Queue */}
                <div className="border border-[#171514] p-4 bg-[#ECE8DF] space-y-3">
                  <div className="flex items-center justify-between pb-1">
                    <div>
                      <div className="font-bold text-[#171514] uppercase tracking-wider text-[11px]">
                        // ROTATING SPOTLIGHT QUEUE
                      </div>
                      <div className="text-[10px] text-[#5A5650]">
                        Optional rotating messages cycled in sequence
                      </div>
                    </div>
                    <button
                      type="button"
                      id="btn-add-spotlight-msg"
                      onClick={() => handleStartAddMessage()}
                      className="px-2 py-1 text-[11px] font-bold border border-[#171514] bg-[#DF491E] text-[#171514] hover:bg-[#C73E16] cursor-pointer rounded-xs"
                    >
                      + Add Message
                    </button>
                  </div>

                  {/* Preset Quick-Buttons */}
                  <div className="flex flex-wrap gap-1 text-[10px]">
                    <span className="text-[#5A5650] py-0.5">Quick Presets:</span>
                    <button
                      type="button"
                      onClick={() => handleStartAddMessage('role')}
                      className="px-1.5 py-0.5 border border-[#171514]/40 bg-[#F2EFE7] hover:bg-[#171514] hover:text-[#ECE8DF] cursor-pointer"
                    >
                      + Role
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartAddMessage('services')}
                      className="px-1.5 py-0.5 border border-[#171514]/40 bg-[#F2EFE7] hover:bg-[#171514] hover:text-[#ECE8DF] cursor-pointer"
                    >
                      + Services
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartAddMessage('research')}
                      className="px-1.5 py-0.5 border border-[#171514]/40 bg-[#F2EFE7] hover:bg-[#171514] hover:text-[#ECE8DF] cursor-pointer"
                    >
                      + Research
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartAddMessage('tools')}
                      className="px-1.5 py-0.5 border border-[#171514]/40 bg-[#F2EFE7] hover:bg-[#171514] hover:text-[#ECE8DF] cursor-pointer"
                    >
                      + Tools
                    </button>
                  </div>

                  {/* Add / Edit Message Form */}
                  {editingMsgId !== null && (
                    <div className="p-3 border-2 border-[#DF491E] bg-[#FAF8F5] space-y-2 mt-2">
                      <div className="font-bold text-[#171514] text-[11px]">
                        {editingMsgId === 'new' ? '+ Add Promotional Message' : '✎ Edit Promotional Message'}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <label className="block text-[10px] text-[#5A5650] font-bold">Title</label>
                          <input
                            type="text"
                            value={msgTitle}
                            onChange={(e) => setMsgTitle(e.target.value)}
                            placeholder="e.g. AUTHORIZED PENETRATION TESTING"
                            className="w-full bg-[#ECE8DF] border border-[#171514] p-1.5 text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-[#5A5650] font-bold">Tag / Badge</label>
                          <input
                            type="text"
                            value={msgBadge}
                            onChange={(e) => setMsgBadge(e.target.value)}
                            placeholder="// SERVICES"
                            className="w-full bg-[#ECE8DF] border border-[#171514] p-1.5 text-xs font-mono"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#5A5650] font-bold">Subtitle</label>
                        <input
                          type="text"
                          value={msgSubtitle}
                          onChange={(e) => setMsgSubtitle(e.target.value)}
                          placeholder="e.g. Web Apps • API Assessments • Cloud Audits"
                          className="w-full bg-[#ECE8DF] border border-[#171514] p-1.5 text-xs font-mono"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-[#5A5650] font-bold">CTA Text</label>
                          <input
                            type="text"
                            value={msgCtaText}
                            onChange={(e) => setMsgCtaText(e.target.value)}
                            placeholder="INITIATE CONTACT →"
                            className="w-full bg-[#ECE8DF] border border-[#171514] p-1.5 text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-[#5A5650] font-bold">CTA URL</label>
                          <input
                            type="text"
                            value={msgCtaUrl}
                            onChange={(e) => setMsgCtaUrl(e.target.value)}
                            placeholder="#collaborate"
                            className="w-full bg-[#ECE8DF] border border-[#171514] p-1.5 text-xs font-mono"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleCancelMessageForm}
                          className="px-2 py-1 border border-[#171514] bg-[#ECE8DF] text-xs cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveMessageForm}
                          className="px-3 py-1 border border-[#171514] bg-[#DF491E] text-[#171514] font-bold text-xs cursor-pointer"
                        >
                          Save Message
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Message Queue List */}
                  {currentSpotlightMessages.length === 0 ? (
                    <div className="p-3 border border-dashed border-[#171514]/40 text-center text-[#5A5650] text-[11px]">
                      No queue messages configured. The primary active message above is used.
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {currentSpotlightMessages.map((m, index) => {
                        const isFirst = index === 0;
                        const isLast = index === currentSpotlightMessages.length - 1;
                        return (
                          <div
                            key={m.id}
                            className={`p-2 border border-[#171514] flex items-center justify-between gap-2 ${
                              m.enabled ? 'bg-[#F2EFE7]' : 'bg-[#ECE8DF] opacity-60'
                            }`}
                          >
                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                onClick={() => handleMoveMessage(index, 'up')}
                                disabled={isFirst}
                                className="px-1 py-0.5 border border-[#171514] bg-[#ECE8DF] text-[10px] font-bold disabled:opacity-30 cursor-pointer"
                                title="Move Up"
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveMessage(index, 'down')}
                                disabled={isLast}
                                className="px-1 py-0.5 border border-[#171514] bg-[#ECE8DF] text-[10px] font-bold disabled:opacity-30 cursor-pointer"
                                title="Move Down"
                              >
                                ▼
                              </button>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="text-[9px] font-bold text-[#DF491E] uppercase">{m.badge || '// PROMO'}</span>
                                <span className="font-bold text-[#171514] text-xs truncate">{m.title}</span>
                              </div>
                              <div className="text-[10px] text-[#5A5650] truncate">{m.subtitle}</div>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleToggleMessageEnabled(m.id)}
                                className={`px-1.5 py-0.5 text-[10px] font-bold border border-[#171514] cursor-pointer ${
                                  m.enabled ? 'bg-[#10B981] text-[#171514]' : 'bg-[#ECE8DF] text-[#5A5650]'
                                }`}
                              >
                                {m.enabled ? 'ON' : 'OFF'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStartEditMessage(m)}
                                className="px-1.5 py-0.5 text-[10px] font-bold border border-[#171514] bg-[#ECE8DF] hover:bg-[#171514] hover:text-[#ECE8DF] cursor-pointer"
                              >
                                ✎
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveMessage(m.id)}
                                className="px-1.5 py-0.5 text-[10px] font-bold border border-[#171514] bg-[#ECE8DF] hover:bg-[#DF491E] cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Homepage Statistics Configuration */}
                <div className="border border-[#171514] p-4 bg-[#ECE8DF] space-y-3">
                  <div className="font-bold text-[#171514] uppercase tracking-wider text-[11px] flex items-center justify-between border-b border-[#171514]/20 pb-2">
                    <span>// THREE-STATISTICS BAR CONFIGURATION</span>
                    <span className="text-[10px] text-[#5A5650] font-normal">Independent Toggles &amp; Labels</span>
                  </div>

                  {/* Stat 1: Projects */}
                  <div className="p-2.5 border border-[#171514] bg-[#F2EFE7] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#171514]">Statistic 1: Projects Count</span>
                      <button
                        type="button"
                        id="stat-1-toggle"
                        onClick={() => handleHeroChange('stat_1_enabled', hero.stat_1_enabled === false ? true : false)}
                        className={`px-2 py-0.5 text-[10px] font-bold border border-[#171514] cursor-pointer transition-colors ${
                          hero.stat_1_enabled !== false ? 'bg-[#10B981] text-[#171514]' : 'bg-[#ECE8DF] text-[#5A5650]'
                        }`}
                      >
                        {hero.stat_1_enabled !== false ? 'ENABLED' : 'DISABLED'}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-[10px] text-[#5A5650] font-bold">Display Label</label>
                        <input
                          type="text"
                          id="input-stat-1-label"
                          value={hero.stat_1_label || ''}
                          onChange={(e) => handleHeroChange('stat_1_label', e.target.value)}
                          placeholder="PROJECTS"
                          className="w-full bg-[#ECE8DF] border border-[#171514] p-1.5 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#5A5650] font-bold">Count Override (blank = auto)</label>
                        <input
                          type="text"
                          id="input-stat-1-override"
                          value={hero.stat_1_override || ''}
                          onChange={(e) => handleHeroChange('stat_1_override', e.target.value)}
                          placeholder={`Live Count: ${projectsCount}`}
                          className="w-full bg-[#ECE8DF] border border-[#171514] p-1.5 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Stat 2: Write-ups */}
                  <div className="p-2.5 border border-[#171514] bg-[#F2EFE7] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#171514]">Statistic 2: Write-ups Count</span>
                      <button
                        type="button"
                        id="stat-2-toggle"
                        onClick={() => handleHeroChange('stat_2_enabled', hero.stat_2_enabled === false ? true : false)}
                        className={`px-2 py-0.5 text-[10px] font-bold border border-[#171514] cursor-pointer transition-colors ${
                          hero.stat_2_enabled !== false ? 'bg-[#10B981] text-[#171514]' : 'bg-[#ECE8DF] text-[#5A5650]'
                        }`}
                      >
                        {hero.stat_2_enabled !== false ? 'ENABLED' : 'DISABLED'}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-[10px] text-[#5A5650] font-bold">Display Label</label>
                        <input
                          type="text"
                          id="input-stat-2-label"
                          value={hero.stat_2_label || ''}
                          onChange={(e) => handleHeroChange('stat_2_label', e.target.value)}
                          placeholder="WRITE-UPS"
                          className="w-full bg-[#ECE8DF] border border-[#171514] p-1.5 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#5A5650] font-bold">Count Override (blank = auto)</label>
                        <input
                          type="text"
                          id="input-stat-2-override"
                          value={hero.stat_2_override || ''}
                          onChange={(e) => handleHeroChange('stat_2_override', e.target.value)}
                          placeholder={`Live Count: ${writeupsCount}`}
                          className="w-full bg-[#ECE8DF] border border-[#171514] p-1.5 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Stat 3: Curiosity */}
                  <div className="p-2.5 border border-[#171514] bg-[#F2EFE7] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#171514]">Statistic 3: Curiosity / Ethos</span>
                      <button
                        type="button"
                        id="stat-3-toggle"
                        onClick={() => handleHeroChange('stat_3_enabled', hero.stat_3_enabled === false ? true : false)}
                        className={`px-2 py-0.5 text-[10px] font-bold border border-[#171514] cursor-pointer transition-colors ${
                          hero.stat_3_enabled !== false ? 'bg-[#10B981] text-[#171514]' : 'bg-[#ECE8DF] text-[#5A5650]'
                        }`}
                      >
                        {hero.stat_3_enabled !== false ? 'ENABLED' : 'DISABLED'}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-[10px] text-[#5A5650] font-bold">Display Label</label>
                        <input
                          type="text"
                          id="input-stat-3-label"
                          value={hero.stat_3_label || ''}
                          onChange={(e) => handleHeroChange('stat_3_label', e.target.value)}
                          placeholder="CURIOSITY"
                          className="w-full bg-[#ECE8DF] border border-[#171514] p-1.5 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#5A5650] font-bold">Symbol / Value</label>
                        <input
                          type="text"
                          id="input-stat-3-override"
                          value={hero.stat_curiosity || ''}
                          onChange={(e) => handleHeroChange('stat_curiosity', e.target.value)}
                          placeholder="∞"
                          className="w-full bg-[#ECE8DF] border border-[#171514] p-1.5 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------------- */}
            {/* TAB 2: SEO & OPEN GRAPH METADATA                            */}
            {/* ----------------------------------------------------------- */}
            {drawerTab === 'profile' && (
              <div className="space-y-5">
                <div className="p-3 bg-[#DF491E]/10 border border-[#DF491E] text-[#171514] text-[11px] leading-relaxed">
                  <strong>Metadata Control:</strong> Public content is editable directly on the live canvas. Use this panel to configure search indexing metadata and social share card appearance.
                </div>

                <div className="border border-[#171514] p-4 bg-[#ECE8DF] space-y-3">
                  <div className="font-bold text-[#171514] uppercase tracking-wider text-[11px] flex items-center justify-between">
                    <span>// SEO &amp; OPEN GRAPH METADATA</span>
                    <span className="text-[10px] text-[#5A5650] font-normal">Search &amp; Sharing</span>
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#5A5650] mb-1 font-bold">SEO Page Title</label>
                    <input
                      type="text"
                      value={settings.site_title || ''}
                      onChange={(e) => handleSettingsChange('site_title', e.target.value)}
                      placeholder="e.g. AAYAN.Sec | Cybersecurity Researcher & Pentester"
                      className="w-full bg-[#F2EFE7] border border-[#171514] p-2 text-[#171514] focus:outline-none focus:border-[#DF491E]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#5A5650] mb-1 font-bold">SEO Meta Description</label>
                    <textarea
                      rows={2}
                      value={settings.site_description || ''}
                      onChange={(e) => handleSettingsChange('site_description', e.target.value)}
                      placeholder="Brief description for search engines..."
                      className="w-full bg-[#F2EFE7] border border-[#171514] p-2 text-[#171514] focus:outline-none focus:border-[#DF491E]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] text-[#5A5650] mb-1 font-bold">Open Graph Title</label>
                      <input
                        type="text"
                        value={settings.og_title || ''}
                        onChange={(e) => handleSettingsChange('og_title', e.target.value)}
                        placeholder="Defaults to Page Title"
                        className="w-full bg-[#F2EFE7] border border-[#171514] p-2 text-[#171514] focus:outline-none focus:border-[#DF491E]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#5A5650] mb-1 font-bold">Canonical URL (Optional)</label>
                      <input
                        type="url"
                        value={settings.canonical_url || ''}
                        onChange={(e) => handleSettingsChange('canonical_url', e.target.value)}
                        placeholder="https://aayan-sec.com"
                        className="w-full bg-[#F2EFE7] border border-[#171514] p-2 text-[#171514] focus:outline-none focus:border-[#DF491E]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#5A5650] mb-1 font-bold">Open Graph Description</label>
                    <textarea
                      rows={2}
                      value={settings.og_description || ''}
                      onChange={(e) => handleSettingsChange('og_description', e.target.value)}
                      placeholder="Social preview snippet (Twitter/X, LinkedIn cards)..."
                      className="w-full bg-[#F2EFE7] border border-[#171514] p-2 text-[#171514] focus:outline-none focus:border-[#DF491E]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#5A5650] mb-1 font-bold">Open Graph Image URL</label>
                    <input
                      type="url"
                      value={settings.og_image || ''}
                      onChange={(e) => handleSettingsChange('og_image', e.target.value)}
                      placeholder="https://... (1200x630 social share card image)"
                      className="w-full bg-[#F2EFE7] border border-[#171514] p-2 text-[#171514] focus:outline-none focus:border-[#DF491E]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------------- */}
            {/* TAB 3: EXTENSIBLE SOCIAL ACCOUNTS MANAGER                   */}
            {/* ----------------------------------------------------------- */}
            {drawerTab === 'socials' && (
              <div className="border border-[#171514] p-4 bg-[#ECE8DF] space-y-3">
              <div className="flex items-center justify-between pb-1">
                <div>
                  <div className="font-bold text-[#171514] uppercase tracking-wider text-[11px]">
                    // SOCIAL ACCOUNTS
                  </div>
                  <div className="text-[10px] text-[#5A5650]">
                    Synchronized across Nav Rail, Verified Direct Channels, and Footer
                  </div>
                </div>
                {editingAccountId === null && (
                  <button
                    type="button"
                    onClick={handleStartAddAccount}
                    className="px-2.5 py-1 border border-[#171514] bg-[#DF491E] text-[#171514] hover:bg-[#C73E16] font-bold text-[11px] transition-colors cursor-pointer rounded-xs flex items-center gap-1"
                  >
                    <span>+</span>
                    <span>Add Social Account</span>
                  </button>
                )}
              </div>

              {/* Add / Edit Inline Sub-Form */}
              {editingAccountId !== null && (
                <div className="p-3 border-2 border-[#171514] bg-[#F2EFE7] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#171514]/20 pb-1.5">
                    <span className="font-bold text-[#DF491E] text-[11px]">
                      {editingAccountId === 'new' ? '✚ ADD NEW SOCIAL ACCOUNT' : '✎ EDIT SOCIAL ACCOUNT'}
                    </span>
                    <button
                      type="button"
                      onClick={handleCancelAccountForm}
                      className="text-[#5A5650] hover:text-[#171514] font-bold text-xs"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-[#5A5650] mb-0.5 font-bold">Platform</label>
                      <select
                        value={formPlatform}
                        onChange={(e) => handlePlatformChange(e.target.value)}
                        className="w-full bg-[#ECE8DF] border border-[#171514] p-1.5 text-[#171514] text-xs font-mono focus:outline-none focus:border-[#DF491E]"
                      >
                        {PLATFORM_PRESETS.map((p) => (
                          <option key={p.platform} value={p.platform}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#5A5650] mb-0.5 font-bold">Display Label</label>
                      <input
                        type="text"
                        value={formLabel}
                        onChange={(e) => setFormLabel(e.target.value)}
                        placeholder="e.g. GITHUB, TRYHACKME"
                        className="w-full bg-[#ECE8DF] border border-[#171514] p-1.5 text-[#171514] text-xs font-mono focus:outline-none focus:border-[#DF491E]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#5A5650] mb-0.5 font-bold">
                      Profile URL (must begin with https://)
                    </label>
                    <input
                      type="url"
                      value={formUrl}
                      onChange={(e) => {
                        setFormUrl(e.target.value);
                        if (formError) setFormError('');
                      }}
                      placeholder={getPlatformPreset(formPlatform).urlPlaceholder}
                      className="w-full bg-[#ECE8DF] border border-[#171514] p-1.5 text-[#171514] text-xs font-mono focus:outline-none focus:border-[#DF491E]"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[10px] text-[#5A5650] font-bold">
                        Custom Display Identity (Optional)
                      </label>
                      <span className="text-[9px] text-[#5A5650]">Overrides automatic handle</span>
                    </div>
                    <input
                      type="text"
                      value={formDisplayName}
                      onChange={(e) => setFormDisplayName(e.target.value)}
                      placeholder="e.g. @aayan_sec, HTB · aayan-sec, or custom handle"
                      className="w-full bg-[#ECE8DF] border border-[#171514] p-1.5 text-[#171514] text-xs font-mono focus:outline-none focus:border-[#DF491E]"
                    />
                  </div>

                  {/* Live Icon & Identity Preview */}
                  <div>
                    <div className="text-[10px] text-[#5A5650] mb-1 font-bold">Live Public Identity Preview:</div>
                    <div className="p-2 border border-[#171514] bg-[#ECE8DF] flex items-center justify-between text-xs min-w-0">
                      <div className="flex items-center gap-2 truncate min-w-0">
                        <SocialIcon platform={formPlatform} className="w-4 h-4 text-[#DF491E] flex-shrink-0" />
                        <span className="font-bold text-[#171514] flex-shrink-0">{formLabel || 'LABEL'}:</span>
                        <span className="text-[#171514] font-mono font-bold truncate">
                          {formDisplayName.trim() ||
                            (formUrl.trim()
                              ? formatSocialIdentity({
                                  id: 'preview',
                                  platform: formPlatform,
                                  label: formLabel || 'LINK',
                                  url: formUrl.trim(),
                                  display_order: 1,
                                  enabled: true,
                                })
                              : '@handle / identity')}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#5A5650] ml-2 flex-shrink-0">↗</span>
                    </div>
                  </div>

                  {formError && (
                    <div className="text-[11px] text-[#DF491E] font-bold bg-[#DF491E]/10 p-1.5 border border-[#DF491E]">
                      {formError}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleCancelAccountForm}
                      className="px-2.5 py-1 border border-[#171514] bg-[#ECE8DF] hover:bg-[#D7D3CB] font-semibold text-xs cursor-pointer rounded-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveAccountForm}
                      className="px-3 py-1 border border-[#171514] bg-[#DF491E] text-[#171514] hover:bg-[#C73E16] font-bold text-xs cursor-pointer rounded-xs"
                    >
                      {editingAccountId === 'new' ? 'Add Account' : 'Update Account'}
                    </button>
                  </div>
                </div>
              )}

              {/* Configured Accounts List */}
              {currentSocialAccounts.length === 0 ? (
                <div className="p-4 border border-dashed border-[#171514]/40 text-center text-[#5A5650] text-xs">
                  No social accounts configured yet. Click &quot;+ Add Social Account&quot; above to connect your profiles.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {currentSocialAccounts.map((acc, index) => {
                    const isFirst = index === 0;
                    const isLast = index === currentSocialAccounts.length - 1;
                    const identity = formatSocialIdentity(acc);
                    return (
                      <div
                        key={acc.id}
                        className={`p-2 border border-[#171514] flex items-center justify-between gap-2 transition-colors ${
                          acc.enabled ? 'bg-[#F2EFE7]' : 'bg-[#ECE8DF] opacity-60'
                        }`}
                      >
                        {/* Accessible Up / Down Reordering */}
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => handleMoveAccount(index, 'up')}
                            disabled={isFirst}
                            className="px-1 py-0.5 border border-[#171514] bg-[#ECE8DF] hover:bg-[#171514] hover:text-[#ECE8DF] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-[10px] font-bold rounded-xs leading-none"
                            title="Move up"
                            aria-label={`Move ${acc.label} up`}
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveAccount(index, 'down')}
                            disabled={isLast}
                            className="px-1 py-0.5 border border-[#171514] bg-[#ECE8DF] hover:bg-[#171514] hover:text-[#ECE8DF] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-[10px] font-bold rounded-xs leading-none"
                            title="Move down"
                            aria-label={`Move ${acc.label} down`}
                          >
                            ▼
                          </button>
                        </div>

                        {/* Account Info */}
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          <SocialIcon platform={acc.platform} className="w-4 h-4 text-[#171514] flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-bold text-[#171514] text-xs flex-shrink-0">{acc.label}</span>
                              <span className="text-[#DF491E] font-mono text-[11px] font-bold truncate" title={identity}>
                                {identity}
                              </span>
                              {!acc.enabled && (
                                <span className="text-[9px] bg-[#5A5650]/20 text-[#5A5650] px-1 py-0.2 uppercase font-bold rounded-xs flex-shrink-0">
                                  Disabled
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-[#5A5650] truncate font-mono" title={acc.url}>
                              {acc.url}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* Enable/Disable Toggle */}
                          <button
                            type="button"
                            onClick={() => handleToggleAccountEnabled(acc.id)}
                            className={`px-1.5 py-0.5 text-[10px] font-bold border border-[#171514] rounded-xs cursor-pointer ${
                              acc.enabled
                                ? 'bg-[#10B981] text-[#171514]'
                                : 'bg-[#ECE8DF] text-[#5A5650]'
                            }`}
                            title={acc.enabled ? 'Click to disable' : 'Click to enable'}
                          >
                            {acc.enabled ? 'ON' : 'OFF'}
                          </button>

                          {/* Edit button */}
                          <button
                            type="button"
                            onClick={() => handleStartEditAccount(acc)}
                            className="px-1.5 py-0.5 text-[10px] font-bold border border-[#171514] bg-[#ECE8DF] hover:bg-[#171514] hover:text-[#ECE8DF] rounded-xs cursor-pointer"
                            title="Edit account details"
                          >
                            ✎
                          </button>

                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveAccount(acc.id, acc.label)}
                            className="px-1.5 py-0.5 text-[10px] font-bold border border-[#171514] bg-[#ECE8DF] hover:bg-[#DF491E] hover:text-[#171514] rounded-xs cursor-pointer"
                            title="Remove account"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            )}
          </div>

          <div className="p-4 border-t-2 border-[#171514] bg-[#ECE8DF] flex items-center justify-between">
            <span className="text-[11px] text-[#5A5650]">
              {isHeroDirty || isSettingsDirty ? '● Unsaved edits in configuration' : 'Configuration up to date'}
            </span>
            <button
              type="button"
              onClick={() => setIsProfileDrawerOpen(false)}
              className="px-4 py-2 border border-[#171514] bg-[#171514] text-[#ECE8DF] font-bold hover:bg-[#DF491E] hover:text-[#171514] transition-colors cursor-pointer rounded-xs"
            >
              Done / Close
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MAIN VISUAL EDITING CANVAS                                    */}
      {/* ------------------------------------------------------------- */}
      <main className="flex-1 w-full bg-[#ECE8DF] min-h-screen">
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
          onOpenHeroDrawer={() => {
            setDrawerTab('spotlight');
            setIsProfileDrawerOpen(true);
          }}
          onAboutChange={handleAboutChange}
          onDomainChange={handleDomainChange}
          onAddDomain={handleAddDomain}
          onDeleteDomain={handleDeleteDomain}
          onMoveDomain={handleMoveDomain}
          showNavigation={showCanvasNav}
        />
      </main>
    </div>
  );
}
