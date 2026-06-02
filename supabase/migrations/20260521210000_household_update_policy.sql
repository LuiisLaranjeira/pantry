drop policy if exists "household members can update their household" on households;

create policy "household members can update their household"
  on households for update
  using (id in (select household_id from household_users where user_id = auth.uid()))
  with check (id in (select household_id from household_users where user_id = auth.uid()));
