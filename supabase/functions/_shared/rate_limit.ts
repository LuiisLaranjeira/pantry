import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { HttpError } from './http.ts';

export interface RateLimit {
  windowMs: number;
  max: number;
}

function adminClient() {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Read-only check. Throws HttpError(429) if the caller is already at or
 * above the cap. Does NOT record the call — callers invoke
 * recordRateLimitedCall() after the work succeeds so a transient failure
 * doesn't burn an attempt.
 *
 * Fails OPEN on infra glitches (missing env, query error) so a Supabase
 * outage doesn't lock every user out of scanning.
 */
export async function checkRateLimit(
  userId: string,
  functionName: string,
  limit: RateLimit,
): Promise<void> {
  const supabase = adminClient();
  if (!supabase) return;

  const since = new Date(Date.now() - limit.windowMs).toISOString();
  const { count, error } = await supabase
    .from('api_call_log')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('function_name', functionName)
    .gte('called_at', since);

  if (error) return;

  if ((count ?? 0) >= limit.max) {
    throw new HttpError(429, 'Too many requests. Please try again in a moment.');
  }
}

/**
 * Records that the caller consumed one slot of the rate limit. Best
 * effort: failures here are swallowed because the alternative (telling
 * the user the request succeeded but ALSO that we couldn't count it) is
 * worse than over-budget drift.
 */
export async function recordRateLimitedCall(userId: string, functionName: string): Promise<void> {
  const supabase = adminClient();
  if (!supabase) return;
  try {
    await supabase.from('api_call_log').insert({
      user_id: userId,
      function_name: functionName,
    });
  } catch {
    // ignore — see comment above
  }
}
