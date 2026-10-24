'use client';

import React, { useState, useEffect } from 'react';
import NavigationRail from '@/components/NavigationRail';
import HeroMasterpiece from '@/components/HeroMasterpiece';
import BackgroundSection from '@/components/BackgroundSection';
import ResearchSection from '@/components/ResearchSection';
import ToolsSection from '@/components/ToolsSection';
import SkillsSection from '@/components/SkillsSection';
import CollaborateSection from '@/components/CollaborateSection';
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

  return (
    <div className="min-h-screen bg-[#ECE8DF] text-[#171514] flex flex-col lg:flex-row relative">
      {/* Main Content Stream (Sections 01 - 06) */}
      <main className="flex-1 w-full lg:max-w-[calc(100%-285px)] xl:max-w-[calc(100%-300px)] min-h-screen relative">
        {/* 01 — OVERVIEW (Hero Masterpiece matching entire_portfolio_visual) */}
        <div id="overview" className="w-full">
          <HeroMasterpiece
            initialHero={initialHero}
            projectsCount={projectsCount}
            writeupsCount={writeupsCount}
            onViewResearch={() => scrollToSection('research')}
            onCollaborate={() => scrollToSection('collaborate')}
          />
        </div>

        {/* 02 — BACKGROUND */}
        <div id="background" className="w-full">
          <BackgroundSection
            initialAbout={initialAbout}
            initialDomains={initialDomains}
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
          <CollaborateSection initialSettings={initialSettings} />
        </div>

        {/* Footer info strip */}
        <footer className="w-full bg-[#171514] text-[#ECE8DF] font-mono text-xs p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t-2 border-[#171514]">
          <div className="flex items-center gap-3">
            <span className="font-bold text-[#DF491E]">{footerInfo.brand}</span>
            <span className="text-[#BCB8B1]">|</span>
            <span className="text-[#BCB8B1]">{footerInfo.text}</span>
          </div>
          <div className="flex items-center text-[#BCB8B1]">
            <span>{footerInfo.subtext}</span>
          </div>
        </footer>
      </main>

      {/* Right-Side Numbered Navigation Rail (Fixed / Sticky on Desktop) */}
      <div className="hidden lg:block lg:sticky lg:top-0 lg:h-screen lg:w-[285px] xl:w-[300px] flex-shrink-0 z-30">
        <NavigationRail
          activeSection={activeSection}
          onSelectSection={scrollToSection}
          settings={initialSettings}
        />
      </div>

      {/* Mobile Drawer Navigation Rail */}
      <div className="lg:hidden">
        <NavigationRail
          activeSection={activeSection}
          onSelectSection={scrollToSection}
          settings={initialSettings}
        />
      </div>
    </div>
  );
}
