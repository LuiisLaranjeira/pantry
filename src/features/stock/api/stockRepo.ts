import { supabase } from '@/shared/api/supabaseClient';
import { mapSupabaseError } from '@/shared/api/errors';
import type { StockItem } from '@/shared/types/domain';

const STOCK_SELECT =
  'id, household_id, product_id, quantity, low_stock_threshold, product:products(id, barcode, name, brand, category, package_unit, unit_price, country)';

export type StockLogAction = 'consume' | 'restock' | 'add' | 'remove';

export interface StockLogEntry {
  household_id: string;
  product_id: string;
  stock_item_id?: string | null;
  action: StockLogAction;
  quantity: number;
  product_name: string;
}

export interface StockLogRecord {
  id: string;
  action: StockLogAction;
  quantity: number;
  product_name: string;
  created_at: string;
}

export const stockRepo = {
  async list(householdId: string): Promise<StockItem[]> {
    const { data, error } = await supabase
      .from('stock_items')
      .select(STOCK_SELECT)
      .eq('household_id', householdId)
      .order('created_at', { ascending: true });
    if (error) throw mapSupabaseError(error, 'Could not load pantry.');
    return (data as unknown as StockItem[]) ?? [];
  },

  async getByProductIds(
    householdId: string,
    productIds: string[],
  ): Promise<{ id: string; product_id: string; quantity: number }[]> {
    if (productIds.length === 0) return [];
    const { data, error } = await supabase
      .from('stock_items')
      .select('id, product_id, quantity')
      .eq('household_id', householdId)
      .in('product_id', productIds);
    if (error) throw mapSupabaseError(error, 'Could not load matching stock.');
    return data ?? [];
  },

  async setQuantity(id: string, quantity: number): Promise<void> {
    const { error } = await supabase
      .from('stock_items')
      .update({ quantity, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw mapSupabaseError(error, 'Could not update quantity.');
  },

  async insert(input: {
    household_id: string;
    product_id: string;
    quantity: number;
    low_stock_threshold?: number;
  }): Promise<{ id: string; quantity: number; low_stock_threshold: number }> {
    const { data, error } = await supabase
      .from('stock_items')
      .insert({
        household_id: input.household_id,
        product_id: input.product_id,
        quantity: input.quantity,
        low_stock_threshold: input.low_stock_threshold ?? 1,
      })
      .select('id, quantity, low_stock_threshold')
      .single();
    if (error || !data) throw mapSupabaseError(error, 'Could not add to pantry.');
    return data;
  },

  async insertMany(
    rows: {
      household_id: string;
      product_id: string;
      quantity: number;
      low_stock_threshold?: number;
    }[],
  ): Promise<void> {
    if (rows.length === 0) return;
    const normalized = rows.map((r) => ({
      household_id: r.household_id,
      product_id: r.product_id,
      quantity: r.quantity,
      low_stock_threshold: r.low_stock_threshold ?? 1,
    }));
    const { error } = await supabase.from('stock_items').insert(normalized);
    if (error) throw mapSupabaseError(error, 'Could not add to pantry.');
  },

  async updateThreshold(id: string, threshold: number): Promise<void> {
    const { error } = await supabase
      .from('stock_items')
      .update({ low_stock_threshold: threshold })
      .eq('id', id);
    if (error) throw mapSupabaseError(error, 'Could not update threshold.');
  },

  async updateManyThresholds(ids: string[], threshold: number): Promise<void> {
    if (ids.length === 0) return;
    const { error } = await supabase
      .from('stock_items')
      .update({ low_stock_threshold: threshold })
      .in('id', ids);
    if (error) throw mapSupabaseError(error, 'Could not update threshold.');
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('stock_items').delete().eq('id', id);
    if (error) throw mapSupabaseError(error, 'Could not remove item.');
  },

  async deleteMany(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const { error } = await supabase.from('stock_items').delete().in('id', ids);
    if (error) throw mapSupabaseError(error, 'Could not remove items.');
  },

  async logAction(entry: StockLogEntry): Promise<void> {
    const { error } = await supabase.from('stock_log').insert(entry);
    if (error) throw mapSupabaseError(error, 'Could not write stock log.');
  },

  async logMany(entries: StockLogEntry[]): Promise<void> {
    if (entries.length === 0) return;
    const { error } = await supabase.from('stock_log').insert(entries);
    if (error) throw mapSupabaseError(error, 'Could not write stock log.');
  },

  async recentLog(householdId: string, limit: number): Promise<StockLogRecord[]> {
    const { data, error } = await supabase
      .from('stock_log')
      .select('id, action, quantity, product_name, created_at')
      .eq('household_id', householdId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw mapSupabaseError(error, 'Could not load recent activity.');
    return (data as StockLogRecord[]) ?? [];
  },
};
