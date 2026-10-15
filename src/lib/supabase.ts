import { createClient, SupabaseClient } from "@supabase/supabase-js";

function getNormalizedSupabaseUrl(): string | undefined {
  let url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return undefined;
  url = url.trim();
  // Supabase project URLs use .co, not .com
  if (url.endsWith(".supabase.com")) {
    url = url.replace(/\.supabase\.com$/, ".supabase.co");
  }
  return url;
}

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || "pyq-papers";

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const url = getNormalizedSupabaseUrl();
  if (!url || !supabaseKey) {
    return null;
  }
  if (!supabaseClient) {
    supabaseClient = createClient(url, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabaseClient;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getNormalizedSupabaseUrl() && supabaseKey);
}
