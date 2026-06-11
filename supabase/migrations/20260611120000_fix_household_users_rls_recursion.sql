-- Fix: infinite recursion in the household_users SELECT policy introduced
-- by migration 20260609120000.
--
-- The policy created there reads:
--   using (household_id in (
--     select household_id from household_users where user_id = auth.uid()
--   ))
-- PostgreSQL evaluates the inner SELECT against the same table, which
-- re-fires the policy, which re-fires the inner SELECT — infinite loop.
-- Error: 42P17 "infinite recursion detected in policy for relation
-- household_users".
--
-- This broke every table whose RLS policy chains through household_users:
-- households, shopping_lists, shopping_list_items, stock_log, stock_items.
--
-- Fix: introduce a SECURITY DEFINER helper that reads household_users with
-- BYPASSRLS. Calling it inside the policy skips the policy check on the
-- inner SELECT, breaking the cycle. All other policies that reference
-- household_users directly are unaffected — they trigger the household_users
-- policy once, which now resolves without recursion.

create or replace function auth_user_household_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select household_id from household_users where user_id = auth.uid();
$$;

revoke all on function auth_user_household_ids() from public;
grant execute on function auth_user_household_ids() to authenticated;

drop policy if exists "members can read household_users" on household_users;

create policy "members can read household_users"
  on household_users for select
  using (
    household_id in (select auth_user_household_ids())
  );
