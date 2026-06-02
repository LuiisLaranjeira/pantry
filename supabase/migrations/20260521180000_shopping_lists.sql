create table if not exists shopping_lists (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade not null,
  status text not null default 'active' check (status in ('active', 'completed')),
  total_spent numeric(10,2),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid references shopping_lists(id) on delete cascade not null,
  product_id uuid references products(id) on delete set null,
  name text not null,
  quantity integer not null default 1,
  unit_price numeric(10,2),
  checked boolean not null default false,
  created_at timestamptz not null default now()
);

-- Add unit_price if the table already existed without it
alter table shopping_list_items add column if not exists unit_price numeric(10,2);

alter table shopping_lists enable row level security;
alter table shopping_list_items enable row level security;

drop policy if exists "household members can manage shopping lists" on shopping_lists;
create policy "household members can manage shopping lists"
  on shopping_lists for all
  using (household_id in (
    select household_id from household_users where user_id = auth.uid()
  ))
  with check (household_id in (
    select household_id from household_users where user_id = auth.uid()
  ));

drop policy if exists "household members can manage shopping list items" on shopping_list_items;
create policy "household members can manage shopping list items"
  on shopping_list_items for all
  using (list_id in (
    select id from shopping_lists
    where household_id in (
      select household_id from household_users where user_id = auth.uid()
    )
  ))
  with check (list_id in (
    select id from shopping_lists
    where household_id in (
      select household_id from household_users where user_id = auth.uid()
    )
  ));
