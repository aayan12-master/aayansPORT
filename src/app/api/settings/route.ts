import { NextResponse } from 'next/server';
import { getSiteSettings, getHeroContent, getAboutContent, getSkills } from '@/lib/cms';

export async function GET() {
  try {
    const [settings, hero, aboutData, skills] = await Promise.all([
      getSiteSettings(),
      getHeroContent(),
      getAboutContent(),
      getSkills({ publishedOnly: true }),
    ]);

    return NextResponse.json({
      success: true,
      settings,
      hero,
      about: aboutData.about,
      domains: aboutData.domains,
      methodology: aboutData.methodology,
      skills,
    });
  } catch (error: any) {
    console.error('Error fetching public portfolio settings:', error?.message || error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch settings from Supabase' },
      { status: 500 }
    );
  }
}

