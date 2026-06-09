-- Fix: household members can see all other members of their own household,
-- not just their own row. The old policy (user_id = auth.uid()) meant only
-- the caller's membership row was visible, making member listings empty.

drop policy if exists "members can read household_users" on household_users;

create policy "members can read household_users"
  on household_users for select
  using (
    household_id in (
      select household_id from household_users where user_id = auth.uid()
    )
  );
