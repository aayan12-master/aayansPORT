'use client';

import React, { useState, useEffect } from 'react';
import NavigationRail from '@/components/NavigationRail';
import HeroMasterpiece from '@/components/HeroMasterpiece';
import BackgroundSection from '@/components/BackgroundSection';
import ResearchSection from '@/components/ResearchSection';
import ToolsSection from '@/components/ToolsSection';
import SkillsSection from '@/components/SkillsSection';
import CollaborateSection from '@/components/CollaborateSection';
import FullscreenTip from '@/components/FullscreenTip';
import InlineEditable from '@/components/admin/InlineEditable';
import type {
  SiteSettings,
  HeroContent,
  AboutContent,
  ResearchDomain,
  SkillCategory,
  ResearchPost,
} from '@/lib/cms';
import type { GitHubTool } from '@/lib/github';

export interface PortfolioClientProps {
  initialSettings?: SiteSettings | null;
  initialHero?: HeroContent | null;
  initialAbout?: AboutContent | null;
  initialDomains?: ResearchDomain[] | null;
  initialSkills?: SkillCategory[] | null;
  initialTools?: GitHubTool[] | null;
  initialResearch?: ResearchPost[] | null;
  projectsCount?: number;
  writeupsCount?: number;

  // Visual Editor props
  isEditingMode?: boolean;
  settingsOverride?: SiteSettings | null;
  heroOverride?: HeroContent | null;
  aboutOverride?: AboutContent | null;
  domainsOverride?: ResearchDomain[] | null;
  onSettingsChange?: (field: keyof SiteSettings, value: any) => void;
  onHeroChange?: (field: keyof HeroContent, value: any) => void;
  onOpenHeroDrawer?: () => void;
  onAboutChange?: (field: keyof AboutContent, value: string) => void;
  onDomainChange?: (index: number, field: keyof ResearchDomain, value: string) => void;
  onAddDomain?: () => void;
  onDeleteDomain?: (index: number) => void;
  onMoveDomain?: (index: number, direction: 'up' | 'down') => void;
  showNavigation?: boolean;
}

