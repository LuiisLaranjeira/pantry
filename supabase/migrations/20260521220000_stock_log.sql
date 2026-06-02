create table if not exists stock_log (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid references households(id) on delete cascade not null,
  product_id uuid references products(id) on delete set null,
  stock_item_id uuid references stock_items(id) on delete set null,
  action text not null check (action in ('consume', 'restock', 'add', 'remove')),
  quantity integer not null,
  product_name text not null,
  created_at timestamptz default now()
);

alter table stock_log enable row level security;

drop policy if exists "household members can insert log" on stock_log;
create policy "household members can insert log"
  on stock_log for insert
  with check (household_id in (select household_id from household_users where user_id = auth.uid()));

drop policy if exists "household members can read log" on stock_log;
create policy "household members can read log"
  on stock_log for select
  using (household_id in (select household_id from household_users where user_id = auth.uid()));
