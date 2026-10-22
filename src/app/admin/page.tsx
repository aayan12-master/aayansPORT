'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface DashboardStats {
  projects: { total: number; published: number; draft: number };
  research: { total: number; published: number; draft: number };
  skills: { totalCategories: number };
  submissions: { total: number; unread: number };
  backend: 'supabase' | 'local_sqlite';
  lastUpdated?: string;
}

interface Project {
  id: string | number;
  title: string;
  slug: string;
  summary: string;
  description: string;
  tech_stack: string;
  category: string;
  repo_url?: string;
  demo_url?: string;
  image_url?: string;
  status: 'published' | 'draft';
  featured: boolean;
  display_order?: number;
}

interface ResearchPost {
  id: string | number;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';
  cve_id?: string;
  published_date: string;
  tags: string;
  external_url?: string;
  image_url?: string;
  status: 'published' | 'draft';
}

interface Submission {
  id: string | number;
  sender_name: string;
  sender_email: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'archived';
  created_at?: string;
}

interface SkillCategory {
  id: string | number;
  category_num: string;
  category_title: string;
  description: string;
  skills: string[];
  tools: string[];
  status: 'published' | 'draft';
}

interface HeroData {
  brand_name: string;
  headline: string;
  manifesto_line_1: string;
  manifesto_line_2: string;
  manifesto_line_3: string;
  status_label: string;
  status_subtext: string;
  stat_projects: string;
  stat_writeups: string;
  stat_curiosity: string;
  quote: string;
  cta_text: string;
  cta_target: string;
}

interface AboutData {
  status_badge: string;
  spec_text: string;
  bio_paragraph_1: string;
  bio_paragraph_2: string;
  motto_quote: string;
}

interface ResearchDomain {
  id: string | number;
  domain_num: string;
  domain_code: string;
  title: string;
  description: string;
}

interface MethodologyStep {
  id: string | number;
  step_num: string;
  title: string;
  description: string;
}

interface SiteSettingsData {
  site_title: string;
  site_description: string;
  footer_brand: string;
  footer_text: string;
  footer_subtext: string;
  status_text: string;
  open_for_collaboration: boolean;
  contact_email: string;
  github_url: string;
  linkedin_url: string;
  twitter_url: string;
  pgp_key?: string;
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<
    'overview' | 'hero' | 'about' | 'research' | 'projects' | 'skills' | 'submissions' | 'settings'
  >('overview');