export default function PortfolioClient({
  initialSettings,
  initialHero,
  initialAbout,
  initialDomains,
  initialSkills,
  initialTools,
  initialResearch,
  projectsCount,
  writeupsCount,
  isEditingMode = false,
  settingsOverride,
  heroOverride,
  aboutOverride,
  domainsOverride,
  onSettingsChange,
  onHeroChange,
  onOpenHeroDrawer,
  onAboutChange,
  onDomainChange,
  onAddDomain,
  onDeleteDomain,
  onMoveDomain,
  showNavigation = true,
}: PortfolioClientProps) {
  const [activeSection, setActiveSection] = useState('overview');
  const [footerInfo, setFooterInfo] = useState(() => ({
    brand: initialSettings?.footer_brand || 'AAYAN.SEC',
    text: initialSettings?.footer_text || 'SECURITY RESEARCH DOSSIER // 2025',
    subtext: initialSettings?.footer_subtext || 'BUILT WITH PRECISION',
  }));

  useEffect(() => {
    if (initialSettings) {
      setFooterInfo({
        brand: initialSettings.footer_brand || 'AAYAN.SEC',
        text: initialSettings.footer_text || 'SECURITY RESEARCH DOSSIER // 2025',
        subtext: initialSettings.footer_subtext || 'BUILT WITH PRECISION',
      });
      return;
    }

    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          setFooterInfo({
            brand: data.settings.footer_brand || 'AAYAN.SEC',
            text: data.settings.footer_text || 'SECURITY RESEARCH DOSSIER // 2025',
            subtext: data.settings.footer_subtext || 'BUILT WITH PRECISION',
          });
        }
      })
      .catch((err) => console.error('Error fetching footer settings:', err));
  }, [initialSettings]);

  useEffect(() => {
    const handleScroll = () => {
      // Bottom of page detection for collaborate
      if (
        typeof window !== 'undefined' &&
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 80
      ) {
        setActiveSection('collaborate');
        return;
      }

      const sections = ['overview', 'background', 'research', 'tools', 'skills', 'collaborate'];
      const scrollPosition = window.scrollY + 250;

      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const currentSettings = settingsOverride || initialSettings;
  const currentFooterBrand = currentSettings?.footer_brand || footerInfo.brand;
  const currentFooterText = currentSettings?.footer_text || footerInfo.text;
  const currentFooterSubtext = currentSettings?.footer_subtext || footerInfo.subtext;


  return (
    <div className="min-h-screen bg-[#ECE8DF] text-[#171514] flex flex-col lg:flex-row relative">
      {/* Main Content Stream (Sections 01 - 06) */}
      <main className={`flex-1 w-full min-h-screen relative overflow-x-clip transition-all duration-200 ${showNavigation
          ? 'lg:max-w-[calc(100%-285px)] xl:max-w-[calc(100%-300px)]'
          : 'max-w-none'
        }`}>
        {/* 01 — OVERVIEW (Hero Masterpiece) */}
        <div id="overview" className="w-full">
          <HeroMasterpiece
            initialHero={initialHero}
            projectsCount={projectsCount}
            writeupsCount={writeupsCount}
            onViewResearch={() => scrollToSection('research')}
            onCollaborate={() => scrollToSection('collaborate')}
            isEditingMode={isEditingMode}
            heroOverride={heroOverride}
            onHeroChange={onHeroChange}
            onOpenHeroDrawer={onOpenHeroDrawer}
          />
        </div>

        {/* 02 — BACKGROUND */}
        <div id="background" className="w-full">
          <BackgroundSection
            initialAbout={initialAbout}
            initialDomains={initialDomains}
            isEditingMode={isEditingMode}
            aboutOverride={aboutOverride}
            domainsOverride={domainsOverride}
            onAboutChange={onAboutChange}
            onDomainChange={onDomainChange}
            onAddDomain={onAddDomain}
            onDeleteDomain={onDeleteDomain}
            onMoveDomain={onMoveDomain}
          />
        </div>

        {/* 03 — RESEARCH */}
        <div id="research" className="w-full">
          <ResearchSection initialPosts={initialResearch} />
        </div>

        {/* 04 — TOOLS */}
        <div id="tools" className="w-full">
          <ToolsSection initialTools={initialTools} />
        </div>

        {/* 05 — SKILLS */}
        <div id="skills" className="w-full">
          <SkillsSection initialSkills={initialSkills} />
        </div>

        {/* 06 — COLLABORATE */}
        <div id="collaborate" className="w-full">
          <CollaborateSection
            initialSettings={initialSettings}
            isEditingMode={isEditingMode}
            settingsOverride={settingsOverride}
            onSettingsChange={onSettingsChange}
          />
        </div>

        {/* Footer info strip */}
        <footer className="w-full bg-[#171514] text-[#ECE8DF] font-mono text-xs px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t-2 border-[#171514]">
          <div className="flex flex-col gap-0.5 min-w-0">
            <InlineEditable
              value={currentFooterBrand}
              isEditingMode={isEditingMode}
              label="Footer Brand"
              onChange={(v) => onSettingsChange?.('footer_brand', v)}
              className="font-bold text-[#DF491E] tracking-wider text-xs"
            />
            <InlineEditable
              value={currentFooterText}
              isEditingMode={isEditingMode}
              label="Footer Text"
              onChange={(v) => onSettingsChange?.('footer_text', v)}
              className="text-[#BCB8B1] text-[11px] tracking-tight"
            />
          </div>

          <div className="flex items-center text-[#BCB8B1] text-[11px] tracking-widest sm:text-right flex-shrink-0">
            <InlineEditable
              value={currentFooterSubtext}
              isEditingMode={isEditingMode}
              label="Footer Subtext"
              onChange={(v) => onSettingsChange?.('footer_subtext', v)}
            />
          </div>
        </footer>
      </main>

      {/* Right-Side Numbered Navigation Rail (Fixed / Sticky on Desktop) */}
      {showNavigation && (
        <div className="hidden lg:block lg:sticky lg:top-0 lg:h-screen lg:w-[285px] xl:w-[300px] flex-shrink-0 z-30">
          <NavigationRail
            activeSection={activeSection}
            onSelectSection={scrollToSection}
            settings={currentSettings}
          />
        </div>
      )}

      {/* Mobile Drawer Navigation Rail */}
      {showNavigation && (
        <div className="lg:hidden">
          <NavigationRail
            activeSection={activeSection}
            onSelectSection={scrollToSection}
            settings={currentSettings}
          />
        </div>
      )}

      {/* Subtle Desktop Full-Screen Experience Notification */}
      <FullscreenTip />
    </div>
  );
}
