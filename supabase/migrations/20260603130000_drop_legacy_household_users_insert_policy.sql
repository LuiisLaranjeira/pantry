-- Drop the legacy household_users INSERT policy that allowed any
-- authenticated user to self-insert into ANY household given its id.
-- Was retained in migration 20260602120000 for pantry2 compatibility,
-- but it's a backdoor around the join_household_by_invite_code RPC:
-- an attacker with the (public, bundled) anon key could POST directly
-- to /rest/v1/household_users and bypass the invite-code check.
--
-- pantry2 callers that go directly through PostgREST will now fail
-- 4xx on household_users.insert. They should switch to the RPC, or
-- pantry2 should be decommissioned (it is the reference prototype,
-- not the production client).
--
-- After this migration the only paths that can insert into
-- household_users are:
--   1. create_household() RPC — adds the caller as first member
--      while creating a new household.
--   2. join_household_by_invite_code() RPC — server-side lookup of
--      the invite code, then add the caller.
-- Both are SECURITY DEFINER, run as the function owner (postgres,
-- which has BYPASSRLS), so they bypass this missing INSERT policy.

drop policy if exists "users can join households" on household_users;

-- ----------------------------------------------------------------------
-- Add the missing DELETE policy on household_users.
--
-- The leave-household flow has been quietly broken: with no DELETE
-- policy, RLS denies all deletes by default. Clients see a successful
-- response with zero rows affected and the local app routes the user
-- to the household setup screen, but the server-side membership row
-- still exists. Re-joining via invite code would then either duplicate
-- the membership or hit the (household_id, user_id) PK constraint.
--
-- Allowing each user to delete their own membership is safe: they can
-- already leave by deleting their account entirely. This just makes
-- the lighter-touch leave path actually work.
-- ----------------------------------------------------------------------

drop policy if exists "users can leave household" on household_users;

create policy "users can leave household"
  on household_users for delete
  using (user_id = auth.uid());

comment on table household_users is
  'Household membership rows. INSERT is controlled exclusively by the '
  'create_household() and join_household_by_invite_code() SECURITY '
  'DEFINER RPCs — no direct INSERT policy exists. DELETE is allowed '
  'for the caller''s own row (Profile → Leave household). UPDATE is '
  'denied by default.';
