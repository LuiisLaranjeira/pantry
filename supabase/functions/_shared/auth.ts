import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { HttpError } from './http.ts';

export interface AuthedUser {
  id: string;
  email: string | null;
}

/**
 * Verifies the request's Authorization bearer token against Supabase Auth
 * (signature + expiry, not just decode). Throws HttpError on failure.
 */
export async function requireUser(req: Request): Promise<AuthedUser> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new HttpError(401, 'Missing Authorization header');
  }
  const jwt = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!jwt) {
    throw new HttpError(401, 'Empty bearer token');
  }

  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) {
    throw new HttpError(500, 'Auth misconfigured: missing SUPABASE_URL or service role key');
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.auth.getUser(jwt);
  if (error || !data?.user) {
    throw new HttpError(401, 'Invalid or expired token');
  }
  return { id: data.user.id, email: data.user.email ?? null };
}
