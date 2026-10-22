import { NextResponse } from 'next/server';
import { getResearchPosts } from '@/lib/cms';

export async function GET() {
  try {
    const research = await getResearchPosts({ publishedOnly: true });
    return NextResponse.json({ success: true, research });
  } catch (error) {
    console.error('Error fetching public research:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch research' }, { status: 500 });
  }
}
