-- Multi-store price comparison: per-store prices for catalog products,
-- refreshed weekly by a GitHub Actions cron scraper writing with the
-- service-role key (which bypasses RLS).

create table if not exists stores (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  country text not null default 'PT',
  website text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Latest price per product per store. One row per (store, product); the
-- scraper upserts on that pair, so this always reflects the most recent run.
create table if not exists store_prices (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores(id) on delete cascade not null,
  product_id uuid references products(id) on delete cascade not null,
  barcode text not null,
  price numeric(10,2) not null,
  currency text not null default 'EUR',
  in_stock boolean,
  url text,
  scraped_at timestamptz not null default now(),
  unique (store_id, product_id)
);

create index if not exists store_prices_product_id_idx
  on store_prices (product_id);

-- Lightweight observability: one summary row per store per scrape run.
create table if not exists scrape_runs (
  id bigserial primary key,
  store_id uuid references stores(id) on delete cascade,
  started_at timestamptz,
  finished_at timestamptz,
  products_checked integer,
  prices_written integer,
  errors integer,
  ok boolean
);

-- Reference data: global, not household-scoped. Any authenticated user may
-- read; writes happen only via the service role (scraper), which bypasses RLS.
alter table stores enable row level security;
alter table store_prices enable row level security;
alter table scrape_runs enable row level security;

drop policy if exists "authenticated can read stores" on stores;
create policy "authenticated can read stores"
  on stores for select using (auth.uid() is not null);

drop policy if exists "authenticated can read store prices" on store_prices;
create policy "authenticated can read store prices"
  on store_prices for select using (auth.uid() is not null);

-- scrape_runs has RLS enabled but no policies on purpose -> deny-all for
-- anon/authenticated. Same pattern as api_call_log; written by the service
-- role only.
comment on table scrape_runs is
  'Per-store summary of each weekly scrape run. Written by the service role '
  'from the GitHub Actions scraper. No SELECT/INSERT/UPDATE/DELETE policies on '
  'purpose -- denies all access from authenticated clients.';

-- Seed the initial Portuguese supermarkets.
insert into stores (slug, name, country, website) values
  ('continente', 'Continente', 'PT', 'https://www.continente.pt'),
  ('pingo-doce', 'Pingo Doce', 'PT', 'https://www.pingodoce.pt'),
  ('auchan', 'Auchan', 'PT', 'https://www.auchan.pt')
on conflict (slug) do nothing;
