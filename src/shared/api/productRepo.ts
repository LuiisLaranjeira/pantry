import { supabase } from './supabaseClient';
import { mapSupabaseError } from './errors';
import type { PartialProduct, Product } from '@/shared/types/domain';

const PRODUCT_COLUMNS = 'id, barcode, name, brand, category, package_unit, unit_price, country';

export const productRepo = {
  async byBarcode(barcode: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select(PRODUCT_COLUMNS)
      .eq('barcode', barcode)
      .maybeSingle();
    if (error) throw mapSupabaseError(error, 'Could not look up product.');
    return (data as Product | null) ?? null;
  },

  async upsert(product: PartialProduct): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .upsert(product, { onConflict: 'barcode' })
      .select(PRODUCT_COLUMNS)
      .single();
    if (error || !data) throw mapSupabaseError(error, 'Could not save product.');
    return data as Product;
  },

  async upsertMany(products: PartialProduct[]): Promise<Pick<Product, 'id' | 'barcode'>[]> {
    if (products.length === 0) return [];
    const { data, error } = await supabase
      .from('products')
      .upsert(products, { onConflict: 'barcode' })
      .select('id, barcode');
    if (error) throw mapSupabaseError(error, 'Could not save products.');
    return data ?? [];
  },

  async updatePrice(id: string, unitPrice: number): Promise<void> {
    const { error } = await supabase
      .from('products')
      .update({ unit_price: unitPrice })
      .eq('id', id);
    if (error) throw mapSupabaseError(error, 'Could not update product price.');
  },
};
