-- Append-only log used by edge functions for per-user rate limiting.
-- Written by SECURITY DEFINER / service-role code paths only. No client
-- access — RLS is enabled but no policies are defined, which means deny
-- by default for `anon` and `authenticated` roles.

create table if not exists api_call_log (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  function_name text not null,
  called_at timestamptz not null default now()
);

create index if not exists api_call_log_user_fn_time_idx
  on api_call_log (user_id, function_name, called_at desc);

alter table api_call_log enable row level security;

comment on table api_call_log is
  'Append-only log of edge function calls used for per-user rate limits. '
  'Written by the service role from inside Supabase Edge Functions. '
  'No SELECT/INSERT/UPDATE/DELETE policies on purpose — denies all '
  'access from authenticated clients.';
