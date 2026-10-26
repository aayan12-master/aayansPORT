import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAdminSession } from '@/lib/auth';
import {
  getAboutContent,
  updateAboutContent,
  updateResearchDomain,
  createResearchDomain,
  deleteResearchDomain,
  updateMethodologyStep,
  createMethodologyStep,
  deleteMethodologyStep,
} from '@/lib/cms';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await getAboutContent();
    return NextResponse.json({ success: true, ...data });
  } catch (error: any) {
    console.error('Error fetching about content:', error?.message || error);
    return NextResponse.json({ success: false, error: 'Failed to fetch about content' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { type, domain, step } = body;

    if (type === 'domain' || domain) {
      const item = domain || body;
      const created = await createResearchDomain({
        domain_num: item.domain_num || '01',
        domain_code: item.domain_code || 'FOCUS AREA',
        title: item.title || 'New Highlight',
        description: item.description || '',
        display_order: typeof item.display_order === 'number' ? item.display_order : 0,
      });
      const updated = await getAboutContent();
      try {
        revalidatePath('/api/settings');
        revalidatePath('/');
      } catch {}
      return NextResponse.json({ success: true, message: 'Profile highlight created', domain: created, ...updated });
    }

    if (type === 'step' || step) {
      const item = step || body;
      const created = await createMethodologyStep({
        step_num: item.step_num || '01',
        title: item.title || 'New Step',
        description: item.description || '',
        display_order: typeof item.display_order === 'number' ? item.display_order : 0,
      });
      const updated = await getAboutContent();
      try {
        revalidatePath('/api/settings');
        revalidatePath('/');
      } catch {}
      return NextResponse.json({ success: true, message: 'Methodology step created', step: created, ...updated });
    }

    return NextResponse.json({ success: false, error: 'Invalid item type. Specify type="domain" or type="step".' }, { status: 400 });
  } catch (error: any) {
    console.error('Error creating about item:', error?.message || error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to create item' }, { status: 500 });
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
        if (d.id && String(d.id).indexOf('new-') !== 0) {
          await updateResearchDomain(d.id, {
            domain_num: d.domain_num,
            domain_code: d.domain_code,
            title: d.title,
            description: d.description,
            display_order: d.display_order,
          });
        } else if (!d.id || String(d.id).indexOf('new-') === 0) {
          await createResearchDomain({
            domain_num: d.domain_num || '01',
            domain_code: d.domain_code || 'FOCUS',
            title: d.title || 'New Highlight',
            description: d.description || '',
            display_order: d.display_order ?? 0,
          });
        }
      }
    }

    if (Array.isArray(methodology)) {
      for (const m of methodology) {
        if (m.id && String(m.id).indexOf('new-') !== 0) {
          await updateMethodologyStep(m.id, {
            step_num: m.step_num,
            title: m.title,
            description: m.description,
            display_order: m.display_order,
          });
        } else if (!m.id || String(m.id).indexOf('new-') === 0) {
          await createMethodologyStep({
            step_num: m.step_num || '01',
            title: m.title || 'New Step',
            description: m.description || '',
            display_order: m.display_order ?? 0,
          });
        }
      }
    }

    const updated = await getAboutContent();
    try {
      revalidatePath('/api/settings');
      revalidatePath('/');
    } catch {}
    return NextResponse.json({ success: true, message: 'Background content updated', ...updated });
  } catch (error: any) {
    console.error('Error updating about content:', error?.message || error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to update about content' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Item ID is required' }, { status: 400 });
    }

    if (type === 'domain') {
      await deleteResearchDomain(id);
      const updated = await getAboutContent();
      try {
        revalidatePath('/api/settings');
        revalidatePath('/');
      } catch {}
      return NextResponse.json({ success: true, message: 'Profile highlight deleted', ...updated });
    }

    if (type === 'step') {
      await deleteMethodologyStep(id);
      const updated = await getAboutContent();
      try {
        revalidatePath('/api/settings');
        revalidatePath('/');
      } catch {}
      return NextResponse.json({ success: true, message: 'Methodology step deleted', ...updated });
    }

    return NextResponse.json({ success: false, error: 'Invalid item type. Must be domain or step.' }, { status: 400 });
  } catch (error: any) {
    console.error('Error deleting about item:', error?.message || error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to delete item' }, { status: 500 });
  }
}
