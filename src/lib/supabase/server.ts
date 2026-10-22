import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';

export function getSupabaseConfigStatus(): { configured: boolean; missingVars: string[] } {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  const missing: string[] = [];
  if (!supabaseUrl || supabaseUrl.includes('placeholder') || supabaseUrl.includes('example.supabase.co')) {
    missing.push('NEXT_PUBLIC_SUPABASE_URL');
  }
  if (!supabaseAnonKey || supabaseAnonKey.includes('placeholder')) {
    missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  return {
    configured: missing.length === 0,
    missingVars: missing,
  };
}

export const isSupabaseConfigured = Boolean(
  (process.env.NEXT_PUBLIC_SUPABASE_URL || '') &&
  (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '') &&
  !(process.env.NEXT_PUBLIC_SUPABASE_URL || '').includes('placeholder') &&
  !(process.env.NEXT_PUBLIC_SUPABASE_URL || '').includes('example.supabase.co')
);

export function checkIsSupabaseConfigured(): boolean {
  return getSupabaseConfigStatus().configured;
}

export async function getRequiredSupabaseServerClient(): Promise<SupabaseClient> {
  const status = getSupabaseConfigStatus();
  if (!status.configured) {
    const errorMsg = `Supabase is not configured on the server. Missing required environment variable(s): ${status.missingVars.join(', ')}.`;
    console.error(`[Supabase Server Config] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  const client = await getSupabaseServerClient();
  if (!client) {
    throw new Error('Failed to initialize Supabase server client.');
  }
  return client;
}

export async function getSupabaseServerClient(): Promise<SupabaseClient | null> {
  if (!checkIsSupabaseConfigured()) {
    return null;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  let cookieStore: any = null;
  try {
    cookieStore = await cookies();
  } catch {
    // Executing outside of request scope (e.g. static pre-render or utility script)
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore ? cookieStore.getAll() : [];
      },
      setAll(cookiesToSet) {
        if (!cookieStore) return;
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options as CookieOptions);
          });
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  });
}


