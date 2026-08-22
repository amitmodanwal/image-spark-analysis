import { createClient } from "@supabase/supabase-js";

const url = (import.meta.env['VITE_SUPABASE_URL'] as string | undefined)?.trim() || "";
const key = (
  (import.meta.env['VITE_SUPABASE_ANON_KEY'] as string | undefined) ||
  (import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] as string | undefined)
)?.trim() || "";

export const supabaseConfigured = Boolean(url && key);

export const supabase = createClient(url || "https://placeholder.supabase.co", key || "public-anon-key", {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

export interface AnalysisRecord {
  id: string;
  user_id: string;
  created_at: string;
  title: string | null;
  image_urls: string[];
  analysis: unknown;
  confidence: number | null;
}
