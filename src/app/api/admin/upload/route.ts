import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from '@/lib/supabase/admin';
import path from 'path';

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error: `Unsupported file type: ${file.type}. Allowed: PNG, JPEG, WEBP, GIF, SVG`,
      }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        success: false,
        error: `File size exceeds 5MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB)`,
      }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize filename and create unique timestamped name
    const ext = path.extname(file.name) || '.png';
    const baseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `${Date.now()}_${baseName}${ext}`;

    // Upload to Supabase Storage bucket: portfolio-assets
    if (isSupabaseAdminConfigured) {
      const supabaseAdmin = getSupabaseAdminClient();
      if (!supabaseAdmin) {
        console.error('[Upload] Failed to initialize Supabase admin client for upload.');
        return NextResponse.json(
          { success: false, error: 'Storage service initialization failed' },
          { status: 500 }
        );
      }

      const { data, error } = await supabaseAdmin.storage
        .from('portfolio-assets')
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (error) {
        console.error('[Upload] Supabase storage upload error:', error.message);
        return NextResponse.json(
          {
            success: false,
            error: 'Storage upload failed. Please verify storage bucket permissions in your Supabase dashboard.',
          },
          { status: 502 }
        );
      }

      if (data) {
        const { data: urlData } = supabaseAdmin.storage
          .from('portfolio-assets')
          .getPublicUrl(fileName);

        return NextResponse.json({
          success: true,
          url: urlData.publicUrl,
          fileName,
          storage: 'supabase',
        });
      }
    }

    // Fail cleanly if storage backend is unconfigured
    console.error('[Upload] Storage backend is not configured.');
    return NextResponse.json(
      { success: false, error: 'Storage service is not configured on this environment' },
      { status: 503 }
    );
  } catch (error) {
    console.error('Upload processing error:', error);
    return NextResponse.json({ success: false, error: 'Internal file upload error' }, { status: 500 });
  }
}
