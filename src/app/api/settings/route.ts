import { NextResponse } from 'next/server';
import {
  getSiteSettings,
  getHeroContent,
  getAboutContent,
  getSkills,
  getProjects,
  getResearchPosts,
} from '@/lib/cms';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const [settings, hero, aboutData, skills, projects, research] = await Promise.all([
      getSiteSettings(),
      getHeroContent(),
      getAboutContent(),
      getSkills({ publishedOnly: true }),
      getProjects({ publishedOnly: true }),
      getResearchPosts({ publishedOnly: true }),
    ]);

    const projectsCount = projects.length;
    const writeupsCount = research.length;

    return NextResponse.json(
      {
        success: true,
        settings,
        hero,
        about: aboutData.about,
        domains: aboutData.domains,
        methodology: aboutData.methodology,
        skills,
        projectsCount,
        writeupsCount,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    console.error('Error fetching public portfolio settings:', error?.message || error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch settings from Supabase' },
      { status: 500 }
    );
  }
}
