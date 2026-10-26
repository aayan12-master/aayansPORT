import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAdminSession } from '@/lib/auth';
import { getResearchPosts, createResearchPost, updateResearchPost, deleteResearchPost } from '@/lib/cms';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const research = await getResearchPosts({ publishedOnly: false });
    return NextResponse.json({ success: true, research });
  } catch (error) {
    console.error('Error fetching admin research:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch research' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, slug, summary, content, category, severity, cve_id, published_date, tags, external_url, image_url, status } = body;

    if (!title || !slug || !summary || !content) {
      return NextResponse.json({ success: false, error: 'Title, slug, summary, and content are required' }, { status: 400 });
    }

    const created = await createResearchPost({
      title: title.trim(),
      slug: slug.trim().toLowerCase(),
      summary: summary.trim(),
      content: content.trim(),
      category: category || 'Web Security',
      severity: severity || 'Medium',
      cve_id: (cve_id || '').trim() || undefined,
      published_date: published_date || new Date().toISOString().split('T')[0],
      tags: (tags || '').trim(),
      external_url: (external_url || '').trim() || undefined,
      image_url: (image_url || '').trim() || undefined,
      status: status === 'draft' ? 'draft' : 'published',
      display_order: 0,
    });

    try {
      revalidatePath('/api/research');
      revalidatePath('/');
    } catch {}

    return NextResponse.json({ success: true, message: 'Research post created', post: created });
  } catch (error) {
    console.error('Error creating research post:', error);
    return NextResponse.json({ success: false, error: 'Failed to create research post' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, title, slug, summary, content, category, severity, cve_id, published_date, tags, external_url, image_url, status } = body;

    if (!id || !title || !slug) {
      return NextResponse.json({ success: false, error: 'ID, title, and slug are required' }, { status: 400 });
    }

    await updateResearchPost(id, {
      title: title.trim(),
      slug: slug.trim().toLowerCase(),
      summary: summary.trim(),
      content: (content || '').trim(),
      category: category || 'Web Security',
      severity: severity || 'Medium',
      cve_id: (cve_id || '').trim() || undefined,
      published_date: published_date || new Date().toISOString().split('T')[0],
      tags: (tags || '').trim(),
      external_url: (external_url || '').trim() || undefined,
      image_url: (image_url || '').trim() || undefined,
      status: status === 'draft' ? 'draft' : 'published',
    });

    try {
      revalidatePath('/api/research');
      revalidatePath('/');
    } catch {}

    return NextResponse.json({ success: true, message: 'Research post updated' });
  } catch (error: any) {
    console.error('Error updating research post:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to update research post' }, { status: 500 });
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
      return NextResponse.json({ success: false, error: 'Research ID required' }, { status: 400 });
    }

    await deleteResearchPost(id);

    try {
      revalidatePath('/api/research');
      revalidatePath('/');
    } catch {}

    return NextResponse.json({ success: true, message: 'Research post deleted' });
  } catch (error) {
    console.error('Error deleting research post:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete research post' }, { status: 500 });
  }
}
