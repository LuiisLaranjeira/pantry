import { createClient, SupabaseClient } from '@supabase/supabase-js';
import ws from 'ws';

// Node < 22 has no global WebSocket, which supabase-js's realtime client needs
// at construction time. Supply the `ws` implementation so createClient() works
// on Node 20 (local dev) as well as Node 22+ (CI). The tests never use realtime,
// but the client still constructs a RealtimeClient eagerly.
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- ws is a valid
// WebSocket impl; its types don't structurally match realtime-js's narrower
// WebSocketLikeConstructor, so cast through any.
const realtime = { transport: ws as any };

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. Run \`supabase start\` and copy the printed URL/keys ` +
        `into a .env.test file, or export them in your shell. See ` +
        `supabase/tests/README.md.`,
    );
  }
  return value;
}

export const SUPABASE_URL = process.env.SUPABASE_TEST_URL ?? requireEnv('SUPABASE_URL');
export const ANON_KEY = process.env.SUPABASE_TEST_ANON_KEY ?? requireEnv('SUPABASE_ANON_KEY');
export const SERVICE_ROLE_KEY =
  process.env.SUPABASE_TEST_SERVICE_ROLE_KEY ?? requireEnv('SUPABASE_SERVICE_ROLE_KEY');

export const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime,
});

export interface TestUser {
  client: SupabaseClient;
  userId: string;
  email: string;
  householdId: string;
  inviteCode: string;
  householdName: string;
}

/**
 * Provisions a test user with their own household via the create_household
 * RPC. Returns a logged-in supabase-js client scoped to that user so the
 * tests can exercise RLS as the real client would.
 */
export async function provisionTestUser(label: string): Promise<TestUser> {
  const stamp = Date.now().toString(36);
  const slug = `${label}-${stamp}-${Math.random().toString(36).slice(2, 8)}`;
  const email = `${slug}@pantry-rls-tests.local`;
  const password = 'rls-test-password-1234';

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createErr || !created.user) {
    throw new Error(`createUser failed for ${email}: ${createErr?.message ?? 'no user returned'}`);
  }

  const client = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime,
  });
  const { error: signInErr } = await client.auth.signInWithPassword({ email, password });
  if (signInErr) {
    throw new Error(`signIn failed for ${email}: ${signInErr.message}`);
  }

  const householdName = `${label}'s household`;
  const { data: household, error: rpcErr } = await client.rpc('create_household', {
    p_name: householdName,
  });
  if (rpcErr || !household) {
    throw new Error(`create_household failed: ${rpcErr?.message ?? 'no data'}`);
  }

  const { id, invite_code } = household as { id: string; invite_code: string };

  return {
    client,
    userId: created.user.id,
    email,
    householdId: id,
    inviteCode: invite_code,
    householdName,
  };
}

/**
 * Best-effort cleanup. Cascade deletes membership rows but leaves orphaned
 * households / shopping_lists behind (no FK back to auth.users). For
 * routine `supabase db reset` this is fine.
 */
export async function destroyTestUser(user: TestUser): Promise<void> {
  await admin.from('households').delete().eq('id', user.householdId);
  await admin.auth.admin.deleteUser(user.userId);
}
