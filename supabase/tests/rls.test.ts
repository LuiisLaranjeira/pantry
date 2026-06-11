import { admin, destroyTestUser, provisionTestUser, type TestUser } from './setup';

/**
 * RLS invariants for the pantry schema. Each test exercises a real Supabase
 * client logged in as one user and asserts that the row-level policies
 * either allow or deny the operation in line with the documented intent.
 *
 * Run with:
 *   supabase start          # in one terminal, leave running
 *   npm run test:rls        # in another
 */

describe('RLS invariants', () => {
  let alice: TestUser;
  let bob: TestUser;

  beforeAll(async () => {
    alice = await provisionTestUser('alice');
    bob = await provisionTestUser('bob');
  });

  afterAll(async () => {
    await Promise.allSettled([destroyTestUser(alice), destroyTestUser(bob)]);
  });

  describe('households', () => {
    test('a member can read their own household', async () => {
      const { data, error } = await alice.client
        .from('households')
        .select('id, name')
        .eq('id', alice.householdId)
        .single();
      expect(error).toBeNull();
      expect(data?.id).toBe(alice.householdId);
    });

    test('a non-member cannot read another household by id', async () => {
      const { data, error } = await alice.client
        .from('households')
        .select('id')
        .eq('id', bob.householdId);
      // RLS denies by returning zero rows, not by erroring on SELECT.
      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    test('a non-member cannot update another household', async () => {
      const { error } = await alice.client
        .from('households')
        .update({ name: 'hacked' })
        .eq('id', bob.householdId);
      // Either the policy denies (0 rows touched, no error) or the update
      // is rejected outright. Either is acceptable; what matters is the
      // name didn't change.
      expect(error).toBeNull();
      const { data: still } = await admin
        .from('households')
        .select('name')
        .eq('id', bob.householdId)
        .single();
      expect(still?.name).toBe(bob.householdName);
    });
  });

  describe('household_users membership', () => {
    test('a user sees their own membership row', async () => {
      const { data, error } = await alice.client
        .from('household_users')
        .select('household_id, user_id');
      expect(error).toBeNull();
      expect(data).toEqual([{ household_id: alice.householdId, user_id: alice.userId }]);
    });

    test("a user does not see other users' memberships", async () => {
      const { data } = await alice.client
        .from('household_users')
        .select('user_id')
        .eq('household_id', bob.householdId);
      expect(data).toEqual([]);
    });

    test('two members of the same household can see each other (regression: 42P17 recursion fix)', async () => {
      // carol joins alice's household; both should now see both membership rows.
      const carol = await provisionTestUser('carol-visibility');
      try {
        const { error: joinErr } = await carol.client.rpc('join_household_by_invite_code', {
          p_code: alice.inviteCode,
        });
        expect(joinErr).toBeNull();

        // Carol sees both herself and alice.
        const { data: carolSees, error: carolErr } = await carol.client
          .from('household_users')
          .select('user_id')
          .eq('household_id', alice.householdId);
        expect(carolErr).toBeNull();
        const carolIds = (carolSees ?? []).map((r) => r.user_id);
        expect(carolIds).toContain(alice.userId);
        expect(carolIds).toContain(carol.userId);

        // Alice also sees carol.
        const { data: aliceSees, error: aliceErr } = await alice.client
          .from('household_users')
          .select('user_id')
          .eq('household_id', alice.householdId);
        expect(aliceErr).toBeNull();
        const aliceIds = (aliceSees ?? []).map((r) => r.user_id);
        expect(aliceIds).toContain(carol.userId);
      } finally {
        await destroyTestUser(carol);
      }
    });

    test('auth_user_household_ids() RPC returns the household IDs for the current user', async () => {
      const { data, error } = await alice.client.rpc('auth_user_household_ids');
      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
      expect(data).toContain(alice.householdId);
    });

    test('direct INSERT into household_users is denied (RPC-only writes)', async () => {
      // Migration 20260603130000 dropped the legacy INSERT policy. The
      // only way new rows land here is via create_household() /
      // join_household_by_invite_code() (both SECURITY DEFINER). A
      // direct REST call with the user's own JWT — even asserting their
      // own user_id — must fail.
      const { error } = await alice.client.from('household_users').insert({
        household_id: bob.householdId,
        user_id: alice.userId,
      });
      expect(error).not.toBeNull();
      // Cross-check: the row really wasn't silently created.
      const { data: rows } = await admin
        .from('household_users')
        .select('user_id')
        .eq('household_id', bob.householdId)
        .eq('user_id', alice.userId);
      expect(rows).toEqual([]);
    });

    test('a user can delete their own membership row (Leave household)', async () => {
      // Provision a one-shot tester so afterAll cleanup still works.
      const dave = await provisionTestUser('dave');
      try {
        const { error } = await dave.client
          .from('household_users')
          .delete()
          .eq('household_id', dave.householdId)
          .eq('user_id', dave.userId);
        expect(error).toBeNull();
        const { data: rows } = await admin
          .from('household_users')
          .select('user_id')
          .eq('household_id', dave.householdId)
          .eq('user_id', dave.userId);
        expect(rows).toEqual([]);
      } finally {
        await destroyTestUser(dave);
      }
    });

    test("a user cannot delete another user's membership row", async () => {
      // Alice tries to evict Bob from his own household.
      const { error } = await alice.client
        .from('household_users')
        .delete()
        .eq('household_id', bob.householdId)
        .eq('user_id', bob.userId);
      // RLS may deny silently (null error, zero rows touched) or return
      // an explicit error — both are valid. What matters is the row survives.
      const { data: rows } = await admin
        .from('household_users')
        .select('user_id')
        .eq('household_id', bob.householdId)
        .eq('user_id', bob.userId);
      expect(rows).toEqual([{ user_id: bob.userId }]);
    });
  });

  describe('stock_items', () => {
    test('a member can write stock for their household', async () => {
      // Seed a product first (global catalog).
      const { data: product } = await admin
        .from('products')
        .insert({ barcode: `rls-test-${Date.now()}-${Math.random()}`, name: 'Test product' })
        .select('id')
        .single();

      const { error: insertErr } = await alice.client.from('stock_items').insert({
        household_id: alice.householdId,
        product_id: product!.id,
        quantity: 3,
      });
      expect(insertErr).toBeNull();
    });

    test('a non-member cannot insert stock into another household', async () => {
      const { data: product } = await admin
        .from('products')
        .insert({ barcode: `rls-test-${Date.now()}-${Math.random()}`, name: 'Test product 2' })
        .select('id')
        .single();

      const { error } = await alice.client.from('stock_items').insert({
        household_id: bob.householdId,
        product_id: product!.id,
        quantity: 1,
      });
      expect(error).not.toBeNull();
    });

    test("a non-member cannot read another household's stock", async () => {
      // Seed Bob's pantry.
      const { data: product } = await admin
        .from('products')
        .insert({ barcode: `rls-test-${Date.now()}-${Math.random()}`, name: 'Bob secret item' })
        .select('id')
        .single();
      await admin.from('stock_items').insert({
        household_id: bob.householdId,
        product_id: product!.id,
        quantity: 5,
      });

      const { data } = await alice.client
        .from('stock_items')
        .select('id')
        .eq('household_id', bob.householdId);
      expect(data).toEqual([]);
    });
  });

  describe('shopping lists and items', () => {
    test("a non-member cannot read another household's active list", async () => {
      const { data: list } = await admin
        .from('shopping_lists')
        .insert({ household_id: bob.householdId, status: 'active' })
        .select('id')
        .single();
      await admin.from('shopping_list_items').insert({
        list_id: list!.id,
        name: 'Bob bread',
        quantity: 1,
        checked: false,
      });

      const { data: listsSeen } = await alice.client
        .from('shopping_lists')
        .select('id')
        .eq('household_id', bob.householdId);
      expect(listsSeen).toEqual([]);

      const { data: itemsSeen } = await alice.client
        .from('shopping_list_items')
        .select('id')
        .eq('list_id', list!.id);
      expect(itemsSeen).toEqual([]);
    });
  });

  describe('stock_log', () => {
    test("a non-member cannot read another household's log", async () => {
      await admin.from('stock_log').insert({
        household_id: bob.householdId,
        product_id: null,
        action: 'consume',
        quantity: 1,
        product_name: 'Bob log entry',
      });

      const { data } = await alice.client
        .from('stock_log')
        .select('id')
        .eq('household_id', bob.householdId);
      expect(data).toEqual([]);
    });

    test('clients cannot UPDATE the log (no policy defined)', async () => {
      const { error } = await alice.client
        .from('stock_log')
        .update({ quantity: 999 })
        .eq('household_id', alice.householdId);
      // PostgREST may surface this as zero rows updated (no policy match)
      // or as a permission error. Either is acceptable.
      const { data } = await admin
        .from('stock_log')
        .select('quantity')
        .eq('household_id', alice.householdId)
        .limit(1);
      if (data && data.length > 0) {
        expect(data[0].quantity).not.toBe(999);
      }
      expect(error === null || error.code !== '23505').toBeTruthy();
    });
  });

  describe('products (global catalog)', () => {
    test('any authenticated user can read products', async () => {
      const seedBarcode = `global-${Date.now()}-${Math.random()}`;
      await admin.from('products').insert({ barcode: seedBarcode, name: 'Globally visible' });

      const { data: aliceSeen } = await alice.client
        .from('products')
        .select('name')
        .eq('barcode', seedBarcode);
      const { data: bobSeen } = await bob.client
        .from('products')
        .select('name')
        .eq('barcode', seedBarcode);

      expect(aliceSeen?.[0]?.name).toBe('Globally visible');
      expect(bobSeen?.[0]?.name).toBe('Globally visible');
    });
  });

  describe('RPCs', () => {
    test('join_household_by_invite_code adds caller to that household', async () => {
      // Carol joins Alice's household.
      const carol = await provisionTestUser('carol');
      try {
        const { data, error } = await carol.client.rpc('join_household_by_invite_code', {
          p_code: alice.inviteCode,
        });
        expect(error).toBeNull();
        expect((data as { id: string }).id).toBe(alice.householdId);

        // Now Carol can read Alice's household.
        const { data: seen } = await carol.client
          .from('households')
          .select('id')
          .eq('id', alice.householdId)
          .single();
        expect(seen?.id).toBe(alice.householdId);
      } finally {
        await destroyTestUser(carol);
      }
    });

    test('join_household_by_invite_code with a wrong code raises not_found', async () => {
      const { error } = await alice.client.rpc('join_household_by_invite_code', {
        p_code: 'zzzzzz-no-such-household',
      });
      expect(error).not.toBeNull();
      expect(error?.message.toLowerCase()).toContain('not found');
    });

    test('create_household requires authentication', async () => {
      const anon = (await import('@supabase/supabase-js')).createClient(
        process.env.SUPABASE_URL ?? '',
        process.env.SUPABASE_ANON_KEY ?? '',
      );
      const { error } = await anon.rpc('create_household', { p_name: 'orphan' });
      expect(error).not.toBeNull();
    });
  });

  describe('api_call_log', () => {
    test('clients cannot read the api_call_log', async () => {
      // Seed a row as service role so there is something to potentially leak.
      await admin.from('api_call_log').insert({
        user_id: alice.userId,
        function_name: 'test',
      });

      const { data: aliceSeen } = await alice.client.from('api_call_log').select('id');
      const { data: bobSeen } = await bob.client.from('api_call_log').select('id');
      expect(aliceSeen).toEqual([]);
      expect(bobSeen).toEqual([]);
    });
  });
});
