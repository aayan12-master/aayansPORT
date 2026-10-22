import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { getProjects, createProject, updateProject, deleteProject } from '@/lib/cms';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const projects = await getProjects({ publishedOnly: false });
    return NextResponse.json({ success: true, projects });
  } catch (error) {
    console.error('Error fetching admin projects:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, slug, summary, description, tech_stack, category, repo_url, demo_url, image_url, status, featured } = body;

    if (!title || !slug || !summary) {
      return NextResponse.json({ success: false, error: 'Title, slug, and summary are required' }, { status: 400 });
    }

    const created = await createProject({
      title: title.trim(),
      slug: slug.trim().toLowerCase(),
      summary: summary.trim(),
      description: (description || '').trim(),
      tech_stack: (tech_stack || '').trim(),
      category: category || 'Security Tool',
      repo_url: (repo_url || '').trim() || undefined,
      demo_url: (demo_url || '').trim() || undefined,
      image_url: (image_url || '').trim() || undefined,
      status: status === 'draft' ? 'draft' : 'published',
      featured: Boolean(featured),
      display_order: 0,
    });

    return NextResponse.json({ success: true, message: 'Project created', project: created });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ success: false, error: 'Failed to create project' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, title, slug, summary, description, tech_stack, category, repo_url, demo_url, image_url, status, featured } = body;

    if (!id || !title || !slug) {
      return NextResponse.json({ success: false, error: 'ID, title, and slug are required' }, { status: 400 });
    }

    await updateProject(id, {
      title: title.trim(),
      slug: slug.trim().toLowerCase(),
      summary: summary.trim(),
      description: (description || '').trim(),
      tech_stack: (tech_stack || '').trim(),
      category: category || 'Security Tool',
      repo_url: (repo_url || '').trim() || undefined,
      demo_url: (demo_url || '').trim() || undefined,
      image_url: (image_url || '').trim() || undefined,
      status: status === 'draft' ? 'draft' : 'published',
      featured: Boolean(featured),
    });

    return NextResponse.json({ success: true, message: 'Project updated' });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ success: false, error: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Project ID required' }, { status: 400 });
    }

    await deleteProject(id);
    return NextResponse.json({ success: true, message: 'Project deleted' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete project' }, { status: 500 });
  }
}
