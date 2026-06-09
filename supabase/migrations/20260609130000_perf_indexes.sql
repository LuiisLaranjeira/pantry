-- Performance: add indexes that back the RLS subquery pattern
-- (select household_id from household_users where user_id = auth.uid())
-- which runs on every protected query in the app.

create index if not exists household_users_user_id_idx
  on household_users (user_id);

create index if not exists stock_log_household_id_idx
  on stock_log (household_id);

create index if not exists receipt_scan_logs_user_id_idx
  on receipt_scan_logs (user_id);

create index if not exists shopping_list_items_list_id_idx
  on shopping_list_items (list_id);
