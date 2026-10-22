import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAdminSession } from '@/lib/auth';
import { getProjectById, updateProject } from '@/lib/cms';
import { fetchGitHubRepoForImport } from '@/lib/github';

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
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Tool ID is required for README refresh.' },
        { status: 400 }
      );
    }

    // 2. Fetch current tool record from Supabase
    const tool = await getProjectById(id);
    if (!tool) {
      return NextResponse.json(
        { success: false, error: 'Tool not found in Supabase database.' },
        { status: 404 }
      );
    }

    if (!tool.repo_url) {
      return NextResponse.json(
        { success: false, error: 'Tool does not have an associated GitHub repository URL.' },
        { status: 400 }
      );
    }

    // 3. Re-fetch README and repository info from GitHub server-side
    // If GitHub is unavailable, preserve the previous saved preview and report the error
    let freshData;
    try {
      freshData = await fetchGitHubRepoForImport(tool.repo_url);
    } catch (err: any) {
      console.warn(`[API /api/admin/tools/refresh] GitHub fetch failed for ${tool.repo_url}:`, err.message);
      return NextResponse.json(
        {
          success: false,
          error: `GitHub sync failed: ${err.message}. Previous saved preview and tool state were preserved.`,
          preserved_preview: tool.readme_preview || tool.description,
        },
        { status: 502 }
      );
    }

    // 4. Update snapshot fields in Supabase while preserving admin-authored title, summary, category
    const updates: Record<string, any> = {
      readme_preview: freshData.readme_preview,
      readme_status: freshData.readme_status,
      default_branch: freshData.default_branch || tool.default_branch || 'main',
      readme_synced_at: new Date().toISOString(),
      // Update description fallback to match preview
      description: freshData.readme_preview,
    };

    // If tech_stack is empty, populate from fresh language
    if (!tool.tech_stack && freshData.tech_stack) {
      updates.tech_stack = freshData.tech_stack;
    }

    await updateProject(id, updates);

    const refreshedTool = await getProjectById(id);

    try {
      revalidatePath('/api/tools');
      revalidatePath('/');
    } catch {}

    return NextResponse.json({
      success: true,
      message: `Successfully refreshed README snapshot from GitHub (${freshData.readme_status === 'available' ? 'README updated' : 'No README in repo'}).`,
      tool: refreshedTool,
    });
  } catch (error: any) {
    console.error('[API /api/admin/tools/refresh] Refresh error:', error?.message || error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to refresh README snapshot.' },
      { status: 500 }
    );
  }
}
