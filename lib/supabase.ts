import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Returns a server-side Supabase client using the service role key.
 * This must ONLY be imported from server code (Server Actions / route
 * handlers) — the service role key bypasses Row Level Security and must
 * never reach the browser.
 *
 * Returns null when the env vars are missing so the app can show a friendly
 * "not configured yet" message instead of crashing during local prototyping.
 */
export function getServiceClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Exact number of rows in the waitlist table. Uses a head + count query so no
 * row data is transferred. Returns null when Supabase isn't configured or the
 * query fails, so callers can hide the count rather than show a fake number.
 */
export async function getWaitlistCount(): Promise<number | null> {
  const supabase = getServiceClient();
  if (!supabase) return null;

  const { count, error } = await supabase
    .from("waitlist")
    .select("*", { count: "exact", head: true });

  if (error) return null;
  return count ?? 0;
}
