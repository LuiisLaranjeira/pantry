-- Phase 8: backend helper for the account-deletion flow.
--
-- The delete-account edge function deletes the auth.users row (which
-- cascades through household_users), but leaves households the user
-- was the only member of untouched. This RPC sweeps them up in a
-- single transaction before the user row is deleted.
--
-- Granted to service_role only — the edge function reaches it via the
-- service role key. Not callable by authenticated clients.

create or replace function delete_orphan_households_for_user(target_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer := 0;
  hh_record record;
begin
  if target_user_id is null then
    raise exception 'target_user_id required' using errcode = '22023';
  end if;

  for hh_record in
    select hu.household_id
    from household_users hu
    where hu.user_id = target_user_id
  loop
    if (
      select count(*)
      from household_users
      where household_id = hh_record.household_id
    ) = 1 then
      delete from households where id = hh_record.household_id;
      deleted_count := deleted_count + 1;
    end if;
  end loop;

  return deleted_count;
end;
$$;

revoke all on function delete_orphan_households_for_user(uuid) from public;
revoke all on function delete_orphan_households_for_user(uuid) from anon;
revoke all on function delete_orphan_households_for_user(uuid) from authenticated;
grant execute on function delete_orphan_households_for_user(uuid) to service_role;

comment on function delete_orphan_households_for_user(uuid) is
  'Deletes households where the given user is the sole member. Used by the '
  'delete-account edge function before deleting the auth.users row. Service '
  'role only — never callable from a client.';
