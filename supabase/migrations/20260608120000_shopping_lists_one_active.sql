-- Enforce at most one active shopping list per household. The partial
-- index makes a concurrent duplicate INSERT fail with 23505 rather than
-- silently creating a second active list whose items become unreachable.
CREATE UNIQUE INDEX shopping_lists_one_active_per_household
  ON shopping_lists (household_id)
  WHERE status = 'active';
