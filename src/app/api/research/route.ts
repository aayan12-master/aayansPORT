import { NextResponse } from 'next/server';
import { getResearchPosts } from '@/lib/cms';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const research = await getResearchPosts({ publishedOnly: true });
    return NextResponse.json(
      { success: true, research },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    console.error('Error fetching public research:', error?.message || error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch research from Supabase' },
      { status: 500 }
    );
  }
}
