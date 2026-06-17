import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function isValidSupabaseUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export const supabase =
  supabaseUrl && supabaseAnonKey && isValidSupabaseUrl(supabaseUrl)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (key && isValidSupabaseUrl(url)) return createClient(url, key);
  if (supabase) return supabase;
  return null;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(supabase);
}
