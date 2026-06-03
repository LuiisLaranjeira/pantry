# RLS test suite

End-to-end tests for the row-level security policies in
`supabase/migrations/`. They spin up real `supabase-js` clients logged in
as two different test users (Alice and Bob) and assert that each user
can only read and write data scoped to their own household.

## Run locally

1. Start a local Supabase stack (applies all migrations):

   ```sh
   supabase start
   ```

   The CLI prints `API URL`, `anon key`, and `service_role key` once
   it's ready. Keep the terminal open.

2. Export those values for the test runner. The harness accepts either
   `SUPABASE_*` (the standard names) or `SUPABASE_TEST_*` (to avoid
   colliding with anything your editor injects):

   ```sh
   export SUPABASE_URL='http://127.0.0.1:54321'
   export SUPABASE_ANON_KEY='eyJ...'
   export SUPABASE_SERVICE_ROLE_KEY='eyJ...'
   ```

3. Run the suite:

   ```sh
   npm run test:rls
   ```

The tests **do not** run against the production Supabase project. The
service role key is required to provision and tear down test users, so
running against prod by accident would be very loud.

## What's covered

- `households` — members can read/update their own; non-members can't
  read or alter.
- `household_users` — users see only their own membership rows.
- `stock_items` — cross-household reads and writes are denied.
- `shopping_lists` / `shopping_list_items` — same.
- `stock_log` — cross-household reads denied; client UPDATE is denied
  by the absence of an UPDATE policy (intentional, see the table
  COMMENT).
- `products` — global catalog, readable by any authenticated user.
- RPCs `create_household` and `join_household_by_invite_code` —
  happy paths and the not-found / not-authenticated branches.
- `api_call_log` — no policies, deny by default for both authed users.

## What's NOT covered (yet)

- Concurrency / race conditions (`first member self-add` policy
  semantics under contention).
- Edge function authentication paths (those live separately and
  need their own integration tests).
- The legacy `users can join households` policy retained for pantry2.

## CI

This suite is not yet wired into the GitHub Actions workflow. Adding it
needs the `supabase/setup-cli` action plus a `supabase start` step
inside the job, which inflates CI time noticeably. Deferred until
Phase 7 sets up the dev/prod environments.
