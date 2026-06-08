-- Enable Supabase Realtime for shopping tables so household members see
-- each other's changes without polling. The DO block is idempotent —
-- it only adds tables not already in the publication.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = 'shopping_list_items'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE shopping_list_items;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = 'shopping_lists'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE shopping_lists;
    END IF;
  END IF;
END $$;
