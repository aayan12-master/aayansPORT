import { NextResponse } from 'next/server';
import { getProjects } from '@/lib/cms';

export async function GET() {
  try {
    const projects = await getProjects({ publishedOnly: true });
    return NextResponse.json({ success: true, projects });
  } catch (error: any) {
    console.error('Error fetching public projects:', error?.message || error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch projects from Supabase' },
      { status: 500 }
    );
  }
}

