import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { HttpError } from './http.ts';

export interface RateLimit {
  windowMs: number;
  max: number;
}

/**
 * Per-user rolling-window rate limit. Counts the caller's rows in
 * api_call_log for this function over the last `windowMs`, denies with
 * 429 when above `max`, otherwise records the call.
 *
 * Fails OPEN: if the environment isn't configured or the count query
 * errors, the call is allowed. That trades hard correctness for
 * availability — we don't want a transient infra glitch to lock all
 * users out of scanning.
 */
export async function enforceRateLimit(
  userId: string,
  functionName: string,
  limit: RateLimit,
): Promise<void> {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) return;

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

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

  await supabase.from('api_call_log').insert({
    user_id: userId,
    function_name: functionName,
  });
}
