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
