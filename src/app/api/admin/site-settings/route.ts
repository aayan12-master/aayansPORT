import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
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

    // Server-side validation
    if (body.contact_email && typeof body.contact_email === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.contact_email.trim())) {
        return NextResponse.json(
          { success: false, error: 'Invalid contact email format.' },
          { status: 400 }
        );
      }
    }

    const validateHttpsUrl = (url: unknown, fieldName: string) => {
      if (!url || typeof url !== 'string' || !url.trim()) return null;
      const trimmed = url.trim();
      const isHttps = trimmed.startsWith('https://');
      const isLocal = trimmed.startsWith('http://localhost') || trimmed.startsWith('http://127.0.0.1');
      if (!isHttps && !isLocal) {
        return `${fieldName} must be a valid https:// URL.`;
      }
      return null;
    };

    const ogErr = validateHttpsUrl(body.og_image, 'Open Graph Image');
    if (ogErr) {
      return NextResponse.json({ success: false, error: ogErr }, { status: 400 });
    }

    const canonicalErr = validateHttpsUrl(body.canonical_url, 'Canonical URL');
    if (canonicalErr) {
      return NextResponse.json({ success: false, error: canonicalErr }, { status: 400 });
    }

    if (Array.isArray(body.social_links)) {
      for (const item of body.social_links) {
        if (item && item.enabled && item.url) {
          const err = validateHttpsUrl(item.url, item.label || 'Social account');
          if (err) {
            return NextResponse.json({ success: false, error: err }, { status: 400 });
          }
        }
      }
    }

    await updateSiteSettings(body);
    const updated = await getSiteSettings();

    try {
      revalidatePath('/');
      revalidatePath('/api/settings');
    } catch {}

    return NextResponse.json({ success: true, message: 'Site settings updated', settings: updated });
  } catch (error) {
    console.error('Error updating site settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to update site settings' }, { status: 500 });
  }
}

