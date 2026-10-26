import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAdminSession } from '@/lib/auth';
import { getHeroContent, updateHeroContent } from '@/lib/cms';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const hero = await getHeroContent();
    return NextResponse.json({ success: true, hero });
  } catch (error) {
    console.error('Error fetching hero content:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch hero content' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    await updateHeroContent(body);
    const updated = await getHeroContent();

    try {
      revalidatePath('/');
      revalidatePath('/api/settings');
    } catch {}

    return NextResponse.json({ success: true, message: 'Hero content updated', hero: updated });
  } catch (error) {
    console.error('Error updating hero content:', error);
    return NextResponse.json({ success: false, error: 'Failed to update hero content' }, { status: 500 });
  }
}
