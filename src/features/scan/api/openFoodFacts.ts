import type { PartialProduct } from '@/shared/types/domain';

const BASE = 'https://world.openfoodfacts.org/api/v0/product';

export async function lookupBarcode(
  barcode: string,
  country?: string | null,
): Promise<PartialProduct | null> {
  try {
    const res = await fetch(`${BASE}/${barcode}.json`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 1 || !data.product) return null;
    const p = data.product;

    // generic_name is preferred for grouping (brand-agnostic); fall back to
    // localized then English then any.
    const localName = country ? p[`product_name_${country.toLowerCase()}`] : null;
    const name =
      p.generic_name?.trim() ||
      localName?.trim() ||
      p.product_name_en?.trim() ||
      p.product_name?.trim() ||
      '';
    if (!name) return null;

    return {
      barcode,
      name,
      brand: p.brands?.split(',')[0]?.trim() || null,
      category: p.categories_tags?.[0]?.replace(/^\w+:/, '') || null,
      package_unit: p.quantity?.trim() || null,
      unit_price: null,
      country: country ?? null,
    };
  } catch {
    return null;
  }
}
