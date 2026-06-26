export type DataBackend = "supabase" | "neon" | "local";

export function getDataBackend(): DataBackend {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (supabaseUrl && supabaseKey) return "supabase";

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (databaseUrl) return "neon";

  return "local";
}

export function isRemoteDbConfigured(): boolean {
  return getDataBackend() !== "local";
}

export function getStorageLabel(): string {
  return getDataBackend();
}
