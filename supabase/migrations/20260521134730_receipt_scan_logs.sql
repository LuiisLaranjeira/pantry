create table receipt_scan_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  mode text not null check (mode in ('text', 'image')),
  store text,
  items_count integer not null default 0,
  items jsonb,
  ocr_text text,
  success boolean not null,
  error_message text,
  created_at timestamptz not null default now()
);

alter table receipt_scan_logs enable row level security;

create policy "users can view own scan logs"
  on receipt_scan_logs for select
  using (auth.uid() = user_id);