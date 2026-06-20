import type { TFunction } from 'i18next';

/**
 * Canonical product category keys. The key (not its label) is what gets stored
 * in products.category, so grouping stays consistent across languages. The
 * order here defines the display/grouping order in the UI.
 */
export const PRODUCT_CATEGORIES = [
  'vegetables',
  'fruits',
  'dairy',
  'plant_based',
  'bakery',
  'meat_seafood',
  'frozen',
  'beverages',
  'pantry',
  'snacks',
  'household',
  'other',
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

const CATEGORY_SET = new Set<string>(PRODUCT_CATEGORIES);

/** True when a stored value is one of our canonical category keys. */
export function isProductCategory(value: string | null | undefined): value is ProductCategory {
  return value != null && CATEGORY_SET.has(value);
}

/**
 * Localized label for a stored category value. Canonical keys resolve to a
 * translation; unknown/legacy free-text values (e.g. from barcode/AI scans
 * that predate this picker) fall back to their raw string so they still show.
 */
export function categoryLabel(value: string | null | undefined, t: TFunction): string {
  if (!value) return t('categories.other');
  if (isProductCategory(value)) return t(`categories.${value}`);
  return value;
}

/**
 * Sort index for a stored category value: canonical order first, then any
 * legacy free-text value, with the absence of a category folded into 'other'.
 */
export function categoryOrder(value: string | null | undefined): number {
  const key = value && isProductCategory(value) ? value : value ? null : 'other';
  if (key === null) return PRODUCT_CATEGORIES.length; // legacy free-text → after canonical
  return PRODUCT_CATEGORIES.indexOf(key);
}
