create extension if not exists "uuid-ossp";

create table households (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  invite_code text not null unique default substring(md5(random()::text), 1, 6),
  created_at timestamptz default now()
);

create table household_users (
  household_id uuid references households(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  primary key (household_id, user_id)
);

create table products (
  id uuid primary key default uuid_generate_v4(),
  barcode text unique not null,
  name text not null,
  brand text,
  category text,
  package_unit text,
  unit_price numeric(10,2),
  created_at timestamptz default now()
);

create table stock_items (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid references households(id) on delete cascade not null,
  product_id uuid references products(id) not null,
  quantity integer not null default 0,
  low_stock_threshold integer not null default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(household_id, product_id)
);

-- Row Level Security
alter table households enable row level security;
alter table household_users enable row level security;
alter table products enable row level security;
alter table stock_items enable row level security;

create policy "household members can read"
  on households for select
  using (id in (select household_id from household_users where user_id = auth.uid()));

create policy "users can create households"
  on households for insert with check (true);

create policy "household members can update their household"
  on households for update
  using (id in (select household_id from household_users where user_id = auth.uid()))
  with check (id in (select household_id from household_users where user_id = auth.uid()));

create policy "members can read household_users"
  on household_users for select
  using (user_id = auth.uid());

create policy "users can join households"
  on household_users for insert
  with check (user_id = auth.uid());

create policy "authenticated can read products"
  on products for select using (auth.uid() is not null);

create policy "authenticated can insert products"
  on products for insert with check (auth.uid() is not null);

create policy "authenticated can update products"
  on products for update using (auth.uid() is not null);

-- Migration: link shopping list items to products
-- ALTER TABLE shopping_list_items ADD COLUMN product_id uuid references products(id);

create policy "household members can read stock"
  on stock_items for select
  using (household_id in (
    select household_id from household_users where user_id = auth.uid()
  ));

create policy "household members can insert stock"
  on stock_items for insert
  with check (household_id in (
    select household_id from household_users where user_id = auth.uid()
  ));

create policy "household members can update stock"
  on stock_items for update
  using (household_id in (
    select household_id from household_users where user_id = auth.uid()
  ));

create policy "household members can delete stock"
  on stock_items for delete
  using (household_id in (
    select household_id from household_users where user_id = auth.uid()
  ));

create table stock_log (
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

create policy "household members can insert log"
  on stock_log for insert
  with check (household_id in (select household_id from household_users where user_id = auth.uid()));

create policy "household members can read log"
  on stock_log for select
  using (household_id in (select household_id from household_users where user_id = auth.uid()));
