import type { Metadata } from 'next';
import {
  getSiteSettings,
  getHeroContent,
  getAboutContent,
  getSkills,
  getProjects,
  getResearchPosts,
} from '@/lib/cms';
import { normalizeToolFromProject } from '@/lib/github';
import PortfolioClient from '@/components/PortfolioClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const title = settings?.site_title || 'AAYAN.SEC — Security Researcher & Pentester Portfolio';
  const description =
    settings?.site_description ||
    'Security research dossier of Aayan — Offensive Security Researcher & Penetration Tester. Protocol analysis, cloud architecture vulnerabilities, and exploit tooling.';
  const ogTitle = settings?.og_title || title;
  const ogDescription = settings?.og_description || description;
  const ogImage = settings?.og_image;

  return {
    title,
    description,
    alternates: settings?.canonical_url ? { canonical: settings.canonical_url } : undefined,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      images: ogImage ? [{ url: ogImage }] : undefined,
      type: 'website',
    },
  };
}


export default async function HomePage() {
  const [settingsRes, heroRes, aboutRes, skillsRes, projectsRes, researchRes] =
    await Promise.allSettled([
      getSiteSettings(),
      getHeroContent(),
      getAboutContent(),
      getSkills({ publishedOnly: true }),
      getProjects({ publishedOnly: true }),
      getResearchPosts({ publishedOnly: true }),
    ]);

  const settings = settingsRes.status === 'fulfilled' ? settingsRes.value : null;
  const hero = heroRes.status === 'fulfilled' ? heroRes.value : null;
  const aboutData = aboutRes.status === 'fulfilled' ? aboutRes.value : null;
  const skills = skillsRes.status === 'fulfilled' ? skillsRes.value : null;
  const projects = projectsRes.status === 'fulfilled' ? projectsRes.value : null;
  const research = researchRes.status === 'fulfilled' ? researchRes.value : null;

  const initialTools = projects ? projects.map(normalizeToolFromProject) : null;
  const projectsCount = projects ? projects.length : 0;
  const writeupsCount = research ? research.length : 0;

  return (
    <PortfolioClient
      initialSettings={settings}
      initialHero={hero}
      initialAbout={aboutData?.about || null}
      initialDomains={aboutData?.domains || null}
      initialSkills={skills}
      initialTools={initialTools}
      initialResearch={research}
      projectsCount={projectsCount}
      writeupsCount={writeupsCount}
    />
  );
}
