import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { getSiteSettings, updateSiteSettings } from '@/lib/cms';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const settings = await getSiteSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch site settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    await updateSiteSettings(body);
    const updated = await getSiteSettings();
    return NextResponse.json({ success: true, message: 'Site settings updated', settings: updated });
  } catch (error) {
    console.error('Error updating site settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to update site settings' }, { status: 500 });
  }
}
