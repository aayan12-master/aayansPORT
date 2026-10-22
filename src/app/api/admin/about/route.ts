import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { getAboutContent, updateAboutContent, updateResearchDomain, updateMethodologyStep } from '@/lib/cms';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await getAboutContent();
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error('Error fetching about content:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch about content' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { about, domains, methodology } = body;

    if (about) {
      await updateAboutContent(about);
    }

    if (Array.isArray(domains)) {
      for (const d of domains) {
        if (d.id) {
          await updateResearchDomain(d.id, d);
        }
      }
    }

    if (Array.isArray(methodology)) {
      for (const m of methodology) {
        if (m.id) {
          await updateMethodologyStep(m.id, m);
        }
      }
    }

    const updated = await getAboutContent();
    return NextResponse.json({ success: true, message: 'Background content updated', ...updated });
  } catch (error) {
    console.error('Error updating about content:', error);
    return NextResponse.json({ success: false, error: 'Failed to update about content' }, { status: 500 });
  }
}
