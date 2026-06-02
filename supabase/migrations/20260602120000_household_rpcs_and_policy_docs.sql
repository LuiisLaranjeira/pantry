-- Phase 6 hardening: introduce SECURITY DEFINER RPCs for household creation
-- and invite-code joins so client code doesn't reach directly into
-- household_users with self-asserted IDs. Document the intent of existing
-- permissive policies that are kept for compatibility with the pantry2
-- reference prototype.

-- Atomic household creation: creates the row AND the creator's membership
-- in a single transaction so a stray second client can't race in between
-- the two inserts. Returns the new household so the client doesn't need
-- a follow-up SELECT.
create or replace function create_household(p_name text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid := gen_random_uuid();
  trimmed_name text := nullif(trim(p_name), '');
  new_code text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if trimmed_name is null then
    raise exception 'name required' using errcode = '22023';
  end if;

  insert into households (id, name)
  values (new_id, trimmed_name)
  returning invite_code into new_code;

  insert into household_users (household_id, user_id)
  values (new_id, auth.uid());

  return jsonb_build_object(
    'id', new_id,
    'name', trimmed_name,
    'invite_code', new_code
  );
end;
$$;

revoke all on function create_household(text) from public;
grant execute on function create_household(text) to authenticated;

-- Invite-code join: look up the household server-side, then add the caller
-- as a member. Idempotent: re-calling for an already-joined household is a
-- no-op that still returns the household details. Code lookup is
-- case-insensitive and trimmed.
create or replace function join_household_by_invite_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  trimmed_code text := nullif(trim(p_code), '');
  found_id uuid;
  found_name text;
  found_code text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if trimmed_code is null then
    raise exception 'invite code required' using errcode = '22023';
  end if;

  select h.id, h.name, h.invite_code
    into found_id, found_name, found_code
  from households h
  where lower(h.invite_code) = lower(trimmed_code);

  if found_id is null then
    raise exception 'household not found' using errcode = 'P0002';
  end if;

  if not exists (
    select 1 from household_users
    where household_id = found_id and user_id = auth.uid()
  ) then
    insert into household_users (household_id, user_id)
    values (found_id, auth.uid());
  end if;

  return jsonb_build_object(
    'id', found_id,
    'name', found_name,
    'invite_code', found_code
  );
end;
$$;

revoke all on function join_household_by_invite_code(text) from public;
grant execute on function join_household_by_invite_code(text) to authenticated;

-- ----------------------------------------------------------------------
-- Audit comments: document the intent of existing permissive policies so
-- the next reviewer knows what's load-bearing and what's a deferred fix.
-- ----------------------------------------------------------------------

comment on table stock_log is
  'Immutable audit log of stock changes. No UPDATE or DELETE policy is '
  'defined on purpose — RLS denies by default, so writes are append-only. '
  'Rows are removed only via cascade when their household or stock_item is '
  'deleted.';

comment on table products is
  'Global product catalog shared across all households. Any authenticated '
  'user can read, insert, and update entries. Per-household scoping was '
  'considered but rejected: barcodes are universal and the catalog acts '
  'as an OpenFoodFacts cache. Trade-off: a malicious user can deface '
  'shared entries. Mitigation if this becomes an issue is to gate updates '
  'behind an RPC and accept only specific columns (e.g. unit_price).';

comment on policy "users can create households" on households is
  'Any authenticated user may insert a household. Rate limiting is not '
  'enforced server-side; clients are expected to call create_household() '
  'which can layer in a per-user cap if abuse appears.';

comment on policy "users can join households" on household_users is
  'LEGACY: allows any authenticated user to self-insert into ANY household '
  'given its id. Retained for the pantry2 reference prototype which inserts '
  'directly. The pantry-prod client uses join_household_by_invite_code() '
  'instead, which requires knowing the invite code. Drop this policy once '
  'pantry2 is decommissioned.';
