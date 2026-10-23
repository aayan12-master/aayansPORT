import { NextResponse } from 'next/server';
import { getProjects } from '@/lib/cms';
import { normalizeToolFromProject } from '@/lib/github';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // 1. Query published tools from Supabase exclusively (zero GitHub calls on public requests)
    const projects = await getProjects({ publishedOnly: true });

    // 2. Normalize into public tool format with saved README snapshots and admin metadata
    const tools = projects.map(normalizeToolFromProject);

    return NextResponse.json(
      {
        success: true,
        tools,
        total: tools.length,
        source: 'supabase',
        last_updated: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    console.error('[API /api/tools] Failed to fetch tools from Supabase:', error?.message || error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to retrieve tooling arsenal from Supabase database.',
      },
      { status: 500 }
    );
  }
}
