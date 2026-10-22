import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export function getSupabaseAdminConfigStatus(): { configured: boolean; missingVars: string[] } {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  const missing: string[] = [];
  if (!supabaseUrl || supabaseUrl.includes('placeholder') || supabaseUrl.includes('example.supabase.co')) {
    missing.push('NEXT_PUBLIC_SUPABASE_URL');
  }
  if (!serviceRoleKey || serviceRoleKey.includes('placeholder')) {
    missing.push('SUPABASE_SERVICE_ROLE_KEY');
  }
  return {
    configured: missing.length === 0,
    missingVars: missing,
  };
}

export const isSupabaseAdminConfigured = Boolean(
  (process.env.NEXT_PUBLIC_SUPABASE_URL || '') &&
  (process.env.SUPABASE_SERVICE_ROLE_KEY || '') &&
  !(process.env.NEXT_PUBLIC_SUPABASE_URL || '').includes('placeholder') &&
  !(process.env.SUPABASE_SERVICE_ROLE_KEY || '').includes('placeholder')
);

export function checkIsSupabaseAdminConfigured(): boolean {
  return getSupabaseAdminConfigStatus().configured;
}

let adminClient: SupabaseClient | null = null;

export function getSupabaseAdminClient(): SupabaseClient | null {
  const status = getSupabaseAdminConfigStatus();
  if (!status.configured) {
    return null;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!adminClient) {
    adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return adminClient;
}

export function getRequiredSupabaseAdminClient(): SupabaseClient {
  const status = getSupabaseAdminConfigStatus();
  if (!status.configured) {
    const errorMsg = `Supabase Admin is not configured on the server. Missing required environment variable(s): ${status.missingVars.join(', ')}.`;
    console.error(`[Supabase Admin Config] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  const client = getSupabaseAdminClient();
  if (!client) {
    throw new Error('Failed to initialize Supabase admin client.');
  }
  return client;
}

