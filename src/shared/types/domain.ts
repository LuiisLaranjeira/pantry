export interface Product {
  id: string;
  barcode: string;
  name: string;
  brand: string | null;
  category: string | null;
  package_unit: string | null;
  unit_price: number | null;
  country: string | null;
}

export type PartialProduct = Omit<Product, 'id'>;

export const EMPTY_PRODUCT: PartialProduct = {
  barcode: '',
  name: '',
  brand: null,
  category: null,
  package_unit: null,
  unit_price: null,
  country: null,
};

export interface StockItem {
  id: string;
  household_id: string;
  product_id: string;
  quantity: number;
  low_stock_threshold: number;
  product: Product;
}

export interface GroupedStockItem {
  key: string;
  name: string;
  package_unit: string | null;
  category: string | null;
  quantity: number;
  low_stock_threshold: number;
  members: StockItem[];
}

export interface ShoppingList {
  id: string;
  household_id: string;
  status: 'active' | 'completed';
  name: string | null;
  total_spent: number | null;
  created_at: string;
  completed_at: string | null;
}

export interface ShoppingListItem {
  id: string;
  list_id: string;
  product_id: string | null;
  name: string;
  quantity: number;
  unit_price: number | null;
  checked: boolean;
  product?: { brand: string | null; package_unit: string | null; category: string | null } | null;
}

export interface Store {
  id: string;
  slug: string;
  name: string;
  country: string;
  website: string | null;
  active: boolean;
}

export interface StorePrice {
  id: string;
  store_id: string;
  product_id: string;
  barcode: string;
  price: number;
  currency: string;
  in_stock: boolean | null;
  url: string | null;
  scraped_at: string;
}

/** A store price joined to its store, as returned by the comparison query. */
export interface StorePriceWithStore extends StorePrice {
  store: Pick<Store, 'name' | 'slug' | 'website'>;
}

/** The cheapest store + price for a product, used by shopping-list badges. */
export interface CheapestPrice {
  store: string;
  price: number;
}