  // Notification feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Data states
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [researchList, setResearchList] = useState<ResearchPost[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [skillsList, setSkillsList] = useState<SkillCategory[]>([]);
  const [heroData, setHeroData] = useState<HeroData | null>(null);
  const [aboutData, setAboutData] = useState<AboutData | null>(null);
  const [domains, setDomains] = useState<ResearchDomain[]>([]);
  const [methodology, setMethodology] = useState<MethodologyStep[]>([]);
  const [settingsData, setSettingsData] = useState<SiteSettingsData | null>(null);
  const [loadingSection, setLoadingSection] = useState(false);

  // Modal & Form states
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingResearch, setEditingResearch] = useState<ResearchPost | null>(null);
  const [isResearchModalOpen, setIsResearchModalOpen] = useState(false);
  const [viewingSubmission, setViewingSubmission] = useState<Submission | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'project' | 'research' | 'submission';
    id: string | number;
    title: string;
  } | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (res.ok && data.authenticated) {
        setAuthenticated(true);
        setCurrentUser(data.user?.username || 'admin');
        loadAllData();
      } else {
        setAuthenticated(false);
      }
    } catch {
      setAuthenticated(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAuthenticated(true);
        setCurrentUser(data.user?.username || username);
        loadAllData();
      } else {
        setLoginError(data.error || 'Authentication rejected. Verify credentials.');
      }
    } catch {
      setLoginError('Network error during authentication handshake.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/me', { method: 'POST' });
    } catch {
      // Ignore error on logout
    }
    setAuthenticated(false);
    setCurrentUser('');
  };

  const loadAllData = async () => {
    setLoadingSection(true);
    try {
      const [statsRes, projectsRes, researchRes, subsRes, heroRes, aboutRes, skillsRes, settingsRes] =
        await Promise.all([
          fetch('/api/admin/overview').then((r) => r.json()),
          fetch('/api/admin/projects').then((r) => r.json()),
          fetch('/api/admin/research').then((r) => r.json()),
          fetch('/api/admin/submissions').then((r) => r.json()),
          fetch('/api/admin/hero').then((r) => r.json()),
          fetch('/api/admin/about').then((r) => r.json()),
          fetch('/api/admin/skills').then((r) => r.json()),
          fetch('/api/admin/site-settings').then((r) => r.json()),
        ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (projectsRes.success) setProjects(projectsRes.projects);
      if (researchRes.success) setResearchList(researchRes.research);
      if (subsRes.success) setSubmissions(subsRes.submissions);
      if (heroRes.success) setHeroData(heroRes.hero);
      if (aboutRes.success) {
        setAboutData(aboutRes.about);
        setDomains(aboutRes.domains || []);
        setMethodology(aboutRes.methodology || []);
      }
      if (skillsRes.success) setSkillsList(skillsRes.skills);
      if (settingsRes.success) setSettingsData(settingsRes.settings);
    } catch (err) {
      console.error('Error loading admin data:', err);
      showFeedback('error', 'Failed to load some dashboard sections.');
    } finally {
      setLoadingSection(false);
    }
  };

  // ---------------------------------------------------------------------------
  // SAVE HANDLERS
  // ---------------------------------------------------------------------------
  const handleSaveHero = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroData) return;
    try {
      const res = await fetch('/api/admin/hero', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(heroData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showFeedback('success', 'Hero & Overview content updated successfully.');
      } else {
        showFeedback('error', data.error || 'Failed to save hero content.');
      }
    } catch {
      showFeedback('error', 'Network error saving hero content.');
    }
  };

  const handleSaveAbout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aboutData) return;
    try {
      const res = await fetch('/api/admin/about', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ about: aboutData, domains, methodology }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showFeedback('success', 'Background & methodology updated successfully.');
      } else {
        showFeedback('error', data.error || 'Failed to save background content.');
      }
    } catch {
      showFeedback('error', 'Network error saving background content.');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsData) return;
    try {
      const res = await fetch('/api/admin/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showFeedback('success', 'Site settings & metadata updated successfully.');
      } else {
        showFeedback('error', data.error || 'Failed to save site settings.');
      }
    } catch {
      showFeedback('error', 'Network error saving site settings.');
    }
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    const isNew = !editingProject.id || editingProject.id === 'new';
    const method = isNew ? 'POST' : 'PUT';

    try {
      const res = await fetch('/api/admin/projects', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProject),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showFeedback('success', isNew ? 'Project created successfully.' : 'Project updated successfully.');
        setIsProjectModalOpen(false);
        setEditingProject(null);
        // Refresh project list & stats
        const refRes = await fetch('/api/admin/projects').then((r) => r.json());
        if (refRes.success) setProjects(refRes.projects);
        const stRes = await fetch('/api/admin/overview').then((r) => r.json());
        if (stRes.success) setStats(stRes.stats);
      } else {
        showFeedback('error', data.error || 'Failed to save project.');
      }
    } catch {
      showFeedback('error', 'Network error saving project.');
    }
  };

  const handleSaveResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResearch) return;

    const isNew = !editingResearch.id || editingResearch.id === 'new';
    const method = isNew ? 'POST' : 'PUT';

    try {
      const res = await fetch('/api/admin/research', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingResearch),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showFeedback('success', isNew ? 'Research advisory created.' : 'Research advisory updated.');
        setIsResearchModalOpen(false);
        setEditingResearch(null);
        // Refresh research list & stats
        const refRes = await fetch('/api/admin/research').then((r) => r.json());
        if (refRes.success) setResearchList(refRes.research);
        const stRes = await fetch('/api/admin/overview').then((r) => r.json());
        if (stRes.success) setStats(stRes.stats);
      } else {
        showFeedback('error', data.error || 'Failed to save research.');
      }
    } catch {
      showFeedback('error', 'Network error saving research.');
    }
  };

  const handleUpdateSkillCategory = async (cat: SkillCategory) => {
    try {
      const res = await fetch('/api/admin/skills', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cat),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showFeedback('success', `Category ${cat.category_num} updated.`);
        if (data.skills) setSkillsList(data.skills);
      } else {
        showFeedback('error', data.error || 'Failed to update skill category.');
      }
    } catch {
      showFeedback('error', 'Network error updating skill category.');
    }
  };

  const handleSubmissionStatus = async (id: string | number, newStatus: 'unread' | 'read' | 'archived') => {
    try {
      const res = await fetch('/api/admin/submissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubmissions((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
        );
        showFeedback('success', `Submission marked as ${newStatus}.`);
        const stRes = await fetch('/api/admin/overview').then((r) => r.json());
        if (stRes.success) setStats(stRes.stats);
      }
    } catch {
      showFeedback('error', 'Failed to update submission status.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    const { type, id } = deleteConfirm;

    try {
      let endpoint = '';
      if (type === 'project') endpoint = `/api/admin/projects?id=${id}`;
      else if (type === 'research') endpoint = `/api/admin/research?id=${id}`;
      else if (type === 'submission') endpoint = `/api/admin/submissions?id=${id}`;

      const res = await fetch(endpoint, { method: 'DELETE' });
      const data = await res.json();

      if (res.ok && data.success) {
        showFeedback('success', `Record deleted successfully.`);
        if (type === 'project') setProjects((prev) => prev.filter((p) => p.id !== id));
        if (type === 'research') setResearchList((prev) => prev.filter((r) => r.id !== id));
        if (type === 'submission') setSubmissions((prev) => prev.filter((s) => s.id !== id));
        const stRes = await fetch('/api/admin/overview').then((r) => r.json());
        if (stRes.success) setStats(stRes.stats);
      } else {
        showFeedback('error', data.error || 'Delete operation failed.');
      }
    } catch {
      showFeedback('error', 'Network error during delete operation.');
    } finally {
      setDeleteConfirm(null);
    }
  };

  // ---------------------------------------------------------------------------
  // AUTHENTICATION VIEW (When not logged in)
  // ---------------------------------------------------------------------------
  if (authenticated === null) {
    return (
      <div className="min-h-screen bg-[#ECE8DF] flex items-center justify-center font-mono text-sm text-[#171514]">
        <div className="flex items-center gap-3 border border-[#171514] p-4 bg-[#F2EFE7]">
          <span className="w-3 h-3 bg-[#DF491E] animate-pulse" />
          <span>AUTHENTICATING SECURE SESSION...</span>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#ECE8DF] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#F2EFE7] border-2 border-[#171514] p-6 sm:p-8 space-y-6 shadow-2xl relative">
          {/* Technical Corner Accents */}
          <div className="absolute top-2 left-2 font-mono text-xs text-[#171514] select-none">+</div>
          <div className="absolute top-2 right-2 font-mono text-xs text-[#171514] select-none">+</div>
          <div className="absolute bottom-2 left-2 font-mono text-xs text-[#171514] select-none">+</div>
          <div className="absolute bottom-2 right-2 font-mono text-xs text-[#171514] select-none">+</div>

          <div className="border-b-2 border-[#171514] pb-4">
            <div className="font-mono text-xs font-bold text-[#DF491E] tracking-widest uppercase">
              // RESTRICTED ACCESS
            </div>
            <h1 className="font-display text-3xl font-extrabold text-[#171514] tracking-wide mt-1">
              AAYAN.SEC CMS
            </h1>
            <p className="font-mono text-xs text-[#5A5650] mt-1">
              Authorized administrator terminal &amp; content management interface.
            </p>
          </div>

          {loginError && (
            <div className="border border-[#DF491E] bg-[#DF491E]/10 p-3 font-mono text-xs text-[#DF491E] flex items-center gap-2">
              <span className="font-bold">ERR:</span>
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 font-mono text-xs">
            <div>
              <label className="block font-bold text-[#171514] mb-1 uppercase tracking-wider">
                Operative Handle / Email
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-[#ECE8DF] border border-[#171514] p-3 text-[#171514] focus:outline-none focus:border-[#DF491E] transition-colors"
                placeholder="admin or operative@aayan-sec.com"
              />
            </div>

            <div>
              <label className="block font-bold text-[#171514] mb-1 uppercase tracking-wider">
                Security Passphrase
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#ECE8DF] border border-[#171514] p-3 text-[#171514] focus:outline-none focus:border-[#DF491E] transition-colors"
                placeholder="••••••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full bg-[#DF491E] hover:bg-[#C73E16] text-[#171514] font-bold font-mono text-sm py-3 border border-[#171514] tracking-wider uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loggingIn ? (
                <>
                  <span className="w-2.5 h-2.5 bg-[#171514] animate-spin" />
                  <span>VERIFYING CREDENTIALS...</span>
                </>
              ) : (
                <span>AUTHENTICATE &amp; ENTER →</span>
              )}
            </button>
          </form>

          <div className="border-t border-[#171514]/30 pt-4 flex items-center justify-between font-mono text-[11px] text-[#5A5650]">
            <div>Default local: admin / aayan_sec_2025</div>
            <Link href="/" className="text-[#DF491E] hover:underline font-bold">
              ← Return to Dossier
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // MAIN ADMIN INTERFACE (Authenticated)
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#ECE8DF] text-[#171514] flex flex-col lg:flex-row">
      {/* Toast Notification */}
      {feedback && (
        <div
          className={`fixed top-4 right-4 z-50 border p-3 font-mono text-xs shadow-2xl flex items-center gap-3 transition-all ${
            feedback.type === 'success'
              ? 'bg-[#F2EFE7] border-[#171514] text-[#171514]'
              : 'bg-[#DF491E] border-[#171514] text-[#ECE8DF]'
          }`}
        >
          <span className="font-bold">{feedback.type === 'success' ? '✓ OK:' : '✕ ERR:'}</span>
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-[#171514]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#F2EFE7] border-2 border-[#171514] p-6 space-y-4 shadow-2xl">
            <div className="font-mono text-xs font-bold text-[#DF491E] uppercase tracking-wider">
              // CONFIRM DESTRUCTIVE ACTION
            </div>
            <h3 className="font-display text-xl font-bold text-[#171514]">
              Delete {deleteConfirm.type}: &ldquo;{deleteConfirm.title}&rdquo;?
            </h3>
            <p className="font-mono text-xs text-[#5A5650]">
              This operation will permanently remove this item from the active database. This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2 font-mono text-xs">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-[#171514] hover:bg-[#ECE8DF] transition-colors"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-[#DF491E] text-[#171514] font-bold border border-[#171514] hover:bg-[#C73E16] transition-colors"
              >
                CONFIRM DELETE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-64 bg-[#F2EFE7] border-b-2 lg:border-b-0 lg:border-r-2 border-[#171514] p-5 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          {/* Brand block */}
          <div className="border-b border-[#171514]/20 pb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-[#DF491E]" />
              <span className="font-display text-2xl font-black text-[#171514] tracking-wider">
                AAYAN.SEC
              </span>
            </div>
            <div className="font-mono text-[10px] text-[#5A5650] tracking-widest mt-0.5">
              // MANAGEMENT CONSOLE
            </div>
          </div>

          {/* Nav links */}
          <nav className="space-y-1 font-mono text-xs">
            {[
              { id: 'overview', label: 'DASHBOARD OVERVIEW', badge: null },
              { id: 'hero', label: 'HERO & OVERVIEW', badge: null },
              { id: 'about', label: 'BACKGROUND & ABOUT', badge: null },
              { id: 'research', label: 'RESEARCH ADVISORIES', badge: researchList.length },
              { id: 'projects', label: 'ARSENAL & PROJECTS', badge: projects.length },
              { id: 'skills', label: 'SKILLS MATRIX', badge: skillsList.length },
              {
                id: 'submissions',
                label: 'INBOX / SUBMISSIONS',
                badge: submissions.filter((s) => s.status === 'unread').length || null,
              },
              { id: 'settings', label: 'SITE SETTINGS', badge: null },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full text-left px-3 py-2.5 font-bold tracking-wider transition-all flex items-center justify-between border cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#171514] text-[#ECE8DF] border-[#171514]'
                    : 'text-[#171514] border-transparent hover:border-[#171514]/40 hover:bg-[#ECE8DF]'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge !== null && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] ${
                      activeTab === tab.id
                        ? 'bg-[#DF491E] text-[#171514]'
                        : 'bg-[#171514]/10 text-[#171514]'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Footer info & logout */}
        <div className="pt-6 border-t border-[#171514]/20 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between text-[11px] text-[#5A5650]">
            <div>OPERATIVE:</div>
            <div className="font-bold text-[#171514]">{currentUser}</div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                stats?.backend === 'supabase' ? 'bg-[#10B981]' : 'bg-[#DF491E]'
              }`}
            />
            <span className="text-[10px] text-[#5A5650] uppercase">
              {stats?.backend === 'supabase' ? 'Supabase Connected' : 'Local SQLite Active'}
            </span>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Link
              href="/"
              target="_blank"
              className="flex-1 text-center py-2 border border-[#171514] bg-[#ECE8DF] hover:bg-[#171514] hover:text-[#ECE8DF] font-bold text-[11px] transition-colors"
            >
              VIEW PUBLIC SITE ↗
            </Link>
            <button
              onClick={handleLogout}
              className="py-2 px-3 border border-[#DF491E] text-[#DF491E] hover:bg-[#DF491E] hover:text-[#171514] font-bold text-[11px] transition-colors cursor-pointer"
            >
              LOGOUT
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main className="flex-1 p-6 sm:p-10 overflow-y-auto">
        {loadingSection ? (
          <div className="p-8 font-mono text-xs text-[#5A5650] flex items-center gap-2">
            <span className="w-3 h-3 bg-[#DF491E] animate-pulse" />
            <span>SYNCHRONIZING WITH DATABASE...</span>
          </div>
        ) : (
          <>
            {/* ------------------------------------------------------------- */}
            {/* 1. DASHBOARD OVERVIEW TAB */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div className="border-b-2 border-[#171514] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="font-mono text-xs font-bold text-[#DF491E] uppercase tracking-wider">
                      // SYSTEM METRICS &amp; OVERVIEW
                    </div>
                    <h2 className="font-display text-3xl font-extrabold text-[#171514] tracking-wide mt-1">
                      PORTFOLIO COMMAND CENTER
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <button
                      onClick={loadAllData}
                      className="px-3 py-1.5 border border-[#171514] bg-[#F2EFE7] hover:bg-[#171514] hover:text-[#ECE8DF] transition-colors"
                    >
                      ↻ REFRESH DATA
                    </button>
                  </div>
                </div>

                {/* Verified Data Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="border-2 border-[#171514] p-5 bg-[#F2EFE7] space-y-2">
                    <div className="font-mono text-[11px] font-bold text-[#5A5650] uppercase">
                      RESEARCH ADVISORIES
                    </div>
                    <div className="font-display text-4xl font-extrabold text-[#171514]">
                      {stats?.research.total ?? 0}
                    </div>
                    <div className="font-mono text-[11px] text-[#5A5650] flex items-center justify-between border-t border-[#171514]/20 pt-2">
                      <span>Published: {stats?.research.published ?? 0}</span>
                      <span>Draft: {stats?.research.draft ?? 0}</span>
                    </div>
                  </div>

                  <div className="border-2 border-[#171514] p-5 bg-[#F2EFE7] space-y-2">
                    <div className="font-mono text-[11px] font-bold text-[#5A5650] uppercase">
                      ARSENAL PROJECTS
                    </div>
                    <div className="font-display text-4xl font-extrabold text-[#171514]">
                      {stats?.projects.total ?? 0}
                    </div>
                    <div className="font-mono text-[11px] text-[#5A5650] flex items-center justify-between border-t border-[#171514]/20 pt-2">
                      <span>Published: {stats?.projects.published ?? 0}</span>
                      <span>Draft: {stats?.projects.draft ?? 0}</span>
                    </div>
                  </div>

                  <div className="border-2 border-[#171514] p-5 bg-[#F2EFE7] space-y-2">
                    <div className="font-mono text-[11px] font-bold text-[#5A5650] uppercase">
                      SKILL CATEGORIES
                    </div>
                    <div className="font-display text-4xl font-extrabold text-[#171514]">
                      {stats?.skills.totalCategories ?? 0}
                    </div>
                    <div className="font-mono text-[11px] text-[#5A5650] border-t border-[#171514]/20 pt-2">
                      Technical domains configured
                    </div>
                  </div>

                  <div className="border-2 border-[#171514] p-5 bg-[#F2EFE7] space-y-2">
                    <div className="font-mono text-[11px] font-bold text-[#5A5650] uppercase">
                      INCOMING INQUIRIES
                    </div>
                    <div className="font-display text-4xl font-extrabold text-[#DF491E]">
                      {stats?.submissions.unread ?? 0}
                    </div>
                    <div className="font-mono text-[11px] text-[#5A5650] border-t border-[#171514]/20 pt-2">
                      Total received: {stats?.submissions.total ?? 0}
                    </div>
                  </div>
                </div>

                {/* Quick actions & recent activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Quick Action Hub */}
                  <div className="border border-[#171514] p-6 bg-[#F2EFE7] space-y-4">
                    <div className="font-mono text-xs font-bold text-[#DF491E] uppercase tracking-wider">
                      // QUICK ACTIONS
                    </div>
                    <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                      <button
                        onClick={() => {
                          setEditingResearch({
                            id: 'new',
                            title: '',
                            slug: '',
                            summary: '',
                            content: '',
                            category: 'Web Security',
                            severity: 'High',
                            cve_id: '',
                            published_date: new Date().toISOString().split('T')[0],
                            tags: '',
                            status: 'published',
                          });
                          setIsResearchModalOpen(true);
                        }}
                        className="p-3 border border-[#171514] bg-[#ECE8DF] hover:bg-[#171514] hover:text-[#ECE8DF] font-bold transition-colors text-left"
                      >
                        + NEW RESEARCH
                      </button>

                      <button
                        onClick={() => {
                          setEditingProject({
                            id: 'new',
                            title: '',
                            slug: '',
                            summary: '',
                            description: '',
                            tech_stack: '',
                            category: 'Security Tool',
                            repo_url: '',
                            demo_url: '',
                            status: 'published',
                            featured: false,
                          });
                          setIsProjectModalOpen(true);
                        }}
                        className="p-3 border border-[#171514] bg-[#ECE8DF] hover:bg-[#171514] hover:text-[#ECE8DF] font-bold transition-colors text-left"
                      >
                        + NEW ARSENAL TOOL
                      </button>

                      <button
                        onClick={() => setActiveTab('hero')}
                        className="p-3 border border-[#171514] bg-[#ECE8DF] hover:bg-[#171514] hover:text-[#ECE8DF] font-bold transition-colors text-left"
                      >
                        ✎ EDIT HERO STATUS
                      </button>

                      <button
                        onClick={() => setActiveTab('settings')}
                        className="p-3 border border-[#171514] bg-[#ECE8DF] hover:bg-[#171514] hover:text-[#ECE8DF] font-bold transition-colors text-left"
                      >
                        ⚙ SITE SETTINGS
                      </button>
                    </div>
                  </div>

                  {/* Backend Status Details */}
                  <div className="border border-[#171514] p-6 bg-[#F2EFE7] space-y-3 font-mono text-xs">
                    <div className="font-bold text-[#DF491E] uppercase tracking-wider">
                      // ARCHITECTURE &amp; DATA ENGINE
                    </div>
                    <p className="text-[#5A5650] leading-relaxed">
                      This CMS operates with a zero-downtime dual backend architecture. All portfolio sections
                      dynamically stream content with full Row Level Security (RLS) enforcement.
                    </p>
                    <div className="border-t border-[#171514]/20 pt-3 space-y-1.5 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-[#5A5650]">Storage Mode:</span>
                        <span className="font-bold text-[#171514] uppercase">
                          {stats?.backend === 'supabase' ? 'Supabase PostgreSQL' : 'Local SQLite Fallback'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#5A5650]">Last Synced:</span>
                        <span className="text-[#171514]">{new Date().toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 2. HERO & OVERVIEW CONTENT TAB */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'hero' && heroData && (
              <form onSubmit={handleSaveHero} className="space-y-6 max-w-4xl">
                <div className="border-b-2 border-[#171514] pb-4 flex items-center justify-between">
                  <div>
                    <div className="font-mono text-xs font-bold text-[#DF491E] uppercase tracking-wider">
                      // CONTENT MODEL 01
                    </div>
                    <h2 className="font-display text-3xl font-extrabold text-[#171514] tracking-wide mt-1">
                      HERO &amp; OVERVIEW MANAGEMENT
                    </h2>
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#DF491E] hover:bg-[#C73E16] text-[#171514] font-bold font-mono text-xs border border-[#171514] tracking-wider transition-colors cursor-pointer"
                  >
                    SAVE CHANGES
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-[#171514]">BRAND HEADLINE</label>
                    <input
                      type="text"
                      value={heroData.brand_name}
                      onChange={(e) => setHeroData({ ...heroData, brand_name: e.target.value })}
                      required
                      className="w-full bg-[#F2EFE7] border border-[#171514] p-2.5 text-[#171514]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[#171514]">PROFESSIONAL SUBTITLE</label>
                    <input
                      type="text"
                      value={heroData.headline}
                      onChange={(e) => setHeroData({ ...heroData, headline: e.target.value })}
                      required
                      className="w-full bg-[#F2EFE7] border border-[#171514] p-2.5 text-[#171514]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[#171514]">MANIFESTO LINE 1</label>
                    <input
                      type="text"
                      value={heroData.manifesto_line_1}
                      onChange={(e) => setHeroData({ ...heroData, manifesto_line_1: e.target.value })}
                      className="w-full bg-[#F2EFE7] border border-[#171514] p-2.5 text-[#171514]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[#171514]">MANIFESTO LINE 2</label>
                    <input
                      type="text"
                      value={heroData.manifesto_line_2}
                      onChange={(e) => setHeroData({ ...heroData, manifesto_line_2: e.target.value })}
                      className="w-full bg-[#F2EFE7] border border-[#171514] p-2.5 text-[#171514]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[#171514]">MANIFESTO LINE 3</label>
                    <input
                      type="text"
                      value={heroData.manifesto_line_3}
                      onChange={(e) => setHeroData({ ...heroData, manifesto_line_3: e.target.value })}
                      className="w-full bg-[#F2EFE7] border border-[#171514] p-2.5 text-[#171514]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[#171514]">COLLABORATION STATUS</label>
                    <input
                      type="text"
                      value={heroData.status_label}
                      onChange={(e) => setHeroData({ ...heroData, status_label: e.target.value })}
                      className="w-full bg-[#F2EFE7] border border-[#171514] p-2.5 text-[#171514]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[#171514]">STATUS SUBTEXT</label>
                    <input
                      type="text"
                      value={heroData.status_subtext}
                      onChange={(e) => setHeroData({ ...heroData, status_subtext: e.target.value })}
                      className="w-full bg-[#F2EFE7] border border-[#171514] p-2.5 text-[#171514]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[#171514]">EDITORIAL QUOTE</label>
                    <input
                      type="text"
                      value={heroData.quote}
                      onChange={(e) => setHeroData({ ...heroData, quote: e.target.value })}
                      className="w-full bg-[#F2EFE7] border border-[#171514] p-2.5 text-[#171514]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[#171514]">STAT 1: PROJECTS</label>
                    <input
                      type="text"
                      value={heroData.stat_projects}
                      onChange={(e) => setHeroData({ ...heroData, stat_projects: e.target.value })}
                      className="w-full bg-[#F2EFE7] border border-[#171514] p-2.5 text-[#171514]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[#171514]">STAT 2: WRITE-UPS</label>
                    <input
                      type="text"
                      value={heroData.stat_writeups}
                      onChange={(e) => setHeroData({ ...heroData, stat_writeups: e.target.value })}
                      className="w-full bg-[#F2EFE7] border border-[#171514] p-2.5 text-[#171514]"
                    />
                  </div>
                </div>
              </form>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 3. BACKGROUND & ABOUT CONTENT TAB */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'about' && aboutData && (
              <form onSubmit={handleSaveAbout} className="space-y-8 max-w-4xl">
                <div className="border-b-2 border-[#171514] pb-4 flex items-center justify-between">
                  <div>
                    <div className="font-mono text-xs font-bold text-[#DF491E] uppercase tracking-wider">
                      // CONTENT MODEL 02
                    </div>
                    <h2 className="font-display text-3xl font-extrabold text-[#171514] tracking-wide mt-1">
                      BACKGROUND &amp; METHODOLOGY
                    </h2>
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#DF491E] hover:bg-[#C73E16] text-[#171514] font-bold font-mono text-xs border border-[#171514] tracking-wider transition-colors cursor-pointer"
                  >
                    SAVE CHANGES
                  </button>
                </div>

                {/* Operative Bio */}
                <div className="border border-[#171514] p-5 bg-[#F2EFE7] space-y-4 font-mono text-xs">
                  <div className="font-bold text-[#DF491E] uppercase">// OPERATIVE BIOGRAPHY</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-[#171514] mb-1">STATUS BADGE</label>
                      <input
                        type="text"
                        value={aboutData.status_badge}
                        onChange={(e) => setAboutData({ ...aboutData, status_badge: e.target.value })}
                        className="w-full bg-[#ECE8DF] border border-[#171514] p-2 text-[#171514]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#171514] mb-1">SPECIFICATION</label>
                      <input
                        type="text"
                        value={aboutData.spec_text}
                        onChange={(e) => setAboutData({ ...aboutData, spec_text: e.target.value })}
                        className="w-full bg-[#ECE8DF] border border-[#171514] p-2 text-[#171514]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-[#171514] mb-1">PRIMARY BIOGRAPHY (PARAGRAPH 1)</label>
                    <textarea
                      rows={3}
                      value={aboutData.bio_paragraph_1}
                      onChange={(e) => setAboutData({ ...aboutData, bio_paragraph_1: e.target.value })}
                      className="w-full bg-[#ECE8DF] border border-[#171514] p-2.5 text-[#171514] font-sans text-sm"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#171514] mb-1">SECONDARY PHILOSOPHY (PARAGRAPH 2)</label>
                    <textarea
                      rows={3}
                      value={aboutData.bio_paragraph_2}
                      onChange={(e) => setAboutData({ ...aboutData, bio_paragraph_2: e.target.value })}
                      className="w-full bg-[#ECE8DF] border border-[#171514] p-2.5 text-[#171514] font-sans text-sm"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#171514] mb-1">MOTTO / SIGNATURE BANNER</label>
                    <input
                      type="text"
                      value={aboutData.motto_quote}
                      onChange={(e) => setAboutData({ ...aboutData, motto_quote: e.target.value })}
                      className="w-full bg-[#ECE8DF] border border-[#171514] p-2 text-[#171514]"
                    />
                  </div>
                </div>

                {/* 4 Research Domains */}
                <div className="border border-[#171514] p-5 bg-[#F2EFE7] space-y-4 font-mono text-xs">
                  <div className="font-bold text-[#DF491E] uppercase">// 4 RESEARCH DOMAINS</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {domains.map((d, idx) => (
                      <div key={d.id || idx} className="border border-[#171514] p-3 bg-[#ECE8DF] space-y-2">
                        <div className="flex items-center gap-2 font-bold text-[#DF491E]">
                          <span>{d.domain_num} /</span>
                          <input
                            type="text"
                            value={d.domain_code}
                            onChange={(e) => {
                              const updated = [...domains];
                              updated[idx].domain_code = e.target.value;
                              setDomains(updated);
                            }}
                            className="bg-transparent border-b border-[#171514]/30 text-xs w-full font-bold"
                          />
                        </div>
                        <input
                          type="text"
                          value={d.title}
                          onChange={(e) => {
                            const updated = [...domains];
                            updated[idx].title = e.target.value;
                            setDomains(updated);
                          }}
                          className="w-full bg-[#F2EFE7] border border-[#171514] p-1.5 text-xs font-bold"
                        />
                        <textarea
                          rows={2}
                          value={d.description}
                          onChange={(e) => {
                            const updated = [...domains];
                            updated[idx].description = e.target.value;
                            setDomains(updated);
                          }}
                          className="w-full bg-[#F2EFE7] border border-[#171514] p-1.5 text-[11px]"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </form>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 4. RESEARCH ADVISORIES CRUD TAB */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'research' && (
              <div className="space-y-6">
                <div className="border-b-2 border-[#171514] pb-4 flex items-center justify-between">
                  <div>
                    <div className="font-mono text-xs font-bold text-[#DF491E] uppercase tracking-wider">
                      // CONTENT MODEL 03
                    </div>
                    <h2 className="font-display text-3xl font-extrabold text-[#171514] tracking-wide mt-1">
                      RESEARCH ADVISORIES ({researchList.length})
                    </h2>
                  </div>
                  <button
                    onClick={() => {
                      setEditingResearch({
                        id: 'new',
                        title: '',
                        slug: '',
                        summary: '',
                        content: '',
                        category: 'Web Security',
                        severity: 'High',
                        cve_id: '',
                        published_date: new Date().toISOString().split('T')[0],
                        tags: '',
                        status: 'published',
                      });
                      setIsResearchModalOpen(true);
                    }}
                    className="px-4 py-2 bg-[#DF491E] hover:bg-[#C73E16] text-[#171514] font-bold font-mono text-xs border border-[#171514] tracking-wider transition-colors cursor-pointer"
                  >
                    + NEW ADVISORY
                  </button>
                </div>

                {/* Research Table */}
                <div className="border-2 border-[#171514] bg-[#F2EFE7] overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs border-collapse">
                    <thead>
                      <tr className="border-b-2 border-[#171514] bg-[#171514] text-[#ECE8DF]">
                        <th className="p-3">SEVERITY</th>
                        <th className="p-3">TITLE &amp; SLUG</th>
                        <th className="p-3">CATEGORY</th>
                        <th className="p-3">CVE / ID</th>
                        <th className="p-3">STATUS</th>
                        <th className="p-3 text-right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {researchList.map((r) => (
                        <tr key={r.id} className="border-b border-[#171514]/20 hover:bg-[#ECE8DF]/70">
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold uppercase ${
                                r.severity === 'Critical'
                                  ? 'bg-[#DF491E] text-[#171514]'
                                  : r.severity === 'High'
                                  ? 'bg-[#171514] text-[#ECE8DF]'
                                  : 'border border-[#171514] text-[#171514]'
                              }`}
                            >
                              {r.severity}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-[#171514]">{r.title}</div>
                            <div className="text-[10px] text-[#5A5650]">{r.slug}</div>
                          </td>
                          <td className="p-3 text-[#5A5650]">{r.category}</td>
                          <td className="p-3 font-semibold">{r.cve_id || '—'}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold ${
                                r.status === 'published'
                                  ? 'bg-green-700/20 text-green-900 border border-green-700'
                                  : 'bg-yellow-500/20 text-yellow-900 border border-yellow-700'
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="p-3 text-right space-x-2">
                            <button
                              onClick={() => {
                                setEditingResearch(r);
                                setIsResearchModalOpen(true);
                              }}
                              className="px-2.5 py-1 border border-[#171514] bg-[#ECE8DF] hover:bg-[#171514] hover:text-[#ECE8DF] transition-colors"
                            >
                              EDIT
                            </button>
                            <button
                              onClick={() => setDeleteConfirm({ type: 'research', id: r.id, title: r.title })}
                              className="px-2.5 py-1 border border-[#DF491E] text-[#DF491E] hover:bg-[#DF491E] hover:text-[#171514] transition-colors"
                            >
                              DELETE
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Research Modal Editor */}
            {isResearchModalOpen && editingResearch && (
              <div className="fixed inset-0 z-50 bg-[#171514]/60 backdrop-blur-xs flex items-center justify-center p-4">
                <form
                  onSubmit={handleSaveResearch}
                  className="w-full max-w-2xl bg-[#F2EFE7] border-2 border-[#171514] p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl font-mono text-xs"
                >
                  <div className="border-b-2 border-[#171514] pb-2 flex items-center justify-between">
                    <span className="font-bold text-[#DF491E] uppercase">
                      {editingResearch.id === 'new' ? '// CREATE NEW RESEARCH ADVISORY' : '// EDIT ADVISORY'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsResearchModalOpen(false)}
                      className="font-bold text-lg leading-none cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <div>
                    <label className="block font-bold text-[#171514] mb-1">TITLE</label>
                    <input
                      type="text"
                      value={editingResearch.title}
                      onChange={(e) => {
                        const title = e.target.value;
                        const slug = title
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/(^-|-$)/g, '');
                        setEditingResearch({ ...editingResearch, title, slug });
                      }}
                      required
                      className="w-full bg-[#ECE8DF] border border-[#171514] p-2.5"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-[#171514] mb-1">SLUG (URL KEY)</label>
                      <input
                        type="text"
                        value={editingResearch.slug}
                        onChange={(e) => setEditingResearch({ ...editingResearch, slug: e.target.value })}
                        required
                        className="w-full bg-[#ECE8DF] border border-[#171514] p-2"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#171514] mb-1">CATEGORY</label>
                      <select
                        value={editingResearch.category}
                        onChange={(e) => setEditingResearch({ ...editingResearch, category: e.target.value })}
                        className="w-full bg-[#ECE8DF] border border-[#171514] p-2"
                      >
                        <option value="Web Security">Web Security</option>
                        <option value="Cloud & Recon">Cloud &amp; Recon</option>
                        <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                        <option value="Binary & Firmware">Binary &amp; Firmware</option>
                        <option value="API Security">API Security</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-[#171514] mb-1">SEVERITY</label>
                      <select
                        value={editingResearch.severity}
                        onChange={(e) =>
                          setEditingResearch({ ...editingResearch, severity: e.target.value as any })
                        }
                        className="w-full bg-[#ECE8DF] border border-[#171514] p-2"
                      >
                        <option value="Critical">Critical</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                        <option value="Info">Info</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-[#171514] mb-1">CVE / TRACKING ID</label>
                      <input
                        type="text"
                        value={editingResearch.cve_id || ''}
                        onChange={(e) => setEditingResearch({ ...editingResearch, cve_id: e.target.value })}
                        placeholder="e.g. CVE-2024-8841"
                        className="w-full bg-[#ECE8DF] border border-[#171514] p-2"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#171514] mb-1">PUBLICATION STATUS</label>
                      <select
                        value={editingResearch.status}
                        onChange={(e) =>
                          setEditingResearch({ ...editingResearch, status: e.target.value as any })
                        }
                        className="w-full bg-[#ECE8DF] border border-[#171514] p-2"
                      >
                        <option value="published">Published</option>
                        <option value="draft">Draft (Private)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-[#171514] mb-1">SUMMARY (DOSSIER PREVIEW)</label>
                    <textarea
                      rows={2}
                      value={editingResearch.summary}
                      onChange={(e) => setEditingResearch({ ...editingResearch, summary: e.target.value })}
                      required
                      className="w-full bg-[#ECE8DF] border border-[#171514] p-2.5"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#171514] mb-1">FULL TECHNICAL BREAKDOWN</label>
                    <textarea
                      rows={4}
                      value={editingResearch.content}
                      onChange={(e) => setEditingResearch({ ...editingResearch, content: e.target.value })}
                      required
                      className="w-full bg-[#ECE8DF] border border-[#171514] p-2.5 font-sans text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#171514] mb-1">TAGS (COMMA-SEPARATED)</label>
                    <input
                      type="text"
                      value={editingResearch.tags}
                      onChange={(e) => setEditingResearch({ ...editingResearch, tags: e.target.value })}
                      placeholder="OAuth, SSO, Identity, Auth Bypass"
                      className="w-full bg-[#ECE8DF] border border-[#171514] p-2"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#171514]/20">
                    <button
                      type="button"
                      onClick={() => setIsResearchModalOpen(false)}
                      className="px-4 py-2 border border-[#171514] bg-[#ECE8DF]"
                    >
                      CANCEL
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#DF491E] text-[#171514] font-bold border border-[#171514]"
                    >
                      SAVE ADVISORY
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 5. ARSENAL & PROJECTS CRUD TAB */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'projects' && (
              <div className="space-y-6">
                <div className="border-b-2 border-[#171514] pb-4 flex items-center justify-between">
                  <div>
                    <div className="font-mono text-xs font-bold text-[#DF491E] uppercase tracking-wider">
                      // CONTENT MODEL 04
                    </div>
                    <h2 className="font-display text-3xl font-extrabold text-[#171514] tracking-wide mt-1">
                      ARSENAL &amp; TOOLS ({projects.length})
                    </h2>
                  </div>
                  <button
                    onClick={() => {
                      setEditingProject({
                        id: 'new',
                        title: '',
                        slug: '',
                        summary: '',
                        description: '',
                        tech_stack: '',
                        category: 'Security Tool',
                        repo_url: '',
                        demo_url: '',
                        status: 'published',
                        featured: false,
                      });
                      setIsProjectModalOpen(true);
                    }}
                    className="px-4 py-2 bg-[#DF491E] hover:bg-[#C73E16] text-[#171514] font-bold font-mono text-xs border border-[#171514] tracking-wider transition-colors cursor-pointer"
                  >
                    + NEW TOOL
                  </button>
                </div>

                {/* Projects Table */}
                <div className="border-2 border-[#171514] bg-[#F2EFE7] overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs border-collapse">
                    <thead>
                      <tr className="border-b-2 border-[#171514] bg-[#171514] text-[#ECE8DF]">
                        <th className="p-3">TOOL NAME &amp; SLUG</th>
                        <th className="p-3">TECH STACK</th>
                        <th className="p-3">CATEGORY</th>
                        <th className="p-3">STATUS</th>
                        <th className="p-3 text-right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.map((p) => (
                        <tr key={p.id} className="border-b border-[#171514]/20 hover:bg-[#ECE8DF]/70">
                          <td className="p-3">
                            <div className="font-bold text-[#171514] flex items-center gap-2">
                              <span>{p.title}</span>
                              {p.featured && (
                                <span className="px-1.5 py-0.2 bg-[#DF491E] text-[#171514] text-[9px] font-bold">
                                  FEATURED
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-[#5A5650]">{p.slug}</div>
                          </td>
                          <td className="p-3 text-[#5A5650]">{p.tech_stack}</td>
                          <td className="p-3">{p.category}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold ${
                                p.status === 'published'
                                  ? 'bg-green-700/20 text-green-900 border border-green-700'
                                  : 'bg-yellow-500/20 text-yellow-900 border border-yellow-700'
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="p-3 text-right space-x-2">
                            <button
                              onClick={() => {
                                setEditingProject(p);
                                setIsProjectModalOpen(true);
                              }}
                              className="px-2.5 py-1 border border-[#171514] bg-[#ECE8DF] hover:bg-[#171514] hover:text-[#ECE8DF] transition-colors"
                            >
                              EDIT
                            </button>
                            <button
                              onClick={() => setDeleteConfirm({ type: 'project', id: p.id, title: p.title })}
                              className="px-2.5 py-1 border border-[#DF491E] text-[#DF491E] hover:bg-[#DF491E] hover:text-[#171514] transition-colors"
                            >
                              DELETE
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Project Modal Editor */}
            {isProjectModalOpen && editingProject && (
              <div className="fixed inset-0 z-50 bg-[#171514]/60 backdrop-blur-xs flex items-center justify-center p-4">
                <form
                  onSubmit={handleSaveProject}
                  className="w-full max-w-xl bg-[#F2EFE7] border-2 border-[#171514] p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl font-mono text-xs"
                >
                  <div className="border-b-2 border-[#171514] pb-2 flex items-center justify-between">
                    <span className="font-bold text-[#DF491E] uppercase">
                      {editingProject.id === 'new' ? '// CREATE ARSENAL TOOL' : '// EDIT ARSENAL TOOL'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsProjectModalOpen(false)}
                      className="font-bold text-lg leading-none cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <div>
                    <label className="block font-bold text-[#171514] mb-1">TOOL / PROJECT TITLE</label>
                    <input
                      type="text"
                      value={editingProject.title}
                      onChange={(e) => {
                        const title = e.target.value;
                        const slug = title
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/(^-|-$)/g, '');
                        setEditingProject({ ...editingProject, title, slug });
                      }}
                      required
                      className="w-full bg-[#ECE8DF] border border-[#171514] p-2.5"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-[#171514] mb-1">SLUG (URL KEY)</label>
                      <input
                        type="text"
                        value={editingProject.slug}
                        onChange={(e) => setEditingProject({ ...editingProject, slug: e.target.value })}
                        required
                        className="w-full bg-[#ECE8DF] border border-[#171514] p-2"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#171514] mb-1">CATEGORY</label>
                      <input
                        type="text"
                        value={editingProject.category}
                        onChange={(e) => setEditingProject({ ...editingProject, category: e.target.value })}
                        className="w-full bg-[#ECE8DF] border border-[#171514] p-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-[#171514] mb-1">TECH STACK</label>
                      <input
                        type="text"
                        value={editingProject.tech_stack}
                        onChange={(e) => setEditingProject({ ...editingProject, tech_stack: e.target.value })}
                        placeholder="Go, Python, Docker"
                        className="w-full bg-[#ECE8DF] border border-[#171514] p-2"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#171514] mb-1">STATUS</label>
                      <select
                        value={editingProject.status}
                        onChange={(e) =>
                          setEditingProject({ ...editingProject, status: e.target.value as any })
                        }
                        className="w-full bg-[#ECE8DF] border border-[#171514] p-2"
                      >
                        <option value="published">Published</option>
                        <option value="draft">Draft (Private)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-[#171514] mb-1">SUMMARY</label>
                    <textarea
                      rows={2}
                      value={editingProject.summary}
                      onChange={(e) => setEditingProject({ ...editingProject, summary: e.target.value })}
                      required
                      className="w-full bg-[#ECE8DF] border border-[#171514] p-2"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#171514] mb-1">DETAILED SPECIFICATION</label>
                    <textarea
                      rows={3}
                      value={editingProject.description}
                      onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                      className="w-full bg-[#ECE8DF] border border-[#171514] p-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-[#171514] mb-1">REPOSITORY URL</label>
                      <input
                        type="url"
                        value={editingProject.repo_url || ''}
                        onChange={(e) => setEditingProject({ ...editingProject, repo_url: e.target.value })}
                        className="w-full bg-[#ECE8DF] border border-[#171514] p-2"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#171514] mb-1">LIVE DEMO URL</label>
                      <input
                        type="url"
                        value={editingProject.demo_url || ''}
                        onChange={(e) => setEditingProject({ ...editingProject, demo_url: e.target.value })}
                        className="w-full bg-[#ECE8DF] border border-[#171514] p-2"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={editingProject.featured}
                      onChange={(e) => setEditingProject({ ...editingProject, featured: e.target.checked })}
                      className="w-4 h-4 accent-[#DF491E]"
                    />
                    <label htmlFor="featured" className="font-bold text-[#171514]">
                      Feature this project in prominent showcase
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#171514]/20">
                    <button
                      type="button"
                      onClick={() => setIsProjectModalOpen(false)}
                      className="px-4 py-2 border border-[#171514] bg-[#ECE8DF]"
                    >
                      CANCEL
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#DF491E] text-[#171514] font-bold border border-[#171514]"
                    >
                      SAVE TOOL
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 6. SKILLS MATRIX TAB */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'skills' && (
              <div className="space-y-6 max-w-4xl">
                <div className="border-b-2 border-[#171514] pb-4">
                  <div className="font-mono text-xs font-bold text-[#DF491E] uppercase tracking-wider">
                    // CONTENT MODEL 05
                  </div>
                  <h2 className="font-display text-3xl font-extrabold text-[#171514] tracking-wide mt-1">
                    SKILLS MATRIX &amp; TOOLS
                  </h2>
                </div>

                <div className="space-y-6">
                  {skillsList.map((cat, idx) => (
                    <div key={cat.id || idx} className="border-2 border-[#171514] p-5 bg-[#F2EFE7] space-y-4 font-mono text-xs">
                      <div className="flex items-center justify-between border-b border-[#171514]/20 pb-2">
                        <span className="font-bold text-[#DF491E] text-sm">
                          {cat.category_num} // {cat.category_title}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateSkillCategory(cat)}
                          className="px-3 py-1 bg-[#171514] text-[#ECE8DF] hover:bg-[#DF491E] hover:text-[#171514] font-bold transition-colors"
                        >
                          SAVE CATEGORY
                        </button>
                      </div>

                      <div>
                        <label className="block font-bold text-[#171514] mb-1">CATEGORY DESCRIPTION</label>
                        <input
                          type="text"
                          value={cat.description}
                          onChange={(e) => {
                            const updated = [...skillsList];
                            updated[idx].description = e.target.value;
                            setSkillsList(updated);
                          }}
                          className="w-full bg-[#ECE8DF] border border-[#171514] p-2"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-[#171514] mb-1">
                          TECHNICAL COMPETENCIES (COMMA-SEPARATED)
                        </label>
                        <textarea
                          rows={2}
                          value={cat.skills.join(', ')}
                          onChange={(e) => {
                            const updated = [...skillsList];
                            updated[idx].skills = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                            setSkillsList(updated);
                          }}
                          className="w-full bg-[#ECE8DF] border border-[#171514] p-2 font-sans text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-[#171514] mb-1">
                          TOOLING &amp; PLATFORMS (COMMA-SEPARATED)
                        </label>
                        <input
                          type="text"
                          value={cat.tools.join(', ')}
                          onChange={(e) => {
                            const updated = [...skillsList];
                            updated[idx].tools = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                            setSkillsList(updated);
                          }}
                          className="w-full bg-[#ECE8DF] border border-[#171514] p-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 7. INBOX / CONTACT SUBMISSIONS TAB */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'submissions' && (
              <div className="space-y-6">
                <div className="border-b-2 border-[#171514] pb-4 flex items-center justify-between">
                  <div>
                    <div className="font-mono text-xs font-bold text-[#DF491E] uppercase tracking-wider">
                      // SECURE TRANSMISSIONS
                    </div>
                    <h2 className="font-display text-3xl font-extrabold text-[#171514] tracking-wide mt-1">
                      INCOMING INQUIRIES ({submissions.length})
                    </h2>
                  </div>
                </div>

                <div className="border-2 border-[#171514] bg-[#F2EFE7] overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs border-collapse">
                    <thead>
                      <tr className="border-b-2 border-[#171514] bg-[#171514] text-[#ECE8DF]">
                        <th className="p-3">STATUS</th>
                        <th className="p-3">SENDER</th>
                        <th className="p-3">SUBJECT</th>
                        <th className="p-3">TIMESTAMP</th>
                        <th className="p-3 text-right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-[#5A5650]">
                            No transmissions recorded in the database.
                          </td>
                        </tr>
                      ) : (
                        submissions.map((s) => (
                          <tr
                            key={s.id}
                            className={`border-b border-[#171514]/20 hover:bg-[#ECE8DF]/70 ${
                              s.status === 'unread' ? 'font-bold bg-[#DF491E]/5' : ''
                            }`}
                          >
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 text-[10px] font-bold uppercase ${
                                  s.status === 'unread'
                                    ? 'bg-[#DF491E] text-[#171514]'
                                    : 'bg-[#171514]/10 text-[#5A5650]'
                                }`}
                              >
                                {s.status}
                              </span>
                            </td>
                            <td className="p-3">
                              <div>{s.sender_name}</div>
                              <div className="text-[10px] text-[#5A5650]">{s.sender_email}</div>
                            </td>
                            <td className="p-3 text-[#171514] max-w-xs truncate">{s.subject}</td>
                            <td className="p-3 text-[#5A5650] text-[11px]">
                              {s.created_at ? new Date(s.created_at).toLocaleDateString() : '—'}
                            </td>
                            <td className="p-3 text-right space-x-2">
                              <button
                                onClick={() => {
                                  setViewingSubmission(s);
                                  if (s.status === 'unread') {
                                    handleSubmissionStatus(s.id, 'read');
                                  }
                                }}
                                className="px-2.5 py-1 border border-[#171514] bg-[#ECE8DF] hover:bg-[#171514] hover:text-[#ECE8DF] transition-colors"
                              >
                                READ
                              </button>
                              <button
                                onClick={() =>
                                  handleSubmissionStatus(s.id, s.status === 'unread' ? 'read' : 'unread')
                                }
                                className="px-2.5 py-1 border border-[#171514] hover:bg-[#ECE8DF] transition-colors"
                              >
                                {s.status === 'unread' ? 'MARK READ' : 'MARK UNREAD'}
                              </button>
                              <button
                                onClick={() =>
                                  setDeleteConfirm({
                                    type: 'submission',
                                    id: s.id,
                                    title: `${s.sender_name}: ${s.subject}`,
                                  })
                                }
                                className="px-2.5 py-1 border border-[#DF491E] text-[#DF491E] hover:bg-[#DF491E] hover:text-[#171514] transition-colors"
                              >
                                DELETE
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Submission Reader Modal */}
            {viewingSubmission && (
              <div className="fixed inset-0 z-50 bg-[#171514]/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="w-full max-w-lg bg-[#F2EFE7] border-2 border-[#171514] p-6 space-y-4 shadow-2xl font-mono text-xs">
                  <div className="border-b-2 border-[#171514] pb-2 flex items-center justify-between">
                    <span className="font-bold text-[#DF491E] uppercase">// TRANSMISSION DOSSIER</span>
                    <button
                      type="button"
                      onClick={() => setViewingSubmission(null)}
                      className="font-bold text-lg leading-none cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-1.5 border-b border-[#171514]/20 pb-3">
                    <div className="text-[11px] text-[#5A5650]">FROM:</div>
                    <div className="font-bold text-[#171514]">
                      {viewingSubmission.sender_name} &lt;{viewingSubmission.sender_email}&gt;
                    </div>
                    <div className="text-[11px] text-[#5A5650] pt-1">SUBJECT:</div>
                    <div className="font-bold text-[#171514]">{viewingSubmission.subject}</div>
                  </div>

                  <div>
                    <div className="text-[11px] text-[#5A5650] mb-1">MESSAGE BODY:</div>
                    <div className="p-4 bg-[#ECE8DF] border border-[#171514] whitespace-pre-wrap font-sans text-xs leading-relaxed text-[#171514]">
                      {viewingSubmission.message}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setViewingSubmission(null)}
                      className="px-4 py-2 border border-[#171514] bg-[#ECE8DF]"
                    >
                      CLOSE
                    </button>
                    <a
                      href={`mailto:${viewingSubmission.sender_email}?subject=Re: ${encodeURIComponent(
                        viewingSubmission.subject
                      )}`}
                      className="px-4 py-2 bg-[#DF491E] text-[#171514] font-bold border border-[#171514] hover:bg-[#C73E16]"
                    >
                      REPLY VIA EMAIL →
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 8. SITE SETTINGS TAB */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'settings' && settingsData && (
              <form onSubmit={handleSaveSettings} className="space-y-6 max-w-3xl font-mono text-xs">
                <div className="border-b-2 border-[#171514] pb-4 flex items-center justify-between">
                  <div>
                    <div className="font-mono text-xs font-bold text-[#DF491E] uppercase tracking-wider">
                      // SYSTEM METADATA &amp; BRAND
                    </div>
                    <h2 className="font-display text-3xl font-extrabold text-[#171514] tracking-wide mt-1">
                      GLOBAL SITE SETTINGS
                    </h2>
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#DF491E] hover:bg-[#C73E16] text-[#171514] font-bold border border-[#171514] tracking-wider transition-colors cursor-pointer"
                  >
                    SAVE SETTINGS
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block font-bold text-[#171514] mb-1">SITE TITLE (BROWSER / SEO)</label>
                    <input
                      type="text"
                      value={settingsData.site_title}
                      onChange={(e) => setSettingsData({ ...settingsData, site_title: e.target.value })}
                      required
                      className="w-full bg-[#F2EFE7] border border-[#171514] p-2.5"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#171514] mb-1">META DESCRIPTION</label>
                    <textarea
                      rows={2}
                      value={settingsData.site_description}
                      onChange={(e) => setSettingsData({ ...settingsData, site_description: e.target.value })}
                      className="w-full bg-[#F2EFE7] border border-[#171514] p-2.5"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-[#171514] mb-1">FOOTER BRAND</label>
                      <input
                        type="text"
                        value={settingsData.footer_brand}
                        onChange={(e) => setSettingsData({ ...settingsData, footer_brand: e.target.value })}
                        className="w-full bg-[#F2EFE7] border border-[#171514] p-2.5"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#171514] mb-1">FOOTER TEXT</label>
                      <input
                        type="text"
                        value={settingsData.footer_text}
                        onChange={(e) => setSettingsData({ ...settingsData, footer_text: e.target.value })}
                        className="w-full bg-[#F2EFE7] border border-[#171514] p-2.5"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-[#171514] mb-1">PRIMARY CONTACT EMAIL</label>
                      <input
                        type="email"
                        value={settingsData.contact_email}
                        onChange={(e) => setSettingsData({ ...settingsData, contact_email: e.target.value })}
                        className="w-full bg-[#F2EFE7] border border-[#171514] p-2.5"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#171514] mb-1">GITHUB PROFILE URL</label>
                      <input
                        type="url"
                        value={settingsData.github_url}
                        onChange={(e) => setSettingsData({ ...settingsData, github_url: e.target.value })}
                        className="w-full bg-[#F2EFE7] border border-[#171514] p-2.5"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-[#171514] mb-1">LINKEDIN PROFILE URL</label>
                      <input
                        type="url"
                        value={settingsData.linkedin_url}
                        onChange={(e) => setSettingsData({ ...settingsData, linkedin_url: e.target.value })}
                        className="w-full bg-[#F2EFE7] border border-[#171514] p-2.5"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#171514] mb-1">TWITTER / X PROFILE URL</label>
                      <input
                        type="url"
                        value={settingsData.twitter_url}
                        onChange={(e) => setSettingsData({ ...settingsData, twitter_url: e.target.value })}
                        className="w-full bg-[#F2EFE7] border border-[#171514] p-2.5"
                      />
                    </div>
                  </div>
                </div>
              </form>
            )}
          </>
        )}
      </main>
    </div>
  );
}
