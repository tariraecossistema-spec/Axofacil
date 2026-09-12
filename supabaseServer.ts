import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-Side Supabase Client (for Node.js Express API endpoints / Webhooks)
 * Uses SUPABASE_SERVICE_ROLE_KEY (if available) for privileged operations,
 * or falls back to VITE_SUPABASE_ANON_KEY.
 */

let serverClientInstance: SupabaseClient | null = null;

export function getSupabaseServerClient(): SupabaseClient | null {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

  const apiKey = serviceRoleKey || anonKey;

  if (!supabaseUrl || !apiKey || supabaseUrl === 'https://your-supabase-project.supabase.co') {
    return null;
  }

  if (!serverClientInstance) {
    serverClientInstance = createClient(supabaseUrl, apiKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  return serverClientInstance;
}

export const isSupabaseServerConfigured = Boolean(
  (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL) &&
  (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)
);

/**
 * Server-side Admin Helpers
 */
export async function serverFetchAllEstablishments() {
  const client = getSupabaseServerClient();
  if (!client) return [];
  const { data, error } = await client
    .from('establishments')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function serverCreateOrder(orderData: Record<string, any>) {
  const client = getSupabaseServerClient();
  if (!client) return null;
  const { data, error } = await client
    .from('orders')
    .insert([orderData])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function serverRecordMedia(mediaData: {
  user_id?: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
  public_url: string;
  cloudinary_url?: string;
  cloudinary_public_id?: string;
  supabase_url?: string;
  folder?: string;
}) {
  const client = getSupabaseServerClient();
  if (!client) return null;
  const { data, error } = await client
    .from('media')
    .insert([mediaData])
    .select()
    .single();
  if (error) {
    console.error('Error inserting media in Supabase:', error);
  }
  return data;
}
