import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { requireUser } from '../_shared/auth.ts';
import { corsHeaders, HttpError, jsonResponse, toErrorResponse } from '../_shared/http.ts';

// No rate limit here on purpose. JWT invalidation is the natural
// barrier: once admin.deleteUser succeeds the user's tokens are dead,
// so they can't authenticate to call this again. Recording a
// rate-limit slot AFTER the delete would FK-fail (api_call_log.user_id
// references auth.users with ON DELETE CASCADE); recording it BEFORE
// the delete would burn the day on a transient failure. Neither
// option earns its weight here.

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return toErrorResponse(new HttpError(405, 'Method not allowed'));
  }

  try {
    const user = await requireUser(req);

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

    return jsonResponse({
      success: true,
      orphan_households_deleted: typeof orphanCount === 'number' ? orphanCount : 0,
    });
  } catch (err) {
    return toErrorResponse(err);
  }
});
