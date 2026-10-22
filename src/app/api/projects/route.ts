import { NextResponse } from 'next/server';
import { getProjects } from '@/lib/cms';

export async function GET() {
  try {
    const projects = await getProjects({ publishedOnly: true });
    return NextResponse.json({ success: true, projects });
  } catch (error) {
    console.error('Error fetching public projects:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch projects' }, { status: 500 });
  }
}
