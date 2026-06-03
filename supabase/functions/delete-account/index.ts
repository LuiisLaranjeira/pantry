import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { requireUser } from '../_shared/auth.ts';
import { corsHeaders, HttpError, jsonResponse, toErrorResponse } from '../_shared/http.ts';
import { checkRateLimit, recordRateLimitedCall } from '../_shared/rate_limit.ts';

const FUNCTION_NAME = 'delete-account';
// One delete per day per user. The flow is irreversible; nobody should
// hit this twice on purpose. The record is written only after the
// delete succeeds, so a transient failure doesn't lock the user out.
const RATE_LIMIT = { windowMs: 24 * 60 * 60 * 1000, max: 1 };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return toErrorResponse(new HttpError(405, 'Method not allowed'));
  }

  try {
    const user = await requireUser(req);
    await checkRateLimit(user.id, FUNCTION_NAME, RATE_LIMIT);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) {
      throw new HttpError(500, 'Auth misconfigured: missing SUPABASE_URL or service role key');
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. Clean up orphan households (the ones where this user is the only
    //    member). Cascades into shopping_lists, stock_items, stock_log.
    const { data: orphanCount, error: rpcErr } = await admin.rpc(
      'delete_orphan_households_for_user',
      { target_user_id: user.id },
    );
    if (rpcErr) {
      console.error('delete_orphan_households_for_user failed', rpcErr);
      throw new HttpError(500, 'Could not clean up households');
    }

    // 2. Delete the auth user. Cascades through household_users (FK with
    //    ON DELETE CASCADE) so remaining shared-household memberships are
    //    removed automatically.
    const { error: deleteErr } = await admin.auth.admin.deleteUser(user.id);
    if (deleteErr) {
      console.error('admin.deleteUser failed', deleteErr);
      throw new HttpError(500, 'Could not delete user account');
    }

    await recordRateLimitedCall(user.id, FUNCTION_NAME);
    return jsonResponse({
      success: true,
      orphan_households_deleted: typeof orphanCount === 'number' ? orphanCount : 0,
    });
  } catch (err) {
    return toErrorResponse(err);
  }
});
