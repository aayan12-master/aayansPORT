import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { fetchGitHubRepoForImport } from '@/lib/github';
import { findProjectByRepoUrl } from '@/lib/cms';

export async function POST(req: NextRequest) {
  // 1. Authenticate admin user
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized. Admin credentials required.' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const rawUrl = (body.url || '').trim();

    if (!rawUrl) {
      return NextResponse.json(
        { success: false, error: 'GitHub repository URL is required.' },
        { status: 400 }
      );
    }

    // 2. Fetch repository metadata and snapshot README server-side
    const importData = await fetchGitHubRepoForImport(rawUrl);

    // 3. Duplicate check against existing Arsenal tools in Supabase
    const existing = await findProjectByRepoUrl(importData.repo_url);

    const payload = {
      ...importData,
      is_duplicate: Boolean(existing),
      duplicate_id: existing?.id || null,
      duplicate_title: existing?.title || null,
    };

    return NextResponse.json({
      success: true,
      data: payload,
    });
  } catch (error: any) {
    console.error('[API /api/admin/tools/import-github] Ingestion error:', error?.message || error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to ingest repository from GitHub.' },
      { status: 500 }
    );
  }
}
