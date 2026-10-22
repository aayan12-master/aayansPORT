import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const isSupabaseAdminConfigured = Boolean(
  supabaseUrl &&
  serviceRoleKey &&
  !supabaseUrl.includes('placeholder') &&
  !serviceRoleKey.includes('placeholder')
);

export function getSupabaseAdminConfigStatus(): { configured: boolean; missingVars: string[] } {
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

let adminClient: SupabaseClient | null = null;

export function getSupabaseAdminClient(): SupabaseClient | null {
  if (!isSupabaseAdminConfigured) {
    return null;
  }

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

