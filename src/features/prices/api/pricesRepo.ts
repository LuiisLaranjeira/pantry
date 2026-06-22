import { supabase } from '@/shared/api/supabaseClient';
import { mapSupabaseError } from '@/shared/api/errors';
import type { CheapestPrice, StorePriceWithStore } from '@/shared/types/domain';

const PRICE_SELECT =
  'id, store_id, product_id, barcode, price, currency, in_stock, url, scraped_at, store:stores(name, slug, website)';

export const pricesRepo = {
  /** All store prices for a product, joined to the store, cheapest first. */
  async storePricesForProduct(productId: string): Promise<StorePriceWithStore[]> {
    const { data, error } = await supabase
      .from('store_prices')
      .select(PRICE_SELECT)
      .eq('product_id', productId)
      .order('price', { ascending: true });
    if (error) throw mapSupabaseError(error, 'Could not load store prices.');
    return (data as unknown as StorePriceWithStore[]) ?? [];
  },

  /**
   * Cheapest store + price per product, for a batch of product ids. One query
   * fetches every price row for the ids; we reduce to the minimum per product
   * client-side (the set per product is tiny — one row per store).
   */
  async cheapestByProductIds(productIds: string[]): Promise<Record<string, CheapestPrice>> {
    if (productIds.length === 0) return {};
    const { data, error } = await supabase
      .from('store_prices')
      .select('product_id, price, store:stores(name)')
      .in('product_id', productIds);
    if (error) throw mapSupabaseError(error, 'Could not load prices.');

    const rows =
      (data as unknown as {
        product_id: string;
        price: number;
        store: { name: string } | null;
      }[]) ?? [];
    const cheapest: Record<string, CheapestPrice> = {};
    for (const row of rows) {
      if (!row.store) continue;
      const current = cheapest[row.product_id];
      if (!current || row.price < current.price) {
        cheapest[row.product_id] = { store: row.store.name, price: row.price };
      }
    }
    return cheapest;
  },
};
