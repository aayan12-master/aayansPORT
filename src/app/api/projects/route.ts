import { NextResponse } from 'next/server';
import { getProjects } from '@/lib/cms';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const projects = await getProjects({ publishedOnly: true });
    return NextResponse.json(
      { success: true, projects },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    console.error('Error fetching public projects:', error?.message || error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch projects from Supabase' },
      { status: 500 }
    );
  }
}
